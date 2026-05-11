---
name: tests
description: "Skill for the Tests area of vvroom. 11 symbols across 1 files."
---

# Tests

11 symbols | 1 files | Cohesion: 100%

## When to Use

- Working with code in `e2e/`
- Understanding how takeScreenshot, takeOverlayScreenshot, collapsePanel work
- Modifying tests-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `e2e/tests/screenshot-helper.ts` | addUrlBarToScreenshot, getImageHeight, isFooterFullyVisible, resetAllScrollPositions, takeScreenshot (+6) |

## Entry Points

Start here when exploring this area:

- **`takeScreenshot`** (Function) — `e2e/tests/screenshot-helper.ts:409`
- **`takeOverlayScreenshot`** (Function) — `e2e/tests/screenshot-helper.ts:491`
- **`collapsePanel`** (Function) — `e2e/tests/screenshot-helper.ts:29`
- **`expandPanel`** (Function) — `e2e/tests/screenshot-helper.ts:44`
- **`setPanelVisibility`** (Function) — `e2e/tests/screenshot-helper.ts:59`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `takeScreenshot` | Function | `e2e/tests/screenshot-helper.ts` | 409 |
| `takeOverlayScreenshot` | Function | `e2e/tests/screenshot-helper.ts` | 491 |
| `collapsePanel` | Function | `e2e/tests/screenshot-helper.ts` | 29 |
| `expandPanel` | Function | `e2e/tests/screenshot-helper.ts` | 44 |
| `setPanelVisibility` | Function | `e2e/tests/screenshot-helper.ts` | 59 |
| `waitForPageLoad` | Function | `e2e/tests/screenshot-helper.ts` | 471 |
| `navigateToDiscover` | Function | `e2e/tests/screenshot-helper.ts` | 481 |
| `addUrlBarToScreenshot` | Function | `e2e/tests/screenshot-helper.ts` | 85 |
| `getImageHeight` | Function | `e2e/tests/screenshot-helper.ts` | 200 |
| `isFooterFullyVisible` | Function | `e2e/tests/screenshot-helper.ts` | 318 |
| `resetAllScrollPositions` | Function | `e2e/tests/screenshot-helper.ts` | 381 |

## How to Explore

1. `gitnexus_context({name: "takeScreenshot"})` — see callers and callees
2. `gitnexus_query({query: "tests"})` — find related execution flows
3. Read key files listed above for implementation details
