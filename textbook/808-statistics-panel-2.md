# 808: Statistics Panel 2 Component

**Status:** Planning
**Depends On:** 801-base-chart-component, 606-chart-configs, 651-654 (Chart Data Sources)
**Blocks:** 809-dockview-statistics-panel, 903-discover-page-component

---

## Learning Objectives

After completing this section, you will:
- Understand how to build a CDK drag-drop chart grid with horizontal orientation
- Know how to coordinate chart clicks with URL state updates
- Be able to implement pop-out placeholder patterns for multi-window applications

---

## Objective

Build a statistics panel component that renders multiple charts in a draggable grid layout using Angular CDK. This component composes `BaseChartComponent` instances and handles chart ordering, pop-out functionality, and click event coordination with URL state.

---

## Why

The original `StatisticsPanelComponent` (document 804) introduced the concept of a chart grid. `StatisticsPanel2Component` refines this pattern with:

1. **CDK horizontal orientation** — Charts drag horizontally, wrapping to rows
2. **Pop-out awareness** — Shows placeholder when a chart is in a separate window
3. **Pop-out window support** — Works correctly when rendered inside a pop-out window
4. **URL state coordination** — Chart clicks update URL via data sources

### Why a Second Statistics Panel?

The application needs different chart layouts in different contexts:
- **Discover page**: Full statistics panel with all charts
- **Pop-out windows**: Subset of charts (e.g., just manufacturer and models)

`StatisticsPanel2Component` supports both via the optional `chartIds` input.

### Angular Style Guide References

- [Style 03-02](https://angular.io/guide/styleguide#style-03-02): Use delegation over inheritance
- [Style 05-02](https://angular.io/guide/styleguide#style-05-02): Use input properties for data binding

### URL-First Architecture Reference

When a user clicks on a chart element:
1. `BaseChartComponent` emits `chartClick` event with value and highlight mode
2. `StatisticsPanel2Component` receives the event
3. Data source's `toUrlParams()` converts the click to URL parameters
4. URL state is updated (directly or via pop-out message)

This maintains the URL-First principle: all state flows through the URL.

---

## What

### Step 808.1: Create the Statistics Panel 2 Component TypeScript

Create the file `src/app/framework/components/statistics-panel-2/statistics-panel-2.component.ts`:

```typescript
// src/app/framework/components/statistics-panel-2/statistics-panel-2.component.ts
// VERSION 1 (Section 808) - CDK horizontal chart grid

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import { DomainConfig } from '../../models/domain-config.interface';
import { PopOutMessageType } from '../../models/popout.interface';
import { PopOutContextService } from '../../services/popout-context.service';
import { ResourceManagementService } from '../../services/resource-management.service';
import { UrlStateService } from '../../services/url-state.service';
import { DomainConfigRegistry } from '../../services/domain-config-registry.service';
import { ChartDataSource } from '../base-chart/chart-data.interface';
import { IS_POPOUT_TOKEN } from '../../tokens/popout.token';

/**
 * Statistics Panel 2 Component
 *
 * Renders statistical charts in a CDK horizontal drag-drop grid.
 * Charts can be reordered by dragging.
 *
 * @example
 * ```html
 * <app-statistics-panel-2
 *   [domainConfig]="domainConfig"
 *   [chartIds]="['manufacturer', 'top-models']"
 *   (chartPopOut)="onChartPopOut($event)"
 *   (chartClicked)="onChartClick($event)">
 * </app-statistics-panel-2>
 * ```
 */
@Component({
  selector: 'app-statistics-panel-2',
  templateUrl: './statistics-panel-2.component.html',
  styleUrls: ['./statistics-panel-2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatisticsPanel2Component implements OnInit, OnDestroy {

  private readonly destroy$ = new Subject<void>();

  // ============================================================================
  // Inputs
  // ============================================================================

  /**
   * Domain configuration with chart data sources
   */
  @Input() domainConfig!: DomainConfig<any, any, any>;

  /**
   * Optional subset of chart IDs to display
   * If not provided, all charts from domainConfig.chartDataSources are shown
   */
  @Input() chartIds?: string[];

  /**
   * Function to check if a chart is popped out
   * Provided by parent component (DiscoverComponent)
   */
  @Input() isPanelPoppedOut: (panelId: string) => boolean = () => false;

  // ============================================================================
  // Outputs
  // ============================================================================

  /**
   * Emits when user clicks the pop-out button on a chart
   */
  @Output() chartPopOut = new EventEmitter<string>();

  /**
   * Emits when user clicks on a chart element
   */
  @Output() chartClicked = new EventEmitter<{
    event: { value: string; isHighlightMode: boolean };
    dataSource: ChartDataSource;
  }>();

  // ============================================================================
  // State
  // ============================================================================

  /**
   * Ordered list of chart IDs for the grid
   */
  chartOrder: string[] = [];

  constructor(
    private readonly resourceService: ResourceManagementService<any, any, any>,
    private readonly urlState: UrlStateService,
    private readonly popOutContext: PopOutContextService,
    private readonly cdr: ChangeDetectorRef,
    private readonly domainRegistry: DomainConfigRegistry,
    @Optional() private readonly route: ActivatedRoute,
    @Optional() @Inject(IS_POPOUT_TOKEN) private readonly isPopout: boolean
  ) {}

  // ============================================================================
  // Observable Streams
  // ============================================================================

  get statistics$(): Observable<any | undefined> {
    return this.resourceService.statistics$;
  }

  get highlights$(): Observable<any> {
    return this.resourceService.highlights$;
  }

  /**
   * Check if running in a pop-out window
   */
  get isInPopOut(): boolean {
    return this.popOutContext.isInPopOut();
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  ngOnInit(): void {
    // If domainConfig not provided via @Input (e.g., in popout), get from registry
    if (!this.domainConfig) {
      this.domainConfig = this.domainRegistry.getActive();
    }

    // Initialize chart order from chartIds input or domain config
    if (this.chartIds && this.chartIds.length > 0) {
      this.chartOrder = this.chartIds;
    } else if (this.isPopout && this.route) {
      // In popout: extract componentId from URL and map to chart IDs
      const componentId = this.route.parent?.snapshot.paramMap.get('componentId') ?? null;
      this.chartOrder = this.getChartIdsForStatisticsPanel(componentId);
    } else if (this.domainConfig.chartDataSources) {
      this.chartOrder = Object.keys(this.domainConfig.chartDataSources);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Map statistics panel ID to chart IDs
   *
   * This mapping determines which charts appear in which pop-out panel.
   * The default configuration splits charts into two panels.
   */
  private getChartIdsForStatisticsPanel(panelId: string | null): string[] {
    const chartIdMap: { [key: string]: string[] } = {
      'statistics-1': ['manufacturer', 'top-models'],
      'statistics-2': ['body-class', 'year']
    };

    if (panelId && chartIdMap[panelId]) {
      return chartIdMap[panelId];
    }

    // Fallback to all charts if panel ID not recognized
    if (this.domainConfig.chartDataSources) {
      return Object.keys(this.domainConfig.chartDataSources);
    }
    return [];
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle chart drag-drop to reorder
   */
  onChartDrop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.chartOrder, event.previousIndex, event.currentIndex);
    this.cdr.markForCheck();
  }

  /**
   * Handle chart pop-out request
   */
  onChartPopOut(chartId: string): void {
    this.chartPopOut.emit(chartId);
  }

  /**
   * Handle chart click
   *
   * Gets URL params from the data source and updates URL state.
   * When in a pop-out window, sends the update via message to parent.
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
   * Get data source for a chart ID
   */
  getDataSource(chartId: string): ChartDataSource | undefined {
    return this.domainConfig.chartDataSources?.[chartId];
  }
}
```

### Step 808.2: Create the Statistics Panel 2 Template

Create the file `src/app/framework/components/statistics-panel-2/statistics-panel-2.component.html`:

```html
<!-- src/app/framework/components/statistics-panel-2/statistics-panel-2.component.html -->
<!-- VERSION 1 (Section 808) - CDK horizontal chart grid -->

<div class="statistics-content">
  <!-- No data message -->
  <div *ngIf="!(statistics$ | async)" class="no-data-message">
    <i class="pi pi-info-circle"></i>
    <p>No statistics available. Add filters or select data to view distributions.</p>
  </div>

  <!-- Chart Grid with CDK Drag-Drop -->
  <div
    *ngIf="statistics$ | async"
    cdkDropList
    cdkDropListOrientation="horizontal"
    (cdkDropListDropped)="onChartDrop($event)"
    class="chart-grid">

    <ng-container *ngFor="let chartId of chartOrder">
      <div *ngIf="getDataSource(chartId) as dataSource" class="chart-box" cdkDrag>
        <!-- Drag Handle -->
        <div class="chart-drag-handle" cdkDragHandle>
          <i class="pi pi-bars"></i>
        </div>

        <!-- Chart or Placeholder -->
        <ng-container *ngIf="isInPopOut || !isPanelPoppedOut('chart-' + chartId); else chartPoppedOut">
          <app-base-chart
            [dataSource]="dataSource"
            [statistics]="statistics$ | async"
            [highlights]="highlights$ | async"
            [selectedValue]="null"
            [canPopOut]="!isInPopOut"
            (popOutClick)="onChartPopOut(chartId)"
            (chartClick)="onChartClick($event, chartId)">
          </app-base-chart>
        </ng-container>

        <ng-template #chartPoppedOut>
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

### Step 808.3: Create the Statistics Panel 2 Styles

Create the file `src/app/framework/components/statistics-panel-2/statistics-panel-2.component.scss`:

```scss
// src/app/framework/components/statistics-panel-2/statistics-panel-2.component.scss
// VERSION 1 (Section 808) - CDK horizontal chart grid styles

// When in popout context, hide overflow to prevent scrollbars
:host-context(.statistics-2-popout) {
  display: block;
  overflow: hidden;
  height: 100%;

  .statistics-content {
    overflow: hidden;
    height: 100%;
  }

  .chart-grid {
    overflow: hidden;
    max-height: 100%;
  }
}

.statistics-content {
  padding: 0.5rem;
}

.no-data-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
  color: var(--text-color-secondary);

  i.pi {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  p {
    margin: 0;
    font-size: 1rem;
  }
}

// Chart Grid with CDK Horizontal Drag-Drop
.chart-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.5rem;
  background: var(--surface-ground);
  border-radius: 6px;
  border: 1px solid var(--surface-border);
  min-height: 200px;

  .chart-box {
    // Each chart takes ~50% width minus gap (2 per row)
    flex: 0 0 calc(50% - 0.5rem);
    background: var(--surface-card);
    border-radius: 4px;
    padding: 1rem;
    position: relative;
    box-sizing: border-box;

    // Drag handle positioned in top-left
    .chart-drag-handle {
      position: absolute;
      top: 0.5rem;
      left: 0.5rem;
      cursor: move;
      padding: 0.25rem 0.5rem;
      color: var(--text-color-secondary);
      opacity: 0.6;
      transition: opacity 0.2s, color 0.2s;
      z-index: 10;

      &:hover {
        opacity: 1;
        color: var(--text-color);
      }

      i {
        font-size: 1rem;
      }
    }

    app-base-chart {
      display: block;
      height: 300px;
    }

    .popout-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      height: 300px;
      background-color: var(--surface-ground);
      border: 2px dashed var(--surface-border);
      border-radius: 4px;
      color: var(--text-color-secondary);
      font-style: italic;

      i {
        font-size: 1.5rem;
        color: var(--primary-color);
      }
    }

    // CDK Drag states for chart boxes
    &.cdk-drag-preview {
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
      opacity: 0.95;
      border: 2px solid var(--primary-color);
    }

    &.cdk-drag-placeholder {
      opacity: 0.3;
      background: var(--surface-hover);
      border: 2px dashed var(--surface-border);
    }
  }
}

// Responsive adjustments
@media (max-width: 1200px) {
  .chart-grid {
    .chart-box {
      flex: 0 0 100%;
    }
  }
}
```

### Step 808.4: Create the Module Export

Create the file `src/app/framework/components/statistics-panel-2/index.ts`:

```typescript
// src/app/framework/components/statistics-panel-2/index.ts
// VERSION 1 (Section 808) - Barrel export

export { StatisticsPanel2Component } from './statistics-panel-2.component';
```

### Step 808.5: Register in Framework Module

Open `src/app/framework/framework.module.ts` and add the component:

```typescript
// src/app/framework/framework.module.ts
// VERSION 9 (Section 808) - Add StatisticsPanel2Component
// Replaces VERSION 8 from Section 807

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';
// ... other imports

import { StatisticsPanel2Component } from './components/statistics-panel-2/statistics-panel-2.component';

@NgModule({
  declarations: [
    // ... existing components
    StatisticsPanel2Component
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    DragDropModule,
    // ... other imports
  ],
  exports: [
    // ... existing exports
    StatisticsPanel2Component
  ]
})
export class FrameworkModule {}
```

---

## Verification

### 1. Build the Application

```bash
$ cd ~/projects/vvroom
$ ng build
```

Expected: Build succeeds with no errors.

### 2. Check TypeScript Compilation

```bash
$ npx tsc --noEmit
```

Expected: No type errors.

### 3. Verify CDK Integration

Check the template for proper CDK attributes:
- `cdkDropList` on the grid container
- `cdkDropListOrientation="horizontal"` for row-based dragging
- `cdkDrag` on each chart box
- `cdkDragHandle` on the drag handle

### 4. Verify Pop-out Integration

Check the component:
- `isInPopOut` getter uses `PopOutContextService`
- `onChartClick` sends messages via `PopOutContextService` when in pop-out
- `isPanelPoppedOut` input allows parent to track pop-out state

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| Charts don't render | `domainConfig` not provided | Verify @Input or registry fallback |
| Drag not working | CDK module not imported | Add `DragDropModule` to imports |
| Pop-out placeholder not showing | `isPanelPoppedOut` not bound | Verify parent passes the function |
| Click not updating URL | Data source not found | Verify chartId matches key in `chartDataSources` |
| Charts overlap during drag | Missing CSS position | Ensure `.chart-box` has `position: relative` |

---

## Key Takeaways

1. **Horizontal CDK orientation with wrap** — Flexbox handles row wrapping automatically
2. **Pop-out awareness is bidirectional** — Component knows when it's in a pop-out AND when its charts are popped out
3. **URL updates delegate to data sources** — The panel doesn't know URL structure; data sources handle that

---

## Acceptance Criteria

- [ ] `StatisticsPanel2Component` accepts `domainConfig`, `chartIds`, and `isPanelPoppedOut` inputs
- [ ] Charts render in a 2-column grid (1 column on mobile)
- [ ] Charts can be reordered via horizontal drag-and-drop
- [ ] Drag handle appears in top-left corner of each chart
- [ ] Chart clicks update URL state via data source's `toUrlParams()`
- [ ] When in pop-out window, clicks send messages to parent
- [ ] Pop-out placeholder shows when a chart is in a separate window
- [ ] "No data" message shows when `statistics$` is null
- [ ] Component is registered in `FrameworkModule`
- [ ] `ng build` completes with no errors

---

## Next Step

Proceed to `809-dockview-statistics-panel.md` to build the tabbed/dockable statistics panel using Dockview.
