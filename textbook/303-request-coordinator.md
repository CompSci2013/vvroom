# 303: Request Coordinator Service

**Status:** Complete
**Depends On:** 302-api-service
**Blocks:** 306-resource-management-service

---

## Learning Objectives

After completing this section, you will:
- Understand the three-layer request processing model (cache, dedup, HTTP)
- Know how to implement TTL-based response caching
- Recognize the in-flight deduplication pattern for preventing duplicate requests
- Be able to implement exponential backoff retry logic

---

## Objective

Create the `RequestCoordinatorService` that provides intelligent request coordination with three processing layers: response caching, in-flight deduplication, and HTTP execution with retry.

---

## Why

When users interact with the vvroom application, they generate many API requests:
- Changing filters → new data fetch
- Navigating between pages → data fetch
- Browser back/forward → URL change → data fetch
- Pop-out windows → parallel data fetch

Without coordination, these requests can:
1. **Overwhelm the API** — Same request sent multiple times
2. **Waste bandwidth** — Re-fetching data that hasn't changed
3. **Create race conditions** — Responses arriving out of order
4. **Fail silently** — Transient network errors losing data

`RequestCoordinatorService` solves these problems with a three-layer approach:

### Layer 1: Response Cache (TTL-Based)

```
Request comes in → Check cache → If fresh, return cached → Skip HTTP
```

- Stores successful responses with timestamp
- Returns cached response if within TTL
- Reduces API load for repeated queries

### Layer 2: In-Flight Deduplication

```
Request comes in → Check if same request in progress → If yes, share observable → One HTTP call serves many subscribers
```

- Tracks ongoing requests by key
- Multiple calls to same endpoint share one observable
- Prevents duplicate concurrent requests

### Layer 3: HTTP Request with Retry

```
Execute HTTP → On failure, wait → Retry with exponential backoff → After N failures, give up
```

- Executes the actual HTTP request
- Retries transient failures with exponential backoff
- Gives up after configurable number of attempts

### Visual Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Request Comes In                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Layer 1: Response Cache                                                      │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │  Is there a cached response for this key that hasn't expired?           │ │
│ │  YES → Return cached response immediately (no HTTP)                     │ │
│ │  NO  → Proceed to Layer 2                                               │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Layer 2: In-Flight Deduplication                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │  Is there already a request in progress for this key?                   │ │
│ │  YES → Return the existing observable (share it)                        │ │
│ │  NO  → Proceed to Layer 3                                               │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Layer 3: HTTP Request with Retry                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │  Execute HTTP request                                                    │ │
│ │  On success → Cache response → Return data                              │ │
│ │  On failure → Retry with exponential backoff                            │ │
│ │  After N failures → Propagate error                                     │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### RxJS Patterns Used

| Pattern | Usage |
|---------|-------|
| `BehaviorSubject` | Tracks loading states per request key |
| `shareReplay(1)` | Shares observable among multiple subscribers |
| `retry()` | Retries failed requests with custom delay |
| `timer()` | Creates delay between retries |
| `finalize()` | Cleanup when observable completes or errors |
| `tap()` | Side effect to cache successful responses |

---

## What

### Step 303.1: Create the Request Coordinator Service

Create the file `src/app/framework/services/request-coordinator.service.ts`:

```typescript
// src/app/framework/services/request-coordinator.service.ts
// VERSION 1 (Section 303) - Three-layer request coordination

import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, timer } from 'rxjs';
import {
  tap,
  finalize,
  shareReplay,
  retry,
  map,
  distinctUntilChanged
} from 'rxjs/operators';

/**
 * Configuration options for request coordination
 */
export interface RequestConfig {
  /**
   * Cache time-to-live in milliseconds
   * Responses older than this are considered stale and refetched
   * @default 30000 (30 seconds)
   */
  cacheTTL?: number;

  /**
   * Number of retry attempts on failure
   * Set to 0 to disable retries
   * @default 3
   */
  retryAttempts?: number;

  /**
   * Initial retry delay in milliseconds
   * Subsequent retries use exponential backoff (delay * 2^attempt)
   * @default 1000 (1 second)
   */
  retryDelay?: number;

  /**
   * Force bypass cache and execute fresh request
   * Use for "refresh" functionality
   * @default false
   */
  skipCache?: boolean;
}

/**
 * Cache entry structure
 */
interface CacheEntry<T> {
  /** Cached response data */
  data: T;
  /** Timestamp when cached (ms since epoch) */
  timestamp: number;
  /** Time-to-live in milliseconds */
  ttl: number;
}

/**
 * Domain-agnostic request coordination service
 *
 * Provides three-layer request processing:
 * 1. **Response Cache** (TTL-based) - Return cached response if fresh
 * 2. **In-Flight Deduplication** - Share ongoing requests
 * 3. **HTTP Request with Retry** - Execute with exponential backoff
 *
 * **Why This Matters:**
 *
 * Without coordination:
 * - User changes filter → 5 requests fire → 5 responses arrive → UI flickers
 * - User hits back button → request for data we just had → wasted bandwidth
 * - Network blip → request fails → data lost
 *
 * With coordination:
 * - User changes filter → 1 request fires → 1 response → smooth UI
 * - User hits back → cache hit → instant data → no network call
 * - Network blip → retry → data recovered
 *
 * @example
 * ```typescript
 * // Basic usage
 * this.coordinator.execute(
 *   'vehicles-page-1',
 *   () => this.api.get<Vehicle[]>('/vehicles?page=1')
 * ).subscribe(vehicles => {
 *   console.log('Vehicles:', vehicles);
 * });
 *
 * // With custom configuration
 * this.coordinator.execute(
 *   'stats-latest',
 *   () => this.api.get<Stats>('/stats'),
 *   { cacheTTL: 60000, retryAttempts: 5 }
 * ).subscribe(stats => {
 *   console.log('Statistics:', stats);
 * });
 *
 * // Force fresh fetch (skip cache)
 * this.coordinator.execute(
 *   'vehicles-page-1',
 *   () => this.api.get<Vehicle[]>('/vehicles?page=1'),
 *   { skipCache: true }
 * ).subscribe();
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class RequestCoordinatorService {
  /**
   * Response cache storage
   *
   * Maps request keys to CacheEntry objects containing:
   * - Cached data
   * - Timestamp when cached
   * - TTL for this entry
   */
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * In-flight requests storage
   *
   * Maps request keys to Observable instances of ongoing HTTP requests.
   * If a second request comes in with the same key while the first is
   * still in progress, we return the same observable (deduplication).
   */
  private inFlightRequests = new Map<string, Observable<any>>();

  /**
   * Loading state per request key
   *
   * Tracks which requests are currently loading.
   * Components can subscribe to know when specific data is loading.
   */
  private loadingStateSubject = new BehaviorSubject<Map<string, boolean>>(
    new Map()
  );

  /**
   * Observable of loading states
   *
   * Emits Map of request keys to loading booleans.
   * Use getLoadingState$() or getGlobalLoading$() for filtered access.
   */
  public loadingState$ = this.loadingStateSubject.asObservable();

  /**
   * Execute HTTP request with caching, deduplication, and retry
   *
   * The three-layer processing:
   * 1. Check cache (return immediately if fresh)
   * 2. Check in-flight (share if same request in progress)
   * 3. Execute HTTP with retry and caching
   *
   * @template T - Response type
   * @param requestKey - Unique identifier for this request
   * @param requestFn - Function that returns Observable (lazy execution)
   * @param config - Optional request configuration
   * @returns Observable of response data (shared, cached, deduplicated)
   */
  execute<T>(
    requestKey: string,
    requestFn: () => Observable<T>,
    config?: RequestConfig
  ): Observable<T> {
    const effectiveConfig = this.getEffectiveConfig(config);

    // Layer 1: Check response cache (unless skipCache)
    if (!effectiveConfig.skipCache) {
      const cachedResponse = this.getCachedResponse<T>(requestKey);
      if (cachedResponse !== null) {
        // Return cached data wrapped in observable
        return new Observable(observer => {
          observer.next(cachedResponse);
          observer.complete();
        });
      }
    }

    // Layer 2: Check in-flight requests (deduplication)
    if (this.inFlightRequests.has(requestKey)) {
      // Return existing observable (same request in progress)
      return this.inFlightRequests.get(requestKey)!;
    }

    // Layer 3: Execute HTTP request with retry
    this.setLoadingState(requestKey, true);

    const request$ = requestFn().pipe(
      // Retry with exponential backoff
      retry({
        count: effectiveConfig.retryAttempts!,
        delay: (error, retryCount) => {
          const delay =
            effectiveConfig.retryDelay! * Math.pow(2, retryCount - 1);
          console.log(
            `[RequestCoordinator] Retry ${retryCount} for ${requestKey} in ${delay}ms`
          );
          return timer(delay);
        }
      }),
      // Cache successful response
      tap(data => {
        if (!effectiveConfig.skipCache) {
          this.setCachedResponse(
            requestKey,
            data,
            effectiveConfig.cacheTTL!
          );
        }
      }),
      // Cleanup on complete/error
      finalize(() => {
        this.inFlightRequests.delete(requestKey);
        this.setLoadingState(requestKey, false);
      }),
      // Share with multiple subscribers (deduplication)
      shareReplay(1)
    );

    // Store in-flight request for deduplication
    this.inFlightRequests.set(requestKey, request$);

    return request$;
  }

  /**
   * Get loading state for specific request
   *
   * @param requestKey - Request identifier
   * @returns Observable of loading state for this request
   */
  getLoadingState$(requestKey: string): Observable<boolean> {
    return this.loadingState$.pipe(
      map(stateMap => stateMap.get(requestKey) || false),
      distinctUntilChanged()
    );
  }

  /**
   * Get global loading state (true if any request is loading)
   *
   * @returns Observable of global loading state
   */
  getGlobalLoading$(): Observable<boolean> {
    return this.loadingState$.pipe(
      map(stateMap => Array.from(stateMap.values()).some(loading => loading)),
      distinctUntilChanged()
    );
  }

  /**
   * Clear all cached responses or specific request cache
   *
   * @param requestKey - Optional specific request key to clear
   */
  clearCache(requestKey?: string): void {
    if (requestKey) {
      this.cache.delete(requestKey);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Invalidate specific cached response
   *
   * Alias for clearCache(requestKey) for semantic clarity.
   *
   * @param requestKey - Request identifier
   */
  invalidateCache(requestKey: string): void {
    this.cache.delete(requestKey);
  }

  /**
   * Invalidate all cached responses matching pattern
   *
   * Useful for invalidating related caches (e.g., all vehicle pages).
   *
   * @param pattern - String pattern to match (simple substring match)
   *
   * @example
   * ```typescript
   * // Invalidate all vehicle-related caches
   * coordinator.invalidateCachePattern('vehicles');
   * // Clears: 'vehicles-page-1', 'vehicles-page-2', 'vehicles-stats'
   * ```
   */
  invalidateCachePattern(pattern: string): void {
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Get current cache size
   *
   * @returns Number of cached entries
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Get number of in-flight requests
   *
   * @returns Number of ongoing requests
   */
  getInFlightCount(): number {
    return this.inFlightRequests.size;
  }

  /**
   * Get cached response if exists and not expired
   *
   * @returns Cached data or null if not found/expired
   */
  private getCachedResponse<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      // Expired - remove and return null
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Store response in cache
   */
  private setCachedResponse<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Update loading state for request
   */
  private setLoadingState(requestKey: string, loading: boolean): void {
    const currentStates = new Map(this.loadingStateSubject.value);

    if (loading) {
      currentStates.set(requestKey, true);
    } else {
      currentStates.delete(requestKey);
    }

    this.loadingStateSubject.next(currentStates);
  }

  /**
   * Get effective configuration with defaults
   */
  private getEffectiveConfig(config?: RequestConfig): Required<RequestConfig> {
    return {
      cacheTTL: config?.cacheTTL ?? 30000,
      retryAttempts: config?.retryAttempts ?? 3,
      retryDelay: config?.retryDelay ?? 1000,
      skipCache: config?.skipCache ?? false
    };
  }
}
```

---

### Step 303.2: Update the Barrel File

Update `src/app/framework/services/index.ts`:

```typescript
// src/app/framework/services/index.ts
// VERSION 3 (Section 303) - Added RequestCoordinatorService

export * from './url-state.service';
export * from './api.service';
export * from './request-coordinator.service';
```

---

## Verification

### 1. Check File Exists

```bash
$ ls -la src/app/framework/services/request-coordinator.service.ts
```

### 2. TypeScript Compilation Check

```bash
$ npx tsc --noEmit src/app/framework/services/request-coordinator.service.ts
```

Expected: No output (no compilation errors).

### 3. Build the Application

```bash
$ ng build
```

Expected: Build succeeds with no errors.

### 4. Verify Deduplication (Optional)

Add temporary test code:

```typescript
// In any component
constructor(
  private api: ApiService,
  private coordinator: RequestCoordinatorService
) {
  // Fire same request 5 times simultaneously
  for (let i = 0; i < 5; i++) {
    this.coordinator.execute(
      'test-dedup',
      () => this.api.get<any>('http://generic-prime.minilab/api/specs/v1/automobiles')
    ).subscribe(response => {
      console.log(`Request ${i} received:`, response);
    });
  }
}
```

In browser DevTools Network tab, you should see only **1** HTTP request, but 5 console logs.

### 5. Verify Caching (Optional)

```typescript
// First request
this.coordinator.execute('test-cache', () => this.api.get<any>(url))
  .subscribe(() => console.log('First request complete'));

// Second request after 1 second (should be cached)
setTimeout(() => {
  this.coordinator.execute('test-cache', () => this.api.get<any>(url))
    .subscribe(() => console.log('Second request complete (from cache)'));
}, 1000);

// Third request after 35 seconds (cache expired, new request)
setTimeout(() => {
  this.coordinator.execute('test-cache', () => this.api.get<any>(url))
    .subscribe(() => console.log('Third request complete (fresh)'));
}, 35000);
```

Network tab should show 2 requests total (first and third).

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| Multiple HTTP requests despite deduplication | Different request keys | Ensure same key for same request |
| Cache never expires | TTL too high | Reduce cacheTTL value |
| Cache always misses | TTL too low | Increase cacheTTL value |
| Retries not working | retryAttempts set to 0 | Use default or positive number |
| Loading state stuck on true | Request never completes | Check for hung HTTP requests |
| `shareReplay` memory leak | Observable never completes | finalize() handles cleanup |

---

## Key Takeaways

1. **Three-layer processing prevents redundant requests** — Cache → Dedup → HTTP
2. **`shareReplay(1)` enables deduplication** — Multiple subscribers share one HTTP call
3. **Exponential backoff handles transient failures** — Each retry waits longer than the last

---

## Acceptance Criteria

- [ ] `src/app/framework/services/request-coordinator.service.ts` exists
- [ ] Barrel file exports the service
- [ ] Service is `@Injectable({ providedIn: 'root' })`
- [ ] `execute()` implements three-layer processing
- [ ] Response cache stores with TTL and expires correctly
- [ ] In-flight deduplication shares observable for duplicate requests
- [ ] Retry logic uses exponential backoff
- [ ] `getLoadingState$()` returns per-request loading observable
- [ ] `getGlobalLoading$()` returns any-loading observable
- [ ] Cache invalidation methods work correctly
- [ ] TypeScript compilation succeeds
- [ ] JSDoc comments document all public methods

---

## Next Step

Proceed to `304-domain-config-registry.md` to create the service that manages domain configurations.
