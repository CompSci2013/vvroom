# 652: Year Chart Source

**Status:** Planning
**Depends On:** 403-automobile-statistics-model, 651-manufacturer-chart-source
**Blocks:** 801-base-chart-component

---

## Learning Objectives

After completing this section, you will:
- Understand how to handle time-series data in chart transformations
- Know how to implement range selection for year-based filtering
- Be able to convert multi-value selections into URL parameters

---

## Objective

Create the year chart data source that transforms vehicle statistics into a Plotly.js bar chart showing vehicle distribution over time. This chart source handles year-based data and supports both single-year clicks and range selections.

---

## Why

Time-series data presents unique visualization and interaction challenges:

1. **Chronological ordering** — Years must be sorted ascending (oldest to newest), unlike other charts that sort by count
2. **Range selection** — Users often want to filter by a range of years, not just a single year
3. **Different URL parameter format** — Year ranges require two parameters (`yearMin` and `yearMax`) instead of one

The year chart demonstrates how a single abstract interface (`ChartDataSource`) can accommodate domain-specific requirements through concrete implementations.

### Design Decision: Bar Chart for Years

While line charts are common for time series, we use a bar chart for years because:

- **Discrete values** — Vehicle model years are discrete integers, not continuous data
- **Highlight support** — Stacked bars clearly show highlighted vs. non-highlighted segments
- **Consistency** — Matches the visual style of other charts in the application

### URL-First Architecture Reference

The year chart implements range selection by returning a pipe-delimited string (`2010|2020`) from `handleClick`, which `toUrlParams` then splits into separate `yearMin` and `yearMax` parameters. This demonstrates how chart sources can produce complex URL structures from simple user interactions.

---

## What

### Step 652.1: Create the Year Chart Source File

Create the file `src/app/domain-config/automobile/chart-sources/year-chart-source.ts`:

```typescript
// src/app/domain-config/automobile/chart-sources/year-chart-source.ts

/**
 * Year Chart Data Source
 *
 * Transforms vehicle statistics into Plotly.js line chart
 * showing vehicle distribution over time.
 *
 * Domain: Automobile
 */

import { ChartDataSource, ChartData } from '../../../framework/components/base-chart/base-chart.component';
import { VehicleStatistics } from '../models/automobile.statistics';

/**
 * Year distribution chart data source
 *
 * Creates a line chart showing vehicle count by year.
 */
export class YearChartDataSource extends ChartDataSource<VehicleStatistics> {
  /**
   * Transform statistics into Plotly chart data
   */
  transform(
    statistics: VehicleStatistics | null,
    _highlights: any,
    _selectedValue: string | null,
    _containerWidth: number
  ): ChartData | null {
    if (!statistics || !statistics.byYearRange) {
      return null;
    }

    const entries = Object.entries(statistics.byYearRange);

    // Check if data has server-side segmented format ({total, highlighted})
    const isSegmented = entries.length > 0 &&
      typeof entries[0][1] === 'object' &&
      'total' in entries[0][1];

    let traces: Plotly.Data[] = [];

    if (isSegmented) {
      // Server-side segmented statistics: use backend data directly
      const sorted = entries
        .sort((a, b) => parseInt(a[0], 10) - parseInt(b[0], 10)); // Sort by year ascending

      const years = sorted.map(([year]) => year);
      const highlightedCounts = sorted.map(([, stats]: [string, any]) => stats.highlighted || 0);
      const otherCounts = sorted.map(([, stats]: [string, any]) =>
        (stats.total || 0) - (stats.highlighted || 0)
      );

      // Create stacked bar traces (Highlighted first at bottom, then Other on top)
      traces = [
        {
          type: 'bar',
          name: 'Highlighted',
          x: years,
          y: highlightedCounts,
          marker: { color: '#3B82F6' },
          hovertemplate: '<b>%{x}</b><br>Highlighted: %{y}<extra></extra>'
        },
        {
          type: 'bar',
          name: 'Other',
          x: years,
          y: otherCounts,
          marker: { color: '#9CA3AF' },
          hovertemplate: '<b>%{x}</b><br>Other: %{y}<extra></extra>'
        }
      ];
    } else {
      // No highlights: simple blue bars using simple number format
      const sorted = entries
        .map(([year, count]) => [year, typeof count === 'number' ? count : 0] as [string, number])
        .sort((a, b) => parseInt(a[0], 10) - parseInt(b[0], 10));

      const years = sorted.map(([year]) => year);
      const counts = sorted.map(([, count]) => count);

      traces = [{
        type: 'bar',
        x: years,
        y: counts,
        marker: { color: '#3B82F6' },
        hovertemplate: '<b>%{x}</b><br>Count: %{y}<br><extra></extra>'
      }];
    }

    // Create layout
    const layout: Partial<Plotly.Layout> = {
      barmode: isSegmented ? 'stack' : undefined,
      xaxis: {
        title: { text: '' },
        gridcolor: '#333333',
        type: 'category',
        color: '#FFFFFF'
      },
      yaxis: {
        title: { text: '' },
        gridcolor: '#333333',
        rangemode: 'tozero',
        automargin: true,
        color: '#FFFFFF'
      },
      margin: {
        l: 60,
        r: 40,
        t: 40,
        b: 60
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
    return 'Vehicles by Year';
  }

  /**
   * Handle chart click event
   *
   * Supports both single-click and box selection.
   * For box selection, returns year range as "min|max".
   */
  handleClick(event: any): string | null {
    if (event.points && event.points.length > 0) {
      // Extract all years from selected points
      const years: number[] = event.points.map((point: any) => parseInt(point.x, 10));

      // Remove duplicates (box selection may select both stacked bars)
      const uniqueYears: number[] = [...new Set(years)].sort((a, b) => a - b);

      if (uniqueYears.length === 1) {
        // Single year selected
        return uniqueYears[0].toString();
      } else {
        // Multiple years: return as range min|max
        const min = uniqueYears[0];
        const max = uniqueYears[uniqueYears.length - 1];
        return `${min}|${max}`;
      }
    }
    return null;
  }

  /**
   * Convert clicked value to URL parameters
   *
   * Handles both single year and year range (min|max format).
   */
  toUrlParams(value: string, isHighlightMode: boolean): Record<string, any> {
    if (value.includes('|')) {
      // Year range: split into min/max params
      const [min, max] = value.split('|');
      return isHighlightMode
        ? { h_yearMin: min, h_yearMax: max }
        : { yearMin: min, yearMax: max };
    }
    // Single year
    const paramName = isHighlightMode ? 'h_year' : 'year';
    return { [paramName]: value };
  }
}
```

---

### Step 652.2: Understanding Chronological Sorting

Unlike the manufacturer chart (which sorts by count descending), the year chart sorts chronologically:

```typescript
const sorted = entries
  .sort((a, b) => parseInt(a[0], 10) - parseInt(b[0], 10)); // Sort by year ascending
```

**Why ascending order?**

Time flows forward. Users expect to see older years on the left and newer years on the right. This matches mental models of timelines and makes trends (growth or decline over time) immediately visible.

---

### Step 652.3: Understanding Category Type for X-Axis

Notice the layout configuration for the x-axis:

```typescript
xaxis: {
  title: { text: '' },
  gridcolor: '#333333',
  type: 'category',  // Treat years as categories, not numbers
  color: '#FFFFFF'
}
```

**Why `type: 'category'`?**

Without this setting, Plotly would treat years as continuous numbers and might:
- Add decimal ticks (2015.5)
- Create gaps for missing years
- Misalign bars with labels

By specifying `type: 'category'`, each year becomes a discrete label with evenly spaced bars.

---

### Step 652.4: Understanding Range Selection

The `handleClick` method demonstrates sophisticated selection handling:

```typescript
handleClick(event: any): string | null {
  if (event.points && event.points.length > 0) {
    // Extract all years from selected points
    const years: number[] = event.points.map((point: any) => parseInt(point.x, 10));

    // Remove duplicates (box selection may select both stacked bars)
    const uniqueYears: number[] = [...new Set(years)].sort((a, b) => a - b);

    if (uniqueYears.length === 1) {
      // Single year selected
      return uniqueYears[0].toString();
    } else {
      // Multiple years: return as range min|max
      const min = uniqueYears[0];
      const max = uniqueYears[uniqueYears.length - 1];
      return `${min}|${max}`;
    }
  }
  return null;
}
```

**Single Click vs Box Selection:**

| Selection Type | Points Array | Return Value |
|---------------|--------------|--------------|
| Single click on 2020 | `[{x: '2020'}]` | `'2020'` |
| Box select 2015-2020 | `[{x: '2015'}, {x: '2016'}, ...]` | `'2015|2020'` |

**Duplicate Removal:**

When a stacked bar chart has box selection, clicking might return the same year twice (once for each trace). Using `[...new Set(years)]` ensures each year appears only once.

---

### Step 652.5: Understanding URL Parameter Conversion

The `toUrlParams` method handles both formats:

```typescript
toUrlParams(value: string, isHighlightMode: boolean): Record<string, any> {
  if (value.includes('|')) {
    // Year range: split into min/max params
    const [min, max] = value.split('|');
    return isHighlightMode
      ? { h_yearMin: min, h_yearMax: max }
      : { yearMin: min, yearMax: max };
  }
  // Single year
  const paramName = isHighlightMode ? 'h_year' : 'year';
  return { [paramName]: value };
}
```

**URL Examples:**

| User Action | Return Value | URL Parameters |
|-------------|--------------|----------------|
| Click 2020 | `'2020'` | `?year=2020` |
| Click 2020 (highlight mode) | `'2020'` | `?h_year=2020` |
| Box select 2015-2020 | `'2015|2020'` | `?yearMin=2015&yearMax=2020` |
| Box select 2015-2020 (highlight mode) | `'2015|2020'` | `?h_yearMin=2015&h_yearMax=2020` |

This demonstrates how a single abstract method can produce varied URL structures based on the interaction pattern.

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
-rw-r--r-- 1 user user  4123 Feb  9 17:05 year-chart-source.ts
```

### 3. Sorting Verification

Mentally trace through the code with sample data:

```typescript
// Input (unsorted):
byYearRange: { "2022": 50, "2020": 100, "2021": 75 }

// After sorting:
// years = ["2020", "2021", "2022"]
// counts = [100, 75, 50]
```

The chart will show 2020 on the left with 100 vehicles, progressing to 2022 on the right with 50.

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| Years appear in random order | Missing or incorrect sort | Verify `parseInt(a[0], 10) - parseInt(b[0], 10)` sorts ascending |
| Decimal year labels (2020.5) | X-axis type not set to category | Add `type: 'category'` to xaxis config |
| Range selection returns duplicates | Missing duplicate removal | Ensure `[...new Set(years)]` is present |
| `yearMin=2020&yearMax=2020` for single click | Pipe split on non-pipe string | Check for `|` before splitting |
| `Cannot find module '../models/automobile.statistics'` | VehicleStatistics not created | Complete document 403 first |

---

## Key Takeaways

1. **Time data requires chronological sorting** — Unlike counts, years have an inherent order that users expect
2. **Range selections need special handling** — Convert multi-point selections into min/max pairs
3. **URL parameters can be polymorphic** — The same method produces single or multi-parameter outputs based on input

---

## Acceptance Criteria

- [ ] File exists at `src/app/domain-config/automobile/chart-sources/year-chart-source.ts`
- [ ] Class `YearChartDataSource` extends `ChartDataSource<VehicleStatistics>`
- [ ] Years are sorted chronologically (ascending) in the chart
- [ ] X-axis uses category type for discrete year labels
- [ ] `handleClick` returns single year or `min|max` format for ranges
- [ ] `toUrlParams` handles both single year and range formats
- [ ] Highlight mode produces `h_year`, `h_yearMin`, `h_yearMax` parameters
- [ ] Code compiles without TypeScript errors (after dependencies are created)

---

## Next Step

Proceed to `653-body-class-chart-source.md` to create the body class distribution chart source.
