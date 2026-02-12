# 601: Filter Definitions

**Status:** Planning
**Depends On:** 401-automobile-filters-model, 203-filter-definition-interface
**Blocks:** 604-query-control-filters, 607-domain-config-assembly

---

## Learning Objectives

After completing this section, you will:
- Understand how declarative filter definitions drive UI component generation
- Know how to configure different filter types (autocomplete, range, multiselect, text)
- Recognize the pattern of separating filter metadata from filter state

---

## Objective

Create the automobile filter definitions array that tells the Query Panel component which filters to display and how to configure them. These definitions are pure data — they describe what filters exist, not how to render them.

---

## Why

In traditional applications, you might create a separate component for each filter: ManufacturerFilterComponent, YearRangeFilterComponent, BodyClassFilterComponent. This approach leads to:

1. **Code duplication** — Each filter component has similar structure (label, input, validation)
2. **Tight coupling** — Adding a new filter requires writing new component code
3. **Inconsistent UX** — Different developers implement filters differently

The configuration-driven approach solves these problems:

1. **Single component, multiple instances** — One QueryPanelComponent renders all filters
2. **Loose coupling** — Adding a new filter means adding a new object to an array
3. **Consistent UX** — All filters use the same rendering logic

**This is the Phase 6 "Aha Moment":** Configuration is declarative code. You describe what you want, not how to get it. The filter definitions say "I need an autocomplete for manufacturer with these options" — they don't say "create an input element, attach a keyup listener, debounce for 300ms, call the API..."

### Angular Style Guide References

- [Style 03-01](https://angular.io/guide/styleguide#style-03-01): Use consistent naming for symbols
- Configuration objects are a recognized Angular pattern for customizing component behavior

---

## What

### Step 601.1: Create the Filter Definitions File

Create the file that will contain all automobile filter definitions.

Create `src/app/domain-config/automobile/configs/automobile.filter-definitions.ts`:

```typescript
// src/app/domain-config/automobile/configs/automobile.filter-definitions.ts

/**
 * Automobile Domain - Filter Definitions
 *
 * Defines query control filters for the automobile discovery interface.
 * These are UI filters that users can interact with to refine their search.
 *
 * Domain: Automobile Discovery
 */

import { FilterDefinition } from '../../../framework/models/filter-definition.interface';

/**
 * Automobile filter definitions
 *
 * Array of filter controls for the query panel.
 * Users can combine these filters to search for specific vehicles.
 *
 * @example
 * ```typescript
 * <div class="filter-panel">
 *   <app-filter-control
 *     *ngFor="let filter of AUTOMOBILE_FILTER_DEFINITIONS"
 *     [definition]="filter"
 *     [(value)]="filterValues[filter.id]">
 *   </app-filter-control>
 * </div>
 * ```
 */
export const AUTOMOBILE_FILTER_DEFINITIONS: FilterDefinition[] = [
  /**
   * Manufacturer filter
   */
  {
    id: 'manufacturer',
    label: 'Manufacturer',
    type: 'autocomplete',
    placeholder: 'Enter manufacturer name...',
    autocompleteEndpoint: 'filters/manufacturers',
    autocompleteMinChars: 1,
    operators: ['contains', 'equals', 'startsWith'],
    defaultOperator: 'contains',
    validation: {
      minLength: 1,
      maxLength: 100
    }
  },

  /**
   * Model filter
   *
   * Uses autocomplete with progressive refinement:
   * - User types 2+ characters
   * - Backend returns top 10 matching models
   * - Results narrow as user types more
   */
  {
    id: 'model',
    label: 'Model',
    type: 'autocomplete',
    placeholder: 'Type to search models...',
    autocompleteEndpoint: 'filters/models',
    autocompleteMinChars: 1,
    operators: ['contains', 'equals', 'startsWith'],
    defaultOperator: 'contains',
    validation: {
      minLength: 1,
      maxLength: 100
    }
  },

  /**
   * Year range filter
   *
   * Uses format.number.useGrouping: false to prevent thousand separators
   * (displays "1980" instead of "1,980")
   *
   * Note: id is 'year' so Query Panel looks for 'yearMin'/'yearMax' in currentFilters,
   * which matches the actual filter model field names (AutoSearchFilters.yearMin/yearMax)
   */
  {
    id: 'year',
    label: 'Year Range',
    type: 'range',
    min: 1900,
    max: new Date().getFullYear() + 1, // Include next year for upcoming models
    step: 1,
    format: {
      number: {
        useGrouping: false, // No commas in years
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }
    }
  },

  /**
   * Body class filter (multi-select)
   *
   * Uses optionsEndpoint to load options dynamically from the backend.
   * This ensures all body classes in the data are available as options.
   * Allows selecting multiple body classes with checkboxes.
   */
  {
    id: 'bodyClass',
    label: 'Body Class',
    type: 'multiselect',
    placeholder: 'Select body classes...',
    format: {
      caseSensitive: false, // Match "Coupe", "coupe", "COUPE" equally
      transform: 'titlecase' // Normalize to "Coupe" format
    },
    optionsEndpoint: 'body_class' // Loads from /api/specs/v1/agg/body_class
  },

  /**
   * Instance count range filter
   *
   * Uses format.number.useGrouping: true to show thousand separators
   * (displays "1,000" instead of "1000")
   */
  {
    id: 'instanceCountRange',
    label: 'VIN Count Range',
    type: 'range',
    min: 0,
    max: 10000,
    step: 1,
    format: {
      number: {
        useGrouping: true, // Show commas for VIN counts
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }
    }
  },

  /**
   * Global search filter
   */
  {
    id: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Search manufacturer, model, or body class...',
    operators: ['contains'],
    defaultOperator: 'contains',
    validation: {
      minLength: 1,
      maxLength: 200
    }
  }
];

/**
 * Quick filter presets
 *
 * Predefined filter combinations for common searches
 */
export const AUTOMOBILE_QUICK_FILTERS = {
  /**
   * Recent vehicles (last 5 years)
   */
  recent: {
    label: 'Recent Vehicles',
    filters: {
      yearMin: new Date().getFullYear() - 5,
      yearMax: new Date().getFullYear()
    }
  },

  /**
   * Popular vehicles (high instance count)
   */
  popular: {
    label: 'Popular Vehicles',
    filters: {
      instanceCountMin: 100
    }
  },

  /**
   * Classic vehicles (pre-2000)
   */
  classic: {
    label: 'Classic Vehicles',
    filters: {
      yearMax: 2000
    }
  },

  /**
   * SUVs only
   */
  suvs: {
    label: 'SUVs',
    filters: {
      bodyClass: 'SUV'
    }
  },

  /**
   * Trucks only
   */
  trucks: {
    label: 'Trucks',
    filters: {
      bodyClass: 'Truck'
    }
  },

  /**
   * Sedans only
   */
  sedans: {
    label: 'Sedans',
    filters: {
      bodyClass: 'Sedan'
    }
  }
};

/**
 * Filter groups
 *
 * Organize filters into logical groups for better UX
 */
export const AUTOMOBILE_FILTER_GROUPS = {
  /**
   * Vehicle identification filters
   */
  identification: {
    label: 'Vehicle Identification',
    filters: ['manufacturer', 'model', 'bodyClass']
  },

  /**
   * Time-based filters
   */
  temporal: {
    label: 'Year',
    filters: ['year']
  },

  /**
   * Quantity filters
   */
  quantity: {
    label: 'VIN Count',
    filters: ['instanceCountRange']
  },

  /**
   * General search
   */
  general: {
    label: 'General Search',
    filters: ['search']
  }
};

/**
 * Filter validation rules
 *
 * Additional validation beyond basic type validation
 */
export const AUTOMOBILE_FILTER_VALIDATION = {
  /**
   * Validate year range
   */
  yearRange: (min: number, max: number): boolean => {
    if (min && max && min > max) {
      return false; // Min cannot be greater than max
    }
    const currentYear = new Date().getFullYear();
    if (min && (min < 1900 || min > currentYear + 1)) {
      return false; // Year out of valid range
    }
    if (max && (max < 1900 || max > currentYear + 1)) {
      return false; // Year out of valid range
    }
    return true;
  },

  /**
   * Validate instance count range
   */
  instanceCountRange: (min: number, max: number): boolean => {
    if (min && max && min > max) {
      return false; // Min cannot be greater than max
    }
    if (min && min < 0) {
      return false; // Cannot be negative
    }
    if (max && max < 0) {
      return false; // Cannot be negative
    }
    return true;
  }
};
```

---

### Step 601.2: Understand the Filter Definition Structure

Each filter definition object follows this pattern:

| Property | Required | Description |
|----------|----------|-------------|
| `id` | Yes | Unique identifier, used as key in filter state |
| `label` | Yes | Display text shown to users |
| `type` | Yes | Filter type: 'autocomplete', 'text', 'range', 'multiselect' |
| `placeholder` | No | Placeholder text for input fields |
| `operators` | No | Comparison operators for text filters |
| `validation` | No | Validation rules (minLength, maxLength, pattern) |
| `format` | No | Number/date formatting options |
| `optionsEndpoint` | No | API endpoint for multiselect options |
| `autocompleteEndpoint` | No | API endpoint for autocomplete suggestions |

**Filter Types:**

| Type | Use Case | Example |
|------|----------|---------|
| `autocomplete` | Free text with suggestions | Manufacturer, Model |
| `text` | Free text without suggestions | Search |
| `range` | Numeric range (min/max) | Year, VIN Count |
| `multiselect` | Pick from list | Body Class |

---

### Step 601.3: Understanding the Quick Filters

Quick filters are predefined filter combinations that users can apply with one click:

```typescript
// Apply quick filter
applyQuickFilter(quickFilter: { label: string; filters: Partial<AutoSearchFilters> }) {
  this.resourceService.updateFilters(quickFilter.filters);
}
```

This pattern is useful for:
- Common search patterns (e.g., "Recent Vehicles")
- User onboarding (help new users discover filter capabilities)
- Power user shortcuts (reduce repetitive filter selection)

---

### Step 601.4: Understanding Filter Groups

Filter groups organize related filters in the UI:

```
┌─────────────────────────────────────────────────────────┐
│ Vehicle Identification                                   │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│ │ Manufacturer│ │    Model    │ │ Body Class  │        │
│ └─────────────┘ └─────────────┘ └─────────────┘        │
├─────────────────────────────────────────────────────────┤
│ Year                                                     │
│ ┌─────────────────────────────────────┐                 │
│ │          Year Range                  │                 │
│ └─────────────────────────────────────┘                 │
├─────────────────────────────────────────────────────────┤
│ VIN Count                                                │
│ ┌─────────────────────────────────────┐                 │
│ │        VIN Count Range               │                 │
│ └─────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────┘
```

---

## Verification

### 1. Verify File Created

```bash
$ cat src/app/domain-config/automobile/configs/automobile.filter-definitions.ts | head -20
```

Expected: First 20 lines of the file shown without errors.

### 2. Verify TypeScript Compilation

```bash
$ cd ~/projects/vvroom
$ npx tsc --noEmit src/app/domain-config/automobile/configs/automobile.filter-definitions.ts
```

Expected: No compilation errors.

### 3. Verify Export Count

```bash
$ grep "^export const" src/app/domain-config/automobile/configs/automobile.filter-definitions.ts | wc -l
```

Expected: `4` (AUTOMOBILE_FILTER_DEFINITIONS, AUTOMOBILE_QUICK_FILTERS, AUTOMOBILE_FILTER_GROUPS, AUTOMOBILE_FILTER_VALIDATION)

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| "Cannot find module '../../../framework/models/filter-definition.interface'" | Framework models not yet created | Ensure Phase 2 (document 203) is complete |
| TypeScript error on `FilterDefinition[]` | Interface doesn't match object shape | Verify filter objects match interface properties |
| `autocompleteEndpoint` unused | No autocomplete component consuming it | This is expected; components come in Phase 8 |
| Year shows as "2,024" | `useGrouping: true` in year format | Set `useGrouping: false` for year filters |

---

## Key Takeaways

1. **Configuration is data, not code** — Filter definitions are objects in an array, not component classes
2. **The framework interprets configuration** — QueryPanelComponent reads definitions and generates UI
3. **Adding filters is additive** — To add a new filter, add an object to the array; no component code needed

---

## Acceptance Criteria

- [ ] `src/app/domain-config/automobile/configs/automobile.filter-definitions.ts` exists
- [ ] `AUTOMOBILE_FILTER_DEFINITIONS` array contains 6 filter definitions
- [ ] Each filter has `id`, `label`, and `type` properties
- [ ] `AUTOMOBILE_QUICK_FILTERS` contains 6 presets (recent, popular, classic, suvs, trucks, sedans)
- [ ] `AUTOMOBILE_FILTER_GROUPS` organizes filters into 4 groups
- [ ] `AUTOMOBILE_FILTER_VALIDATION` contains validation functions for year and instance count ranges
- [ ] File compiles without TypeScript errors

---

## Next Step

Proceed to `602-table-config.md` to define the automobile results table configuration.
