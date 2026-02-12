# 651: Manufacturer Chart Source

**Status:** Planning
**Depends On:** 403-automobile-statistics-model, 606-chart-configs
**Blocks:** 801-base-chart-component

---

## Learning Objectives

After completing this section, you will:
- Understand how chart data sources transform domain statistics into visualization-ready formats
- Know how to implement the abstract `ChartDataSource` class for a specific data type
- Be able to handle both simple and segmented (highlighted) statistics in chart transformations

---

## Objective

Create the manufacturer chart data source that transforms vehicle statistics into a Plotly.js vertical stacked bar chart showing vehicle count by manufacturer. This chart source handles both simple counts and segmented statistics (with highlighted vs. non-highlighted data).

---

## Why

Charts are one of the most powerful ways to communicate data insights. However, raw statistics from an API rarely match the exact format that charting libraries expect. We need a transformation layer between our domain data and our visualization library.

**The Chart Data Source Pattern:**

```
VehicleStatistics  →  ManufacturerChartDataSource  →  Plotly Chart Data
     (domain)              (transformer)                 (visualization)
```

This separation provides several benefits:

1. **Single Responsibility** — The chart component handles rendering; the data source handles transformation
2. **Testability** — Data transformations can be unit tested without rendering actual charts
3. **Reusability** — The same `BaseChartComponent` works with any data source
4. **Flexibility** — Changing the chart appearance only requires modifying the data source, not the component

### URL-First Architecture Reference

Chart sources connect to the URL-First pattern through click handling. When a user clicks a bar in the manufacturer chart, the data source converts that click into URL parameters (e.g., `manufacturer=Toyota`), which then updates the URL and triggers a new data fetch. This creates an interactive filtering experience where charts become navigation controls.

---

## What

### Step 651.1: Create the Manufacturer Chart Source File

Create the file `src/app/domain-config/automobile/chart-sources/manufacturer-chart-source.ts`:

```typescript
// src/app/domain-config/automobile/chart-sources/manufacturer-chart-source.ts

/**
 * Manufacturer Chart Data Source
 *
 * Transforms vehicle statistics into Plotly.js vertical stacked bar chart
 * showing vehicle count by manufacturer with highlighted vs other.
 *
 * Domain: Automobile
 */

import { ChartDataSource, ChartData } from '../../../framework/components/base-chart/base-chart.component';
import { VehicleStatistics } from '../models/automobile.statistics';

/**
 * Manufacturer distribution chart data source
 *
 * Creates a vertical stacked bar chart of manufacturers by vehicle count.
 * Matches the visual style from the reference application.
 */
export class ManufacturerChartDataSource extends ChartDataSource<VehicleStatistics> {
  /**
   * Transform statistics into Plotly chart data
   */
  transform(
    statistics: VehicleStatistics | null,
    highlights: any,
    _selectedValue: string | null,
    _containerWidth: number
  ): ChartData | null {
    if (!statistics || !statistics.byManufacturer) {
      return null;
    }

    const entries = Object.entries(statistics.byManufacturer);

    // Check if data has server-side segmented format ({total, highlighted})
    const isSegmented = entries.length > 0 &&
      typeof entries[0][1] === 'object' &&
      'total' in entries[0][1];

    let traces: Plotly.Data[] = [];

    if (isSegmented) {
      // Server-side segmented statistics: use backend data directly
      const sorted = entries
        .sort((a, b) => {
          const aTotal = (a[1] as any).total || 0;
          const bTotal = (b[1] as any).total || 0;
          return bTotal - aTotal;
        })
        .slice(0, 20);

      const manufacturers = sorted.map(([name]) => name);
      const highlightedCounts = sorted.map(([, stats]: [string, any]) => stats.highlighted || 0);
      const otherCounts = sorted.map(([, stats]: [string, any]) =>
        (stats.total || 0) - (stats.highlighted || 0)
      );

      // Create stacked bar traces (Highlighted first at bottom, then Other on top)
      traces = [
        {
          type: 'bar',
          name: 'Highlighted',
          x: manufacturers,
          y: highlightedCounts,
          marker: { color: '#3B82F6' }, // Blue
          hovertemplate: '<b>%{x}</b><br>Highlighted: %{y}<extra></extra>'
        },
        {
          type: 'bar',
          name: 'Other',
          x: manufacturers,
          y: otherCounts,
          marker: { color: '#9CA3AF' }, // Gray
          hovertemplate: '<b>%{x}</b><br>Other: %{y}<extra></extra>'
        }
      ];
    } else {
      // No highlights: simple blue bars using simple number format
      const sorted = entries
        .map(([name, count]) => [name, typeof count === 'number' ? count : 0] as [string, number])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);

      const manufacturers = sorted.map(([name]) => name);
      const counts = sorted.map(([, count]) => count);

      traces = [{
        type: 'bar',
        x: manufacturers,
        y: counts,
        marker: { color: '#3B82F6' },
        hovertemplate: '<b>%{x}</b><br>Count: %{y}<br><extra></extra>'
      }];
    }

    // Create layout
    const layout: Partial<Plotly.Layout> = {
      barmode: isSegmented ? 'stack' : undefined,
      xaxis: {
        tickangle: -45,
        automargin: true,
        color: '#FFFFFF',
        gridcolor: '#333333'
      },
      yaxis: {
        title: { text: '' },
        gridcolor: '#333333',
        automargin: true,
        color: '#FFFFFF'
      },
      margin: {
        l: 60,
        r: 40,
        t: 40,
        b: 120
      },
      plot_bgcolor: '#000000',
      paper_bgcolor: '#1a1a1a',
      font: { color: '#FFFFFF' },
      showlegend: isSegmented
    };

    return {
      traces: traces,
      layout: layout
    };
  }

  /**
   * Get chart title
   */
  getTitle(): string {
    return 'Vehicles by Manufacturer';
  }

  /**
   * Handle chart click event
   *
   * Supports both single-click and box selection.
   * Returns comma-separated manufacturers for OR filtering.
   * Backend API supports comma-separated values.
   */
  handleClick(event: any): string | null {
    if (event.points && event.points.length > 0) {
      // Extract all manufacturer names from selected points
      const manufacturers: string[] = event.points.map((point: any) => point.x as string);

      // Remove duplicates (box selection may select both stacked bars)
      const uniqueManufacturers: string[] = [...new Set(manufacturers)];

      // Return comma-separated list (backend supports OR logic)
      return uniqueManufacturers.join(',') || null;
    }
    return null;
  }

  /**
   * Convert clicked value to URL parameters
   */
  toUrlParams(value: string, isHighlightMode: boolean): Record<string, any> {
    const paramName = isHighlightMode ? 'h_manufacturer' : 'manufacturer';
    return { [paramName]: value };
  }
}
```

---

### Step 651.2: Understanding the Transform Method

The `transform` method is the heart of any chart data source. Let's break down its logic:

**Input Parameters:**

| Parameter | Type | Purpose |
|-----------|------|---------|
| `statistics` | `VehicleStatistics \| null` | Domain statistics from the API |
| `highlights` | `any` | Highlight filter state (for visual distinction) |
| `_selectedValue` | `string \| null` | Currently selected value (for active state) |
| `_containerWidth` | `number` | Container width for responsive sizing |

**Null Check:**

```typescript
if (!statistics || !statistics.byManufacturer) {
  return null;
}
```

If statistics are missing or the `byManufacturer` property is absent, return `null`. The chart component will handle this gracefully by showing an empty state.

**Segmentation Detection:**

```typescript
const isSegmented = entries.length > 0 &&
  typeof entries[0][1] === 'object' &&
  'total' in entries[0][1];
```

The API can return manufacturer data in two formats:

1. **Simple format:** `{ "Toyota": 234, "Honda": 187 }` — just counts
2. **Segmented format:** `{ "Toyota": { total: 234, highlighted: 45 }, ... }` — with highlight breakdown

We detect which format we have by checking if the first value is an object with a `total` property.

---

### Step 651.3: Understanding the Trace Structure

Plotly charts use "traces" — each trace is a data series. For the segmented case, we create two traces:

```typescript
traces = [
  {
    type: 'bar',
    name: 'Highlighted',
    x: manufacturers,       // Category labels on X axis
    y: highlightedCounts,   // Values on Y axis
    marker: { color: '#3B82F6' },  // Blue color
    hovertemplate: '<b>%{x}</b><br>Highlighted: %{y}<extra></extra>'
  },
  {
    type: 'bar',
    name: 'Other',
    x: manufacturers,
    y: otherCounts,
    marker: { color: '#9CA3AF' },  // Gray color
    hovertemplate: '<b>%{x}</b><br>Other: %{y}<extra></extra>'
  }
];
```

**Why Two Traces?**

When highlight filters are active, we want to show how much of each manufacturer's data matches the highlight criteria. The blue "Highlighted" bars show matching data; the gray "Other" bars show non-matching data. Stacking them shows the total while distinguishing the segments.

**The Hover Template:**

```
<b>%{x}</b><br>Highlighted: %{y}<extra></extra>
```

- `<b>%{x}</b>` — Bold manufacturer name
- `<br>` — Line break
- `Highlighted: %{y}` — Label and value
- `<extra></extra>` — Hides the trace name (which would otherwise appear)

---

### Step 651.4: Understanding URL Parameter Mapping

The `toUrlParams` method converts a clicked chart value into URL query parameters:

```typescript
toUrlParams(value: string, isHighlightMode: boolean): Record<string, any> {
  const paramName = isHighlightMode ? 'h_manufacturer' : 'manufacturer';
  return { [paramName]: value };
}
```

**Filter Mode vs Highlight Mode:**

- **Filter mode** (default): Click filters the dataset → `manufacturer=Toyota`
- **Highlight mode** (h key held): Click adds a highlight → `h_manufacturer=Toyota`

This dual-mode interaction follows the URL-First pattern: user actions translate directly to URL changes.

---

## Verification

### 1. TypeScript Compilation

```bash
$ cd ~/projects/vvroom
$ ng build
```

Expected: Build succeeds with no errors.

### 2. File Location

```bash
$ ls -la src/app/domain-config/automobile/chart-sources/
```

Expected:

```
-rw-r--r-- 1 user user  4567 Feb  9 17:00 manufacturer-chart-source.ts
```

### 3. Export Check

Once the chart configs are updated (document 606), verify the class is importable:

```typescript
import { ManufacturerChartDataSource } from './chart-sources/manufacturer-chart-source';
```

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| `Cannot find module '../../../framework/components/base-chart/base-chart.component'` | BaseChartComponent not yet created | This is expected until Phase 8 (document 801) |
| `Cannot find module '../models/automobile.statistics'` | VehicleStatistics not created | Complete document 403 first |
| `Property 'byManufacturer' does not exist on type 'VehicleStatistics'` | Missing property in statistics model | Add `byManufacturer` property to VehicleStatistics |
| TypeScript error on `Plotly.Data` | Plotly types not installed | Run `npm install --save-dev @types/plotly.js` |

---

## Key Takeaways

1. **Chart data sources are transformers** — They convert domain data into visualization-ready formats
2. **Handle both simple and segmented data** — Statistics can come in multiple formats; check dynamically
3. **URL parameters enable interactivity** — Clicks on charts become filter or highlight URL changes

---

## Acceptance Criteria

- [ ] File exists at `src/app/domain-config/automobile/chart-sources/manufacturer-chart-source.ts`
- [ ] Class `ManufacturerChartDataSource` extends `ChartDataSource<VehicleStatistics>`
- [ ] `transform` method handles both simple and segmented statistics
- [ ] `getTitle` returns `'Vehicles by Manufacturer'`
- [ ] `handleClick` extracts manufacturer names from Plotly click events
- [ ] `toUrlParams` maps values to `manufacturer` or `h_manufacturer` parameters
- [ ] Code compiles without TypeScript errors (after dependencies are created)

---

## Next Step

Proceed to `652-year-chart-source.md` to create the year distribution chart source.
