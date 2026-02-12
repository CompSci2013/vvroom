# 903: Discover Page Component

**Status:** Planning
**Depends On:** 902-automobile-landing-component, 306-resource-management-service, 801-809 (Framework Components)
**Blocks:** 907-final-integration

---

## Learning Objectives

After completing this section, you will:
- Understand how to orchestrate multiple framework components in a feature page
- Know how to use `ResourceManagementService` for URL-first state management
- Be able to implement drag-and-drop panel reordering with Angular CDK

---

## Objective

Build the Automobile Discover component — the main data exploration interface that combines all framework components (query control, charts, tables, pickers) into a cohesive discovery experience. This is where users spend most of their time: filtering data, viewing statistics, and exploring results.

---

## Why

The Discover component is the heart of vvroom. It demonstrates the power of the URL-First architecture by:

1. **Orchestrating Components** — Combines query panel, charts, tables, and pickers
2. **Managing State** — Uses `ResourceManagementService` with URL as single source of truth
3. **Enabling Workflows** — Supports pop-out windows for multi-monitor setups
4. **Providing Flexibility** — Allows users to reorder and collapse panels

### The Orchestrator Pattern

Feature components like Discover don't contain UI logic themselves. Instead, they:

```
Feature Component (Orchestrator)
    ├── Injects services (ResourceManagementService, DomainConfig)
    ├── Coordinates framework components
    ├── Handles cross-component communication
    └── Manages page-level concerns (panel order, collapse state)
```

Each framework component (QueryControl, BaseChart, DynamicResultsTable) is self-contained. The Discover component wires them together and handles their outputs.

### Angular Style Guide References

- [Style 05-04](https://angular.io/guide/styleguide#style-05-04): Delegate complex component logic to services
- [Style 07-04](https://angular.io/guide/styleguide#style-07-04): Use input/output properties for component communication

---

## What

### Step 903.1: Create the Discover Component Directory

```bash
$ cd ~/projects/vvroom
$ mkdir -p src/app/features/automobile/automobile-discover
```

---

### Step 903.2: Create the Discover Component

Create `src/app/features/automobile/automobile-discover/automobile-discover.component.ts`:

```typescript
// src/app/features/automobile/automobile-discover/automobile-discover.component.ts
// VERSION 1 (Section 903) - Main discovery page with framework component orchestration

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  Injector,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Params } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DomainConfig } from '../../../../framework/models/domain-config.interface';
import { PopOutMessageType } from '../../../../framework/models/popout.interface';
import { DOMAIN_CONFIG } from '../../../../framework/services/domain-config-registry.service';
import { FilterOptionsService } from '../../../../framework/services/filter-options.service';
import { PickerConfigRegistry } from '../../../../framework/services/picker-config-registry.service';
import { PopOutManagerService } from '../../../../framework/services/popout-manager.service';
import { ResourceManagementService } from '../../../../framework/services/resource-management.service';
import { UrlStateService } from '../../../../framework/services/url-state.service';
import { UserPreferencesService } from '../../../../framework/services/user-preferences.service';
import { ChartDataSource } from '../../../../framework/components/base-chart/base-chart.component';
import { createAutomobilePickerConfigs } from '../../../../domain-config/automobile/configs/automobile.picker-configs';

/**
 * Automobile Discover Component
 *
 * Main discovery page for the Automobile domain. This component orchestrates
 * all framework components to provide a comprehensive data exploration experience.
 *
 * Responsibilities:
 * - Provides ResourceManagementService instance for URL-first state management
 * - Registers automobile-specific picker configurations
 * - Manages pop-out window communication
 * - Handles panel ordering and collapse state
 * - Coordinates events between child components
 *
 * Child Components:
 * - QueryControlComponent: Filter management UI
 * - BasePickerComponent: Manufacturer-model hierarchical picker
 * - StatisticsPanel2Component: Multi-chart statistics display
 * - DynamicResultsTableComponent: Paginated data table
 * - BaseChartComponent: Individual chart visualizations
 */
@Component({
  selector: 'app-automobile-discover',
  templateUrl: './automobile-discover.component.html',
  styleUrls: ['./automobile-discover.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ResourceManagementService, PopOutManagerService]
})
export class AutomobileDiscoverComponent implements OnInit, OnDestroy {

  /** Domain configuration injected from registry */
  domainConfig: DomainConfig<any, any, any>;

  /** Track which panels are collapsed */
  collapsedPanels = new Map<string, boolean>([
    ['manufacturer-model-picker', true]  // Start picker collapsed
  ]);

  /** Order of panels in the UI (user can reorder via drag-drop) */
  panelOrder: string[] = [
    'query-control',
    'statistics-1',
    'chart-body-class',
    'chart-year',
    'manufacturer-model-picker',
    'results-table'
  ];

  /** Unique picker configuration ID for this page instance */
  readonly pickerConfigId = 'automobile-discover-manufacturer-model-picker';

  private destroy$ = new Subject<void>();
  private readonly gridId = 'automobile-discover';

  constructor(
    @Inject(DOMAIN_CONFIG) domainConfig: DomainConfig<any, any, any>,
    public resourceService: ResourceManagementService<any, any, any>,
    private pickerRegistry: PickerConfigRegistry,
    private injector: Injector,
    private popOutManager: PopOutManagerService,
    private cdr: ChangeDetectorRef,
    private urlStateService: UrlStateService,
    private userPreferences: UserPreferencesService,
    private filterOptionsService: FilterOptionsService
  ) {
    this.domainConfig = domainConfig;
  }

  ngOnInit(): void {
    // Register picker configurations for this page
    const pickerConfigs = createAutomobilePickerConfigs(this.injector, 'automobile-discover');
    this.pickerRegistry.registerMultiple(pickerConfigs);

    // Initialize pop-out manager for this grid
    this.popOutManager.initialize(this.gridId);

    // Handle messages from pop-out windows
    this.popOutManager.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ panelId, message }) => {
        this.handlePopOutMessage(panelId, message);
      });

    // Update UI when pop-out windows close
    this.popOutManager.closed$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

    // Broadcast state changes to pop-out windows
    this.resourceService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        const filterOptionsCache = this.filterOptionsService.getCache();
        this.popOutManager.broadcastState(state, filterOptionsCache);
      });

    // Sync filter options cache to pop-outs when it changes
    this.filterOptionsService.getCache$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(cache => {
        if (this.popOutManager.getPoppedOutPanels().length > 0) {
          const state = this.resourceService.getCurrentState();
          this.popOutManager.broadcastState(state, cache);
        }
      });
  }

  // ============================================================================
  // Panel State Management
  // ============================================================================

  /**
   * Check if a panel is currently popped out to a separate window
   */
  isPanelPoppedOut(panelId: string): boolean {
    return this.popOutManager.isPoppedOut(panelId);
  }

  /**
   * Check if a panel is collapsed
   */
  isPanelCollapsed(panelId: string): boolean {
    return this.collapsedPanels.get(panelId) ?? false;
  }

  /**
   * Toggle panel collapse state
   */
  togglePanelCollapse(panelId: string): void {
    const currentState = this.collapsedPanels.get(panelId) ?? false;
    this.collapsedPanels.set(panelId, !currentState);

    // Persist collapsed state
    const collapsedPanels = Array.from(this.collapsedPanels.entries())
      .filter(([_, isCollapsed]) => isCollapsed)
      .map(([id]) => id);
    this.userPreferences.saveCollapsedPanels(collapsedPanels);

    this.cdr.markForCheck();
  }

  /**
   * Handle panel drag-drop reordering
   */
  onPanelDrop(event: { previousIndex: number; currentIndex: number }): void {
    const item = this.panelOrder.splice(event.previousIndex, 1)[0];
    this.panelOrder.splice(event.currentIndex, 0, item);
    this.userPreferences.savePanelOrder(this.panelOrder);
    this.cdr.markForCheck();
  }

  /**
   * TrackBy function for panel ngFor
   */
  trackByPanelId(index: number, panelId: string): string {
    return panelId;
  }

  // ============================================================================
  // Panel Configuration
  // ============================================================================

  /**
   * Get human-readable title for a panel
   */
  getPanelTitle(panelId: string): string {
    const titleMap: { [key: string]: string } = {
      'query-control': 'Query Control',
      'manufacturer-model-picker': 'Manufacturer-Model Picker',
      'statistics-1': 'Statistics',
      'chart-body-class': 'Vehicles by Body Class',
      'chart-year': 'Vehicles by Year',
      'results-table': 'Results Table'
    };
    return titleMap[panelId] || panelId;
  }

  /**
   * Get component type for a panel (used for pop-out routing)
   */
  getPanelType(panelId: string): string {
    const typeMap: { [key: string]: string } = {
      'query-control': 'query-control',
      'manufacturer-model-picker': 'picker',
      'statistics-1': 'statistics-2',
      'chart-body-class': 'chart',
      'chart-year': 'chart',
      'results-table': 'basic-results'
    };
    return typeMap[panelId] || panelId;
  }

  /**
   * Get chart IDs for a statistics panel
   */
  getChartIdsForPanel(panelId: string): string[] {
    const chartIdMap: { [key: string]: string[] } = {
      'statistics-1': ['manufacturer', 'top-models']
    };
    return chartIdMap[panelId] || [];
  }

  /**
   * Get chart data source by ID
   */
  getChartDataSource(chartId: string): ChartDataSource | undefined {
    return this.domainConfig.chartDataSources?.[chartId];
  }

  // ============================================================================
  // Pop-Out Management
  // ============================================================================

  /**
   * Open a panel in a pop-out window
   */
  popOutPanel(panelId: string, panelType: string): void {
    this.popOutManager.openPopOut(panelId, panelType);
    this.cdr.markForCheck();
  }

  /**
   * Handle chart pop-out request
   */
  onChartPopOut(chartId: string): void {
    const panelId = `chart-${chartId}`;
    this.popOutManager.openPopOut(panelId, 'chart');
    this.cdr.markForCheck();
  }

  /**
   * Handle messages from pop-out windows
   */
  private async handlePopOutMessage(_panelId: string, message: any): Promise<void> {
    switch (message.type) {
      case PopOutMessageType.PANEL_READY:
        // Pop-out is ready, send current state
        const currentState = this.resourceService.getCurrentState();
        const currentCache = this.filterOptionsService.getCache();
        this.popOutManager.broadcastState(currentState, currentCache);
        break;

      case PopOutMessageType.URL_PARAMS_CHANGED:
        // Pop-out changed filters, update URL
        if (message.payload?.params) {
          await this.urlStateService.setParams(message.payload.params);
        }
        break;

      case PopOutMessageType.CLEAR_ALL_FILTERS:
        await this.urlStateService.clearParams();
        break;

      case PopOutMessageType.PICKER_SELECTION_CHANGE:
        if (message.payload) {
          await this.onPickerSelectionChangeAndUpdateUrl(message.payload);
        }
        break;

      case PopOutMessageType.FILTER_ADD:
        if (message.payload?.params) {
          await this.urlStateService.setParams({
            ...message.payload.params,
            page: 1
          });
        }
        break;

      case PopOutMessageType.FILTER_REMOVE:
        if (message.payload?.field) {
          await this.urlStateService.setParams({
            [message.payload.field]: null,
            page: 1
          });
        }
        break;

      case PopOutMessageType.CHART_CLICK:
        if (message.payload) {
          const dataSource = this.domainConfig.chartDataSources?.[message.payload.chartId];
          await this.onStandaloneChartClick(
            { value: message.payload.value, isHighlightMode: message.payload.isHighlightMode },
            dataSource
          );
        }
        break;
    }
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle URL parameter changes from child components
   */
  async onUrlParamsChange(params: Params): Promise<void> {
    await this.urlStateService.setParams(params);
  }

  /**
   * Handle clear all filters request
   */
  async onClearAllFilters(): Promise<void> {
    await this.urlStateService.clearParams();
  }

  /**
   * Handle chart click events
   */
  async onStandaloneChartClick(
    event: { value: string; isHighlightMode: boolean },
    dataSource: ChartDataSource | undefined
  ): Promise<void> {
    if (!dataSource) return;

    const newParams = dataSource.toUrlParams(event.value, event.isHighlightMode);
    if (!event.isHighlightMode) {
      newParams['page'] = 1;
    }

    if (Object.keys(newParams).length > 0) {
      await this.urlStateService.setParams(newParams);
    }
  }

  /**
   * Handle picker selection changes
   */
  async onPickerSelectionChangeAndUpdateUrl(event: any): Promise<void> {
    const paramName = 'modelCombos';
    await this.urlStateService.setParams({
      [paramName]: event.urlValue || null,
      page: 1
    });
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**Key architectural points:**

| Aspect | Implementation |
|--------|----------------|
| State Management | `ResourceManagementService` provided at component level |
| Pop-Out Support | `PopOutManagerService` coordinates window communication |
| Change Detection | `OnPush` strategy for optimal performance |
| Panel Ordering | Array-based order with drag-drop support |
| Event Handling | Async URL state updates for all user interactions |

---

### Step 903.3: Create the Discover Component Template

Create `src/app/features/automobile/automobile-discover/automobile-discover.component.html`:

```html
<!-- src/app/features/automobile/automobile-discover/automobile-discover.component.html -->
<!-- VERSION 1 (Section 903) - Discovery page with draggable panels -->

<div class="discover-container">
  <!-- Header with Results Count -->
  <div class="discover-header">
    <h1>Automobile Discovery</h1>
    <span class="results-count">
      {{ resourceService.totalResults$ | async }}
      {{ (resourceService.totalResults$ | async) === 1 ? 'result' : 'results' }}
    </span>
  </div>

  <!-- Panels Container -->
  <div class="panels-container">
    <div *ngFor="let panelId of panelOrder; trackBy: trackByPanelId"
         class="panel-wrapper"
         [attr.id]="'panel-' + panelId">

      <!-- Panel Header -->
      <div class="panel-header">
        <div class="panel-title-group">
          <span class="drag-handle">☰</span>
          <h3 class="panel-title">{{ getPanelTitle(panelId) }}</h3>
        </div>
        <div class="panel-actions">
          <button
            type="button"
            class="btn-icon"
            (click)="togglePanelCollapse(panelId)"
            [attr.aria-label]="isPanelCollapsed(panelId) ? 'Expand' : 'Collapse'"
            [title]="isPanelCollapsed(panelId) ? 'Expand' : 'Collapse'">
            {{ isPanelCollapsed(panelId) ? '▶' : '▼' }}
          </button>
          <button
            *ngIf="!isPanelPoppedOut(panelId)"
            type="button"
            class="btn-icon"
            (click)="popOutPanel(panelId, getPanelType(panelId))"
            aria-label="Pop out to separate window"
            title="Pop out to separate window">
            ↗
          </button>
        </div>
      </div>

      <!-- Panel Content (shown when not collapsed) -->
      <div class="panel-content" *ngIf="!isPanelCollapsed(panelId)">

        <!-- Query Control Panel -->
        <ng-container *ngIf="panelId === 'query-control'">
          <div *ngIf="!isPanelPoppedOut('query-control'); else queryControlPoppedOut">
            <app-query-control
              [domainConfig]="domainConfig"
              (urlParamsChange)="onUrlParamsChange($event)"
              (clearAllFilters)="onClearAllFilters()">
            </app-query-control>
          </div>
          <ng-template #queryControlPoppedOut>
            <div class="popout-placeholder">
              <span class="popout-icon">↗</span>
              <span>Query Control is open in a separate window</span>
            </div>
          </ng-template>
        </ng-container>

        <!-- Manufacturer-Model Picker Panel -->
        <ng-container *ngIf="panelId === 'manufacturer-model-picker'">
          <div *ngIf="!isPanelPoppedOut('manufacturer-model-picker'); else pickerPoppedOut">
            <app-base-picker
              [configId]="pickerConfigId"
              (selectionChange)="onPickerSelectionChangeAndUpdateUrl($event)">
            </app-base-picker>
          </div>
          <ng-template #pickerPoppedOut>
            <div class="popout-placeholder">
              <span class="popout-icon">↗</span>
              <span>Manufacturer-Model Picker is open in a separate window</span>
            </div>
          </ng-template>
        </ng-container>

        <!-- Statistics Panel -->
        <ng-container *ngIf="panelId === 'statistics-1'">
          <div *ngIf="!isPanelPoppedOut('statistics-1'); else statsPoppedOut">
            <app-statistics-panel-2
              [domainConfig]="domainConfig"
              [chartIds]="getChartIdsForPanel('statistics-1')"
              [isPanelPoppedOut]="isPanelPoppedOut.bind(this)"
              (chartPopOut)="onChartPopOut($event)">
            </app-statistics-panel-2>
          </div>
          <ng-template #statsPoppedOut>
            <div class="popout-placeholder">
              <span class="popout-icon">↗</span>
              <span>Statistics is open in a separate window</span>
            </div>
          </ng-template>
        </ng-container>

        <!-- Body Class Chart (Standalone) -->
        <ng-container *ngIf="panelId === 'chart-body-class'">
          <div *ngIf="!isPanelPoppedOut('chart-body-class') && getChartDataSource('body-class') as bodyClassDataSource; else bodyClassPoppedOut">
            <app-base-chart
              [dataSource]="bodyClassDataSource"
              [statistics]="resourceService.statistics$ | async"
              [highlights]="resourceService.highlights$ | async"
              [selectedValue]="null"
              (chartClick)="onStandaloneChartClick($event, bodyClassDataSource)">
            </app-base-chart>
          </div>
          <ng-template #bodyClassPoppedOut>
            <div class="popout-placeholder">
              <span class="popout-icon">↗</span>
              <span>Vehicles by Body Class is open in a separate window</span>
            </div>
          </ng-template>
        </ng-container>

        <!-- Year Chart (Standalone) -->
        <ng-container *ngIf="panelId === 'chart-year'">
          <div *ngIf="!isPanelPoppedOut('chart-year') && getChartDataSource('year') as yearDataSource; else yearPoppedOut">
            <app-base-chart
              [dataSource]="yearDataSource"
              [statistics]="resourceService.statistics$ | async"
              [highlights]="resourceService.highlights$ | async"
              [selectedValue]="null"
              (chartClick)="onStandaloneChartClick($event, yearDataSource)">
            </app-base-chart>
          </div>
          <ng-template #yearPoppedOut>
            <div class="popout-placeholder">
              <span class="popout-icon">↗</span>
              <span>Vehicles by Year is open in a separate window</span>
            </div>
          </ng-template>
        </ng-container>

        <!-- Results Table Panel -->
        <ng-container *ngIf="panelId === 'results-table'">
          <div *ngIf="!isPanelPoppedOut('results-table'); else resultsTablePoppedOut">
            <app-dynamic-results-table
              [domainConfig]="domainConfig">
            </app-dynamic-results-table>
          </div>
          <ng-template #resultsTablePoppedOut>
            <div class="popout-placeholder">
              <span class="popout-icon">↗</span>
              <span>Results Table is open in a separate window</span>
            </div>
          </ng-template>
        </ng-container>

      </div>
    </div>
  </div>
</div>
```

**Template patterns explained:**

| Pattern | Purpose |
|---------|---------|
| `async` pipe | Subscribes to observables and handles cleanup automatically |
| `ng-template` with `#reference` | Defines placeholder content for popped-out panels |
| `*ngIf...else` | Conditionally shows component or placeholder |
| `trackBy` function | Optimizes `*ngFor` rendering performance |
| `bind(this)` on callback | Preserves `this` context when passing method as input |

---

### Step 903.4: Create the Discover Component Styles

Create `src/app/features/automobile/automobile-discover/automobile-discover.component.scss`:

```scss
// src/app/features/automobile/automobile-discover/automobile-discover.component.scss
// VERSION 1 (Section 903) - Discovery page layout and panel styles

.discover-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
}

// Header
.discover-header {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;

  h1 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #333;
    margin: 0;
  }

  .results-count {
    font-size: 0.9rem;
    color: #666;
  }
}

// Panels container
.panels-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

// Individual panel
.panel-wrapper {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.panel-title-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  .drag-handle {
    cursor: grab;
    color: #999;
    font-size: 1rem;
    user-select: none;

    &:hover {
      color: #666;
    }
  }

  .panel-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: #333;
    margin: 0;
  }
}

.panel-actions {
  display: flex;
  gap: 0.25rem;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  color: #666;
  transition: background-color 0.15s, color 0.15s;

  &:hover {
    background: rgba(0, 0, 0, 0.08);
    color: #333;
  }

  &:focus {
    outline: 2px solid #1976d2;
    outline-offset: 1px;
  }
}

.panel-content {
  padding: 1rem;
}

// Pop-out placeholder
.popout-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  background: #f9f9f9;
  border: 2px dashed #ddd;
  border-radius: 4px;
  color: #666;
  font-size: 0.9rem;

  .popout-icon {
    font-size: 1.25rem;
    opacity: 0.6;
  }
}

// Loading state
:host ::ng-deep .loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #666;
}

// Responsive adjustments
@media (max-width: 768px) {
  .discover-container {
    padding: 0.5rem;
  }

  .discover-header {
    flex-direction: column;
    gap: 0.25rem;

    h1 {
      font-size: 1.25rem;
    }
  }

  .panel-content {
    padding: 0.75rem;
  }
}
```

---

### Step 903.5: Update the Automobile Module

Update `src/app/features/automobile/automobile.module.ts` to include the Discover component:

```typescript
// src/app/features/automobile/automobile.module.ts
// VERSION 2 (Section 903) - Add AutomobileDiscoverComponent
// Replaces VERSION 1 from Section 902

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AutomobileComponent } from './automobile.component';
import { AutomobileDiscoverComponent } from './automobile-discover/automobile-discover.component';

// Framework component imports
import { QueryControlComponent } from '../../../framework/components/query-control/query-control.component';
import { BasePickerComponent } from '../../../framework/components/base-picker/base-picker.component';
import { StatisticsPanel2Component } from '../../../framework/components/statistics-panel-2/statistics-panel-2.component';
import { BaseChartComponent } from '../../../framework/components/base-chart/base-chart.component';
import { DynamicResultsTableComponent } from '../../../framework/components/dynamic-results-table/dynamic-results-table.component';

@NgModule({
  declarations: [
    AutomobileComponent,
    AutomobileDiscoverComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    // Framework components
    QueryControlComponent,
    BasePickerComponent,
    StatisticsPanel2Component,
    BaseChartComponent,
    DynamicResultsTableComponent
  ],
  exports: [
    AutomobileComponent,
    AutomobileDiscoverComponent
  ]
})
export class AutomobileModule {}
```

**Note:** Framework components from Phase 8 are imported here. They should already be created as standalone components or have their own modules.

---

### Step 903.6: Update Barrel Export

Update `src/app/features/automobile/index.ts`:

```typescript
// src/app/features/automobile/index.ts
// VERSION 2 (Section 903) - Add discover component export

export * from './automobile.component';
export * from './automobile-discover/automobile-discover.component';
export * from './automobile.module';
```

---

## Verification

### 1. Check File Structure

```bash
$ find src/app/features/automobile -type f | sort
```

Expected output:

```
src/app/features/automobile/automobile-discover/automobile-discover.component.html
src/app/features/automobile/automobile-discover/automobile-discover.component.scss
src/app/features/automobile/automobile-discover/automobile-discover.component.ts
src/app/features/automobile/automobile.component.html
src/app/features/automobile/automobile.component.scss
src/app/features/automobile/automobile.component.ts
src/app/features/automobile/automobile.module.ts
src/app/features/automobile/index.ts
```

### 2. Build the Application

```bash
$ ng build
```

Expected: Build succeeds. If there are import errors for framework components, ensure Phase 8 is complete.

### 3. Visual Verification (After Routing)

Navigate to `http://localhost:4200/automobiles/discover`:

- Page header shows "Automobile Discovery" with results count
- Multiple panels visible (Query Control, Statistics, Charts, Table)
- Each panel has header with collapse/expand and pop-out buttons
- Clicking collapse button hides panel content
- Clicking pop-out button opens new window (requires pop-out routes)

### 4. URL State Test

1. Apply a filter (e.g., select a manufacturer)
2. Observe URL changes (e.g., `?manufacturer=Toyota`)
3. Refresh the page
4. Filter should persist (URL-first architecture in action)

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| "No provider for ResourceManagementService" | Service not in providers array | Add to component's `providers` array |
| "No provider for DOMAIN_CONFIG" | Domain config not registered | Ensure domain providers are set up in AppModule |
| Framework components not found | Phase 8 components missing | Complete Phase 8 before this section |
| Pop-out not working | Pop-out routes not configured | Configure pop-out routes in document 904-905 |
| Charts not rendering | Chart data sources not configured | Verify domain config has `chartDataSources` property |
| Filters not persisting | URL state service not working | Check UrlStateService initialization |

---

## Key Takeaways

1. **Feature components orchestrate, not implement** — They wire together framework components
2. **Component-level providers create isolated instances** — `ResourceManagementService` is fresh for each Discover instance
3. **The async pipe is your friend** — It handles subscription management automatically

---

## Acceptance Criteria

- [ ] `AutomobileDiscoverComponent` is created with proper providers
- [ ] Component template renders all panel types (query control, charts, table, picker)
- [ ] Panels can be collapsed and expanded
- [ ] Pop-out placeholder is shown when a panel is popped out
- [ ] Results count updates reactively from `ResourceManagementService`
- [ ] All child component inputs are properly bound
- [ ] Event handlers update URL state through `UrlStateService`
- [ ] `ng build` completes without errors

---

## Architecture Note: The Flow of Data

The Discover component demonstrates the complete URL-First data flow:

```
User Action (click filter)
    ↓
Event Handler (onUrlParamsChange)
    ↓
UrlStateService.setParams()
    ↓
URL Updates (browser address bar)
    ↓
ResourceManagementService watches URL
    ↓
Filters extracted → API call made
    ↓
Response updates BehaviorSubject
    ↓
Components receive new data via async pipe
    ↓
UI updates automatically
```

Every piece of state flows through the URL. This is the "Aha moment" of Phase 9: you've built an application where the URL is the single source of truth, and every component reacts to URL changes.

---

## Next Step

Proceed to `904-popout-component.md` to build the pop-out window component that enables multi-monitor workflows.
