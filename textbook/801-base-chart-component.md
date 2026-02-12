# 801: Base Chart Component

**Status:** Planning
**Depends On:** 201-domain-config-interface, 301-url-state-service, 306-resource-management-service, 651-654 (Chart Data Sources)
**Blocks:** 804-statistics-panel-component

---

## Learning Objectives

After completing this section, you will:
- Understand the data source pattern for transforming domain data into chart-ready formats
- Know how to integrate Plotly.js with Angular's change detection strategy
- Be able to implement reusable chart containers that work with any domain configuration

---

## Objective

Build a domain-agnostic chart component that renders Plotly.js visualizations based on pluggable data sources. This component accepts any `ChartDataSource` implementation and handles all chart lifecycle concerns: rendering, resizing, event handling, and cleanup.

---

## Why

Charts are a critical feature for data discovery applications. However, each domain (automobiles, agriculture, etc.) has different data structures and visualization needs. Rather than creating domain-specific chart components, we build one generic container that works with any data.

The **Data Source Pattern** separates concerns:
1. **BaseChartComponent** handles Plotly.js integration, DOM management, and events
2. **ChartDataSource** implementations handle domain-specific data transformation

This pattern is the Phase 8 "aha moment": **Generic components + specific configuration = infinite reusability**.

### Angular Style Guide References

- [Style 03-01](https://angular.io/guide/styleguide#style-03-01): Use single responsibility principle
- [Style 05-15](https://angular.io/guide/styleguide#style-05-15): Provide a selector prefix

### URL-First Architecture Reference

When a user clicks on a chart element (e.g., a bar for "Toyota"), the click event flows through the data source's `toUrlParams()` method, which converts the click into URL query parameters. This maintains our URL-First principle: all state changes flow through URL updates.

---

## What

### Step 801.1: Install Plotly.js Dependency

First, install the Plotly.js minified distribution:

```bash
$ cd ~/projects/vvroom
$ npm install plotly.js-dist-min --save
```

Verify installation:

```bash
$ grep "plotly" package.json
    "plotly.js-dist-min": "^2.29.1",
```

### Step 801.2: Create the Chart Data Interface

Create the file `src/app/framework/components/base-chart/chart-data.interface.ts`:

```typescript
// src/app/framework/components/base-chart/chart-data.interface.ts
// VERSION 1 (Section 801) - Chart data structures

/**
 * Chart data structure for Plotly.js
 *
 * Contains the traces (data series), layout configuration, and optional
 * interaction state from previous user clicks.
 */
export interface ChartData {
  /**
   * Array of Plotly data traces (each trace represents a data series)
   */
  traces: any[];

  /**
   * Plotly layout configuration controlling chart appearance, axes, titles
   */
  layout: Partial<any>;

  /**
   * Optional click event data from the last chart interaction
   */
  clickData?: any;
}

/**
 * Abstract chart data source
 *
 * Transforms domain statistics into Plotly-ready chart data.
 * Each domain implements concrete data sources that extend this class.
 *
 * @template TStatistics - Domain-specific statistics type
 *
 * @example
 * ```typescript
 * export class ManufacturerChartSource extends ChartDataSource<VehicleStatistics> {
 *   transform(statistics, highlights, selectedValue, width) {
 *     // Transform VehicleStatistics into bar chart traces
 *   }
 * }
 * ```
 */
export abstract class ChartDataSource<TStatistics = any> {
  /**
   * Transform statistics into chart data
   *
   * @param statistics - Domain statistics from ResourceManagementService
   * @param highlights - Highlight filters for visual emphasis
   * @param selectedValue - Currently selected value to highlight
   * @param containerWidth - Container width for responsive sizing
   * @returns Chart data or null if no data available
   */
  abstract transform(
    statistics: TStatistics | null,
    highlights: any,
    selectedValue: string | null,
    containerWidth: number
  ): ChartData | null;

  /**
   * Get chart title for display
   */
  abstract getTitle(): string;

  /**
   * Handle chart click event
   *
   * Extracts the meaningful value from a Plotly click event.
   * For a bar chart, this might be the category name.
   * For a scatter plot, this might be coordinates.
   *
   * @param event - Plotly click event object
   * @returns Clicked value string or null if click is not actionable
   */
  abstract handleClick(event: any): string | null;

  /**
   * Convert clicked value to URL parameters
   *
   * Maps the chart's clicked value to URL query parameters.
   * Handles both filter mode (regular params) and highlight mode (h_* params).
   *
   * @param value - The clicked value from handleClick()
   * @param isHighlightMode - Whether highlight mode is active (h key held)
   * @returns URL parameters object to merge into the query string
   *
   * @example
   * ```typescript
   * // ManufacturerChartDataSource
   * toUrlParams('Toyota', false) // { manufacturer: 'Toyota' }
   * toUrlParams('Toyota', true)  // { h_manufacturer: 'Toyota' }
   * ```
   */
  abstract toUrlParams(value: string, isHighlightMode: boolean): Record<string, any>;
}
```

### Step 801.3: Create the Base Chart Component TypeScript

Create the file `src/app/framework/components/base-chart/base-chart.component.ts`:

```typescript
// src/app/framework/components/base-chart/base-chart.component.ts
// VERSION 1 (Section 801) - Generic Plotly.js chart container

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  AfterViewInit,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { ButtonModule } from 'primeng/button';

import { ChartData, ChartDataSource } from './chart-data.interface';

// Import Plotly.js minified distribution
import * as Plotly from 'plotly.js-dist-min';

/**
 * Extended HTMLElement interface for Plotly charts
 *
 * Plotly augments the DOM element with chart-specific methods and properties
 * after calling Plotly.newPlot().
 */
interface PlotlyHTMLElement extends HTMLElement {
  on(event: string, callback: (data: any) => void): void;
  data?: any[];
  layout?: any;
}

/**
 * Base Chart Component
 *
 * Reusable Plotly.js chart container that works with any ChartDataSource.
 * Handles chart rendering, resizing, click events, and memory cleanup.
 *
 * @example
 * ```html
 * <app-base-chart
 *   [dataSource]="manufacturerChartSource"
 *   [statistics]="statistics$ | async"
 *   [highlights]="highlights$ | async"
 *   (chartClick)="onChartClick($event)">
 * </app-base-chart>
 * ```
 */
@Component({
  selector: 'app-base-chart',
  templateUrl: './base-chart.component.html',
  styleUrls: ['./base-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BaseChartComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {

  /**
   * Reference to the chart container div where Plotly renders
   */
  @ViewChild('chartContainer', { static: false })
  chartContainer!: ElementRef<HTMLDivElement>;

  /**
   * Chart data source implementation (required)
   */
  @Input() dataSource!: ChartDataSource;

  /**
   * Statistics data to visualize
   */
  @Input() statistics: any | null = null;

  /**
   * Highlight filters for visual emphasis
   */
  @Input() highlights: any = {};

  /**
   * Currently selected value to highlight
   */
  @Input() selectedValue: string | null = null;

  /**
   * Whether to hide the chart title
   */
  @Input() hideTitle = false;

  /**
   * Whether to show pop-out button in mode bar
   */
  @Input() canPopOut = false;

  /**
   * Emits when user clicks on a chart element
   */
  @Output() chartClick = new EventEmitter<{
    value: string;
    isHighlightMode: boolean;
  }>();

  /**
   * Emits when user clicks the pop-out button
   */
  @Output() popOutClick = new EventEmitter<void>();

  /**
   * Whether highlight mode is active (h key held)
   */
  isHighlightModeActive = false;

  /**
   * Chart title from data source
   */
  chartTitle = '';

  /**
   * Error state flag
   */
  hasError = false;

  /**
   * Error message for display
   */
  errorMessage = '';

  private destroy$ = new Subject<void>();
  private plotlyElement: PlotlyHTMLElement | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  // ============================================================================
  // Lifecycle Hooks
  // ============================================================================

  ngOnInit(): void {
    if (!this.dataSource) {
      console.error('BaseChartComponent: dataSource is required');
    }
    this.chartTitle = this.dataSource?.getTitle() || 'Chart';
  }

  ngAfterViewInit(): void {
    // Render chart after view is ready
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Re-render when inputs change (after initial render)
    if (this.chartContainer) {
      this.renderChart();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Clean up Plotly chart to prevent memory leaks
    if (this.plotlyElement) {
      Plotly.purge(this.plotlyElement);
    }
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle window resize events
   */
  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.plotlyElement) {
      Plotly.Plots.resize(this.plotlyElement);
    }
  }

  /**
   * Enable highlight mode when h key is pressed
   */
  @HostListener('document:keydown.h')
  onHighlightKeyDown(): void {
    this.isHighlightModeActive = true;
    this.cdr.markForCheck();
  }

  /**
   * Disable highlight mode when h key is released
   */
  @HostListener('document:keyup.h')
  onHighlightKeyUp(): void {
    this.isHighlightModeActive = false;
    this.cdr.markForCheck();
  }

  /**
   * Retry rendering after an error
   */
  retryRender(): void {
    this.hasError = false;
    this.errorMessage = '';
    this.cdr.markForCheck();
    setTimeout(() => this.renderChart(), 0);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Render the Plotly chart with error boundary
   */
  private renderChart(): void {
    if (!this.chartContainer || !this.dataSource) {
      return;
    }

    try {
      this.hasError = false;
      this.errorMessage = '';

      const element = this.chartContainer.nativeElement;
      const containerWidth = element.clientWidth;

      // Transform data using the data source
      const chartData = this.dataSource.transform(
        this.statistics,
        this.highlights,
        this.selectedValue,
        containerWidth
      );

      if (!chartData) {
        // No data - clear chart
        if (this.plotlyElement) {
          Plotly.purge(this.plotlyElement);
          this.plotlyElement = null;
        }
        return;
      }

      // Configure layout with title
      const layout: Record<string, any> = { ...chartData.layout };
      if (!this.hideTitle && this.chartTitle) {
        layout['title'] = {
          text: this.chartTitle,
          font: { size: 14, color: '#ffffff' },
          x: 0.01,
          xanchor: 'left',
          y: 0.97,
          yanchor: 'top'
        };
        layout['margin'] = {
          ...layout['margin'],
          t: (layout['margin']?.t || 30) + 20
        };
      }

      // Plotly configuration
      const config: Partial<any> = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        scrollZoom: false,
        modeBarButtonsToRemove: ['sendDataToCloud', 'lasso2d']
      };

      // Render or update chart
      if (this.plotlyElement) {
        Plotly.react(this.plotlyElement, chartData.traces, layout, config);
      } else {
        Plotly.newPlot(element, chartData.traces, layout, config)
          .then((gd: PlotlyHTMLElement) => {
            this.plotlyElement = gd;
            this.attachEventHandlers(gd);
          })
          .catch((err: Error) => {
            this.handleRenderError(err, 'Failed to create chart');
          });
      }
    } catch (err) {
      this.handleRenderError(err as Error, 'Chart rendering failed');
    }
  }

  /**
   * Attach Plotly event handlers
   */
  private attachEventHandlers(gd: PlotlyHTMLElement): void {
    gd.on('plotly_click', (data: any) => {
      try {
        const clickedValue = this.dataSource.handleClick(data);
        if (clickedValue) {
          this.chartClick.emit({
            value: clickedValue,
            isHighlightMode: this.isHighlightModeActive
          });
        }
      } catch (err) {
        console.error('[BaseChart] Click handler error:', err);
      }
    });

    gd.on('plotly_selected', (data: any) => {
      try {
        const selectedValue = this.dataSource.handleClick(data);
        if (selectedValue) {
          this.chartClick.emit({
            value: selectedValue,
            isHighlightMode: this.isHighlightModeActive
          });
        }
      } catch (err) {
        console.error('[BaseChart] Selection handler error:', err);
      }
    });
  }

  /**
   * Handle render errors with user-friendly fallback
   */
  private handleRenderError(err: Error, context: string): void {
    console.error(`[BaseChart] ${context}:`, err);
    this.hasError = true;
    this.errorMessage = `${context}: ${err.message || 'Unknown error'}`;
    this.cdr.markForCheck();

    if (this.plotlyElement) {
      try {
        Plotly.purge(this.plotlyElement);
      } catch {
        // Ignore purge errors
      }
      this.plotlyElement = null;
    }
  }
}
```

### Step 801.4: Create the Base Chart Component Template

Create the file `src/app/framework/components/base-chart/base-chart.component.html`:

```html
<!-- src/app/framework/components/base-chart/base-chart.component.html -->
<!-- VERSION 1 (Section 801) - Chart container template -->

<div class="chart-wrapper">
  <!-- Error boundary fallback -->
  <div *ngIf="hasError" class="chart-error">
    <div class="error-content">
      <i class="pi pi-exclamation-triangle"></i>
      <p class="error-title">Chart failed to render</p>
      <p class="error-message">{{ errorMessage }}</p>
      <button
        pButton
        type="button"
        label="Retry"
        icon="pi pi-refresh"
        class="p-button-outlined p-button-sm"
        (click)="retryRender()">
      </button>
    </div>
  </div>

  <!-- Plotly chart container (hidden when error) -->
  <div #chartContainer class="chart-container" [hidden]="hasError"></div>

  <!-- No data message -->
  <div *ngIf="!statistics && !hasError" class="no-data-message">
    <p>No data available</p>
  </div>
</div>
```

### Step 801.5: Create the Base Chart Component Styles

Create the file `src/app/framework/components/base-chart/base-chart.component.scss`:

```scss
// src/app/framework/components/base-chart/base-chart.component.scss
// VERSION 1 (Section 801) - Chart container styles

.chart-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-container {
  flex: 1;
  min-height: 300px;
  width: 100%;
  overflow: hidden;
}

.no-data-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  color: var(--text-color-secondary);
  font-style: italic;
}

.chart-error {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  background-color: var(--surface-ground, #f8f9fa);
  border: 1px dashed var(--red-400, #f87171);
  border-radius: 6px;
  padding: 2rem;

  .error-content {
    text-align: center;
    max-width: 400px;

    .pi-exclamation-triangle {
      font-size: 2.5rem;
      color: var(--red-500, #ef4444);
      margin-bottom: 1rem;
    }

    .error-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-color);
      margin: 0 0 0.5rem 0;
    }

    .error-message {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
      margin: 0 0 1rem 0;
      word-break: break-word;
    }

    button {
      margin-top: 0.5rem;
    }
  }
}
```

### Step 801.6: Create the Module Export

Create the file `src/app/framework/components/base-chart/index.ts`:

```typescript
// src/app/framework/components/base-chart/index.ts
// VERSION 1 (Section 801) - Barrel export

export { BaseChartComponent } from './base-chart.component';
export { ChartData, ChartDataSource } from './chart-data.interface';
```

### Step 801.7: Register in Framework Module

Open `src/app/framework/framework.module.ts` and add the component:

```typescript
// src/app/framework/framework.module.ts
// VERSION 2 (Section 801) - Add BaseChartComponent
// Replaces VERSION 1 from Section 315

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

import { BaseChartComponent } from './components/base-chart/base-chart.component';

@NgModule({
  declarations: [
    BaseChartComponent
  ],
  imports: [
    CommonModule,
    ButtonModule
  ],
  exports: [
    BaseChartComponent
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

Expected: Build succeeds with no errors related to BaseChartComponent.

### 2. Check TypeScript Compilation

```bash
$ npx tsc --noEmit
```

Expected: No type errors.

### 3. Verify Module Registration

```bash
$ grep -r "BaseChartComponent" src/app/framework/
```

Expected output shows the component in the module's declarations and exports.

### 4. Manual Inspection

Open `src/app/framework/components/base-chart/base-chart.component.ts` and verify:
- The `ChartDataSource` abstract class is imported
- All lifecycle hooks are implemented
- The `@HostListener` decorators are present for resize and keyboard events

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| `Cannot find module 'plotly.js-dist-min'` | Package not installed | Run `npm install plotly.js-dist-min --save` |
| `Property 'Plots' does not exist on type 'typeof Plotly'` | TypeScript type issue | The `any` type on Plotly import handles this; verify import syntax |
| Chart doesn't resize on window resize | `@HostListener` not triggering | Ensure component is in change detection tree |
| Memory leak warnings in console | Plotly not cleaned up | Verify `Plotly.purge()` is called in `ngOnDestroy` |
| Chart not rendering | Container has zero dimensions | Add `min-height: 300px` to the chart container |

---

## Key Takeaways

1. **The Data Source Pattern separates concerns** - The component handles rendering; data sources handle transformation
2. **Plotly requires explicit cleanup** - Always call `Plotly.purge()` in `ngOnDestroy` to prevent memory leaks
3. **Abstract classes define contracts** - `ChartDataSource` ensures all chart types implement required methods

---

## Acceptance Criteria

- [ ] `plotly.js-dist-min` package is installed and listed in `package.json`
- [ ] `ChartDataSource` abstract class defines all required methods
- [ ] `BaseChartComponent` renders a container div for Plotly
- [ ] Window resize triggers chart resize via `@HostListener`
- [ ] `h` key toggles highlight mode
- [ ] Error boundary displays user-friendly message on render failure
- [ ] `ngOnDestroy` calls `Plotly.purge()` for cleanup
- [ ] Component is registered in `FrameworkModule`
- [ ] `ng build` completes with no errors

---

## Next Step

Proceed to `802-base-picker-component.md` to build the configuration-driven multi-select picker component.
