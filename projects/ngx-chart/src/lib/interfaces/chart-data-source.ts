/**
 * ChartDataSource — Interface for transforming domain statistics into
 * renderer-neutral chart data.
 *
 * Per V-4: ChartDataSource is an interface, not an abstract class.
 * Odin's standing principle: "I abhor abstract classes."
 *
 * Each domain (automobile, etc.) provides its own implementation that
 * produces RenderableChartData — a neutral shape understood by any
 * ChartRenderer.
 */

import { RenderableChartData } from './renderable-chart-data';

export interface ChartDataSource<TStatistics = any> {
  /**
   * Transform domain statistics into renderer-neutral chart data.
   * Returns null when there is no data to render.
   */
  transform(
    statistics: TStatistics | null,
    highlights: any,
    selectedValue: string | null,
    containerWidth: number,
  ): RenderableChartData | null;

  /** Human-readable title for the chart. */
  getTitle(): string;

  /**
   * Handle a renderer-specific click/selection event.
   * Returns the clicked value string, or null if the event should be ignored.
   */
  handleClick(event: any): string | null;

  /**
   * Convert a clicked value into URL parameters for navigation / filtering.
   */
  toUrlParams(value: string, isHighlightMode: boolean): Record<string, any>;
}
