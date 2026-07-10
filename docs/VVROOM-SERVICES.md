Here is the deep anatomical dissection of the `vvroom` Angular services, structured exactly as requested.

### 1. SERVICE DEPENDENCY MAP (ASCII)
```text
╔══════════════════════════════════════════════════════════════════════════╗
║                     ANGULAR DI DEPENDENCY TREE                            ║
╚══════════════════════════════════════════════════════════════════════════╝

┌──────────────┐     ┌──────────────────┐     ┌────────────────────────┐
│  HttpClient  │────▶│  AiService       │     │  HttpRequestModule     │
└──────────────┘     └──────────────────┘     └────────────────────────┘
┌──────────────┐     ┌──────────────────┐     ┌────────────────────────┐
│  HttpClient  │────▶│  ApiService      │────▶│  FilterOptionsService  │
└──────────────┘     └──────────────────┘     └────────────────────────┘
┌──────────────┐     ┌──────────────────┐     ┌────────────────────────┐
│  Injector    │────▶│  GlobalErrorHdl  │     │  HttpInterceptorToken  │
└──────────────┘     └──────────────────┘     └────────────────────────┘
┌──────────────┐     ┌──────────────────┐     ┌────────────────────────┐
│  MessageSvc  │────▶│  ErrNotifSvc     │     │  GlobalErrorHdl (Top)  │
└──────────────┘     └──────────────────┘     └────────────────────────┘
┌──────────────┐     ┌──────────────────┐     ┌────────────────────────┐
│  DomainVal   │────▶│  DomainCfgReg    │────▶│  ResourceMgmtService   │
└──────────────┘     └──────────────────┘     └────────────────────────┘
┌──────────────┐     ┌──────────────────┐     ┌────────────────────────┐
│  Router      │────▶│  UrlStateSvc     │────▶│  ResourceMgmtService   │
└──────────────┘     └──────────────────┘     └────────────────────────┘
┌──────────────┐     ┌──────────────────┐     ┌────────────────────────┐
│  Router/     │────▶│  PopOutCtxSvc    │────▶│  PopOutManagerSvc      │
│  NgZone      │     └──────────────────┘     └────────────────────────┘
└──────────────┘     ┌──────────────────┐     
│  NgZone        │────▶│  PopOutManagerSvc│     
└──────────────┘     └──────────────────┘     

┌─────────────────────────────────────────────────────────────────────┐
│  IO DEPS / EXTERNAL                                                    │
│  ○ AutRoute -> UrlStateSvc                                           │
│  ○ IS_POPOUT_TOKEN -> ResourceMgmtSvc                                │
│  ○ DOMAIN_CONFIG -> ResourceMgmtSvc                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 2. OBSERVABLE CHAIN MAP (ASCII)
```text
╔══════════════════════════════════════════════════════════════════════════╗
║                    RXJS SUBJECT → PIPE → OBSERVABLE → SUBSCRIBERS       ║
╚══════════════════════════════════════════════════════════════════════════╝

[UrlStateService]
  ├─ paramsSubject (BSubject<Params>)
  │  └─ .pipe(map, distinctUntilChanged)
  │     └─ params$ / watchParams()
  │        └─ Subscribe: ResourceMgmtSvc, Components, PopOutCtxSvc
  │
  └─ Emits From: Router.events, setParams(), constructor

[ResourceManagementService]
  ├─ stateSubject (BSubject<ResourceState>)
  │  └─ .pipe(map, distinctUntilChanged) [x7]
  │     └─ state$, filters$, results$, totalResults$, loading$, error$, statistics$, highlights$
  │        └─ Subscribe: Components, PopOutManagerSvc (via syncStateFromExternal)
  │
  ├─ destroy$ (Subject<void>)
  │  └─ .pipe(takeUntil)
  │     └─ Subscribe: Internal (watchUrlChanges)
  │
  └─ Emits From: updateState(), initializeFromUrl(), watchUrlChanges(), fetchData(), syncStateFromExternal()

[RequestCoordinatorService]
  └─ loadingStateSubject (BSubject<Map<string, boolean>>)
     └─ .pipe(map, distinctUntilChanged)
        └─ getLoadingState$(), getGlobalLoading$()
           └─ Subscribe: Components, LoadingSpinners
     └─ Emits From: execute(), setLoadingState()

[PopOutContextService]
  └─ messagesSubject (ReplaySubject<PopOutMessage>)
     └─ (No pipe)
        └─ getMessages$()
           └─ Subscribe: PopOutManagerSvc, Components (PanelPopout)
     └─ Emits From: channel.onmessage (broadcastChannel callback)

[PopOutManagerService]
  ├─ messagesSubject (Subject<{panelId, message}>)
  ├─ closedSubject (Subject<string>)
  └─ blockedSubject (Subject<string>)
     └─ (No pipes)
        └─ Subscribe: Components (Discover, QueryControl)
     └─ Emits From: PopOutContextSvc, handlePopOutClosed, window.checkInterval

[AiService]
  ├─ config$ (BSubject<AiServiceConfig>)
  ├─ session$ (BSubject<ChatSession>)
  ├─ apiContext$ (BSubject<ApiContext|null>)
  └─ deepSeekMode$ (BSubject<boolean>)
     └─ .pipe(map)
        └─ Subscribe: Components (ChatInterface, SettingsPanel)
     └─ Emits From: configure(), sendMessage(), summarizeResults(), toggleDeepSeekMode()

[UserPreferencesService]
  ├─ panelOrderSubject (BSubject<string[]>)
  └─ collapsedPanelsSubject (BSubject<string[]>)
     └─ (No pipes)
        └─ Subscribe: Components (PanelLayout, DragDropManager)
     └─ Emits From: savePanelOrder(), saveCollapsedPanels(), reset(), constructor

[FilterOptionsService]
  └─ cache$ (BSubject<FilterOptionsCache>)
     └─ (No pipe)
        └─ Subscribe: Components, PopOutManagerSvc
     └─ Emits From: getOptions(), syncFromExternal(), constructor
```

### 3. STATE FLOW DIAGRAM (ASCII)
```text
╔══════════════════════════════════════════════════════════════════════════╗
║                     STATE FLOW: URL-FIRST ARCHITECTURE                  ║
╚══════════════════════════════════════════════════════════════════════════╝

  [USER / ROUTER]
        │
        ▼
  ◄──────────────────────────────────────────────────────────────────────────┐
  │ 1. URL Query Params Change                                              │
  │    (Initial load, back/forward, programmatic navigation)                │
  └──────────────────────────────────────────────────────────────────────────┘
        │
        ▼
  ┌─────────────────────────────────────┐
  │  Router.events (NavigationEnd)      │
  │  └─► UrlStateService               │
  │      .parseUrl()                    │
  │      .paramsSubject.next(params)    │
  └─────────────────────────────────────┘
        │
        ▼
  ┌─────────────────────────────────────┐
  │  UrlStateService.watchParams()      │
  │  └─► Pipe: distinctUntilChanged    │
  └─────────────────────────────────────┘
        │
        ▼
  ┌─────────────────────────────────────┐
  │  ResourceManagementService          │
  │  ├─ initializeFromUrl()           │
  │  │  └─► filterMapper.fromUrl()    │
  │  │     └─► updateState()         │
  │  └─ watchUrlChanges()             │
  │     └─► filterMapper.fromUrl()    │
  │        └─► updateState()         │
  │           └─► if autoFetch:      │
  │                fetchData()       │
  │                 └─► apiAdapter   │
  │                    .fetchData()  │
  │                     └─► updateState() │
  └─────────────────────────────────────┘
        │
        ▼
  ┌─────────────────────────────────────┐
  │  stateSubject.next(newState)        │
  │  └─► .pipe(map) [x7]               │
  │      └─► filters$, results$, ...  │
  └─────────────────────────────────────┘
        │
        ▼
  ┌─────────────────────────────────────┐
  │  Component Subscriptions            │
  │  ├─ QueryControl: reads filters$  │
  │  ├─ ResultsTable: reads results$  │
  │  └─ StatsPanel:   reads stats$    │
  └─────────────────────────────────────┘
        │
        │  ◄── 2. Component Triggered Filter Change ──►
        │
  ┌─────────────────────────────────────┐
  │  ResourceManagementService          │
  │  updateFilters(partial)           │
  │  └─► filterMapper.toUrlParams()  │
  │      └─► urlState.setParams()    │
  │           └─► Router.navigate()   │
  │                └─► Loop Back to 1 │
  └─────────────────────────────────────┘

  ─────────────────────────────────────────────────────────────────────────
  │  POP-OUT SYNCHRONIZATION (Main → Popout)                               │
  │                                                                      │
  │  Main Window: Rms.state$ → PopOutManagerSvc.broadcastState()         │
  │                └─► BroadcastChannel.postMessage()                     │
  │                                                                      │
  │  Popout Window: PopOutContextSvc.channel.onmessage                   │
  │                └─► PanelPopoutComponent.syncStateFromExternal()      │
  │                    └─► Rms.stateSubject.next(externalState)          │
  │                        └─► Components re-render (No API call)        │
  ───────────────────────────────────────────────────────────────────────
```

### 4. SERVICE DEEP-DIVE (Purpose, Methods, Management, Callers)

#### 🔹 `UrlStateService`
* **Purpose:** Domain-agnostic URL query parameter manager. Acts as the bridge between Angular Router and application state. Ensures URL is the single source of truth.
* **Manages:** `paramsSubject` (`BehaviorSubject<Params>`)
* **Public Methods & Signatures:**
  * `getParams<T>(): T`
  * `setParams<T>(params: Partial<T>, replaceUrl?: boolean): Promise<boolean>`
  * `watchParams<T>(): Observable<T>`
  * `clearParams(replaceUrl?: boolean): Promise<boolean>`
  * `getParam(key: string): any`
  * `setParam(key: string, value: any, replaceUrl?: boolean): Promise<boolean>`
  * `hasParam(key: string): boolean`
  * `watchParam(key: string): Observable<any>`
  * `serializeParams(params: Params): string`
  * `deserializeParams(queryString: string): Params`
* **Who Calls It:** `ResourceManagementService`, UI Components, `PopOutContextService`

#### 🔹 `ResourceManagementService`
* **Purpose:** Core state orchestrator for the URL-first architecture. Coordinates filter-to-URL mapping, API fetching, state broadcasting, and pop-out synchronization. Disables auto-fetch in pop-out windows.
* **Manages:** `stateSubject` (`BehaviorSubject<ResourceState>`), `destroy$` (`Subject<void>`), `config` (`ResourceManagementConfig`)
* **Public Methods & Signatures:**
  * `state$: Observable<ResourceState>`
  * `filters$: Observable<TFilters>`
  * `results$: Observable<TData[]>`
  * `totalResults$: Observable<number>`
  * `loading$: Observable<boolean>`
  * `error$: Observable<Error | null>`
  * `statistics$: Observable<TStatistics>`
  * `highlights$: Observable<any>`
  * `updateFilters(partial: Partial<TFilters>): void`
  * `clearFilters(): void`
  * `refresh(): void`
  * `getCurrentState(): ResourceState<TFilters, TData, TStatistics>`
  * `getCurrentFilters(): TFilters`
  * `get filters(): TFilters`
  * `get results(): TData[]`
  * `get totalResults(): number`
  * `get loading(): boolean`
  * `get error(): Error | null`
  * `get statistics(): TStatistics`
  * `get highlights(): any`
  * `syncStateFromExternal(externalState: ResourceState<TFilters, TData, TStatistics>): void`
  * `destroy(): void`
  * `ngOnDestroy(): void`
* **Who Calls It:** All UI Components (`DiscoverComponent`, `PanelPopoutComponent`), `UrlStateService`, `PopOutManagerService`

#### 🔹 `RequestCoordinatorService`
* **Purpose:** Three-layer HTTP request handler: TTL-based cache, in-flight deduplication, and HTTP retry with exponential backoff. Exposes granular loading states per request key.
* **Manages:** `cache` (`Map<string, CacheEntry>`), `inFlightRequests` (`Map<string, Observable>`), `loadingStateSubject` (`BehaviorSubject<Map>`)
* **Public Methods & Signatures:**
  * `loadingState$: Observable<Map<string, boolean>>`
  * `getLoadingState$(requestKey: string): Observable<boolean>`
  * `getGlobalLoading$(): Observable<boolean>`
  * `execute<T>(requestKey: string, requestFn: () => Observable<T>, config?: RequestConfig): Observable<T>`
  * `clearCache(requestKey?: string): void`
  * `invalidateCache(requestKey: string): void`
  * `invalidateCachePattern(pattern: string): void`
  * `getCacheSize(): number`
  * `getInFlightCount(): number`
* **Who Calls It:** `ResourceManagementService` (via API adapters), Loading Spinners, Components

#### 🔹 `PopOutContextService`
* **Purpose:** Cross-window communication orchestrator using the `BroadcastChannel` API. Detects pop-out state via route parsing, manages per-panel channels, and broadcasts messages across windows.
* **Manages:** `channel` (`BroadcastChannel | null`), `messagesSubject` (`ReplaySubject`), `context`, `initialized`
* **Public Methods & Signatures:**
  * `isInPopOut(): boolean`
  * `getContext(): PopOutContext | null`
  * `initializeAsPopOut(panelId: string): void`
  * `initializeAsParent(): void`
  * `sendMessage<T>(message: PopOutMessage<T>): void`
  * `getMessages$(): Observable<PopOutMessage>`
  * `createChannelForPanel(panelId: string): BroadcastChannel`
  * `close(): void`
  * `ngOnDestroy(): void`
* **Who Calls It:** `PopOutManagerService`, `PanelPopoutComponent`, `DiscoverComponent`

#### 🔹 `PopOutManagerService`
* **Purpose:** Pop-out window lifecycle manager. Handles window opening, `beforeunload` detection, state broadcasting to all active pop-outs, and channel cleanup.
* **Manages:** `gridId`, `poppedOutPanels` (`Set<string>`), `popoutWindows` (`Map<string, PopOutWindowRef>`), `messagesSubject`, `closedSubject`, `blockedSubject`
* **Public Methods & Signatures:**
  * `initialize(gridId: string): void`
  * `isPoppedOut(panelId: string): boolean`
  * `getPoppedOutPanels(): string[]`
  * `openPopOut(panelId: string, panelType: string, features?: Partial<PopOutWindowFeatures>): boolean`
  * `broadcastState(state: any, filterOptionsCache?: FilterOptionsCache): void`
  * `closePopOut(panelId: string): void`
  * `closeAllPopOuts(): void`
  * `messages$: Observable<{panelId: string; message: PopOutMessage}>`
  * `closed$: Observable<string>`
  * `blocked$: Observable<string>`
  * `ngOnDestroy(): void`
* **Who Calls It:** `DiscoverComponent`, UI Interaction Handlers

#### 🔹 `ApiService`
* **Purpose:** Domain-agnostic HTTP wrapper. Serializes query parameters, handles array-to-comma conversion, null filtering, and wraps Angular `HttpClient` with standardized `catchError`.
* **Manages:** `http` (`HttpClient`)
* **Public Methods & Signatures:**
  * `get<TData>(endpoint: string, options?: ApiRequestOptions): Observable<ApiResponse<TData>>`
  * `post<TData>(endpoint: string, body: any, options?: ApiRequestOptions): Observable<TData>`
  * `put<TData>(endpoint: string, body: any, options?: ApiRequestOptions): Observable<TData>`
  * `patch<TData>(endpoint: string, body: any, options?: ApiRequestOptions): Observable<TData>`
  * `delete<TData>(endpoint: string, options?: ApiRequestOptions): Observable<TData>`
  * `getStandard<TData>(endpoint: string, options?: ApiRequestOptions): Observable<TData>`
* **Who Calls It:** `FilterOptionsService`, `UserPreferencesService`, `GenericApiAdapter`

#### 🔹 `AiService`
* **Purpose:** LLM communication layer (Ollama). Handles chat sessions, model preloading (keep-alive), multimodal routing (vision vs text), system prompt injection, JSON query extraction, and health checks.
* **Manages:** `config$`, `session$`, `apiContext$`, `deepSeekMode$`, `modelsPreloaded`, `responseStream$`
* **Public Methods & Signatures:**
  * `config$: Observable<AiServiceConfig>`
  * `session$: Observable<ChatSession>`
  * `messages$: Observable<ChatMessage[]>`
  * `isLoading$: Observable<boolean>`
  * `error$: Observable<string | undefined>`
  * `hasApiContext$: Observable<boolean>`
  * `isDeepSeekMode$: Observable<boolean>`
  * `messages: ChatMessage[]`
  * `isLoading: boolean`
  * `error: string | undefined`
  * `hasApiContext: boolean`
  * `isDeepSeekMode: boolean`
  * `configure(config: Partial<AiServiceConfig>): void`
  * `setApiContext(context: ApiContext): void`
  * `clearApiContext(): void`
  * `toggleDeepSeekMode(): void`
  * `sendMessage(userMessage: string, images?: ImageAttachment[]): Observable<ChatMessage>`
  * `summarizeResults(resultsSummary: string): Observable<ChatMessage>`
  * `clearSession(): void`
  * `getSession(): ChatSession`
  * `checkHealth(): Observable<boolean>`
  * `getAvailableModels(): Observable<string[]>`
* **Who Calls It:** Chat UI Components, Query Controls, Auto-configuration Modules

#### 🔹 `FilterOptionsService`
* **Purpose:** Caches dropdown/options API responses. Supports URL-first architecture by allowing pop-out windows to sync cached options via `syncFromExternal()` without hitting the network.
* **Manages:** `cache` (`FilterOptionsCache`), `cache$` (`BehaviorSubject`)
* **Public Methods & Signatures:**
  * `getCache(): FilterOptionsCache`
  * `getCache$(): Observable<FilterOptionsCache>`
  * `getOptions(endpoint: string, field: string, transformer?: (response: any) => FilterOption[]): Observable<FilterOption[]>`
  * `getRawResponse(endpoint: string): any | null`
  * `getRawResponseAsync(endpoint: string, field: string): Observable<any>`
  * `syncFromExternal(externalCache: FilterOptionsCache): void`
  * `isCached(endpoint: string): boolean`
  * `clearCache(): void`
* **Who Calls It:** Filter UI Components, `PopOutManagerService`, `ResourceManagementService`

#### 🔹 `UserPreferencesService`
* **Purpose:** Persists UI layout state (panel order, collapsed panels) across sessions. Supports domain namespacing (`prefs:automobiles:...`), graceful localStorage degradation, and optional backend API sync.
* **Manages:** `panelOrderSubject`, `collapsedPanelsSubject`, `currentDomain`, `storageAvailable`, `fullPreferences`
* **Public Methods & Signatures:**
  * `getPanelOrder(): Observable<string[]>`
  * `getCollapsedPanels(): Observable<string[]>`
  * `savePanelOrder(order: string[]): void`
  * `saveCollapsedPanels(panels: string[]): void`
  * `reset(domain?: string): void`
* **Who Calls It:** Panel Layout Components, Drag-and-Drop Managers, Settings UI

#### 🔹 `DomainConfigRegistry`
* **Purpose:** Central registry for pluggable domain configurations. Manages registration, validation, active switching, and retrieval of domain-specific adapters, mappers, and UI configs.
* **Manages:** `configs` (`Map<string, DomainConfig>`), `activeDomainName`
* **Public Methods & Signatures:**
  * `register<T>(config: DomainConfig<TFilters, TData, TStatistics>, validate?: boolean): void`
  * `registerMultiple(configs: DomainConfig<any, any, any>[], validate?: boolean): void`
  * `registerDomainProviders(providers: Provider[], injector: Injector): void`
  * `get<T>(domainName: string): DomainConfig<TFilters, TData, TStatistics>`
  * `getActive<T>(): DomainConfig<TFilters, TData, TStatistics>`
  * `setActive(domainName: string): void`
  * `getActiveDomainName(): string | undefined`
  * `has(domainName: string): boolean`
  * `getAllDomainNames(): string[]`
  * `getAll(): DomainConfig<any, any, any>[]`
  * `unregister(domainName: string): boolean`
  * `clear(): void`
  * `getCount(): number`
  * `validate<T>(config: DomainConfig<TFilters, TData, TStatistics>): ConfigValidationResult`
  * `getValidationSummary(domainName: string): string`
* **Who Calls It:** Application Bootstrap, `ResourceManagementService` (via `@Inject(DOMAIN_CONFIG)`), Domain Modules

#### 🔹 `DomainConfigValidator`
* **Purpose:** Runtime validator for `DomainConfig` objects. Ensures required strings, valid URLs, interface compliance (`fetchData`, `toUrlParams`, `buildKey`), unique IDs, and boolean feature flags. Produces structured validation reports.
* **Manages:** None (Stateless)
* **Public Methods & Signatures:**
  * `validate<T>(config: DomainConfig<TFilters, TData, TStatistics>): ConfigValidationResult`
  * `validateAndSanitize<T>(config: DomainConfig<TFilters, TData, TStatistics>): DomainConfig<TFilters, TData, TStatistics>`
  * `getValidationSummary(result: ConfigValidationResult): string`
* **Who Calls It:** `DomainConfigRegistry.register()`, Test Suites, Config Validation Panels

#### 🔹 `ErrorNotificationService`
* **Purpose:** Centralized error notification gateway using PrimeNG Toast. Implements signature-based deduplication (3s window), severity categorization, and configurable display timeouts.
* **Manages:** `recentErrors` (`Map<string, number>`), `DEDUPLICATION_WINDOW` (3000ms), `CLEANUP_INTERVAL` (10000ms)
* **Public Methods & Signatures:**
  * `showError(summary: string, detail: string, options?: ErrorDisplayOptions): void`
  * `showWarning(summary: string, detail: string, options?: ErrorDisplayOptions): void`
  * `showInfo(summary: string, detail: string, options?: ErrorDisplayOptions): void`
  * `showSuccess(summary: string, detail: string, options?: ErrorDisplayOptions): void`
  * `showHttpError(error: any, options?: ErrorDisplayOptions): void`
  * `showGenericError(error: Error, options?: ErrorDisplayOptions): void`
  * `show(notification: ErrorNotification, options?: ErrorDisplayOptions): void`
  * `clearAll(): void`
  * `clear(key?: string): void`
* **Who Calls It:** `GlobalErrorHandler`, `HttpErrorInterceptor`, Components

#### 🔹 `GlobalErrorHandler`
* **Purpose:** Angular's top-level exception catcher. Unwraps Angular wrapper errors, categorizes them (HTTP, Chunk Load, Promise Rejection, Generic), and routes them to `ErrorNotificationService` with appropriate UI behavior (sticky vs auto-dismiss).
* **Manages:** `injector` (`Injector`)
* **Public Methods & Signatures:**
  * `handleError(error: any): void`
* **Who Calls It:** Angular Core Runtime (Exception Handler)

#### 🔹 `HttpErrorInterceptor`
* **Purpose:** Global HTTP interceptor. Intercepts all `HttpRequest`/`HttpResponse` chains. Applies retry logic for transient errors (5xx, 429), formats backend/client errors into consistent JSON payloads, and logs diagnostics.
* **Manages:** `retryConfig` (`RetryConfig`)
* **Public Methods & Signatures:**
  * `intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>`
  * `setRetryConfig(config: Partial<RetryConfig>): void`
* **Who Calls It:** Angular `HttpClient` Chain, `ApiService`, `GenericApiAdapter`

#### 🔹 `PickerConfigRegistry`
* **Purpose:** Central registry for UI picker configurations. Manages lookup by ID, bulk registration, and dynamic removal of picker definitions used by autocomplete/dropdown components.
* **Manages:** `configs` (`Map<string, PickerConfig>`)
* **Public Methods & Signatures:**
  * `register<T>(config: PickerConfig<T>): void`
  * `registerMultiple(configs: PickerConfig<any>[]): void`
  * `get<T>(id: string): PickerConfig<T>`
  * `has(id: string): boolean`
  * `getAllIds(): string[]`
  * `getAll(): PickerConfig<any>[]`
  * `unregister(id: string): boolean`
  * `clear(): void`
  * `getCount(): number`
* **Who Calls It:** Picker UI Components, Domain Configuration Modules, Test Suites

---
**Architecture Note:** The `vvroom` codebase follows a strict **URL-First** pattern. `UrlStateService` owns the URL, `ResourceManagementService` owns the state, and `PopOutContextService`/`PopOutManagerService` keep cross-window state synchronized via `BroadcastChannel`. All services are engineered to be stateless or minimally stateful, relying heavily on RxJS `BehaviorSubject` chains for reactive rendering.