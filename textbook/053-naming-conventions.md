# 053: Naming Conventions — Framework vs Domain

**Status:** Reference
**Depends On:** 051, 052
**Blocks:** All implementation phases

---

## Objective

Establish a clear distinction between **framework code** (domain-agnostic, reusable) and **domain code** (automobile-specific). This separation enables:

1. A smaller companion book for adding new domains (e.g., "Adding Agriculture to Vroom")
2. Clear understanding of which code changes when adding a new domain
3. Proper placement of new code during development

---

## Why This Matters

The vroom application is built on a **configuration-driven architecture**. The framework provides generic capabilities, and domain configuration tells it how to behave for a specific data domain.

**To add a new domain (e.g., agriculture), you only implement the right column.**

The framework code (left column) remains untouched.

---

## Framework vs Domain: Complete Reference

### Services

| Framework (Never Changes) | Domain-Specific (Per Domain) |
|---------------------------|------------------------------|
| `ResourceManagementService` | — |
| `UrlStateService` | — |
| `ApiService` | — |
| `RequestCoordinatorService` | — |
| `DomainConfigRegistry` | — |
| `DomainConfigValidator` | — |
| `PopOutContextService` | — |
| `PopOutManagerService` | — |
| `UserPreferencesService` | — |
| `FilterOptionsService` | — |
| `PickerConfigRegistry` | — |
| `ErrorNotificationService` | — |
| `HttpErrorInterceptor` | — |
| `GlobalErrorHandler` | — |

**Note:** Services are 100% framework. Domains don't create new services.

---

### Interfaces

| Framework (Never Changes) | Domain-Specific (Per Domain) |
|---------------------------|------------------------------|
| `DomainConfig<TFilters, TData, TStats>` | — |
| `IApiAdapter<TFilters, TData, TStats>` | `AutomobileApiAdapter` (implements) |
| `IFilterUrlMapper<TFilters>` | `AutomobileUrlMapper` (implements) |
| `ICacheKeyBuilder<TFilters>` | `AutomobileCacheKeyBuilder` (implements) |
| `ResourceState<TFilters, TData, TStats>` | — |
| `ApiResponse<TData>` | — |
| `FilterDefinition` | — |
| `TableConfig` | — |
| `PickerConfig` | — |
| `ChartConfig` | — |

---

### Models

| Framework (Never Changes) | Domain-Specific (Per Domain) |
|---------------------------|------------------------------|
| — | `AutoSearchFilters` |
| — | `HighlightFilters` |
| — | `VehicleResult` |
| — | `VinInstance` |
| — | `VehicleStatistics` |
| — | `ManufacturerStat` |
| — | `ModelStat` |
| — | `BodyClassStat` |
| — | `YearStat` |

**Note:** Models are 100% domain-specific. Each domain defines its own data shapes.

---

### Adapters

| Framework (Never Changes) | Domain-Specific (Per Domain) |
|---------------------------|------------------------------|
| Interface: `IApiAdapter` | `AutomobileApiAdapter` |
| Interface: `IFilterUrlMapper` | `AutomobileUrlMapper` |
| Interface: `ICacheKeyBuilder` | `AutomobileCacheKeyBuilder` |

**Pattern:** Framework defines interfaces. Domains implement them.

---

### Configurations

| Framework (Never Changes) | Domain-Specific (Per Domain) |
|---------------------------|------------------------------|
| — | `automobile.filter-definitions.ts` |
| — | `automobile.table-config.ts` |
| — | `automobile.picker-configs.ts` |
| — | `automobile.query-control-filters.ts` |
| — | `automobile.highlight-filters.ts` |
| — | `automobile.chart-configs.ts` |
| — | `automobile.domain-config.ts` |

---

### Chart Data Sources

| Framework (Never Changes) | Domain-Specific (Per Domain) |
|---------------------------|------------------------------|
| Interface: `ChartDataSource` | `ManufacturerChartSource` |
| — | `YearChartSource` |
| — | `BodyClassChartSource` |
| — | `TopModelsChartSource` |

---

### Components

| Framework (Never Changes) | Domain-Specific (Per Domain) |
|---------------------------|------------------------------|
| `BaseChartComponent` | — |
| `BasePickerComponent` | — |
| `BasicResultsTableComponent` | — |
| `ResultsTableComponent` | — |
| `DynamicResultsTableComponent` | — |
| `QueryPanelComponent` | — |
| `QueryControlComponent` | — |
| `StatisticsPanel2Component` | — |
| `DockviewStatisticsPanelComponent` | — |

**Note:** UI components are 100% framework. They render based on configuration.

---

### Feature Components

| Framework (Never Changes) | Domain-Specific (Per Domain) |
|---------------------------|------------------------------|
| `HomeComponent` | — |
| `PopoutComponent` | — |
| — | `AutomobileComponent` (landing) |
| — | `AutomobileDiscoverComponent` (main page) |

**Pattern:** The discover page is domain-specific because it wires up domain configuration. Popout is framework because it renders any domain's panels.

---

### Routes

| Framework (Never Changes) | Domain-Specific (Per Domain) |
|---------------------------|------------------------------|
| `/` (redirect) | — |
| `/home` | — |
| `/popout/:gridId/:componentId` | — |
| — | `/automobiles` |
| — | `/automobiles/discover` |

---

## Directory Structure

```
src/
├── app/
│   ├── app.component.ts           # Framework
│   ├── app.config.ts              # Framework
│   ├── app.routes.ts              # Framework + Domain routes
│   └── features/
│       ├── home/                  # Framework
│       ├── popout/                # Framework
│       └── automobile/            # DOMAIN-SPECIFIC
│           ├── automobile.component.ts
│           └── automobile-discover/
│
├── framework/                     # ALL FRAMEWORK
│   ├── components/
│   ├── models/
│   ├── services/
│   └── tokens/
│
├── domain-config/                 # ALL DOMAIN-SPECIFIC
│   ├── domain-providers.ts        # Registers all domains
│   └── automobile/
│       ├── adapters/
│       ├── chart-sources/
│       ├── configs/
│       ├── models/
│       ├── automobile.domain-config.ts
│       └── index.ts
│
└── environments/                  # Framework
```

---

## Observable Streams (Framework)

These observable names are **framework conventions** — they don't change per domain:

| Observable | Type | Description |
|------------|------|-------------|
| `state$` | `Observable<ResourceState>` | Complete state object |
| `filters$` | `Observable<TFilters>` | Current filter values |
| `results$` | `Observable<TData[]>` | Current page results |
| `totalResults$` | `Observable<number>` | Total count |
| `loading$` | `Observable<boolean>` | Loading state |
| `error$` | `Observable<Error \| null>` | Error state |
| `statistics$` | `Observable<TStats>` | Statistics data |
| `highlights$` | `Observable<any>` | Highlight filters |

---

## Methods (Framework)

These method names are **framework conventions**:

| Method | Signature | Description |
|--------|-----------|-------------|
| `updateFilters()` | `(partial: Partial<TFilters>) => void` | Update filters via URL |
| `clearFilters()` | `() => void` | Reset to defaults |
| `refresh()` | `() => void` | Re-fetch with current filters |
| `getCurrentState()` | `() => ResourceState` | Get state snapshot |
| `getCurrentFilters()` | `() => TFilters` | Get filters snapshot |

---

## Injection Tokens (Framework)

| Token | Type | Description |
|-------|------|-------------|
| `DOMAIN_CONFIG` | `InjectionToken<DomainConfig>` | Provides domain configuration |
| `IS_POPOUT_TOKEN` | `InjectionToken<boolean>` | Indicates pop-out context |

---

## What Changes When Adding a New Domain?

To add agriculture support to vroom, you would create:

```
src/domain-config/agriculture/
├── adapters/
│   ├── agriculture-url-mapper.ts      # Implements IFilterUrlMapper
│   ├── agriculture-api.adapter.ts     # Implements IApiAdapter
│   └── agriculture-cache-key-builder.ts
├── chart-sources/
│   ├── region-chart-source.ts
│   └── crop-chart-source.ts
├── configs/
│   ├── agriculture.filter-definitions.ts
│   ├── agriculture.table-config.ts
│   └── agriculture.chart-configs.ts
├── models/
│   ├── agriculture.filters.ts
│   ├── agriculture.data.ts
│   └── agriculture.statistics.ts
├── agriculture.domain-config.ts
└── index.ts

src/app/features/agriculture/
├── agriculture.component.ts
└── agriculture-discover/
    └── agriculture-discover.component.ts
```

And update:
- `src/domain-config/domain-providers.ts` (register the new domain)
- `src/app/app.routes.ts` (add agriculture routes)

**No changes to framework code.**

---

## Naming Patterns

### Domain Config Files

Pattern: `{domain}.{type}.ts`

Examples:
- `automobile.filter-definitions.ts`
- `automobile.table-config.ts`
- `agriculture.filter-definitions.ts`

### Adapter Classes

Pattern: `{Domain}{Type}` (PascalCase)

Examples:
- `AutomobileApiAdapter`
- `AutomobileUrlMapper`
- `AgricultureApiAdapter`

### Model Classes

Pattern: `{DomainEntity}` (domain-meaningful names)

Examples:
- `VehicleResult` (not `AutomobileResult`)
- `AutoSearchFilters` (not `AutomobileFilters`)
- `CropYield` (for agriculture)

### Feature Components

Pattern: `{Domain}DiscoverComponent`

Examples:
- `AutomobileDiscoverComponent`
- `AgricultureDiscoverComponent`

---

## Companion Book Scope

A companion book "Adding Agriculture to Vroom" would cover only:

| Phase | Documents | Content |
|-------|-----------|---------|
| API Contract | 1 | Agriculture endpoints |
| Domain Models | 3 | Filters, Data, Statistics |
| Domain Adapters | 3 | URL Mapper, API Adapter, Cache Key Builder |
| Domain Configs | 6 | Filter definitions, table, charts, etc. |
| Chart Sources | 2-4 | Domain-specific chart transformations |
| Feature Components | 2 | Landing page, Discover page |
| Routes | 1 | Add routes to app.routes.ts |
| **Total** | ~18 | ~150 pages |

Compare to the full vroom book: **65 documents, ~525 pages**.

The companion book is **~70% smaller** because all framework code is reused.

---

## Summary

| Category | Framework | Domain |
|----------|-----------|--------|
| Services | 14 | 0 |
| Interfaces | 10 | 0 (implement them) |
| Models | 0 | 9 |
| Adapters | 0 | 3 |
| Configs | 0 | 7 |
| Chart Sources | 0 | 4 |
| UI Components | 9 | 0 |
| Feature Components | 2 | 2 |
| **Effort to add domain** | 0% | 100% |

---

*This document is the key to understanding vroom's architecture. Consult it whenever uncertain about where new code belongs.*
