# 🔍 Deep Anatomical Dissection: vvroom (Angular 14)

## 1. DOMAIN CONFIG ARCHITECTURE (ASCII Art)
The application follows a **Configuration-Driven, URL-First Architecture**. A single `DomainConfig` object acts as the central nervous system, injected via DI and consumed by framework services and UI components.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        APP BOOTSTRAP (AppModule)                    │
│  DI Token: DOMAIN_CONFIG → useFactory: createAutomobileDomainConfig │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   AUTOMOBILE DOMAIN CONFIGURATION                   │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │
│  │ Identity &  │ │ Type Models  │ │ Adapters     │ │ UI Configs │ │
│  │ API Base    │ │ (Filters,    │ │ (UrlMapper,  │ │ (Table,    │ │
│  │             │ │  Data, Stats)│ │  ApiAdapter, │ │  Filters,  │ │
│  └─────────────┘ └──────────────┘ │  CacheKey)   │ │  Charts,   │ │
│                                   └──────────────┘ │  Pickers)  │ │
│  ┌──────────────────────────────────────────────────────┐          │
│  │ Feature Flags (highlights, popOuts, rowExpansion...) │          │
│  └──────────────────────────────────────────────────────┘          │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ Injected via @Inject(DOMAIN_CONFIG)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     FRAMEWORK SERVICE LAYER                         │
│  ┌─────────────────────┐  ┌─────────────────────┐                  │
│  │ResourceManagement   │  │UrlStateService      │                  │
│  │Service              │  │(Router sync, URL    │                  │
│  │• Caches API calls   │  │ params → state)     │                  │
│  │• Coordinates        │  └─────────────────────┘                  │
│  │  requests via       │           ▲                               │
│  │  CacheKeyBuilder    │           │ Emits/Receives URL changes    │
│  └─────────────────────┘           │                               │
│           ▲                        │                               │
│           │ Consumes config        ▼                               │
│           └────────────────────────────────────────────────────────┘
└──────────────────────────────┬──────────────────────────────────────┘
                               │ Drives UI via @Input() domainConfig
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FEATURE COMPONENT LAYER                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ DiscoverComponent (Orchestrator)                            │   │
│  │ • Manages panel layout, drag-drop, collapse state           │   │
│  │ • Bridges PopOutManagerService ↔ ResourceManagementService  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│           │                │                │           │           │
│           ▼                ▼                ▼           ▼           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐  │
│  │QueryControl  │ │QueryPanel    │ │Statistics    │ │Results   │  │
│  │Component     │ │Component     │ │Panel2        │ │Table     │  │
│  │(Filter UI)   │ │(Pickers/     │ │(Charts)      │ │(Data)    │  │
│  │              │ │  Chips)      │ │              │ │          │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    POP-OUT ARCHITECTURE (CDK Portals)               │
│  Main Window URL ──► BroadcastChannel ──► PopOutContextService      │
│                            │                     │                  │
│                            ▼                     ▼                  │
│                     STATE_UPDATE          PanelPopoutComponent      │
│                     (Syncs state)         (Renders portal components│
│                                           via domainConfig)        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. ROUTING MAP (ASCII Art)
The app uses a **flat, portal-based routing strategy**. Pop-outs bypass Angular Router entirely, using `about:blank` CDK portals and `BroadcastChannel` for state sync.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ANGULAR ROUTER                              │
│  / (root)      ──►  /home (HomeComponent)                           │
│  /home         ──►  /home                                           │
│  /discover     ──►  /discover (DiscoverComponent) [Feature Grid]    │
│  /**           ──►  /home (Fallback)                                │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     URL PARAMETER PATTERNS                          │
│  ?manufacturer=Toyota&model=Camry&yearMin=2020&yearMax=2024         │
│  &bodyClass=SUV,Truck&instanceCountMin=10&search=camry              │
│  &modelCombos=Ford:F-150,Toyota:Camry&sortBy=year&sortOrder=desc    │
│  &page=1&size=20                                                    │
│  ── HIGHLIGHT PARAMS (h_ prefix) ──────────────────────────────────│
│  &h_manufacturer=Ford&h_yearMin=2015&h_yearMax=2020                 │
│  &h_bodyClass=SUV&h_modelCombos=Honda:Civic                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     POP-OUT ROUTING (NO ANGULAR ROUTES)             │
│  /discover ──► [Main Window] ──► popOutPanel('chart-manufacturer')  │
│                      │                                               │
│                      └──► CDK Portal → about:blank window            │
│                              │                                       │
│                              └──► PanelPopoutComponent               │
│                                  • Reads route params:               │
│                                    /panel/:gridId/:panelId/:type     │
│                                  • State synced via BroadcastChannel │
│                                  • URL remains clean (no query params)│
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. ELASTICSEARCH INTEGRATION
*Note: Elasticsearch is abstracted behind the `ApiService`. The frontend communicates via REST endpoints. The following describes the inferred backend DSL mapping based on the filter/statistics contracts.*

### 🔹 Index Patterns
```text
vehicles-*          → Aliased to `vehicles`
vehicles_stats-*    → Aliased to `vehicles_stats` (if pre-aggregated)
```

### 🔹 Query Construction (Filter → ES DSL Mapping)
| Frontend Filter | ES Query Context | DSL Pattern |
|----------------|------------------|-------------|
| `search` | `query` | `multi_match` on `manufacturer`, `model`, `body_class` |
| `manufacturer`, `model`, `bodyClass` | `filter` | `terms` or `match` (analyzed/keyword) |
| `yearMin`/`yearMax`, `instanceCountMin`/`instanceCountMax` | `filter` | `range` with `gte`/`lte` |
| `modelCombos` | `filter` | Custom parser → `terms` on nested `manufacturer:model` field |
| `h_*` (highlight params) | `filter` + `aggs` | Secondary filter context for segmented aggregations |
| `sortBy`/`sortOrder` | `sort` | `[{ field: { order: 'asc/desc' } }]` |
| `page`/`size` | `from`/`size` | Pagination offset/limit |

### 🔹 Result Mapping Flow
```
HTTP GET /vehicles/details?params
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│ Backend Response Structure                              │
│ {                                                        │
│   "data": [ { vehicle_id, manufacturer, model, ... } ], │
│   "total": 1247,                                        │
│   "page": 1, "size": 20, "totalPages": 63               │
│ }                                                        │
│                                                          │
│ GET /statistics (or embedded in details)                 │
│ {                                                        │
│   "byManufacturer": { "Toyota": { total: 234, highlighted: 45 } }, │
│   "byBodyClass": { "Sedan": { total: 456, highlighted: 78 } },     │
│   "byYearRange": { "2024": { total: 156, highlighted: 32 } },      │
│   "modelsByManufacturer": { "Ford": { "F-150": { total: 89, highlighted: 12 } } } │
│ }                                                        │
└─────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│ Frontend Mapping Layer                                  │
│ • VehicleResult.fromApiResponse() → Normalizes snake/camelCase │
│ • VehicleStatistics.fromApiResponse() → Detects segmented vs │
│   flat format, transforms to arrays for Plotly.js        │
│ • AutomobileCacheKeyBuilder → Hashes filters + highlights │
│   to prevent stale ES queries                            │
└─────────────────────────────────────────────────────────┘
```

---

## 4. FILE-BY-FILE ANATOMY

| File | Purpose | Key Exports | Framework Plug-in Point |
|------|---------|-------------|-------------------------|
| `automobile-cache-key-builder.ts` | Generates deterministic cache keys from filters/highlights for HTTP response caching | `AutomobileCacheKeyBuilder`, `DefaultCacheKeyBuilder` | Implements `ICacheKeyBuilder`; consumed by `RequestCoordinatorService` |
| `adapters/index.ts` | Barrel export for domain adapters | `AutomobileCacheKeyBuilder` | Simplifies imports; notes refactor to generic adapters |
| `automobile.domain-config.ts` | **Core config factory**. Assembles identity, models, adapters, UI configs, feature flags | `createAutomobileDomainConfig()`, `DOMAIN_PROVIDER` | Injected via `DOMAIN_CONFIG` token in `AppModule`; drives all framework components |
| `automobile.resource.ts` | **Single source of truth** for field definitions, endpoints, pagination, sorting, highlights | `AUTOMOBILE_RESOURCE`, helper getters | Consumed by `GenericUrlMapper`, `GenericApiAdapter`, `generateTableConfig()`, `generateFilterDefinitions()` |
| `body-class-chart-source.ts` | Transforms `VehicleStatistics.byBodyClass` into Plotly stacked bar chart data | `BodyClassChartDataSource` | Implements `ChartDataSource`; mapped in `domainConfig.chartDataSources` |
| `chart-sources/index.ts` | Barrel export for chart transformers | All chart sources | Simplifies imports in domain config |
| `manufacturer-chart-source.ts` | Transforms `byManufacturer` stats into Plotly chart | `ManufacturerChartDataSource` | Implements `ChartDataSource`; handles segmented highlighting |
| `top-models-chart-source.ts` | Transforms `topModels`/`modelsByManufacturer` into Plotly chart | `TopModelsChartDataSource` | Implements `ChartDataSource`; parses `Manufacturer:Model` format |
| `year-chart-source.ts` | Transforms `byYearRange` into Plotly chart | `YearChartDataSource` | Implements `ChartDataSource`; handles range parsing `min\|max` |
| `automobile.chart-configs.ts` | Defines chart metadata (ID, title, type, dimensions, visibility) | `AUTOMOBILE_CHART_CONFIGS` | Consumed by `StatisticsPanel2Component` to render chart grid |
| `automobile.highlight-filters.ts` | Defines UI controls for `h_*` parameters (segmented stats) | `AUTOMOBILE_HIGHLIGHT_FILTERS` | Consumed by `QueryControlComponent` for highlight filter dialogs |
| `automobile.picker-configs.ts` | Defines searchable multi-select tables (e.g., Manufacturer-Model) | `createManufacturerModelPickerConfig()`, `createAutomobilePickerConfigs()` | Registered in `PickerConfigRegistry`; used by `BasePickerComponent` |
| `automobile.query-control-filters.ts` | Defines primary filter UI controls (multiselect, range, chips) | `AUTOMOBILE_QUERY_CONTROL_FILTERS` | Consumed by `QueryControlComponent` to render filter chips/dialogs |
| `configs/index.ts` | Barrel export for UI configs | All config arrays | Simplifies imports in domain config |
| `automobile/index.ts` | Barrel export for domain module | `createAutomobileDomainConfig`, `DOMAIN_PROVIDER` | Used by `AppModule` for DI registration |
| `automobile.data.ts` | Domain data models: vehicle results & VIN instances | `VehicleResult`, `VinInstance` | Used by `GenericApiAdapter.dataTransformer`; bound to table rows |
| `automobile.filters.ts` | Filter model & highlight interface | `AutoSearchFilters`, `HighlightFilters` | Bound to URL state; drives `GenericUrlMapper` & API params |
| `automobile.statistics.ts` | Aggregated statistics models (manufacturer, model, body, year) | `VehicleStatistics`, `ManufacturerStat`, `ModelStat`, `BodyClassStat`, `YearStat` | Parsed by chart sources; drives statistics panel KPIs |
| `models/index.ts` | Barrel export for domain models | All models | Simplifies imports across domain |
| `automobile.component.ts` | Placeholder feature component for automobile domain | `AutomobileComponent` | Declared in `AppModule`; serves as route target if needed |
| `discover.component.ts` | **Main orchestrator**. Manages panel layout, drag-drop, pop-outs, state sync | `DiscoverComponent` | Injects `DOMAIN_CONFIG`; wires `ResourceManagementService`, `UrlStateService`, `PopOutManagerService` |
| `home.component.ts` | Landing page / domain selector | `HomeComponent` | Route target for `/home`; navigates to `/discover` |
| `panel-popout.component.ts` | Pop-out window container. Syncs state via `BroadcastChannel` | `PanelPopoutComponent` | Renders in `about:blank`; receives `STATE_UPDATE`; emits `URL_PARAMS_CHANGED` |
| `popout.component.ts` | Placeholder for future pop-out implementation | `PopoutComponent` | Not actively used; reserved for Phase 3B |
| `app-routing.module.ts` | Defines application routes | `AppRoutingModule` | Configures `RouterModule.forRoot`; flat routing strategy |
| `app.component.ts` | Root shell component | `AppComponent` | Bootstraps app; hosts router outlet |
| `app.module.ts` | Root module. Configures DI, providers, imports | `AppModule` | Registers `DOMAIN_CONFIG` factory; imports `FrameworkModule`, `PopoutModule` |
| `framework.module.ts` | Reusable framework components & services | `FrameworkModule` | Exports `BaseChartComponent`, `DynamicResultsTableComponent`, `QueryControlComponent`, etc. |
| `primeng.module.ts` | Centralized PrimeNG component exports | `PrimengModule` | Aggregates UI widgets; imported by `FrameworkModule` |

---

### 🔑 Key Architectural Insights
1. **Configuration-Driven UI**: `AUTOMOBILE_RESOURCE` → `Generic*` adapters → `DomainConfig` → Components. Zero hardcoded UI logic; everything is declarative.
2. **URL-First State**: `UrlStateService` is the single source of truth. Pop-outs don't manage router state; they sync via `BroadcastChannel` → `ResourceManagementService.state$`.
3. **Highlight/Segmentation Pattern**: `h_*` params trigger backend to return `{total, highlighted}` objects. Chart sources detect this format and render stacked bars automatically.
4. **Caching Strategy**: `AutomobileCacheKeyBuilder` serializes filters + highlights deterministically. `RequestCoordinatorService` deduplicates/caches identical API calls.
5. **Portal Pop-Outs**: Bypass Angular Router. Use CDK `Portal` → `about:blank` → `PanelPopoutComponent`. State flows unidirectionally: Main URL → BroadcastChannel → Pop-out Service → Components.