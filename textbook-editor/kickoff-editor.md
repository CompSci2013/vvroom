# Textbook Page Splitter - Kickoff Prompt

## Goal

Process all markdown files in `~/projects/vvroom/textbook/` and split each file into multiple smaller files, where each new file contains approximately one physical textbook page worth of content.

## Input

Source directory: `~/projects/vvroom/textbook/`
- Contains 74 markdown files (`.md`)
- Files are numbered with 3-digit prefixes (e.g., `000-`, `051-`, `101-`)
- Each file is a complete section/chapter of a technical textbook
- Files range from ~7KB to ~23KB (roughly 2-8 pages each)

## Output

Destination directory: `~/projects/vvroom/textbook-pages/`
- Split files should use naming convention: `{original-prefix}-p{page-number}.md`
- Example: `653-body-class-chart-source.md` becomes:
  - `653-p01.md`
  - `653-p02.md`
  - `653-p03.md`
  - etc.

## Page Size Guidelines

A typical physical textbook page contains approximately:
- **2,500-3,000 characters** (including whitespace)
- **400-500 words** of prose
- **40-50 lines** of content

When code blocks are present, adjust expectations:
- Code is more vertically dense on a printed page
- A page with a large code block might be 60-80 lines total
- Prioritize keeping code blocks intact over hitting exact character counts

## Splitting Rules

### DO Split At:
1. **Major section headings** (`##` level) - These are natural page break points
2. **Between numbered steps** (e.g., "Step 653.1", "Step 653.2")
3. **Before/after large code blocks** - Code blocks stand alone well
4. **Before/after tables** - Tables should not be split across pages
5. **At horizontal rules** (`---`) - These already indicate content breaks

### DO NOT Split:
1. **Inside code blocks** - Never break a code fence
2. **Inside tables** - Keep tables complete
3. **Inside numbered/bulleted lists** - Keep lists together when possible
4. **Between a heading and its first paragraph** - Headers need context

### Content Integrity:
- Each split file should be self-contained and readable
- Preserve all markdown formatting
- Include the original file's title at the top of page 1 only
- Do NOT add "continued" markers or page numbers in the content itself

## Processing Order

Process files in numerical order by their prefix:
1. `000-book-conventions.md`
2. `051-api-contract-overview.md`
3. `052-automobile-endpoints.md`
4. ... and so on

## Example Split

Given a file `653-body-class-chart-source.md` (~10KB, ~400 lines):

**Page 1** (`653-p01.md`) - ~3KB
- Title and front matter
- Learning Objectives section
- Objective section
- Why section (partial)

**Page 2** (`653-p02.md`) - ~3KB
- Why section (continued)
- What section start
- Step 653.1 with code block

**Page 3** (`653-p03.md`) - ~3KB
- Step 653.2 explanation
- Step 653.3 comparison table
- Step 653.4 margin discussion

**Page 4** (`653-p04.md`) - ~2KB
- Verification section
- Common Problems table
- Key Takeaways
- Acceptance Criteria
- Next Step

## Workflow

1. Create output directory if it doesn't exist
2. For each source file:
   a. Read the complete file content
   b. Identify natural break points (headings, steps, code blocks)
   c. Group content into page-sized chunks (~2,500-3,000 chars)
   d. Write each chunk to a numbered output file
   e. Report: `{filename}: {N} pages created`
3. Generate summary report with total pages created

## Success Criteria

- All 74 source files processed
- Each output file is roughly one physical page (~2,500-3,000 characters)
- No content lost or duplicated
- Code blocks remain intact
- Tables remain intact
- Markdown formatting preserved
- Files readable as standalone pages
