/**
 * Base Chart Component
 *
 * Generic Plotly.js chart container with data source pattern.
 * Uses ngx-plotly-wrapper for Plotly lifecycle management.
 * Domain-agnostic — renders charts based on ChartDataSource transformations.
 *
 * Framework Component
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  HostListener
} from '@angular/core';

/**
 * Chart data structure for Plotly.js
 */
export interface ChartData {
  traces: any[];
  layout: Partial<any>;
  clickData?: any;
}

/**
 * Abstract chart data source
 *
 * Transforms domain statistics into Plotly-ready chart data.
 * Implemented by domain-specific chart sources.
 */
export abstract class ChartDataSource<TStatistics = any> {
  abstract transform(
    statistics: TStatistics | null,
    highlights: any,
    selectedValue: string | null,
    containerWidth: number
  ): ChartData | null;

  abstract getTitle(): string;
  abstract handleClick(event: any): string | null;
  abstract toUrlParams(value: string, isHighlightMode: boolean): Record<string, any>;
}

@Component({
    selector: 'app-base-chart',
    templateUrl: './base-chart.component.html',
    styleUrls: ['./base-chart.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BaseChartComponent implements OnInit, OnChanges {
  @ViewChild('chartWrapper', { static: false })
  chartWrapper!: ElementRef<HTMLDivElement>;

  @Input() dataSource!: ChartDataSource;
  @Input() statistics: any | null = null;
  @Input() highlights: any = {};
  @Input() selectedValue: string | null = null;
  @Input() hideTitle = false;
  @Input() canPopOut = false;

  @Output() chartClick = new EventEmitter<{
    value: string;
    isHighlightMode: boolean;
  }>();

  @Output() popOutClick = new EventEmitter<void>();

  /** Plotly data bound to <plotly-plot> */
  plotData: any[] = [];
  plotLayout: any = {};
  plotConfig: any = {};
  plotRevision = 0;

  isHighlightModeActive = false;
  chartTitle = '';
  hasError = false;
  errorMessage = '';

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (!this.dataSource) {
      console.error('BaseChartComponent: dataSource is required');
    }
    this.chartTitle = this.dataSource?.getTitle() || 'Chart';
    this.buildConfig();
    this.updateChart();
  }

  ngOnChanges(): void {
    this.updateChart();
  }

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

  onPlotlyClick(event: any): void {
    try {
      const clickedValue = this.dataSource.handleClick(event);
      if (clickedValue) {
        this.chartClick.emit({
          value: clickedValue,
          isHighlightMode: this.isHighlightModeActive
        });
      }
    } catch (err) {
      console.error('[BaseChart] Click handler error:', err);
    }
  }

  onPlotlySelected(event: any): void {
    try {
      const selectedValue = this.dataSource.handleClick(event);
      if (selectedValue) {
        this.chartClick.emit({
          value: selectedValue,
          isHighlightMode: this.isHighlightModeActive
        });
      }
    } catch (err) {
      console.error('[BaseChart] Selection handler error:', err);
    }
  }

  onPlotlyError(err: Error): void {
    this.handleRenderError(err, 'Chart rendering failed');
  }

  retryRender(): void {
    this.hasError = false;
    this.errorMessage = '';
    this.cdr.markForCheck();
    setTimeout(() => this.updateChart(), 0);
  }

  private buildConfig(): void {
    this.plotConfig = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      scrollZoom: false,
      modeBarButtonsToRemove: ['sendDataToCloud', 'lasso2d'],
      modeBarButtonsToAdd: this.canPopOut ? [{
        name: 'popout',
        title: 'Pop out to separate window',
        icon: {
          width: 1024,
          height: 1024,
          path: 'M896 0H640c-35.3 0-64 28.7-64 64s28.7 64 64 64h146.7L544 370.7c-25 25-25 65.5 0 90.5s65.5 25 90.5 0L877.3 218.3V384c0 35.3 28.7 64 64 64s64-28.7 64-64V128c0-70.7-57.3-128-128-128zM128 128c-70.7 0-128 57.3-128 128v640c0 70.7 57.3 128 128 128h640c70.7 0 128-57.3 128-128V640c0-35.3-28.7-64-64-64s-64 28.7-64 64v256H128V256h256c35.3 0 64-28.7 64-64s-28.7-64-64-64H128z',
          transform: 'matrix(1 0 0 -1 0 1024)'
        },
        click: () => this.popOutClick.emit()
      }] : []
    };
  }

  private updateChart(): void {
    if (!this.dataSource) {
      return;
    }

    try {
      this.hasError = false;
      this.errorMessage = '';

      const containerWidth = this.chartWrapper?.nativeElement?.clientWidth || 800;

      const chartData = this.dataSource.transform(
        this.statistics,
        this.highlights,
        this.selectedValue,
        containerWidth
      );

      if (!chartData) {
        this.plotData = [];
        this.plotLayout = {};
        this.cdr.markForCheck();
        return;
      }

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

      this.plotData = chartData.traces;
      this.plotLayout = layout;
      this.plotRevision++;
      this.cdr.markForCheck();
    } catch (err) {
      this.handleRenderError(err as Error, 'Chart rendering failed');
    }
  }

  private handleRenderError(err: Error, context: string): void {
    console.error(`[BaseChart] ${context}:`, err);
    this.hasError = true;
    this.errorMessage = `${context}: ${err.message || 'Unknown error'}`;
    this.cdr.markForCheck();
  }
}
