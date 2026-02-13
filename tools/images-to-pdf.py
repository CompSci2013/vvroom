#!/usr/bin/env python3
"""
Generate a PDF from a directory of images with smart sizing.

Features:
- Shrinks images by up to 20% if they can fit on one page
- Splits taller images across multiple pages cleanly
- Maintains aspect ratio
- Handles various image formats (PNG, JPG, JPEG, GIF, BMP, WEBP)
- Sorts images by filename

Usage:
    python images-to-pdf.py <image_directory> [output.pdf]
    python images-to-pdf.py ./screenshots                    # Creates screenshots.pdf
    python images-to-pdf.py ./screenshots my-report.pdf      # Creates my-report.pdf
"""

import sys
import os
from pathlib import Path
from PIL import Image
from io import BytesIO

try:
    from reportlab.lib.pagesizes import LETTER
    from reportlab.lib.units import inch
    from reportlab.pdfgen import canvas
    from reportlab.lib.utils import ImageReader
except ImportError:
    print("Error: reportlab is required. Install with:")
    print("  pip install reportlab")
    sys.exit(1)


# Page dimensions (Letter size with margins)
PAGE_WIDTH, PAGE_HEIGHT = LETTER
MARGIN = 0.5 * inch
USABLE_WIDTH = PAGE_WIDTH - (2 * MARGIN)
USABLE_HEIGHT = PAGE_HEIGHT - (2 * MARGIN)

# Spacing between images on the same page
IMAGE_SPACING = 0.25 * inch

# Supported image extensions
IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.tiff', '.tif'}


def get_image_files(directory: Path) -> list[Path]:
    """Get all image files from directory, sorted by name."""
    files = []
    for f in directory.iterdir():
        if f.is_file() and f.suffix.lower() in IMAGE_EXTENSIONS:
            files.append(f)
    return sorted(files, key=lambda x: x.name.lower())


def calculate_scaled_dimensions(img_width: int, img_height: int, max_width: float, max_height: float | None = None) -> tuple[float, float]:
    """
    Scale image to fit within max dimensions while maintaining aspect ratio.
    If max_height is None, only constrain by width.
    """
    # Scale to fit width
    scale = max_width / img_width
    scaled_width = max_width
    scaled_height = img_height * scale

    # If height constraint exists and we exceed it, scale down further
    if max_height is not None and scaled_height > max_height:
        scale = max_height / img_height
        scaled_height = max_height
        scaled_width = img_width * scale

    return scaled_width, scaled_height


def can_fit_with_shrink(img_width: int, img_height: int, shrink_factor: float = 0.8) -> tuple[bool, float, float]:
    """
    Check if image can fit on one page with up to 20% shrink (shrink_factor=0.8).
    Returns (can_fit, scaled_width, scaled_height).
    """
    # First scale to fit the usable width
    scaled_width, scaled_height = calculate_scaled_dimensions(
        img_width, img_height, USABLE_WIDTH
    )

    # If it fits at full size, great
    if scaled_height <= USABLE_HEIGHT:
        return True, scaled_width, scaled_height

    # Try shrinking up to 20%
    min_scale = shrink_factor
    required_scale = USABLE_HEIGHT / scaled_height

    if required_scale >= min_scale:
        # We can fit it with acceptable shrinking
        final_width = scaled_width * required_scale
        final_height = USABLE_HEIGHT
        return True, final_width, final_height

    return False, scaled_width, scaled_height


def create_pdf(image_dir: Path, output_path: Path):
    """Create PDF from images in directory."""
    image_files = get_image_files(image_dir)

    if not image_files:
        print(f"No image files found in {image_dir}")
        sys.exit(1)

    print(f"Found {len(image_files)} images")

    c = canvas.Canvas(str(output_path), pagesize=LETTER)

    for i, img_path in enumerate(image_files):
        print(f"  [{i+1}/{len(image_files)}] Processing: {img_path.name}")

        try:
            with Image.open(img_path) as img:
                # Convert to RGB if necessary (for PNG with transparency, etc.)
                if img.mode in ('RGBA', 'LA', 'P'):
                    # Create white background
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')

                img_width, img_height = img.size

                # Check if image can fit on one page (with up to 20% shrink)
                can_fit, scaled_width, scaled_height = can_fit_with_shrink(img_width, img_height)

                if can_fit:
                    # Image fits on one page
                    x = MARGIN + (USABLE_WIDTH - scaled_width) / 2  # Center horizontally
                    y = PAGE_HEIGHT - MARGIN - scaled_height  # Top of usable area

                    # Save image to bytes for ReportLab
                    img_buffer = BytesIO()
                    img.save(img_buffer, format='PNG')
                    img_buffer.seek(0)

                    c.drawImage(ImageReader(img_buffer), x, y,
                               width=scaled_width, height=scaled_height)
                    c.showPage()

                else:
                    # Image needs to span multiple pages
                    # Scale to fit width only
                    scaled_width, scaled_height = calculate_scaled_dimensions(
                        img_width, img_height, USABLE_WIDTH
                    )

                    # Calculate how many pages we need
                    total_pages = int((scaled_height + USABLE_HEIGHT - 1) // USABLE_HEIGHT)

                    # We need to crop the original image into sections
                    # Work backwards from scaled dimensions to original crop regions
                    scale_factor = scaled_width / img_width

                    remaining_height = scaled_height
                    crop_y_start = 0  # In original image coordinates

                    page_num = 0
                    while remaining_height > 0:
                        page_num += 1
                        # How much scaled height to show on this page
                        this_page_height = min(remaining_height, USABLE_HEIGHT)

                        # Convert back to original image coordinates for cropping
                        crop_height_original = this_page_height / scale_factor
                        crop_y_end = min(crop_y_start + crop_height_original, img_height)

                        # Crop the section
                        cropped = img.crop((0, int(crop_y_start), img_width, int(crop_y_end)))

                        # Save cropped section to bytes
                        img_buffer = BytesIO()
                        cropped.save(img_buffer, format='PNG')
                        img_buffer.seek(0)

                        # Calculate position - center horizontally, start from top
                        x = MARGIN + (USABLE_WIDTH - scaled_width) / 2
                        actual_height = (crop_y_end - crop_y_start) * scale_factor
                        y = PAGE_HEIGHT - MARGIN - actual_height

                        c.drawImage(ImageReader(img_buffer), x, y,
                                   width=scaled_width, height=actual_height)

                        # Add page indicator for split images
                        if total_pages > 1:
                            c.setFont("Helvetica", 8)
                            c.setFillColorRGB(0.5, 0.5, 0.5)
                            indicator = f"{img_path.name} ({page_num}/{total_pages})"
                            c.drawRightString(PAGE_WIDTH - MARGIN, MARGIN / 2, indicator)

                        c.showPage()

                        crop_y_start = crop_y_end
                        remaining_height -= this_page_height

                    print(f"    → Split across {total_pages} pages")

        except Exception as e:
            print(f"  Error processing {img_path.name}: {e}")
            continue

    c.save()
    print(f"\nCreated: {output_path}")
    print(f"Total pages: {c.getPageNumber()}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    image_dir = Path(sys.argv[1]).resolve()

    if not image_dir.is_dir():
        print(f"Error: {image_dir} is not a directory")
        sys.exit(1)

    # Determine output filename
    if len(sys.argv) >= 3:
        output_path = Path(sys.argv[2]).resolve()
    else:
        output_path = image_dir.parent / f"{image_dir.name}.pdf"

    # Ensure output has .pdf extension
    if output_path.suffix.lower() != '.pdf':
        output_path = output_path.with_suffix('.pdf')

    print(f"Input directory: {image_dir}")
    print(f"Output file: {output_path}")
    print()

    create_pdf(image_dir, output_path)


if __name__ == '__main__':
    main()
