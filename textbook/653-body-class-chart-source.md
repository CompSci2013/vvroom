# 653: Body Class Chart Source

**Status:** Planning
**Depends On:** 403-automobile-statistics-model, 652-year-chart-source
**Blocks:** 801-base-chart-component

---

## Learning Objectives

After completing this section, you will:
- Understand how to maintain unused code for future flexibility (color mappings)
- Know how to implement multi-value selection for categorical data
- Recognize patterns that repeat across chart sources and opportunities for refactoring

---

## Objective

Create the body class chart data source that transforms vehicle statistics into a Plotly.js bar chart showing distribution by body class (Sedan, SUV, Truck, etc.). This chart source handles categorical data and supports comma-separated multi-selection.

---

## Why

Body class represents a categorical dimension of vehicle data. Unlike manufacturers (which can number in the dozens) or years (which span decades), body classes form a small, fixed set of categories. This affects our design choices:

1. **Color scheme preparation** — Although we currently use uniform blue bars, we define a color mapping for potential future use (e.g., distinct colors per body class)
2. **Full display** — We show all body classes rather than limiting to "top 20" since the set is naturally small
3. **Descending count sort** — Like manufacturers, we sort by count (most common body classes first)

### Design Decision: Bar Chart Over Pie Chart

The original file comment mentions "pie chart," but the implementation uses a bar chart. Why?

- **Comparison accuracy** — Humans judge bar heights more accurately than pie slice angles
- **Highlight support** — Stacked bars work better than segmented pie slices for showing highlighted vs. non-highlighted data
- **Consistency** — Matches the visual style of manufacturer and year charts

### URL-First Architecture Reference

Body class filtering uses comma-separated values for OR logic: `bodyClass=Sedan,SUV` matches vehicles that are either Sedans OR SUVs. This supports intuitive multi-selection where clicking multiple bars expands rather than narrows the result set.

---

## What

### Step 653.1: Create the Body Class Chart Source File

Create the file `src/app/domain-config/automobile/chart-sources/body-class-chart-source.ts`:

```typescript
// src/app/domain-config/automobile/chart-sources/body-class-chart-source.ts

/**
 * Body Class Chart Data Source
 *
 * Transforms vehicle statistics into Plotly.js pie chart
 * showing distribution by body class.
 *
 * Domain: Automobile
 */

import { ChartDataSource, ChartData } from '../../../framework/components/base-chart/base-chart.component';
import { VehicleStatistics } from '../models/automobile.statistics';

/**
 * Body class distribution chart data source
 *
 * Creates a pie chart showing vehicle distribution by body class.
 */
export class BodyClassChartDataSource extends ChartDataSource<VehicleStatistics> {
  /**
   * Color scheme for body classes
   */
  private readonly BODY_CLASS_COLORS: Record<string, string> = {
    'Sedan': '#3B82F6',
    'SUV': '#10B981',
    'Truck': '#F59E0B',
    'Pickup': '#F59E0B',
    'Coupe': '#EF4444',
    'Wagon': '#8B5CF6',
    'Van': '#EC4899',
    'Minivan': '#06B6D4',
    'Convertible': '#84CC16',
    'Hatchback': '#F97316'
  };

  /**
   * Transform statistics into Plotly chart data
   */
  transform(
    statistics: VehicleStatistics | null,
    _highlights: any,
    _selectedValue: string | null,
    _containerWidth: number
  ): ChartData | null {
    if (!statistics || !statistics.byBodyClass) {
      return null;
    }

    const entries = Object.entries(statistics.byBodyClass);

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
        });

      const labels = sorted.map(([name]) => name);
      const highlightedCounts = sorted.map(([, stats]: [string, any]) => stats.highlighted || 0);
      const otherCounts = sorted.map(([, stats]: [string, any]) =>
        (stats.total || 0) - (stats.highlighted || 0)
      );

      // Create stacked bar traces (Highlighted first at bottom, then Other on top)
      traces = [
        {
          type: 'bar',
          name: 'Highlighted',
          x: labels,
          y: highlightedCounts,
          marker: { color: '#3B82F6' },
          hovertemplate: '<b>%{x}</b><br>Highlighted: %{y}<extra></extra>'
        },
        {
          type: 'bar',
          name: 'Other',
          x: labels,
          y: otherCounts,
          marker: { color: '#9CA3AF' },
          hovertemplate: '<b>%{x}</b><br>Other: %{y}<extra></extra>'
        }
      ];
    } else {
      // No highlights: simple blue bars using simple number format
      const sorted = entries
        .map(([name, count]) => [name, typeof count === 'number' ? count : 0] as [string, number])
        .sort((a, b) => b[1] - a[1]);

      const labels = sorted.map(([name]) => name);
      const counts = sorted.map(([, count]) => count);

      traces = [{
        type: 'bar',
        x: labels,
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
        b: 100
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
    return 'Vehicles by Body Class';
  }

  /**
   * Handle chart click event
   *
   * Supports both single-click and box selection.
   * Returns comma-separated body classes for OR filtering.
   * Backend API v1.0.1+ supports comma-separated values.
   */
  handleClick(event: any): string | null {
    if (event.points && event.points.length > 0) {
      // Extract all body class names from selected points
      const bodyClasses: string[] = event.points.map((point: any) => point.x as string);

      // Remove duplicates (box selection may select both stacked bars)
      const uniqueBodyClasses: string[] = [...new Set(bodyClasses)];

      // Return comma-separated list (backend supports OR logic as of v1.0.1)
      return uniqueBodyClasses.join(',') || null;
    }
    return null;
  }

  /**
   * Convert clicked value to URL parameters
   */
  toUrlParams(value: string, isHighlightMode: boolean): Record<string, any> {
    const paramName = isHighlightMode ? 'h_bodyClass' : 'bodyClass';
    return { [paramName]: value };
  }
}
```

---

### Step 653.2: Understanding the Color Scheme

Notice the unused `BODY_CLASS_COLORS` property:

```typescript
private readonly BODY_CLASS_COLORS: Record<string, string> = {
  'Sedan': '#3B82F6',
  'SUV': '#10B981',
  'Truck': '#F59E0B',
  'Pickup': '#F59E0B',
  'Coupe': '#EF4444',
  'Wagon': '#8B5CF6',
  'Van': '#EC4899',
  'Minivan': '#06B6D4',
  'Convertible': '#84CC16',
  'Hatchback': '#F97316'
};
```

**Why include unused code?**

This is a deliberate design choice. The color mapping:

1. **Documents intent** — Shows that distinct colors per body class were considered
2. **Enables future enhancement** — Can be activated without research into appropriate colors
3. **Provides consistency** — Truck and Pickup share the same orange (#F59E0B), indicating semantic similarity

Currently, the code uses uniform blue bars for consistency with other charts. The color scheme remains available for future features like:
- Color-coded bars when highlights are not active
- Legend entries matching body class colors
- Tooltips with color indicators

---

### Step 653.3: Comparing Chart Sources

By now, you may notice similarities between chart sources. Let's compare:

| Aspect | Manufacturer | Year | Body Class |
|--------|-------------|------|------------|
| Data property | `byManufacturer` | `byYearRange` | `byBodyClass` |
| Sort order | Count descending | Year ascending | Count descending |
| Limit | Top 20 | All | All |
| X-axis labels | Angled (-45) | Normal | Angled (-45) |
| Bottom margin | 120px | 60px | 100px |
| URL parameter | `manufacturer` | `year`/`yearMin`/`yearMax` | `bodyClass` |

**Patterns to Notice:**

1. **Same structure** — All three follow the same `transform` → `getTitle` → `handleClick` → `toUrlParams` pattern
2. **Same segmentation logic** — The `isSegmented` check is identical
3. **Same trace structure** — Blue for highlighted, gray for other

**Why not abstract further?**

You might be tempted to create a generic chart source factory. Resist this urge initially:

- **Explicit is better than implicit** — Each file is self-contained and understandable
- **Customization is easy** — Modifying one chart doesn't risk breaking others
- **Patterns emerge naturally** — After building several, refactoring opportunities become clear

The fourth chart source (Top Models) will show a more complex case that would break a simple abstraction.

---

### Step 653.4: Understanding Bottom Margin Differences

Notice the different bottom margins:

```typescript
// Manufacturer chart
margin: { l: 60, r: 40, t: 40, b: 120 }

// Year chart
margin: { l: 60, r: 40, t: 40, b: 60 }

// Body class chart
margin: { l: 60, r: 40, t: 40, b: 100 }
```

**Why the differences?**

- **Manufacturer (120px)** — Long names like "Mercedes-Benz" need more space when angled
- **Year (60px)** — 4-digit years are short; no angling needed
- **Body Class (100px)** — Medium-length names like "Convertible" need moderate space

These seemingly minor details significantly affect chart readability. When labels overlap or get cut off, users lose information.

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
-rw-r--r-- 1 user user  4234 Feb  9 17:10 body-class-chart-source.ts
```

### 3. Color Scheme Verification

Verify the color scheme covers expected body classes:

```bash
$ grep -c "'" src/app/domain-config/automobile/chart-sources/body-class-chart-source.ts
```

Expected: Multiple single quotes indicating the color mapping entries.

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| Labels cut off at bottom | Margin too small | Increase `b` (bottom) margin value |
| "Pickup" and "Truck" have same color | Intentional design | These are semantically similar categories |
| Color scheme not applied | Code uses uniform blue | The color scheme is for future use; current implementation uses blue |
| Multi-selection returns duplicates | Missing `Set` deduplication | Ensure `[...new Set(bodyClasses)]` is present |
| `Cannot find module '../models/automobile.statistics'` | VehicleStatistics not created | Complete document 403 first |

---

## Key Takeaways

1. **Unused code can be intentional** — Color schemes document design decisions for future enhancement
2. **Small sets need different treatment** — No "top 20" limit needed for naturally small categories
3. **Margins matter for readability** — Adjust bottom margins based on label length and angle

---

## Acceptance Criteria

- [ ] File exists at `src/app/domain-config/automobile/chart-sources/body-class-chart-source.ts`
- [ ] Class `BodyClassChartDataSource` extends `ChartDataSource<VehicleStatistics>`
- [ ] Color scheme defined for common body classes (even if not currently used)
- [ ] Body classes sorted by count descending
- [ ] `handleClick` returns comma-separated body class names
- [ ] `toUrlParams` maps values to `bodyClass` or `h_bodyClass` parameters
- [ ] Code compiles without TypeScript errors (after dependencies are created)

---

## Next Step

Proceed to `654-top-models-chart-source.md` to create the top models chart source, which demonstrates more complex data transformation.
