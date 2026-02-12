# 654: Top Models Chart Source

**Status:** Planning
**Depends On:** 403-automobile-statistics-model, 653-body-class-chart-source
**Blocks:** 801-base-chart-component

---

## Learning Objectives

After completing this section, you will:
- Understand how to transform nested data structures for visualization
- Know how to implement composite URL parameters from chart clicks
- Be able to handle data from multiple API response formats

---

## Objective

Create the top models chart data source that transforms vehicle statistics into a Plotly.js bar chart showing the top models by VIN instance count. This chart source handles nested data structures (`modelsByManufacturer`) and produces composite URL parameters (`manufacturer:model` format).

---

## Why

The top models chart presents unique challenges that the previous chart sources did not:

1. **Nested data structure** — Models are nested within manufacturers in the API response
2. **Composite labels** — Each bar shows "Manufacturer Model" (e.g., "Toyota Camry")
3. **Composite URL parameters** — Clicking produces `modelCombos=Toyota:Camry`, not separate parameters
4. **Two data sources** — Can use either `topModels` array or `modelsByManufacturer` object

This complexity demonstrates why we keep chart sources as separate classes rather than abstracting too aggressively. Each chart source handles its unique requirements while maintaining the same interface.

### Design Decision: Combined Manufacturer-Model Format

When a user clicks on a model bar, we need to filter by both manufacturer AND model. We combine these into a single URL parameter using colon separator:

```
?modelCombos=Toyota:Camry
```

This approach:
- **Avoids ambiguity** — "Camry" alone could match multiple manufacturers if the API had duplicates
- **Supports multi-select** — `modelCombos=Toyota:Camry,Honda:Accord` selects multiple models
- **Matches API expectations** — The backend parses this format for efficient filtering

### URL-First Architecture Reference

The top models chart shows how chart sources can produce complex URL structures. The `handleClick` method transforms display format ("Toyota Camry") to URL format ("Toyota:Camry"), demonstrating that chart sources aren't just data transformers but also interaction translators.

---

## What

### Step 654.1: Create the Top Models Chart Source File

Create the file `src/app/domain-config/automobile/chart-sources/top-models-chart-source.ts`:

```typescript
// src/app/domain-config/automobile/chart-sources/top-models-chart-source.ts

/**
 * Top Models Chart Data Source
 *
 * Transforms vehicle statistics into Plotly.js horizontal bar chart
 * showing top models by VIN instance count.
 *
 * Domain: Automobile
 */

import { ChartDataSource, ChartData } from '../../../framework/components/base-chart/base-chart.component';
import { VehicleStatistics } from '../models/automobile.statistics';

/**
 * Top models chart data source
 *
 * Creates a horizontal bar chart of top models by VIN instance count.
 */
export class TopModelsChartDataSource extends ChartDataSource<VehicleStatistics> {
  /**
   * Transform statistics into Plotly chart data
   */
  transform(
    statistics: VehicleStatistics | null,
    _highlights: any,
    _selectedValue: string | null,
    _containerWidth: number
  ): ChartData | null {
    if (!statistics || !statistics.topModels || statistics.topModels.length === 0) {
      return null;
    }

    // Check if we have segmented statistics from API (with total/highlighted counts)
    const hasSegmentedStats = statistics.modelsByManufacturer &&
      Object.values(statistics.modelsByManufacturer).some(models =>
        typeof models === 'object' && Object.values(models).some(v =>
          typeof v === 'object' && 'total' in v
        )
      );

    let traces: any[] = [];

    if (hasSegmentedStats && statistics.modelsByManufacturer) {
      // Use API's segmented statistics with {total, highlighted}
      const modelEntries: Array<[string, any]> = [];

      Object.entries(statistics.modelsByManufacturer).forEach(([manufacturer, models]) => {
        Object.entries(models).forEach(([modelName, stats]) => {
          modelEntries.push([`${manufacturer} ${modelName}`, stats]);
        });
      });

      // Sort by total count descending and take top 20
      const sorted = modelEntries
        .sort((a, b) => ((b[1] as any).total || 0) - ((a[1] as any).total || 0))
        .slice(0, 20);

      const modelLabels = sorted.map(([label]) => label);
      const highlightedCounts = sorted.map(([, stats]: [string, any]) => stats.highlighted || 0);
      const otherCounts = sorted.map(([, stats]: [string, any]) =>
        (stats.total || 0) - (stats.highlighted || 0)
      );

      // Create stacked bar traces (Highlighted first at bottom, then Other on top)
      traces = [
        {
          type: 'bar',
          name: 'Highlighted',
          x: modelLabels,
          y: highlightedCounts,
          marker: { color: '#3B82F6' },
          hovertemplate: '<b>%{x}</b><br>Highlighted: %{y}<extra></extra>'
        },
        {
          type: 'bar',
          name: 'Other',
          x: modelLabels,
          y: otherCounts,
          marker: { color: '#9CA3AF' },
          hovertemplate: '<b>%{x}</b><br>Other: %{y}<extra></extra>'
        }
      ];
    } else {
      // Fallback: simple blue bars using topModels
      const topModels = statistics.topModels.slice(0, 20);
      const modelLabels = topModels.map(m => `${m.manufacturer} ${m.name}`);
      const counts = topModels.map(m => m.instanceCount);

      traces = [{
        type: 'bar',
        x: modelLabels,
        y: counts,
        marker: { color: '#3B82F6' },
        hovertemplate: '<b>%{x}</b><br>Count: %{y}<br><extra></extra>'
      }];
    }

    // Create layout
    const layout: Partial<any> = {
      barmode: hasSegmentedStats ? 'stack' : undefined,
      xaxis: {
        tickangle: -45,
        automargin: true,
        color: '#FFFFFF',
        gridcolor: '#333333'
      },
      yaxis: {
        title: '',
        gridcolor: '#333333',
        automargin: true,
        color: '#FFFFFF'
      },
      margin: {
        l: 60,
        r: 40,
        t: 40,
        b: 140
      },
      plot_bgcolor: '#000000',
      paper_bgcolor: '#1a1a1a',
      font: { color: '#FFFFFF' },
      showlegend: hasSegmentedStats
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
    return 'Top Models by VIN Count';
  }

  /**
   * Handle chart click event
   *
   * Supports both single-click and box selection.
   * For box selection, returns comma-separated list of unique models.
   * Converts label format from "Manufacturer Model" to "Manufacturer:Model".
   */
  handleClick(event: any): string | null {
    if (event.points && event.points.length > 0) {
      // Extract all model labels from selected points (format: "Manufacturer Model")
      const modelLabels: string[] = event.points.map((point: any) => point.x as string);

      // Remove duplicates (box selection may select both stacked bars)
      const uniqueLabels = [...new Set(modelLabels)];

      // Convert from "Manufacturer Model" to "Manufacturer:Model" format
      const modelCombos = uniqueLabels.map(label => {
        // Replace first space with colon (manufacturer doesn't have spaces)
        return label.replace(' ', ':');
      });

      // Return comma-separated list (or single value)
      return modelCombos.join(',');
    }
    return null;
  }

  /**
   * Convert clicked value to URL parameters
   */
  toUrlParams(value: string, isHighlightMode: boolean): Record<string, any> {
    const paramName = isHighlightMode ? 'h_modelCombos' : 'modelCombos';
    return { [paramName]: value };
  }
}
```

---

### Step 654.2: Understanding Nested Data Transformation

The top models chart handles a more complex data structure:

```typescript
// Statistics structure
{
  modelsByManufacturer: {
    "Toyota": {
      "Camry": { total: 234, highlighted: 45 },
      "Corolla": { total: 189, highlighted: 32 }
    },
    "Honda": {
      "Accord": { total: 156, highlighted: 28 },
      "Civic": { total: 145, highlighted: 21 }
    }
  }
}
```

The transformation flattens this nested structure:

```typescript
Object.entries(statistics.modelsByManufacturer).forEach(([manufacturer, models]) => {
  Object.entries(models).forEach(([modelName, stats]) => {
    modelEntries.push([`${manufacturer} ${modelName}`, stats]);
  });
});
```

**Result:**

```typescript
modelEntries = [
  ["Toyota Camry", { total: 234, highlighted: 45 }],
  ["Toyota Corolla", { total: 189, highlighted: 32 }],
  ["Honda Accord", { total: 156, highlighted: 28 }],
  ["Honda Civic", { total: 145, highlighted: 21 }]
]
```

This creates a flat array suitable for sorting and slicing to get the top 20.

---

### Step 654.3: Understanding Dual Data Source Fallback

Notice the two code paths:

```typescript
if (hasSegmentedStats && statistics.modelsByManufacturer) {
  // Use nested structure with highlight support
} else {
  // Fallback: use topModels array
  const topModels = statistics.topModels.slice(0, 20);
  const modelLabels = topModels.map(m => `${m.manufacturer} ${m.name}`);
  const counts = topModels.map(m => m.instanceCount);
}
```

**Why two approaches?**

The API can return model data in two formats:

1. **Segmented format** (`modelsByManufacturer`) — Has highlight counts, needs flattening
2. **Array format** (`topModels`) — Pre-sorted array, simpler to use but no highlight data

The segmented format is preferred when available (for highlight support), but the fallback ensures the chart works with simpler API responses.

---

### Step 654.4: Understanding Label Format Conversion

The click handler converts display format to URL format:

```typescript
// Convert from "Manufacturer Model" to "Manufacturer:Model" format
const modelCombos = uniqueLabels.map(label => {
  // Replace first space with colon (manufacturer doesn't have spaces)
  return label.replace(' ', ':');
});
```

**Why this conversion?**

| Format | Purpose | Example |
|--------|---------|---------|
| Display | Human-readable chart labels | "Toyota Camry" |
| URL | Machine-parseable parameter | "Toyota:Camry" |

The colon separator enables the backend to split the value and query by both manufacturer AND model efficiently.

**Edge Case: Multi-Word Models**

Consider "Ford Mustang Mach-E":

```typescript
"Ford Mustang Mach-E".replace(' ', ':')
// Result: "Ford:Mustang Mach-E"
```

The first space becomes a colon, preserving "Mustang Mach-E" as the model name. This works because manufacturer names in this dataset don't contain spaces.

---

### Step 654.5: Understanding the Larger Bottom Margin

The top models chart uses the largest bottom margin:

```typescript
margin: {
  l: 60,
  r: 40,
  t: 40,
  b: 140  // Largest of all charts
}
```

**Why 140px?**

Model labels are the longest of any chart:
- "Toyota Camry" — Short
- "Mercedes-Benz S-Class" — Medium
- "Lamborghini Aventador LP700-4" — Long

When angled at -45 degrees, these long labels need substantial vertical space to remain readable without overlapping or being cut off.

---

### Step 654.6: Understanding the Segmentation Check

The segmentation check for top models is more complex:

```typescript
const hasSegmentedStats = statistics.modelsByManufacturer &&
  Object.values(statistics.modelsByManufacturer).some(models =>
    typeof models === 'object' && Object.values(models).some(v =>
      typeof v === 'object' && 'total' in v
    )
  );
```

**Why so complex?**

Unlike `byManufacturer` (which is one level deep), `modelsByManufacturer` is two levels deep:

```
modelsByManufacturer → manufacturer → model → { total, highlighted }
```

We need to:
1. Check that `modelsByManufacturer` exists
2. Check that at least one manufacturer has models
3. Check that at least one model has the `{ total, highlighted }` structure

This defensive checking prevents runtime errors when data is missing or in an unexpected format.

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
-rw-r--r-- 1 user user  4789 Feb  9 17:15 top-models-chart-source.ts
```

### 3. Label Conversion Test

Mentally trace the click handler:

```typescript
// Input from Plotly click event
event.points = [{ x: "Toyota Camry" }, { x: "Honda Accord" }]

// After processing
// uniqueLabels = ["Toyota Camry", "Honda Accord"]
// modelCombos = ["Toyota:Camry", "Honda:Accord"]
// return value = "Toyota:Camry,Honda:Accord"

// URL parameter
// ?modelCombos=Toyota:Camry,Honda:Accord
```

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| Chart shows no data | `topModels` array empty | Verify API returns model data |
| Labels show "undefined undefined" | Missing manufacturer or name | Check `topModels` array structure |
| "Ford:Mustang:Mach-E" (two colons) | Multiple `replace()` calls | Use `replace(' ', ':')` not `replaceAll` |
| Segmentation not detected | Nested check failing | Verify `modelsByManufacturer` has expected structure |
| Labels overlap | Bottom margin too small | Increase `b` value in margins |
| `Cannot find module '../models/automobile.statistics'` | VehicleStatistics not created | Complete document 403 first |

---

## Key Takeaways

1. **Nested data requires flattening** — Transform hierarchical API responses into flat arrays for charting
2. **Display format differs from URL format** — Convert human-readable labels to machine-parseable parameters
3. **Fallback data sources add resilience** — Handle multiple API response formats gracefully

---

## Acceptance Criteria

- [ ] File exists at `src/app/domain-config/automobile/chart-sources/top-models-chart-source.ts`
- [ ] Class `TopModelsChartDataSource` extends `ChartDataSource<VehicleStatistics>`
- [ ] Handles both `modelsByManufacturer` (segmented) and `topModels` (array) formats
- [ ] Labels show "Manufacturer Model" format (e.g., "Toyota Camry")
- [ ] `handleClick` converts to "Manufacturer:Model" format
- [ ] `toUrlParams` maps values to `modelCombos` or `h_modelCombos` parameters
- [ ] Bottom margin (140px) accommodates long model names
- [ ] Code compiles without TypeScript errors (after dependencies are created)

---

## Phase 7 Complete

You have now completed all chart data sources for the automobile domain:

| Document | Chart Source | Data Property | URL Parameter |
|----------|-------------|---------------|---------------|
| 651 | ManufacturerChartDataSource | `byManufacturer` | `manufacturer` |
| 652 | YearChartDataSource | `byYearRange` | `year`, `yearMin`, `yearMax` |
| 653 | BodyClassChartDataSource | `byBodyClass` | `bodyClass` |
| 654 | TopModelsChartDataSource | `modelsByManufacturer`, `topModels` | `modelCombos` |

**Phase 7 Aha Moment:** "Chart sources transform domain data into visualization-ready formats."

Each chart source:
- Transforms domain statistics into Plotly traces and layouts
- Handles both simple and segmented (highlighted) data
- Converts user interactions into URL parameters

---

## Next Step

Proceed to Phase 8 (document 801) to build the `BaseChartComponent` that uses these data sources to render interactive charts.
