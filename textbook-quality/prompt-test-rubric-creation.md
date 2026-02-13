# Prompt: Create Comprehensive Playwright Test Rubric

## Context

Previous test files were inherited from a partially successful test run. Start fresh with a complete testing strategy.

## Task

1. **Read reference materials:**
   - `~/projects/vvroom/test-data/README.md` - Understand the API data structure (filters, pagination, sorting, highlights, available values)
   - `~/projects/vvroom/textbook/A02-url-first-testing-rubric.md` - Use as a structural model for the new rubric

2. **Write:** `~/projects/vvroom/textbook-quality/test-rubric.md`

## Test Rubric Requirements

### Test Categories (for each component)

| Category | What to Test |
|----------|--------------|
| Visual Appearance | Component renders correctly in default and various states |
| URL-First Conformity | Component state reflects URL parameters; user interactions update URL |
| URL Change Consistency | Browser back/forward navigation and manual URL edits restore correct state |
| Pop-out Behavior | Component functions correctly when popped out to separate window |

### Data Requirements

- Use real data values from `~/projects/vvroom/test-data/`
- Reference actual manufacturers (Ford, Chevrolet, Tesla, etc.)
- Use valid year ranges (1908-2024)
- Use actual body classes (Sedan, SUV, Pickup, etc.)

### Screenshot Capture Requirements

**Naming convention:**
- `{component}-{state}.png` - Component in various states (default, filtered, highlighted, etc.)
- `{component}-popout-standalone.png` - The popped-out component window alone
- `{component}-popout-with-main.png` - Both windows visible showing:
  - Main page with placeholder icon where component was
  - The popout window with the component

**Annotation requirement:**
- Every screenshot must include the full browser URL bar at the top of the image
- This verifies URL-First state management is working correctly

### Output Structure

Model the rubric structure after `A02-url-first-testing-rubric.md` but expand to include:
- All testable components
- All URL parameter combinations
- All pop-out scenarios
- Screenshot specifications for each test case
