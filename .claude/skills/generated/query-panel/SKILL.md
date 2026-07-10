---
name: query-panel
description: "Skill for the Query-panel area of vvroom. 9 symbols across 1 files."
---

# Query-panel

9 symbols | 1 files | Cohesion: 100%

## When to Use

- Working with code in `src/`
- Understanding how constructor, onFilterChange, applyFilterChange work
- Modifying query-panel-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/framework/components/query-panel/query-panel.component.ts` | constructor, onFilterChange, applyFilterChange, onAutocompleteKeyUp, handleAutocompleteBlur (+4) |

## Entry Points

Start here when exploring this area:

- **`constructor`** (Method) — `src/app/framework/components/query-panel/query-panel.component.ts:84`
- **`onFilterChange`** (Method) — `src/app/framework/components/query-panel/query-panel.component.ts:146`
- **`applyFilterChange`** (Method) — `src/app/framework/components/query-panel/query-panel.component.ts:160`
- **`onAutocompleteKeyUp`** (Method) — `src/app/framework/components/query-panel/query-panel.component.ts:253`
- **`handleAutocompleteBlur`** (Method) — `src/app/framework/components/query-panel/query-panel.component.ts:274`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `constructor` | Method | `src/app/framework/components/query-panel/query-panel.component.ts` | 84 |
| `onFilterChange` | Method | `src/app/framework/components/query-panel/query-panel.component.ts` | 146 |
| `applyFilterChange` | Method | `src/app/framework/components/query-panel/query-panel.component.ts` | 160 |
| `onAutocompleteKeyUp` | Method | `src/app/framework/components/query-panel/query-panel.component.ts` | 253 |
| `handleAutocompleteBlur` | Method | `src/app/framework/components/query-panel/query-panel.component.ts` | 274 |
| `ngOnInit` | Method | `src/app/framework/components/query-panel/query-panel.component.ts` | 99 |
| `loadDynamicFilterOptions` | Method | `src/app/framework/components/query-panel/query-panel.component.ts` | 222 |
| `onAutocompleteFocus` | Method | `src/app/framework/components/query-panel/query-panel.component.ts` | 290 |
| `onAutocompleteSearch` | Method | `src/app/framework/components/query-panel/query-panel.component.ts` | 306 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `OnAutocompleteKeyUp → ApplyFilterChange` | intra_community | 3 |
| `HandleAutocompleteBlur → ApplyFilterChange` | intra_community | 3 |

## How to Explore

1. `gitnexus_context({name: "constructor"})` — see callers and callees
2. `gitnexus_query({query: "query-panel"})` — find related execution flows
3. Read key files listed above for implementation details
