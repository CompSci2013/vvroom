#!/usr/bin/env python3
"""
Textbook PDF Generator

Combines all split markdown pages into a single PDF with:
- Table of Contents
- Headers with chapter name
- Page numbers
- Professional formatting
"""

import re
import subprocess
from pathlib import Path
from collections import defaultdict

# Configuration
PAGES_DIR = Path.home() / "projects/vvroom/textbook-pages"
OUTPUT_DIR = Path.home() / "projects/vvroom/textbook-editor"
OUTPUT_PDF = OUTPUT_DIR / "vvroom-textbook.pdf"
OUTPUT_HTML = OUTPUT_DIR / "vvroom-textbook.html"

# Chapter metadata - maps prefix to chapter info
CHAPTER_INFO = {
    "000": ("Conventions", "Book Conventions"),
    "051": ("API Contract", "API Contract Overview"),
    "052": ("API Contract", "Automobile Endpoints"),
    "053": ("API Contract", "Naming Conventions"),
    "101": ("Project Setup", "Project Cleanup"),
    "102": ("Project Setup", "App Shell"),
    "103": ("Project Setup", "Routing"),
    "104": ("Project Setup", "Environment Config"),
    "150": ("Primers", "TypeScript Generics Primer"),
    "201": ("Interfaces", "Domain Config Interface"),
    "202": ("Interfaces", "Resource Management Interface"),
    "203": ("Interfaces", "Filter Definition Interface"),
    "204": ("Interfaces", "Table Config Interface"),
    "205": ("Interfaces", "Picker Config Interface"),
    "206": ("Interfaces", "API Response Interface"),
    "207": ("Interfaces", "Pagination Interface"),
    "208": ("Interfaces", "Popout Interface"),
    "209": ("Interfaces", "Error Notification Interface"),
    "250": ("Primers", "RxJS Patterns Primer"),
    "301": ("Services", "URL State Service"),
    "302": ("Services", "API Service"),
    "303": ("Services", "Request Coordinator"),
    "304": ("Services", "Domain Config Registry"),
    "305": ("Services", "Domain Config Validator"),
    "306": ("Services", "Resource Management Service"),
    "307": ("Services", "Popout Context Service"),
    "308": ("Services", "Popout Manager Service"),
    "309": ("Services", "User Preferences Service"),
    "310": ("Services", "Filter Options Service"),
    "311": ("Services", "Picker Config Registry"),
    "312": ("Services", "Error Notification Service"),
    "313": ("Services", "HTTP Error Interceptor"),
    "314": ("Services", "Global Error Handler"),
    "315": ("Services", "Popout Token"),
    "401": ("Models", "Base Model Interface"),
    "402": ("Models", "Domain Data Models"),
    "403": ("Models", "Domain Filter Statistics Models"),
    "501": ("Adapters", "Domain Adapter Pattern"),
    "502": ("Adapters", "URL Mapper Adapter"),
    "503": ("Adapters", "API Adapter"),
    "601": ("Domain Config", "Filter Definitions"),
    "602": ("Domain Config", "Table Config"),
    "603": ("Domain Config", "Picker Configs"),
    "604": ("Domain Config", "Query Control Filters"),
    "605": ("Domain Config", "Highlight Filters"),
    "606": ("Domain Config", "Chart Configs"),
    "607": ("Domain Config", "Domain Config Assembly"),
    "608": ("Domain Config", "Domain Providers"),
    "651": ("Chart Sources", "Manufacturer Chart Source"),
    "652": ("Chart Sources", "Year Chart Source"),
    "653": ("Chart Sources", "Body Class Chart Source"),
    "654": ("Chart Sources", "Top Models Chart Source"),
    "801": ("Components", "Base Chart Component"),
    "802": ("Components", "Base Picker Component"),
    "803": ("Components", "Basic Results Table"),
    "804": ("Components", "Statistics Panel Component"),
    "805": ("Components", "Inline Filters Component"),
    "806": ("Components", "Query Panel Component"),
    "807": ("Components", "Column Manager Component"),
    "808": ("Components", "Statistics Panel 2"),
    "809": ("Components", "Dockview Statistics Panel"),
    "901": ("Pages", "Home Component"),
    "902": ("Pages", "Automobile Landing Component"),
    "903": ("Pages", "Discover Page Component"),
    "904": ("Pages", "Popout Component"),
    "905": ("Pages", "App Routing Module"),
    "906": ("Pages", "App Module"),
    "907": ("Pages", "Final Integration"),
    "951": ("Reference", "RxJS Operator Reference"),
    "952": ("Reference", "TypeScript Generics Reference"),
    "953": ("Reference", "Debugging Guide"),
    "954": ("Reference", "Glossary"),
    "A01": ("Appendix", "Styling and Branding"),
    "A02": ("Appendix", "URL-First Testing Rubric"),
}


def get_chapter_info(prefix: str) -> tuple:
    """Get chapter category and title for a prefix."""
    return CHAPTER_INFO.get(prefix, ("Unknown", f"Section {prefix}"))


def markdown_to_html(md_content: str) -> str:
    """Convert markdown to HTML with syntax highlighting for code blocks."""
    # Simple markdown conversion - handle common patterns
    html = md_content

    # Escape HTML entities first (but not in code blocks)
    # We'll handle code blocks separately

    # Extract code blocks first
    code_blocks = []
    def save_code_block(match):
        code_blocks.append(match.group(0))
        return f"__CODE_BLOCK_{len(code_blocks) - 1}__"

    html = re.sub(r'```[\s\S]*?```', save_code_block, html)

    # Escape HTML in non-code content
    html = html.replace('&', '&amp;')
    html = html.replace('<', '&lt;')
    html = html.replace('>', '&gt;')

    # Restore code blocks and format them
    for i, block in enumerate(code_blocks):
        # Extract language and code
        match = re.match(r'```(\w*)\n?([\s\S]*?)```', block)
        if match:
            lang = match.group(1) or 'text'
            code = match.group(2)
            # Escape HTML in code
            code = code.replace('&', '&amp;')
            code = code.replace('<', '&lt;')
            code = code.replace('>', '&gt;')
            formatted = f'<pre class="code-block {lang}"><code>{code}</code></pre>'
        else:
            formatted = f'<pre class="code-block"><code>{block}</code></pre>'
        html = html.replace(f"__CODE_BLOCK_{i}__", formatted)

    # Headers
    html = re.sub(r'^#### (.+)$', r'<h4>\1</h4>', html, flags=re.MULTILINE)
    html = re.sub(r'^### (.+)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.+)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^# (.+)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)

    # Bold and italic
    html = re.sub(r'\*\*\*(.+?)\*\*\*', r'<strong><em>\1</em></strong>', html)
    html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'\*(.+?)\*', r'<em>\1</em>', html)

    # Inline code
    html = re.sub(r'`([^`]+)`', r'<code class="inline">\1</code>', html)

    # Links
    html = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', html)

    # Horizontal rules
    html = re.sub(r'^---+$', '<hr>', html, flags=re.MULTILINE)

    # Tables
    lines = html.split('\n')
    in_table = False
    table_lines = []
    new_lines = []

    for line in lines:
        if line.strip().startswith('|') and '|' in line[1:]:
            if not in_table:
                in_table = True
                table_lines = []
            table_lines.append(line)
        else:
            if in_table:
                # Process the table
                new_lines.append(process_table(table_lines))
                in_table = False
                table_lines = []
            new_lines.append(line)

    if in_table:
        new_lines.append(process_table(table_lines))

    html = '\n'.join(new_lines)

    # Lists - unordered
    html = re.sub(r'^(\s*)[-*+] (.+)$', r'\1<li>\2</li>', html, flags=re.MULTILINE)

    # Lists - ordered
    html = re.sub(r'^(\s*)\d+\. (.+)$', r'\1<li>\2</li>', html, flags=re.MULTILINE)

    # Wrap consecutive <li> elements in <ul>
    html = re.sub(r'((?:<li>.*?</li>\n?)+)', r'<ul>\1</ul>', html)

    # Paragraphs - wrap non-tagged lines
    lines = html.split('\n')
    result_lines = []
    para_buffer = []

    block_tags = ['<h1', '<h2', '<h3', '<h4', '<pre', '<ul', '<ol', '<table', '<hr', '<div']

    for line in lines:
        stripped = line.strip()
        if not stripped:
            if para_buffer:
                result_lines.append('<p>' + ' '.join(para_buffer) + '</p>')
                para_buffer = []
            result_lines.append('')
        elif any(stripped.startswith(tag) for tag in block_tags) or stripped.startswith('</'):
            if para_buffer:
                result_lines.append('<p>' + ' '.join(para_buffer) + '</p>')
                para_buffer = []
            result_lines.append(line)
        else:
            para_buffer.append(stripped)

    if para_buffer:
        result_lines.append('<p>' + ' '.join(para_buffer) + '</p>')

    return '\n'.join(result_lines)


def process_table(lines: list) -> str:
    """Convert markdown table lines to HTML table."""
    if len(lines) < 2:
        return '\n'.join(lines)

    html = ['<table>']

    # Header row
    header_cells = [cell.strip() for cell in lines[0].split('|')[1:-1]]
    html.append('<thead><tr>')
    for cell in header_cells:
        html.append(f'<th>{cell}</th>')
    html.append('</tr></thead>')

    # Skip separator row (line 1) and process data rows
    html.append('<tbody>')
    for line in lines[2:]:
        cells = [cell.strip() for cell in line.split('|')[1:-1]]
        html.append('<tr>')
        for cell in cells:
            html.append(f'<td>{cell}</td>')
        html.append('</tr>')
    html.append('</tbody>')
    html.append('</table>')

    return '\n'.join(html)


def generate_toc(chapters: dict) -> str:
    """Generate HTML table of contents."""
    toc = ['<div class="toc">']
    toc.append('<h1>Table of Contents</h1>')

    current_category = None

    for prefix in sorted(chapters.keys()):
        category, title = get_chapter_info(prefix)
        page_count = len(chapters[prefix])

        if category != current_category:
            if current_category is not None:
                toc.append('</div>')  # Close previous category
            toc.append(f'<div class="toc-category">')
            toc.append(f'<h2>{category}</h2>')
            current_category = category

        toc.append(f'<div class="toc-entry">')
        toc.append(f'<a href="#section-{prefix}">{prefix}: {title}</a>')
        toc.append(f'<span class="toc-pages">({page_count} pages)</span>')
        toc.append('</div>')

    if current_category is not None:
        toc.append('</div>')  # Close last category

    toc.append('</div>')
    return '\n'.join(toc)


def generate_html(pages_dir: Path) -> str:
    """Generate complete HTML document from all pages."""

    # Collect all pages by prefix
    chapters = defaultdict(list)
    for page_file in sorted(pages_dir.glob("*.md")):
        if page_file.name == "SPLIT_REPORT.txt":
            continue
        # Parse filename: {prefix}-p{num}.md
        match = re.match(r'^([A-Z]?\d+)-p(\d+)\.md$', page_file.name)
        if match:
            prefix = match.group(1)
            page_num = int(match.group(2))
            chapters[prefix].append((page_num, page_file))

    # Sort pages within each chapter
    for prefix in chapters:
        chapters[prefix].sort(key=lambda x: x[0])

    # Generate HTML
    html_parts = []

    # Document header with styles
    html_parts.append('''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>VVRoom Textbook</title>
    <style>
        @page {
            size: letter;
            margin: 1in 0.75in;
            @top-center {
                content: string(chapter-title);
                font-size: 10pt;
                color: #666;
            }
            @bottom-center {
                content: counter(page);
                font-size: 10pt;
            }
        }

        @page:first {
            @top-center { content: none; }
        }

        @page toc {
            @top-center { content: "Table of Contents"; }
        }

        * {
            box-sizing: border-box;
        }

        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #333;
            max-width: 100%;
        }

        /* Title page */
        .title-page {
            page: title;
            text-align: center;
            padding-top: 3in;
            page-break-after: always;
        }

        .title-page h1 {
            font-size: 36pt;
            margin-bottom: 0.5in;
            color: #1a365d;
        }

        .title-page .subtitle {
            font-size: 18pt;
            color: #4a5568;
            margin-bottom: 2in;
        }

        .title-page .author {
            font-size: 14pt;
            color: #718096;
        }

        /* Table of Contents */
        .toc {
            page: toc;
            page-break-after: always;
        }

        .toc h1 {
            font-size: 24pt;
            margin-bottom: 0.5in;
            color: #1a365d;
            border-bottom: 2px solid #1a365d;
            padding-bottom: 0.25in;
        }

        .toc-category {
            margin-bottom: 0.3in;
        }

        .toc-category h2 {
            font-size: 14pt;
            color: #2d3748;
            margin-bottom: 0.1in;
            margin-top: 0.2in;
        }

        .toc-entry {
            display: flex;
            justify-content: space-between;
            padding: 0.05in 0 0.05in 0.2in;
            font-size: 10pt;
        }

        .toc-entry a {
            color: #2b6cb0;
            text-decoration: none;
        }

        .toc-pages {
            color: #718096;
            font-size: 9pt;
        }

        /* Chapter sections */
        .chapter {
            page-break-before: always;
        }

        .chapter-header {
            string-set: chapter-title content();
            background: linear-gradient(135deg, #1a365d 0%, #2d3748 100%);
            color: white;
            padding: 0.5in;
            margin: -1in -0.75in 0.5in -0.75in;
            page-break-after: avoid;
        }

        .chapter-header h1 {
            font-size: 24pt;
            margin: 0;
        }

        .chapter-header .chapter-category {
            font-size: 12pt;
            opacity: 0.8;
            margin-bottom: 0.1in;
        }

        /* Content headings */
        h1 { font-size: 20pt; color: #1a365d; margin-top: 0.3in; page-break-after: avoid; }
        h2 { font-size: 16pt; color: #2d3748; margin-top: 0.25in; page-break-after: avoid; }
        h3 { font-size: 13pt; color: #4a5568; margin-top: 0.2in; page-break-after: avoid; }
        h4 { font-size: 11pt; color: #4a5568; margin-top: 0.15in; page-break-after: avoid; }

        /* Paragraphs */
        p {
            margin: 0.1in 0;
            text-align: justify;
        }

        /* Code blocks */
        pre.code-block {
            background: #1a202c;
            color: #e2e8f0;
            padding: 0.15in;
            border-radius: 4px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 9pt;
            line-height: 1.4;
            overflow-x: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
            page-break-inside: avoid;
            margin: 0.15in 0;
        }

        code.inline {
            background: #edf2f7;
            color: #c53030;
            padding: 0.02in 0.05in;
            border-radius: 3px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 10pt;
        }

        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 0.15in 0;
            font-size: 10pt;
            page-break-inside: avoid;
        }

        th, td {
            border: 1px solid #cbd5e0;
            padding: 0.08in 0.12in;
            text-align: left;
        }

        th {
            background: #edf2f7;
            font-weight: bold;
            color: #2d3748;
        }

        tr:nth-child(even) {
            background: #f7fafc;
        }

        /* Lists */
        ul, ol {
            margin: 0.1in 0;
            padding-left: 0.3in;
        }

        li {
            margin: 0.03in 0;
        }

        /* Horizontal rules */
        hr {
            border: none;
            border-top: 1px solid #cbd5e0;
            margin: 0.2in 0;
        }

        /* Links */
        a {
            color: #2b6cb0;
            text-decoration: none;
        }

        /* Page content wrapper */
        .page-content {
            margin-bottom: 0.3in;
        }

        /* Strong/emphasis */
        strong { font-weight: bold; }
        em { font-style: italic; }
    </style>
</head>
<body>
''')

    # Title page
    html_parts.append('''
    <div class="title-page">
        <h1>VVRoom Textbook</h1>
        <div class="subtitle">Building a URL-First Angular Application</div>
        <div class="author">A Comprehensive Technical Guide</div>
    </div>
''')

    # Table of contents
    html_parts.append(generate_toc(chapters))

    # Content
    for prefix in sorted(chapters.keys()):
        category, title = get_chapter_info(prefix)
        pages = chapters[prefix]

        # Chapter header
        html_parts.append(f'''
    <div class="chapter" id="section-{prefix}">
        <div class="chapter-header">
            <div class="chapter-category">{category}</div>
            <h1>{prefix}: {title}</h1>
        </div>
''')

        # Chapter pages
        for page_num, page_file in pages:
            content = page_file.read_text(encoding='utf-8')
            html_content = markdown_to_html(content)
            html_parts.append(f'<div class="page-content">{html_content}</div>')

        html_parts.append('</div>')  # Close chapter

    # Document footer
    html_parts.append('''
</body>
</html>
''')

    return ''.join(html_parts)


def main():
    print("Generating HTML from markdown pages...")
    html_content = generate_html(PAGES_DIR)

    # Write HTML file
    OUTPUT_HTML.write_text(html_content, encoding='utf-8')
    print(f"HTML written to: {OUTPUT_HTML}")

    # Generate PDF using weasyprint
    print("Generating PDF with weasyprint...")
    result = subprocess.run(
        ['weasyprint', str(OUTPUT_HTML), str(OUTPUT_PDF)],
        capture_output=True,
        text=True
    )

    if result.returncode == 0:
        print(f"PDF generated: {OUTPUT_PDF}")
        # Get file size
        size_mb = OUTPUT_PDF.stat().st_size / (1024 * 1024)
        print(f"File size: {size_mb:.1f} MB")
    else:
        print(f"Error generating PDF: {result.stderr}")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
