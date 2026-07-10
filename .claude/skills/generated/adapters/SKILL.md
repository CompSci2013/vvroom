---
name: adapters
description: "Skill for the Adapters area of vvroom. 39 symbols across 11 files."
---

# Adapters

39 symbols | 11 files | Cohesion: 95%

## When to Use

- Working with code in `src/`
- Understanding how generateTableConfig, getVisibleFields, createUrlMapper work
- Modifying adapters-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/framework/adapters/generic-url-mapper.ts` | GenericUrlMapper, createUrlMapper, constructor, buildUrlParamMap, toUrlParams (+10) |
| `src/app/framework/adapters/generic-api-adapter.ts` | GenericApiAdapter, createApiAdapter, fetchData, filtersToApiParams, handleSorting (+4) |
| `src/app/domain-config/automobile/adapters/automobile-cache-key-builder.ts` | AutomobileCacheKeyBuilder, buildKey, getFilterEntries, serializeValue, buildKey (+1) |
| `src/app/framework/models/resource-definition.interface.ts` | getVisibleFields, getApiParamName |
| `src/app/framework/utils/config-generators.ts` | generateTableConfig |
| `src/app/domain-config/automobile/automobile.domain-config.ts` | createAutomobileDomainConfig |
| `src/app/framework/components/base-chart/base-chart.component.ts` | ChartDataSource |
| `src/app/domain-config/automobile/chart-sources/year-chart-source.ts` | YearChartDataSource |
| `src/app/domain-config/automobile/chart-sources/top-models-chart-source.ts` | TopModelsChartDataSource |
| `src/app/domain-config/automobile/chart-sources/manufacturer-chart-source.ts` | ManufacturerChartDataSource |

## Entry Points

Start here when exploring this area:

- **`generateTableConfig`** (Function) — `src/app/framework/utils/config-generators.ts:56`
- **`getVisibleFields`** (Function) — `src/app/framework/models/resource-definition.interface.ts:578`
- **`createUrlMapper`** (Function) — `src/app/framework/adapters/generic-url-mapper.ts:447`
- **`createApiAdapter`** (Function) — `src/app/framework/adapters/generic-api-adapter.ts:294`
- **`createAutomobileDomainConfig`** (Function) — `src/app/domain-config/automobile/automobile.domain-config.ts:65`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `GenericUrlMapper` | Class | `src/app/framework/adapters/generic-url-mapper.ts` | 47 |
| `GenericApiAdapter` | Class | `src/app/framework/adapters/generic-api-adapter.ts` | 91 |
| `ChartDataSource` | Class | `src/app/framework/components/base-chart/base-chart.component.ts` | 39 |
| `YearChartDataSource` | Class | `src/app/domain-config/automobile/chart-sources/year-chart-source.ts` | 17 |
| `TopModelsChartDataSource` | Class | `src/app/domain-config/automobile/chart-sources/top-models-chart-source.ts` | 17 |
| `ManufacturerChartDataSource` | Class | `src/app/domain-config/automobile/chart-sources/manufacturer-chart-source.ts` | 18 |
| `BodyClassChartDataSource` | Class | `src/app/domain-config/automobile/chart-sources/body-class-chart-source.ts` | 17 |
| `AutomobileCacheKeyBuilder` | Class | `src/app/domain-config/automobile/adapters/automobile-cache-key-builder.ts` | 31 |
| `generateTableConfig` | Function | `src/app/framework/utils/config-generators.ts` | 56 |
| `getVisibleFields` | Function | `src/app/framework/models/resource-definition.interface.ts` | 578 |
| `createUrlMapper` | Function | `src/app/framework/adapters/generic-url-mapper.ts` | 447 |
| `createApiAdapter` | Function | `src/app/framework/adapters/generic-api-adapter.ts` | 294 |
| `createAutomobileDomainConfig` | Function | `src/app/domain-config/automobile/automobile.domain-config.ts` | 65 |
| `getApiParamName` | Function | `src/app/framework/models/resource-definition.interface.ts` | 599 |
| `fetchData` | Method | `src/app/framework/adapters/generic-api-adapter.ts` | 122 |
| `filtersToApiParams` | Method | `src/app/framework/adapters/generic-api-adapter.ts` | 144 |
| `handleSorting` | Method | `src/app/framework/adapters/generic-api-adapter.ts` | 188 |
| `findSortFieldName` | Method | `src/app/framework/adapters/generic-api-adapter.ts` | 218 |
| `findSortDirectionFieldName` | Method | `src/app/framework/adapters/generic-api-adapter.ts` | 230 |
| `addHighlightParams` | Method | `src/app/framework/adapters/generic-api-adapter.ts` | 242 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `FetchData → FindSortFieldName` | intra_community | 4 |
| `FetchData → FindSortDirectionFieldName` | intra_community | 4 |
| `CreateAutomobileDomainConfig → GetVisibleFields` | intra_community | 3 |
| `FetchData → GetApiParamName` | intra_community | 3 |
| `FetchData → AddHighlightParams` | intra_community | 3 |
| `FetchData → BuildHttpParams` | cross_community | 3 |
| `Constructor → GetUrlParamName` | intra_community | 3 |
| `BuildShareableUrl → GetUrlParamName` | intra_community | 3 |
| `BuildShareableUrl → SerializeValue` | intra_community | 3 |
| `ValidateUrlParams → GetUrlParamName` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Services | 1 calls |
| Models | 1 calls |

## How to Explore

1. `gitnexus_context({name: "generateTableConfig"})` — see callers and callees
2. `gitnexus_query({query: "adapters"})` — find related execution flows
3. Read key files listed above for implementation details
