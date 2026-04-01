# Brownfield Integration Tips for ngx-popout

This guide provides strategies for integrating `@halolabs/ngx-popout` into applications that do not use the `ResourceManagementService` or the full "URL-First" architecture.

## The Core Concept

`PopOutManagerService` is a **transport and change-detection layer**. It uses Angular CDK Portals to move components into new windows while keeping them attached to the main application's DI and change detection tree. 

It does **not** require a specific state management library. It only needs to know **when** to trigger change detection in the pop-out windows.

---

## Strategy 1: The "Shared Service" Pattern (Recommended)

If your application already uses singleton services (with `BehaviorSubject` or `Observable` streams) to hold state, pop-out components will automatically share these instances if the manager is initialized correctly.

### 1. Initialization
In your main host component (e.g., `AppComponent` or `DashboardComponent`), pass the component's injector:

```typescript
constructor(private injector: Injector, private popOutManager: PopOutManagerService) {
  // Pass the component's injector so pop-outs inherit the same DI context
  this.popOutManager.initialize(this.injector);
}
```

### 2. Synchronization
You don't need to broadcast the actual data if the components share a service instance. You just need to trigger a "kick" to the pop-out window's change detection.

```typescript
// Subscribe to your existing legacy state service
this.myLegacyService.data$.pipe(takeUntil(this.destroy$)).subscribe(() => {
  // Trigger a change detection run in all open pop-outs.
  // We pass an empty object because the pop-out component 
  // is already looking at the shared service instance.
  this.popOutManager.broadcastState({}); 
});
```

---

## Strategy 2: The "Dumb Component" Pattern (@Inputs)

If your pop-out components are "dumb" components that rely strictly on `@Input()` properties, use the `setPopoutInputs` method. This is the most robust way to sync state when components are not service-aware.

```typescript
this.myLegacyService.data$.subscribe(newData => {
  for (const popoutId of this.popOutManager.getPoppedOutPanels()) {
    // Manually push inputs to the component instance in the other window.
    // This automatically builds SimpleChanges and calls ngOnChanges().
    this.popOutManager.setPopoutInputs(popoutId, {
      data: newData,
      lastUpdated: new Date()
    });
  }
});
```

---

## Strategy 3: The "Manual Orchestrator" (Fragmented State)

If your application's state is scattered across local variables or multiple services without a single "push" notification, create a manual synchronization heartbeat.

```typescript
private stateSync$ = new Subject<void>();

// Call this manually whenever a significant UI change occurs (search, filter, clear)
private triggerSync() {
  this.stateSync$.next();
}

ngOnInit() {
  this.stateSync$.pipe(
    debounceTime(50), 
    takeUntil(this.destroy$)
  ).subscribe(() => {
    // Force a refresh of all portal-rendered components
    this.popOutManager.broadcastState({});
  });
}
```

---

## Why it Works Without ResourceManagementService

The magic lies in how `DomPortalOutlet` works:

1.  **DI Inheritance**: When you call `initialize(this.injector)`, portal-rendered components inherit the entire provider tree of the host component. If a service is provided at the root (or at the host component level), the pop-out sees the **exact same instance**.
2.  **Parent-Driven Change Detection**: When you call `broadcastState` or `setPopoutInputs`, the parent application executes `changeDetectorRef.detectChanges()` on the component instance living in the pop-out window.

**Takeaway**: You don't need to move your data between windows; you just need to tell the parent application to re-check the components it has projected into those windows.
