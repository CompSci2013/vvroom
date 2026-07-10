Here is the deep anatomical dissection of the `vvroom` Angular framework components.

---
### 1. COMPONENT TREE (Logical Composition & Data Flow)
*Note: These are framework-level components. They are typically composed by domain-specific shells (e.g., `DiscoverComponent`, `AppComponent`). The tree below shows logical parent-child relationships, `@Input`/`@Output` flows, and shared service coupling.*

```
[Domain Shell / AppComponent]
│
├── (Global Overlay) app-ai-chat
│   ├── @Input: (none)
│   └── @Output: (closeChat) ──────────────────────────────────────► Parent
│
├── app-statistics-panel-2 (Chart Grid)
│   ├── @Input: [domainConfig], [isPanelPoppedOut], [isRenderedInPopout]
│   ├── @Output: (chartPopOut), (chartClicked) ────────────────────► Parent
│   └── [CDK Drag-Drop Container]
│       └── app-base-chart (×N)
│           ├── @Input: [dataSource], [statistics], [highlights], [selectedValue], [hideTitle], [canPopOut]
│           └── @Output: (chartClick), (popOutClick) ──────────────► Panel
│
├── app-query-control (Manual Filter Chips)
│   ├── @Input: [domainConfig]
│   └── @Output: (urlParamsChange), (clearAllFilters) ─────────────► Parent/URL
│
├── app-query-panel (Advanced Filter Form)
│   ├── @Input: [domainConfig]
│   └── @Output: (urlParamsChange), (clearAllFilters) ─────────────► Parent/URL
│
├── app-base-picker (Multi-Select Table)
│   ├── @Input: [configId] or [config]
│   └── @Output: (selectionChange) ────────────────────────────────► Parent/URL
│
├── app-results-table (Standard Data Table)
│   └── @Input: [domainConfig] (Directly calls ResourceManagementService)
│
├── app-basic-results-table (Lightweight Table)
│   ├── @Input: [domainConfig]
│   └── @Output: (urlParamsChange) ────────────────────────────────► Parent/URL
│
└── app-dynamic-results-table (Drag/Resize Table)
    ├── @Input: [domainConfig]
    └── @Output: (urlParamsChange) ────────────────────────────────► Parent/URL
```
**Shared State Coupling:** All table/chart/filter components synchronize via `ResourceManagementService`, `UrlStateService`, and `PopOutContextService`. `@Output` events are primarily used for pop-out window isolation or explicit parent routing control.

---
### 2. EVENT FLOW DIAGRAM (ASCII)
*Maps user interactions → component handlers → service/state calls → UI updates.*

```
[USER ACTION]
     │
     ├── Click Filter Chip / Change Query Panel Input / Picker Selection
     │        │
     │        ▼
     │   (urlParamsChange) / updateFilters() / applySelections()
     │        │
     │        ▼
     │   UrlStateService / ResourceManagementService
     │        ├──► Update URL Params & Broadcast State (BroadcastChannel)
     │        └──► Trigger Data Fetch (HttpClient / config.api.fetchData)
     │                 │
     │                 ▼
     │        [Results Table / Base Picker]
     │        (ngOnChanges / Async Pipe / Subject.next)
     │                 │
     │                 ▼
     │   cdr.markForCheck() / detectChanges() → DOM Update
     │
     ├── Click Chart Element (Plotly)
     │        │
     │        ▼
     │   base-chart.onPlotlyClick()
     │        │
     │        ▼
     │   dataSource.handleClick() → dataSource.toUrlParams()
     │        │
     │        ▼
     │   statistics-panel-2.onChartClick()
     │        ├──► urlState.setParams() / popOutContext.sendMessage()
     │        └──► Triggers Filter Sync & Data Refetch (loops to top)
     │
     └── Type Message + Enter / Paste Image
              │
              ▼
         ai-chat.onKeyDown() / onPaste()
              │
              ▼
         ai-service.sendMessage()
              ├──► HTTP/WebSocket to Ollama LLM
              └──► Stream/Receive Response
              │
              ▼
         ai-service.messages$ updates
              │
              ▼
         ai-chat.renderContent() (KaTeX + DomSanitizer)
              │
              ▼
         scrollToBottom() + cdr.markForCheck() → DOM Update
```

---
### 3. COMPONENT ANATOMY

#### 🔹 `ai-chat.component.ts`
| Category | Details |
|:---|:---|
| **Template Bindings** | `[ngModel]="userMessage"`, `(keydown)="onKeyDown($event)"`, `(paste)="onPaste($event)"`, `*ngIf="pendingImage"`, `[innerHTML]="renderContent(msg.content)"`, `[class]="getMessageClass(msg)"`, `(click)="sendMessage()"`, `[hidden]="!isExpanded"` |
| **Lifecycle Hooks** | `ngOnInit()` (checks health), `ngOnDestroy()` (completes `destroy$`) |
| **Injected Services** | `AiService`, `ChangeDetectorRef`, `DomSanitizer` |
| **Emitted Events** | `closeChat` (on panel close) |
| **Service Calls** | `aiService.checkHealth()`, `aiService.sendMessage()`, `aiService.clearSession()`, `aiService.toggleDeepSeekMode()` |

#### 🔹 `base-chart.component.ts`
| Category | Details |
|:---|:---|
| **Template Bindings** | `[data]="plotData"`, `[layout]="plotLayout"`, `[config]="plotConfig"`, `[revision]="plotRevision"`, `(plotlyClick)="onPlotlyClick($event)"`, `(plotlySelected)="onPlotlySelected($event)"`, `(plotlyError)="onPlotlyError($event)"`, `*ngIf="hasError"`, `[hidden]="hideTitle"` |
| **Lifecycle Hooks** | `ngOnInit()` (builds config, updates chart), `ngOnChanges()` (triggers `updateChart()`) |
| **Injected Services** | `ChangeDetectorRef` |
| **Emitted Events** | `chartClick` ({value, isHighlightMode}), `popOutClick` (void) |
| **Service Calls** | Delegates to `@Input() dataSource`: `.transform()`, `.handleClick()`, `.toUrlParams()`, `.getTitle()` |

#### 🔹 `base-picker.component.ts`
| Category | Details |
|:---|:---|
| **Template Bindings** | `[lazy]="true"`, `(onLazyLoad)="onLazyLoad($event)"`, `(onPageChange)="onPageChange($event)"`, `(onSort)="onSort($event)"`, `(onRowSelect)="onRowSelectionChange(...)"`, `[value]="state.selectedKeys"`, `[pageSize]="state.pageSize"`, `[totalRecords]="state.totalCount"`, `(click)="applySelections()"` |
| **Lifecycle Hooks** | `ngOnInit()` (loads config, subscribes to URL), `ngAfterViewInit()` (syncs paginator width), `ngOnDestroy()` |
| **Injected Services** | `PickerConfigRegistry`, `UrlStateService`, `ChangeDetectorRef`, `ElementRef`, `ResourceManagementService` (optional) |
| **Emitted Events** | `selectionChange` (`PickerSelectionEvent<T>`) |
| **Service Calls** | `config.api.fetchData()`, `registry.get()`, `urlState.watchParam()`, `resourceService.filters$` |

#### 🔹 `basic-results-table.component.ts`
| Category | Details |
|:---|:---|
| **Template Bindings** | `[value]="results"`, `[paginator]="true"`, `[first]="paginatorFirst"`, `[rows]="currentFilters['size']"`, `(onPageChange)="onPageChange($event)"`, `(onSort)="onSort($event)"`, `[loading]="loading"`, `[expandedRowKeys]="expandedRows"` |
| **Lifecycle Hooks** | `ngOnInit()` (validates config, pop-out listener), `ngAfterViewInit()` (syncs paginator), `ngOnDestroy()` |
| **Injected Services** | `ResourceManagementService`, `ChangeDetectorRef`, `PopOutContextService`, `ElementRef` |
| **Emitted Events** | `urlParamsChange` (for pop-out sync) |
| **Service Calls** | `resourceService.updateFilters()`, `resourceService.refresh()`, `popOutContext.getMessages$()` |

#### 🔹 `dynamic-results-table.component.ts`
| Category | Details |
|:---|:---|
| **Template Bindings** | `[value]="results$ | async"`, `[paginator]="true"`, `[reorderableColumns]="true"`, `(onColReorder)="onColReorder($event)"`, `[resizableColumns]="true"`, `(onColResize)="onColResize($event)"`, `(onRowExpand)="onRowExpand($event)"`, `(onPageChange)="onPageChange($event)"`, `(onSort)="onSort($event)"` |
| **Lifecycle Hooks** | `ngOnInit()` (init columns, pop-out listener), `ngAfterViewInit()` (syncs paginator + subscribes to `results$`), `ngOnDestroy()` |
| **Injected Services** | `ResourceManagementService`, `ChangeDetectorRef`, `PopOutContextService`, `ElementRef`, `HttpClient` |
| **Emitted Events** | `urlParamsChange` (for pop-out sync) |
| **Service Calls** | `resourceService.updateFilters()`, `resourceService.refresh()`, `http.get()` (VIN cache), `popOutContext.getMessages$()` |

#### 🔹 `query-control.component.ts`
| Category | Details |
|:---|:---|
| **Template Bindings** | `[options]="filterFieldOptions"`, `[(ngModel)]="selectedField"`, `(onChange)="onFieldSelected($event)"`, `(keydown)="onDropdownKeydown($event)"`, `(onHide)="onDropdownHide()"`, `[visible]="showMultiselectDialog"`, `[visible]="showRangeDialog"`, `*ngFor="let filter of activeFilters"`, `(click)="onChipClick($event, filter)"` |
| **Lifecycle Hooks** | `ngOnInit()` (init options, URL/pop-out sync), `ngOnDestroy()` |
| **Injected Services** | `ChangeDetectorRef`, `ApiService`, `UrlStateService`, `PopOutContextService` |
| **Emitted Events** | `urlParamsChange`, `clearAllFilters` |
| **Service Calls** | `apiService.get()` (load filter options), `urlState.params$`, `urlState.getParams()`, `popOutContext.getMessages$()` |

#### 🔹 `query-panel.component.ts`
| Category | Details |
|:---|:---|
| **Template Bindings** | `*ngFor="let filterDef of domainConfig.filters"`, `[(ngModel)]="currentFilters[filterDef.id]"`, `(onChange)="onFilterChange(...)"`, `[options]="getFilterOptions(filterDef.id)"`, `[suggestions]="autocompleteSuggestions[filterDef.id]"`, `(onSearch)="onAutocompleteSearch(...)"`, `(onSlideEnd)="onRangeSliderChange(...)"` |
| **Lifecycle Hooks** | `ngOnInit()` (load dynamic options, subscribe to `filters$`, pop-out listener), `ngOnDestroy()` |
| **Injected Services** | `ResourceManagementService`, `ChangeDetectorRef`, `HttpClient`, `PopOutContextService` |
| **Emitted Events** | `urlParamsChange`, `clearAllFilters` |
| **Service Calls** | `resourceService.updateFilters()`, `http.get()` (dynamic options & autocomplete), `popOutContext.getMessages$()` |

#### 🔹 `results-table.component.ts`
| Category | Details |
|:---|:---|
| **Template Bindings** | `[value]="results"`, `[paginator]="true"`, `[first]="paginatorFirst"`, `(onPageChange)="onPageChange($event)"`, `(onSort)="onSort($event)"`, `[loading]="loading"`, `*ngIf="error"`, `[(ngModel)]="currentFilters[filter.id]"`, `(onChange)="onFilterChange(...)"`, `[expandedRowKeys]="expandedRows"` |
| **Lifecycle Hooks** | `ngOnInit()` (load options, pop-out listener), `ngAfterViewInit()` (sync paginator), `ngOnDestroy()` |
| **Injected Services** | `ResourceManagementService`, `ChangeDetectorRef`, `HttpClient`, `PopOutContextService`, `ElementRef` |
| **Emitted Events** | None (directly mutates `ResourceManagementService`) |
| **Service Calls** | `resourceService.updateFilters()`, `resourceService.refresh()`, `http.get()` (dynamic options), `popOutContext.getMessages$()` |

#### 🔹 `statistics-panel-2.component.ts`
| Category | Details |
|:---|:---|
| **Template Bindings** | `*ngFor="let chartId of chartOrder"`, `[cdkDropListData]="chartOrder"`, `(cdkDropListDropped)="onChartDrop($event)"`, `<app-base-chart [dataSource]="getDataSource(chartId)" ... (chartClick)="onChartClick($event, chartId)" (popOutClick)="onChartPopOut(chartId)">` |
| **Lifecycle Hooks** | `ngOnInit()` (init chart order, subscribe to `statistics$`), `ngOnDestroy()` |
| **Injected Services** | `ResourceManagementService`, `UrlStateService`, `PopOutContextService`, `ChangeDetectorRef` |
| **Emitted Events** | `chartPopOut` (string ID), `chartClicked` ({event, dataSource}) |
| **Service Calls** | `resourceService.statistics$`, `urlState.setParams()`, `popOutContext.sendMessage()`, `popOutContext.isInPopOut()` |

---
### 🔑 Architectural Observations
1. **OnPush Dominance:** All components use `ChangeDetectionStrategy.OnPush`. State updates rely heavily on `cdr.markForCheck()` or `cdr.detectChanges()`, especially in pop-out windows where Zone.js boundaries break automatic detection.
2. **URL-First State Management:** Filters, selections, and pagination are serialized to URL parameters. `UrlStateService` and `ResourceManagementService` act as single sources of truth, enabling deep-linking and pop-out window synchronization via `BroadcastChannel`.
3. **Pop-Out Isolation Pattern:** Components check `PopOutContextService.isInPopOut()`. If true, they emit `@Output()` events instead of calling services directly, allowing a parent shell to bridge state between the main window and the pop-out iframe/window.
4. **Lazy/Async Optimization:** `dynamic-results-table` uses `async` pipes for `ResourceManagementService` observables to guarantee OnPush updates without manual subscriptions. `base-chart` uses a `plotRevision` counter to force Plotly re-renders on data changes.