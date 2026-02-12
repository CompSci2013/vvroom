# 605: Highlight Filters

**Status:** Planning
**Depends On:** 203-filter-definition-interface, 401-automobile-filters-model
**Blocks:** 607-domain-config-assembly

---

## Learning Objectives

After completing this section, you will:
- Understand the purpose of highlight filters for chart segmentation
- Know the naming convention for highlight URL parameters (h_ prefix)
- Recognize how highlight data flows from URL to API to chart visualization

---

## Objective

Create the highlight filter definitions that enable chart segmentation. Highlight filters use the same structure as query control filters but generate URL parameters with the `h_` prefix, triggering special API behavior that returns segmented statistics.

---

## Why

Regular filters narrow results: "Show only Ford vehicles" removes all non-Ford data.

Highlight filters segment results: "Highlight Ford in the charts" keeps all data but colors Ford differently.

**Visual comparison:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    WITHOUT HIGHLIGHTS                            │
│                                                                  │
│  Manufacturer Distribution                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ████████████ Ford (25%)                                  │    │
│  │ ██████████ Toyota (20%)                                  │    │
│  │ ████████ Honda (16%)                                     │    │
│  │ ██████ BMW (12%)                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  All bars are the same color (blue)                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    WITH HIGHLIGHTS                               │
│                    h_manufacturer=Ford                           │
│                                                                  │
│  Manufacturer Distribution                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ████████████ Ford (25%) [ORANGE - HIGHLIGHTED]           │    │
│  │ ██████████ Toyota (20%) [BLUE - OTHER]                   │    │
│  │ ████████ Honda (16%) [BLUE - OTHER]                      │    │
│  │ ██████ BMW (12%) [BLUE - OTHER]                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Ford is highlighted in orange; others remain blue              │
└─────────────────────────────────────────────────────────────────┘
```

**Use cases:**

1. **Competitive analysis** — Highlight your company vs competitors
2. **Focus attention** — Draw user's eye to specific data points
3. **Before/after comparison** — Highlight a year range to show trends

**API behavior:**

When the API receives highlight parameters, it returns segmented statistics:

```json
// Without highlights: GET /vehicles/statistics
{
  "manufacturers": [
    { "name": "Ford", "count": 1000 },
    { "name": "Toyota", "count": 800 }
  ]
}

// With highlights: GET /vehicles/statistics?h_manufacturer=Ford
{
  "manufacturers": [
    { "name": "Ford", "count": 1000, "highlighted": 1000 },
    { "name": "Toyota", "count": 800, "highlighted": 0 }
  ]
}
```

The `highlighted` field indicates how much of the count matches the highlight criteria.

---

## What

### Step 605.1: Create the Highlight Filters File

Create the file that will define highlight filter configurations.

Create `src/app/domain-config/automobile/configs/automobile.highlight-filters.ts`:

```typescript
// src/app/domain-config/automobile/configs/automobile.highlight-filters.ts

/**
 * Automobile Domain - Highlight Filter Definitions
 *
 * Defines highlight filter definitions for the Query Control component.
 * Highlight filters allow users to add h_* parameters to segment statistics
 * in charts (showing highlighted vs other data in stacked bars).
 *
 * Domain: Automobile Discovery
 */

import { FilterDefinition, FilterOption } from '../../../framework/models/filter-definition.interface';
import { HighlightFilters } from '../models/automobile.filters';
import { environment } from '../../../environments/environment';

/**
 * Highlight filter definitions
 *
 * Each definition specifies:
 * - Which highlight field it manages (h_manufacturer, h_modelCombos, etc.)
 * - What type of UI control to display (multiselect, range, etc.)
 * - Where to fetch options from (API endpoint)
 * - How to transform API responses
 * - URL parameter names (with h_ prefix)
 *
 * These are used by the QueryControlComponent to dynamically render highlight filter dialogs.
 *
 * @example
 * ```typescript
 * // User adds "Highlight Manufacturer: Ford" filter
 * // URL updates to: ?h_manufacturer=Ford
 * // API receives: GET /vehicles/details?h_manufacturer=Ford
 * // Returns segmented statistics: {"Ford": {"total": 665, "highlighted": 665}, ...}
 * // Charts render stacked bars showing highlighted (Ford) vs other manufacturers
 * ```
 */
export const AUTOMOBILE_HIGHLIGHT_FILTERS: FilterDefinition<HighlightFilters>[] = [
  /**
   * Highlight Manufacturer filter (Multiselect)
   * URL parameter: h_manufacturer
   */
  {
    field: 'manufacturer',
    label: 'Highlight Manufacturer',
    type: 'multiselect',
    optionsEndpoint: `${environment.apiBaseUrl}/filters/manufacturers`,
    optionsTransformer: (response: any): FilterOption[] => {
      if (response && response.manufacturers) {
        return response.manufacturers.map((m: string) => ({
          value: m,
          label: m
        }));
      }
      return [];
    },
    urlParams: 'h_manufacturer',
    searchPlaceholder: 'Type to search manufacturers...',
    dialogSubtitle: 'Select one or more manufacturers to highlight in charts.'
  },

  /**
   * Highlight Model Combinations filter (Multiselect)
   * URL parameter: h_modelCombos
   * Format: Manufacturer:Model,Manufacturer:Model (e.g., Ford:F-150,Toyota:Camry)
   */
  {
    field: 'modelCombos',
    label: 'Highlight Models',
    type: 'multiselect',
    optionsEndpoint: `${environment.apiBaseUrl}/manufacturer-model-combinations`,
    optionsTransformer: (response: any): FilterOption[] => {
      const options: FilterOption[] = [];
      if (response && response.data) {
        // Flatten nested structure: data[].manufacturer + data[].models[].model
        for (const manufacturerGroup of response.data) {
          const manufacturer = manufacturerGroup.manufacturer;
          if (manufacturerGroup.models) {
            for (const modelObj of manufacturerGroup.models) {
              const model = modelObj.model;
              options.push({
                value: `${manufacturer}:${model}`,
                label: `${manufacturer}:${model}`
              });
            }
          }
        }
      }
      return options;
    },
    urlParams: 'h_modelCombos',
    searchPlaceholder: 'Type to search model combinations...',
    dialogSubtitle: 'Select one or more model combinations to highlight in charts.'
  },

  /**
   * Highlight Body Class filter (Multiselect)
   * URL parameter: h_bodyClass
   */
  {
    field: 'bodyClass',
    label: 'Highlight Body Class',
    type: 'multiselect',
    optionsEndpoint: `${environment.apiBaseUrl}/filters/body-classes`,
    optionsTransformer: (response: any): FilterOption[] => {
      if (response && response.body_classes) {
        return response.body_classes.map((b: string) => ({
          value: b,
          label: b
        }));
      }
      return [];
    },
    urlParams: 'h_bodyClass',
    searchPlaceholder: 'Type to search body classes...',
    dialogSubtitle: 'Select one or more body classes to highlight in charts.'
  },

  /**
   * Highlight Year Range filter (Range)
   * URL parameters: h_yearMin, h_yearMax
   *
   * Note: This uses yearMin as the field, but actually manages both yearMin and yearMax
   */
  {
    field: 'yearMin',
    label: 'Highlight Year',
    type: 'range',
    optionsEndpoint: `${environment.apiBaseUrl}/filters/year-range`,
    urlParams: { min: 'h_yearMin', max: 'h_yearMax' },
    dialogTitle: 'Highlight Year Range',
    dialogSubtitle: 'Select a year range to highlight in charts. You can select just a start year, end year, or both.',
    rangeConfig: {
      valueType: 'integer',
      minLabel: 'Start Year',
      maxLabel: 'End Year',
      minPlaceholder: 'e.g., 1980',
      maxPlaceholder: 'e.g., 2023',
      step: 1,
      useGrouping: false,
      defaultRange: { min: 1900, max: new Date().getFullYear() }
    }
  }
];
```

---

### Step 605.2: Understand the Highlight Filter Structure

Highlight filters use the same structure as query control filters with one key difference: the `urlParams` values have the `h_` prefix.

**Query Control Filter:**
```typescript
{
  field: 'manufacturer',
  urlParams: 'manufacturer'  // URL: ?manufacturer=Ford
}
```

**Highlight Filter:**
```typescript
{
  field: 'manufacturer',
  urlParams: 'h_manufacturer'  // URL: ?h_manufacturer=Ford
}
```

The `h_` prefix signals to the API adapter that this is a highlight filter, not a regular filter.

---

### Step 605.3: Understanding the URL Parameter Convention

The `h_` prefix is a convention used throughout the application:

| Regular Filter | Highlight Filter | Effect |
|----------------|------------------|--------|
| `manufacturer=Ford` | `h_manufacturer=Ford` | Filter: Only Ford | Highlight: All data, Ford colored |
| `yearMin=2020&yearMax=2023` | `h_yearMin=2020&h_yearMax=2023` | Filter: Only 2020-2023 | Highlight: All years, 2020-2023 colored |
| `bodyClass=SUV` | `h_bodyClass=SUV` | Filter: Only SUVs | Highlight: All body classes, SUV colored |

**Combined example:**
```
?manufacturer=Ford&h_bodyClass=SUV

Result:
- Data filtered to Ford vehicles only
- Charts show all Ford body classes
- SUV bars highlighted in orange, other Ford body classes in blue
```

---

### Step 605.4: Understanding the Data Flow

The complete flow from URL to visualization:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER ACTION                                                   │
│                                                                  │
│    User adds highlight filter: "Highlight Manufacturer: Ford"   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. URL UPDATE                                                    │
│                                                                  │
│    /automobiles/discover?h_manufacturer=Ford                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. URL MAPPER PARSES                                             │
│                                                                  │
│    AutomobileUrlMapper.parseUrl() extracts:                     │
│    {                                                             │
│      filters: { },                                               │
│      highlights: { manufacturer: ['Ford'] }                     │
│    }                                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. API ADAPTER BUILDS REQUEST                                    │
│                                                                  │
│    GET /vehicles/statistics?h_manufacturer=Ford                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. API RETURNS SEGMENTED DATA                                    │
│                                                                  │
│    {                                                             │
│      "manufacturers": [                                          │
│        { "name": "Ford", "count": 1000, "highlighted": 1000 },  │
│        { "name": "Toyota", "count": 800, "highlighted": 0 },    │
│        { "name": "Honda", "count": 600, "highlighted": 0 }      │
│      ]                                                           │
│    }                                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. CHART DATA SOURCE TRANSFORMS                                  │
│                                                                  │
│    ManufacturerChartDataSource creates stacked bar data:        │
│    - Trace 1 (orange): highlighted values                        │
│    - Trace 2 (blue): count - highlighted                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. CHART RENDERS                                                 │
│                                                                  │
│    ████████████ Ford (100% highlighted)   [ORANGE]              │
│    ██████████ Toyota (0% highlighted)     [BLUE]                │
│    ████████ Honda (0% highlighted)        [BLUE]                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Step 605.5: Comparing Query Control Filters vs Highlight Filters

**Document 604 (Query Control Filters):**
- Narrow the dataset
- Remove non-matching rows
- URL params: `manufacturer`, `model`, `yearMin`, etc.

**Document 605 (Highlight Filters):**
- Segment the visualization
- Keep all rows, color matching rows differently
- URL params: `h_manufacturer`, `h_model`, `h_yearMin`, etc.

**They share:**
- Same structure (FilterDefinition interface)
- Same options endpoints
- Same options transformers
- Same UI dialogs (QueryControlComponent handles both)

**They differ:**
- URL parameter names (with/without `h_` prefix)
- API behavior (filter vs segment)
- Visual effect (hide vs color)

---

## Verification

### 1. Verify File Created

```bash
$ ls -la src/app/domain-config/automobile/configs/automobile.highlight-filters.ts
```

Expected: File exists.

### 2. Verify TypeScript Compilation

```bash
$ cd ~/projects/vvroom
$ npx tsc --noEmit src/app/domain-config/automobile/configs/automobile.highlight-filters.ts
```

Expected: No compilation errors.

### 3. Verify Filter Count

```bash
$ grep -c "field:" src/app/domain-config/automobile/configs/automobile.highlight-filters.ts
```

Expected: `4` (manufacturer, modelCombos, bodyClass, yearMin)

### 4. Verify h_ Prefix

```bash
$ grep "h_" src/app/domain-config/automobile/configs/automobile.highlight-filters.ts | wc -l
```

Expected: At least 6 occurrences (h_manufacturer, h_modelCombos, h_bodyClass, h_yearMin, h_yearMax in code and comments)

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| Highlights not appearing in charts | API not returning highlighted field | Verify API supports h_ parameters |
| Same color for highlighted and non-highlighted | Chart data source not using highlighted field | Update chart data source to check for segmented data |
| Filter and highlight interfering | Using wrong prefix | Filter params no prefix, highlight params h_ prefix |
| "Cannot find 'HighlightFilters'" | Model not imported | Ensure automobile.filters.ts exports HighlightFilters |

---

## Key Takeaways

1. **Highlight filters segment, they don't filter** — All data remains; selected items are visually distinguished
2. **The h_ prefix is the convention** — URL parameters starting with h_ trigger highlight behavior
3. **Same structure, different purpose** — Highlight filters reuse the FilterDefinition interface with different urlParams

---

## Acceptance Criteria

- [ ] `src/app/domain-config/automobile/configs/automobile.highlight-filters.ts` exists
- [ ] `AUTOMOBILE_HIGHLIGHT_FILTERS` array contains 4 filter definitions
- [ ] All urlParams values start with `h_` prefix
- [ ] Manufacturer and Body Class filters are type 'multiselect'
- [ ] Model Combinations filter handles nested API response
- [ ] Year filter is type 'range' with h_yearMin and h_yearMax params
- [ ] Label text includes "Highlight" to distinguish from regular filters
- [ ] File compiles without TypeScript errors

---

## Next Step

Proceed to `606-chart-configs.md` to define the chart configurations for the statistics panel.
