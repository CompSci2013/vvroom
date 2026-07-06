/**
 * NgxChartModule — Angular module for the renderer-agnostic chart library.
 *
 * Imports the CDK drag-drop module (required by ChartGridComponent) and
 * declares the chart components.
 *
 * Consumers must provide a `ChartRenderer` implementation via the
 * `CHART_RENDERER` injection token, typically from @halolabs/ngx-plotly.
 *
 * @example
 * ```typescript
 * // In a feature module that uses charts
 * import { NgxChartModule } from '@halolabs/ngx-chart';
 * import { PlotlyChartRenderer, CHART_RENDERER } from '@halolabs/ngx-plotly';
 *
 * @NgModule({
 *   imports: [NgxChartModule],
 *   providers: [{ provide: CHART_RENDERER, useClass: PlotlyChartRenderer }],
 * })
 * export class DiscoverModule { }
 * ```
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { ChartComponent } from './components/chart/chart.component';
import { ChartGridComponent } from './components/chart-grid/chart-grid.component';

@NgModule({
  declarations: [
    ChartComponent,
    ChartGridComponent,
  ],
  imports: [
    CommonModule,
    DragDropModule,
  ],
  exports: [
    ChartComponent,
    ChartGridComponent,
    // Re-export CDK drag-drop for consumers who may need it
    DragDropModule,
  ],
})
export class NgxChartModule { }
