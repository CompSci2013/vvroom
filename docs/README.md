# URL-First State Management Design Pattern

**Collected**: 2026-02-05
**Sources**: discovery, auto-discovery, simple-prime, generic-prime projects

---

## Overview

URL-First State Management is an architectural pattern where the **URL query string is the single source of truth** for application state. All state changes flow through URL updates, and components reactively subscribe to state derived from the URL.

---

## Core Principle

```
User Action → URL Update → State Service → Components Re-render
                ↑                               ↓
                └───────────────────────────────┘
                   (Components request URL changes)
```

**The URL is never bypassed.** Components never modify state directly—they request URL updates that trigger the state pipeline.

---

## Benefits Delivered

### 1. **Bookmarkable Deep Links**
Every application state has a unique URL. Users can bookmark any filter combination and return to the exact same view.

### 2. **Browser History Integration**
Back/forward buttons work automatically. No special handling required—URL changes trigger state restoration.

### 3. **Shareable State**
Copy URL → Share → Recipient sees identical view. No server-side session required for state persistence.

### 4. **Multi-Window Synchronization**
Pop-out windows can derive state from their own URL or receive state via BroadcastChannel while maintaining URL as authority.

### 5. **Debuggability**
State is always visible in the URL. No need to inspect memory or add logging—current state is in the address bar.

### 6. **Predictable Data Flow**
Unidirectional flow eliminates state synchronization bugs. State changes always follow the same path.

### 7. **Session Recovery**
Browser crash? Restore tabs? State is preserved in the URL.

---

## Architecture Components

### Service Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                         BROWSER URL                          │
│              /discover?manufacturer=Ford&page=1              │
└──────────────────────────┬──────────────────────────────────┘
                           │ (Single Source of Truth)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    UrlStateService                           │
│         Watches URL, emits changes as Observable             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              ResourceManagementService<T, D>                 │
│  - Watches URL changes                                       │
│  - Parses URL → Filters (via FilterUrlMapper)               │
│  - Fetches data (via ApiAdapter + RequestCoordinator)       │
│  - Updates state (via BehaviorSubject)                      │
│  - Emits observables (filters$, results$, loading$, etc.)   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      COMPONENTS                              │
│  Subscribe to: filters$, results$, loading$, error$          │
│  Call: updateFilters(partial) → triggers URL update          │
└─────────────────────────────────────────────────────────────┘
```

### Key Services

| Service | Purpose |
|---------|---------|
| **UrlStateService** | Wraps Angular Router for query param management |
| **ResourceManagementService** | Generic state orchestrator with type parameters |
| **FilterUrlMapper** | Bidirectional URL ↔ Filter object serialization |
| **RequestCoordinator** | Cache, deduplication, retry for HTTP requests |
| **PopOutContextService** | Cross-window communication via BroadcastChannel |

---

## Pop-Out Window Support

URL-First architecture naturally supports pop-out windows:

1. **Pop-out receives its own URL** with highlight parameters (e.g., `?h_yearMin=2015`)
2. **Main window broadcasts STATE_UPDATE** via BroadcastChannel
3. **Pop-out syncs state** without changing its own URL (prevents infinite loops)
4. **URL-derived highlights are preserved** in pop-out even when state updates arrive

```
Main Window                              Pop-out Window
     │                                        │
     │ STATE_UPDATE                           │
     ├──────────────────────────────────────►│
     │ (filters, results, statistics)         │
     │                                        │
     │                FILTER_ADD              │
     │◄──────────────────────────────────────┤
     │ (user clicked in pop-out)              │
     │                                        │
     │ Updates URL                            │
     │ Triggers data fetch                    │
     │ STATE_UPDATE                           │
     ├──────────────────────────────────────►│
     │                                        │
```

---

## Implementation Pattern

### 1. Define Adapters

```typescript
// URL Mapper: Filters ↔ URL Parameters
interface FilterUrlMapper<TFilters> {
  filtersToParams(filters: TFilters): Params;
  paramsToFilters(params: Params): TFilters;
}

// API Adapter: Fetch data for filters
interface ApiAdapter<TFilters, TData> {
  fetchData(filters: TFilters): Observable<ApiResponse<TData>>;
}

// Cache Key Builder: Deterministic cache keys
interface CacheKeyBuilder<TFilters> {
  buildKey(prefix: string, filters: TFilters): string;
}
```

### 2. Create Domain Service

```typescript
const config: ResourceManagementConfig<MyFilters, MyData> = {
  filterMapper: new MyFilterMapper(),
  apiAdapter: new MyApiAdapter(apiService),
  cacheKeyBuilder: new MyCacheKeyBuilder(),
  defaultFilters: { page: 1, size: 20 },
  supportsHighlights: true,
};

return new ResourceManagementService<MyFilters, MyData>(
  route, router, requestCoordinator, config
);
```

### 3. Use in Components

```typescript
// Subscribe to state
this.stateService.filters$.subscribe(filters => ...);
this.stateService.results$.subscribe(results => ...);
this.stateService.loading$.subscribe(loading => ...);

// Request changes (via URL)
this.stateService.updateFilters({ manufacturer: 'Ford' });
// ↑ This updates URL, which triggers the full pipeline
```

---

## Documents in This Collection

| Document | Description |
|----------|-------------|
| [STATE-MANAGEMENT-SPECIFICATION.md](STATE-MANAGEMENT-SPECIFICATION.md) | Comprehensive 1800-line specification of the complete state management system |
| [ARCHITECTURE-OVERVIEW.md](ARCHITECTURE-OVERVIEW.md) | High-level architecture with diagrams and interface definitions |
| [POPOUT-ARCHITECTURE.md](POPOUT-ARCHITECTURE.md) | Detailed pop-out window implementation guide with testing procedures |

---

## Anti-Patterns to Avoid

1. **Direct state mutation** - Never bypass URL for state changes
2. **router.navigate()** - Use UrlStateService instead
3. **URL-less state** - If it matters, put it in the URL
4. **Pop-out URL changes** - Pop-outs receive state via broadcast, don't update their own URLs (except for highlights)
5. **Duplicated API calls** - Pop-outs should NOT call APIs; they receive data from main window

---

## Summary

URL-First State Management provides:

- **Single source of truth**: URL
- **Predictable data flow**: URL → State → Components
- **Built-in features**: History, bookmarks, sharing
- **Multi-window support**: Pop-outs via BroadcastChannel
- **Testability**: State visible in URL, services independently testable
- **Domain agnostic**: Generic via TypeScript type parameters
