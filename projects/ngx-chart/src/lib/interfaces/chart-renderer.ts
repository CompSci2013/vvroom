import { InjectionToken } from '@angular/core';
import type { RenderableChartData } from './renderable-chart-data';

/**
 * ChartRenderer — Interface for rendering RenderableChartData into a
 * native charting engine (Plotly, E-Charts, Canvas, etc.).
 *
 * Per V-5: The chart library is renderer-agnostic. A ChartRenderer
 * implementation is provided via DI using the CHART_RENDERER token.
 * Default implementation is PlotlyChartRenderer (in @halolabs/ngx-plotly).
 */
export interface ChartRenderer {
  /**
   * Render the chart data into the given container element.
   * If the container already has a chart, this should update it in place.
   */
  render(container: HTMLElement, data: RenderableChartData): void;

  /**
   * Tear down the chart and clean up resources in the container.
   * Called on component destroy or when data becomes null.
   */
  destroy(container: HTMLElement): void;
}

/**
 * DI token for the chart renderer implementation.
 *
 * Consumers of @halolabs/ngx-chart must provide a concrete renderer.
 * Without a provider, the chart component will render nothing and log a warning.
 */
export const CHART_RENDERER = new InjectionToken<ChartRenderer>('CHART_RENDERER');
