#!/usr/bin/env python3
"""
Brownfield Companion PDF Generator

Converts the BROWNFIELD-COMPANION.md into a professional PDF with:
- Table of Contents
- Headers with section name
- Page numbers
- Professional formatting matching the main textbook
"""

import re
import subprocess
from pathlib import Path

# Configuration
SOURCE_FILE = Path.home() / "projects/vvroom/textbook-editor/BROWNFIELD-COMPANION.md"
OUTPUT_DIR = Path.home() / "projects/vvroom/textbook-editor"
OUTPUT_PDF = OUTPUT_DIR / "brownfield-companion.pdf"
OUTPUT_HTML = OUTPUT_DIR / "brownfield-companion.html"


def markdown_to_html(md_content: str) -> str:
    """Convert markdown to HTML with syntax highlighting for code blocks."""
    html = md_content

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
        match = re.match(r'```(\w*)\n?([\s\S]*?)```', block)
        if match:
            lang = match.group(1) or 'text'
            code = match.group(2)
            code = code.replace('&', '&amp;')
            code = code.replace('<', '&lt;')
            code = code.replace('>', '&gt;')
            formatted = f'<pre class="code-block {lang}"><code>{code}</code></pre>'
        else:
            formatted = f'<pre class="code-block"><code>{block}</code></pre>'
        html = html.replace(f"__CODE_BLOCK_{i}__", formatted)

    # Headers - track for TOC
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

    # Links - handle anchor links specially
    html = re.sub(r'\[([^\]]+)\]\(#([^)]+)\)', r'<a href="#\2">\1</a>', html)
    html = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', html)

    # Horizontal rules
    html = re.sub(r'^---+$', '<hr class="section-break">', html, flags=re.MULTILINE)

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

    # Checkbox items
    html = re.sub(r'<li>\[ \] (.+)</li>', r'<li class="checkbox unchecked">\1</li>', html)
    html = re.sub(r'<li>\[x\] (.+)</li>', r'<li class="checkbox checked">\1</li>', html)

    # Wrap consecutive <li> elements in <ul>
    html = re.sub(r'((?:<li[^>]*>.*?</li>\n?)+)', r'<ul>\1</ul>', html)

    # Paragraphs
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

    # Skip separator row and process data rows
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


def extract_toc(md_content: str) -> list:
    """Extract table of contents entries from markdown."""
    toc = []
    # Find all headers
    for match in re.finditer(r'^(#{1,3}) (.+)$', md_content, re.MULTILINE):
        level = len(match.group(1))
        title = match.group(2)
        # Create anchor from title
        anchor = re.sub(r'[^\w\s-]', '', title.lower())
        anchor = re.sub(r'\s+', '-', anchor)
        toc.append((level, title, anchor))
    return toc


def generate_toc_html(toc_entries: list) -> str:
    """Generate HTML table of contents."""
    html = ['<div class="toc">']
    html.append('<h1>Table of Contents</h1>')

    current_level = 0

    for level, title, anchor in toc_entries:
        # Skip the main title
        if level == 1 and 'Brownfield Companion' in title:
            continue

        indent_class = f"toc-level-{level}"
        html.append(f'<div class="toc-entry {indent_class}">')
        html.append(f'<a href="#{anchor}">{title}</a>')
        html.append('</div>')

    html.append('</div>')
    return '\n'.join(html)


def add_anchors_to_html(html: str) -> str:
    """Add id anchors to headers for TOC linking."""
    def add_anchor(match):
        tag = match.group(1)
        title = match.group(2)
        # Create anchor from title
        anchor = re.sub(r'[^\w\s-]', '', title.lower())
        anchor = re.sub(r'\s+', '-', anchor)
        # Remove HTML tags from title for anchor
        clean_title = re.sub(r'<[^>]+>', '', title)
        anchor = re.sub(r'[^\w\s-]', '', clean_title.lower())
        anchor = re.sub(r'\s+', '-', anchor)
        return f'<{tag} id="{anchor}">{title}</{tag}>'

    html = re.sub(r'<(h[1-4])>(.+?)</\1>', add_anchor, html)
    return html


def generate_html(source_file: Path) -> str:
    """Generate complete HTML document from markdown."""

    content = source_file.read_text(encoding='utf-8')

    # Extract TOC first
    toc_entries = extract_toc(content)

    # Convert markdown to HTML
    body_html = markdown_to_html(content)

    # Add anchors for TOC links
    body_html = add_anchors_to_html(body_html)

    # Generate TOC HTML
    toc_html = generate_toc_html(toc_entries)

    # Build complete document
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Brownfield Companion: Integrating URL-First Architecture</title>
    <style>
        @page {{
            size: letter;
            margin: 1in 0.75in;
            @top-center {{
                content: "Brownfield Companion";
                font-size: 10pt;
                color: #666;
            }}
            @bottom-center {{
                content: counter(page);
                font-size: 10pt;
            }}
        }}

        @page:first {{
            @top-center {{ content: none; }}
        }}

        @page toc {{
            @top-center {{ content: "Table of Contents"; }}
        }}

        * {{
            box-sizing: border-box;
        }}

        body {{
            font-family: 'Georgia', 'Times New Roman', serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #333;
            max-width: 100%;
        }}

        /* Title page */
        .title-page {{
            page: title;
            text-align: center;
            padding-top: 2.5in;
            page-break-after: always;
        }}

        .title-page h1 {{
            font-size: 32pt;
            margin-bottom: 0.3in;
            color: #2d5016;
        }}

        .title-page .subtitle {{
            font-size: 16pt;
            color: #4a5568;
            margin-bottom: 0.5in;
        }}

        .title-page .meta {{
            font-size: 11pt;
            color: #718096;
            margin-top: 1in;
            line-height: 1.8;
        }}

        .title-page .meta strong {{
            color: #4a5568;
        }}

        /* Table of Contents */
        .toc {{
            page: toc;
            page-break-after: always;
        }}

        .toc h1 {{
            font-size: 24pt;
            margin-bottom: 0.5in;
            color: #2d5016;
            border-bottom: 2px solid #2d5016;
            padding-bottom: 0.25in;
        }}

        .toc-entry {{
            padding: 0.05in 0;
            font-size: 10pt;
        }}

        .toc-entry a {{
            color: #2b6cb0;
            text-decoration: none;
        }}

        .toc-level-1 {{
            font-weight: bold;
            font-size: 12pt;
            margin-top: 0.15in;
        }}

        .toc-level-2 {{
            padding-left: 0.2in;
        }}

        .toc-level-3 {{
            padding-left: 0.4in;
            font-size: 9pt;
        }}

        /* Main content */
        .content {{
            page-break-before: always;
        }}

        /* Content headings */
        h1 {{
            font-size: 22pt;
            color: #2d5016;
            margin-top: 0.4in;
            margin-bottom: 0.2in;
            page-break-after: avoid;
            border-bottom: 2px solid #2d5016;
            padding-bottom: 0.1in;
        }}

        h2 {{
            font-size: 16pt;
            color: #3d6b22;
            margin-top: 0.3in;
            margin-bottom: 0.15in;
            page-break-after: avoid;
        }}

        h3 {{
            font-size: 13pt;
            color: #4a5568;
            margin-top: 0.25in;
            margin-bottom: 0.1in;
            page-break-after: avoid;
        }}

        h4 {{
            font-size: 11pt;
            color: #4a5568;
            margin-top: 0.2in;
            margin-bottom: 0.1in;
            page-break-after: avoid;
        }}

        /* Paragraphs */
        p {{
            margin: 0.1in 0;
            text-align: justify;
        }}

        /* Code blocks */
        pre.code-block {{
            background: #1a202c;
            color: #e2e8f0;
            padding: 0.15in;
            border-radius: 4px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 8.5pt;
            line-height: 1.35;
            overflow-x: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
            page-break-inside: avoid;
            margin: 0.12in 0;
            border-left: 3px solid #48bb78;
        }}

        code.inline {{
            background: #edf2f7;
            color: #22543d;
            padding: 0.02in 0.05in;
            border-radius: 3px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 9.5pt;
        }}

        /* Tables */
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 0.15in 0;
            font-size: 9.5pt;
            page-break-inside: avoid;
        }}

        th, td {{
            border: 1px solid #cbd5e0;
            padding: 0.08in 0.12in;
            text-align: left;
        }}

        th {{
            background: #c6f6d5;
            font-weight: bold;
            color: #22543d;
        }}

        tr:nth-child(even) {{
            background: #f0fff4;
        }}

        /* Lists */
        ul, ol {{
            margin: 0.1in 0;
            padding-left: 0.3in;
        }}

        li {{
            margin: 0.03in 0;
        }}

        li.checkbox {{
            list-style: none;
            margin-left: -0.2in;
        }}

        li.checkbox::before {{
            content: "☐ ";
            color: #718096;
        }}

        li.checkbox.checked::before {{
            content: "☑ ";
            color: #48bb78;
        }}

        /* Horizontal rules */
        hr {{
            border: none;
            border-top: 1px solid #cbd5e0;
            margin: 0.2in 0;
        }}

        hr.section-break {{
            border-top: 2px solid #c6f6d5;
            margin: 0.3in 0;
        }}

        /* Links */
        a {{
            color: #2b6cb0;
            text-decoration: none;
        }}

        /* Strong/emphasis */
        strong {{ font-weight: bold; }}
        em {{ font-style: italic; }}

        /* ASCII diagrams - preserve formatting */
        pre.code-block.text {{
            background: #f7fafc;
            color: #2d3748;
            border-left-color: #a0aec0;
        }}

        /* Special callout for key insights */
        p:has(strong:first-child) {{
            background: #f0fff4;
            padding: 0.1in;
            border-left: 3px solid #48bb78;
            margin: 0.15in 0;
        }}
    </style>
</head>
<body>
    <!-- Title Page -->
    <div class="title-page">
        <h1>Brownfield Companion</h1>
        <div class="subtitle">Integrating URL-First Architecture</div>
        <div class="meta">
            <p><strong>Document Type:</strong> Migration Guide</p>
            <p><strong>Audience:</strong> Developers with existing Angular 13 applications</p>
            <p><strong>Companion To:</strong> The VVRoom Angular Textbook (Greenfield)</p>
            <p><strong>Angular Version:</strong> 13.x (NgModule-based architecture)</p>
        </div>
    </div>

    <!-- Table of Contents -->
    {toc_html}

    <!-- Main Content -->
    <div class="content">
        {body_html}
    </div>

</body>
</html>
'''

    return html


def main():
    print("Generating HTML from BROWNFIELD-COMPANION.md...")
    html_content = generate_html(SOURCE_FILE)

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
        size_kb = OUTPUT_PDF.stat().st_size / 1024
        print(f"File size: {size_kb:.0f} KB")
    else:
        print(f"Error generating PDF: {result.stderr}")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
