---
name: discover
description: "Skill for the Discover area of vvroom. 7 symbols across 3 files."
---

# Discover

7 symbols | 3 files | Cohesion: 86%

## When to Use

- Working with code in `src/`
- Understanding how buildWindowFeatures, boolToYesNo, openPopOut work
- Modifying discover-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/features/discover/discover.component.ts` | getPanelTitle, popOutPanel, onChartPopOut |
| `src/app/framework/models/popout.interface.ts` | buildWindowFeatures, boolToYesNo |
| `src/app/framework/services/popout-manager.service.ts` | openPopOut, handlePopOutClosed |

## Entry Points

Start here when exploring this area:

- **`buildWindowFeatures`** (Function) — `src/app/framework/models/popout.interface.ts:337`
- **`boolToYesNo`** (Function) — `src/app/framework/models/popout.interface.ts:351`
- **`openPopOut`** (Method) — `src/app/framework/services/popout-manager.service.ts:68`
- **`handlePopOutClosed`** (Method) — `src/app/framework/services/popout-manager.service.ts:174`
- **`getPanelTitle`** (Method) — `src/app/features/discover/discover.component.ts:197`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `buildWindowFeatures` | Function | `src/app/framework/models/popout.interface.ts` | 337 |
| `boolToYesNo` | Function | `src/app/framework/models/popout.interface.ts` | 351 |
| `openPopOut` | Method | `src/app/framework/services/popout-manager.service.ts` | 68 |
| `handlePopOutClosed` | Method | `src/app/framework/services/popout-manager.service.ts` | 174 |
| `getPanelTitle` | Method | `src/app/features/discover/discover.component.ts` | 197 |
| `popOutPanel` | Method | `src/app/features/discover/discover.component.ts` | 213 |
| `onChartPopOut` | Method | `src/app/features/discover/discover.component.ts` | 250 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `OnChartPopOut → BoolToYesNo` | intra_community | 5 |
| `OnChartPopOut → Close` | cross_community | 5 |
| `OnChartPopOut → GetPanelTitle` | intra_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Services | 1 calls |

## How to Explore

1. `gitnexus_context({name: "buildWindowFeatures"})` — see callers and callees
2. `gitnexus_query({query: "discover"})` — find related execution flows
3. Read key files listed above for implementation details
