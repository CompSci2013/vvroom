/**
 * RenderableChartData — Neutral aggregate shape understood by any ChartRenderer.
 *
 * This is the contract between `ChartDataSource` (which produces data) and
 * `ChartRenderer` (which consumes it). The shape is intentionally engine-agnostic:
 * buckets carry the categorical/numeric data, and layout hints are loose key-value
 * pairs that each renderer can interpret or ignore.
 *
 * Per V-5: ChartDataSource.transform() returns `RenderableChartData | null`.
 */

/**
 * A single bucket in a chart. Represents one bar/segment/point.
 */
export interface ChartBucket {
  /** Display label (e.g., "Toyota", "2020", "SUV"). */
  label: string;

  /** Numeric value for the bucket. */
  value: number;

  /**
   * Optional sub-buckets for stacked/segmented charts.
   * Each sub-bucket represents a segment within the parent bucket.
   */
  subBuckets?: ChartSubBucket[];
}

/**
 * A segment within a stacked/segmented bucket.
 */
export interface ChartSubBucket {
  /** Segment label (e.g., "Sedan", "SUV" within a manufacturer). */
  label: string;

  /** Segment value. */
  value: number;

  /** Optional color override for this segment. */
  color?: string;
}

/**
 * Layout hints that a renderer may use to adjust its rendering.
 * Keys are renderer-specific; the chart library does not interpret them.
 */
export type LayoutHints = Record<string, any>;

/**
 * The neutral chart data shape.
 */
export interface RenderableChartData {
  /** Chart type hint (e.g., 'bar', 'pie', 'line'). Renderer may ignore. */
  chartType?: 'bar' | 'pie' | 'line' | 'area' | string;

  /** Ordered buckets for the chart. */
  buckets: ChartBucket[];

  /** Sort mode hint (e.g., 'default', 'asc', 'desc', 'alpha'). */
  sortMode?: 'default' | 'asc' | 'desc' | 'alpha' | string;

  /** Renderer-specific layout hints. */
  layout?: LayoutHints;

  /**
   * Escape valve: renderer-specific raw data that bypasses the neutral shape.
   * Use sparingly — only when a renderer needs capabilities the neutral shape
   * cannot express. The renderer implementation owns this field entirely.
   */
  rendererSpecific?: Record<string, any>;
}
