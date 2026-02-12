# 306: Resource Management Service

**Status:** Complete
**Depends On:** 301-url-state-service, 302-api-service, 303-request-coordinator, 304-domain-config-registry, 305-domain-config-validator
**Blocks:** Phase 3B (307-311), Phase 8 (Framework Components), Phase 9 (Feature Components)

---

## Learning Objectives

After completing this section, you will:
- Understand the role of a state orchestrator in URL-First architecture
- Know how BehaviorSubject enables reactive state management
- Recognize the pattern of converting URL changes to data fetches
- Be able to implement a generic, domain-agnostic resource management service

---

## Objective

Create the `ResourceManagementService` that orchestrates application state with the URL as the single source of truth. This service coordinates filter changes, API calls, state updates, and cross-window synchronization.

---

## Why

We've built the foundation:
- **UrlStateService** — Reads/writes URL parameters
- **ApiService** — Makes HTTP requests
- **RequestCoordinator** — Caches, deduplicates, retries
- **DomainConfigRegistry** — Provides domain configuration

Now we need a service that ties them together. When a user changes a filter:

```
User clicks filter → URL updates → Data fetches → UI updates
```

`ResourceManagementService` is the orchestrator that makes this flow work.

### The State Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              URL (Source of Truth)                           │
│                           ?manufacturer=Ford&page=1                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼ watchParams()
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ResourceManagementService                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   filters$   │  │   results$   │  │   loading$   │  │    error$    │    │
│  │ {mfr: Ford}  │  │ [...data]    │  │    false     │  │    null      │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼ subscribe()
┌─────────────────────────────────────────────────────────────────────────────┐
│                              UI Components                                   │
│               Render tables, charts, loading indicators                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why Not Put This in Components?

You might ask: *Why not just subscribe to URL changes in each component?*

```typescript
// Bad: Every component manages its own state
@Component({...})
export class DiscoverComponent {
  filters$ = this.urlState.watchParams().pipe(
    map(params => this.mapper.fromUrlParams(params))
  );

  results$ = this.filters$.pipe(
    switchMap(filters => this.api.get('/vehicles', { params: filters }))
  );
}
```

Problems:
1. **Duplication** — Every component repeats the same logic
2. **No state sharing** — Pop-outs can't share state with main window
3. **No caching** — Every component fetches independently
4. **Complex cleanup** — Each component manages subscriptions

`ResourceManagementService` centralizes this:
1. **One place** for URL → filters → API → state logic
2. **State sharing** via `syncStateFromExternal()`
3. **Automatic caching** via RequestCoordinator
4. **Proper cleanup** via `ngOnDestroy()`

### Pop-Out Awareness

When the service runs in a pop-out window, it behaves differently:

- **Main window**: Watches URL, fetches data, updates state
- **Pop-out window**: Does NOT fetch (receives state from main window)

This prevents duplicate API calls and ensures consistency.

### Component-Level Injection

Unlike singleton services, `ResourceManagementService` is **not** `providedIn: 'root'`. Each component that needs resource management provides its own instance:

```typescript
@Component({
  providers: [ResourceManagementService]
})
export class DiscoverComponent {
  constructor(private resources: ResourceManagementService<F, D, S>) {}
}
```

This enables different components to manage different resources independently.

---

## What

### Step 306.1: Create the Popout Token (Placeholder)

Before creating `ResourceManagementService`, we need the `IS_POPOUT_TOKEN`. This will be fully implemented in Section 315, but we need a placeholder now.

Create `src/app/framework/tokens/popout.token.ts`:

```typescript
// src/app/framework/tokens/popout.token.ts
// VERSION 1 (Section 306) - Placeholder, fully implemented in Section 315

import { InjectionToken } from '@angular/core';

/**
 * Injection token to indicate if component is in a pop-out window
 *
 * When true, ResourceManagementService disables auto-fetching
 * and waits for state to be synced from the main window.
 */
export const IS_POPOUT_TOKEN = new InjectionToken<boolean>('IS_POPOUT_TOKEN');
```

Create the tokens barrel file `src/app/framework/tokens/index.ts`:

```typescript
// src/app/framework/tokens/index.ts
// VERSION 1 (Section 306)

export * from './popout.token';
```

---

### Step 306.2: Create Placeholder for PopOutContextService

We also need `PopOutContextService`. Create a placeholder:

```typescript
// src/app/framework/services/popout-context.service.ts
// VERSION 1 (Section 306) - Placeholder, fully implemented in Section 307

import { Injectable } from '@angular/core';

/**
 * Pop-out context service (placeholder)
 *
 * Determines if the current window is a pop-out.
 * Full implementation in Section 307.
 */
@Injectable({
  providedIn: 'root'
})
export class PopOutContextService {
  /**
   * Check if current window is a pop-out
   *
   * @returns True if in pop-out window
   */
  isInPopOut(): boolean {
    // Placeholder implementation
    // Real implementation in Section 307 checks window.opener
    return false;
  }
}
```

---

### Step 306.3: Create the Resource Management Service

Create the file `src/app/framework/services/resource-management.service.ts`:

```typescript
// src/app/framework/services/resource-management.service.ts
// VERSION 1 (Section 306) - Core state orchestrator

import {
  Inject,
  Injectable,
  NgZone,
  OnDestroy,
  Optional
} from '@angular/core';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  finalize,
  map,
  takeUntil
} from 'rxjs/operators';
import { DomainConfig } from '../models/domain-config.interface';
import {
  ResourceManagementConfig,
  ResourceState
} from '../models/resource-management.interface';
import { DOMAIN_CONFIG } from './domain-config-registry.service';
import { PopOutContextService } from './popout-context.service';
import { UrlStateService } from './url-state.service';
import { IS_POPOUT_TOKEN } from '../tokens/popout.token';

/**
 * Deep equality check for filter objects
 *
 * Replaces JSON.stringify comparison with proper structural equality.
 * Handles nested objects and arrays correctly.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return a === b;

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);

  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every(key => deepEqual(aObj[key], bObj[key]));
}

/**
 * Generic resource management service - Core state orchestrator
 *
 * **Purpose:** Manages application state with URL as single source of truth.
 * Coordinates filter changes, API calls, state updates, and cross-window sync.
 *
 * **Architecture:** URL → Filters → API → Data → Components
 *
 * **Key Features:**
 *
 * 1. **URL-first design** — URL parameters are the single source of truth
 * 2. **BehaviorSubject state** — Current values with Observable streams
 * 3. **Domain-agnostic** — Works with any domain via DOMAIN_CONFIG injection
 * 4. **Component-level injection** — New instance per component (not singleton)
 * 5. **Pop-out aware** — Disables API calls in pop-out windows
 *
 * **Usage Pattern:**
 *
 * ```typescript
 * @Component({
 *   providers: [ResourceManagementService] // New instance for this component
 * })
 * export class DiscoverComponent {
 *   filters$ = this.resources.filters$;
 *   results$ = this.resources.results$;
 *   loading$ = this.resources.loading$;
 *
 *   constructor(
 *     private resources: ResourceManagementService<AutoFilters, VehicleResult>
 *   ) {}
 *
 *   onFilterChange(filters: Partial<AutoFilters>): void {
 *     this.resources.updateFilters(filters);
 *   }
 * }
 * ```
 *
 * @template TFilters - Domain-specific filter model type
 * @template TData - Domain-specific data model type
 * @template TStatistics - Domain-specific statistics model type
 */
@Injectable() // NOT providedIn: 'root' — component-level injection
export class ResourceManagementService<TFilters, TData, TStatistics = any>
  implements OnDestroy {

  // ============================================================================
  // Internal State
  // ============================================================================

  /** Subject for cleanup on destroy */
  private readonly destroy$ = new Subject<void>();

  /** Configuration derived from DOMAIN_CONFIG */
  private readonly config: ResourceManagementConfig<TFilters, TData, TStatistics>;

  // ============================================================================
  // BehaviorSubject-Based State
  // ============================================================================

  /** Main state holder — all state in one object */
  private readonly stateSubject: BehaviorSubject<ResourceState<TFilters, TData, TStatistics>>;

  // ============================================================================
  // Observable Streams (Public API)
  // ============================================================================

  /** Full state observable */
  public readonly state$: Observable<ResourceState<TFilters, TData, TStatistics>>;

  /** Current filters (from URL) */
  public readonly filters$: Observable<TFilters>;

  /** Current results (from API) */
  public readonly results$: Observable<TData[]>;

  /** Total result count (for pagination) */
  public readonly totalResults$: Observable<number>;

  /** Loading state */
  public readonly loading$: Observable<boolean>;

  /** Current error (null if none) */
  public readonly error$: Observable<Error | null>;

  /** Statistics data (optional, depends on API) */
  public readonly statistics$: Observable<TStatistics | undefined>;

  /** Highlight filters (for chart segmentation) */
  public readonly highlights$: Observable<any>;

  // ============================================================================
  // Constructor
  // ============================================================================

  /**
   * Constructor — wires up state management
   *
   * @param urlState - Service for URL state management
   * @param domainConfig - Domain configuration (injected via DOMAIN_CONFIG)
   * @param popOutContext - Service to check if in pop-out window
   * @param ngZone - Angular zone for change detection
   * @param isPopOutToken - Optional token indicating pop-out mode
   */
  constructor(
    private readonly urlState: UrlStateService,
    @Inject(DOMAIN_CONFIG) private readonly domainConfig: DomainConfig<TFilters, TData, TStatistics>,
    private readonly popOutContext: PopOutContextService,
    private readonly ngZone: NgZone,
    @Optional() @Inject(IS_POPOUT_TOKEN) private readonly isPopOutToken: boolean
  ) {
    // Determine if in pop-out (token takes precedence)
    const isPopOut = this.isPopOutToken ?? false;

    // Build configuration from domain config
    this.config = {
      filterMapper: this.domainConfig.urlMapper,
      apiAdapter: this.domainConfig.apiAdapter,
      cacheKeyBuilder: this.domainConfig.cacheKeyBuilder,
      defaultFilters: (this.domainConfig.defaultFilters || {}) as TFilters,
      supportsHighlights: this.domainConfig.features?.highlights ?? false,
      highlightPrefix: 'h_',
      // Disable auto-fetch in pop-out windows
      autoFetch: isPopOut ? false : !this.popOutContext.isInPopOut()
    };

    // Initialize state with defaults
    this.stateSubject = new BehaviorSubject<ResourceState<TFilters, TData, TStatistics>>({
      filters: this.config.defaultFilters,
      results: [],
      totalResults: 0,
      loading: false,
      error: null,
      statistics: undefined
    });

    // Create derived observables from state
    this.state$ = this.stateSubject.asObservable();

    this.filters$ = this.state$.pipe(
      map(s => s.filters),
      distinctUntilChanged((a, b) => deepEqual(a, b))
    );

    this.results$ = this.state$.pipe(
      map(s => s.results),
      distinctUntilChanged()
    );

    this.totalResults$ = this.state$.pipe(
      map(s => s.totalResults),
      distinctUntilChanged()
    );

    this.loading$ = this.state$.pipe(
      map(s => s.loading),
      distinctUntilChanged()
    );

    this.error$ = this.state$.pipe(
      map(s => s.error),
      distinctUntilChanged()
    );

    this.statistics$ = this.state$.pipe(
      map(s => s.statistics),
      distinctUntilChanged()
    );

    this.highlights$ = this.state$.pipe(
      map(s => s.highlights ?? {}),
      distinctUntilChanged((a, b) => deepEqual(a, b))
    );

    // Initialize from current URL
    this.initializeFromUrl();

    // Watch for URL changes
    this.watchUrlChanges();
  }

  // ============================================================================
  // Public API — State Mutation
  // ============================================================================

  /**
   * Update filters (triggers URL update → data fetch)
   *
   * Merges partial filters with current filters, updates URL.
   * URL change triggers automatic data fetch (in main window).
   *
   * @param partial - Partial filter object to merge
   *
   * @example
   * ```typescript
   * // Update manufacturer filter
   * this.resources.updateFilters({ manufacturer: 'Ford' });
   *
   * // Update multiple filters
   * this.resources.updateFilters({ manufacturer: 'Ford', page: 1 });
   *
   * // Clear a filter by setting to null/undefined
   * this.resources.updateFilters({ manufacturer: null });
   * ```
   */
  updateFilters(partial: Partial<TFilters>): void {
    const currentFilters = this.stateSubject.value.filters;
    const merged = { ...currentFilters, ...partial };

    // Clean up empty values
    const newFilters: Record<string, any> = {};
    for (const key of Object.keys(merged)) {
      const value = (merged as Record<string, any>)[key];
      if (value !== undefined && value !== null && value !== '') {
        newFilters[key] = value;
      }
    }

    // Convert to URL parameters
    const newUrlParams = this.config.filterMapper.toUrlParams(newFilters as TFilters);

    // Get current URL params to identify removals
    const currentUrlParams = this.config.filterMapper.toUrlParams(currentFilters);

    // Build final params with null for removed params
    const finalParams: Record<string, any> = { ...newUrlParams };
    for (const key of Object.keys(currentUrlParams)) {
      if (!(key in newUrlParams)) {
        finalParams[key] = null; // Mark for removal
      }
    }

    // Update URL (triggers watchUrlChanges → fetchData)
    this.urlState.setParams(finalParams);
  }

  /**
   * Clear all filters (reset to defaults)
   *
   * @example
   * ```typescript
   * // Reset to initial state
   * this.resources.clearFilters();
   * ```
   */
  clearFilters(): void {
    const currentFilters = this.stateSubject.value.filters;
    const currentUrlParams = this.config.filterMapper.toUrlParams(currentFilters);
    const defaultUrlParams = this.config.filterMapper.toUrlParams(this.config.defaultFilters);

    // Build params with null for all current params
    const finalParams: Record<string, any> = { ...defaultUrlParams };
    for (const key of Object.keys(currentUrlParams)) {
      if (!(key in defaultUrlParams)) {
        finalParams[key] = null;
      }
    }

    this.urlState.setParams(finalParams, true); // Replace URL
  }

  /**
   * Refresh data with current filters
   *
   * Forces a new API call with current filter state.
   *
   * @example
   * ```typescript
   * // Force refresh after external data change
   * this.resources.refresh();
   * ```
   */
  refresh(): void {
    this.fetchData(this.stateSubject.value.filters);
  }

  // ============================================================================
  // Public API — State Access
  // ============================================================================

  /**
   * Get current state snapshot (synchronous)
   *
   * @returns Current resource state
   */
  getCurrentState(): ResourceState<TFilters, TData, TStatistics> {
    return this.stateSubject.value;
  }

  /**
   * Get current filters snapshot (synchronous)
   *
   * @returns Current filters
   */
  getCurrentFilters(): TFilters {
    return this.stateSubject.value.filters;
  }

  // ============================================================================
  // Public API — Cross-Window Sync
  // ============================================================================

  /**
   * Sync state from external source
   *
   * Used by pop-out windows to receive state from main window.
   * Bypasses URL → fetch flow and directly updates state.
   *
   * @param externalState - State to sync from main window
   *
   * @example
   * ```typescript
   * // In pop-out window, receiving message from main window
   * window.addEventListener('message', (event) => {
   *   if (event.data.type === 'STATE_SYNC') {
   *     this.resources.syncStateFromExternal(event.data.state);
   *   }
   * });
   * ```
   */
  public syncStateFromExternal(
    externalState: ResourceState<TFilters, TData, TStatistics>
  ): void {
    this.ngZone.run(() => {
      this.stateSubject.next(externalState);
    });
  }

  // ============================================================================
  // Private Methods — Initialization
  // ============================================================================

  /**
   * Initialize filters from current URL
   */
  private initializeFromUrl(): void {
    const urlParams = this.urlState.getParams();
    const filters = this.config.filterMapper.fromUrlParams(urlParams);
    const highlights = this.extractHighlights(urlParams);

    this.updateState({ filters, highlights });
  }

  /**
   * Watch for URL changes and update state
   */
  private watchUrlChanges(): void {
    this.urlState
      .watchParams()
      .pipe(takeUntil(this.destroy$))
      .subscribe(urlParams => {
        const filters = this.config.filterMapper.fromUrlParams(urlParams);
        const highlights = this.extractHighlights(urlParams);
        this.updateState({ filters, highlights });

        // Only fetch in main window (not in pop-out)
        if (this.config.autoFetch) {
          this.fetchData(filters);
        }
      });
  }

  // ============================================================================
  // Private Methods — Data Fetching
  // ============================================================================

  /**
   * Fetch data from API
   */
  private fetchData(filters: TFilters): void {
    this.updateState({ loading: true, error: null });

    const highlights = this.stateSubject.value.highlights;

    this.config.apiAdapter
      .fetchData(filters, highlights)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('[ResourceManagementService] Fetch error:', error);
          this.updateState({
            loading: false,
            error: error instanceof Error ? error : new Error(String(error)),
            results: [],
            totalResults: 0
          });
          return of(null);
        }),
        finalize(() => {
          // Ensure loading is false even if observable completes without value
          if (this.stateSubject.value.loading) {
            this.updateState({ loading: false });
          }
        })
      )
      .subscribe(response => {
        if (response) {
          this.updateState({
            results: response.results,
            totalResults: response.total,
            statistics: response.statistics,
            loading: false,
            error: null
          });
        }
      });
  }

  // ============================================================================
  // Private Methods — Highlights
  // ============================================================================

  /**
   * Extract highlight filters from URL parameters
   */
  private extractHighlights(urlParams: Record<string, any>): any {
    // Prefer domain-specific mapper strategy
    if (this.config.filterMapper.extractHighlights) {
      return this.config.filterMapper.extractHighlights(urlParams);
    }

    // Fallback: prefix-based extraction
    if (!this.config.supportsHighlights) {
      return {};
    }

    const prefix = this.config.highlightPrefix || 'h_';
    const highlights: Record<string, any> = {};

    Object.keys(urlParams).forEach(key => {
      if (key.startsWith(prefix)) {
        const highlightKey = key.substring(prefix.length);
        let value = urlParams[key];

        // Convert pipe-separated to comma-separated
        if (typeof value === 'string' && value.includes('|')) {
          value = value.replace(/\|/g, ',');
        }

        highlights[highlightKey] = value;
      }
    });

    return highlights;
  }

  // ============================================================================
  // Private Methods — State Management
  // ============================================================================

  /**
   * Update state immutably
   */
  private updateState(partial: Partial<ResourceState<TFilters, TData, TStatistics>>): void {
    this.stateSubject.next({ ...this.stateSubject.value, ...partial });
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  /**
   * Clean up subscriptions (public alias)
   */
  destroy(): void {
    this.ngOnDestroy();
  }

  /**
   * Clean up subscriptions on component destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

---

### Step 306.4: Update the Barrel File

Update `src/app/framework/services/index.ts`:

```typescript
// src/app/framework/services/index.ts
// VERSION 6 (Section 306) - Added ResourceManagementService, PopOutContextService

export * from './url-state.service';
export * from './api.service';
export * from './request-coordinator.service';
export * from './domain-config-registry.service';
export * from './domain-config-validator.service';
export * from './popout-context.service';
export * from './resource-management.service';
```

---

## Phase 3A Milestone: Demo Component

After completing Section 306, create a temporary demo component that displays URL state changes.

Create `src/app/features/demo/url-state-demo.component.ts`:

```typescript
// src/app/features/demo/url-state-demo.component.ts
// TEMPORARY - Remove after verification

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UrlStateService } from '../../framework/services';

@Component({
  selector: 'app-url-state-demo',
  template: `
    <div style="padding: 20px; font-family: monospace;">
      <h2>URL State Demo</h2>

      <div style="margin: 20px 0;">
        <h3>Current URL Params:</h3>
        <pre>{{ currentParams | json }}</pre>
      </div>

      <div style="margin: 20px 0;">
        <h3>Test Controls:</h3>
        <button (click)="setManufacturer('Ford')">Set manufacturer=Ford</button>
        <button (click)="setManufacturer('Toyota')">Set manufacturer=Toyota</button>
        <button (click)="setPage(1)">Set page=1</button>
        <button (click)="setPage(2)">Set page=2</button>
        <button (click)="clearAll()">Clear All</button>
      </div>

      <div style="margin: 20px 0;">
        <h3>Log:</h3>
        <div *ngFor="let log of logs" style="font-size: 12px;">{{ log }}</div>
      </div>
    </div>
  `
})
export class UrlStateDemoComponent implements OnInit, OnDestroy {
  currentParams: any = {};
  logs: string[] = [];
  private destroy$ = new Subject<void>();

  constructor(private urlState: UrlStateService) {}

  ngOnInit(): void {
    this.urlState.watchParams()
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.currentParams = params;
        this.logs.unshift(`${new Date().toISOString()}: ${JSON.stringify(params)}`);
        if (this.logs.length > 10) this.logs.pop();
      });
  }

  setManufacturer(value: string): void {
    this.urlState.setParam('manufacturer', value);
  }

  setPage(value: number): void {
    this.urlState.setParam('page', value);
  }

  clearAll(): void {
    this.urlState.clearParams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

Add route for demo (temporary):

```typescript
// In app-routing.module.ts
{ path: 'demo', component: UrlStateDemoComponent }
```

Navigate to `/demo` and test the URL-First pattern in action.

---

## Verification

### 1. Check Files Exist

```bash
$ ls -la src/app/framework/services/resource-management.service.ts
$ ls -la src/app/framework/services/popout-context.service.ts
$ ls -la src/app/framework/tokens/popout.token.ts
```

### 2. TypeScript Compilation Check

```bash
$ npx tsc --noEmit src/app/framework/services/resource-management.service.ts
```

### 3. Build the Application

```bash
$ ng build
```

Expected: Build succeeds with no errors.

### 4. Run Demo Component

```bash
$ ng serve
```

Navigate to `http://localhost:4200/demo` and:

1. Click "Set manufacturer=Ford"
2. Observe URL changes to `?manufacturer=Ford`
3. Observe Current URL Params updates
4. Use browser back button
5. Observe params revert

**This is the Phase 3A Aha Moment in action:**

"The URL is the single source of truth. Components react to URL changes, they don't control them."

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| `Cannot find module '../tokens/popout.token'` | Token file not created | Create the token file in Step 306.1 |
| `No provider for DOMAIN_CONFIG` | Missing provider | Add provider in component or module |
| State not updating | Missing subscription | Ensure component subscribes to observables |
| Infinite loop on filter change | Filter update triggers URL, URL triggers fetch | Check distinctUntilChanged is working |
| Pop-out doesn't receive state | syncStateFromExternal not called | Implement message passing (Phase 3B) |

---

## Key Takeaways

1. **URL is the single source of truth** — updateFilters() modifies URL, not internal state
2. **State flows one direction** — URL → filters → API → results → components
3. **Component-level injection enables isolation** — Each component gets its own instance
4. **Pop-out awareness prevents duplicate fetches** — Main window fetches, pop-outs sync

---

## Acceptance Criteria

- [ ] `src/app/framework/services/resource-management.service.ts` exists
- [ ] `src/app/framework/services/popout-context.service.ts` exists (placeholder)
- [ ] `src/app/framework/tokens/popout.token.ts` exists
- [ ] Service is `@Injectable()` (not providedIn: 'root')
- [ ] Observable streams: filters$, results$, loading$, error$, statistics$
- [ ] `updateFilters()` updates URL, not internal state directly
- [ ] `clearFilters()` resets to default filters
- [ ] `refresh()` forces new data fetch
- [ ] `syncStateFromExternal()` enables pop-out state sync
- [ ] autoFetch disabled in pop-out windows
- [ ] Proper cleanup via ngOnDestroy()
- [ ] TypeScript compilation succeeds
- [ ] Demo component works as described

---

## Phase 3A Complete

Congratulations! You have completed Phase 3A: Core Services.

**What you built:**
- UrlStateService — URL as source of truth
- ApiService — Thin HTTP wrapper
- RequestCoordinatorService — Cache, dedup, retry
- DomainConfigRegistry — Multi-domain support
- DomainConfigValidator — Runtime validation
- ResourceManagementService — State orchestration

**The Aha Moment:**
"The URL is the single source of truth. Components react to URL changes, they don't control them."

---

## Next Step

Proceed to `307-popout-context-service.md` to begin Phase 3B: Popout & Specialized Services.
