---
name: configs
description: "Skill for the Configs area of vvroom. 4 symbols across 3 files."
---

# Configs

4 symbols | 3 files | Cohesion: 75%

## When to Use

- Working with code in `src/`
- Understanding how createManufacturerModelPickerConfig, createAutomobilePickerConfigs, getMessages$ work
- Modifying configs-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/domain-config/automobile/configs/automobile.picker-configs.ts` | createManufacturerModelPickerConfig, createAutomobilePickerConfigs |
| `src/app/framework/services/popout-context.service.ts` | getMessages$ |
| `src/app/features/panel-popout/panel-popout.component.ts` | ngOnInit |

## Entry Points

Start here when exploring this area:

- **`createManufacturerModelPickerConfig`** (Function) — `src/app/domain-config/automobile/configs/automobile.picker-configs.ts:45`
- **`createAutomobilePickerConfigs`** (Function) — `src/app/domain-config/automobile/configs/automobile.picker-configs.ts:157`
- **`getMessages$`** (Method) — `src/app/framework/services/popout-context.service.ts:327`
- **`ngOnInit`** (Method) — `src/app/features/panel-popout/panel-popout.component.ts:102`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `createManufacturerModelPickerConfig` | Function | `src/app/domain-config/automobile/configs/automobile.picker-configs.ts` | 45 |
| `createAutomobilePickerConfigs` | Function | `src/app/domain-config/automobile/configs/automobile.picker-configs.ts` | 157 |
| `getMessages$` | Method | `src/app/framework/services/popout-context.service.ts` | 327 |
| `ngOnInit` | Method | `src/app/features/panel-popout/panel-popout.component.ts` | 102 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `NgOnInit → BuildHttpParams` | cross_community | 5 |
| `NgOnInit → BuildHttpParams` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Services | 1 calls |

## How to Explore

1. `gitnexus_context({name: "createManufacturerModelPickerConfig"})` — see callers and callees
2. `gitnexus_query({query: "configs"})` — find related execution flows
3. Read key files listed above for implementation details
