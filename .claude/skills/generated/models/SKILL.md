---
name: models
description: "Skill for the Models area of vvroom. 40 symbols across 7 files."
---

# Models

40 symbols | 7 files | Cohesion: 96%

## When to Use

- Working with code in `src/`
- Understanding how generateFilterDefinitions, generateHighlightFilterDefinitions, getFilterableFields work
- Modifying models-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/domain-config/automobile/models/automobile.statistics.ts` | VehicleStatistics, fromApiResponse, fromSegmentedStats, transformByManufacturer, transformModelsByManufacturer (+10) |
| `src/app/framework/utils/config-generators.ts` | generateFilterDefinitions, generateFieldFilterDef, generateRangeFilterDef, getFilterType, toTitleCase (+1) |
| `src/app/domain-config/automobile/models/automobile.filters.ts` | AutoSearchFilters, fromPartial, getDefaults, clone, merge (+1) |
| `src/app/framework/models/error-notification.interface.ts` | getErrorCategoryFromStatus, getErrorCategoryFromCode, createErrorNotificationFromHttpError, createErrorNotificationFromError, getSummaryForCategory |
| `src/app/domain-config/automobile/models/automobile.data.ts` | VehicleResult, fromApiResponse, VinInstance, fromApiResponse |
| `src/app/framework/models/resource-definition.interface.ts` | getFilterableFields, groupRangeFields |
| `src/app/framework/services/error-notification.service.ts` | showHttpError, showGenericError |

## Entry Points

Start here when exploring this area:

- **`generateFilterDefinitions`** (Function) — `src/app/framework/utils/config-generators.ts:140`
- **`generateHighlightFilterDefinitions`** (Function) — `src/app/framework/utils/config-generators.ts:314`
- **`getFilterableFields`** (Function) — `src/app/framework/models/resource-definition.interface.ts:564`
- **`groupRangeFields`** (Function) — `src/app/framework/models/resource-definition.interface.ts:607`
- **`getErrorCategoryFromStatus`** (Function) — `src/app/framework/models/error-notification.interface.ts:177`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `VehicleStatistics` | Class | `src/app/domain-config/automobile/models/automobile.statistics.ts` | 31 |
| `ManufacturerStat` | Class | `src/app/domain-config/automobile/models/automobile.statistics.ts` | 486 |
| `ModelStat` | Class | `src/app/domain-config/automobile/models/automobile.statistics.ts` | 577 |
| `BodyClassStat` | Class | `src/app/domain-config/automobile/models/automobile.statistics.ts` | 679 |
| `YearStat` | Class | `src/app/domain-config/automobile/models/automobile.statistics.ts` | 759 |
| `AutoSearchFilters` | Class | `src/app/domain-config/automobile/models/automobile.filters.ts` | 84 |
| `VehicleResult` | Class | `src/app/domain-config/automobile/models/automobile.data.ts` | 29 |
| `VinInstance` | Class | `src/app/domain-config/automobile/models/automobile.data.ts` | 223 |
| `generateFilterDefinitions` | Function | `src/app/framework/utils/config-generators.ts` | 140 |
| `generateHighlightFilterDefinitions` | Function | `src/app/framework/utils/config-generators.ts` | 314 |
| `getFilterableFields` | Function | `src/app/framework/models/resource-definition.interface.ts` | 564 |
| `groupRangeFields` | Function | `src/app/framework/models/resource-definition.interface.ts` | 607 |
| `getErrorCategoryFromStatus` | Function | `src/app/framework/models/error-notification.interface.ts` | 177 |
| `getErrorCategoryFromCode` | Function | `src/app/framework/models/error-notification.interface.ts` | 207 |
| `createErrorNotificationFromHttpError` | Function | `src/app/framework/models/error-notification.interface.ts` | 243 |
| `createErrorNotificationFromError` | Function | `src/app/framework/models/error-notification.interface.ts` | 268 |
| `fromApiResponse` | Method | `src/app/domain-config/automobile/models/automobile.statistics.ts` | 221 |
| `fromSegmentedStats` | Method | `src/app/domain-config/automobile/models/automobile.statistics.ts` | 282 |
| `transformByManufacturer` | Method | `src/app/domain-config/automobile/models/automobile.statistics.ts` | 325 |
| `transformModelsByManufacturer` | Method | `src/app/domain-config/automobile/models/automobile.statistics.ts` | 356 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `ShowHttpError → GetErrorSignature` | cross_community | 4 |
| `ShowGenericError → GetErrorSignature` | cross_community | 4 |
| `FromApiResponse → ManufacturerStat` | intra_community | 4 |
| `FromApiResponse → ModelStat` | intra_community | 4 |
| `FromApiResponse → BodyClassStat` | intra_community | 4 |
| `FromApiResponse → YearStat` | intra_community | 4 |
| `GenerateHighlightFilterDefinitions → ToTitleCase` | intra_community | 3 |
| `GenerateHighlightFilterDefinitions → GetFilterType` | intra_community | 3 |
| `GenerateFilterDefinitions → ToTitleCase` | intra_community | 3 |
| `GenerateFilterDefinitions → GetFilterType` | intra_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Services | 2 calls |

## How to Explore

1. `gitnexus_context({name: "generateFilterDefinitions"})` — see callers and callees
2. `gitnexus_query({query: "models"})` — find related execution flows
3. Read key files listed above for implementation details
