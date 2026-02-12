# Audit: PanelPopoutComponent Comparison

**Date**: 2026-02-11
**vvroom Version**: PanelPopoutComponent (NgModule, template-based routing)
**golden-extension Version**: PopoutComponent (Standalone, child routes)

---

## Overview

The PanelPopoutComponent is the container for pop-out windows. It receives state from the main window via BroadcastChannel and renders the appropriate panel type.

---

## Comparison Table

| Aspect | vvroom | golden-extension | Design Spec | Status |
|--------|--------|------------------|-------------|--------|
| **Module Pattern** | NgModule declared | Standalone component | N/A | OK |
| **Component Routing** | Template ngSwitch | Child routes via router-outlet | Router-based preferred | **DIVERGENCE** |
| **Route Structure** | `/panel/:gridId/:panelId/:type` | `/popout/:gridId/:componentId/:type` | Both valid | OK |
| **State Sync** | syncStateFromExternal | Same | Required | OK |
| **IS_POPOUT_TOKEN** | Provided | Provided | Required | OK |
| **Domain Registry** | Relies on global config | Sets active domain dynamically | Multi-domain support | **MISSING** |
| **Message Types** | Handles multiple | Minimal (CLOSE_POPOUT, STATE_UPDATE) | See analysis | **DIVERGENCE** |
| **Template Complexity** | 273 lines TS, large template | 113 lines TS, minimal template | Simple preferred | **IMPROVEMENT NEEDED** |

---

## Detailed Analysis

### 1. Component Routing Strategy

**vvroom** (template-based with ngSwitch):
```typescript
// Template uses ngSwitch to select component based on panelType
@Component({
  templateUrl: './panel-popout.component.html',  // Contains ngSwitch logic
})
export class PanelPopoutComponent {
  panelType: string = '';  // Extracted from route

  // Methods for each panel type
  getChartDataSource(): any { ... }
  getPickerConfigId(): string { ... }
  onPickerSelectionChange(event: PickerSelectionEvent<any>): void { ... }
  onChartClick(event: { value: string; isHighlightMode: boolean }): void { ... }
}
```

**golden-extension** (router-outlet with child routes):
```typescript
// Minimal container component
@Component({
  template: `
    <div class="popout-container">
      <router-outlet></router-outlet>
    </div>
  `
})
export class PopoutComponent {
  // Only handles STATE_UPDATE and CLOSE_POPOUT
  // Child components handle their own events
}

// Child routes define which component to render
export const POPOUT_ROUTES: Routes = [
  { path: 'query-control', loadComponent: () => import('...QueryControlComponent') },
  { path: 'picker', loadComponent: () => import('...BasePickerComponent') },
  { path: 'chart', loadComponent: () => import('...BaseChartComponent') },
  { path: 'basic-results', loadComponent: () => import('...DynamicResultsTableComponent') },
  { path: 'statistics-2', loadComponent: () => import('...StatisticsPanel2Component') },
];
```

**Analysis**:
- **golden-extension**: Uses Angular Router child routes + lazy loading. PopoutComponent is a minimal shell that only syncs state. Child components handle their own events and send messages directly.
- **vvroom**: Uses template ngSwitch with event forwarding. PanelPopoutComponent must know about every component type and forward events.

**Trade-offs**:
| Approach | Pros | Cons |
|----------|------|------|
| **Child Routes** | Clean separation, lazy loading, less parent code | Requires route configuration |
| **Template ngSwitch** | No route config needed, direct control | Parent component bloated, knows all types |

---

### 2. Message Handling

**vvroom** (handles messages in parent, forwards events):
```typescript
handleMessage(message: PopOutMessage): void {
  switch (message.type) {
    case PopOutMessageType.CLOSE_POPOUT:
      window.close();
      break;

    case PopOutMessageType.STATE_UPDATE:
      this.resourceService.syncStateFromExternal(message.payload.state);
      this.cdr.detectChanges();
      break;

    case PopOutMessageType.URL_PARAMS_SYNC:
      // Pop-outs don't update URL - URL-First compliance
      break;
  }
}

// Event handlers that send messages to main window
onUrlParamsChange(params: any): void {
  this.popOutContext.sendMessage({
    type: PopOutMessageType.URL_PARAMS_CHANGED,
    payload: { params }
  });
}

onPickerSelectionChange(event: PickerSelectionEvent<any>): void {
  this.popOutContext.sendMessage({
    type: PopOutMessageType.PICKER_SELECTION_CHANGE,
    payload: event
  });
}

onChartClick(event: { value: string; isHighlightMode: boolean }): void {
  this.popOutContext.sendMessage({
    type: PopOutMessageType.CHART_CLICK,
    payload: { chartId, ...event }
  });
}
```

**golden-extension** (minimal parent, children send messages directly):
```typescript
private handleMessage(message: PopOutMessage): void {
  switch (message.type) {
    case PopOutMessageType.CLOSE_POPOUT:
      window.close();
      break;

    case PopOutMessageType.STATE_UPDATE:
      this.resourceService.syncStateFromExternal(message.payload.state);
      this.cdr.detectChanges();
      break;
  }
}
// No event forwarding - child components inject PopOutContextService and send messages directly
```

**Analysis**: golden-extension's child components are more self-contained. They inject `PopOutContextService` directly and send messages without parent forwarding. This is cleaner but requires child components to be "pop-out aware."

---

### 3. Domain Registry

**vvroom**: Relies on global DOMAIN_CONFIG injection:
```typescript
constructor(
  @Inject(DOMAIN_CONFIG) domainConfig: DomainConfig<any, any, any>,
) {
  this.domainConfig = domainConfig;
}
```

**golden-extension**: Dynamically sets active domain:
```typescript
constructor(
  private domainRegistry: DomainConfigRegistry
) {}

ngOnInit(): void {
  const domainName = gridId.split('-')[0] || 'automobile';
  this.domainRegistry.setActive(domainName);
}
```

**Analysis**: golden-extension supports multi-domain applications where the active domain must be determined at runtime. vvroom uses a single domain (automobile) configured at app startup.

---

### 4. Component Template

**vvroom** template (implied by methods):
```html
<ng-container [ngSwitch]="panelType">
  <ng-container *ngSwitchCase="'picker'">
    <app-base-picker
      [configId]="getPickerConfigId()"
      (selectionChange)="onPickerSelectionChange($event)"
    ></app-base-picker>
  </ng-container>

  <ng-container *ngSwitchCase="'chart'">
    <app-base-chart
      [dataSource]="getChartDataSource()"
      (chartClick)="onChartClick($event)"
    ></app-base-chart>
  </ng-container>

  <!-- Similar for query-control, statistics, results-table -->
</ng-container>
```

**golden-extension** template:
```html
<div class="popout-container">
  <router-outlet></router-outlet>
</div>
```

---

## URL-First Compliance

| Requirement | Compliance | Notes |
|-------------|------------|-------|
| Pop-out receives state via BroadcastChannel | ✅ PASS | STATE_UPDATE → syncStateFromExternal |
| Pop-out does not update its own URL | ✅ PASS | URL_PARAMS_SYNC explicitly ignored |
| Pop-out sends messages to main for URL changes | ✅ PASS | URL_PARAMS_CHANGED, PICKER_SELECTION_CHANGE, etc. |
| IS_POPOUT_TOKEN provided | ✅ PASS | Ensures autoFetch=false |
| Main window is source of truth | ✅ PASS | Pop-out only receives derived state |

---

## Issues Found

### Critical
None

### Medium
1. **No DomainConfigRegistry.setActive()**: Multi-domain support not implemented.

### Low
1. **Template routing vs. child routes**: Template approach creates larger component.
2. **Event forwarding**: Parent must know all child event types.

---

## Recommendations

1. **Consider child routes pattern**:
```typescript
// app-routing.module.ts
{
  path: 'panel/:gridId/:panelId/:type',
  component: PanelPopoutComponent,
  children: [
    { path: 'query-control', component: QueryControlComponent },
    { path: 'picker', component: BasePickerComponent },
    { path: 'chart', component: BaseChartComponent },
    // ...
  ]
}
```

2. **Add DomainConfigRegistry support** if multi-domain is needed.

3. **Move message sending to child components** to reduce coupling.

---

## Summary

The vvroom PanelPopoutComponent is **functionally correct** for URL-First state management. Pop-out windows:
- Receive state via BroadcastChannel
- Do not make their own API calls (IS_POPOUT_TOKEN=true)
- Send messages to main window for URL changes
- Main window remains the source of truth

The architectural difference (template ngSwitch vs. child routes) is a design choice:
- **vvroom**: More explicit control, all in one place
- **golden-extension**: Cleaner separation, lazy loading, less coupling

Both achieve the same URL-First compliance.

**Overall Status**: ✅ COMPLIANT
