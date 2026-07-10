---
name: base-picker
description: "Skill for the Base-picker area of vvroom. 19 symbols across 4 files."
---

# Base-picker

19 symbols | 4 files | Cohesion: 92%

## When to Use

- Working with code in `src/`
- Understanding how getDefaultPickerState, watchParam, get work
- Modifying base-picker-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/framework/components/base-picker/base-picker.component.ts` | ngOnInit, loadConfiguration, initializeState, subscribeToUrlChanges, loadData (+11) |
| `src/app/framework/models/picker-config.interface.ts` | getDefaultPickerState |
| `src/app/framework/services/url-state.service.ts` | watchParam |
| `src/app/framework/services/picker-config-registry.service.ts` | get |

## Entry Points

Start here when exploring this area:

- **`getDefaultPickerState`** (Function) — `src/app/framework/models/picker-config.interface.ts:385`
- **`watchParam`** (Method) — `src/app/framework/services/url-state.service.ts:215`
- **`get`** (Method) — `src/app/framework/services/picker-config-registry.service.ts:110`
- **`ngOnInit`** (Method) — `src/app/framework/components/base-picker/base-picker.component.ts:101`
- **`loadConfiguration`** (Method) — `src/app/framework/components/base-picker/base-picker.component.ts:149`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `getDefaultPickerState` | Function | `src/app/framework/models/picker-config.interface.ts` | 385 |
| `watchParam` | Method | `src/app/framework/services/url-state.service.ts` | 215 |
| `get` | Method | `src/app/framework/services/picker-config-registry.service.ts` | 110 |
| `ngOnInit` | Method | `src/app/framework/components/base-picker/base-picker.component.ts` | 101 |
| `loadConfiguration` | Method | `src/app/framework/components/base-picker/base-picker.component.ts` | 149 |
| `initializeState` | Method | `src/app/framework/components/base-picker/base-picker.component.ts` | 160 |
| `subscribeToUrlChanges` | Method | `src/app/framework/components/base-picker/base-picker.component.ts` | 173 |
| `loadData` | Method | `src/app/framework/components/base-picker/base-picker.component.ts` | 298 |
| `onLazyLoad` | Method | `src/app/framework/components/base-picker/base-picker.component.ts` | 402 |
| `onPageChange` | Method | `src/app/framework/components/base-picker/base-picker.component.ts` | 423 |
| `onSearch` | Method | `src/app/framework/components/base-picker/base-picker.component.ts` | 444 |
| `onSort` | Method | `src/app/framework/components/base-picker/base-picker.component.ts` | 453 |
| `emitSelectionChange` | Method | `src/app/framework/components/base-picker/base-picker.component.ts` | 481 |
| `applySelections` | Method | `src/app/framework/components/base-picker/base-picker.component.ts` | 498 |
| `clearSelections` | Method | `src/app/framework/components/base-picker/base-picker.component.ts` | 506 |
| `ngAfterViewInit` | Method | `src/app/framework/components/base-picker/base-picker.component.ts` | 126 |
| `syncPaginatorWidth` | Method | `src/app/framework/components/base-picker/base-picker.component.ts` | 135 |
| `hydrateFromUrl` | Method | `src/app/framework/components/base-picker/base-picker.component.ts` | 228 |
| `hydrateSelections` | Method | `src/app/framework/components/base-picker/base-picker.component.ts` | 259 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `NgOnInit → UpdateState` | cross_community | 4 |
| `OnLazyLoad → UpdateState` | cross_community | 4 |
| `OnPageChange → UpdateState` | cross_community | 4 |
| `OnSearch → UpdateState` | cross_community | 4 |
| `OnSort → UpdateState` | cross_community | 4 |
| `NgOnInit → Get` | intra_community | 3 |
| `NgOnInit → GetDefaultPickerState` | intra_community | 3 |
| `NgOnInit → WatchParam` | intra_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Services | 1 calls |

## How to Explore

1. `gitnexus_context({name: "getDefaultPickerState"})` — see callers and callees
2. `gitnexus_query({query: "base-picker"})` — find related execution flows
3. Read key files listed above for implementation details
