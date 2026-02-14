# Screenshot Capture Requirements

## 1. URL Bar
- Every screenshot must include a browser URL bar at the top showing the full URL with parameters
- Implemented via post-processing: capture the page, then composite a rendered URL bar on top

## 1.5 Pop-Out Test Screenshots (Special Rules)
For all pop-out tests (V1.8.x, V1.9.x pop-out variants, P4.x, etc.):
1. **Pop-out window screenshots**: Capture the pop-out window itself (multiple images if scrolling needed)
2. **Main window overlay screenshot**: Capture ONE additional image of the main window showing the placeholder message (e.g., "Manufacturer-Model Picker is open in a separate window")
   - Use `takeOverlayScreenshot()` helper - single image, footer rule relaxed
   - Naming: `{testId}-{component}-main-overlay.png`
   - This shows what the main page looks like when the component is popped out to another monitor

## 2. Page Size (Paper Format)
- 8.5" x 11" at 150 DPI for print/PDF quality
- Landscape: 1650 x 1275 pixels
- Portrait: 1275 x 1650 pixels

## 3. Screenshot Capture Logic
1. **Always use landscape** (1650 x 1275 pixels) with `fullPage: true`
2. **First screenshot** captures from top - must show header with whitespace gap below
3. **Additional screenshots** taken by scrolling down half-page (637px) until footer whitespace rule is satisfied
4. Multiple screenshots numbered: `{testId}-{description}.png`, `{testId}-{description}-2.png`, etc.

### Implementation Details (screenshot-helper.ts)
- `resetAllScrollPositions()`: Resets scroll on window AND internal scrollable containers (main, app-discover)
- `isFooterFullyVisible()`: Checks for 20px+ gap between last content element and footer
- The app has an internal scrollable `<main>` element - must reset its `scrollTop` not just `window.scrollY`

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

### Critical: Internal Scroll Reset
The vvroom app uses an internal scrollable `<main>` element. Panel clicks (expand/collapse) cause this element to scroll, even when `window.scrollY === 0`. Before taking screenshots:
1. Reset `window.scrollTo(0, 0)`
2. Reset `main.scrollTop = 0` (or `app-discover.scrollTop = 0`)
3. Reset `.discover-container` parent's scrollTop
4. Reset ALL elements with `scrollTop > 0`

Without this, the "Vvroom Discovery" title will be cut off even though window reports no scroll.
