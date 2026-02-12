# 202: Resource Management Interface

**Status:** Planning
**Depends On:** 201-domain-config-interface
**Blocks:** 301-url-state-service, 306-resource-management-service

---

## Learning Objectives

After completing this section, you will:
- Understand the adapter pattern and why it isolates domain-specific logic from framework code
- Know how to define interfaces that different domains can implement
- Recognize the relationship between URL state, API requests, and caching

---

## Objective

Create the resource management interfaces that define how domains interact with URLs, APIs, and caching. These interfaces establish the contract that domain-specific adapters must fulfill for the framework's URL-First architecture to function.

---

## Why

The URL-First architecture requires three key operations:

1. **URL <-> Filters**: Convert between URL query parameters and domain filter objects
2. **Filters -> API**: Fetch data from the API based on current filters
3. **Filters -> Cache Key**: Generate cache keys to prevent duplicate requests

Each domain (automobiles, real estate, inventory) has different filter structures and API endpoints. The resource management interfaces define the contract that each domain's adapters must implement.

**This is the Adapter Pattern in action:**

```
┌─────────────────────────────────────────────────────────────────┐
│                     Framework Services                           │
│  (UrlStateService, ResourceManagementService, RequestCoordinator)│
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Uses interfaces
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Adapter Interfaces (This Document)                  │
│        IFilterUrlMapper, IApiAdapter, ICacheKeyBuilder           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Implemented by
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Domain-Specific Adapters                       │
│   AutomobileUrlMapper, AutomobileApiAdapter, etc.                │
└─────────────────────────────────────────────────────────────────┘
```

Framework services depend on *interfaces*, not concrete implementations. This means:
- Framework code never changes when adding new domains
- Each domain provides its own adapter implementations
- Type safety is maintained throughout

### URL-First Architecture Reference

The resource management interfaces directly support the URL-First pattern (see `docs/README.md`):

- `IFilterUrlMapper` enables the URL to be the single source of truth
- `IApiAdapter` transforms URL-derived filters into API requests
- `ICacheKeyBuilder` prevents duplicate API calls when URL doesn't change

---

## What

### Step 202.1: Create the Resource Management Interface

Create the file `src/app/framework/models/resource-management.interface.ts`:

```typescript
// src/app/framework/models/resource-management.interface.ts
// VERSION 1 (Section 202) - Adapter interfaces for URL-First architecture

import { Observable } from 'rxjs';
import { Params } from '@angular/router';

/**
 * Adapter for mapping filters to/from URL parameters
 *
 * This interface defines how a domain converts between its filter model
 * and URL query parameters. Implementing this interface enables the
 * URL-First architecture where the URL is the single source of truth.
 *
 * @template TFilters - The shape of the filter object
 *
 * @example
 * ```typescript
 * class AutomobileUrlMapper implements IFilterUrlMapper<AutomobileFilters> {
 *   toUrlParams(filters: AutomobileFilters): Params {
 *     const params: Params = {};
 *     if (filters.manufacturer?.length) {
 *       params['manufacturer'] = filters.manufacturer.join(',');
 *     }
 *     if (filters.yearMin) {
 *       params['yearMin'] = filters.yearMin.toString();
 *     }
 *     return params;
 *   }
 *
 *   fromUrlParams(params: Params): AutomobileFilters {
 *     return {
 *       manufacturer: params['manufacturer']?.split(',') || [],
 *       yearMin: params['yearMin'] ? parseInt(params['yearMin'], 10) : null,
 *       yearMax: params['yearMax'] ? parseInt(params['yearMax'], 10) : null
 *     };
 *   }
 * }
 * ```
 */
export interface IFilterUrlMapper<TFilters> {
  /**
   * Convert filters to URL query parameters
   *
   * Takes a domain filter object and converts it to URL-safe query parameters.
   * Empty or null values should be omitted from the result.
   *
   * @param filters - Filter object
   * @returns URL query parameters
   */
  toUrlParams(filters: TFilters): Params;

  /**
   * Convert URL query parameters to filters
   *
   * Takes URL query parameters and constructs a domain filter object.
   * Missing parameters should result in null/empty values in the filter object.
   *
   * @param params - URL query parameters
   * @returns Filter object
   */
  fromUrlParams(params: Params): TFilters;

  /**
   * Extract highlight filters from URL parameters (optional)
   *
   * Domain-specific strategy for identifying "highlight" parameters.
   * Highlight filters use h_* prefix and provide segmented statistics.
   * If not implemented, the framework assumes no highlights are present.
   *
   * @param params - URL query parameters
   * @returns Highlight filters object (domain-specific structure)
   *
   * @example
   * ```typescript
   * extractHighlights(params: Params): AutomobileHighlights {
   *   return {
   *     manufacturer: params['h_manufacturer']?.split(',') || [],
   *     yearMin: params['h_yearMin'] ? parseInt(params['h_yearMin'], 10) : null
   *   };
   * }
   * ```
   */
  extractHighlights?(params: Params): any;
}

/**
 * Response from API adapter
 *
 * Standardized response format that all API adapters must return.
 * This allows framework services to work with any domain's API.
 *
 * @template TData - The type of individual data items
 * @template TStatistics - The type of statistics object (optional)
 */
export interface ApiAdapterResponse<TData, TStatistics = any> {
  /**
   * Array of data results
   */
  results: TData[];

  /**
   * Total count of results (unpaginated)
   * Used for pagination display ("Showing 1-20 of 1,234 results")
   */
  total: number;

  /**
   * Optional statistics/aggregations
   * Domain-specific summary data (e.g., manufacturer counts, year distribution)
   */
  statistics?: TStatistics;
}

/**
 * Adapter for fetching data from API
 *
 * This interface defines how a domain fetches data from its API.
 * The adapter is responsible for:
 * - Constructing API requests from filters
 * - Transforming API responses to the standardized format
 * - Handling domain-specific API quirks
 *
 * @template TFilters - The shape of the filter object
 * @template TData - The shape of individual data items
 * @template TStatistics - The shape of statistics object (optional)
 *
 * @example
 * ```typescript
 * class AutomobileApiAdapter implements IApiAdapter<AutomobileFilters, Vehicle, VehicleStats> {
 *   constructor(private http: HttpClient, private baseUrl: string) {}
 *
 *   fetchData(
 *     filters: AutomobileFilters,
 *     highlights?: AutomobileHighlights
 *   ): Observable<ApiAdapterResponse<Vehicle, VehicleStats>> {
 *     const params = this.buildParams(filters, highlights);
 *     return this.http.get<ApiResponse>(`${this.baseUrl}/vehicles`, { params }).pipe(
 *       map(response => ({
 *         results: response.data,
 *         total: response.meta.total,
 *         statistics: response.stats
 *       }))
 *     );
 *   }
 * }
 * ```
 */
export interface IApiAdapter<TFilters, TData, TStatistics = any> {
  /**
   * Fetch data from API based on filters
   *
   * @param filters - Filter object derived from URL parameters
   * @param highlights - Optional highlight filters (h_* parameters for segmented statistics)
   * @returns Observable of API response with results, total count, and optional statistics
   */
  fetchData(
    filters: TFilters,
    highlights?: any
  ): Observable<ApiAdapterResponse<TData, TStatistics>>;
}

/**
 * Adapter for building cache keys from filters
 *
 * This interface defines how a domain generates cache keys.
 * Cache keys are used by the RequestCoordinator to:
 * - Prevent duplicate in-flight requests
 * - Enable response caching for identical filter combinations
 *
 * @template TFilters - The shape of the filter object
 *
 * @example
 * ```typescript
 * class AutomobileCacheKeyBuilder implements ICacheKeyBuilder<AutomobileFilters> {
 *   buildKey(filters: AutomobileFilters, highlights?: AutomobileHighlights): string {
 *     const filterParts = [
 *       filters.manufacturer?.join(',') || '',
 *       filters.yearMin?.toString() || '',
 *       filters.yearMax?.toString() || ''
 *     ];
 *
 *     const highlightParts = highlights ? [
 *       highlights.manufacturer?.join(',') || ''
 *     ] : [];
 *
 *     return [...filterParts, ...highlightParts].join('|');
 *   }
 * }
 * ```
 */
export interface ICacheKeyBuilder<TFilters> {
  /**
   * Build a unique cache key from filters
   *
   * The key must be unique for each distinct filter combination.
   * Highlight filters must be included to ensure segmented statistics
   * are cached separately from non-highlighted requests.
   *
   * @param filters - Filter object
   * @param highlights - Optional highlight filters (must be included in cache key)
   * @returns Cache key string
   */
  buildKey(filters: TFilters, highlights?: any): string;
}

/**
 * Configuration for ResourceManagementService
 *
 * This interface bundles all the adapters and settings needed
 * to initialize the ResourceManagementService for a specific domain.
 *
 * @template TFilters - The shape of the filter object
 * @template TData - The shape of individual data items
 * @template TStatistics - The shape of statistics object (optional)
 */
export interface ResourceManagementConfig<TFilters, TData, TStatistics = any> {
  /**
   * Filter to URL parameter mapper
   */
  filterMapper: IFilterUrlMapper<TFilters>;

  /**
   * API data fetcher
   */
  apiAdapter: IApiAdapter<TFilters, TData, TStatistics>;

  /**
   * Cache key builder
   */
  cacheKeyBuilder: ICacheKeyBuilder<TFilters>;

  /**
   * Default filter values
   * Applied when application first loads or filters are cleared
   */
  defaultFilters: TFilters;

  /**
   * Whether to enable automatic data fetching on filter changes
   * When true, changing the URL automatically triggers API requests
   * @default true
   */
  autoFetch?: boolean;

  /**
   * Cache TTL in milliseconds
   * How long cached responses are considered valid
   * @default 30000 (30 seconds)
   */
  cacheTTL?: number;
}

/**
 * State managed by ResourceManagementService
 *
 * This interface represents the complete state of a domain's data
 * as managed by the ResourceManagementService.
 *
 * @template TFilters - The shape of the filter object
 * @template TData - The shape of individual data items
 * @template TStatistics - The shape of statistics object (optional)
 */
export interface ResourceState<TFilters, TData, TStatistics = any> {
  /**
   * Current filter values
   * Derived from URL query parameters
   */
  filters: TFilters;

  /**
   * Data results from the API
   */
  results: TData[];

  /**
   * Total count of results (unpaginated)
   */
  totalResults: number;

  /**
   * Loading state
   * True while API request is in progress
   */
  loading: boolean;

  /**
   * Error state
   * Contains error object if last request failed, null otherwise
   */
  error: Error | null;

  /**
   * Optional statistics/aggregations from API
   */
  statistics?: TStatistics;

  /**
   * Optional highlight filters (h_* parameters)
   * Used for data segmentation in charts
   */
  highlights?: any;
}

/**
 * Default values for ResourceManagementConfig optional fields
 */
export const RESOURCE_MANAGEMENT_DEFAULTS = {
  autoFetch: true,
  cacheTTL: 30000 // 30 seconds
};
```

---

### Step 202.2: Update the Barrel Export

Update `src/app/framework/models/index.ts` to include the new interface:

```typescript
// src/app/framework/models/index.ts
// VERSION 2 (Section 202) - Added resource management exports
// Replaces VERSION 1 from Section 201

// This barrel file exports all framework model interfaces.
// Import from '@app/framework/models' instead of individual files.

export * from './domain-config.interface';
export * from './resource-management.interface';
```

---

### Step 202.3: Understand the Adapter Pattern

The three adapter interfaces form a cohesive system:

```
┌─────────────────────────────────────────────────────────────────┐
│                        URL Changes                               │
│                   ?manufacturer=Ford&yearMin=2020                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (1) Parse URL
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     IFilterUrlMapper                             │
│              fromUrlParams(params) → TFilters                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (2) Build cache key
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ICacheKeyBuilder                              │
│              buildKey(filters) → "Ford|2020|"                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (3) Check cache, then fetch
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       IApiAdapter                                │
│         fetchData(filters) → Observable<Response>                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (4) Update state
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ResourceState                               │
│           { filters, results, totalResults, loading, ... }       │
└─────────────────────────────────────────────────────────────────┘
```

**Why three separate interfaces?**

Single Responsibility Principle. Each interface does one thing:

| Interface | Responsibility |
|-----------|----------------|
| `IFilterUrlMapper` | URL serialization/deserialization |
| `IApiAdapter` | API communication |
| `ICacheKeyBuilder` | Cache key generation |

This separation means you can:
- Change URL format without touching API code
- Switch APIs without changing URL handling
- Modify caching strategy independently

---

## Verification

### 1. Check File Exists

```bash
$ ls -la src/app/framework/models/resource-management.interface.ts
```

Expected output shows the file exists:

```
-rw-r--r-- 1 user user 6543 Feb  9 12:30 src/app/framework/models/resource-management.interface.ts
```

### 2. TypeScript Compilation Check

```bash
$ cd ~/projects/vvroom
$ npx tsc --noEmit src/app/framework/models/resource-management.interface.ts
```

Expected: No output (no compilation errors).

### 3. Verify Exports

```bash
$ grep "^export" src/app/framework/models/resource-management.interface.ts
```

Expected output shows interface exports:

```
export interface IFilterUrlMapper<TFilters> {
export interface ApiAdapterResponse<TData, TStatistics = any> {
export interface IApiAdapter<TFilters, TData, TStatistics = any> {
export interface ICacheKeyBuilder<TFilters> {
export interface ResourceManagementConfig<TFilters, TData, TStatistics = any> {
export interface ResourceState<TFilters, TData, TStatistics = any> {
export const RESOURCE_MANAGEMENT_DEFAULTS = {
```

### 4. Verify Barrel Export

```bash
$ grep "resource-management" src/app/framework/models/index.ts
```

Expected output:

```
export * from './resource-management.interface';
```

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| `Cannot find module 'rxjs'` | RxJS not installed | Run `npm install rxjs` |
| `Cannot find module '@angular/router'` | Angular Router not installed | Included with Angular core |
| `Observable is not generic` | Wrong RxJS import | Use `import { Observable } from 'rxjs';` |
| `Params is not defined` | Missing router import | Add `import { Params } from '@angular/router';` |
| Interface properties showing as errors | Domain config using wrong types | Update domain-config.interface.ts to import from here |

---

## Key Takeaways

1. **The adapter pattern isolates domain-specific logic** — Framework services depend on interfaces, not implementations
2. **Three adapters form a cohesive system** — URL mapping, API fetching, and cache key building work together
3. **ResourceState represents the complete data state** — Loading, results, errors, and filters in one place

---

## Acceptance Criteria

- [ ] `src/app/framework/models/resource-management.interface.ts` exists with all interfaces
- [ ] `IFilterUrlMapper<TFilters>` defines `toUrlParams`, `fromUrlParams`, and optional `extractHighlights`
- [ ] `IApiAdapter<TFilters, TData, TStatistics>` defines `fetchData` returning Observable
- [ ] `ICacheKeyBuilder<TFilters>` defines `buildKey` method
- [ ] `ApiAdapterResponse<TData, TStatistics>` defines standard response format
- [ ] `ResourceManagementConfig` bundles all adapters with configuration
- [ ] `ResourceState` captures complete domain data state
- [ ] Barrel file (`index.ts`) exports all resource management interfaces
- [ ] TypeScript compilation succeeds with no errors
- [ ] All interfaces have JSDoc documentation with examples

---

## Next Step

Proceed to `203-filter-definition-interface.md` to define the filter configuration interfaces used in Query Control components.
