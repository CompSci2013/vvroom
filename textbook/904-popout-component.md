# 904: Popout Component

**Status:** Planning
**Depends On:** 307-popout-context-service, 308-popout-manager-service, 315-popout-token
**Blocks:** 905-app-routing-module

---

## Learning Objectives

After completing this section, you will:
- Understand how to create a layout component for pop-out windows
- Know how to use injection tokens to identify pop-out context
- Be able to synchronize state between main window and pop-out windows using BroadcastChannel

---

## Objective

Build the Popout component — a minimal layout shell that hosts framework components in separate browser windows. This enables multi-monitor workflows where users can pop out charts, tables, or query panels to secondary displays while the main window remains focused on other tasks.

---

## Why

Professional data analysis workflows often span multiple monitors. A user might want:

- **Primary monitor:** Main discovery interface with filters
- **Secondary monitor:** Large chart for detailed visualization
- **Third monitor:** Results table for data review

The Popout component makes this possible by:

1. **Providing a Shell** — A minimal container for the popped-out component
2. **Managing Context** — Setting up domain configuration for child components
3. **Synchronizing State** — Receiving state updates from the main window
4. **Forwarding Actions** — Sending user interactions back to the main window

### The Pop-Out Architecture

Pop-out windows don't fetch data independently. Instead:

```
Main Window (source of truth)
    ├── Makes API calls
    ├── Manages URL state
    ├── Broadcasts state updates
    │
    └─── [BroadcastChannel] ───→ Pop-Out Window
                                    ├── Receives state
                                    ├── Renders UI
                                    └── Sends actions back
```

This design ensures consistency: all data flows from one source, and pop-outs are essentially "remote views" of the main window's state.

### Angular Style Guide References

- [Style 05-02](https://angular.io/guide/styleguide#style-05-02): Use services for shared functionality
- [Style 07-01](https://angular.io/guide/styleguide#style-07-01): Define small, focused components

---

## What

### Step 904.1: Create the Popout Feature Directory

```bash
$ cd ~/projects/vvroom
$ mkdir -p src/app/features/popout
```

---

### Step 904.2: Create the Popout Component

Create `src/app/features/popout/popout.component.ts`:

```typescript
// src/app/features/popout/popout.component.ts
// VERSION 1 (Section 904) - Pop-out window layout component

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  PopOutMessage,
  PopOutMessageType
} from '../../../framework/models/popout.interface';
import { DomainConfigRegistry } from '../../../framework/services/domain-config-registry.service';
import { PopOutContextService } from '../../../framework/services/popout-context.service';
import { ResourceManagementService } from '../../../framework/services/resource-management.service';
import { IS_POPOUT_TOKEN } from '../../../framework/tokens/popout.token';

/**
 * Popout Component - Pop-out Window Layout Shell
 *
 * A minimal layout component for pop-out windows. This component:
 * 1. Provides ResourceManagementService and IS_POPOUT_TOKEN to children
 * 2. Sets the active domain so child components can inject domain config
 * 3. Syncs state from main window via BroadcastChannel
 * 4. Renders child components via router-outlet
 *
 * The popout has NO knowledge of specific component types. Child routes
 * determine which component is rendered. Each child component is responsible
 * for its own behavior based on injected services.
 *
 * URL structure: /popout/:gridId/:componentId/:type
 * - gridId: Identifies the source grid (e.g., 'automobile-discover')
 * - componentId: Unique ID of the panel being popped out
 * - type: Component type for routing (e.g., 'chart', 'picker', 'query-control')
 */
@Component({
  selector: 'app-popout',
  templateUrl: './popout.component.html',
  styleUrls: ['./popout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    ResourceManagementService,
    { provide: IS_POPOUT_TOKEN, useValue: true }
  ]
})
export class PopoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private popOutContext: PopOutContextService,
    private cdr: ChangeDetectorRef,
    private resourceService: ResourceManagementService<any, any, any>,
    private domainRegistry: DomainConfigRegistry
  ) {}

  ngOnInit(): void {
    // Extract route parameters and initialize
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const gridId = params['gridId'];
        const componentId = params['componentId'];

        // Extract domain name from gridId (e.g., 'automobile-discover' -> 'automobile')
        const domainName = gridId.split('-')[0] || 'automobile';

        // Set active domain for child components
        this.domainRegistry.setActive(domainName);

        // Initialize BroadcastChannel communication
        this.popOutContext.initializeAsPopOut(componentId);

        // Add pop-out styling classes to document
        document.documentElement.classList.add('popout-html');
        document.body.classList.add('popout-body');
      });

    // Handle messages from the main window
    this.popOutContext
      .getMessages$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        this.handleMessage(message);
      });
  }

  /**
   * Handle incoming messages from the main window
   */
  private handleMessage(message: PopOutMessage): void {
    switch (message.type) {
      case PopOutMessageType.CLOSE_POPOUT:
        // Main window requested this pop-out to close
        window.close();
        break;

      case PopOutMessageType.STATE_UPDATE:
        // Main window sent updated state
        if (message.payload?.state) {
          this.resourceService.syncStateFromExternal(message.payload.state);
          this.cdr.detectChanges();
        }
        break;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**Key design decisions:**

| Decision | Rationale |
|----------|-----------|
| `IS_POPOUT_TOKEN` provided as `true` | Child components can check if they're in a pop-out |
| `ResourceManagementService` provided here | Creates isolated instance that receives state from main |
| Domain extracted from `gridId` | Enables domain-agnostic pop-out support |
| `OnPush` change detection | Requires explicit `detectChanges()` after state sync |

---

### Step 904.3: Create the Popout Component Template

Create `src/app/features/popout/popout.component.html`:

```html
<!-- src/app/features/popout/popout.component.html -->
<!-- VERSION 1 (Section 904) - Minimal pop-out layout -->

<div class="popout-container">
  <router-outlet></router-outlet>
</div>
```

The template is intentionally minimal. The `router-outlet` renders whatever child component is specified by the route (chart, table, picker, etc.).

---

### Step 904.4: Create the Popout Component Styles

Create `src/app/features/popout/popout.component.scss`:

```scss
// src/app/features/popout/popout.component.scss
// VERSION 1 (Section 904) - Pop-out window styles

// Full-height container
.popout-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 1rem;
  background: #f5f5f5;
}

// Global styles applied via class on html/body
:host-context(.popout-html) {
  // Remove default margins
  margin: 0;
  padding: 0;
}

:host-context(.popout-body) {
  margin: 0;
  padding: 0;
  overflow: auto;
}

// Ensure child components take full space
::ng-deep {
  .popout-container > * {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  // Charts should fill available space
  app-base-chart {
    flex: 1;
    min-height: 400px;
  }

  // Tables should scroll internally
  app-dynamic-results-table,
  app-basic-results-table {
    flex: 1;
    overflow: auto;
  }

  // Query control takes its natural height
  app-query-control {
    flex: none;
  }
}
```

---

### Step 904.5: Create the Popout Routes

Create `src/app/features/popout/popout.routes.ts`:

```typescript
// src/app/features/popout/popout.routes.ts
// VERSION 1 (Section 904) - Child routes for pop-out window

import { Routes } from '@angular/router';

/**
 * Popout Child Routes
 *
 * Defines the child routes for the pop-out layout. Each route maps a component
 * type (from the URL) to the actual component that should be rendered.
 *
 * URL structure: /popout/:gridId/:componentId/:type
 * Where :type is one of these child route paths.
 *
 * Note: For Angular 13 with NgModules, components are referenced directly
 * rather than using dynamic imports (loadComponent).
 */
export const POPOUT_ROUTES: Routes = [
  {
    path: 'query-control',
    loadChildren: () => import('../../../framework/components/query-control/query-control.module')
      .then(m => m.QueryControlModule)
  },
  {
    path: 'picker',
    loadChildren: () => import('../../../framework/components/base-picker/base-picker.module')
      .then(m => m.BasePickerModule)
  },
  {
    path: 'chart',
    loadChildren: () => import('../../../framework/components/base-chart/base-chart.module')
      .then(m => m.BaseChartModule)
  },
  {
    path: 'basic-results',
    loadChildren: () => import('../../../framework/components/dynamic-results-table/dynamic-results-table.module')
      .then(m => m.DynamicResultsTableModule)
  },
  {
    path: 'statistics-2',
    loadChildren: () => import('../../../framework/components/statistics-panel-2/statistics-panel-2.module')
      .then(m => m.StatisticsPanel2Module)
  }
];
```

**Note on Angular 13 patterns:** This uses `loadChildren` with module imports, which is the NgModule pattern. The exact implementation depends on how framework components are structured in Phase 8. If components are standalone, use `loadComponent` instead.

---

### Step 904.6: Create the Popout Module

Create `src/app/features/popout/popout.module.ts`:

```typescript
// src/app/features/popout/popout.module.ts
// VERSION 1 (Section 904) - Pop-out feature module

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { PopoutComponent } from './popout.component';
import { POPOUT_ROUTES } from './popout.routes';

@NgModule({
  declarations: [
    PopoutComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: PopoutComponent,
        children: POPOUT_ROUTES
      }
    ])
  ]
})
export class PopoutModule {}
```

---

### Step 904.7: Create the Barrel Export

Create `src/app/features/popout/index.ts`:

```typescript
// src/app/features/popout/index.ts
// VERSION 1 (Section 904) - Barrel export for popout feature

export * from './popout.component';
export * from './popout.routes';
export * from './popout.module';
```

---

### Step 904.8: Add Global Pop-out Styles (Optional)

For consistent pop-out appearance, add these global styles to `src/styles.scss`:

```scss
// src/styles.scss
// ADD these styles for pop-out window support

// Pop-out window specific styles
.popout-html {
  height: 100%;
  margin: 0;
  padding: 0;
}

.popout-body {
  height: 100%;
  margin: 0;
  padding: 0;
  background: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
}
```

---

## Verification

### 1. Check File Structure

```bash
$ find src/app/features/popout -type f | sort
```

Expected output:

```
src/app/features/popout/index.ts
src/app/features/popout/popout.component.html
src/app/features/popout/popout.component.scss
src/app/features/popout/popout.component.ts
src/app/features/popout/popout.module.ts
src/app/features/popout/popout.routes.ts
```

### 2. Build the Application

```bash
$ ng build
```

Expected: Build succeeds.

### 3. Manual Pop-out Test (After Full Integration)

1. Navigate to `/automobiles/discover`
2. Click the pop-out button on any panel
3. A new browser window should open with URL like:
   `/popout/automobile-discover/chart-year/chart`
4. The component should render in the new window
5. State changes in main window should reflect in pop-out

### 4. Message Flow Test

In browser console of main window:
```javascript
// After pop-out is open, check BroadcastChannel
console.log('Pop-out should receive state updates');
```

In pop-out window console:
```javascript
// State should sync from main
console.log('Check that data appears');
```

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| Pop-out window is blank | Router-outlet not finding child route | Verify route path matches child routes |
| "No provider for DOMAIN_CONFIG" | Domain not set before component loads | Ensure `domainRegistry.setActive()` called in ngOnInit |
| State not syncing | BroadcastChannel not initialized | Check `popOutContext.initializeAsPopOut()` called |
| Change detection not updating | OnPush strategy blocking updates | Call `cdr.detectChanges()` after state sync |
| Window.close() not working | Browser security restrictions | User must have opened the window (not blocked) |

---

## Key Takeaways

1. **Pop-outs are state receivers, not sources** — They display data but don't fetch it
2. **BroadcastChannel enables cross-window communication** — Built into modern browsers
3. **Injection tokens differentiate contexts** — `IS_POPOUT_TOKEN` tells components where they're running

---

## Acceptance Criteria

- [ ] `PopoutComponent` is created with `IS_POPOUT_TOKEN` provider
- [ ] Component extracts `gridId` and `componentId` from route params
- [ ] Domain is set via `DomainConfigRegistry.setActive()`
- [ ] BroadcastChannel communication initialized via `PopOutContextService`
- [ ] State updates from main window sync to `ResourceManagementService`
- [ ] Child routes defined for all pop-out-able component types
- [ ] `ng build` completes without errors

---

## Architecture Note: Cross-Window Communication

The pop-out system uses the browser's `BroadcastChannel` API for communication:

```
Main Window                    Pop-Out Window
    │                               │
    │  ┌─────────────────────────┐  │
    │  │   BroadcastChannel      │  │
    │  │   'vvroom-popout'        │  │
    │  └─────────────────────────┘  │
    │                               │
    ├──── STATE_UPDATE ────────────→│
    │                               │
    │←───── PANEL_READY ───────────┤
    │                               │
    │←── URL_PARAMS_CHANGED ───────┤
    │                               │
```

**Message types:**

| Type | Direction | Purpose |
|------|-----------|---------|
| `STATE_UPDATE` | Main → Pop-out | Send current state (filters, results, statistics) |
| `PANEL_READY` | Pop-out → Main | Pop-out initialized, ready for state |
| `URL_PARAMS_CHANGED` | Pop-out → Main | User changed filter in pop-out |
| `CLOSE_POPOUT` | Main → Pop-out | Request pop-out to close |

This architecture ensures the main window remains the source of truth while pop-outs provide additional viewport space.

---

## Next Step

Proceed to `905-app-routing-module.md` to configure the application's routing, connecting all feature components into a navigable application.
