# 604: Query Control Filters

**Status:** Planning
**Depends On:** 203-filter-definition-interface, 401-automobile-filters-model
**Blocks:** 607-domain-config-assembly

---

## Learning Objectives

After completing this section, you will:
- Understand how query control filters differ from simple filter definitions
- Know how to configure API endpoints for fetching filter options dynamically
- Recognize the pattern of transforming API responses into filter option formats

---

## Objective

Create the query control filter definitions that power the "Add Filter" dialog. These definitions tell the QueryControlComponent which filters are available, how to fetch their options, and how to serialize selections to the URL.

---

## Why

Document 601 defined filter definitions for the Query Panel (always-visible filter controls). But what about filters that users add on demand?

The QueryControlComponent provides a "chip-based" filter UI:

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌─────────────┐ ┌──────────────────┐ ┌───────────────────┐      │
│ │ Ford    [x] │ │ Year: 2020-2023 │ │ Body: SUV, Truck │ [+]  │
│ └─────────────┘ └──────────────────┘ └───────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

Clicking [+] opens a dialog:

```
┌─────────────────────────────────────────────────────────────────┐
│ Add Filter                                                 [X]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ○ Manufacturer                                                 │
│   ○ Model                                                        │
│   ○ Body Class                                                   │
│   ○ Year                                                         │
│   ○ Manufacturer & Model                                         │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                        [Cancel]  [Next]          │
└─────────────────────────────────────────────────────────────────┘
```

Selecting "Manufacturer" and clicking "Next" opens the filter value dialog:

```
┌─────────────────────────────────────────────────────────────────┐
│ Select Manufacturer                                        [X]  │
│ Select one or more manufacturers to filter results.             │
├─────────────────────────────────────────────────────────────────┤
│ [Search: ________________________________________]               │
├─────────────────────────────────────────────────────────────────┤
│ [x] Ford                                                         │
│ [ ] Toyota                                                       │
│ [ ] Honda                                                        │
│ [ ] BMW                                                          │
│ [ ] Mercedes-Benz                                                │
├─────────────────────────────────────────────────────────────────┤
│                                      [Cancel]  [Apply Filter]    │
└─────────────────────────────────────────────────────────────────┘
```

Query control filters define:
1. Which filters appear in the "Add Filter" list
2. Where to fetch options for each filter
3. How to transform API responses into option format
4. How to serialize/deserialize values to/from URL

---

## What

### Step 604.1: Create the Query Control Filters File

Create the file that will define query control filter configurations.

Create `src/app/domain-config/automobile/configs/automobile.query-control-filters.ts`:

```typescript
// src/app/domain-config/automobile/configs/automobile.query-control-filters.ts

/**
 * Automobile Domain - Query Control Filter Definitions
 *
 * Defines filter definitions for the Query Control component.
 * These filters allow users to manually add/remove/edit filters via dialogs.
 *
 * Domain: Automobile Discovery
 */

import { FilterDefinition, FilterOption } from '../../../framework/models/filter-definition.interface';
import { AutoSearchFilters } from '../models/automobile.filters';
import { environment } from '../../../environments/environment';

/**
 * Query Control filter definitions
 *
 * Each definition specifies:
 * - Which field it filters
 * - What type of UI control to display (multiselect, range, etc.)
 * - Where to fetch options from (API endpoint)
 * - How to transform API responses
 * - URL parameter names
 *
 * These are used by the QueryControlComponent to dynamically render filter dialogs.
 */
export const AUTOMOBILE_QUERY_CONTROL_FILTERS: FilterDefinition<AutoSearchFilters>[] = [
  /**
   * Manufacturer filter (Multiselect)
   */
  {
    field: 'manufacturer',
    label: 'Manufacturer',
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
    urlParams: 'manufacturer',
    searchPlaceholder: 'Type to search manufacturers...',
    dialogSubtitle: 'Select one or more manufacturers to filter results.'
  },

  /**
   * Model filter (Multiselect)
   */
  {
    field: 'model',
    label: 'Model',
    type: 'multiselect',
    optionsEndpoint: `${environment.apiBaseUrl}/filters/models`,
    optionsTransformer: (response: any): FilterOption[] => {
      if (response && response.models) {
        return response.models.map((m: string) => ({
          value: m,
          label: m
        }));
      }
      return [];
    },
    urlParams: 'model',
    searchPlaceholder: 'Type to search models...',
    dialogSubtitle: 'Select one or more models to filter results.'
  },

  /**
   * Body Class filter (Multiselect)
   */
  {
    field: 'bodyClass',
    label: 'Body Class',
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
    urlParams: 'bodyClass',
    searchPlaceholder: 'Type to search body classes...',
    dialogSubtitle: 'Select one or more body classes to filter results.'
  },

  /**
   * Year Range filter (Range)
   *
   * Note: This uses yearMin as the field, but actually manages both yearMin and yearMax
   */
  {
    field: 'yearMin',
    label: 'Year',
    type: 'range',
    optionsEndpoint: `${environment.apiBaseUrl}/filters/year-range`,
    urlParams: { min: 'yearMin', max: 'yearMax' },
    dialogTitle: 'Select Year Range',
    dialogSubtitle: 'Select a year range to filter results. You can select just a start year, end year, or both.',
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
  },

  /**
   * Manufacturer-Model Combinations filter (Multiselect)
   *
   * Used to display chips when selections are made via Manufacturer-Model Picker
   * Format: "Manufacturer:Model" (e.g., "Ford:F-150")
   */
  {
    field: 'modelCombos',
    label: 'Manufacturer & Model',
    type: 'multiselect',
    optionsEndpoint: `${environment.apiBaseUrl}/manufacturer-model-combinations?page=1&size=100`,
    optionsTransformer: (response: any): FilterOption[] => {
      // Response structure: { total, data: [ { manufacturer, count, models: [ { model, count } ] } ] }
      if (response && response.data) {
        const options: FilterOption[] = [];
        for (const mfr of response.data) {
          for (const modelObj of mfr.models || []) {
            options.push({
              value: `${mfr.manufacturer}:${modelObj.model}`,
              label: `${mfr.manufacturer}: ${modelObj.model}`
            });
          }
        }
        return options;
      }
      return [];
    },
    urlParams: 'modelCombos',
    searchPlaceholder: 'Type to search manufacturer-model combinations...',
    dialogSubtitle: 'Select one or more manufacturer-model combinations. Tip: Use the Manufacturer-Model Picker panel for easier selection.'
  }
];
```

---

### Step 604.2: Understand the Query Control Filter Structure

Each query control filter definition has these key properties:

| Property | Type | Description |
|----------|------|-------------|
| `field` | `string` | Property name in AutoSearchFilters |
| `label` | `string` | Display text in filter list and dialog title |
| `type` | `'multiselect' \| 'range'` | Filter UI type |
| `optionsEndpoint` | `string` | API endpoint to fetch options |
| `optionsTransformer` | `function` | Transform API response to FilterOption[] |
| `urlParams` | `string \| object` | URL parameter name(s) for this filter |
| `searchPlaceholder` | `string` | Placeholder text in search input |
| `dialogSubtitle` | `string` | Help text shown in filter dialog |

**For Range Filters:**

| Property | Type | Description |
|----------|------|-------------|
| `rangeConfig.valueType` | `'integer' \| 'float'` | Numeric type |
| `rangeConfig.minLabel` | `string` | Label for min input |
| `rangeConfig.maxLabel` | `string` | Label for max input |
| `rangeConfig.step` | `number` | Input step value |
| `rangeConfig.useGrouping` | `boolean` | Use thousand separators |
| `rangeConfig.defaultRange` | `{ min, max }` | Default range limits |

---

### Step 604.3: Understanding the Options Transformer

The `optionsTransformer` function converts API responses to the standard `FilterOption[]` format:

```typescript
// API Response (raw)
{
  manufacturers: ["Ford", "Toyota", "Honda", "BMW"]
}

// After optionsTransformer
[
  { value: "Ford", label: "Ford" },
  { value: "Toyota", label: "Toyota" },
  { value: "Honda", label: "Honda" },
  { value: "BMW", label: "BMW" }
]
```

**Why this pattern?**

Different APIs return data in different formats:
- Some return arrays of strings
- Some return arrays of objects with id/name
- Some return nested structures

The transformer normalizes all formats to `{ value, label }`.

**Complex Example (Model Combinations):**

```typescript
// API Response (raw)
{
  data: [
    {
      manufacturer: "Ford",
      count: 100,
      models: [
        { model: "F-150", count: 50 },
        { model: "Mustang", count: 30 }
      ]
    },
    {
      manufacturer: "Toyota",
      count: 80,
      models: [
        { model: "Camry", count: 40 }
      ]
    }
  ]
}

// After optionsTransformer
[
  { value: "Ford:F-150", label: "Ford: F-150" },
  { value: "Ford:Mustang", label: "Ford: Mustang" },
  { value: "Toyota:Camry", label: "Toyota: Camry" }
]
```

---

### Step 604.4: Understanding URL Parameter Mapping

The `urlParams` property defines how filter values appear in the URL:

**Simple (string):**
```typescript
urlParams: 'manufacturer'
// Selected: ["Ford", "Toyota"]
// URL: ?manufacturer=Ford,Toyota
```

**Range (object):**
```typescript
urlParams: { min: 'yearMin', max: 'yearMax' }
// Selected: { min: 2020, max: 2023 }
// URL: ?yearMin=2020&yearMax=2023
```

This separation allows:
- Filter field names to differ from URL parameter names
- Range filters to use two separate URL parameters

---

### Step 604.5: Understanding Filter Type Differences

**Multiselect vs Range:**

```
┌─────────────────────────────────────────────────────────────────┐
│                        MULTISELECT                               │
├─────────────────────────────────────────────────────────────────┤
│ • User selects 0 to N items from a list                         │
│ • Options fetched from API                                       │
│ • URL: ?manufacturer=Ford,Toyota,Honda                          │
│ • Chip: "Manufacturer: Ford, Toyota, Honda"                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                          RANGE                                   │
├─────────────────────────────────────────────────────────────────┤
│ • User enters min and/or max values                              │
│ • No options fetched (user types values)                         │
│ • URL: ?yearMin=2020&yearMax=2023                                │
│ • Chip: "Year: 2020 - 2023"                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Verification

### 1. Verify File Created

```bash
$ ls -la src/app/domain-config/automobile/configs/automobile.query-control-filters.ts
```

Expected: File exists.

### 2. Verify TypeScript Compilation

```bash
$ cd ~/projects/vvroom
$ npx tsc --noEmit src/app/domain-config/automobile/configs/automobile.query-control-filters.ts
```

Expected: No compilation errors.

### 3. Verify Filter Count

```bash
$ grep -c "field:" src/app/domain-config/automobile/configs/automobile.query-control-filters.ts
```

Expected: `5` (manufacturer, model, bodyClass, yearMin, modelCombos)

### 4. Verify Exports

```bash
$ grep "^export const" src/app/domain-config/automobile/configs/automobile.query-control-filters.ts
```

Expected: `export const AUTOMOBILE_QUERY_CONTROL_FILTERS`

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| "Cannot find module '../models/automobile.filters'" | Filters model not yet created | Ensure Phase 4 (document 401) is complete |
| Options not loading | API endpoint incorrect | Verify optionsEndpoint matches actual API |
| Transformer returns empty array | API response structure changed | Update optionsTransformer to match actual response |
| Chip shows "[object Object]" | Label not set correctly | Ensure optionsTransformer sets label property |
| Year filter shows commas | useGrouping not set to false | Set rangeConfig.useGrouping: false |

---

## Key Takeaways

1. **Query control filters are on-demand** — Users add them via dialog, unlike always-visible filter panel
2. **Options are fetched dynamically** — optionsEndpoint and optionsTransformer handle API integration
3. **URL params can differ from field names** — urlParams provides the URL-side mapping

---

## Acceptance Criteria

- [ ] `src/app/domain-config/automobile/configs/automobile.query-control-filters.ts` exists
- [ ] `AUTOMOBILE_QUERY_CONTROL_FILTERS` array contains 5 filter definitions
- [ ] Manufacturer, Model, Body Class filters are type 'multiselect'
- [ ] Year filter is type 'range' with rangeConfig
- [ ] Model Combinations filter handles nested API response structure
- [ ] Each filter has optionsEndpoint and optionsTransformer
- [ ] Each filter has urlParams for URL serialization
- [ ] File compiles without TypeScript errors

---

## Next Step

Proceed to `605-highlight-filters.md` to define highlight filter definitions for chart segmentation.
