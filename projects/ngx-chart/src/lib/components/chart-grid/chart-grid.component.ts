/**
 * ChartGridComponent — CDK drag-drop grid container for charts.
 *
 * Domain-agnostic container that renders statistical charts in a
 * draggable grid layout. Each chart slot is identified by a chart ID
 * and backed by a `ChartDataSource`.
 *
 * Per V-5: Uses `<ngx-chart>` (not `<app-base-chart>`) for renderer
 * abstraction. Per V-18: Supports `[poppedOutChartIds]` Input for
 * pop-out coordination with the popout library.
 */

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ChartDataSource } from '../../interfaces/chart-data-source';

/**
 * Configuration for a single chart slot in the grid.
 */
export interface ChartSlotConfig {
  /** Unique identifier for this chart slot. */
  id: string;

  /** The data source that produces chart data. */
  dataSource: ChartDataSource;

  /** Optional override title for this slot. */
  title?: string;

  /** Whether this chart can be popped out. */
  canPopOut?: boolean;
}

@Component({
  selector: 'ngx-chart-grid',
  template: `
    <div
      cdkDropList
      #chartList="cdkDropList"
      class="ngx-chart-grid"
      [class.ngx-chart-grid--popout-disabled]="isRenderedInPopout"
      (cdkDropListDropped)="onChartDrop($event)">

      <div
        *ngFor="let slot of chartSlots; trackBy: trackBySlotId"
        cdkDrag
        class="ngx-chart-grid-item"
        [class.ngx-chart-grid-item--popped-out]="isChartPoppedOut(slot.id)">

        <!-- Chart title bar -->
        <div class="ngx-chart-grid-header">
          <span class="ngx-chart-grid-title">{{ slot.title || slot.dataSource.getTitle() }}</span>
          <button
            *ngIf="slot.canPopOut && !isRenderedInPopout"
            type="button"
            class="ngx-chart-grid-popout-btn"
            title="Pop out to separate window"
            (click)="onChartPopOut(slot.id)">
            <i class="pi pi-external-link"></i>
          </button>
        </div>

        <!-- Chart slot -->
        <div class="ngx-chart-grid-body">
          <ngx-chart
            [dataSource]="slot.dataSource"
            [statistics]="statistics"
            [highlights]="highlights"
            [selectedValue]="selectedValue"
            [canPopOut]="false"
            [autoFillContainer]="true"
            (chartClick)="onChartClick($event, slot.id)"
            (requestZoomIn)="onRequestZoomIn(slot.id)">
          </ngx-chart>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .ngx-chart-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 16px;
      padding: 8px;
    }

    .ngx-chart-grid-item {
      position: relative;
      background: #1e1e1e;
      border-radius: 8px;
      overflow: hidden;
      min-height: 280px;
      display: flex;
      flex-direction: column;
    }

    cdk-drag-preview {
      box-sizing: border-box;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }

    cdk-drag-placeholder {
      opacity: 0.3;
    }

    .ngx-chart-grid-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: #2a2a2a;
      border-bottom: 1px solid #333;
      user-select: none;
      cursor: grab;
    }

    cdk-drag-disabled .ngx-chart-grid-header {
      cursor: default;
    }

    .ngx-chart-grid-title {
      font-size: 13px;
      font-weight: 600;
      color: #ccc;
    }

    .ngx-chart-grid-popout-btn {
      background: none;
      border: none;
      color: #888;
      cursor: pointer;
      padding: 4px;
      font-size: 14px;
      line-height: 1;
      transition: color 0.15s;
    }

    .ngx-chart-grid-popout-btn:hover {
      color: #fff;
    }

    .ngx-chart-grid-body {
      flex: 1;
      min-height: 200px;
      position: relative;
    }

    .ngx-chart-grid-item--popped-out {
      opacity: 0.5;
      pointer-events: none;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartGridComponent implements OnInit, OnDestroy {

  private readonly destroy$ = new Subject<void>();

  // ── Configuration ───────────────────────────────────────────────────────

  /**
   * Map of chart ID → ChartDataSource.
   * Keys define the initial slot order.
   */
  @Input() chartDataSources: Record<string, ChartDataSource> = {};

  /** Domain statistics passed to all chart data sources. */
  @Input() statistics: any | null = null;

  /** Highlight state passed to all chart data sources. */
  @Input() highlights: any = {};

  /** Currently selected value passed to all chart data sources. */
  @Input() selectedValue: string | null = null;

  /**
   * Set of chart IDs that are currently popped out.
   * Used to disable drag and pop-out for those slots.
   * Per V-18.
   */
  @Input() poppedOutChartIds: Set<string> = new Set();

  /**
   * When true, disables child chart pop-outs (set by portal host
   * when rendered inside a popout).
   */
  @Input() isRenderedInPopout = false;

  // ── Outputs ─────────────────────────────────────────────────────────────

  /** Fired when a chart is requested to pop out. Emits the chart ID. */
  @Output() chartPopOut = new EventEmitter<string>();

  /** Fired when a chart is clicked. */
  @Output() chartClicked = new EventEmitter<{
    event: { value: string; isHighlightMode: boolean };
    chartId: string;
  }>();

  /** Fired when zoom-in is requested. Per V-22. */
  @Output() requestZoomIn = new EventEmitter<string>();

  // ── Derived state ───────────────────────────────────────────────────────

  /** Ordered list of chart slot configurations. */
  chartSlots: ChartSlotConfig[] = [];

  constructor(private cdr: ChangeDetectorRef) {}

  // ── Lifecycle ───────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.rebuildSlots();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Slot management ─────────────────────────────────────────────────────

  /** Rebuild the chart slots list from the data source map. */
  private rebuildSlots(): void {
    this.chartSlots = Object.entries(this.chartDataSources).map(
      ([id, dataSource]) => ({
        id,
        dataSource,
        title: undefined,
        canPopOut: true,
      }),
    );
    this.cdr.markForCheck();
  }

  /** Check if a chart slot is currently popped out. */
  isChartPoppedOut(chartId: string): boolean {
    return this.poppedOutChartIds.has(chartId);
  }

  // ── Drag-drop ───────────────────────────────────────────────────────────

  /**
   * Handle chart drag-drop to reorder slots.
   * The new order is reflected in the chartDataSources map.
   */
  onChartDrop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.chartSlots, event.previousIndex, event.currentIndex);

    // Rebuild the map in the new order
    const newMap: Record<string, ChartDataSource> = {};
    for (const slot of this.chartSlots) {
      newMap[slot.id] = slot.dataSource;
    }
    this.chartDataSources = newMap;
    this.cdr.markForCheck();
  }

  // ── Event handlers ──────────────────────────────────────────────────────

  onChartPopOut(chartId: string): void {
    this.chartPopOut.emit(chartId);
  }

  onChartClick(event: { value: string; isHighlightMode: boolean }, chartId: string): void {
    this.chartClicked.emit({ event, chartId });
  }

  onRequestZoomIn(chartId: string): void {
    this.requestZoomIn.emit(chartId);
  }

  // ── TrackBy ─────────────────────────────────────────────────────────────

  trackBySlotId(index: number, slot: ChartSlotConfig): string {
    return slot.id;
  }
}
