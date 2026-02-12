# 310: Filter Options Service

**Status:** Complete
**Depends On:** 302-api-service, 304-domain-config-registry
**Blocks:** Phase 8 (Framework Components - for filter dropdowns)

---

## Learning Objectives

After completing this section, you will:
- Understand why filter options caching matters for pop-outs
- Know how to implement a cache-first data loading pattern
- Recognize the transformer pattern for API response adaptation
- Be able to implement a service that supports cross-window option sharing

---

## Objective

Create the `FilterOptionsService` that caches filter dropdown options and supports cross-window sharing for pop-out windows.

---

## Why

Filter dropdowns (manufacturer, body class, year) need options from the API. Without caching:

1. **Duplicate requests** — Each dropdown fetches options independently
2. **Pop-out overhead** — Pop-out windows make their own API calls
3. **Slow UX** — Users wait for options to load

### The Pop-Out Challenge

Pop-out windows should NOT make API calls. They receive state from the main window. But what about filter options?

```
Main Window                     Pop-out Window
    │                                │
    ├── Load manufacturer options    │
    │   (API call)                   │
    │                                │
    ├── Load body class options      │
    │   (API call)                   │
    │                                │
    ├── Open pop-out                 │
    │   │                            │
    │   └── Broadcast state ────────►│
    │       (includes filter cache)  │
    │                                │
    │                                ├── FilterOptionsService
    │                                │   syncFromExternal()
    │                                │
    │                                └── Options available
    │                                    (no API calls!)
```

### Cache Structure

```typescript
{
  'http://api/manufacturers': {
    field: 'manufacturer',
    endpoint: 'http://api/manufacturers',
    options: [{ value: 'Ford', label: 'Ford' }, ...],
    rawResponse: { data: [...] },
    cachedAt: 1707500000000
  },
  'http://api/body-classes': {
    field: 'bodyClass',
    endpoint: 'http://api/body-classes',
    options: [{ value: 'Sedan', label: 'Sedan' }, ...],
    rawResponse: { data: [...] },
    cachedAt: 1707500001000
  }
}
```

### Transformer Pattern

Different APIs return options in different formats. The service accepts a transformer function:

```typescript
// API returns: { data: [{ id: 1, name: 'Ford' }, ...] }
// We need: [{ value: 1, label: 'Ford' }, ...]

filterOptions.getOptions(
  'http://api/manufacturers',
  'manufacturer',
  (response) => response.data.map(item => ({
    value: item.id,
    label: item.name
  }))
);
```

---

## What

### Step 310.1: Create the Filter Options Service

Create the file `src/app/framework/services/filter-options.service.ts`:

```typescript
// src/app/framework/services/filter-options.service.ts
// VERSION 1 (Section 310) - Filter options caching

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';

/**
 * Filter option for dropdowns
 */
export interface FilterOption {
  /** Option value (sent to API) */
  value: any;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Cached options for a single filter
 */
export interface CachedFilterOptions {
  /** Filter field identifier */
  field: string;
  /** API endpoint used */
  endpoint: string;
  /** Transformed options */
  options: FilterOption[];
  /** Raw API response (for custom transformers) */
  rawResponse?: any;
  /** Cache timestamp */
  cachedAt: number;
}

/**
 * Complete filter options cache
 */
export interface FilterOptionsCache {
  [endpoint: string]: CachedFilterOptions;
}

/**
 * Filter options service
 *
 * Caches filter dropdown options and supports cross-window sharing.
 *
 * **Key Features:**
 *
 * 1. **Cache-first loading** — Returns cached options if available
 * 2. **Transformer support** — Adapts API responses to FilterOption[]
 * 3. **Pop-out support** — syncFromExternal() receives cache from main window
 * 4. **Reactive cache** — Observable of cache changes
 *
 * **Usage Pattern:**
 *
 * 1. Main window loads options (API call + cache)
 * 2. Main window broadcasts state (includes filterOptionsCache)
 * 3. Pop-out receives state
 * 4. Pop-out calls syncFromExternal(cache)
 * 5. Pop-out has options without API calls
 *
 * @example
 * ```typescript
 * // Load with transformer
 * this.filterOptions.getOptions(
 *   'http://api/manufacturers',
 *   'manufacturer',
 *   response => response.data.map(m => ({ value: m.id, label: m.name }))
 * ).subscribe(options => {
 *   this.manufacturerOptions = options;
 * });
 *
 * // In pop-out, sync from main window
 * this.filterOptions.syncFromExternal(message.payload.filterOptionsCache);
 *
 * // Check if cached
 * if (this.filterOptions.isCached('http://api/manufacturers')) {
 *   // Use cached value
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class FilterOptionsService {
  /**
   * Cache storage
   */
  private cache: FilterOptionsCache = {};

  /**
   * Observable of cache state
   */
  private cache$ = new BehaviorSubject<FilterOptionsCache>({});

  /**
   * Constructor
   *
   * @param apiService - API service for fetching options
   */
  constructor(private apiService: ApiService) {}

  /**
   * Get current cache for state broadcast
   *
   * @returns Copy of current cache
   */
  getCache(): FilterOptionsCache {
    return { ...this.cache };
  }

  /**
   * Get observable of cache changes
   *
   * @returns Observable of cache state
   */
  getCache$(): Observable<FilterOptionsCache> {
    return this.cache$.asObservable();
  }

  /**
   * Get options (from cache or API)
   *
   * @param endpoint - API endpoint URL
   * @param field - Filter field identifier
   * @param transformer - Optional function to transform API response
   * @returns Observable of filter options
   */
  getOptions(
    endpoint: string,
    field: string,
    transformer?: (response: any) => FilterOption[]
  ): Observable<FilterOption[]> {
    // Check cache first
    const cached = this.cache[endpoint];
    if (cached) {
      // If transformer provided and we have raw response, re-transform
      if (transformer && cached.rawResponse) {
        return of(transformer(cached.rawResponse));
      }
      return of(cached.options);
    }

    // Fetch from API
    return this.apiService.get(endpoint).pipe(
      tap(response => {
        const options = transformer ? transformer(response) : [];
        this.cache[endpoint] = {
          field,
          endpoint,
          options,
          rawResponse: response,
          cachedAt: Date.now()
        };
        this.cache$.next({ ...this.cache });
      }),
      map(response => transformer ? transformer(response) : []),
      catchError(error => {
        console.error(`[FilterOptionsService] Failed to load from ${endpoint}:`, error);
        throw error;
      })
    );
  }

  /**
   * Get raw API response from cache
   *
   * Used for filters that need the full response (e.g., range filters).
   *
   * @param endpoint - API endpoint URL
   * @returns Cached raw response or null
   */
  getRawResponse(endpoint: string): any | null {
    return this.cache[endpoint]?.rawResponse ?? null;
  }

  /**
   * Get raw response asynchronously (from cache or API)
   *
   * @param endpoint - API endpoint URL
   * @param field - Filter field identifier
   * @returns Observable of raw API response
   */
  getRawResponseAsync(endpoint: string, field: string): Observable<any> {
    // Check cache first
    const cached = this.cache[endpoint];
    if (cached?.rawResponse) {
      return of(cached.rawResponse);
    }

    // Fetch from API
    return this.apiService.get(endpoint).pipe(
      tap(response => {
        this.cache[endpoint] = {
          field,
          endpoint,
          options: [],
          rawResponse: response,
          cachedAt: Date.now()
        };
        this.cache$.next({ ...this.cache });
      }),
      catchError(error => {
        console.error(`[FilterOptionsService] Failed to load from ${endpoint}:`, error);
        throw error;
      })
    );
  }

  /**
   * Sync cache from external source
   *
   * Used by pop-out windows to receive cache from main window.
   *
   * @param externalCache - Cache from main window
   */
  syncFromExternal(externalCache: FilterOptionsCache): void {
    if (!externalCache) {
      return;
    }

    // Merge external cache into local cache
    this.cache = { ...this.cache, ...externalCache };
    this.cache$.next({ ...this.cache });
  }

  /**
   * Check if options are cached
   *
   * @param endpoint - API endpoint URL
   * @returns True if cached
   */
  isCached(endpoint: string): boolean {
    return !!this.cache[endpoint];
  }

  /**
   * Get cached options synchronously
   *
   * @param endpoint - API endpoint URL
   * @returns Cached options or null
   */
  getCachedOptions(endpoint: string): FilterOption[] | null {
    return this.cache[endpoint]?.options ?? null;
  }

  /**
   * Invalidate specific cache entry
   *
   * @param endpoint - API endpoint URL
   */
  invalidate(endpoint: string): void {
    delete this.cache[endpoint];
    this.cache$.next({ ...this.cache });
  }

  /**
   * Clear entire cache
   */
  clearCache(): void {
    this.cache = {};
    this.cache$.next({});
  }

  /**
   * Preload options for multiple endpoints
   *
   * Useful for initializing filters on page load.
   *
   * @param endpoints - Array of { endpoint, field, transformer }
   * @returns Observable that completes when all loaded
   */
  preload(
    endpoints: Array<{
      endpoint: string;
      field: string;
      transformer?: (response: any) => FilterOption[];
    }>
  ): Observable<void> {
    const requests = endpoints.map(({ endpoint, field, transformer }) =>
      this.getOptions(endpoint, field, transformer)
    );

    return new Observable(observer => {
      let completed = 0;
      const total = requests.length;

      if (total === 0) {
        observer.next();
        observer.complete();
        return;
      }

      requests.forEach(request => {
        request.subscribe({
          next: () => {
            completed++;
            if (completed === total) {
              observer.next();
              observer.complete();
            }
          },
          error: err => {
            completed++;
            console.warn('[FilterOptionsService] Preload error:', err);
            if (completed === total) {
              observer.next();
              observer.complete();
            }
          }
        });
      });
    });
  }
}
```

---

### Step 310.2: Update the Barrel File

Update `src/app/framework/services/index.ts`:

```typescript
// src/app/framework/services/index.ts
// VERSION 9 (Section 310) - Added FilterOptionsService

export * from './url-state.service';
export * from './api.service';
export * from './request-coordinator.service';
export * from './domain-config-registry.service';
export * from './domain-config-validator.service';
export * from './popout-context.service';
export * from './popout-manager.service';
export * from './user-preferences.service';
export * from './filter-options.service';
export * from './resource-management.service';
```

---

## Verification

### 1. Check File Exists

```bash
$ ls -la src/app/framework/services/filter-options.service.ts
```

### 2. TypeScript Compilation Check

```bash
$ npx tsc --noEmit src/app/framework/services/filter-options.service.ts
```

### 3. Build the Application

```bash
$ ng build
```

### 4. Verify Caching (Optional)

```typescript
// In any component
constructor(private filterOptions: FilterOptionsService) {
  // First call - API request
  this.filterOptions.getOptions(
    'http://example.com/api/options',
    'testField',
    (res: any) => res.data.map((d: any) => ({ value: d.id, label: d.name }))
  ).subscribe(options => {
    console.log('First call:', options);
  });

  // Second call (1s later) - from cache
  setTimeout(() => {
    this.filterOptions.getOptions(
      'http://example.com/api/options',
      'testField'
    ).subscribe(options => {
      console.log('Second call (cached):', options);
    });
  }, 1000);
}
```

Network tab should show only 1 request.

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| Options not cached | Different endpoint URLs | Ensure exact same URL string |
| Transformer not applied | Raw response missing | Check API returns data |
| Pop-out missing options | syncFromExternal not called | Call after receiving state |
| Cache stale | No invalidation | Call invalidate() when needed |
| Type errors | Transformer return type | Ensure returns FilterOption[] |

---

## Key Takeaways

1. **Cache-first prevents duplicate requests** — Options loaded once, reused everywhere
2. **Transformers adapt API responses** — Decouple option format from API format
3. **External sync enables pop-outs** — No API calls in pop-out windows

---

## Acceptance Criteria

- [ ] `src/app/framework/services/filter-options.service.ts` exists
- [ ] Service is `@Injectable({ providedIn: 'root' })`
- [ ] `getOptions()` returns from cache or fetches from API
- [ ] `getCache()` returns current cache for broadcasting
- [ ] `syncFromExternal()` merges external cache
- [ ] `isCached()` checks cache presence
- [ ] `getRawResponse()` and `getRawResponseAsync()` work
- [ ] `preload()` loads multiple endpoints
- [ ] `invalidate()` and `clearCache()` work
- [ ] Transformer pattern correctly adapts responses
- [ ] TypeScript compilation succeeds
- [ ] JSDoc comments document all public methods

---

## Next Step

Proceed to `311-picker-config-registry.md` to create the service for managing picker configurations.
