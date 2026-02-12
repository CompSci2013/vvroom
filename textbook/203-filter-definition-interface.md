# 203: Filter Definition Interface

**Status:** Planning
**Depends On:** 201-domain-config-interface
**Blocks:** 601-filter-definitions, 806-query-panel-component

---

## Learning Objectives

After completing this section, you will:
- Understand how configuration objects define UI behavior without custom components
- Know how to use TypeScript generics to create type-safe filter definitions
- Recognize the relationship between filter definitions and URL state synchronization

---

## Objective

Create the `FilterDefinition` interface that defines how filters appear in the Query Control component. This interface specifies filter types, labels, URL parameter mappings, and range configurations — everything the framework needs to render appropriate filter UI.

---

## Why

The vvroom application has a powerful Query Control component that lets users filter data. But instead of hard-coding filter types for automobiles, we use **configuration-driven UI**.

Consider these automobile filters:
- **Manufacturer**: Multi-select dropdown (Toyota, Ford, Honda...)
- **Year Range**: Two number inputs (min/max)
- **Body Class**: Multi-select dropdown (Sedan, SUV, Truck...)
- **Model Search**: Text input with autocomplete

Each filter type requires different UI rendering. The `FilterDefinition` interface describes each filter's characteristics, and the Query Control component reads this configuration to render the appropriate UI.

**This is declarative programming:**

```typescript
// Declarative: describe WHAT you want
const yearFilter: FilterDefinition<AutomobileFilters> = {
  field: 'year',
  label: 'Model Year',
  type: 'range',
  urlParams: { min: 'yearMin', max: 'yearMax' },
  rangeConfig: {
    valueType: 'integer',
    minLabel: 'Start Year',
    maxLabel: 'End Year',
    defaultRange: { min: 1900, max: 2025 }
  }
};

// The framework figures out HOW to render it
```

Compare to imperative code where you'd write custom component logic for each filter type.

### URL-First Integration

Each `FilterDefinition` includes `urlParams` — the URL query parameter name(s) for this filter. This directly supports the URL-First architecture:

| Filter Type | urlParams Value | URL Example |
|-------------|-----------------|-------------|
| Multiselect | `'manufacturer'` | `?manufacturer=Ford,Toyota` |
| Range | `{ min: 'yearMin', max: 'yearMax' }` | `?yearMin=2020&yearMax=2024` |
| Text | `'model'` | `?model=Camry` |

---

## What

### Step 203.1: Create the Filter Definition Interface

Create the file `src/app/framework/models/filter-definition.interface.ts`:

```typescript
// src/app/framework/models/filter-definition.interface.ts
// VERSION 1 (Section 203) - Filter definition interfaces for Query Control

/**
 * Filter Definition Interface
 *
 * Defines the structure for filterable fields in the Query Control component.
 * This is domain-agnostic and works with any domain configuration.
 */

/**
 * Configuration for range-type filters
 *
 * Supports integer, decimal, and datetime ranges with flexible formatting.
 *
 * @example
 * ```typescript
 * // Year range (integer, no grouping)
 * rangeConfig: {
 *   valueType: 'integer',
 *   minLabel: 'Start Year',
 *   maxLabel: 'End Year',
 *   minPlaceholder: 'e.g., 1980',
 *   maxPlaceholder: 'e.g., 2023',
 *   step: 1,
 *   useGrouping: false,
 *   defaultRange: { min: 1900, max: new Date().getFullYear() }
 * }
 *
 * // Price range (decimal, with grouping)
 * rangeConfig: {
 *   valueType: 'decimal',
 *   minLabel: 'Min Price',
 *   maxLabel: 'Max Price',
 *   step: 0.01,
 *   decimalPlaces: 2,
 *   useGrouping: true,
 *   defaultRange: { min: 0, max: 1000000 }
 * }
 * ```
 */
export interface RangeConfig {
  /**
   * The type of values in the range
   * - 'integer': Whole numbers (years, counts)
   * - 'decimal': Floating point numbers (prices, measurements)
   * - 'datetime': Date/time values (ISO 8601 format)
   */
  valueType: 'integer' | 'decimal' | 'datetime';

  /**
   * Label for the minimum value input
   * @example "Start Year", "Min Price"
   */
  minLabel: string;

  /**
   * Label for the maximum value input
   * @example "End Year", "Max Price"
   */
  maxLabel: string;

  /**
   * Placeholder text for min input
   * @example "e.g., 1980"
   */
  minPlaceholder?: string;

  /**
   * Placeholder text for max input
   * @example "e.g., 2023"
   */
  maxPlaceholder?: string;

  /**
   * Step increment for numeric inputs
   * @default 1 for integer, 0.01 for decimal
   */
  step?: number;

  /**
   * Number of decimal places for 'decimal' type
   * @default 2
   */
  decimalPlaces?: number;

  /**
   * Whether to use thousand separators in display
   * Set to false for years to avoid "2,024"
   * @default false
   */
  useGrouping?: boolean;

  /**
   * Default min/max values when API doesn't provide them
   */
  defaultRange?: { min: number; max: number };
}

/**
 * Defines a filterable field in the domain
 *
 * This interface is used in DomainConfig.queryControlFilters array
 * to define all available filters for the Query Control component.
 *
 * @template T - The filter model type that contains these fields
 *
 * @example
 * ```typescript
 * // Multiselect filter for manufacturer
 * const manufacturerFilter: FilterDefinition<AutomobileFilters> = {
 *   field: 'manufacturer',
 *   label: 'Manufacturer',
 *   type: 'multiselect',
 *   optionsEndpoint: '/agg/manufacturers',
 *   urlParams: 'manufacturer',
 *   searchPlaceholder: 'Search manufacturers...',
 *   dialogTitle: 'Select Manufacturers'
 * };
 *
 * // Range filter for year
 * const yearFilter: FilterDefinition<AutomobileFilters> = {
 *   field: 'year',
 *   label: 'Model Year',
 *   type: 'range',
 *   urlParams: { min: 'yearMin', max: 'yearMax' },
 *   rangeConfig: {
 *     valueType: 'integer',
 *     minLabel: 'Start Year',
 *     maxLabel: 'End Year',
 *     useGrouping: false,
 *     defaultRange: { min: 1900, max: 2025 }
 *   }
 * };
 * ```
 */
export interface FilterDefinition<T = any> {
  /**
   * Unique field identifier matching a property in the filter model
   * Uses keyof T for type safety
   */
  field: keyof T;

  /**
   * Display label for the filter shown in Query Control component
   */
  label: string;

  /**
   * Filter type determines the UI component rendered
   * - 'multiselect': Dropdown with checkboxes
   * - 'range': Two inputs for min/max values
   * - 'text': Single text input
   * - 'date': Date picker
   */
  type: 'multiselect' | 'range' | 'text' | 'date';

  /**
   * API endpoint for fetching multiselect filter options
   * Relative to the domain's apiBaseUrl
   *
   * @example 'agg/manufacturers'
   * Fetches from: {apiBaseUrl}/agg/manufacturers
   */
  optionsEndpoint?: string;

  /**
   * Transformer function to convert API response to FilterOption[]
   * Required when API response doesn't match expected format
   *
   * @example
   * optionsTransformer: (response) => response.values.map(v => ({
   *   value: v.name,
   *   label: v.name,
   *   count: v.count
   * }))
   */
  optionsTransformer?: (response: any) => FilterOption[];

  /**
   * URL parameter name(s) for state synchronization
   *
   * For simple filters (text, multiselect): string
   * For range filters: object with min and max keys
   *
   * @example
   * urlParams: 'manufacturer'           // ?manufacturer=Ford,Toyota
   * urlParams: { min: 'yearMin', max: 'yearMax' }  // ?yearMin=2020&yearMax=2024
   */
  urlParams: string | { min: string; max: string };

  /**
   * Placeholder text for search box in multiselect dialogs
   */
  searchPlaceholder?: string;

  /**
   * Subtitle text shown in filter dialog/modal
   */
  dialogSubtitle?: string;

  /**
   * Title for the filter dialog
   * @default "Select {label}"
   */
  dialogTitle?: string;

  /**
   * Configuration for type='range' filters
   * Required when type is 'range'
   */
  rangeConfig?: RangeConfig;
}

/**
 * Option for multiselect filters
 *
 * Represents a single selectable option in a multiselect dropdown.
 *
 * @example
 * ```typescript
 * // API response format (from /agg/manufacturers endpoint)
 * {
 *   field: "manufacturer",
 *   values: [
 *     { value: "Toyota", label: "Toyota", count: 1543 },
 *     { value: "Honda", label: "Honda", count: 1234 },
 *     { value: "Ford", label: "Ford", count: 987 }
 *   ]
 * }
 * ```
 */
export interface FilterOption {
  /**
   * The actual value used when filter is selected
   * Sent to API and stored in URL
   */
  value: string | number;

  /**
   * Display text shown to user in dropdown
   */
  label: string;

  /**
   * Optional count of items matching this option
   * Displayed as badge: "Toyota (1,543)"
   */
  count?: number;
}

/**
 * Default transformer for standard API aggregation responses
 *
 * Converts the standard aggregation response format to FilterOption[].
 * Use this when your API returns the expected format.
 *
 * @param response - API response with { field, values } structure
 * @returns Array of FilterOption objects
 *
 * @example
 * ```typescript
 * // API response:
 * { field: "manufacturer", values: [{ value: "Ford", count: 100 }] }
 *
 * // Result:
 * [{ value: "Ford", label: "Ford", count: 100 }]
 * ```
 */
export function defaultOptionsTransformer(response: {
  field: string;
  values: Array<{ value: string | number; count?: number }>;
}): FilterOption[] {
  return response.values.map((v) => ({
    value: v.value,
    label: String(v.value),
    count: v.count
  }));
}

/**
 * Get URL parameter names from a filter definition
 *
 * Utility function to extract URL parameter names regardless of format.
 *
 * @param filter - Filter definition
 * @returns Array of URL parameter names
 *
 * @example
 * ```typescript
 * getUrlParamNames({ urlParams: 'manufacturer' }) // ['manufacturer']
 * getUrlParamNames({ urlParams: { min: 'yearMin', max: 'yearMax' } }) // ['yearMin', 'yearMax']
 * ```
 */
export function getUrlParamNames(filter: FilterDefinition): string[] {
  if (typeof filter.urlParams === 'string') {
    return [filter.urlParams];
  }
  return [filter.urlParams.min, filter.urlParams.max];
}

/**
 * Check if a filter definition is a range filter
 *
 * @param filter - Filter definition
 * @returns True if filter type is 'range'
 */
export function isRangeFilter(filter: FilterDefinition): boolean {
  return filter.type === 'range';
}

/**
 * Check if a filter definition has URL range params
 *
 * @param urlParams - URL params from filter definition
 * @returns True if urlParams is a min/max object
 */
export function hasRangeUrlParams(
  urlParams: string | { min: string; max: string }
): urlParams is { min: string; max: string } {
  return typeof urlParams === 'object' && 'min' in urlParams && 'max' in urlParams;
}
```

---

### Step 203.2: Update the Barrel Export

Update `src/app/framework/models/index.ts` to include the new interface:

```typescript
// src/app/framework/models/index.ts

// This barrel file exports all framework model interfaces.
// Import from '@app/framework/models' instead of individual files.

export * from './domain-config.interface';
export * from './resource-management.interface';
export * from './filter-definition.interface';
```

---

### Step 203.3: Understand Filter Types

The `FilterDefinition` interface supports four filter types:

| Type | UI Component | URL Example | Use Case |
|------|--------------|-------------|----------|
| `multiselect` | Dropdown with checkboxes | `?manufacturer=Ford,Toyota` | Categorical data with known options |
| `range` | Two number inputs | `?yearMin=2020&yearMax=2024` | Numeric or date ranges |
| `text` | Single text input | `?model=Camry` | Free-form text search |
| `date` | Date picker | `?date=2024-01-15` | Single date selection |

**Multiselect filters** fetch options from an API endpoint. The `optionsEndpoint` specifies where to get the list, and `optionsTransformer` converts the response to `FilterOption[]` format.

**Range filters** require `rangeConfig` to specify:
- Value type (integer, decimal, datetime)
- Labels for min/max inputs
- Formatting options (decimal places, grouping)
- Default range when API doesn't provide bounds

---

### Step 203.4: Example Automobile Filter Configuration

Here's how automobile filters would be configured (you'll create this in Phase 6):

```typescript
// Preview: src/app/domain-config/automobile/configs/automobile.query-control-filters.ts

import { FilterDefinition } from '@app/framework/models';
import { AutomobileFilters } from '../models/automobile.filters';

export const AUTOMOBILE_QUERY_CONTROL_FILTERS: FilterDefinition<AutomobileFilters>[] = [
  {
    field: 'manufacturer',
    label: 'Manufacturer',
    type: 'multiselect',
    optionsEndpoint: 'agg/manufacturer',
    urlParams: 'manufacturer',
    searchPlaceholder: 'Search manufacturers...',
    dialogTitle: 'Select Manufacturers'
  },
  {
    field: 'year',
    label: 'Model Year',
    type: 'range',
    urlParams: { min: 'yearMin', max: 'yearMax' },
    rangeConfig: {
      valueType: 'integer',
      minLabel: 'Start Year',
      maxLabel: 'End Year',
      minPlaceholder: 'e.g., 1980',
      maxPlaceholder: 'e.g., 2024',
      step: 1,
      useGrouping: false,
      defaultRange: { min: 1900, max: new Date().getFullYear() }
    }
  },
  {
    field: 'bodyClass',
    label: 'Body Class',
    type: 'multiselect',
    optionsEndpoint: 'agg/body_class',
    urlParams: 'bodyClass',
    searchPlaceholder: 'Search body types...'
  }
];
```

This configuration tells the Query Control component exactly what to render without any custom code.

---

## Verification

### 1. Check File Exists

```bash
$ ls -la src/app/framework/models/filter-definition.interface.ts
```

Expected output shows the file exists.

### 2. TypeScript Compilation Check

```bash
$ cd ~/projects/vvroom
$ npx tsc --noEmit src/app/framework/models/filter-definition.interface.ts
```

Expected: No output (no compilation errors).

### 3. Verify Exports

```bash
$ grep "^export" src/app/framework/models/filter-definition.interface.ts
```

Expected output:

```
export interface RangeConfig {
export interface FilterDefinition<T = any> {
export interface FilterOption {
export function defaultOptionsTransformer(response: {
export function getUrlParamNames(filter: FilterDefinition): string[] {
export function isRangeFilter(filter: FilterDefinition): boolean {
export function hasRangeUrlParams(
```

### 4. Verify Barrel Export

```bash
$ grep "filter-definition" src/app/framework/models/index.ts
```

Expected output:

```
export * from './filter-definition.interface';
```

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| `Type 'keyof T' cannot be used` | TypeScript version too old | Ensure TypeScript 4.x or higher |
| Range filter not rendering | Missing `rangeConfig` property | Add `rangeConfig` when `type: 'range'` |
| Options not loading | Wrong `optionsEndpoint` value | Check API endpoint path is correct |
| Filter not updating URL | Wrong `urlParams` value | Verify URL param name matches expected |
| Type error on `urlParams` | Using wrong format | Use string for simple, object for range |

---

## Key Takeaways

1. **Configuration-driven UI eliminates custom components** — Define filter behavior in configuration, not code
2. **TypeScript generics ensure type safety** — `FilterDefinition<T>` validates that `field` matches a property in T
3. **URL parameter mapping enables URL-First architecture** — Each filter knows exactly which URL params it controls

---

## Acceptance Criteria

- [ ] `src/app/framework/models/filter-definition.interface.ts` exists
- [ ] `FilterDefinition<T>` interface is generic with type-safe `field` property
- [ ] `RangeConfig` interface defines all range filter options
- [ ] `FilterOption` interface defines multiselect option structure
- [ ] `urlParams` property supports both string and min/max object formats
- [ ] Utility functions `getUrlParamNames`, `isRangeFilter`, `hasRangeUrlParams` are implemented
- [ ] `defaultOptionsTransformer` function handles standard API response format
- [ ] Barrel file exports all filter definition types
- [ ] TypeScript compilation succeeds with no errors
- [ ] All interfaces have JSDoc documentation with examples

---

## Next Step

Proceed to `204-table-config-interface.md` to define the table configuration interface for displaying results.
