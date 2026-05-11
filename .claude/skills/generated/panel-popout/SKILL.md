---
name: panel-popout
description: "Skill for the Panel-popout area of vvroom. 7 symbols across 2 files."
---

# Panel-popout

7 symbols | 2 files | Cohesion: 92%

## When to Use

- Working with code in `src/`
- Understanding how initializeAsPopOut, setupChannel, sendMessage work
- Modifying panel-popout-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/features/panel-popout/panel-popout.component.ts` | onUrlParamsChange, onClearAllFilters, onPickerSelectionChange, onChartClick |
| `src/app/framework/services/popout-context.service.ts` | initializeAsPopOut, setupChannel, sendMessage |

## Entry Points

Start here when exploring this area:

- **`initializeAsPopOut`** (Method) — `src/app/framework/services/popout-context.service.ts:184`
- **`setupChannel`** (Method) — `src/app/framework/services/popout-context.service.ts:230`
- **`sendMessage`** (Method) — `src/app/framework/services/popout-context.service.ts:278`
- **`onUrlParamsChange`** (Method) — `src/app/features/panel-popout/panel-popout.component.ts:202`
- **`onClearAllFilters`** (Method) — `src/app/features/panel-popout/panel-popout.component.ts:218`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `initializeAsPopOut` | Method | `src/app/framework/services/popout-context.service.ts` | 184 |
| `setupChannel` | Method | `src/app/framework/services/popout-context.service.ts` | 230 |
| `sendMessage` | Method | `src/app/framework/services/popout-context.service.ts` | 278 |
| `onUrlParamsChange` | Method | `src/app/features/panel-popout/panel-popout.component.ts` | 202 |
| `onClearAllFilters` | Method | `src/app/features/panel-popout/panel-popout.component.ts` | 218 |
| `onPickerSelectionChange` | Method | `src/app/features/panel-popout/panel-popout.component.ts` | 231 |
| `onChartClick` | Method | `src/app/features/panel-popout/panel-popout.component.ts` | 249 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `InitializeAsPopOut → Close` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Services | 1 calls |

## How to Explore

1. `gitnexus_context({name: "initializeAsPopOut"})` — see callers and callees
2. `gitnexus_query({query: "panel-popout"})` — find related execution flows
3. Read key files listed above for implementation details
