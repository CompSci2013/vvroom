/**
 * ChartComponent — Renderer-agnostic chart component.
 *
 * Injects a `ChartRenderer` via the `CHART_RENDERER` DI token and delegates
 * all rendering to it. The component owns the lifecycle: data transformation
 * (via `ChartDataSource`), resize handling, error boundaries, and pop-out
 * controls.
 *
 * Per V-5: No `<plotly-plot>` or other engine-specific elements in templates.
 * Per V-27: `[autoFillContainer]` Input for popout contexts.
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  HostListener,
  Inject,
  SimpleChanges,
  NgZone,
} from '@angular/core';

import { ChartDataSource } from '../interfaces/chart-data-source';
import { ChartRenderer, CHART_RENDERER } from '../interfaces/chart-renderer';
import { RenderableChartData } from '../interfaces/renderable-chart-data';

@Component({
  selector: 'ngx-chart',
  template: `
    <div
      #chartWrapper
      class="ngx-chart-wrapper"
      [class.ngx-chart--filled]="autoFillContainer"
      [class.ngx-chart--error]="hasError">

      <!-- Error boundary fallback -->
      <ng-container *ngIf="hasError">
        <div class="ngx-chart-error">
          <div class="error-content">
            <i class="pi pi-exclamation-triangle"></i>
            <p class="error-title">Chart failed to render</p>
            <p class="error-message">{{ errorMessage }}</p>
            <button
              type="button"
              class="p-button-outlined p-button-sm"
              (click)="retryRender()">
              Retry
            </button>
          </div>
        </div>
      </ng-container>

      <!-- Rendered chart (hidden when error or no data) -->
      <div
        *ngIf="renderableData && !hasError"
        class="ngx-chart-container"
        #chartElement>
      </div>

      <!-- No data message -->
      <ng-container *ngIf="!renderableData && !hasError">
        <div class="ngx-chart-no-data">
          <p>No data available</p>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 200px;
    }

    .ngx-chart-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 200px;
    }

    .ngx-chart--filled {
      height: 100%;
      min-height: 0;
    }

    .ngx-chart-container {
      width: 100%;
      height: 100%;
    }

    .ngx-chart-error,
    .ngx-chart-no-data {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      min-height: 200px;
      color: #999;
      font-size: 14px;
    }

    .ngx-chart-error {
      color: #e74c3c;
    }

    .error-content {
      text-align: center;
    }

    .error-title {
      margin: 8px 0 4px;
      font-weight: 600;
    }

    .error-message {
      margin: 0 0 12px;
      font-size: 12px;
      color: #999;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartComponent implements OnInit, OnChanges, OnDestroy {

  /** The data source that produces `RenderableChartData`. */
  @Input() dataSource!: ChartDataSource;

  /** Domain statistics passed to the data source. */
  @Input() statistics: any | null = null;

  /** Highlight state passed to the data source. */
  @Input() highlights: any = {};

  /** Currently selected value (e.g., from URL). */
  @Input() selectedValue: string | null = null;

  /** Whether to hide the chart title. */
  @Input() hideTitle = false;

  /** Whether pop-out controls should be shown. */
  @Input() canPopOut = false;

  /**
   * When true, the chart fills its container (for popout contexts).
   * Triggers ResizeObserver-driven renderer resize.
   * Per V-27.
   */
  @Input() autoFillContainer = false;

  /** Fired when a chart element is clicked/selected. */
  @Output() chartClick = new EventEmitter<{
    value: string;
    isHighlightMode: boolean;
  }>();

  /** Fired when the pop-out button is clicked. */
  @Output() popOutClick = new EventEmitter<void>();

  /** Fired when zoom-in is requested (touch contexts). Per V-22. */
  @Output() requestZoomIn = new EventEmitter<void>();

  @ViewChild('chartWrapper', { read: ElementRef, static: false })
  chartWrapper!: ElementRef<HTMLDivElement>;

  @ViewChild('chartElement', { read: ElementRef, static: false })
  chartElement!: ElementRef<HTMLDivElement>;

  /** The current renderable data (null = no data to render). */
  renderableData: RenderableChartData | null = null;

  /** Whether the chart is in highlight mode (H key held). */
  isHighlightModeActive = false;

  /** Whether an error has occurred. */
  hasError = false;

  /** Error message for the fallback UI. */
  errorMessage = '';

  private resizeObserver: ResizeObserver | null = null;
  private chartRenderer: ChartRenderer | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    @Inject(CHART_RENDERER) chartRenderer?: ChartRenderer,
  ) {
    this.chartRenderer = chartRenderer ?? null;
  }

  ngOnInit(): void {
    if (!this.chartRenderer) {
      console.warn('[ngx-chart] No ChartRenderer provided. ' +
        'Inject a ChartRenderer implementation via the CHART_RENDERER token.');
    }

    if (!this.dataSource) {
      console.error('[ngx-chart] dataSource is required');
    }

    this.updateChart();
    this.setupResizeObserver();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Only re-render when relevant inputs change
    if (
      changes['statistics'] ||
      changes['highlights'] ||
      changes['selectedValue'] ||
      changes['dataSource']
    ) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    this.teardownRenderer();
    this.teardownResizeObserver();
  }

  // ── Keyboard: highlight mode (H key) ────────────────────────────────────

  @HostListener('document:keydown.h')
  onHighlightKeyDown(): void {
    this.isHighlightModeActive = true;
    this.cdr.markForCheck();
  }

  @HostListener('document:keyup.h')
  onHighlightKeyUp(): void {
    this.isHighlightModeActive = false;
    this.cdr.markForCheck();
  }

  // ── Resize handling (V-27) ──────────────────────────────────────────────

  private setupResizeObserver(): void {
    if (!this.chartWrapper || !this.chartRenderer) return;

    this.ngZone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(() => {
        // Re-render outside Angular zone to avoid triggering change detection
        // on every resize frame.
        this.ngZone.run(() => this.updateChart());
      });
      this.resizeObserver.observe(this.chartWrapper.nativeElement);
    });
  }

  private teardownResizeObserver(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  // ── Chart update ────────────────────────────────────────────────────────

  private updateChart(): void {
    if (!this.dataSource) {
      return;
    }

    try {
      this.hasError = false;
      this.errorMessage = '';

      const containerWidth =
        this.chartWrapper?.nativeElement?.clientWidth || 800;

      this.renderableData = this.dataSource.transform(
        this.statistics,
        this.highlights,
        this.selectedValue,
        containerWidth,
      );

      if (!this.renderableData) {
        this.teardownRenderer();
        this.cdr.markForCheck();
        return;
      }

      this.renderToChartElement();
      this.cdr.markForCheck();
    } catch (err) {
      this.handleRenderError(err as Error, 'Chart rendering failed');
    }
  }

  private renderToChartElement(): void {
    if (!this.chartElement || !this.chartRenderer) return;

    this.chartRenderer.render(this.chartElement.nativeElement, this.renderableData!);
  }

  private teardownRenderer(): void {
    if (this.chartElement && this.chartRenderer) {
      this.chartRenderer.destroy(this.chartElement.nativeElement);
    }
  }

  // ── Click handling ──────────────────────────────────────────────────────

  /**
   * Delegate click handling to the data source.
   * Called by the renderer implementation (e.g., PlotlyOutletComponent).
   */
  onChartClick(event: any): void {
    try {
      const clickedValue = this.dataSource?.handleClick(event);
      if (clickedValue) {
        this.chartClick.emit({
          value: clickedValue,
          isHighlightMode: this.isHighlightModeActive,
        });
      }
    } catch (err) {
      console.error('[ngx-chart] Click handler error:', err);
    }
  }

  // ── Error handling ──────────────────────────────────────────────────────

  onRenderError(err: Error): void {
    this.handleRenderError(err, 'Chart rendering failed');
  }

  retryRender(): void {
    this.hasError = false;
    this.errorMessage = '';
    this.cdr.markForCheck();
    setTimeout(() => this.updateChart(), 0);
  }

  private handleRenderError(err: Error, context: string): void {
    console.error(`[ngx-chart] ${context}:`, err);
    this.hasError = true;
    this.errorMessage = `${context}: ${err.message || 'Unknown error'}`;
    this.cdr.markForCheck();
  }
}
