# 804: Statistics Panel Component

**Status:** Planning
**Depends On:** 801-base-chart-component, 306-resource-management-service, 651-654 (Chart Data Sources)
**Blocks:** 904-automobile-discover

---

## Learning Objectives

After completing this section, you will:
- Understand how to compose multiple chart components into a single panel
- Know how to implement drag-and-drop reordering with Angular CDK
- Be able to coordinate chart clicks with URL state updates

---

## Objective

Build a statistics panel component that renders multiple charts in a draggable grid layout. This component composes `BaseChartComponent` instances and handles chart ordering, pop-out functionality, and click event coordination.

---

## Why

Data discovery applications often display multiple charts showing different statistical views: distributions by manufacturer, year, body type, etc. Rather than hard-coding chart layouts, we build a **Statistics Panel** that:

1. Accepts an array of chart IDs or reads from `DomainConfig.chartDataSources`
2. Renders each chart using `BaseChartComponent`
3. Allows users to reorder charts via drag-and-drop
4. Coordinates click events with URL state

The Angular CDK (Component Dev Kit) provides drag-and-drop functionality without requiring a full component library.

### Angular Style Guide References

- [Style 03-02](https://angular.io/guide/styleguide#style-03-02): Use delegation over inheritance
- [Style 05-02](https://angular.io/guide/styleguide#style-05-02): Use input properties for data binding

### URL-First Architecture Reference

When a user clicks on a chart element (e.g., a bar representing "Toyota"), the click flows:
1. `BaseChartComponent` emits `chartClick` event
2. `StatisticsPanelComponent` receives the event and gets the data source
3. Data source's `toUrlParams()` converts the click to URL parameters
4. URL state is updated, triggering new API requests

This maintains our URL-First principle while keeping chart interaction logic in data sources.

---

## What

### Step 804.1: Install Angular CDK

The Angular CDK provides drag-and-drop functionality:

```bash
$ cd ~/projects/vvroom
$ npm install @angular/cdk --save
```

Verify installation:

```bash
$ grep "@angular/cdk" package.json
    "@angular/cdk": "^13.3.0",
```

### Step 804.2: Create the Statistics Panel Component TypeScript

Create the file `src/app/framework/components/statistics-panel/statistics-panel.component.ts`:

```typescript
// src/app/framework/components/statistics-panel/statistics-panel.component.ts
// VERSION 1 (Section 804) - Chart grid with drag-drop reordering

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import { DomainConfig } from '../../models/domain-config.interface';
import { ChartDataSource } from '../base-chart/chart-data.interface';
import { ResourceManagementService } from '../../services/resource-management.service';
import { UrlStateService } from '../../services/url-state.service';
import { PopOutContextService } from '../../services/popout-context.service';
import { PopOutMessageType } from '../../models/popout.interface';
import { DomainConfigRegistry } from '../../services/domain-config-registry.service';

/**
 * Statistics Panel Component
 *
 * Renders multiple charts in a CDK drag-drop grid.
 * Charts can be reordered by dragging.
 *
 * @example
 * ```html
 * <app-statistics-panel
 *   [domainConfig]="domainConfig"
 *   [chartIds]="['manufacturer', 'year']"
 *   (chartPopOut)="onChartPopOut($event)"
 *   (chartClicked)="onChartClick($event)">
 * </app-statistics-panel>
 * ```
 */
@Component({
  selector: 'app-statistics-panel',
  templateUrl: './statistics-panel.component.html',
  styleUrls: ['./statistics-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatisticsPanelComponent implements OnInit, OnDestroy {

  private readonly destroy$ = new Subject<void>();

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
   * Provided by parent component
   */
  @Input() isPanelPoppedOut: (panelId: string) => boolean = () => false;

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

  /**
   * Ordered list of chart IDs for the grid
   */
  chartOrder: string[] = [];

  constructor(
    private readonly resourceService: ResourceManagementService<any, any, any>,
    private readonly urlState: UrlStateService,
    private readonly popOutContext: PopOutContextService,
    private readonly cdr: ChangeDetectorRef,
    private readonly domainRegistry: DomainConfigRegistry
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
    // If domainConfig not provided (e.g., in pop-out), get from registry
    if (!this.domainConfig) {
      this.domainConfig = this.domainRegistry.getActive();
    }

    // Initialize chart order
    if (this.chartIds && this.chartIds.length > 0) {
      this.chartOrder = this.chartIds;
    } else if (this.domainConfig.chartDataSources) {
      this.chartOrder = Object.keys(this.domainConfig.chartDataSources);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
   */
  onChartClick(event: { value: string; isHighlightMode: boolean }, chartId: string): void {
    const dataSource = this.domainConfig.chartDataSources?.[chartId];
    if (!dataSource) return;

    // Get URL params from data source
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

### Step 804.3: Create the Statistics Panel Template

Create the file `src/app/framework/components/statistics-panel/statistics-panel.component.html`:

```html
<!-- src/app/framework/components/statistics-panel/statistics-panel.component.html -->
<!-- VERSION 1 (Section 804) - Chart grid with drag-drop -->

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

### Step 804.4: Create the Statistics Panel Styles

Create the file `src/app/framework/components/statistics-panel/statistics-panel.component.scss`:

```scss
// src/app/framework/components/statistics-panel/statistics-panel.component.scss
// VERSION 1 (Section 804) - Chart grid styles

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
    // Two charts per row
    flex: 0 0 calc(50% - 0.5rem);
    background: var(--surface-card);
    border-radius: 4px;
    padding: 1rem;
    position: relative;
    box-sizing: border-box;

    // Drag handle
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

    // CDK Drag states
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

### Step 804.5: Create the Module Export

Create the file `src/app/framework/components/statistics-panel/index.ts`:

```typescript
// src/app/framework/components/statistics-panel/index.ts
// VERSION 1 (Section 804) - Barrel export

export { StatisticsPanelComponent } from './statistics-panel.component';
```

### Step 804.6: Register in Framework Module

Open `src/app/framework/framework.module.ts` and add the component:

```typescript
// src/app/framework/framework.module.ts
// VERSION 5 (Section 804) - Add StatisticsPanelComponent
// Replaces VERSION 4 from Section 803

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { RippleModule } from 'primeng/ripple';

import { BaseChartComponent } from './components/base-chart/base-chart.component';
import { BasePickerComponent } from './components/base-picker/base-picker.component';
import { BasicResultsTableComponent } from './components/basic-results-table/basic-results-table.component';
import { StatisticsPanelComponent } from './components/statistics-panel/statistics-panel.component';

@NgModule({
  declarations: [
    BaseChartComponent,
    BasePickerComponent,
    BasicResultsTableComponent,
    StatisticsPanelComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    ButtonModule,
    TableModule,
    CheckboxModule,
    InputTextModule,
    SkeletonModule,
    MessageModule,
    RippleModule
  ],
  exports: [
    BaseChartComponent,
    BasePickerComponent,
    BasicResultsTableComponent,
    StatisticsPanelComponent
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

### 2. Check CDK Installation

```bash
$ npm list @angular/cdk
```

Expected: Shows CDK version installed.

### 3. Verify Drag-Drop Import

```bash
$ grep "DragDropModule" src/app/framework/framework.module.ts
```

Expected: `DragDropModule` is in imports array.

### 4. Manual Inspection

Check `src/app/framework/components/statistics-panel/statistics-panel.component.html`:
- `cdkDropList` is on the grid container
- `cdkDrag` is on each chart box
- `cdkDragHandle` is on the drag handle element

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| `No provider for DragDropModule` | Module not imported | Add `DragDropModule` to imports in `FrameworkModule` |
| Charts don't reorder | `cdkDrag` not on correct element | Ensure `cdkDrag` is on `.chart-box` div |
| Drag preview looks wrong | Missing CDK styles | Ensure `.cdk-drag-preview` and `.cdk-drag-placeholder` styles are defined |
| Charts overlap during drag | Missing `position: relative` | Add `position: relative` to `.chart-box` |
| Click events fire during drag | CDK captures events | This is expected; CDK handles the separation |

---

## Key Takeaways

1. **CDK provides powerful primitives** - Drag-drop without a full UI library
2. **Composition over inheritance** - StatisticsPanel composes BaseChartComponents
3. **URL updates flow through data sources** - The panel doesn't know how to update URLs; it delegates to data sources

---

## Acceptance Criteria

- [ ] `@angular/cdk` is installed and listed in `package.json`
- [ ] `StatisticsPanelComponent` accepts `domainConfig` and optional `chartIds` inputs
- [ ] Charts render in a grid layout (2 per row on desktop, 1 per row on mobile)
- [ ] Charts can be reordered via drag-and-drop
- [ ] Drag handle appears on hover
- [ ] Chart clicks update URL state via data source's `toUrlParams()`
- [ ] Pop-out placeholder shows when a chart is in a separate window
- [ ] "No data" message shows when `statistics$` is null
- [ ] Component is registered in `FrameworkModule`
- [ ] `ng build` completes with no errors

---

## Next Step

Proceed to `805-inline-filters-component.md` to build the compact filter chip display component.
