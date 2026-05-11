---
name: query-control
description: "Skill for the Query-control area of vvroom. 24 symbols across 2 files."
---

# Query-control

24 symbols | 2 files | Cohesion: 100%

## When to Use

- Working with code in `src/`
- Understanding how onDropdownKeydown, onFieldSelected, openFilterDialog work
- Modifying query-control-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/framework/components/query-control/query-control.component.ts` | onDropdownKeydown, onFieldSelected, openFilterDialog, isHighlightFilterDef, openMultiselectDialog (+17) |
| `src/app/framework/services/error-notification.service.ts` | clearAll, clear |

## Entry Points

Start here when exploring this area:

- **`onDropdownKeydown`** (Method) — `src/app/framework/components/query-control/query-control.component.ts:226`
- **`onFieldSelected`** (Method) — `src/app/framework/components/query-control/query-control.component.ts:294`
- **`openFilterDialog`** (Method) — `src/app/framework/components/query-control/query-control.component.ts:338`
- **`isHighlightFilterDef`** (Method) — `src/app/framework/components/query-control/query-control.component.ts:363`
- **`openMultiselectDialog`** (Method) — `src/app/framework/components/query-control/query-control.component.ts:378`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `onDropdownKeydown` | Method | `src/app/framework/components/query-control/query-control.component.ts` | 226 |
| `onFieldSelected` | Method | `src/app/framework/components/query-control/query-control.component.ts` | 294 |
| `openFilterDialog` | Method | `src/app/framework/components/query-control/query-control.component.ts` | 338 |
| `isHighlightFilterDef` | Method | `src/app/framework/components/query-control/query-control.component.ts` | 363 |
| `openMultiselectDialog` | Method | `src/app/framework/components/query-control/query-control.component.ts` | 378 |
| `retryLoadOptions` | Method | `src/app/framework/components/query-control/query-control.component.ts` | 443 |
| `openRangeDialog` | Method | `src/app/framework/components/query-control/query-control.component.ts` | 482 |
| `parseRangeValue` | Method | `src/app/framework/components/query-control/query-control.component.ts` | 528 |
| `onChipClick` | Method | `src/app/framework/components/query-control/query-control.component.ts` | 682 |
| `onHighlightChipClick` | Method | `src/app/framework/components/query-control/query-control.component.ts` | 697 |
| `isRemoveButtonClick` | Method | `src/app/framework/components/query-control/query-control.component.ts` | 713 |
| `editFilter` | Method | `src/app/framework/components/query-control/query-control.component.ts` | 734 |
| `editHighlight` | Method | `src/app/framework/components/query-control/query-control.component.ts` | 748 |
| `clearAll` | Method | `src/app/framework/services/error-notification.service.ts` | 256 |
| `clear` | Method | `src/app/framework/services/error-notification.service.ts` | 265 |
| `resetFilterDropdown` | Method | `src/app/framework/components/query-control/query-control.component.ts` | 195 |
| `applyFilter` | Method | `src/app/framework/components/query-control/query-control.component.ts` | 452 |
| `applyRange` | Method | `src/app/framework/components/query-control/query-control.component.ts` | 584 |
| `cancelDialog` | Method | `src/app/framework/components/query-control/query-control.component.ts` | 616 |
| `onDialogHide` | Method | `src/app/framework/components/query-control/query-control.component.ts` | 642 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `OnDropdownKeydown → ParseRangeValue` | intra_community | 5 |
| `OnChipClick → ParseRangeValue` | intra_community | 4 |
| `OnHighlightChipClick → ParseRangeValue` | intra_community | 4 |
| `ApplyFilter → Clear` | intra_community | 4 |
| `OnDropdownKeydown → IsHighlightFilterDef` | intra_community | 4 |
| `OnDropdownKeydown → OpenMultiselectDialog` | intra_community | 4 |
| `NgOnInit → SyncFilterFromUrl` | intra_community | 4 |
| `OnChipClick → OpenMultiselectDialog` | intra_community | 3 |
| `OnHighlightChipClick → OpenMultiselectDialog` | intra_community | 3 |
| `OnDialogHide → Clear` | intra_community | 3 |

## How to Explore

1. `gitnexus_context({name: "onDropdownKeydown"})` — see callers and callees
2. `gitnexus_query({query: "query-control"})` — find related execution flows
3. Read key files listed above for implementation details
