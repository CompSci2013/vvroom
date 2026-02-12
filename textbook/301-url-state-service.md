# 301: URL State Service

**Status:** Complete
**Depends On:** 201-209 (Framework Models), 250-rxjs-patterns-primer
**Blocks:** 303-request-coordinator, 306-resource-management-service

---

## Learning Objectives

After completing this section, you will:
- Understand why the URL is the single source of truth for application state
- Know how to read and write URL query parameters in Angular
- Recognize the role of BehaviorSubject in providing synchronous access to asynchronous state
- Be able to implement bidirectional synchronization between application state and the URL

---

## Objective

Create the `UrlStateService` that provides bidirectional synchronization between application state and URL query parameters. This service is the foundation of the URL-First State Management architecture.

---

## Why

Every web application manages state. The question is: *where does that state live?*

Traditional approaches store state in:
- Component properties (lost on navigation)
- Services (lost on page refresh)
- LocalStorage (requires manual sync)

**The URL-First approach stores state in the URL itself.** This provides several benefits:

| Feature | URL-First | Traditional State |
|---------|-----------|-------------------|
| Shareable | Copy URL to share exact application state | Users see different views |
| Bookmarkable | Browser bookmarks preserve state | Bookmarks lose context |
| Deep-linkable | External links open specific views | Links open default views |
| Back/Forward | Browser history "just works" | Requires manual history management |
| Refresh-safe | State survives page refresh | State is lost |
| Debuggable | State visible in browser URL bar | State hidden in memory |

### The Aha Moment

**The URL is the single source of truth. Components react to URL changes, they don't control them.**

When a user clicks a filter, the component doesn't update its own state. Instead, it updates the URL. The URL change triggers an observable emission, which the component subscribes to. The component always *reads* state from the URL.

This creates a unidirectional data flow:

```
User Action → URL Update → Observable Emission → Component Update → UI Render
```

### Angular Router Integration

The Angular Router provides `ActivatedRoute.queryParams` for reading query parameters. However, there's a subtlety: `ActivatedRoute` is scoped to the route hierarchy. A root-level service doesn't receive query param updates from child routes.

`UrlStateService` solves this by:
1. Using `Router.events` to watch all navigation events globally
2. Parsing query parameters from the router's URL directly
3. Emitting changes through a `BehaviorSubject` that any component can subscribe to

### RxJS Patterns Used

This service uses patterns from Interlude B (Section 250):

| Pattern | Usage |
|---------|-------|
| `BehaviorSubject` | Holds current URL params with synchronous access via `.value` |
| `filter()` | Only process `NavigationEnd` events |
| `map()` | Transform navigation events to query param objects |
| `distinctUntilChanged()` | Prevent duplicate emissions for identical params |

---

## What

### Step 301.1: Create the Services Directory Index

Before creating individual service files, create a barrel export file that will aggregate all service exports.

Create the file `src/app/framework/services/index.ts`:

```typescript
// src/app/framework/services/index.ts
// VERSION 1 (Section 301) - Barrel file for framework services

// This barrel file exports all framework services.
// Import from '@app/framework/services' instead of individual files.

export * from './url-state.service';
```

Delete the `.gitkeep` file since the directory now has real content:

```bash
$ rm src/app/framework/services/.gitkeep
```

---

### Step 301.2: Create the URL State Service

Create the file `src/app/framework/services/url-state.service.ts`:

```typescript
// src/app/framework/services/url-state.service.ts
// VERSION 1 (Section 301) - URL-First state management foundation

import { Injectable, NgZone } from '@angular/core';
import { Router, ActivatedRoute, Params, NavigationEnd } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, distinctUntilChanged, filter } from 'rxjs/operators';

/**
 * Domain-agnostic URL state management service
 *
 * Provides bidirectional synchronization between application state and URL query parameters.
 * The URL serves as the single source of truth for application state.
 *
 * **Key Design Decisions:**
 *
 * 1. Uses Router.events instead of ActivatedRoute.queryParams because this is a
 *    root-level singleton service. ActivatedRoute at root level doesn't receive
 *    query param updates from child routes (like /discover).
 *
 * 2. Uses Router.url and parseUrl() instead of ActivatedRoute.snapshot.queryParams
 *    for the same reason — to capture the full URL including child route params.
 *
 * 3. Uses BehaviorSubject to provide:
 *    - Synchronous access to current params via getParams()
 *    - Observable stream for reactive updates via watchParams()
 *    - Immediate value emission to new subscribers
 *
 * @example
 * ```typescript
 * // In a component
 * constructor(private urlState: UrlStateService) {
 *   // Watch for changes reactively
 *   this.urlState.watchParams<MyFilters>().subscribe(filters => {
 *     console.log('Filters changed:', filters);
 *   });
 *
 *   // Get current value synchronously
 *   const current = this.urlState.getParams<MyFilters>();
 *
 *   // Update URL (triggers navigation)
 *   this.urlState.setParams({ page: 2, search: 'ford' });
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class UrlStateService {
  /**
   * BehaviorSubject holding current URL query parameters
   *
   * BehaviorSubject is used instead of Subject because:
   * 1. It holds the current value, enabling synchronous getParams()
   * 2. New subscribers immediately receive the current value
   * 3. It requires an initial value (empty object)
   */
  private paramsSubject = new BehaviorSubject<Params>({});

  /**
   * Public observable stream of URL query parameters
   *
   * Components subscribe to this to react to URL changes.
   */
  public params$: Observable<Params> = this.paramsSubject.asObservable();

  /**
   * Constructor - sets up URL synchronization
   *
   * @param router - Angular Router for navigation and URL parsing
   * @param route - ActivatedRoute for relative navigation
   * @param ngZone - NgZone for ensuring change detection runs
   */
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone
  ) {
    // Initialize from current URL on service creation
    this.initializeFromRoute();

    // Watch for all future URL changes
    this.watchRouteChanges();
  }

  /**
   * Get current URL query parameters as a typed object
   *
   * Provides synchronous access to the current URL state.
   * Use this when you need the current value without subscribing.
   *
   * @template TParams - The shape of the parameters object
   * @returns Current query parameters cast to TParams
   *
   * @example
   * ```typescript
   * interface MyFilters {
   *   search: string;
   *   page: number;
   * }
   *
   * const filters = urlState.getParams<MyFilters>();
   * console.log(filters.search); // Type-safe access
   * ```
   */
  getParams<TParams = Params>(): TParams {
    return this.paramsSubject.value as TParams;
  }

  /**
   * Update URL query parameters
   *
   * Performs a shallow merge with existing parameters and navigates to the new URL.
   * Use null or undefined to remove a parameter.
   *
   * @template TParams - The shape of the parameters object
   * @param params - Partial parameters to update
   * @param replaceUrl - If true, replaces current history entry instead of pushing
   * @returns Promise that resolves when navigation completes
   *
   * @example
   * ```typescript
   * // Update specific params
   * await urlState.setParams({ page: 2, search: 'test' });
   *
   * // Remove a param by setting to null
   * await urlState.setParams({ search: null });
   *
   * // Replace history entry (no new back button entry)
   * await urlState.setParams({ page: 1 }, true);
   * ```
   */
  async setParams<TParams = Params>(
    params: Partial<TParams>,
    replaceUrl = false
  ): Promise<boolean> {
    const currentParams = this.paramsSubject.value;
    const mergedParams = { ...currentParams };

    // Merge new params, removing null/undefined values
    Object.keys(params).forEach(key => {
      const value = (params as any)[key];
      if (value === null || value === undefined) {
        delete mergedParams[key];
      } else {
        mergedParams[key] = value;
      }
    });

    return await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: mergedParams,
      replaceUrl,
      queryParamsHandling: '' // Use exact params, don't preserve
    });
  }

  /**
   * Watch URL query parameters as an observable stream
   *
   * Returns an observable that emits whenever URL query parameters change.
   * Uses distinctUntilChanged to prevent duplicate emissions.
   *
   * @template TParams - The shape of the parameters object
   * @returns Observable of query parameters
   *
   * @example
   * ```typescript
   * urlState.watchParams<MyFilters>().subscribe(filters => {
   *   console.log('URL changed:', filters);
   *   this.loadData(filters);
   * });
   * ```
   */
  watchParams<TParams = Params>(): Observable<TParams> {
    return this.params$.pipe(
      map(params => params as TParams),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
    );
  }

  /**
   * Clear all URL query parameters
   *
   * Navigates to the current path with empty query string.
   *
   * @param replaceUrl - If true, replaces current history entry
   * @returns Promise that resolves when navigation completes
   */
  async clearParams(replaceUrl = false): Promise<boolean> {
    return this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl
    });
  }

  /**
   * Get a specific query parameter value
   *
   * @param key - Parameter key
   * @returns Parameter value or null if not found
   */
  getParam(key: string): any {
    return this.paramsSubject.value[key] || null;
  }

  /**
   * Set a specific query parameter
   *
   * Convenience method for updating a single parameter.
   *
   * @param key - Parameter key
   * @param value - Parameter value (null to remove)
   * @param replaceUrl - If true, replaces current history entry
   * @returns Promise that resolves when navigation completes
   */
  async setParam(
    key: string,
    value: any,
    replaceUrl = false
  ): Promise<boolean> {
    return this.setParams({ [key]: value } as any, replaceUrl);
  }

  /**
   * Check if a specific parameter exists in the URL
   *
   * @param key - Parameter key
   * @returns True if parameter exists
   */
  hasParam(key: string): boolean {
    return key in this.paramsSubject.value;
  }

  /**
   * Watch a specific parameter for changes
   *
   * @param key - Parameter key to watch
   * @returns Observable of parameter value
   */
  watchParam(key: string): Observable<any> {
    return this.params$.pipe(
      map(params => params[key] || null),
      distinctUntilChanged()
    );
  }

  /**
   * Serialize parameters to URL query string
   *
   * Utility method for converting params object to query string format.
   *
   * @param params - Parameters object
   * @returns Query string (without leading '?')
   */
  serializeParams(params: Params): string {
    const queryParams = new URLSearchParams();

    Object.keys(params).forEach(key => {
      const value = params[key];

      // Skip null/undefined
      if (value === null || value === undefined) {
        return;
      }

      // Handle arrays (comma-separated)
      if (Array.isArray(value)) {
        queryParams.set(key, value.join(','));
        return;
      }

      // Convert to string
      queryParams.set(key, String(value));
    });

    return queryParams.toString();
  }

  /**
   * Deserialize URL query string to parameters object
   *
   * Utility method for parsing query string to params object.
   * Automatically converts numeric and boolean strings.
   *
   * @param queryString - Query string (with or without leading '?')
   * @returns Parameters object
   */
  deserializeParams(queryString: string): Params {
    const params: Params = {};
    const urlParams = new URLSearchParams(
      queryString.startsWith('?') ? queryString.slice(1) : queryString
    );

    urlParams.forEach((value, key) => {
      // Try to parse as number
      if (!isNaN(Number(value)) && value !== '') {
        params[key] = Number(value);
        return;
      }

      // Try to parse as boolean
      if (value === 'true' || value === 'false') {
        params[key] = value === 'true';
        return;
      }

      // Check for comma-separated values (arrays)
      if (value.includes(',')) {
        params[key] = value.split(',');
        return;
      }

      // Keep as string
      params[key] = value;
    });

    return params;
  }

  /**
   * Initialize from current route
   *
   * Called once in constructor to set initial state from URL.
   *
   * IMPORTANT: Uses router.url instead of route.snapshot because UrlStateService
   * is a root singleton. Root-level ActivatedRoute.snapshot may not have query
   * params from child routes (like /discover). router.url contains the full URL.
   */
  private initializeFromRoute(): void {
    const params = this.extractQueryParams();
    this.ngZone.run(() => {
      this.paramsSubject.next(params);
    });
  }

  /**
   * Watch for route changes and update internal state
   *
   * Sets up subscription to Router.events for ongoing synchronization.
   *
   * IMPORTANT: Uses Router.events instead of ActivatedRoute.queryParams because
   * UrlStateService is a root singleton. Root-level ActivatedRoute doesn't receive
   * query param updates from child routes (like /discover). Router.events is global
   * and captures all navigation events including query parameter changes.
   */
  private watchRouteChanges(): void {
    this.router.events
      .pipe(
        // Only process NavigationEnd events (route change complete)
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        // Extract query params from the new URL
        map(() => this.extractQueryParams()),
        // Only emit if params actually changed
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
      )
      .subscribe(params => {
        // Use NgZone.run to ensure change detection runs
        this.ngZone.run(() => {
          this.paramsSubject.next(params);
        });
      });
  }

  /**
   * Extract query parameters from current router state
   *
   * Uses router.parseUrl() to reliably extract query params
   * regardless of the route hierarchy.
   */
  private extractQueryParams(): Params {
    const urlTree = this.router.parseUrl(this.router.url);
    return urlTree.queryParams;
  }
}
```

---

### Step 301.3: Update the Barrel File

Update `src/app/framework/services/index.ts` to ensure the export is correct:

```typescript
// src/app/framework/services/index.ts
// VERSION 1 (Section 301) - Barrel file for framework services

export * from './url-state.service';
```

---

## Verification

### 1. Check File Exists

```bash
$ ls -la src/app/framework/services/
```

Expected output:

```
total 12
drwxr-xr-x 2 user user 4096 Feb  9 12:00 .
drwxr-xr-x 5 user user 4096 Feb  9 12:00 ..
-rw-r--r-- 1 user user  123 Feb  9 12:00 index.ts
-rw-r--r-- 1 user user 8456 Feb  9 12:00 url-state.service.ts
```

### 2. TypeScript Compilation Check

```bash
$ cd ~/projects/vvroom
$ npx tsc --noEmit src/app/framework/services/url-state.service.ts
```

Expected: No output (no compilation errors).

### 3. Verify Service Injectability

Add a temporary test to `src/app/app.component.ts`:

```typescript
// src/app/app.component.ts
// TEMPORARY TEST - Remove after verification

import { Component, OnInit } from '@angular/core';
import { UrlStateService } from './framework/services';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'vvroom';

  constructor(private urlState: UrlStateService) {}

  ngOnInit(): void {
    // Log URL changes to console
    this.urlState.watchParams().subscribe(params => {
      console.log('[UrlStateService] URL params:', params);
    });
  }
}
```

### 4. Run the Application

```bash
$ ng serve
```

Open browser to `http://localhost:4200` and:

1. Open browser DevTools (F12) and go to Console tab
2. Navigate to `http://localhost:4200?search=ford&page=1`
3. You should see in console: `[UrlStateService] URL params: {search: 'ford', page: '1'}`
4. Modify the URL manually to `http://localhost:4200?search=toyota&page=2`
5. Console should show the new params

### 5. Verify Browser History

1. Navigate through several URL param changes
2. Click browser Back button
3. Console should show params reverting to previous values
4. This confirms URL-First state management is working

**After verification, remove the temporary test code from AppComponent.**

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| `Cannot find module '@angular/router'` | RouterModule not imported | Ensure RouterModule is in app.module.ts imports |
| Console shows empty object `{}` | Route not configured | Ensure routes exist in app-routing.module.ts |
| Params not updating on child route navigation | Wrong ActivatedRoute | Using Router.events (as implemented) solves this |
| Change detection not running | Missing NgZone | Ensure ngZone.run() wraps paramsSubject.next() |
| Duplicate console logs | Multiple emissions | distinctUntilChanged() should prevent this |
| URL not updating on setParams() | Navigation blocked | Check for route guards or canDeactivate |

---

## Key Takeaways

1. **The URL is the single source of truth** — Components read state from the URL, they don't maintain their own copy
2. **BehaviorSubject enables both sync and async access** — `.value` for sync, `.asObservable()` for reactive streams
3. **Root services need special URL handling** — Use `Router.events` and `router.parseUrl()` instead of `ActivatedRoute.queryParams`

---

## Acceptance Criteria

- [ ] `src/app/framework/services/url-state.service.ts` exists with complete implementation
- [ ] `src/app/framework/services/index.ts` exports the service
- [ ] Service is `@Injectable({ providedIn: 'root' })` for singleton behavior
- [ ] `getParams<T>()` returns typed URL parameters synchronously
- [ ] `setParams<T>()` updates URL and triggers navigation
- [ ] `watchParams<T>()` returns observable stream of URL changes
- [ ] `distinctUntilChanged()` prevents duplicate emissions
- [ ] Service handles child route query params correctly via Router.events
- [ ] NgZone.run() ensures Angular change detection runs
- [ ] TypeScript compilation succeeds with no errors
- [ ] JSDoc comments document all public methods

---

## Next Step

Proceed to `302-api-service.md` to create the service for making HTTP requests to the API.
