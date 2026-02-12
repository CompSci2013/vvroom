# 809: Dockview Statistics Panel Component

**Status:** Planning
**Depends On:** 808-statistics-panel-2, 801-base-chart-component
**Blocks:** 903-discover-page-component

---

## Learning Objectives

After completing this section, you will:
- Understand how to integrate Dockview with Angular components
- Know how to move Angular-rendered elements into Dockview panels via DOM manipulation
- Be able to create tabbed, resizable panel layouts for data visualization

---

## Objective

Build a statistics panel component that renders charts inside Dockview containers with tabbed, resizable, and draggable panels. This provides an alternative layout to the CDK grid, allowing users to arrange charts in a more flexible workspace.

---

## Why

Different users prefer different layouts for data exploration:

1. **Fixed grid** (StatisticsPanel2) — Simple, predictable, two columns
2. **Dockable panels** (DockviewStatisticsPanel) — Flexible, tabbed, resizable

Dockview provides:
- **Tabbed panels** — Multiple charts in the same space, switch via tabs
- **Resizable splits** — Drag borders to adjust chart sizes
- **Drag to rearrange** — Drag tabs to reorder or split panels
- **Consistent dark theme** — Matches the application's visual style

### Why Dockview Instead of Building Custom Panels?

Building a full-featured docking system is complex:
- Tab management with close/reorder
- Resizable split panes
- Drop zones for drag operations
- Serialization/restoration of layouts

Dockview provides all of this out of the box. We integrate it with Angular via a DOM manipulation pattern.

### The DOM Manipulation Pattern

Dockview is framework-agnostic and expects to manage its own DOM. Angular components, however, are rendered by Angular's change detection. The pattern:

1. Render Angular chart components in a hidden container
2. When Dockview creates a panel, move the chart element into the panel
3. When Dockview disposes a panel, move the chart back to the hidden container

This keeps Angular happy while letting Dockview manage the layout.

### Angular Style Guide References

- [Style 03-01](https://angular.io/guide/styleguide#style-03-01): Use single responsibility principle
- [Style 09-01](https://angular.io/guide/styleguide#style-09-01): Use lifecycle hooks for setup/teardown

---

## What

### Step 809.1: Install Dockview

Install the Dockview core library:

```bash
$ cd ~/projects/vvroom
$ npm install dockview-core --save
```

Verify installation:

```bash
$ grep "dockview-core" package.json
    "dockview-core": "^1.8.0",
```

### Step 809.2: Add Dockview Styles to Angular.json

Dockview requires its CSS to be loaded globally. Open `angular.json` and add to the styles array:

```json
{
  "projects": {
    "vvroom": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "node_modules/dockview-core/dist/styles/dockview.css",
              "src/styles.scss"
            ]
          }
        }
      }
    }
  }
}
```

### Step 809.3: Create the Dockview Statistics Panel Component TypeScript

Create the file `src/app/framework/components/dockview-statistics-panel/dockview-statistics-panel.component.ts`:

```typescript
// src/app/framework/components/dockview-statistics-panel/dockview-statistics-panel.component.ts
// VERSION 1 (Section 809) - Dockview tabbed chart panels

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
  ViewEncapsulation
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { createDockview, DockviewApi, IContentRenderer, themeDark } from 'dockview-core';

import { DomainConfig } from '../../models/domain-config.interface';
import { PopOutMessageType } from '../../models/popout.interface';
import { PopOutContextService } from '../../services/popout-context.service';
import { ResourceManagementService } from '../../services/resource-management.service';
import { UrlStateService } from '../../services/url-state.service';
import { DomainConfigRegistry } from '../../services/domain-config-registry.service';
import { ChartDataSource } from '../base-chart/chart-data.interface';

/**
 * Dockview Statistics Panel Component
 *
 * Renders charts in a dockview container with tabbed/split panel support.
 * Charts are rendered by Angular then moved into Dockview panels via DOM.
 *
 * @example
 * ```html
 * <app-dockview-statistics-panel
 *   [domainConfig]="domainConfig"
 *   [chartIds]="['manufacturer', 'top-models']">
 * </app-dockview-statistics-panel>
 * ```
 */
@Component({
  selector: 'app-dockview-statistics-panel',
  templateUrl: './dockview-statistics-panel.component.html',
  styleUrls: ['./dockview-statistics-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None // Required for Dockview CSS overrides
})
export class DockviewStatisticsPanelComponent implements OnInit, AfterViewInit, OnDestroy {

  private readonly destroy$ = new Subject<void>();
  private dockviewApi: DockviewApi | null = null;

  @ViewChild('dockviewContainer', { static: true })
  dockviewContainer!: ElementRef<HTMLDivElement>;

  @ViewChildren('chartElement')
  chartElements!: QueryList<ElementRef<HTMLDivElement>>;

  // ============================================================================
  // Inputs
  // ============================================================================

  /**
   * Domain configuration with chart data sources
   */
  @Input() domainConfig!: DomainConfig<any, any, any>;

  /**
   * Chart IDs to display in dockview panels
   */
  @Input() chartIds: string[] = [];

  /**
   * Function to check if a panel is popped out
   * Uses dockview-chart- prefix for chart panel IDs
   */
  @Input() isPanelPoppedOut: (panelId: string) => boolean = () => false;

  // ============================================================================
  // Outputs
  // ============================================================================

  /**
   * Emits when user clicks on a chart element
   */
  @Output() chartClicked = new EventEmitter<{
    event: { value: string; isHighlightMode: boolean };
    dataSource: ChartDataSource;
  }>();

  /**
   * Emits when user clicks the pop-out button on a chart
   */
  @Output() chartPopOut = new EventEmitter<string>();

  // ============================================================================
  // State
  // ============================================================================

  /**
   * Current statistics from resource service
   */
  statistics: any = null;

  /**
   * Current highlights from resource service
   */
  highlights: any = {};

  /**
   * Map of chartId to title (from data source)
   */
  chartTitles: Map<string, string> = new Map();

  constructor(
    private readonly resourceService: ResourceManagementService<any, any, any>,
    private readonly urlState: UrlStateService,
    private readonly popOutContext: PopOutContextService,
    private readonly cdr: ChangeDetectorRef,
    private readonly ngZone: NgZone,
    private readonly domainRegistry: DomainConfigRegistry
  ) {}

  // ============================================================================
  // Lifecycle
  // ============================================================================

  ngOnInit(): void {
    // If domainConfig not provided via @Input, get from registry
    if (!this.domainConfig) {
      this.domainConfig = this.domainRegistry.getActive();
    }

    // Initialize chart titles from data sources
    this.chartIds.forEach(chartId => {
      const dataSource = this.domainConfig.chartDataSources?.[chartId];
      if (dataSource) {
        this.chartTitles.set(chartId, dataSource.getTitle());
      }
    });

    // Subscribe to statistics updates
    this.resourceService.statistics$
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.statistics = stats;
        this.cdr.markForCheck();
      });

    // Subscribe to highlights updates
    this.resourceService.highlights$
      .pipe(takeUntil(this.destroy$))
      .subscribe(highlights => {
        this.highlights = highlights;
        this.cdr.markForCheck();
      });
  }

  ngAfterViewInit(): void {
    // Give Angular time to render chart components before initializing Dockview
    setTimeout(() => {
      this.initializeDockview();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Dispose dockview to prevent memory leaks
    if (this.dockviewApi) {
      this.dockviewApi.dispose();
    }
  }

  // ============================================================================
  // Dockview Setup
  // ============================================================================

  /**
   * Initialize the Dockview instance and populate panels
   *
   * This method:
   * 1. Creates a map of chart elements by their data-chart-id attribute
   * 2. Creates a Dockview instance with a custom component factory
   * 3. Adds panels for each chart, arranged side-by-side
   */
  private initializeDockview(): void {
    const container = this.dockviewContainer.nativeElement;

    // Map to store chart elements by their ID
    const chartElementsMap = new Map<string, HTMLElement>();

    // Find all chart wrapper elements
    this.chartElements.forEach(el => {
      const chartId = el.nativeElement.getAttribute('data-chart-id');
      if (chartId) {
        chartElementsMap.set(chartId, el.nativeElement);
      }
    });

    // Create dockview instance
    // Note: disableFloatingGroups prevents conflicts with PopOutManagerService
    this.dockviewApi = createDockview(container, {
      disableFloatingGroups: true,
      theme: themeDark,
      createComponent: (options): IContentRenderer => {
        const chartId = options.id;
        const chartElement = chartElementsMap.get(chartId);

        // Create a wrapper element for the panel content
        const wrapper = document.createElement('div');
        wrapper.className = 'dockview-chart-content';
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        wrapper.style.overflow = 'hidden';

        // Move the chart element into the wrapper
        if (chartElement) {
          chartElement.style.display = 'block';
          wrapper.appendChild(chartElement);
        }

        return {
          element: wrapper,
          init: () => {},
          dispose: () => {
            // Move chart element back to hidden container on dispose
            if (chartElement) {
              const hiddenContainer = document.querySelector('.charts-hidden-container');
              if (hiddenContainer) {
                hiddenContainer.appendChild(chartElement);
                chartElement.style.display = 'none';
              }
            }
          }
        };
      }
    });

    // Add panels for each chart - side by side layout
    this.chartIds.forEach((chartId, index) => {
      const title = this.chartTitles.get(chartId) || chartId;

      if (index === 0) {
        // First panel - add normally
        this.dockviewApi!.addPanel({
          id: chartId,
          title: title,
          component: 'chart'
        });
      } else {
        // Subsequent panels - add to the right of the first panel
        this.dockviewApi!.addPanel({
          id: chartId,
          title: title,
          component: 'chart',
          position: {
            referencePanel: this.chartIds[0],
            direction: 'right'
          }
        });
      }
    });

    // Force layout calculation after panels are added
    const rect = container.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      this.dockviewApi!.layout(rect.width, rect.height);
    }

    this.cdr.markForCheck();
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle chart click
   *
   * Gets URL params from the data source and updates URL state.
   */
  onChartClick(event: { value: string; isHighlightMode: boolean }, chartId: string): void {
    const dataSource = this.domainConfig.chartDataSources?.[chartId];
    if (!dataSource) return;

    // Delegate URL param generation to the data source
    const newParams = dataSource.toUrlParams(event.value, event.isHighlightMode);

    // Update URL (either directly or via pop-out message)
    if (this.popOutContext.isInPopOut()) {
      this.popOutContext.sendMessage({
        type: PopOutMessageType.URL_PARAMS_CHANGED,
        payload: { params: newParams },
        timestamp: Date.now()
      });
    } else {
      this.urlState.setParams(newParams);
    }
  }

  /**
   * Handle chart pop-out request
   */
  onChartPopOut(chartId: string): void {
    this.chartPopOut.emit(chartId);
  }

  /**
   * Get data source for a chart ID
   */
  getDataSource(chartId: string): ChartDataSource | undefined {
    return this.domainConfig.chartDataSources?.[chartId];
  }

  /**
   * Check if a chart is popped out
   * Uses dockview-chart- prefix for panel IDs
   */
  isChartPoppedOut(chartId: string): boolean {
    return this.isPanelPoppedOut(`dockview-chart-${chartId}`);
  }
}
```

### Step 809.4: Create the Dockview Statistics Panel Template

Create the file `src/app/framework/components/dockview-statistics-panel/dockview-statistics-panel.component.html`:

```html
<!-- src/app/framework/components/dockview-statistics-panel/dockview-statistics-panel.component.html -->
<!-- VERSION 1 (Section 809) - Dockview tabbed chart panels -->

<div class="dockview-statistics-container">
  <!-- Dockview container -->
  <div #dockviewContainer class="dockview-wrapper"></div>

  <!-- Chart components rendered in hidden container, moved into dockview panels via DOM -->
  <div class="charts-hidden-container">
    <ng-container *ngFor="let chartId of chartIds">
      <div #chartElement [attr.data-chart-id]="chartId" class="chart-wrapper" style="display: none;">
        <!-- Show chart or placeholder based on pop-out state -->
        <ng-container *ngIf="!isChartPoppedOut(chartId); else chartPoppedOutPlaceholder">
          <app-base-chart
            *ngIf="getDataSource(chartId) as dataSource"
            [dataSource]="dataSource"
            [statistics]="statistics"
            [highlights]="highlights"
            [selectedValue]="null"
            [hideTitle]="true"
            [canPopOut]="true"
            (chartClick)="onChartClick($event, chartId)"
            (popOutClick)="onChartPopOut(chartId)">
          </app-base-chart>
        </ng-container>
        <ng-template #chartPoppedOutPlaceholder>
          <div class="popout-placeholder">
            <i class="pi pi-external-link"></i>
            <span>Chart is open in a separate window</span>
          </div>
        </ng-template>
      </div>
    </ng-container>
  </div>
</div>
```

### Step 809.5: Create the Dockview Statistics Panel Styles

Create the file `src/app/framework/components/dockview-statistics-panel/dockview-statistics-panel.component.scss`:

```scss
// src/app/framework/components/dockview-statistics-panel/dockview-statistics-panel.component.scss
// VERSION 1 (Section 809) - Dockview styles with dark theme

// Dockview CSS is imported globally in angular.json

.dockview-statistics-container {
  width: 100%;
  height: 400px;
  position: relative;
}

.dockview-wrapper {
  width: 100%;
  height: 100%;
  min-height: 400px;

  // Ensure dockview takes full space
  > div {
    width: 100%;
    height: 100%;
  }
}

// Hidden container keeps Angular components alive while Dockview manages layout
.charts-hidden-container {
  position: absolute;
  left: -9999px;
  top: -9999px;
  visibility: hidden;
  pointer-events: none;
}

.chart-wrapper {
  width: 100%;
  height: 100%;
}

// Dockview dark theme overrides
:host ::ng-deep {
  .dockview-theme-dark {
    --dv-background-color: var(--surface-ground, #1a1a1a);
    --dv-paneview-header-border-color: var(--surface-border, #333333);
    --dv-tabs-and-actions-container-background-color: var(--surface-card, #252525);
    --dv-activegroup-visiblepanel-tab-background-color: var(--surface-ground, #1a1a1a);
    --dv-activegroup-hiddenpanel-tab-background-color: var(--surface-hover, #2d2d2d);
    --dv-inactivegroup-visiblepanel-tab-background-color: var(--surface-hover, #2d2d2d);
    --dv-inactivegroup-hiddenpanel-tab-background-color: var(--surface-card, #252525);
    --dv-tab-divider-color: var(--surface-border, #404040);
    --dv-activegroup-visiblepanel-tab-color: var(--text-color, #ffffff);
    --dv-activegroup-hiddenpanel-tab-color: var(--text-color-secondary, #999999);
    --dv-inactivegroup-visiblepanel-tab-color: var(--text-color, #cccccc);
    --dv-inactivegroup-hiddenpanel-tab-color: var(--text-color-secondary, #999999);
    --dv-separator-border: var(--surface-border, #404040);
    --dv-paneview-header-background-color: var(--surface-card, #252525);
  }

  .dockview-vue,
  .dockview-react,
  .dockview {
    background-color: var(--surface-ground, #1a1a1a);
  }

  .groupview {
    background-color: var(--surface-ground, #1a1a1a);
  }

  .tab {
    font-size: 12px;
    padding: 4px 12px;
  }

  .dv-resize-container {
    background-color: var(--surface-ground, #1a1a1a);
  }

  .content-container {
    background-color: var(--surface-ground, #1a1a1a);
  }
}

.dockview-chart-content {
  width: 100%;
  height: 100%;
  background: var(--surface-ground, #1a1a1a);
  overflow: hidden;

  app-base-chart {
    display: block;
    width: 100%;
    height: 100%;
  }
}

.popout-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
  background: var(--surface-ground, #1a1a1a);
  color: var(--text-color-secondary, #999999);
  gap: 12px;

  i {
    font-size: 2rem;
    color: var(--text-color-secondary, #666666);
  }

  span {
    font-size: 14px;
  }
}
```

### Step 809.6: Create the Module Export

Create the file `src/app/framework/components/dockview-statistics-panel/index.ts`:

```typescript
// src/app/framework/components/dockview-statistics-panel/index.ts
// VERSION 1 (Section 809) - Barrel export

export { DockviewStatisticsPanelComponent } from './dockview-statistics-panel.component';
```

### Step 809.7: Register in Framework Module

Open `src/app/framework/framework.module.ts` and add the component:

```typescript
// src/app/framework/framework.module.ts
// VERSION 10 (Section 809) - Add DockviewStatisticsPanelComponent
// Replaces VERSION 9 from Section 808

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// ... other imports

import { DockviewStatisticsPanelComponent } from './components/dockview-statistics-panel/dockview-statistics-panel.component';

@NgModule({
  declarations: [
    // ... existing components
    DockviewStatisticsPanelComponent
  ],
  imports: [
    CommonModule,
    // ... other imports
  ],
  exports: [
    // ... existing exports
    DockviewStatisticsPanelComponent
  ]
})
export class FrameworkModule {}
```

---

## Understanding the DOM Manipulation Pattern

The hidden container pattern deserves special attention:

```html
<!-- Charts render here (hidden from view) -->
<div class="charts-hidden-container">
  <div #chartElement data-chart-id="manufacturer">
    <app-base-chart [dataSource]="..." ...></app-base-chart>
  </div>
</div>
```

When Dockview's `createComponent` is called:

```typescript
createComponent: (options): IContentRenderer => {
  const chartId = options.id;
  const chartElement = chartElementsMap.get(chartId);

  // Move Angular component into Dockview panel
  wrapper.appendChild(chartElement);

  return {
    element: wrapper,
    dispose: () => {
      // Move back to hidden container
      hiddenContainer.appendChild(chartElement);
    }
  };
}
```

**Why this works:**
1. Angular renders the chart components normally
2. We physically move the DOM elements into Dockview panels
3. Angular's change detection continues to work because the component instance is unchanged
4. When Dockview disposes a panel, we move the element back to keep it alive

---

## Verification

### 1. Build the Application

```bash
$ cd ~/projects/vvroom
$ ng build
```

Expected: Build succeeds with no errors.

### 2. Check Dockview Installation

```bash
$ npm list dockview-core
```

Expected: Shows dockview-core version installed.

### 3. Verify Global Styles

```bash
$ grep "dockview" angular.json
```

Expected: Shows `node_modules/dockview-core/dist/styles/dockview.css` in styles array.

### 4. Manual Inspection

Check the component template:
- `#dockviewContainer` is present
- `#chartElement` template references are correct
- `data-chart-id` attributes are bound

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| Dockview not rendering | Container has zero height | Add `min-height: 400px` to `.dockview-wrapper` |
| Charts not visible in panels | DOM elements not moved | Check `chartElementsMap` population in console |
| Tabs not styled | Global CSS not loaded | Verify `angular.json` styles array |
| TypeError on dispose | Element already removed | Check for null in dispose callback |
| Floating panels appearing | `disableFloatingGroups` not set | Verify Dockview options |

---

## Key Takeaways

1. **Dockview is framework-agnostic** — It manages DOM; we bridge to Angular via element moves
2. **Hidden container pattern** — Keeps Angular components alive while Dockview manages layout
3. **Disable floating groups** — Prevents conflicts with our custom PopOutManagerService

---

## Acceptance Criteria

- [ ] `dockview-core` package is installed and listed in `package.json`
- [ ] Dockview CSS is loaded globally via `angular.json`
- [ ] `DockviewStatisticsPanelComponent` accepts `domainConfig` and `chartIds` inputs
- [ ] Charts render inside Dockview panels with tabs
- [ ] Panels can be resized by dragging borders
- [ ] Tabs can be dragged to reorder
- [ ] Chart clicks update URL state
- [ ] Pop-out placeholder shows when a chart is in a separate window
- [ ] Dark theme matches application styling
- [ ] Component is registered in `FrameworkModule`
- [ ] `ng build` completes with no errors

---

## Next Step

Phase 8 (Framework Components) is now complete. Proceed to Phase 9 to build the feature components that wire everything together.
