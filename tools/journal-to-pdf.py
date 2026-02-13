#!/usr/bin/env python3
"""
Generate a PDF test report from a quality journal and test screenshots.

Parses the journal markdown file, extracts test entries with their associated
screenshots, and creates an interleaved PDF document showing journal text
followed by the corresponding screenshot images.

Features:
- Parses markdown journal entries with timestamps
- Matches screenshot references in journal text
- Interleaves text blocks with images
- Smart image sizing (shrink up to 20% to fit, otherwise split across pages)
- Professional formatting with headers and test groupings

Usage:
    python journal-to-pdf.py <journal.md> <screenshots_dir> [output.pdf]
    python journal-to-pdf.py quality-journal.md ../e2e/screenshots TEST-PLAN.pdf
"""

import sys
import re
from pathlib import Path
from PIL import Image
from io import BytesIO
from dataclasses import dataclass, field

try:
    from reportlab.lib.pagesizes import LETTER
    from reportlab.lib.units import inch
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_LEFT, TA_CENTER
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Image as RLImage,
        PageBreak, KeepTogether, Table, TableStyle
    )
    from reportlab.lib import colors
    from reportlab.lib.utils import ImageReader
    from reportlab.pdfgen import canvas
except ImportError:
    print("Error: reportlab is required. Install with:")
    print("  pip install reportlab")
    sys.exit(1)


# Page dimensions
PAGE_WIDTH, PAGE_HEIGHT = LETTER
MARGIN = 0.5 * inch
USABLE_WIDTH = PAGE_WIDTH - (2 * MARGIN)
USABLE_HEIGHT = PAGE_HEIGHT - (2 * MARGIN)

# Supported image extensions
IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'}


@dataclass
class JournalEntry:
    """Represents a single journal entry with timestamp and content."""
    timestamp: str
    content: str
    screenshots: list[str] = field(default_factory=list)
    is_header: bool = False
    is_category_complete: bool = False


def find_screenshots_in_text(text: str, screenshots_dir: Path) -> list[str]:
    """Find all screenshot references in text that exist in the screenshots directory."""
    found = []

    # Pattern 1: Explicit "Screenshot: filename.png"
    explicit_matches = re.findall(r'Screenshot:\s*(\S+\.png)', text, re.IGNORECASE)
    found.extend(explicit_matches)

    # Pattern 2: Any .png filename mentioned
    png_matches = re.findall(r'([a-zA-Z0-9_-]+\.png)', text)
    for match in png_matches:
        if match not in found:
            found.append(match)

    # Verify files exist
    verified = []
    for filename in found:
        if (screenshots_dir / filename).exists():
            verified.append(filename)

    return verified


def infer_screenshots_for_test(test_id: str, test_text: str, screenshots_dir: Path) -> list[str]:
    """Infer likely screenshots for a test based on test ID and content."""
    inferred = []
    available = {f.name for f in screenshots_dir.iterdir() if f.suffix.lower() == '.png'}

    # Map test IDs to screenshot patterns
    patterns = {
        'V1.1.1': ['results-table-default.png'],
        'V1.1.2': ['filter-panel-default.png'],
        'V1.1.3': ['pagination-default.png'],
        'V1.1.4': ['statistics-default.png'],
        'V1.1.5': ['search-default.png'],
        'V1.2.1': ['results-table-filtered-ford.png'],
        'V1.2.2': ['results-table-filtered-suv.png'],
        'V1.2.3': ['results-table-filtered-recent.png'],
        'V1.2.4': ['statistics-filtered-chevrolet.png'],
        'V1.2.5': ['results-table-model-combos.png'],
        'V1.3.1': ['statistics-highlight-tesla.png'],
        'V1.3.2': ['statistics-highlight-years.png'],
        'V1.3.3': ['statistics-highlight-pickup.png'],
        'V1.3.4': ['statistics-filter-with-highlight.png'],
        'V1.4.1': ['results-table-sorted-year-desc.png'],
        'V1.4.2': ['results-table-sorted-manufacturer-asc.png'],
        'V1.4.3': ['results-table-sorted-instancecount-desc.png'],
        'V1.5.1': ['results-table-paginated-page2.png'],
        'V1.5.2': ['pagination-page5.png'],
        'V1.5.3': ['results-table-last-page.png'],
        'U2.1.1': ['url-state-manufacturer-ford.png'],
        'U2.1.2': ['url-state-year-range.png'],
        'U2.1.3': ['url-state-bodyclass-pickup.png'],
        'U2.1.4': ['url-state-pagination.png'],
        'U2.1.5': ['url-state-sort-year-desc.png'],
        'U2.1.6': ['url-state-highlight-tesla.png'],
        'U2.1.7': ['url-state-filter-plus-highlight.png'],
        'U2.1.8': ['url-state-model-combos.png'],
        'U2.2.1': ['state-url-manufacturer-dodge.png'],
        'U2.2.2': ['state-url-year-range.png'],
        'U2.2.3': ['state-url-bodyclass-suv.png'],
        'U2.2.4': ['state-url-page4.png'],
        'U2.2.5': ['state-url-size50.png'],
        'U2.2.6': ['state-url-sort-year.png'],
        'U2.2.9': ['state-url-cleared.png'],
        'U2.3.1': ['combined-filters-ford-coupe-recent.png'],
        'U2.3.2': ['combined-filter-sort-page.png'],
        'U2.3.3': ['combined-filter-highlight.png'],
    }

    if test_id in patterns:
        for p in patterns[test_id]:
            if p in available:
                inferred.append(p)

    return inferred


def parse_journal(journal_path: Path, screenshots_dir: Path) -> list[JournalEntry]:
    """Parse the journal file and extract entries with their screenshots."""
    content = journal_path.read_text()
    entries = []

    # Split into sections by timestamp pattern
    # Pattern: YYYY-MM-DD_HH:MM:SS at start of line
    timestamp_pattern = r'^(\d{4}-\d{2}-\d{2}_\d{2}:\d{2}:\d{2})\s*$'

    lines = content.split('\n')
    current_entry = None
    current_content = []
    in_action_log = False

    for i, line in enumerate(lines):
        # Track when we enter the Action Log section
        if '## Action Log' in line:
            in_action_log = True
            continue

        if not in_action_log:
            continue

        timestamp_match = re.match(timestamp_pattern, line.strip())

        if timestamp_match:
            # Save previous entry if exists
            if current_entry:
                content_text = '\n'.join(current_content).strip()
                current_entry.content = content_text
                current_entry.screenshots = find_screenshots_in_text(content_text, screenshots_dir)

                # Check for category completion markers
                if '=== CATEGORY' in content_text and 'COMPLETE ===' in content_text:
                    current_entry.is_category_complete = True

                # Infer screenshots for tests mentioned
                test_ids = re.findall(r'\b([VUP][\d.]+)\b', content_text)
                for test_id in test_ids:
                    inferred = infer_screenshots_for_test(test_id, content_text, screenshots_dir)
                    for s in inferred:
                        if s not in current_entry.screenshots:
                            current_entry.screenshots.append(s)

                entries.append(current_entry)

            # Start new entry
            current_entry = JournalEntry(timestamp=timestamp_match.group(1), content='')
            current_content = []
        elif current_entry:
            current_content.append(line)

    # Don't forget the last entry
    if current_entry:
        content_text = '\n'.join(current_content).strip()
        current_entry.content = content_text
        current_entry.screenshots = find_screenshots_in_text(content_text, screenshots_dir)

        if '=== CATEGORY' in content_text or '=== ALL CATEGORIES' in content_text:
            current_entry.is_category_complete = True

        test_ids = re.findall(r'\b([VUP][\d.]+)\b', content_text)
        for test_id in test_ids:
            inferred = infer_screenshots_for_test(test_id, content_text, screenshots_dir)
            for s in inferred:
                if s not in current_entry.screenshots:
                    current_entry.screenshots.append(s)

        entries.append(current_entry)

    return entries


def create_image_flowable(img_path: Path, max_width: float, max_height: float):
    """Create a ReportLab Image flowable that fits within constraints."""
    with Image.open(img_path) as img:
        img_width, img_height = img.size

        # Calculate scale to fit width
        scale = min(max_width / img_width, max_height / img_height)

        # Allow up to 20% shrink beyond width-fit to avoid splitting
        width_scale = max_width / img_width
        scaled_height_at_width = img_height * width_scale

        if scaled_height_at_width <= max_height * 1.25:  # Can fit with up to 20% shrink
            final_scale = min(width_scale, max_height / img_height)
        else:
            final_scale = width_scale

        final_width = img_width * final_scale
        final_height = img_height * final_scale

        return RLImage(str(img_path), width=final_width, height=final_height)


def create_pdf(entries: list[JournalEntry], screenshots_dir: Path, output_path: Path, title: str):
    """Create the PDF report."""
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=LETTER,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=MARGIN
    )

    # Styles
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=20,
        alignment=TA_CENTER
    )

    timestamp_style = ParagraphStyle(
        'Timestamp',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.darkblue,
        spaceBefore=15,
        spaceAfter=5,
        fontName='Helvetica-Bold'
    )

    content_style = ParagraphStyle(
        'Content',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=10,
        leading=14
    )

    category_style = ParagraphStyle(
        'Category',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.darkgreen,
        spaceBefore=20,
        spaceAfter=10,
        fontName='Helvetica-Bold'
    )

    image_caption_style = ParagraphStyle(
        'ImageCaption',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.gray,
        alignment=TA_CENTER,
        spaceBefore=5,
        spaceAfter=15
    )

    # Build document content
    story = []

    # Title page
    story.append(Spacer(1, 2*inch))
    story.append(Paragraph(title, title_style))
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph("VVroom Application Test Report", styles['Heading2']))
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph(f"Generated from: {screenshots_dir.parent.name}/quality-journal.md", content_style))
    story.append(Paragraph(f"Screenshots: {len(list(screenshots_dir.glob('*.png')))} images", content_style))
    story.append(Paragraph(f"Journal entries: {len(entries)}", content_style))
    story.append(PageBreak())

    # Process each entry
    images_included = set()

    for entry in entries:
        # Timestamp header
        story.append(Paragraph(f"📅 {entry.timestamp}", timestamp_style))

        # Content - escape special characters for ReportLab
        content_escaped = (entry.content
            .replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
            .replace('\n', '<br/>')
        )

        # Highlight test IDs
        content_escaped = re.sub(
            r'\b([VUP][\d.]+)\b',
            r'<b>\1</b>',
            content_escaped
        )

        # Highlight PASS/FAIL
        content_escaped = content_escaped.replace('PASS', '<font color="green"><b>PASS</b></font>')
        content_escaped = content_escaped.replace('FAIL', '<font color="red"><b>FAIL</b></font>')

        # Category completion styling
        if entry.is_category_complete:
            story.append(Paragraph(content_escaped, category_style))
        else:
            story.append(Paragraph(content_escaped, content_style))

        # Add screenshots for this entry
        for screenshot in entry.screenshots:
            if screenshot in images_included:
                continue  # Don't duplicate images

            img_path = screenshots_dir / screenshot
            if not img_path.exists():
                continue

            images_included.add(screenshot)

            try:
                # Calculate available space (leave room for caption)
                available_height = USABLE_HEIGHT - 1*inch

                with Image.open(img_path) as img:
                    img_width, img_height = img.size

                    # Scale to fit width
                    scale = USABLE_WIDTH / img_width
                    scaled_height = img_height * scale

                    # Check if we can fit with up to 20% shrink
                    if scaled_height <= available_height * 1.25:
                        # Fit on one page
                        final_scale = min(scale, available_height / img_height)
                        final_width = img_width * final_scale
                        final_height = img_height * final_scale

                        img_flowable = RLImage(str(img_path), width=final_width, height=final_height)
                        story.append(img_flowable)
                        story.append(Paragraph(f"Screenshot: {screenshot}", image_caption_style))
                    else:
                        # Image is too tall - need to split across pages
                        # For simplicity with flowables, we'll just scale to fit and note it's reduced
                        final_height = available_height
                        final_scale = final_height / img_height
                        final_width = img_width * final_scale

                        # If image is much taller, we may need to use the page-splitting approach
                        if scaled_height > available_height * 2:
                            # Very tall image - use multi-page approach
                            story.append(PageBreak())
                            add_split_image(story, img_path, USABLE_WIDTH, USABLE_HEIGHT, image_caption_style, screenshot)
                        else:
                            img_flowable = RLImage(str(img_path), width=final_width, height=final_height)
                            story.append(img_flowable)
                            story.append(Paragraph(f"Screenshot: {screenshot} (scaled to fit)", image_caption_style))

            except Exception as e:
                story.append(Paragraph(f"[Error loading {screenshot}: {e}]", content_style))

        story.append(Spacer(1, 0.2*inch))

    # Build the PDF
    doc.build(story)
    print(f"\nCreated: {output_path}")
    print(f"Entries processed: {len(entries)}")
    print(f"Images included: {len(images_included)}")


def add_split_image(story, img_path: Path, usable_width: float, usable_height: float,
                    caption_style, filename: str):
    """Add a very tall image split across multiple pages."""
    with Image.open(img_path) as img:
        # Convert to RGB if needed
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            if img.mode == 'RGBA':
                background.paste(img, mask=img.split()[-1])
            else:
                background.paste(img)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')

        img_width, img_height = img.size
        scale = usable_width / img_width
        scaled_height = img_height * scale

        # Calculate pages needed
        num_pages = int((scaled_height + usable_height - 1) // usable_height)
        crop_height_per_page = usable_height / scale

        for page_num in range(num_pages):
            crop_y_start = int(page_num * crop_height_per_page)
            crop_y_end = min(int((page_num + 1) * crop_height_per_page), img_height)

            cropped = img.crop((0, crop_y_start, img_width, crop_y_end))

            # Save to temp buffer
            buffer = BytesIO()
            cropped.save(buffer, format='PNG')
            buffer.seek(0)

            # Calculate dimensions for this slice
            slice_height = (crop_y_end - crop_y_start) * scale

            img_flowable = RLImage(buffer, width=usable_width, height=slice_height)
            story.append(img_flowable)
            story.append(Paragraph(f"{filename} ({page_num + 1}/{num_pages})", caption_style))

            if page_num < num_pages - 1:
                story.append(PageBreak())


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)

    journal_path = Path(sys.argv[1]).resolve()
    screenshots_dir = Path(sys.argv[2]).resolve()

    if not journal_path.is_file():
        print(f"Error: Journal file not found: {journal_path}")
        sys.exit(1)

    if not screenshots_dir.is_dir():
        print(f"Error: Screenshots directory not found: {screenshots_dir}")
        sys.exit(1)

    # Determine output path
    if len(sys.argv) >= 4:
        output_path = Path(sys.argv[3]).resolve()
    else:
        output_path = journal_path.parent / f"{journal_path.stem}-report.pdf"

    if output_path.suffix.lower() != '.pdf':
        output_path = output_path.with_suffix('.pdf')

    # Extract title from output filename
    title = output_path.stem.replace('-', ' ').replace('_', ' ')

    print(f"Journal: {journal_path}")
    print(f"Screenshots: {screenshots_dir}")
    print(f"Output: {output_path}")
    print()

    # Parse journal
    print("Parsing journal...")
    entries = parse_journal(journal_path, screenshots_dir)
    print(f"Found {len(entries)} entries")

    # Count screenshots
    total_screenshots = sum(len(e.screenshots) for e in entries)
    print(f"Total screenshot references: {total_screenshots}")

    # Create PDF
    print("\nGenerating PDF...")
    create_pdf(entries, screenshots_dir, output_path, title)


if __name__ == '__main__':
    main()
