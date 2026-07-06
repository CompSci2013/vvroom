/**
 * @halolabs/ngx-chart — Renderer-agnostic chart library
 *
 * This library provides a chart rendering layer that is decoupled from any
 * specific charting engine (Plotly, E-Charts, etc.). Consumers provide data
 * via `ChartDataSource` interfaces; the library resolves a `ChartRenderer`
 * implementation via DI and delegates rendering to it.
 *
 * @packageDocumentation
 */

// ── Core interfaces ────────────────────────────────────────────────────────
export { ChartDataSource } from '../lib/interfaces/chart-data-source';
export { ChartRenderer, CHART_RENDERER } from '../lib/interfaces/chart-renderer';
export { RenderableChartData, ChartBucket } from '../lib/interfaces/renderable-chart-data';

// ── Components ─────────────────────────────────────────────────────────────
export { ChartComponent } from '../lib/components/chart/chart.component';
export { ChartGridComponent } from '../lib/components/chart-grid/chart-grid.component';

// ── Module ─────────────────────────────────────────────────────────────────
export { NgxChartModule } from '../lib/ngx-chart.module';
