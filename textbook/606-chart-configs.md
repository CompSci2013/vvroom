# 606: Chart Configs

**Status:** Planning
**Depends On:** 201-domain-config-interface
**Blocks:** 607-domain-config-assembly, 651-manufacturer-chart-source

---

## Learning Objectives

After completing this section, you will:
- Understand how chart configurations separate visualization metadata from data transformation
- Know the relationship between chart configs and chart data sources
- Recognize the pattern of declarative chart definition

---

## Objective

Create the automobile chart configurations that define which charts appear in the statistics panel. These configurations specify chart identity, type, dimensions, and which data source transforms the statistics into chart data.

---

## Why

Visualizations help users understand data patterns. For automobiles, we want charts showing:

1. **Manufacturer distribution** — Which manufacturers have the most vehicles?
2. **Model distribution** — Which specific models are most common?
3. **Year distribution** — How are vehicles distributed across years?
4. **Body class distribution** — What types of vehicles are in the data?

Without configuration, you might create each chart as a separate component:

```typescript
@Component({
  template: `
    <div class="chart-container">
      <h3>Manufacturers</h3>
      <plotly-plot [data]="manufacturerData" [layout]="layout"></plotly-plot>
    </div>
  `
})
export class ManufacturerChartComponent {
  // Transform statistics to chart data
  // Handle Plotly configuration
  // Manage visibility
  // ...50+ lines of code
}
```

Four charts = four components = 200+ lines of similar code.

With configuration:

```typescript
export const AUTOMOBILE_CHART_CONFIGS: ChartConfig[] = [
  { id: 'manufacturer-distribution', title: 'Manufacturers', dataSourceId: 'manufacturer', ... },
  { id: 'year-distribution', title: 'Year', dataSourceId: 'year', ... },
  // ...
];
```

One generic `BaseChartComponent` + configuration = minimal code.

**This is the Phase 6 Aha Moment again:** Configuration is declarative code. You describe what charts you want, not how to render them.

### Angular Style Guide References

- Configuration objects follow the same pattern as Angular's built-in configurations (routes, providers)

---

## What

### Step 606.1: Create the Chart Configurations File

Create the file that will define automobile chart configurations.

Create `src/app/domain-config/automobile/configs/automobile.chart-configs.ts`:

```typescript
// src/app/domain-config/automobile/configs/automobile.chart-configs.ts

/**
 * Automobile Domain - Chart Configurations (Plotly.js)
 *
 * Defines chart visualizations for automobile statistics using Plotly.js.
 * Charts display aggregated data and distributions.
 *
 * Domain: Automobile Discovery
 */

import { ChartConfig } from '../../../framework/models/domain-config.interface';

/**
 * Automobile chart configurations
 *
 * Array of chart definitions for the statistics panel.
 * Each chart visualizes a different aspect of the vehicle data.
 *
 * NOTE: These configs work with Plotly.js via BaseChartComponent.
 * Data transformation is handled by chart data sources in chart-sources/ directory.
 *
 * @example
 * ```typescript
 * <app-statistics-panel-2 [domainConfig]="domainConfig">
 * </app-statistics-panel-2>
 * ```
 */
export const AUTOMOBILE_CHART_CONFIGS: ChartConfig[] = [
  /**
   * Manufacturer distribution (vertical stacked bar chart)
   */
  {
    id: 'manufacturer-distribution',
    title: 'Manufacturers',
    type: 'bar',
    dataSourceId: 'manufacturer',
    height: 400,
    width: '100%',
    visible: true,
    collapsible: true
  },

  /**
   * Top models by VIN count (vertical stacked bar chart)
   */
  {
    id: 'top-models',
    title: 'Models',
    type: 'bar',
    dataSourceId: 'top-models',
    height: 400,
    width: '100%',
    visible: true,
    collapsible: true
  },

  /**
   * Year distribution (vertical stacked bar chart)
   */
  {
    id: 'year-distribution',
    title: 'Year',
    type: 'bar',
    dataSourceId: 'year',
    height: 400,
    width: '100%',
    visible: true,
    collapsible: true
  },

  /**
   * Body class distribution (vertical stacked bar chart)
   */
  {
    id: 'body-class-distribution',
    title: 'Body Class',
    type: 'bar',
    dataSourceId: 'body-class',
    height: 400,
    width: '100%',
    visible: true,
    collapsible: true
  }
];
```

---

### Step 606.2: Understand the Chart Configuration Structure

Each chart configuration defines a visualization:

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier for the chart |
| `title` | `string` | Display title shown above the chart |
| `type` | `'bar' \| 'line' \| 'pie' \| 'scatter'` | Plotly chart type |
| `dataSourceId` | `string` | Key to look up in chartDataSources map |
| `height` | `number` | Chart height in pixels |
| `width` | `string` | Chart width (CSS value) |
| `visible` | `boolean` | Initial visibility state |
| `collapsible` | `boolean` | Can user collapse/expand the chart |

---

### Step 606.3: Understanding the Chart/Data Source Relationship

Chart configs and chart data sources are separate concerns:

**Chart Config (this file):**
- Defines chart metadata (id, title, type, dimensions)
- Says "render a bar chart called 'Manufacturers'"
- Does NOT know how to transform statistics to chart data

**Chart Data Source (Phase 7, documents 651-654):**
- Transforms statistics into Plotly trace format
- Knows the structure of VehicleStatistics
- Handles highlight segmentation

The connection is the `dataSourceId`:

```typescript
// Chart config (document 606)
{ id: 'manufacturer-distribution', dataSourceId: 'manufacturer', ... }

// Domain config (document 607) connects them
chartDataSources: {
  'manufacturer': new ManufacturerChartDataSource(),  // Phase 7
  // ...
}
```

**Data Flow:**

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  ChartConfig    │     │ ChartDataSource │     │ BaseChartComp   │
│                 │     │                 │     │                 │
│ dataSourceId:   │────▶│ transform()     │────▶│ Plotly.js       │
│ 'manufacturer'  │     │ returns traces  │     │ render          │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

### Step 606.4: Understanding Chart Types

All automobile charts use `type: 'bar'`, but the framework supports multiple types:

**Bar Charts (used here):**
```
     │
  50 │ ████
     │ ████ ████
  25 │ ████ ████ ████
     │ ████ ████ ████ ████
   0 └─────────────────────
       Ford Toyota Honda BMW
```

Best for: Comparing categories (manufacturers, body classes)

**Line Charts:**
```
     │
  50 │         /\
     │    /\  /  \
  25 │   /  \/    \
     │  /          \____
   0 └─────────────────────
      2018 2019 2020 2021 2022
```

Best for: Showing trends over time

**Pie Charts:**
```
        ╭─────────────╮
       /    Ford     \
      │     25%       │
      │               │
      \    Toyota    /
       \   20%      /
        ╰─────────╯
```

Best for: Showing proportions of a whole

---

### Step 606.5: Understanding Stacked Bar Charts with Highlights

When highlights are active, bar charts become stacked:

**Without highlights:**
```
Manufacturers
     │
 100 │ ████
     │ ████ ████
  50 │ ████ ████ ████
     │ ████ ████ ████ ████
   0 └─────────────────────
       Ford Toyota Honda BMW
```

**With h_manufacturer=Ford:**
```
Manufacturers
     │
 100 │ ████ (orange: highlighted)
     │ ████ ░░░░
  50 │ ████ ░░░░ ░░░░
     │ ████ ░░░░ ░░░░ ░░░░
   0 └─────────────────────
       Ford Toyota Honda BMW

Legend: ████ = Highlighted (Ford)
        ░░░░ = Other
```

The stacking is handled by the chart data source (Phase 7), not the chart config.

---

### Step 606.6: Understanding Chart Dimensions

The `height` and `width` properties control chart sizing:

```typescript
{
  height: 400,   // Fixed 400px height
  width: '100%'  // Responsive width (fills container)
}
```

**Why fixed height, responsive width?**

- **Fixed height**: Charts need consistent vertical space for readability
- **Responsive width**: Charts should adapt to container width (desktop vs mobile)

The statistics panel uses a grid layout:

```
┌─────────────────────────────────────────────────────────────────┐
│ Statistics Panel                                                 │
├─────────────────────────────────┬───────────────────────────────┤
│ ┌─────────────────────────────┐ │ ┌─────────────────────────────┐│
│ │     Manufacturers           │ │ │        Models               ││
│ │     height: 400px           │ │ │        height: 400px        ││
│ │     width: 100%             │ │ │        width: 100%          ││
│ └─────────────────────────────┘ │ └─────────────────────────────┘│
├─────────────────────────────────┼───────────────────────────────┤
│ ┌─────────────────────────────┐ │ ┌─────────────────────────────┐│
│ │        Year                 │ │ │      Body Class             ││
│ │     height: 400px           │ │ │        height: 400px        ││
│ │     width: 100%             │ │ │        width: 100%          ││
│ └─────────────────────────────┘ │ └─────────────────────────────┘│
└─────────────────────────────────┴───────────────────────────────┘
```

Each chart fills its grid cell horizontally but maintains 400px height.

---

### Step 606.7: Understanding Collapsible Charts

The `collapsible: true` property allows users to minimize charts:

```
┌─────────────────────────────────────────────────────────────────┐
│ ▼ Manufacturers                                            [−]  │
├─────────────────────────────────────────────────────────────────┤
│ ████████████████████████████████████████████████████████████    │
│ ██████████████████████████████████████████████                  │
│ ████████████████████████████████                                │
└─────────────────────────────────────────────────────────────────┘

After clicking [−]:

┌─────────────────────────────────────────────────────────────────┐
│ ▶ Manufacturers                                            [+]  │
└─────────────────────────────────────────────────────────────────┘
```

Benefits:
- Users can hide charts they don't need
- Saves vertical space for charts they do use
- State can be persisted in user preferences

---

## Verification

### 1. Verify File Created

```bash
$ ls -la src/app/domain-config/automobile/configs/automobile.chart-configs.ts
```

Expected: File exists.

### 2. Verify TypeScript Compilation

```bash
$ cd ~/projects/vvroom
$ npx tsc --noEmit src/app/domain-config/automobile/configs/automobile.chart-configs.ts
```

Expected: No compilation errors.

### 3. Verify Chart Count

```bash
$ grep -c "id:" src/app/domain-config/automobile/configs/automobile.chart-configs.ts
```

Expected: `4` (manufacturer-distribution, top-models, year-distribution, body-class-distribution)

### 4. Verify Data Source IDs

```bash
$ grep "dataSourceId:" src/app/domain-config/automobile/configs/automobile.chart-configs.ts
```

Expected: Four dataSourceId values (manufacturer, top-models, year, body-class)

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| "Cannot find module '../../../framework/models/domain-config.interface'" | Interface not yet created | Ensure Phase 2 (document 201) is complete |
| Chart not rendering | dataSourceId not found in chartDataSources | Verify dataSourceId matches key in domain config |
| Chart too tall/short | Incorrect height value | Adjust height to appropriate pixel value |
| Chart not collapsing | collapsible: false | Set collapsible: true |
| "ChartConfig is not a type" | Import missing | Add import for ChartConfig from domain-config.interface |

---

## Key Takeaways

1. **Chart configs are pure metadata** — They describe what to render, not how
2. **Data sources handle transformation** — The dataSourceId links to code that transforms statistics
3. **All charts use consistent dimensions** — height: 400, width: '100%' for uniform appearance

---

## Acceptance Criteria

- [ ] `src/app/domain-config/automobile/configs/automobile.chart-configs.ts` exists
- [ ] `AUTOMOBILE_CHART_CONFIGS` array contains 4 chart definitions
- [ ] Each chart has id, title, type, dataSourceId, height, width, visible, collapsible
- [ ] All charts use type: 'bar' for consistent visualization
- [ ] dataSourceId values are: manufacturer, top-models, year, body-class
- [ ] All charts have height: 400 and width: '100%'
- [ ] All charts have visible: true and collapsible: true
- [ ] File compiles without TypeScript errors

---

## Next Step

Proceed to `607-domain-config-assembly.md` to assemble all configurations into the complete automobile domain config.
