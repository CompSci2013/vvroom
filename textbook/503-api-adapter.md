# 503: API Adapter

**Status:** Complete
**Depends On:** 501-domain-adapter-pattern, 502-url-mapper-adapter, 302-api-service
**Blocks:** Phase 8 (Framework Components), Phase 9 (Feature Components)

---

## Learning Objectives

After completing this section, you will:
- Understand how to implement domain-specific API adapters
- Know how to transform API responses to domain models
- Recognize the difference between services and adapter classes
- Be able to implement cache key builders for request deduplication

---

## Objective

Create the `AutomobileApiAdapter` for fetching vehicle data and the `AutomobileCacheKeyBuilder` for generating unique cache keys. These adapters complete the domain adapter layer.

---

## Why

### API Adapter: Domain-Specific Fetching

The framework's `ResourceManagementService` knows *when* to fetch data (on filter changes), but not *how* to fetch automobile data. The API adapter provides:

1. **Endpoint knowledge** — Which URL to call (`/vehicles/details`)
2. **Parameter mapping** — How to convert filters to API params
3. **Response transformation** — How to convert API JSON to domain models

```typescript
// Framework calls:
apiAdapter.fetchData(filters, highlights)

// Adapter implements:
fetchData(filters) {
  const params = this.filtersToApiParams(filters);
  return this.api.get('/vehicles/details', params).pipe(
    map(response => ({
      results: response.results.map(r => VehicleResult.fromApiResponse(r)),
      total: response.total,
      statistics: VehicleStatistics.fromApiResponse(response.statistics)
    }))
  );
}
```

### Not an Angular Service

The API adapter is a **plain class**, not an `@Injectable()` service. This is intentional:

| Aspect | Service | Adapter Class |
|--------|---------|---------------|
| Lifecycle | Singleton | Created per config |
| Constructor | DI by Angular | Manual with args |
| Testability | Needs TestBed | Plain new() |
| Configuration | Environment-based | Constructor params |

The adapter is instantiated in the domain config factory with specific configuration (base URL, API service).

### Cache Key Builder

The `RequestCoordinatorService` deduplicates identical requests. It needs a unique key for each request. The cache key builder creates this key from filters:

```typescript
// Same filters = same cache key = deduplicated
buildKey({ manufacturer: 'Toyota', page: 1 })
// → 'vehicles:manufacturer=Toyota|page=1'

buildKey({ manufacturer: 'Toyota', page: 1 })
// → 'vehicles:manufacturer=Toyota|page=1' (same, deduplicated)

buildKey({ manufacturer: 'Honda', page: 1 })
// → 'vehicles:manufacturer=Honda|page=1' (different, new request)
```

### Highlight Parameters in Cache Key

Highlight filters must be included in the cache key because they affect the response:

```typescript
// Different highlights = different cache key
buildKey({ manufacturer: 'Toyota' }, { yearMin: 2020 })
// → 'vehicles:manufacturer=Toyota|h_yearMin=2020'

buildKey({ manufacturer: 'Toyota' }, { yearMin: 2022 })
// → 'vehicles:manufacturer=Toyota|h_yearMin=2022' (different)
```

---

## What

### Step 503.1: Create the API Adapter

Create the file `src/app/domains/automobile/adapters/automobile-api.adapter.ts`:

```typescript
// src/app/domains/automobile/adapters/automobile-api.adapter.ts
// VERSION 1 (Section 503) - Automobile API adapter

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  IApiAdapter,
  ApiAdapterResponse
} from '../../../framework/models/resource-management.interface';
import { ApiResponse } from '../../../framework/models/api-response.interface';
import { ApiService } from '../../../framework/services/api.service';
import { AutoSearchFilters } from '../models/automobile.filters';
import { VehicleResult } from '../models/automobile.data';
import { VehicleStatistics } from '../models/automobile.statistics';

/**
 * Automobile API adapter
 *
 * Fetches vehicle data from the automobile discovery API.
 * Transforms API responses into domain models.
 *
 * NOTE: This is NOT an Angular service. It's instantiated manually
 * in the domain config factory with the base URL.
 *
 * @example
 * ```typescript
 * const adapter = new AutomobileApiAdapter(apiService, 'http://api.example.com/v1');
 * const filters = new AutoSearchFilters({ manufacturer: 'Toyota' });
 *
 * adapter.fetchData(filters).subscribe(response => {
 *   console.log('Vehicles:', response.results);
 *   console.log('Total:', response.total);
 *   console.log('Statistics:', response.statistics);
 * });
 * ```
 */
export class AutomobileApiAdapter
  implements IApiAdapter<AutoSearchFilters, VehicleResult, VehicleStatistics>
{
  /**
   * API endpoint for vehicle search
   */
  private readonly VEHICLES_ENDPOINT = '/vehicles/details';

  /**
   * API endpoint for statistics only
   */
  private readonly STATISTICS_ENDPOINT = '/statistics';

  /**
   * Base URL for API requests
   */
  private baseUrl: string;

  /**
   * API service for making HTTP requests
   */
  private apiService: ApiService;

  /**
   * Constructor
   *
   * @param apiService - Injected API service for HTTP requests
   * @param baseUrl - Base URL for automobile API
   */
  constructor(apiService: ApiService, baseUrl: string) {
    this.apiService = apiService;
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch vehicle data from API
   *
   * @param filters - Search filters
   * @param highlights - Optional highlight filters (h_* parameters)
   * @returns Observable of vehicle results with statistics
   */
  fetchData(
    filters: AutoSearchFilters,
    highlights?: any
  ): Observable<ApiAdapterResponse<VehicleResult, VehicleStatistics>> {
    // Convert filters to API parameters
    const params = this.filtersToApiParams(filters, highlights);
    const url = `${this.baseUrl}${this.VEHICLES_ENDPOINT}`;

    // Fetch vehicle data
    return this.apiService.get<VehicleResult>(url, { params }).pipe(
      map((apiResponse: ApiResponse<VehicleResult>) => {
        // Transform API response to adapter response
        return {
          results: apiResponse.results.map(item =>
            VehicleResult.fromApiResponse(item)
          ),
          total: apiResponse.total,
          statistics: apiResponse.statistics
            ? VehicleStatistics.fromApiResponse(apiResponse.statistics)
            : undefined
        };
      })
    );
  }

  /**
   * Fetch statistics only (without vehicle data)
   *
   * Useful for refreshing statistics panel without reloading table data.
   *
   * @param filters - Search filters
   * @returns Observable of statistics
   */
  fetchStatistics(filters: AutoSearchFilters): Observable<VehicleStatistics> {
    const params = this.filtersToApiParams(filters);

    return this.apiService
      .get<VehicleStatistics>(`${this.baseUrl}${this.STATISTICS_ENDPOINT}`, params)
      .pipe(
        map((response: any) => {
          // API might return statistics directly or wrapped
          const statsData = response.statistics || response;
          return VehicleStatistics.fromApiResponse(statsData);
        })
      );
  }

  /**
   * Convert filter object to API query parameters
   *
   * @param filters - Domain filters
   * @param highlights - Optional highlight filters (h_* parameters)
   * @returns API query parameters
   */
  private filtersToApiParams(
    filters: AutoSearchFilters,
    highlights?: any
  ): Record<string, any> {
    const params: Record<string, any> = {};

    // Search filters
    if (filters.manufacturer) {
      params['manufacturer'] = filters.manufacturer;
    }

    if (filters.model) {
      params['model'] = filters.model;
    }

    if (filters.yearMin !== undefined && filters.yearMin !== null) {
      params['yearMin'] = filters.yearMin;
    }

    if (filters.yearMax !== undefined && filters.yearMax !== null) {
      params['yearMax'] = filters.yearMax;
    }

    if (filters.bodyClass) {
      params['bodyClass'] = filters.bodyClass;
    }

    if (filters.instanceCountMin !== undefined && filters.instanceCountMin !== null) {
      params['instanceCountMin'] = filters.instanceCountMin;
    }

    if (filters.instanceCountMax !== undefined && filters.instanceCountMax !== null) {
      params['instanceCountMax'] = filters.instanceCountMax;
    }

    if (filters.search) {
      params['search'] = filters.search;
    }

    // Model combinations from picker
    if (filters.modelCombos) {
      params['models'] = filters.modelCombos;
    }

    // Pagination
    if (filters.page !== undefined && filters.page !== null) {
      params['page'] = filters.page;
    }

    if (filters.size !== undefined && filters.size !== null) {
      params['size'] = filters.size;
    }

    // Sorting
    if (filters.sort) {
      params['sortBy'] = filters.sort;
    }

    if (filters.sortDirection) {
      params['sortOrder'] = filters.sortDirection;
    }

    // Highlight parameters (h_* prefix for segmented statistics)
    if (highlights) {
      if (highlights.yearMin !== undefined && highlights.yearMin !== null) {
        params['h_yearMin'] = String(highlights.yearMin);
      }

      if (highlights.yearMax !== undefined && highlights.yearMax !== null) {
        params['h_yearMax'] = String(highlights.yearMax);
      }

      if (highlights.manufacturer) {
        params['h_manufacturer'] = highlights.manufacturer;
      }

      if (highlights.modelCombos) {
        params['h_modelCombos'] = highlights.modelCombos;
      }

      if (highlights.bodyClass) {
        params['h_bodyClass'] = highlights.bodyClass;
      }
    }

    return params;
  }
}
```

---

### Step 503.2: Create the Cache Key Builder

Create the file `src/app/domains/automobile/adapters/automobile-cache-key.builder.ts`:

```typescript
// src/app/domains/automobile/adapters/automobile-cache-key.builder.ts
// VERSION 1 (Section 503) - Automobile cache key builder

import { ICacheKeyBuilder } from '../../../framework/models/resource-management.interface';
import { AutoSearchFilters } from '../models/automobile.filters';

/**
 * Automobile cache key builder
 *
 * Creates unique cache keys from filter objects for request deduplication.
 * Keys are deterministic: same filters always produce the same key.
 *
 * Key format: `vehicles:{filter1}={value1}|{filter2}={value2}|...`
 *
 * @example
 * ```typescript
 * const builder = new AutomobileCacheKeyBuilder();
 *
 * const key = builder.buildKey({ manufacturer: 'Toyota', page: 1 });
 * // → 'vehicles:manufacturer=Toyota|page=1'
 *
 * const keyWithHighlights = builder.buildKey(
 *   { manufacturer: 'Toyota' },
 *   { yearMin: 2020 }
 * );
 * // → 'vehicles:manufacturer=Toyota|h_yearMin=2020'
 * ```
 */
export class AutomobileCacheKeyBuilder
  implements ICacheKeyBuilder<AutoSearchFilters>
{
  /**
   * Prefix for all automobile cache keys
   */
  private readonly PREFIX = 'vehicles';

  /**
   * Build a unique cache key from filters
   *
   * @param filters - Filter object
   * @param highlights - Optional highlight filters
   * @returns Cache key string
   */
  buildKey(filters: AutoSearchFilters, highlights?: any): string {
    const parts: string[] = [];

    // Add filter parts (sorted for consistency)
    if (filters.manufacturer) {
      parts.push(`manufacturer=${filters.manufacturer}`);
    }

    if (filters.model) {
      parts.push(`model=${filters.model}`);
    }

    if (filters.yearMin !== undefined && filters.yearMin !== null) {
      parts.push(`yearMin=${filters.yearMin}`);
    }

    if (filters.yearMax !== undefined && filters.yearMax !== null) {
      parts.push(`yearMax=${filters.yearMax}`);
    }

    if (filters.bodyClass) {
      const bodyClassValue = Array.isArray(filters.bodyClass)
        ? filters.bodyClass.join(',')
        : filters.bodyClass;
      parts.push(`bodyClass=${bodyClassValue}`);
    }

    if (filters.instanceCountMin !== undefined && filters.instanceCountMin !== null) {
      parts.push(`instanceCountMin=${filters.instanceCountMin}`);
    }

    if (filters.instanceCountMax !== undefined && filters.instanceCountMax !== null) {
      parts.push(`instanceCountMax=${filters.instanceCountMax}`);
    }

    if (filters.search) {
      parts.push(`search=${filters.search}`);
    }

    if (filters.modelCombos) {
      parts.push(`modelCombos=${filters.modelCombos}`);
    }

    // Pagination
    if (filters.page !== undefined && filters.page !== null) {
      parts.push(`page=${filters.page}`);
    }

    if (filters.size !== undefined && filters.size !== null) {
      parts.push(`size=${filters.size}`);
    }

    // Sorting
    if (filters.sort) {
      parts.push(`sort=${filters.sort}`);
    }

    if (filters.sortDirection) {
      parts.push(`sortDir=${filters.sortDirection}`);
    }

    // Add highlight parts (with h_ prefix)
    if (highlights) {
      if (highlights.yearMin !== undefined && highlights.yearMin !== null) {
        parts.push(`h_yearMin=${highlights.yearMin}`);
      }

      if (highlights.yearMax !== undefined && highlights.yearMax !== null) {
        parts.push(`h_yearMax=${highlights.yearMax}`);
      }

      if (highlights.manufacturer) {
        parts.push(`h_manufacturer=${highlights.manufacturer}`);
      }

      if (highlights.modelCombos) {
        parts.push(`h_modelCombos=${highlights.modelCombos}`);
      }

      if (highlights.bodyClass) {
        parts.push(`h_bodyClass=${highlights.bodyClass}`);
      }
    }

    // Build final key
    return parts.length > 0
      ? `${this.PREFIX}:${parts.join('|')}`
      : this.PREFIX;
  }
}
```

---

### Step 503.3: Update the Barrel File

Update `src/app/domains/automobile/adapters/index.ts`:

```typescript
// src/app/domains/automobile/adapters/index.ts
// VERSION 3 (Section 503) - Complete adapters

export * from './automobile-url-mapper';
export * from './automobile-api.adapter';
export * from './automobile-cache-key.builder';
```

---

## Verification

### 1. Check Files Exist

```bash
$ ls -la src/app/domains/automobile/adapters/
```

Expected output:

```
total 20
drwxr-xr-x 2 user user 4096 Feb  9 12:00 .
drwxr-xr-x 3 user user 4096 Feb  9 12:00 ..
-rw-r--r-- 1 user user 4567 Feb  9 12:00 automobile-api.adapter.ts
-rw-r--r-- 1 user user 2345 Feb  9 12:00 automobile-cache-key.builder.ts
-rw-r--r-- 1 user user 6789 Feb  9 12:00 automobile-url-mapper.ts
-rw-r--r-- 1 user user  200 Feb  9 12:00 index.ts
```

### 2. TypeScript Compilation Check

```bash
$ npx tsc --noEmit src/app/domains/automobile/adapters/index.ts
```

### 3. Test API Adapter

```typescript
import { AutomobileApiAdapter } from '@app/domains/automobile/adapters';
import { ApiService } from '@app/framework/services';
import { AutoSearchFilters } from '@app/domains/automobile/models';

// Create adapter (normally done in domain config factory)
const adapter = new AutomobileApiAdapter(apiService, 'http://localhost:3000/api/v1');

// Test fetch
const filters = new AutoSearchFilters({
  manufacturer: 'Toyota',
  yearMin: 2020,
  page: 1,
  size: 20
});

adapter.fetchData(filters).subscribe(response => {
  console.log('Results:', response.results.length);
  console.log('Total:', response.total);
  console.log('First vehicle:', response.results[0]?.getDisplayName());
});
```

### 4. Test Cache Key Builder

```typescript
import { AutomobileCacheKeyBuilder } from '@app/domains/automobile/adapters';
import { AutoSearchFilters } from '@app/domains/automobile/models';

const builder = new AutomobileCacheKeyBuilder();

// Test basic key
const key1 = builder.buildKey(new AutoSearchFilters({
  manufacturer: 'Toyota',
  page: 1
}));
console.log('Key 1:', key1);
// → 'vehicles:manufacturer=Toyota|page=1'

// Test with highlights
const key2 = builder.buildKey(
  new AutoSearchFilters({ manufacturer: 'Toyota' }),
  { yearMin: 2020, yearMax: 2024 }
);
console.log('Key 2:', key2);
// → 'vehicles:manufacturer=Toyota|h_yearMin=2020|h_yearMax=2024'

// Test determinism (same filters = same key)
const key3 = builder.buildKey(new AutoSearchFilters({
  manufacturer: 'Toyota',
  page: 1
}));
console.log('Keys match:', key1 === key3);
// → true
```

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| "Cannot read property 'get'" | ApiService not passed | Pass ApiService to constructor |
| Results not transformed | Missing `fromApiResponse()` | Call model's static factory |
| Cache key collision | Missing filter in key | Add filter to `buildKey()` |
| Highlights not in cache key | Highlights not added | Include h_* params in key |

---

## Key Takeaways

1. **Adapters are plain classes, not services** — Enables manual construction with config
2. **Response transformation uses domain models** — `VehicleResult.fromApiResponse()`
3. **Cache keys must be deterministic** — Same filters always produce same key
4. **Highlights affect cache keys** — Different highlights = different cached response

---

## Acceptance Criteria

- [ ] `src/app/domains/automobile/adapters/automobile-api.adapter.ts` exists
- [ ] Implements `IApiAdapter<AutoSearchFilters, VehicleResult, VehicleStatistics>`
- [ ] `fetchData()` makes API call and transforms response
- [ ] Response transformation uses `VehicleResult.fromApiResponse()`
- [ ] Statistics transformation uses `VehicleStatistics.fromApiResponse()`
- [ ] `src/app/domains/automobile/adapters/automobile-cache-key.builder.ts` exists
- [ ] Implements `ICacheKeyBuilder<AutoSearchFilters>`
- [ ] `buildKey()` produces deterministic keys
- [ ] Cache key includes highlight parameters
- [ ] Barrel file exports all adapters
- [ ] TypeScript compilation succeeds
- [ ] JSDoc comments on all public methods

---

## Phase 5 Complete

Congratulations! You have completed Phase 5: Domain Adapters.

**What you built:**
- Adapter pattern understanding and interfaces
- `AutomobileUrlMapper` for URL ↔ filter conversion
- `AutomobileApiAdapter` for API data fetching
- `AutomobileCacheKeyBuilder` for request deduplication

**The Aha Moment:**
"Adapters are the bridge between generic framework code and domain-specific logic. They enable reusability without sacrificing type safety."

---

## Next Step

Proceed to `801-base-table-component.md` to begin Phase 8: Framework Components.
