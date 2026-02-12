# 951: RxJS Operator Reference

**Status:** Reference Document
**Type:** Appendix

---

## Learning Objectives

After reading this reference, you will:
- Have a quick reference for all RxJS operators used in vvroom
- Understand when to use each operator
- Be able to look up operator behavior without leaving the book

---

## Overview

This appendix provides a quick reference for every RxJS operator used in the vvroom application. Operators are grouped by category for easy lookup.

---

## Creation Operators

### `of()`

Creates an Observable that emits the provided values synchronously.

```typescript
import { of } from 'rxjs';

of('a', 'b', 'c').subscribe(x => console.log(x));
// Output: 'a', 'b', 'c' (then completes)
```

**Used in vvroom:** Error handling fallbacks, mock data

---

### `Subject`

A Subject is both an Observable and an Observer. You can push values into it and subscribe to it.

```typescript
import { Subject } from 'rxjs';

const subject = new Subject<string>();

subject.subscribe(x => console.log(x));
subject.next('hello'); // Output: 'hello'
```

**Used in vvroom:** `destroy$` for cleanup, event buses

---

### `BehaviorSubject`

A Subject that requires an initial value and emits the current value to new subscribers.

```typescript
import { BehaviorSubject } from 'rxjs';

const subject = new BehaviorSubject<number>(0);

subject.subscribe(x => console.log('A:', x)); // Output: 'A: 0'
subject.next(1);                               // Output: 'A: 1'
subject.subscribe(x => console.log('B:', x)); // Output: 'B: 1'
```

**Used in vvroom:** `stateSubject` in ResourceManagementService, `paramsSubject` in UrlStateService

---

### `ReplaySubject`

A Subject that replays a specified number of previous values to new subscribers.

```typescript
import { ReplaySubject } from 'rxjs';

const subject = new ReplaySubject<number>(2); // Buffer last 2 values

subject.next(1);
subject.next(2);
subject.next(3);

subject.subscribe(x => console.log(x)); // Output: 2, 3
```

**Used in vvroom:** PopOutContextService for message replay

---

### `timer()`

Creates an Observable that emits after a delay.

```typescript
import { timer } from 'rxjs';

timer(1000).subscribe(() => console.log('1 second passed'));
```

**Used in vvroom:** Request debouncing

---

### `throwError()`

Creates an Observable that immediately emits an error.

```typescript
import { throwError } from 'rxjs';

throwError(() => new Error('Something went wrong'))
  .subscribe({
    error: err => console.error(err.message)
  });
```

**Used in vvroom:** Error propagation in services

---

## Transformation Operators

### `map()`

Transforms each emitted value using a projection function.

```typescript
import { of } from 'rxjs';
import { map } from 'rxjs/operators';

of(1, 2, 3).pipe(
  map(x => x * 10)
).subscribe(x => console.log(x));
// Output: 10, 20, 30
```

**Used in vvroom:** Transforming API responses, extracting state properties

---

### `switchMap()`

Maps to an inner Observable and cancels the previous inner Observable on each emission.

```typescript
import { of, interval } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

of('A', 'B').pipe(
  switchMap(letter => interval(100).pipe(
    take(3),
    map(i => letter + i)
  ))
).subscribe(x => console.log(x));
// Only 'B' values emit (A is cancelled)
// Output: B0, B1, B2
```

**Used in vvroom:** API calls that cancel previous requests when filters change

**When to use:** When only the latest request matters (search, autocomplete)

---

### `mergeMap()`

Maps to an inner Observable and runs all inner Observables concurrently.

```typescript
import { of } from 'rxjs';
import { mergeMap, delay } from 'rxjs/operators';

of(1, 2, 3).pipe(
  mergeMap(x => of(x).pipe(delay(100)))
).subscribe(x => console.log(x));
// Output: 1, 2, 3 (all run in parallel)
```

**When to use:** When all requests should complete (batch operations)

---

### `concatMap()`

Maps to an inner Observable and waits for each to complete before starting the next.

```typescript
import { of } from 'rxjs';
import { concatMap, delay } from 'rxjs/operators';

of(1, 2, 3).pipe(
  concatMap(x => of(x).pipe(delay(100)))
).subscribe(x => console.log(x));
// Output: 1 (wait) 2 (wait) 3 (sequential)
```

**When to use:** When order matters and each request must complete first

---

## Filtering Operators

### `filter()`

Emits only values that pass the predicate function.

```typescript
import { of } from 'rxjs';
import { filter } from 'rxjs/operators';

of(1, 2, 3, 4, 5).pipe(
  filter(x => x % 2 === 0)
).subscribe(x => console.log(x));
// Output: 2, 4
```

**Used in vvroom:** Filtering router events to NavigationEnd

---

### `distinctUntilChanged()`

Emits only when the current value differs from the previous.

```typescript
import { of } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

of(1, 1, 2, 2, 3, 1).pipe(
  distinctUntilChanged()
).subscribe(x => console.log(x));
// Output: 1, 2, 3, 1
```

**With comparator:**

```typescript
of({ id: 1 }, { id: 1 }, { id: 2 }).pipe(
  distinctUntilChanged((a, b) => a.id === b.id)
).subscribe(x => console.log(x));
// Output: { id: 1 }, { id: 2 }
```

**Used in vvroom:** Preventing duplicate API calls when state hasn't changed

---

### `take()`

Emits only the first N values then completes.

```typescript
import { interval } from 'rxjs';
import { take } from 'rxjs/operators';

interval(100).pipe(
  take(3)
).subscribe(x => console.log(x));
// Output: 0, 1, 2 (then completes)
```

**Used in vvroom:** Taking single values from streams

---

### `takeUntil()`

Emits values until a notifier Observable emits.

```typescript
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

const stop$ = new Subject<void>();

interval(100).pipe(
  takeUntil(stop$)
).subscribe(x => console.log(x));

setTimeout(() => stop$.next(), 350);
// Output: 0, 1, 2 (then stops)
```

**Used in vvroom:** Component cleanup pattern with `destroy$`

---

### `debounceTime()`

Emits a value only after a specified time has passed without new emissions.

```typescript
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

const search$ = new Subject<string>();

search$.pipe(
  debounceTime(300)
).subscribe(x => console.log('Search:', x));

search$.next('h');
search$.next('he');
search$.next('hel');
search$.next('help');
// Output: 'Search: help' (after 300ms pause)
```

**Used in vvroom:** Search input debouncing

---

## Error Handling Operators

### `catchError()`

Catches errors on the Observable and returns a new Observable or throws.

```typescript
import { of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

throwError(() => new Error('Oops!')).pipe(
  catchError(err => {
    console.error(err.message);
    return of('fallback value');
  })
).subscribe(x => console.log(x));
// Output: 'Oops!' (error), 'fallback value'
```

**Used in vvroom:** API error handling, graceful degradation

---

### `retry()`

Retries the source Observable a specified number of times on error.

```typescript
import { interval, throwError } from 'rxjs';
import { mergeMap, retry } from 'rxjs/operators';

let attempts = 0;

interval(100).pipe(
  mergeMap(() => {
    attempts++;
    if (attempts < 3) {
      return throwError(() => new Error('Retry'));
    }
    return of('success');
  }),
  retry(2)
).subscribe(x => console.log(x));
```

**Used in vvroom:** HTTP request retry in interceptor

---

## Utility Operators

### `tap()`

Performs side effects without modifying the stream.

```typescript
import { of } from 'rxjs';
import { tap, map } from 'rxjs/operators';

of(1, 2, 3).pipe(
  tap(x => console.log('Before:', x)),
  map(x => x * 10),
  tap(x => console.log('After:', x))
).subscribe();
// Output: Before: 1, After: 10, Before: 2, After: 20, ...
```

**Used in vvroom:** Logging, debugging, caching side effects

---

### `finalize()`

Performs an action when the Observable completes or errors.

```typescript
import { of, throwError } from 'rxjs';
import { finalize } from 'rxjs/operators';

of(1, 2, 3).pipe(
  finalize(() => console.log('Done!'))
).subscribe(x => console.log(x));
// Output: 1, 2, 3, 'Done!'
```

**Used in vvroom:** Resetting loading state after API calls

---

### `delay()`

Delays emission by a specified time.

```typescript
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

of('delayed').pipe(
  delay(1000)
).subscribe(x => console.log(x));
// Output: 'delayed' (after 1 second)
```

**Used in vvroom:** Testing, simulated network latency

---

### `timeout()`

Errors if no value is emitted within a specified time.

```typescript
import { of, NEVER } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';

NEVER.pipe(
  timeout(1000),
  catchError(err => of('Timeout!'))
).subscribe(x => console.log(x));
// Output: 'Timeout!' (after 1 second)
```

**Used in vvroom:** API request timeouts

---

## Combination Operators

### `combineLatest()`

Combines multiple Observables and emits when any source emits (after all have emitted at least once).

```typescript
import { combineLatest, of, interval } from 'rxjs';
import { take, map } from 'rxjs/operators';

combineLatest([
  of('A'),
  interval(100).pipe(take(3))
]).subscribe(([letter, num]) => console.log(letter, num));
// Output: A 0, A 1, A 2
```

**Used in vvroom:** Combining filters from multiple sources

---

### `merge()`

Merges multiple Observables into a single stream.

```typescript
import { merge, interval } from 'rxjs';
import { take, map } from 'rxjs/operators';

merge(
  interval(100).pipe(take(2), map(x => 'A' + x)),
  interval(150).pipe(take(2), map(x => 'B' + x))
).subscribe(x => console.log(x));
// Output: A0, B0, A1, B1 (interleaved by timing)
```

**Used in vvroom:** Merging event streams

---

### `forkJoin()`

Waits for all Observables to complete, then emits an array of the last values.

```typescript
import { forkJoin, of } from 'rxjs';
import { delay } from 'rxjs/operators';

forkJoin([
  of('A').pipe(delay(100)),
  of('B').pipe(delay(200)),
  of('C').pipe(delay(300))
]).subscribe(x => console.log(x));
// Output: ['A', 'B', 'C'] (after 300ms)
```

**Used in vvroom:** Parallel API requests that must all complete

---

## Quick Reference Table

| Operator | Category | Purpose | Cancels Previous? |
|----------|----------|---------|-------------------|
| `of` | Creation | Emit static values | N/A |
| `Subject` | Creation | Observable + Observer | N/A |
| `BehaviorSubject` | Creation | Subject with initial value | N/A |
| `map` | Transform | Transform values | No |
| `switchMap` | Transform | Map + cancel previous | Yes |
| `mergeMap` | Transform | Map + run concurrent | No |
| `concatMap` | Transform | Map + run sequential | No |
| `filter` | Filter | Emit matching values | No |
| `distinctUntilChanged` | Filter | Skip duplicates | No |
| `take` | Filter | Emit first N | No |
| `takeUntil` | Filter | Emit until notifier | No |
| `debounceTime` | Filter | Delay until pause | No |
| `catchError` | Error | Handle errors | No |
| `retry` | Error | Retry on error | No |
| `tap` | Utility | Side effects | No |
| `finalize` | Utility | Cleanup on complete | No |
| `combineLatest` | Combine | Combine latest values | No |
| `merge` | Combine | Merge streams | No |
| `forkJoin` | Combine | Wait for all | No |

---

## Key Takeaways

1. **Use `switchMap` for search/filter operations** — Cancels outdated requests
2. **Use `BehaviorSubject` for state** — Always has a current value
3. **Use `takeUntil(destroy$)` for cleanup** — Prevents memory leaks
4. **Use `distinctUntilChanged` to prevent duplicate work** — Especially with API calls
5. **Use `catchError` to handle errors gracefully** — Don't let streams die unexpectedly

---

## Further Reading

- [RxJS Official Documentation](https://rxjs.dev/)
- [Learn RxJS](https://www.learnrxjs.io/)
- [RxJS Marbles](https://rxmarbles.com/) — Interactive marble diagrams
