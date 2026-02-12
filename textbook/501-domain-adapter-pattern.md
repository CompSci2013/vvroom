# 501: Domain Adapter Pattern

**Status:** Complete
**Depends On:** 306-resource-management-service, 403-domain-filter-statistics-models
**Blocks:** 502-url-mapper-adapter, 503-api-adapter

---

## Learning Objectives

After completing this section, you will:
- Understand the Adapter pattern and why it enables domain-agnostic framework code
- Know the three adapter interfaces: IFilterUrlMapper, IApiAdapter, ICacheKeyBuilder
- Recognize how adapters bridge domain-specific logic to framework services
- Be able to design domain adapters for new business domains

---

## Objective

Establish the adapter pattern that allows the framework's `ResourceManagementService` to work with any business domain. Define the interfaces that domain-specific adapters must implement.

---

## Why

The `ResourceManagementService` (Section 306) provides:
- URL-First state management
- Automatic data fetching on filter changes
- Response caching and deduplication
- Loading/error state management

But this service doesn't know about vehicles, manufacturers, or body classes. It doesn't know how to:
- Convert filters to URL parameters
- Make API calls for vehicle data
- Build cache keys for specific queries

### The Adapter Pattern

Adapters bridge the gap between generic framework code and domain-specific logic:

```
┌─────────────────────────────────────────────────────────────┐
│                    ResourceManagementService                 │
│  (Generic: works with any TFilters, TData, TStatistics)     │
└──────────────────────────────────────────────────────────────┘
                              │
                              │ uses interfaces
                              ▼
┌──────────────────────────────────────────────────────────────┐
│  IFilterUrlMapper    IApiAdapter      ICacheKeyBuilder       │
│  (interface)         (interface)      (interface)            │
└──────────────────────────────────────────────────────────────┘
                              │
                              │ implemented by
                              ▼
┌──────────────────────────────────────────────────────────────┐
│  AutomobileUrlMapper  AutomobileApiAdapter  AutomobileCacheKeyBuilder │
│  (concrete)           (concrete)            (concrete)                │
└──────────────────────────────────────────────────────────────┘
```

The framework depends on **interfaces** (abstractions), not concrete implementations. Domain modules provide concrete implementations.

### Why Three Adapters?

Each adapter handles one responsibility:

| Adapter | Responsibility | Interface |
|---------|---------------|-----------|
| URL Mapper | Convert filters ↔ URL params | `IFilterUrlMapper<TFilters>` |
| API Adapter | Fetch data from backend | `IApiAdapter<TFilters, TData, TStats>` |
| Cache Key Builder | Create unique cache keys | `ICacheKeyBuilder<TFilters>` |

**Separation of concerns:** Each adapter does one thing well. This makes them:
- Easy to test individually
- Easy to replace or mock
- Easy to understand

### Interface-Based Polymorphism

The framework uses TypeScript generics to work with any domain:

```typescript
// Framework service (domain-agnostic)
class ResourceManagementService<TFilters, TData, TStatistics> {
  private urlMapper: IFilterUrlMapper<TFilters>;
  private apiAdapter: IApiAdapter<TFilters, TData, TStatistics>;

  // Works with any domain that provides adapters
  updateFilters(partial: Partial<TFilters>): void { ... }
  fetchData(): void { ... }
}

// Automobile domain provides concrete types
type AutoFilters = AutoSearchFilters;
type AutoData = VehicleResult;
type AutoStats = VehicleStatistics;

// ResourceManagementService<AutoFilters, AutoData, AutoStats>
```

---

## What

### Step 501.1: Review the Adapter Interfaces

The adapter interfaces are defined in `src/app/framework/models/resource-management.interface.ts`. Review them to understand the contract each adapter must fulfill.

**IFilterUrlMapper Interface:**

```typescript
/**
 * Adapter for mapping filters to/from URL parameters
 */
export interface IFilterUrlMapper<TFilters> {
  /**
   * Convert filters to URL query parameters
   */
  toUrlParams(filters: TFilters): Params;

  /**
   * Convert URL query parameters to filters
   */
  fromUrlParams(params: Params): TFilters;

  /**
   * Extract highlight filters from URL parameters (optional)
   */
  extractHighlights?(params: Params): any;
}
```

**IApiAdapter Interface:**

```typescript
/**
 * Adapter for fetching data from API
 */
export interface IApiAdapter<TFilters, TData, TStatistics = any> {
  /**
   * Fetch data from API based on filters
   */
  fetchData(
    filters: TFilters,
    highlights?: any
  ): Observable<ApiAdapterResponse<TData, TStatistics>>;
}

/**
 * Response from API adapter
 */
export interface ApiAdapterResponse<TData, TStatistics = any> {
  results: TData[];
  total: number;
  statistics?: TStatistics;
}
```

**ICacheKeyBuilder Interface:**

```typescript
/**
 * Adapter for building cache keys from filters
 */
export interface ICacheKeyBuilder<TFilters> {
  /**
   * Build a unique cache key from filters
   */
  buildKey(filters: TFilters, highlights?: any): string;
}
```

---

### Step 501.2: Create the Adapters Directory

Create the directory structure for automobile domain adapters:

```bash
$ mkdir -p src/app/domains/automobile/adapters
$ touch src/app/domains/automobile/adapters/index.ts
```

Create the barrel file `src/app/domains/automobile/adapters/index.ts`:

```typescript
// src/app/domains/automobile/adapters/index.ts
// VERSION 1 (Section 501) - Automobile domain adapters barrel

// URL Mapper (Section 502)
// export * from './automobile-url-mapper';

// API Adapter (Section 503)
// export * from './automobile-api.adapter';

// Cache Key Builder (Section 503)
// export * from './automobile-cache-key.builder';
```

---

### Step 501.3: Understand Adapter Usage

The adapters are provided to `ResourceManagementService` via a configuration object:

```typescript
// In domain config factory
const resourceConfig: ResourceManagementConfig<
  AutoSearchFilters,
  VehicleResult,
  VehicleStatistics
> = {
  filterMapper: new AutomobileUrlMapper(),
  apiAdapter: new AutomobileApiAdapter(apiService, baseUrl),
  cacheKeyBuilder: new AutomobileCacheKeyBuilder(),
  defaultFilters: AutoSearchFilters.getDefaults(),
  autoFetch: true,
  cacheTTL: 30000
};

// ResourceManagementService uses these adapters
const resourceService = new ResourceManagementService(
  urlStateService,
  requestCoordinator,
  resourceConfig
);
```

The adapters form the bridge between:
1. **URL** (user-facing state)
2. **Filters** (domain-specific parameters)
3. **API** (backend data source)
4. **Cache** (request deduplication)

---

## Verification

### 1. Check Directory Exists

```bash
$ ls -la src/app/domains/automobile/adapters/
```

### 2. Review Interface File

```bash
$ cat src/app/framework/models/resource-management.interface.ts
```

Ensure the interface exports include:
- `IFilterUrlMapper<TFilters>`
- `IApiAdapter<TFilters, TData, TStatistics>`
- `ICacheKeyBuilder<TFilters>`
- `ApiAdapterResponse<TData, TStatistics>`
- `ResourceManagementConfig<TFilters, TData, TStatistics>`

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| "Generic type requires arguments" | Missing type parameters | Provide `<TFilters, TData>` when implementing |
| Method signature mismatch | Wrong parameter/return types | Match interface signature exactly |
| Cannot find interface | Import path wrong | Import from `@app/framework/models` |
| "Property is missing" | Interface not fully implemented | Implement all required methods |

---

## Key Takeaways

1. **Adapters enable domain-agnostic frameworks** — Framework code works with interfaces, not implementations
2. **Three adapters, three responsibilities** — URL mapping, API fetching, cache key building
3. **TypeScript generics preserve type safety** — `IApiAdapter<AutoFilters, VehicleResult>` is type-safe
4. **Separation enables testing** — Each adapter can be unit tested in isolation

---

## Acceptance Criteria

- [ ] Adapter interfaces understood: IFilterUrlMapper, IApiAdapter, ICacheKeyBuilder
- [ ] Adapters directory created: `src/app/domains/automobile/adapters/`
- [ ] Barrel file created with placeholder exports
- [ ] Adapter usage pattern understood (configuration object)
- [ ] Type parameters understood: TFilters, TData, TStatistics

---

## Next Step

Proceed to `502-url-mapper-adapter.md` to implement the automobile URL mapper.
