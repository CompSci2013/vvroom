#!/usr/bin/env python3
"""
Textbook Page Splitter

Splits markdown files into approximately one physical page per output file.
Target: ~2,500-3,000 characters per page (adjustable for code blocks).
"""

import os
import re
from pathlib import Path
from dataclasses import dataclass
from typing import List, Tuple

# Configuration
SOURCE_DIR = Path.home() / "projects/vvroom/textbook"
OUTPUT_DIR = Path.home() / "projects/vvroom/textbook-pages"
TARGET_CHARS = 2750  # Target characters per page
MIN_CHARS = 2000     # Minimum before considering a new page
MAX_CHARS = 3500     # Maximum before forcing a split


@dataclass
class ContentBlock:
    """A block of content that should not be split."""
    content: str
    block_type: str  # 'heading', 'paragraph', 'code', 'table', 'list', 'hr', 'other'
    char_count: int

    @property
    def is_break_point(self) -> bool:
        """Check if this block is a good place to start a new page."""
        return self.block_type in ('heading', 'hr', 'step')


def parse_content_blocks(content: str) -> List[ContentBlock]:
    """
    Parse markdown content into blocks that should not be split.
    """
    blocks = []
    lines = content.split('\n')
    current_block = []
    current_type = 'paragraph'
    in_code_block = False
    in_table = False

    i = 0
    while i < len(lines):
        line = lines[i]

        # Handle code blocks
        if line.strip().startswith('```'):
            if in_code_block:
                # End of code block
                current_block.append(line)
                block_content = '\n'.join(current_block)
                blocks.append(ContentBlock(
                    content=block_content,
                    block_type='code',
                    char_count=len(block_content)
                ))
                current_block = []
                current_type = 'paragraph'
                in_code_block = False
            else:
                # Start of code block - flush current block first
                if current_block:
                    block_content = '\n'.join(current_block)
                    blocks.append(ContentBlock(
                        content=block_content,
                        block_type=current_type,
                        char_count=len(block_content)
                    ))
                    current_block = []
                current_block.append(line)
                current_type = 'code'
                in_code_block = True
            i += 1
            continue

        # If in code block, keep collecting
        if in_code_block:
            current_block.append(line)
            i += 1
            continue

        # Handle tables
        if line.strip().startswith('|') or (line.strip().startswith('|-') or line.strip().startswith('|:')):
            if not in_table:
                # Flush current block
                if current_block:
                    block_content = '\n'.join(current_block)
                    blocks.append(ContentBlock(
                        content=block_content,
                        block_type=current_type,
                        char_count=len(block_content)
                    ))
                    current_block = []
                in_table = True
                current_type = 'table'
            current_block.append(line)
            i += 1
            continue
        elif in_table:
            # End of table
            block_content = '\n'.join(current_block)
            blocks.append(ContentBlock(
                content=block_content,
                block_type='table',
                char_count=len(block_content)
            ))
            current_block = []
            in_table = False
            current_type = 'paragraph'
            # Don't increment i, process this line again
            continue

        # Handle horizontal rules
        if line.strip() in ('---', '***', '___'):
            # Flush current block
            if current_block:
                block_content = '\n'.join(current_block)
                blocks.append(ContentBlock(
                    content=block_content,
                    block_type=current_type,
                    char_count=len(block_content)
                ))
                current_block = []
            blocks.append(ContentBlock(
                content=line,
                block_type='hr',
                char_count=len(line)
            ))
            current_type = 'paragraph'
            i += 1
            continue

        # Handle headings (## level as major break points)
        if line.startswith('#'):
            # Flush current block
            if current_block:
                block_content = '\n'.join(current_block)
                blocks.append(ContentBlock(
                    content=block_content,
                    block_type=current_type,
                    char_count=len(block_content)
                ))
                current_block = []

            # Check for "Step XXX.N" pattern
            heading_type = 'heading'
            if re.match(r'^#+\s*Step\s+\d+\.\d+', line):
                heading_type = 'step'

            # Collect heading with its first paragraph (keep them together)
            heading_block = [line]
            i += 1

            # Skip empty lines after heading
            while i < len(lines) and lines[i].strip() == '':
                heading_block.append(lines[i])
                i += 1

            # Include first paragraph with heading
            while i < len(lines) and lines[i].strip() != '' and not lines[i].startswith('#') and not lines[i].strip().startswith('```') and not lines[i].strip().startswith('|'):
                heading_block.append(lines[i])
                i += 1

            block_content = '\n'.join(heading_block)
            blocks.append(ContentBlock(
                content=block_content,
                block_type=heading_type,
                char_count=len(block_content)
            ))
            current_type = 'paragraph'
            continue

        # Handle lists (keep entire list together)
        if re.match(r'^[\s]*[-*+]\s', line) or re.match(r'^[\s]*\d+\.\s', line):
            # Flush current block
            if current_block:
                block_content = '\n'.join(current_block)
                blocks.append(ContentBlock(
                    content=block_content,
                    block_type=current_type,
                    char_count=len(block_content)
                ))
                current_block = []

            # Collect the entire list
            list_block = [line]
            i += 1
            while i < len(lines):
                next_line = lines[i]
                # Continue list if: bullet/numbered item, continuation (indented), or blank within list
                if (re.match(r'^[\s]*[-*+]\s', next_line) or
                    re.match(r'^[\s]*\d+\.\s', next_line) or
                    (next_line.startswith('  ') and next_line.strip()) or
                    next_line.strip() == ''):
                    # Check if blank line is within list (next non-blank is still list)
                    if next_line.strip() == '':
                        # Look ahead
                        j = i + 1
                        while j < len(lines) and lines[j].strip() == '':
                            j += 1
                        if j < len(lines) and (re.match(r'^[\s]*[-*+]\s', lines[j]) or re.match(r'^[\s]*\d+\.\s', lines[j])):
                            list_block.append(next_line)
                            i += 1
                            continue
                        else:
                            break
                    list_block.append(next_line)
                    i += 1
                else:
                    break

            block_content = '\n'.join(list_block)
            blocks.append(ContentBlock(
                content=block_content,
                block_type='list',
                char_count=len(block_content)
            ))
            current_type = 'paragraph'
            continue

        # Empty line - might be end of paragraph
        if line.strip() == '':
            if current_block:
                current_block.append(line)
            else:
                # Leading blank, just add to create proper spacing
                current_block.append(line)
            i += 1
            continue

        # Regular paragraph content
        current_block.append(line)
        i += 1

    # Flush remaining block
    if current_block:
        block_content = '\n'.join(current_block)
        if block_content.strip():  # Only add if there's actual content
            blocks.append(ContentBlock(
                content=block_content,
                block_type=current_type if not in_code_block else 'code',
                char_count=len(block_content)
            ))

    return blocks


def split_into_pages(blocks: List[ContentBlock], source_file: str) -> List[str]:
    """
    Group blocks into pages of approximately TARGET_CHARS characters.
    """
    pages = []
    current_page = []
    current_chars = 0

    for i, block in enumerate(blocks):
        # Calculate what adding this block would mean
        potential_chars = current_chars + block.char_count

        # Decide whether to start a new page
        should_break = False

        if current_chars == 0:
            # First block of page, always add
            pass
        elif block.is_break_point and current_chars >= MIN_CHARS:
            # Good break point and we have enough content
            should_break = True
        elif potential_chars > MAX_CHARS and current_chars >= MIN_CHARS:
            # Would exceed max and we have enough content
            should_break = True
        elif potential_chars > TARGET_CHARS * 1.3:
            # Significantly over target
            should_break = True

        if should_break and current_page:
            # Save current page and start new one
            page_content = '\n'.join(b.content for b in current_page)
            pages.append(page_content.strip())
            current_page = []
            current_chars = 0

        # Add block to current page
        current_page.append(block)
        current_chars += block.char_count

    # Don't forget the last page
    if current_page:
        page_content = '\n'.join(b.content for b in current_page)
        pages.append(page_content.strip())

    return pages


def extract_prefix(filename: str) -> str:
    """Extract the numeric prefix from a filename."""
    # Handle patterns like "000-", "051-", "A01-"
    match = re.match(r'^([A-Z]?\d+)-', filename)
    if match:
        return match.group(1)
    return filename.split('-')[0]


def process_file(source_path: Path, output_dir: Path) -> Tuple[str, int]:
    """
    Process a single markdown file and split it into pages.
    Returns (filename, page_count).
    """
    content = source_path.read_text(encoding='utf-8')
    prefix = extract_prefix(source_path.name)

    # Parse into blocks
    blocks = parse_content_blocks(content)

    # Split into pages
    pages = split_into_pages(blocks, source_path.name)

    # Write output files
    for i, page_content in enumerate(pages, 1):
        output_filename = f"{prefix}-p{i:02d}.md"
        output_path = output_dir / output_filename
        output_path.write_text(page_content, encoding='utf-8')

    return source_path.name, len(pages)


def main():
    """Main entry point."""
    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Clear any existing output files
    for f in OUTPUT_DIR.glob("*.md"):
        f.unlink()

    # Get all source files sorted
    source_files = sorted(SOURCE_DIR.glob("*.md"))

    print(f"Processing {len(source_files)} source files...")
    print("-" * 60)

    total_pages = 0
    results = []

    for source_file in source_files:
        filename, page_count = process_file(source_file, OUTPUT_DIR)
        results.append((filename, page_count))
        total_pages += page_count
        print(f"{filename}: {page_count} pages")

    print("-" * 60)
    print(f"Total: {len(source_files)} files -> {total_pages} pages")
    print(f"Average: {total_pages / len(source_files):.1f} pages per file")

    # Write summary report
    report_path = OUTPUT_DIR / "SPLIT_REPORT.txt"
    with open(report_path, 'w') as f:
        f.write("Textbook Page Splitter Report\n")
        f.write("=" * 60 + "\n\n")
        f.write(f"Source: {SOURCE_DIR}\n")
        f.write(f"Output: {OUTPUT_DIR}\n")
        f.write(f"Target characters per page: {TARGET_CHARS}\n\n")
        f.write("-" * 60 + "\n")
        for filename, page_count in results:
            f.write(f"{filename}: {page_count} pages\n")
        f.write("-" * 60 + "\n")
        f.write(f"\nTotal: {len(source_files)} files -> {total_pages} pages\n")
        f.write(f"Average: {total_pages / len(source_files):.1f} pages per file\n")

    print(f"\nReport written to: {report_path}")


if __name__ == "__main__":
    main()
