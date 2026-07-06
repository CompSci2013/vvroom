# @halolabs/ngx-chart

Renderer-agnostic chart library for Angular.

## Architecture

This library implements the **ChartRenderer abstraction** (per workshop-3 V-5):

```
┌─────────────────────────────────────────────────┐
│  Consumer App (DiscoverComponent, etc.)         │
│  ┌───────────────────────────────────────────┐  │
│  │  <ngx-chart-grid [chartDataSources]="...">│  │
│  │    ┌───────────────────────────────────┐  │  │
│  │    │  <ngx-chart [dataSource]="...">   │  │  │
│  │    │    ┌─────────────────────────┐    │  │  │
│  │    │    │  ChartRenderer (DI)     │    │  │  │
│  │    │    │  ┌───────────────────┐  │    │  │  │
│  │    │    │  │ PlotlyChartRender │  │    │  │  │
│  │    │    │  │ or EChartsRender  │  │    │  │  │
│  │    │    │  └───────────────────┘  │    │  │  │
│  │    │    └─────────────────────────┘    │  │  │
│  │    └───────────────────────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Key concepts

- **`ChartDataSource<T>`** (interface) — Transforms domain statistics into `RenderableChartData`. Each domain (automobile, etc.) provides its own implementation.

- **`RenderableChartData`** (neutral shape) — A renderer-agnostic aggregate of `ChartBucket[]` with layout hints. The contract between data sources and renderers.

- **`ChartRenderer`** (interface) — Renders `RenderableChartData` into a native charting engine. Resolved via the `CHART_RENDERER` DI token.

- **`<ngx-chart>`** — The dumb, renderer-agnostic component. Injects `CHART_RENDERER`, owns lifecycle (resize, error boundary, pop-out), delegates rendering.

- **`<ngx-chart-grid>`** — CDK drag-drop grid container for multiple charts. Handles reordering, pop-out coordination, and slot management.

## Installation

```bash
npm install @halolabs/ngx-chart
```

## Usage

### 1. Provide a renderer

```typescript
// In your app or feature module
import { NgxChartModule } from '@halolabs/ngx-chart';
import { PlotlyChartRenderer, CHART_RENDERER } from '@halolabs/ngx-plotly';

@NgModule({
  imports: [NgxChartModule],
  providers: [
    { provide: CHART_RENDERER, useClass: PlotlyChartRenderer },
  ],
})
export class DiscoverModule { }
```

### 2. Create a ChartDataSource

```typescript
@Injectable({ providedIn: 'root' })
export class ManufacturerChartDataSource implements ChartDataSource<VehicleStatistics> {
  transform(
    statistics: VehicleStatistics | null,
    highlights: any,
    selectedValue: string | null,
    containerWidth: number,
  ): RenderableChartData | null {
    if (!statistics?.byManufacturer) return null;

    const buckets: ChartBucket[] = Object.entries(statistics.byManufacturer)
      .map(([label, value]) => ({ label, value: value as number }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return {
      chartType: 'bar',
      buckets,
      sortMode: 'desc',
      layout: {
        xaxis: { title: 'Manufacturer' },
        yaxis: { title: 'Count' },
      },
    };
  }

  getTitle(): string { return 'By Manufacturer'; }

  handleClick(event: any): string | null {
    return event?.points?.[0]?.data?.name ?? null;
  }

  toUrlParams(value: string, isHighlightMode: boolean): Record<string, any> {
    return isHighlightMode
      ? { highlight_manufacturer: value }
      : { filter_manufacturer: value };
  }
}
```

### 3. Use in a template

```html
<ngx-chart-grid
  [chartDataSources]="chartDataSources"
  [statistics]="statistics"
  [highlights]="highlights"
  [selectedValue]="selectedValue"
  (chartPopOut)="onChartPopOut($event)"
  (chartClicked)="onChartClick($event)">
</ngx-chart-grid>
```

### 4. Standalone chart

```html
<ngx-chart
  [dataSource]="manufacturerDataSource"
  [statistics]="statistics"
  [highlights]="highlights"
  (chartClick)="onChartClick($event)">
</ngx-chart>
```

## API Reference

### Inputs

| Input | Type | Description |
|-------|------|-------------|
| `dataSource` | `ChartDataSource` | Data source producing chart data |
| `statistics` | `any \| null` | Domain statistics |
| `highlights` | `any` | Highlight state |
| `selectedValue` | `string \| null` | Currently selected value |
| `hideTitle` | `boolean` | Hide chart title |
| `canPopOut` | `boolean` | Show pop-out control |
| `autoFillContainer` | `boolean` | Fill container (for popouts, V-27) |
| `poppedOutChartIds` | `Set<string>` | IDs of popped-out charts (grid only) |
| `isRenderedInPopout` | `boolean` | Disable child pop-outs |

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `chartClick` | `{ value, isHighlightMode }` | Chart element clicked |
| `popOutClick` | `void` | Pop-out button clicked |
| `requestZoomIn` | `void` | Zoom-in requested (touch, V-22) |
| `chartPopOut` | `string` | Chart ID requested to pop out (grid) |
| `chartClicked` | `{ event, chartId }` | Chart clicked (grid) |
| `requestZoomIn` | `string` | Chart ID zoom requested (grid) |

## Invariants

- **L-chart-1**: `<ngx-chart>` never references engine-specific elements (`<plotly-plot>`, `<echarts>`, etc.) in its template.
- **L-chart-2**: `ChartDataSource` is an interface, never an abstract class.
- **L-chart-3**: `ChartRenderer` implementations are provided via DI; the library never instantiates them directly.
- **L-chart-4**: `RenderableChartData` is the sole data shape between data sources and renderers.
- **L-chart-5**: `ChartGridComponent` uses CDK drag-drop for reordering.
- **L-chart-6**: `autoFillContainer` enables ResizeObserver-driven resize for popout contexts.
- **L-chart-7**: Highlight mode is triggered by holding `H` key (document-level keyboard listener).
- **L-chart-8**: Error boundary shows fallback UI with retry button on render failure.
- **L-chart-9**: `poppedOutChartIds` disables drag and pop-out for already-popped charts.
- **L-chart-10**: `isRenderedInPopout` disables all child chart pop-outs.
- **L-chart-11**: `(requestZoomIn)` output supports touch contexts (V-22).
- **L-chart-12**: `rendererSpecific` escape valve on `RenderableChartData` allows renderer-specific data when the neutral shape is insufficient.

## Future

- **E-Charts renderer**: Swap `PlotlyChartRenderer` for `EChartsChartRenderer` by changing the `CHART_RENDERER` provider.
- **More chart types**: Extend `RenderableChartData` with additional layout hints as needed.
- **Schematics**: Add `ng generate chart-data-source` and `ng generate chart-renderer` schematics.
