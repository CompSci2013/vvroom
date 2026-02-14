# Screenshot Capture Requirements

## 1. URL Bar
- Every screenshot must include a browser URL bar at the top showing the full URL with parameters
- Implemented via post-processing: capture the page, then composite a rendered URL bar on top

## 2. Page Size (Paper Format)
- 8.5" x 11" at 150 DPI for print/PDF quality
- Landscape: 1650 x 1275 pixels
- Portrait: 1275 x 1650 pixels

## 3. Adaptive Orientation Logic
1. **Default to landscape** at 100% zoom
2. If content too tall for landscape, try **landscape at 90% zoom**
3. If still too tall, switch to **portrait at 100%** zoom
4. If still too tall, try **portrait at 90% zoom**
5. If still too tall, take **multiple portrait shots with scrolling** (numbered `-1.png`, `-2.png`, etc.)

## 4. Naming Convention
- `{testId}-{description}.png` - e.g., `V1.1.1-results-table-default.png`
- For multi-page: `{testId}-{description}-1.png`, `{testId}-{description}-2.png`
- Popouts: `{component}-popout-standalone.png`, `{component}-popout-with-main.png`

## 5. Panel Visibility
- Follow the `panel-visibility-reference.md` for which panels to expand/collapse per test
- Collapse irrelevant panels to focus on the component being tested

## 6. Full Content Capture
- No clipping at top or bottom
- Entire relevant content must be visible in the screenshot

## 7. Banner and Footer Rules
- **First image**: Must ALWAYS capture the site banner/header at the top with **whitespace between the header and the first control**
- **Last image**: Must show the footer `© 2026 vvroom` with **whitespace between the last control and the footer**
- If a control is flush against the header (no gap below) or footer (no gap above), content is being truncated
- When truncated, take additional images with scrolling until there's visible whitespace gaps at both ends
