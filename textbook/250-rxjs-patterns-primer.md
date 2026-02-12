# 250: RxJS Patterns Primer

**Status:** Planning
**Depends On:** 209-error-notification-interface
**Blocks:** 301-url-state-service

---

## Learning Objectives

After completing this section, you will:
- Understand why Observables are well-suited for modeling state that changes over time
- Know how to use the key RxJS operators used in vvroom: `switchMap`, `combineLatest`, `distinctUntilChanged`, `shareReplay`
- Be able to apply proper cleanup patterns to prevent memory leaks

---

## Objective

Build practical RxJS knowledge before tackling the framework services in Phase 3. This is a teaching interlude focused on the specific RxJS patterns used in vvroom — it's practical, not comprehensive.

---

## Why This Interlude Exists

Phase 3 introduces services like `UrlStateService` and `ResourceManagementService` that use RxJS extensively:

```typescript
// From UrlStateService (Section 301)
this.filters$ = this.route.queryParams.pipe(
  map(params => this.urlMapper.fromUrlParams(params)),
  distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
  shareReplay(1)
);

// From ResourceManagementService (Section 306)
this.results$ = this.filters$.pipe(
  switchMap(filters => this.apiAdapter.fetchData(filters)),
  map(response => response.results),
  shareReplay(1)
);
```

If you've never used RxJS, this code is confusing. What does `switchMap` do? Why `shareReplay(1)`? This primer answers those questions with practical examples.

---

## What Are Observables?

### The Problem: Modeling Change Over Time

Traditional variables represent a value at a single point in time:

```typescript
let count = 0;
count = 1;
count = 2;
// Each assignment replaces the previous value
```

But in UI applications, we often need to react to changes:
- When the URL changes, update the display
- When a filter changes, fetch new data
- When data arrives, update the table

Observables model **sequences of values over time**:

```typescript
// Observable of values: 0, then 1, then 2, over time
const count$ = interval(1000); // Emits 0, 1, 2, ... every second

count$.subscribe(value => {
  console.log(value); // Logs each value as it arrives
});
```

The `$` suffix is a naming convention indicating "this is an Observable."

### Observables vs Promises

| Promises | Observables |
|----------|-------------|
| Single value | Multiple values over time |
| Eager (starts immediately) | Lazy (starts on subscribe) |
| Not cancellable | Cancellable (unsubscribe) |
| No operators | Rich operator library |

Promises are great for one-time async operations. Observables are better for ongoing data streams like user input, WebSocket messages, or state changes.

---

## The Four Essential Operators

Vvroom uses many RxJS operators, but four are critical to understand:

### 1. `switchMap` — Cancel and Switch

**Problem:** When the URL changes rapidly (user clicking filters quickly), you don't want to process all intermediate requests — just the latest one.

```typescript
import { switchMap } from 'rxjs/operators';

// Without switchMap: every filter change triggers a request
// Results may arrive out of order, showing stale data

// With switchMap: previous request is cancelled when a new one starts
this.results$ = this.filters$.pipe(
  switchMap(filters => this.apiAdapter.fetchData(filters))
);
```

**How it works:**

```
filters$:    --A------B--C-------->
                \      \  \
fetchData(A):    ---X   |  |      (cancelled)
fetchData(B):          -X  |      (cancelled)
fetchData(C):              ----Y-->
results$:    ----------------Y--->

Only the result of the last request (C → Y) is emitted.
```

**When to use:** API calls triggered by user input where only the latest matters.

### 2. `combineLatest` — Combine Multiple Streams

**Problem:** You need to react when *any* of several values change, and you need all current values together.

```typescript
import { combineLatest } from 'rxjs';

// Combine filters and highlights into a single stream
const combined$ = combineLatest([
  this.filters$,
  this.highlights$
]);

combined$.subscribe(([filters, highlights]) => {
  // Called whenever either filters OR highlights change
  // Always has the latest value of both
  this.fetchData(filters, highlights);
});
```

**How it works:**

```
filters$:      --A----B---------->
highlights$:   ----1----2-------->
combined$:     ----[A,1][B,1][B,2]>

Emits when either changes, always with latest values.
```

**Important:** `combineLatest` doesn't emit until *all* source Observables have emitted at least once. If one never emits, combined never emits.

**When to use:** Combining multiple independent state sources.

### 3. `distinctUntilChanged` — Skip Duplicates

**Problem:** The URL might "change" to the same value (user clicks same link twice). You don't want to re-fetch identical data.

```typescript
import { distinctUntilChanged } from 'rxjs/operators';

this.filters$ = this.route.queryParams.pipe(
  map(params => this.urlMapper.fromUrlParams(params)),
  distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
);
```

**How it works:**

```
input:    --A--A--B--B--A-->
output:   --A-----B-----A-->

Consecutive duplicates are skipped.
```

**The comparator function:** For objects, you need a custom comparator because `{a:1} !== {a:1}` (different object references). The example uses `JSON.stringify` for deep comparison. For large objects, consider a more efficient comparison.

**When to use:** Preventing unnecessary work when values haven't actually changed.

### 4. `shareReplay(1)` — Share and Cache

**Problem:** Multiple components subscribe to `filters$`. Without sharing, each subscription triggers a new execution of the Observable chain.

```typescript
import { shareReplay } from 'rxjs/operators';

// Without shareReplay: each subscriber gets a separate stream
// URL parsing happens multiple times

// With shareReplay(1): all subscribers share one stream
this.filters$ = this.route.queryParams.pipe(
  map(params => this.urlMapper.fromUrlParams(params)),
  distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
  shareReplay(1)  // Share with all subscribers, replay last value
);
```

**How it works:**

```
Without shareReplay:
  Subscriber A: queryParams → map → distinctUntilChanged
  Subscriber B: queryParams → map → distinctUntilChanged  (separate execution)

With shareReplay(1):
  Subscriber A ─┐
                ├─ queryParams → map → distinctUntilChanged (shared)
  Subscriber B ─┘
```

**The `1` parameter:** Replay the last 1 value to new subscribers. This means late subscribers immediately get the current value without waiting for the next emission.

**When to use:** Any Observable that multiple components will subscribe to.

---

## Combining Operators: A Real Example

Here's how these operators work together in `ResourceManagementService`:

```typescript
// Setup: combine filters and highlights
private readonly combined$ = combineLatest([
  this.filters$,
  this.highlights$
]).pipe(
  // Skip if neither actually changed
  distinctUntilChanged((a, b) =>
    JSON.stringify(a) === JSON.stringify(b)
  )
);

// Fetch data when combined state changes
this.results$ = this.combined$.pipe(
  // Cancel previous request, start new one
  switchMap(([filters, highlights]) =>
    this.apiAdapter.fetchData(filters, highlights)
  ),
  // Extract just the results
  map(response => response.results),
  // Share with all subscribers, cache last value
  shareReplay(1)
);
```

**The flow:**

1. `combineLatest` — Whenever filters OR highlights change, emit both
2. `distinctUntilChanged` — Skip if the combined value is the same
3. `switchMap` — Cancel any in-flight request, start a new one
4. `map` — Extract the results from the response
5. `shareReplay(1)` — Share with all components, cache the latest

---

## Error Handling

Observables have built-in error handling with `catchError`:

```typescript
import { catchError, of } from 'rxjs';

this.results$ = this.filters$.pipe(
  switchMap(filters => this.apiAdapter.fetchData(filters).pipe(
    catchError(error => {
      // Log the error
      console.error('API Error:', error);

      // Notify the user
      this.errorService.notify(error);

      // Return empty results (don't break the stream)
      return of({ results: [], total: 0 });
    })
  )),
  map(response => response.results),
  shareReplay(1)
);
```

**Important:** `catchError` must return an Observable. Use `of()` to create an Observable from a static value.

**Where to put catchError:** Inside the `switchMap` callback, not after it. This way, errors in one request don't kill the entire stream — future filter changes will still trigger new requests.

---

## Cleanup Patterns

Observables can cause memory leaks if not properly cleaned up. Every `subscribe()` must eventually `unsubscribe()`.

### Pattern 1: Store and Unsubscribe

```typescript
import { Subscription } from 'rxjs';

@Component({ /* ... */ })
export class MyComponent implements OnDestroy {
  private subscription: Subscription;

  ngOnInit() {
    this.subscription = this.filters$.subscribe(filters => {
      // Handle filters
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
```

### Pattern 2: Use `takeUntil` (Preferred)

```typescript
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({ /* ... */ })
export class MyComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.filters$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(filters => {
      // Handle filters
    });

    // Multiple subscriptions can share the same destroy$
    this.results$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(results => {
      // Handle results
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### Pattern 3: Use the Async Pipe (Best)

The async pipe in templates automatically subscribes and unsubscribes:

```typescript
@Component({
  template: `
    <div *ngIf="filters$ | async as filters">
      Current manufacturer: {{ filters.manufacturer }}
    </div>
  `
})
export class MyComponent {
  filters$ = this.urlStateService.filters$;
}
```

**Why this is best:**
- No manual subscription management
- No memory leak risk
- Angular handles everything

Use the async pipe whenever possible. Fall back to `takeUntil` when you need the value in component code.

---

## The Aha Moment

**Observables model change over time. That's why they fit state management.**

In vvroom's URL-First architecture:
- The URL is state
- The URL changes over time (user navigates, clicks filters)
- Components need to react to those changes

Observables are the perfect fit:

```typescript
// URL changes over time
this.route.queryParams  // Observable<Params>

// Filters derived from URL, changing over time
this.filters$  // Observable<TFilters>

// Results derived from filters, changing over time
this.results$  // Observable<TData[]>

// Components react to changes
this.results$.subscribe(results => this.updateTable(results));
```

The entire data flow is modeled as Observables:

```
URL → queryParams → filters → API request → results → display
     (Observable)  (Observable)            (Observable)
```

When the URL changes, the entire chain reacts automatically. You don't manually trigger updates — you describe how data flows, and RxJS handles the rest.

---

## Quick Reference

| Operator | Purpose | Use When |
|----------|---------|----------|
| `switchMap` | Cancel previous, use latest | API calls from user input |
| `combineLatest` | Combine multiple streams | Need all current values together |
| `distinctUntilChanged` | Skip duplicates | Preventing unnecessary work |
| `shareReplay(1)` | Share and cache | Multiple subscribers |
| `catchError` | Handle errors | API calls that might fail |
| `takeUntil` | Auto-unsubscribe | Component cleanup |
| `map` | Transform values | Converting response formats |
| `filter` | Skip values | Conditional processing |
| `tap` | Side effects | Logging, debugging |

---

## Practice Exercises

Try these in your editor or the TypeScript Playground.

### Exercise 1: Basic Observable

What does this log?

```typescript
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

of(1, 2, 3).pipe(
  map(x => x * 2)
).subscribe(console.log);
```

<details>
<summary>Answer</summary>

```
2
4
6
```

`of(1, 2, 3)` emits three values. `map(x => x * 2)` doubles each.
</details>

### Exercise 2: switchMap

If `fetchData(id)` returns a Promise, what's the output?

```typescript
import { of } from 'rxjs';
import { switchMap, delay } from 'rxjs/operators';

of('A', 'B', 'C').pipe(
  switchMap(id => of(`Result: ${id}`).pipe(delay(100)))
).subscribe(console.log);
```

<details>
<summary>Answer</summary>

```
Result: C
```

Only the last value (`C`) produces output because `switchMap` cancels previous inner Observables when a new value arrives.
</details>

### Exercise 3: combineLatest

When does this emit?

```typescript
import { combineLatest, Subject } from 'rxjs';

const a$ = new Subject<string>();
const b$ = new Subject<number>();

combineLatest([a$, b$]).subscribe(console.log);

a$.next('X');
b$.next(1);
a$.next('Y');
```

<details>
<summary>Answer</summary>

```
['X', 1]
['Y', 1]
```

Nothing emits after `a$.next('X')` because `b$` hasn't emitted yet.
After `b$.next(1)`, both have values, so it emits `['X', 1]`.
After `a$.next('Y')`, it emits `['Y', 1]` (latest values).
</details>

---

## Common Mistakes

### Mistake 1: Forgetting to Unsubscribe

```typescript
// Wrong: memory leak
ngOnInit() {
  this.filters$.subscribe(filters => { /* ... */ });
}

// Right: cleanup on destroy
ngOnDestroy() {
  this.subscription.unsubscribe();
}
```

### Mistake 2: Nested Subscribes

```typescript
// Wrong: callback hell, hard to manage
this.filters$.subscribe(filters => {
  this.apiAdapter.fetchData(filters).subscribe(response => {
    this.results = response.results;
  });
});

// Right: use operators to flatten
this.results$ = this.filters$.pipe(
  switchMap(filters => this.apiAdapter.fetchData(filters)),
  map(response => response.results)
);
```

### Mistake 3: Missing shareReplay

```typescript
// Wrong: each subscriber triggers separate API calls
this.results$ = this.filters$.pipe(
  switchMap(filters => this.apiAdapter.fetchData(filters))
);

// Right: share the result
this.results$ = this.filters$.pipe(
  switchMap(filters => this.apiAdapter.fetchData(filters)),
  shareReplay(1)
);
```

---

## Key Takeaways

1. **Observables model change over time** — Perfect for UI state that updates
2. **`switchMap` cancels previous operations** — Use for API calls from user input
3. **`shareReplay(1)` prevents duplicate work** — Always use when multiple components subscribe

---

## Acceptance Criteria

This is a teaching section with no code changes. Criteria are conceptual:

- [ ] You can explain why Observables fit state management
- [ ] You know when to use `switchMap` vs other flattening operators
- [ ] You understand what `shareReplay(1)` does and why it matters
- [ ] You can implement proper cleanup with `takeUntil` or async pipe

---

## Next Step

Proceed to `301-url-state-service.md` to create the first framework service using the RxJS patterns you just learned.
