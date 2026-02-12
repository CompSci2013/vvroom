# 953: Debugging Guide

**Status:** Reference Document
**Type:** Appendix

---

## Learning Objectives

After reading this guide, you will:
- Know how to diagnose common Angular and RxJS issues
- Understand how to use browser DevTools effectively
- Be able to debug URL-First state management problems

---

## Overview

This appendix provides debugging strategies for the vvroom application. It covers Angular-specific debugging, RxJS observable debugging, and URL-First architecture troubleshooting.

---

## Browser DevTools Essentials

### Opening DevTools

| Browser | Shortcut |
|---------|----------|
| Chrome/Edge | `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac) |
| Firefox | `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac) |
| Safari | `Cmd+Option+I` (enable in Preferences → Advanced first) |

### Essential Panels

| Panel | Use For |
|-------|---------|
| Console | Error messages, `console.log` output |
| Network | API requests, response data, timing |
| Elements | DOM inspection, CSS debugging |
| Sources | Breakpoints, step debugging |
| Application | localStorage, sessionStorage, cookies |

---

## Console Debugging

### Strategic Console Logging

```typescript
// Bad - vague
console.log(filters);

// Good - contextual
console.log('[UrlStateService] Parsed filters:', filters);

// Better - with timestamp for async flows
console.log(`[${Date.now()}] [ResourceService] Fetching data for:`, filters);
```

### Console Methods

| Method | Use Case |
|--------|----------|
| `console.log()` | General output |
| `console.error()` | Errors (red in console) |
| `console.warn()` | Warnings (yellow in console) |
| `console.table()` | Display arrays/objects as table |
| `console.group()` / `console.groupEnd()` | Group related logs |
| `console.time()` / `console.timeEnd()` | Measure execution time |

### Debugging Objects

```typescript
// See full object structure
console.dir(complexObject);

// Table view for arrays
console.table(vehicles);

// Group related logs
console.group('Filter Processing');
console.log('Input:', rawParams);
console.log('Parsed:', parsedFilters);
console.log('Validated:', validatedFilters);
console.groupEnd();
```

---

## Angular-Specific Debugging

### Angular DevTools Extension

Install the [Angular DevTools](https://angular.io/guide/devtools) browser extension for:

- Component tree inspection
- Change detection profiling
- Dependency injection debugging

### Common Angular Errors

#### "Can't bind to 'X' since it isn't a known property"

**Cause:** Component/directive not imported in the module.

**Solution:**
```typescript
// Check the module imports
@NgModule({
  imports: [
    CommonModule,      // For *ngIf, *ngFor
    FormsModule,       // For [(ngModel)]
    RouterModule,      // For routerLink
    SomeComponent      // For standalone components
  ]
})
```

#### "No provider for X"

**Cause:** Service not provided in module or component.

**Solution:**
```typescript
// Option 1: providedIn root (preferred)
@Injectable({ providedIn: 'root' })
export class MyService { }

// Option 2: Provide in module
@NgModule({
  providers: [MyService]
})

// Option 3: Provide in component
@Component({
  providers: [MyService]
})
```

#### "ExpressionChangedAfterItHasBeenCheckedError"

**Cause:** Value changed during change detection cycle.

**Solution:**
```typescript
// Wrap in setTimeout or use ChangeDetectorRef
constructor(private cdr: ChangeDetectorRef) {}

ngAfterViewInit(): void {
  // Defer the change
  setTimeout(() => {
    this.value = newValue;
    this.cdr.markForCheck();
  }, 0);
}
```

#### Template Binding Errors

Debug with JSON pipe:
```html
<!-- See what the value actually is -->
<pre>{{ someValue | json }}</pre>

<!-- Check if observable has emitted -->
<pre>{{ observable$ | async | json }}</pre>
```

---

## RxJS Debugging

### The tap() Operator

Insert `tap()` to inspect stream values without modifying them:

```typescript
this.urlState.params$.pipe(
  tap(params => console.log('[1] Raw params:', params)),
  map(params => this.parseFilters(params)),
  tap(filters => console.log('[2] Parsed filters:', filters)),
  switchMap(filters => this.apiService.fetch(filters)),
  tap(response => console.log('[3] API response:', response))
).subscribe();
```

### Debugging Subscription Issues

#### "Observable not emitting"

Check these in order:

1. **Is it subscribed?**
```typescript
// Cold observables don't run without subscription
observable$.subscribe();  // or use | async in template
```

2. **Has the source emitted?**
```typescript
source$.pipe(
  tap(v => console.log('Source emitted:', v))
).subscribe();
```

3. **Is it filtered out?**
```typescript
source$.pipe(
  tap(v => console.log('Before filter:', v)),
  filter(v => v.isValid),
  tap(v => console.log('After filter:', v))
).subscribe();
```

4. **Is switchMap cancelling it?**
```typescript
// switchMap cancels previous inner observables
// Use mergeMap if you need all to complete
```

#### "Observable emitting too many times"

```typescript
// Add distinctUntilChanged to prevent duplicates
source$.pipe(
  tap(v => console.log('Before distinct:', v)),
  distinctUntilChanged(),
  tap(v => console.log('After distinct:', v))
).subscribe();
```

#### Memory Leaks

Check for missing unsubscribe:

```typescript
// Bad - leaks on component destroy
ngOnInit() {
  this.service.data$.subscribe(data => this.data = data);
}

// Good - uses takeUntil pattern
private destroy$ = new Subject<void>();

ngOnInit() {
  this.service.data$.pipe(
    takeUntil(this.destroy$)
  ).subscribe(data => this.data = data);
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

---

## URL-First Debugging

### Verifying URL State

1. **Check the URL directly:**
   - Look at the browser address bar
   - Compare expected vs actual query parameters

2. **Log URL changes:**
```typescript
// In UrlStateService or component
this.router.events.pipe(
  filter(event => event instanceof NavigationEnd),
  tap(event => console.log('[Router] Navigation:', event.url))
).subscribe();
```

3. **Log parsed parameters:**
```typescript
this.route.queryParams.pipe(
  tap(params => console.log('[Route] Query params:', params))
).subscribe();
```

### Common URL-First Issues

#### Filters not updating URL

Check the URL mapper:
```typescript
console.log('[UrlMapper] toParams input:', filters);
const params = this.urlMapper.toParams(filters);
console.log('[UrlMapper] toParams output:', params);
```

#### URL not updating view

Check the filter parsing:
```typescript
console.log('[UrlMapper] fromParams input:', params);
const filters = this.urlMapper.fromParams(params);
console.log('[UrlMapper] fromParams output:', filters);
```

#### Circular updates (infinite loop)

Add distinctUntilChanged with deep comparison:
```typescript
this.route.queryParams.pipe(
  distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
  tap(params => console.log('Params changed:', params))
).subscribe();
```

---

## Network Debugging

### Inspecting API Calls

In DevTools Network panel:

1. Filter by "XHR" or "Fetch" to see only API calls
2. Click a request to see:
   - **Headers**: Request/response headers
   - **Payload**: Request body (POST/PUT)
   - **Preview**: Response data (formatted)
   - **Response**: Raw response
   - **Timing**: How long each phase took

### Common API Issues

#### CORS Errors

```
Access to XMLHttpRequest at 'http://api.example.com' from origin 'http://localhost:4200'
has been blocked by CORS policy
```

**Solution:** API server must include CORS headers, or use Angular proxy:

```json
// proxy.conf.json
{
  "/api": {
    "target": "http://api.example.com",
    "secure": false,
    "changeOrigin": true
  }
}
```

#### 401 Unauthorized

Check:
1. Is the auth token being sent?
2. Is the token expired?
3. Is the token in the correct header format?

```typescript
// Log request headers in interceptor
intercept(req: HttpRequest<any>, next: HttpHandler) {
  console.log('[HTTP] Request headers:', req.headers.keys());
  console.log('[HTTP] Auth header:', req.headers.get('Authorization'));
  return next.handle(req);
}
```

#### 404 Not Found

Check:
1. Is the URL correct? (log it)
2. Is the API endpoint deployed?
3. Are path parameters correct?

---

## Plotly.js Chart Debugging

### Chart Not Rendering

1. **Check container dimensions:**
```typescript
const container = this.chartContainer.nativeElement;
console.log('Container size:', container.clientWidth, 'x', container.clientHeight);
// Must be > 0
```

2. **Check data format:**
```typescript
console.log('Traces:', JSON.stringify(chartData.traces, null, 2));
console.log('Layout:', JSON.stringify(chartData.layout, null, 2));
```

3. **Check for Plotly errors:**
```typescript
Plotly.newPlot(element, traces, layout)
  .then(() => console.log('Plot created successfully'))
  .catch(err => console.error('Plotly error:', err));
```

### Chart Not Updating

Ensure you're calling react, not newPlot:
```typescript
// newPlot creates a new chart (slower)
// react updates existing chart (faster)
if (this.plotlyElement) {
  Plotly.react(this.plotlyElement, traces, layout);
} else {
  Plotly.newPlot(element, traces, layout);
}
```

---

## Pop-out Window Debugging

### Messages Not Received

1. **Check message posting:**
```typescript
// In parent window
console.log('[Parent] Sending message:', message);
popoutWindow.postMessage(message, '*');
```

2. **Check message receiving:**
```typescript
// In pop-out window
window.addEventListener('message', event => {
  console.log('[Popout] Received message:', event.data);
  console.log('[Popout] Origin:', event.origin);
});
```

3. **Check window reference:**
```typescript
console.log('[Parent] Popout window:', popoutWindow);
console.log('[Parent] Window closed?:', popoutWindow.closed);
```

### Pop-out Styling Issues

The pop-out window may not load all styles:
1. Check that global styles are linked in pop-out index.html
2. Verify component styles are loaded (not lazy-loaded)
3. Use browser DevTools in the pop-out window itself

---

## Performance Debugging

### Change Detection Issues

```typescript
// Log change detection runs
constructor(private zone: NgZone) {
  zone.onStable.subscribe(() => {
    console.log('[Zone] Change detection complete');
  });
}
```

### Identifying Slow Operations

```typescript
console.time('expensiveOperation');
// ... operation
console.timeEnd('expensiveOperation');
// Output: expensiveOperation: 234.56ms
```

### Memory Leaks

1. Open DevTools → Memory panel
2. Take heap snapshot before and after suspected leak
3. Compare snapshots to find retained objects

---

## Debugging Checklist

When something doesn't work:

1. **Check the console** for errors
2. **Check the network** for failed requests
3. **Add console.log** at key points
4. **Verify data** with `| json` pipe
5. **Check subscriptions** are active
6. **Verify imports** in modules
7. **Check the URL** for state issues
8. **Use breakpoints** for complex logic

---

## Key Takeaways

1. **Console.log strategically** — Add context, use groups, remove when done
2. **Use tap() for RxJS** — Inspect streams without modifying them
3. **Check the Network panel** — API issues often hide there
4. **Angular DevTools helps** — Especially for component tree and DI issues
5. **URL-First means URL-First** — When in doubt, check the URL

---

## Further Reading

- [Angular Debugging Guide](https://angular.io/guide/debugging)
- [Chrome DevTools Documentation](https://developer.chrome.com/docs/devtools/)
- [RxJS Debugging](https://rxjs.dev/guide/testing/marble-testing)
