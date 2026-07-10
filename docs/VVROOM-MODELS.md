# 1. COMPLETE INTERFACE HIERARCHY (ASCII ART)

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Angular Core / Runtime Foundation                                                 │
│  • Type<T> (imported via @angular/core)                                            │
│  • InjectionToken<T> (imported via @angular/core)                                  │
│  • Params (imported via @angular/router)                                            │
│  • Observable<T> (imported via rxjs)                                               │
│  • Window, BroadcastChannel, RegExp (Browser/DOM)                                  │
└─────────────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  FRAMEWORK MODELS (Core Infrastructure)                                            │
│                                                                                   │
│  ├── DomainConfig<TFilters, TData, TStatistics = any>                             │
│  │   ├── DomainFeatures                                                          │
│  │   │   ├── highlights: boolean                                                 │
│  │   │   ├── popOuts: boolean                                                    │
│  │   │   ├── rowExpansion: boolean                                               │
│  │   │   ├── statistics?: boolean                                                │
│  │   │   ├── export?: boolean                                                    │
│  │   │   ├── columnManagement?: boolean                                          │
│  │   │   └── statePersistence?: boolean                                          │
│  │   ├── DomainMetadata                                                          │
│  │   ├── IApiAdapter<TFilters, TData, TStatistics>                               │
│  │   ├── IFilterUrlMapper<TFilters>                                             │
│  │   ├── ICacheKeyBuilder<TFilters>                                             │
│  │   ├── TableConfig<TData>                                                    │
│  │   │   └── PrimeNGColumn<TData>                                              │
│  │   ├── PickerConfig<T>                                                       │
│  │   │   ├── PickerApiConfig<T>                                                │
│  │   │   │   └── PickerApiParams                                               │
│  │   │   │   └── PickerApiResponse<T>                                            │
│  │   │   ├── PickerRowConfig<T>                                                │
│  │   │   ├── PickerSelectionConfig<T>                                          │
│  │   │   ├── PickerPaginationConfig                                            │
│  │   │   ├── PickerCachingConfig                                               │
│  │   │   └── PickerSelectionEvent<T>                                           │
│  │   │   └── PickerState<T>                                                    │
│  │   ├── FilterDefinition (Table UI config)                                    │
│  │   ├── QueryFilterDefinition<T> (alias FilterDefinition<T>)                  │
│  │   ├── QueryFilterOption (alias FilterOption)                                │
│  │   ├── ChartConfig                                                           │
│  │   ├── ResourceDefinition                                                  │
│  │   │   ├── ResourceField                                                   │
│  │   │   ├── ResourceEndpoints                                               │
│  │   │   ├── ResourcePagination                                              │
│  │   │   ├── ResourceSorting                                                 │
│  │   │   └── ResourceHighlights                                              │
│  │   ├── PopOutMessage<T>                                                    │
│  │   └── PopOutWindowRef / PopOutWindowFeatures / PopOutRouteParams / PopOutContext │
│                                                                                   │
│  ├── ApiModels                                                                   │
│  │   ├── ApiResponse<TData>                                                    │
│  │   ├── ApiErrorResponse                                                      │
│  │   ├── ApiSuccessResponse<TData>                                             │
│  │   └── StandardApiResponse<TData> = (ApiSuccessResponse<TData> | ApiErrorResponse) │
│  │   └── AiModels: ChatRole, ImageAttachment, ChatMessage, ExtractedQuery,       │
│  │        AiServiceConfig, OllamaGenerateRequest/Response, OllamaChatRequest/Response, │
│  │        ChatSession, ApiContext, ApiEndpointInfo, ApiParameterInfo, ApiFieldInfo │
│  │   └── ResourceManagementModels: ApiAdapterResponse<TData, TStatistics>,       │
│  │        ResourceManagementConfig<TFilters, TData, TStatistics>,                │
│  │        ResourceState<TFilters, TData, TStatistics>                            │
│  │   └── TableModels: TableState<T>                                            │
│  │   └── PaginationModels: PaginationParams, PaginationMetadata, SortParams      │
│  │   └── ErrorModels: ErrorCategory, ErrorSeverity, ErrorNotification,           │
│  │        ErrorDisplayOptions, ERROR_CATEGORY_SEVERITY_MAP, etc.                 │
│  │   └── TokenModels: IS_POPOUT_TOKEN                                           │
└─────────────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  DOMAIN MODELS (Automobile / vvroom)                                               │
│                                                                                   │
│  ├── AutoSearchFilters (extends no interface, class with Partial<AutoSearchFilters>) │
│  │   └── Contains: manufacturer, model, yearMin, yearMax, bodyClass,             │
│  │        instanceCountMin, instanceCountMax, page, size, sort, sortDirection,     │
│  │        search, modelCombos                                                      │
│  ├── HighlightFilters (interface)                                                │
│  │   └── Contains: yearMin, yearMax, manufacturer, modelCombos, bodyClass         │
│  ├── VehicleResult (class, Partial<VehicleResult>)                               │
│  │   └── Contains: vehicle_id, manufacturer, model, year, body_class,            │
│  │        instance_count, first_seen, last_seen, drive_type, engine,             │
│  │        transmission, fuel_type, vehicle_class                                   │
│  ├── VinInstance (class, Partial<VinInstance>)                                   │
│  │   └── Contains: vin, vehicle_id, registration_date, registration_state,      │
│  │        odometer_reading, status, color, owner_id, last_updated                │
│  ├── VehicleStatistics (class, Partial<VehicleStatistics>)                       │
│  │   └── Contains: totalVehicles, totalInstances, manufacturerCount,             │
│  │        modelCount, bodyClassCount, yearRange, averageInstancesPerVehicle,      │
│  │        medianInstancesPerVehicle, topManufacturers, topModels,                 │
│  │        bodyClassDistribution, yearDistribution, manufacturerDistribution,       │
│  │        byManufacturer, byBodyClass, byYearRange, modelsByManufacturer          │
│  │   └── Uses: ManufacturerStat, ModelStat, BodyClassStat, YearStat              │
│  ├── ManufacturerStat (class, Partial<ManufacturerStat>)                         │
│  │   └── Contains: name, count, instanceCount, percentage, modelCount            │
│  ├── ModelStat (class, Partial<ModelStat>)                                       │
│  │   └── Contains: name, manufacturer, count, instanceCount, percentage          │
│  ├── BodyClassStat (class, Partial<BodyClassStat>)                               │
│  │   └── Contains: name, count, instanceCount, percentage                        │
│  └── YearStat (class, Partial<YearStat>)                                         │
│      └── Contains: year, count, instanceCount, percentage                        │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 2. DATA MODEL DIAGRAM (ASCII ART)

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                     AUTOMOBILE DOMAIN DATA MODEL                                    │
│                                                                                   │
│  [AutoSearchFilters] ─────┐                                                       │
│  [HighlightFilters] ──────┤  (Filters/H-* Params)                                 │
│                           ▼                                                       │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  API / BACKEND LAYER                                                        │  │
│  │  • /vehicles/search  -> returns paginated VehicleResult[]                   │  │
│  │  • /vehicles/stats   -> returns aggregated statistics & segmentations        │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                           ▲                                                       │
│                           │  (Data Population)                                      │
│  ┌───────────────────────┴───────────────────────────────────────────────────────┐  │
│  │  VEHICLE RESULT ENTITY                                                      │  │
│  │  + vehicle_id: string (Composite Key)                                       │  │
│  │  + manufacturer: string                                                     │  │
│  │  + model: string                                                            │  │
│  │  + year: number                                                             │  │
│  │  + body_class: string                                                       │  │
│  │  + instance_count: number                                                   │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                           │ 1                                                     │
│                           │ *  (1 VehicleConfig → N VINs)                         │
│                           ▼                                                       │
│  ┌───────────────────────┴───────────────────────────────────────────────────────┐  │
│  │  VIN INSTANCE ENTITY                                                        │  │
│  │  + vin: string (17-char identifier)                                         │  │
│  │  + vehicle_id: string (FK -> VehicleResult.vehicle_id)                      │  │
│  │  + registration_date, state, odometer, status, color, owner_id,             │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                   │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  STATISTICS AGGREGATION TREE                                                │  │
│  │  [VehicleStatistics]                                                       │  │
│  │  ├── [ManufacturerStat[]]  (by: name)                                      │  │
│  │  ├── [ModelStat[]]       (by: name + manufacturer)                         │  │
│  │  ├── [BodyClassStat[]]   (by: name)                                      │  │
│  │  └── [YearStat[]]        (by: year)                                      │  │
│  │                                                                      │  │
│  │  [ModelStat.manufacturer] ─── references ─── [ManufacturerStat.name]     │  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                   │
│  ┌───────────────────────────────────────────────────────────────────────────────┐  │
│  │  CHART / HIGHLIGHT SEGMENTATION MAPPING                                     │  │
│  │  • byManufacturer: Record<string, {total, highlighted}>                     │  │
│  │  • byBodyClass: Record<string, {total, highlighted}>                        │  │
│  │  • byYearRange: Record<string, {total, highlighted}>                        │  │
│  │  • modelsByManufacturer: Record<string, Record<string, {total, highlighted}>>│  │
│  └───────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 3. INJECTION TOKEN MAP

| Token Name | Type Parameter | Provides / Resolves To | Injected By | Usage Context |
|------------|----------------|------------------------|-------------|---------------|
| `IS_POPOUT_TOKEN` | `boolean` | `boolean` flag indicating whether the current execution context is running inside a secondary pop-out window | Pop-out window controllers, services (e.g., `ResourceManagementService`, `PopOutBridgeService`) | Conditional logic to disable auto-fetch, suppress toast notifications, or adjust UI binding when running in a child window. |
| *(Implicit Angular Tokens)* | | | | |
| `APP_INITIALIZER` | `() => Promise<any> \| void` | Multi-provider array for bootstrap-time initialization | Framework bootstrap, `DomainConfig` registrars | Lazy-loading domain assets, resolving API base URLs, pre-caching static filters. |
| `DOCUMENT` | `Document` | The browser's `window.document` | Pop-out window openers, `buildWindowFeatures`, route parsers | DOM manipulation, window size constraints, pop-out generation. |
| `PLATFORM_ID` | `Object` | `'server'` or `'browser'` | App lifecycle hooks, token guards | SSR compatibility, avoiding `window.Broadc...` access on Node. |

*(Note: Only `IS_POPOUT_TOKEN` is explicitly declared in the provided source. Standard Angular v14 DI primitives are listed for completeness.)*

---

# 4. FILE-BY-FILE ANATOMY

### `src/app/domain-config/automobile/models/automobile.data.ts`
**Purpose:** Core domain data contracts representing vehicle configurations and their constituent VINs. Acts as the primary DTO for API results and row expansion.
**Key Types & Generics:**
- `VehicleResult` (class) → `Partial<VehicleResult>` (constructor/factory)
  - Props: `vehicle_id`, `manufacturer`, `model`, `year`, `body_class`, `instance_count`, `first_seen?`, `last_seen?`, `drive_type?`, `engine?`, `transmission?`, `fuel_type?`, `vehicle_class?`
  - Methods: `fromApiResponse`, `getDisplayName`, `getFullDescription`, `hasInstances`, `getAge`, `isCurrentYear`
- `VinInstance` (class) → `Partial<VinInstance>` (constructor/factory)
  - Props: `vin`, `vehicle_id`, `registration_date?`, `registration_state?`, `odometer_reading?`, `status?`, `color?`, `owner_id?`, `last_updated?`
  - Methods: `fromApiResponse`, `getFormattedVin`, `isValidLength`
**Relationships:**
- `VinInstance.vehicle_id` is a foreign key to `VehicleResult.vehicle_id`.
- 1:∞ Cardinality: One `VehicleResult` aggregates multiple `VinInstance` records.
- Feeds `TableConfig<TData>` and `ResourceState` in the framework.

### `src/app/domain-config/automobile/models/automobile.filters.ts`
**Purpose:** Query parameter and UI filter contracts. Separates primary search (`AutoSearchFilters`) from statistical highlighting (`HighlightFilters`) to support dual `h_*` parameter strategy.
**Key Types & Generics:**
- `HighlightFilters` (interface)
  - Props: `yearMin?`, `yearMax?`, `manufacturer?`, `modelCombos?`, `bodyClass?`
- `AutoSearchFilters` (class) → `Partial<AutoSearchFilters>` (factory/merge/clear)
  - Props: `manufacturer?`, `model?`, `yearMin?`, `yearMax?`, `bodyClass?` (string∣string[]), `instanceCountMin?`, `instanceCountMax?`, `page?`, `size?`, `sort?`, `sortDirection?`, `search?`, `modelCombos?`
  - Methods: `fromPartial`, `getDefaults`, `isEmpty`, `clone`, `merge`, `clearSearch`
**Relationships:**
- Shares 5 overlapping fields with `HighlightFilters` but different scope.
- `HighlightFilters` maps directly to `h_*` URL params for segmented `VehicleStatistics`.
- `AutoSearchFilters` maps to standard `/search` query params and drives `IFilterUrlMapper<TFilters>`.

### `src/app/domain-config/automobile/models/automobile.statistics.ts`
**Purpose:** Aggregated analytics model for charts, stats panels, and UI-driven segmentation. Transforms raw API payloads into display-ready metric arrays and nested highlight maps.
**Key Types & Generics:**
- `VehicleStatistics` (class) → `Partial<VehicleStatistics>`
  - Props: `totalVehicles`, `totalInstances`, `manufacturerCount`, `modelCount`, `bodyClassCount?`, `yearRange: {min, max}`, `averageInstancesPerVehicle`, `medianInstancesPerVehicle?`, `topManufacturers?`, `topModels?`, `bodyClassDistribution?`, `yearDistribution?`, `manufacturerDistribution?`, `byManufacturer?`, `byBodyClass?`, `byYearRange?`, `modelsByManufacturer?`
- `ManufacturerStat` (class) → `Partial<ManufacturerStat>`
  - Props: `name`, `count`, `instanceCount?`, `percentage`, `modelCount?`
- `ModelStat` (class) → `Partial<ModelStat>`
  - Props: `name`, `manufacturer`, `count`, `instanceCount`, `percentage`
- `BodyClassStat` (class) → `Partial<BodyClassStat>`
  - Props: `name`, `count`, `instanceCount?`, `percentage`
- `YearStat` (class) → `Partial<YearStat>`
  - Props: `year`, `count`, `instanceCount?`, `percentage`
**Relationships:**
- `VehicleStatistics` contains composite stat arrays referencing `ManufacturerStat`, `ModelStat`, `BodyClassStat`, `YearStat`.
- `ModelStat.manufacturer` is a logical FK to `ManufacturerStat.name`.
- Raw segment maps (`byManufacturer`, `modelsByManufacturer`, etc.) are preserved verbatim for `ChartConfig` data sources.
- Factory methods handle snake_case/camelCase API variance and compute percentages/distributions in-memory.

### `src/app/domain-config/automobile/models/index.ts`
**Purpose:** Barrel export aggregator. Routes all domain-specific exports into a single public API surface (`src/app/domain-config/automobile/`).
**Relationships:** Re-exports `AutoSearchFilters`, `HighlightFilters`, `VehicleResult`, `VinInstance`, `VehicleStatistics`, and all stat classes. No dependencies outside the `automobile/` namespace.

### `src/app/framework/models/ai.models.ts`
**Purpose:** LLM service contracts for multimodal AI interaction (Ollama). Defines chat state, request/response payloads, and domain-aware API context extraction.
**Key Types & Generics:**
- `ChatRole` (union)
- `ImageAttachment` (interface)
- `ChatMessage` (interface)
- `ExtractedQuery` (interface)
- `AiServiceConfig` (interface)
- `OllamaGenerateRequest/Response`, `OllamaChatRequest/Response` (interfaces)
- `ChatSession` (interface)
- `ApiContext`, `ApiEndpointInfo`, `ApiParameterInfo`, `ApiFieldInfo` (interfaces)
**Relationships:**
- `ChatSession.messages: ChatMessage[]` → `ChatMessage.extractedQuery?: ExtractedQuery`
- `ApiContext.endpoints: ApiEndpointInfo[]` → `ApiEndpointInfo.parameters: ApiParameterInfo[]`
- Used by AI service layer to parse natural language into `AutoSearchFilters` or `HighlightFilters`.

### `src/app/framework/models/api-response.interface.ts`
**Purpose:** Standardized HTTP response envelopes. Enforces consistent pagination and error handling across all domain APIs.
**Key Types & Generics:**
- `ApiResponse<TData>` (interface)
- `ApiErrorResponse` (interface)
- `ApiSuccessResponse<TData>` (interface)
- `StandardApiResponse<TData>` (type alias)
**Relationships:**
- `StandardApiResponse<TData>` = `ApiSuccessResponse<TData>` ∣ `ApiErrorResponse`
- `ApiSuccessResponse<TData>.data: TData` wraps domain models (`VehicleResult`, `VehicleStatistics`, etc.)
- `ApiResponse<TData>` acts as the main paginated list wrapper.

### `src/app/framework/models/domain-config.interface.ts`
**Purpose:** Master configuration schema for the domain-driven framework. Ties together adapters, mappers, UI configs, feature flags, and chart definitions into a single type-safe registry object.
**Key Types & Generics:**
- `DomainConfig<TFilters, TData, TStatistics = any>` (interface)
- `DomainFeatures`, `DomainMetadata`, `FilterFormat`, `FilterNumberFormat`, `FilterDateFormat`
- `FilterDefinition` (table UI), `FilterType`, `FilterOperator`, `FilterOption`, `FilterValidation`
- `ChartConfig`, `ChartType`
- `ConfigValidationError`, `ConfigErrorType`, `ConfigValidationResult`
- `DEFAULT_DOMAIN_FEATURES`, `mergeDomainFeatures`
**Relationships:**
- Contains `IApiAdapter<TFilters, TData, TStatistics>`, `IFilterUrlMapper<TFilters>`, `ICacheKeyBuilder<TFilters>`
- Contains `TableConfig<TData>`, `PickerConfig<T>`, `QueryFilterDefinition<TFilters>`, `ChartConfig[]`
- Uses `Type<T>` from `@angular/core` for model constructors.
- `QueryFilterDefinition<T>` is an alias for `FilterDefinition<T>` from `filter-definition.interface.ts`.

### `src/app/framework/models/error-notification.interface.ts`
**Purpose:** Structured error categorization and routing system. Maps HTTP codes/error codes to UI severity levels and PrimeNG toast formats.
**Key Types & Generics:**
- `ErrorCategory` (enum)
- `ErrorSeverity` (type alias)
- `ErrorNotification`, `ErrorDisplayOptions`
- `DEFAULT_ERROR_DISPLAY_OPTIONS`, `ERROR_CATEGORY_SEVERITY_MAP`
- `getErrorCategoryFromStatus`, `getErrorCategoryFromCode`, `createErrorNotificationFromHttpError/Error`, `getSummaryForCategory`
**Relationships:**
- `ErrorNotification.category: ErrorCategory` → mapped to `ErrorSeverity`
- Utility functions provide fallback categorization logic when HTTP status/code is absent.

### `src/app/framework/models/filter-definition.interface.ts`
**Purpose:** Generic filter schema for the Query Control component. Defines field-level metadata, URL param mapping, and range picker configuration.
**Key Types & Generics:**
- `RangeConfig` (interface)
- `FilterDefinition<T = any>` (interface)
- `FilterOption` (interface)
**Relationships:**
- `FilterDefinition<T>.field: keyof T` binds to the concrete filter model.
- `urlParams: string | {min: string, max: string}` drives `IFilterUrlMapper<TFilters>`.
- Exported as `QueryFilterDefinition<T>` via barrel to avoid naming collision with table `FilterDefinition`.

### `src/app/framework/models/index.ts`
**Purpose:** Central barrel aggregator for all framework models. Re-exports with explicit aliasing for `QueryFilterDefinition`/`QueryFilterOption`.
**Relationships:** Aggregates `ai.models`, `api-response.interface`, `domain-config.interface`, `error-notification.interface`, `filter-definition.interface`, `pagination.interface`, `picker-config.interface`, `popout.interface`, `resource-management.interface`, `table-config.interface`.

### `src/app/framework/models/pagination.interface.ts`
**Purpose:** Generic pagination and sorting contracts. Decouples UI table pagination from API pagination expectations.
**Key Types & Generics:**
- `PaginationParams`, `PaginationMetadata`, `SortParams`
**Relationships:**
- `PaginationParams` (page, size) consumed by `ResourceManagementConfig` and `ApiAdapter.fetchData`.
- `PaginationMetadata` returned by `ApiResponse<TData>`.
- `SortParams` maps to `TableConfig.sortField`/`sortOrder`.

### `src/app/framework/models/picker-config.interface.ts`
**Purpose:** Configuration-driven multi-select picker system. Handles server/client pagination, URL synchronization, row key generation, and `Observable`-based data fetching.
**Key Types & Generics:**
- `PickerApiConfig<T>`, `PickerApiParams`, `PickerApiResponse<T>`
- `PickerRowConfig<T>`, `PickerSelectionConfig<T>`, `PickerPaginationConfig`, `PickerCachingConfig`
- `PickerConfig<T>`, `PickerSelectionEvent<T>`, `PickerState<T>`
- `getDefaultPickerState<T>`
**Relationships:**
- `PickerConfig<T>` contains `PrimeNGColumn<T>` (from `table-config.interface`).
- `PickerApiConfig<T>.fetchData` returns `Observable<any>`.
- `PickerSelectionConfig<T>.serializer/deserializer` bridges `URL` state ↔ `Selection` state.
- `PickerState<T>` tracks UI/runtime state for the picker component.

### `src/app/framework/models/popout.interface.ts`
**Purpose:** Cross-window communication schema using `BroadcastChannel`. Defines pop-out routing, window feature configuration, and event payloads.
**Key Types & Generics:**
- `PopOutMessage<T>`, `PopOutMessageType` (enum)
- `PickerSelectionPayload`, `PopOutWindowRef`, `PopOutWindowFeatures`
- `PopOutRouteParams`, `PopOutContext`
- `buildWindowFeatures`, `parsePopOutRoute`
**Relationships:**
- `PopOutMessage<T>` payload type varies per `PopOutMessageType`.
- `PopOutWindowRef.channel: BroadcastChannel` is the transport layer.
- `PopOutContext` is derived from route parsing and gates pop-out specific logic.

### `src/app/framework/models/resource-definition.interface.ts`
**Purpose:** Convention-over-configuration metadata schema. Single source of truth for auto-generating URL mappers, API adapters, table columns, and filter definitions from declarative field definitions.
**Key Types & Generics:**
- `ResourceFieldType` (union)
- `ResourceField`, `ResourcePagination`, `ResourceSorting`, `ResourceEndpoints`, `ResourceHighlights`
- `ResourceDefinition` (master schema)
- `FilterableFields<T>`, `SortableFields<T>`, `VisibleFields<T>` (mapped types)
- `DEFAULT_PAGINATION`, `DEFAULT_SORTING`, `DEFAULT_HIGHLIGHTS`
- `getFilterableFields`, `getSortableFields`, `getVisibleFields`, `getHighlightableFields`, `getUrlParamName`, `getApiParamName`, `groupRangeFields`, `findField`, `findFieldByUrlParam`
**Relationships:**
- `ResourceField.rangeField`/`rangeRole` pairs generate unified range controls.
- `customUrlParser`/`customUrlSerializer`/`customApiMapper` act as escape hatches for non-standard URL/API shapes.
- Feeds `IFilterUrlMapper`, `IApiAdapter`, and `FilterDefinition` generation pipelines.

### `src/app/framework/models/resource-management.interface.ts`
**Purpose:** Service-layer contracts for stateful data fetching, cache key generation, and filter-to-URL synchronization. Bridges the `DomainConfig` registry with runtime `ResourceState`.
**Key Types & Generics:**
- `IFilterUrlMapper<TFilters>` (interface)
- `ApiAdapterResponse<TData, TStatistics>` (interface)
- `IApiAdapter<TFilters, TData, TStatistics>` (interface)
- `ICacheKeyBuilder<TFilters>` (interface)
- `ResourceManagementConfig<TFilters, TData, TStatistics>` (interface)
- `ResourceState<TFilters, TData, TStatistics>` (interface)
**Relationships:**
- `ResourceManagementConfig` instantiates `ResourceState<TFilters, TData, TStatistics>`.
- `IApiAdapter.fetchData` consumes `TFilters` and returns `Observable<ApiAdapterResponse>`.
- `IFilterUrlMapper` uses `Params` from `@angular/router`.
- `ICacheKeyBuilder` de-duplicates concurrent API calls based on filter+highlight signatures.

### `src/app/framework/models/table-config.interface.ts`
**Purpose:** Type-safe PrimeNG Table configuration system. Eliminates custom table wrappers by mapping `TableConfig<T>` directly to template bindings and runtime state.
**Key Types & Generics:**
- `PrimeNGColumn<T>` (interface)
- `TableConfig<T>` (interface)
- `TableState<T>` (interface)
- `getDefaultTableConfig<T>`, `getVisibleColumns<T>`, `getTableBindings<T>`
**Relationships:**
- `TableConfig<T>.columns: PrimeNGColumn<T>[]` → maps to `<p-table [columns]="columns">`.
- `TableState<T>` syncs with PrimeNG's `stateStorage` (`local`/`session`).
- `dataKey: keyof T` enables row tracking for `expandable`/`selectable` modes.
- `getStateBindings` converts config to bound attributes for template-driven rendering.

### `src/app/framework/tokens/popout.token.ts`
**Purpose:** Dependency injection marker for pop-out window context detection.
**Key Types & Generics:**
- `IS_POPOUT_TOKEN: InjectionToken<boolean>`
**Relationships:**
- Injected via `@Inject(IS_POPOUT_TOKEN)` into services/controllers.
- Binded at runtime by pop-out window bootstrap modules (`true`) and main window modules (`false`).
- Controls conditional branching for auto-fetch, toast suppression, and broadcast channel registration.

---
**Systemic Observations:**
1. **Generic Tightness:** Every model strictly uses `TData`, `TFilters`, `TStatistics` to maintain type safety across pagination, API responses, and statistics.
2. **Convention Over Configuration:** `ResourceDefinition` + `ResourceField` acts as a declarative registry that auto-generates mappers, adapters, and UI configs, reducing boilerplate for new domains.
3. **Dual Filter Strategy:** `AutoSearchFilters` (main search) and `HighlightFilters` (`h_*` params) are parallel but disjoint, enabling stacked bar charts without breaking pagination/sorting state.
4. **Pop-Out Architecture:** `BroadcastChannel`-based messaging (`PopOutMessage<T>`) and `IS_POPOUT_TOKEN` enable hardware-accelerated parallel panels with synchronized URL state.
5. **Error & AI Integration:** `ErrorNotification` routes to PrimeNG Toast with severity mapping. `AiModels` bridges natural language to structured `AutoSearchFilters`/`HighlightFilters` via `ExtractedQuery`.