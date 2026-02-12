# 502: URL Mapper Adapter

**Status:** Complete
**Depends On:** 501-domain-adapter-pattern, 403-domain-filter-statistics-models
**Blocks:** 503-api-adapter, Phase 8 (Framework Components)

---

## Learning Objectives

After completing this section, you will:
- Understand how to map domain filters to URL query parameters
- Know how to handle bidirectional type conversion (strings ↔ numbers)
- Recognize the importance of parameter naming consistency (URL ↔ API)
- Be able to implement highlight filter extraction for chart segmentation

---

## Objective

Create the `AutomobileUrlMapper` that provides bidirectional conversion between `AutoSearchFilters` objects and URL query parameters. This adapter enables URL-First state management for the automobile domain.

---

## Why

The URL-First architecture stores application state in the URL. When a user applies filters:

1. **Filter object created:** `{ manufacturer: 'Toyota', yearMin: 2020, page: 1 }`
2. **URL updated:** `?manufacturer=Toyota&yearMin=2020&page=1`
3. **URL is shareable:** Copy/paste the URL to share the exact filter state

When a user navigates to a URL with parameters:

1. **URL parsed:** `?manufacturer=Toyota&yearMin=2020`
2. **Filter object created:** `{ manufacturer: 'Toyota', yearMin: 2020 }`
3. **Data fetched:** API called with filter values

### Bidirectional Mapping

The URL mapper handles two directions:

| Direction | Method | Purpose |
|-----------|--------|---------|
| Filters → URL | `toUrlParams()` | Generate URL from filter state |
| URL → Filters | `fromUrlParams()` | Parse URL into filter state |

### Type Conversion

URL parameters are always strings. Filter objects have typed fields:

```typescript
// URL: ?yearMin=2020&page=1
// Params: { yearMin: '2020', page: '1' }

// Filter object needs:
// { yearMin: 2020, page: 1 } (numbers, not strings)
```

The mapper handles:
- **String → Number:** `'2020'` → `2020`
- **Number → String:** `2020` → `'2020'`
- **Array → String:** `['Sedan', 'SUV']` → `'Sedan,SUV'`
- **String → Array:** `'Sedan,SUV'` → `['Sedan', 'SUV']`

### Parameter Naming

URL parameters should match API parameters for consistency:

```
URL:     ?yearMin=2020&yearMax=2024&sortBy=manufacturer
API:     GET /vehicles?yearMin=2020&yearMax=2024&sortBy=manufacturer
```

This allows the URL to be directly usable as API query string (with minor adjustments).

### Highlight Filters

For chart highlighting, the mapper extracts `h_` prefixed parameters:

```
URL: ?manufacturer=Toyota&h_yearMin=2022&h_yearMax=2024
```

Extracted highlights: `{ yearMin: 2022, yearMax: 2024 }`

These are sent to the API for segmented statistics: `{ total: 234, highlighted: 45 }`

---

## What

### Step 502.1: Create the URL Mapper

Create the file `src/app/domains/automobile/adapters/automobile-url-mapper.ts`:

```typescript
// src/app/domains/automobile/adapters/automobile-url-mapper.ts
// VERSION 1 (Section 502) - Automobile URL mapper adapter

import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { IFilterUrlMapper } from '../../../framework/models/resource-management.interface';
import { AutoSearchFilters } from '../models/automobile.filters';

/**
 * Automobile filter URL mapper
 *
 * Bidirectional conversion between filter objects and URL query parameters.
 * URL parameter names match backend API parameter names (camelCase).
 *
 * **URL Parameter Mapping:**
 * - manufacturer → manufacturer
 * - model → model
 * - yearMin → yearMin
 * - yearMax → yearMax
 * - bodyClass → bodyClass
 * - page → page
 * - size → size
 * - sortBy → sort (filter property)
 * - sortOrder → sortDirection (filter property)
 *
 * **Highlight Parameters:**
 * - h_yearMin, h_yearMax, h_manufacturer, etc.
 *
 * @example
 * ```typescript
 * const mapper = new AutomobileUrlMapper();
 *
 * // To URL
 * const filters = new AutoSearchFilters({
 *   manufacturer: 'Toyota',
 *   yearMin: 2020,
 *   page: 1
 * });
 * const params = mapper.toUrlParams(filters);
 * // { manufacturer: 'Toyota', yearMin: '2020', page: '1' }
 *
 * // From URL
 * const urlParams = { manufacturer: 'Toyota', yearMin: '2020', page: '1' };
 * const filters = mapper.fromUrlParams(urlParams);
 * // AutoSearchFilters { manufacturer: 'Toyota', yearMin: 2020, page: 1 }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class AutomobileUrlMapper implements IFilterUrlMapper<AutoSearchFilters> {
  /**
   * URL parameter names (match backend API parameter names)
   */
  private readonly PARAM_NAMES = {
    manufacturer: 'manufacturer',
    model: 'model',
    yearMin: 'yearMin',
    yearMax: 'yearMax',
    bodyClass: 'bodyClass',
    instanceCountMin: 'instanceCountMin',
    instanceCountMax: 'instanceCountMax',
    search: 'search',
    modelCombos: 'modelCombos',
    page: 'page',
    size: 'size',
    sort: 'sortBy',
    sortDirection: 'sortOrder'
  };

  /**
   * Convert filters to URL query parameters
   *
   * Maps filter object fields to URL parameter names.
   * Only includes non-null/undefined values.
   * Converts all values to strings for URL compatibility.
   *
   * @param filters - Filter object
   * @returns URL query parameters
   */
  toUrlParams(filters: AutoSearchFilters): Params {
    const params: Params = {};

    // Search filters
    if (filters.manufacturer !== undefined && filters.manufacturer !== null) {
      params[this.PARAM_NAMES.manufacturer] = filters.manufacturer;
    }

    if (filters.model !== undefined && filters.model !== null) {
      params[this.PARAM_NAMES.model] = filters.model;
    }

    if (filters.yearMin !== undefined && filters.yearMin !== null) {
      params[this.PARAM_NAMES.yearMin] = String(filters.yearMin);
    }

    if (filters.yearMax !== undefined && filters.yearMax !== null) {
      params[this.PARAM_NAMES.yearMax] = String(filters.yearMax);
    }

    if (filters.bodyClass !== undefined && filters.bodyClass !== null) {
      // Handle array values (multiselect) - join with comma
      if (Array.isArray(filters.bodyClass)) {
        if (filters.bodyClass.length > 0) {
          params[this.PARAM_NAMES.bodyClass] = filters.bodyClass.join(',');
        }
      } else {
        params[this.PARAM_NAMES.bodyClass] = filters.bodyClass;
      }
    }

    if (filters.instanceCountMin !== undefined && filters.instanceCountMin !== null) {
      params[this.PARAM_NAMES.instanceCountMin] = String(filters.instanceCountMin);
    }

    if (filters.instanceCountMax !== undefined && filters.instanceCountMax !== null) {
      params[this.PARAM_NAMES.instanceCountMax] = String(filters.instanceCountMax);
    }

    if (filters.search !== undefined && filters.search !== null) {
      params[this.PARAM_NAMES.search] = filters.search;
    }

    if (filters.modelCombos !== undefined && filters.modelCombos !== null) {
      params[this.PARAM_NAMES.modelCombos] = filters.modelCombos;
    }

    // Pagination
    if (filters.page !== undefined && filters.page !== null) {
      params[this.PARAM_NAMES.page] = String(filters.page);
    }

    if (filters.size !== undefined && filters.size !== null) {
      params[this.PARAM_NAMES.size] = String(filters.size);
    }

    // Sorting
    if (filters.sort !== undefined && filters.sort !== null) {
      params[this.PARAM_NAMES.sort] = filters.sort;
    }

    if (filters.sortDirection !== undefined && filters.sortDirection !== null) {
      params[this.PARAM_NAMES.sortDirection] = filters.sortDirection;
    }

    return params;
  }

  /**
   * Convert URL query parameters to filters
   *
   * Maps URL parameter names back to filter object fields.
   * Performs type conversion (strings to numbers).
   * Returns filter object with only defined values.
   *
   * @param params - URL query parameters
   * @returns Filter object
   */
  fromUrlParams(params: Params): AutoSearchFilters {
    const filters = new AutoSearchFilters();

    // Search filters
    if (params[this.PARAM_NAMES.manufacturer]) {
      filters.manufacturer = String(params[this.PARAM_NAMES.manufacturer]);
    }

    if (params[this.PARAM_NAMES.model]) {
      filters.model = String(params[this.PARAM_NAMES.model]);
    }

    if (params[this.PARAM_NAMES.yearMin]) {
      const value = this.parseNumber(params[this.PARAM_NAMES.yearMin]);
      if (value !== null) {
        filters.yearMin = value;
      }
    }

    if (params[this.PARAM_NAMES.yearMax]) {
      const value = this.parseNumber(params[this.PARAM_NAMES.yearMax]);
      if (value !== null) {
        filters.yearMax = value;
      }
    }

    if (params[this.PARAM_NAMES.bodyClass]) {
      const bodyClassParam = String(params[this.PARAM_NAMES.bodyClass]);
      // Check if it contains comma (multiple values)
      if (bodyClassParam.includes(',')) {
        filters.bodyClass = bodyClassParam.split(',').map(v => v.trim());
      } else {
        // Single value - return as array for consistency with multiselect
        filters.bodyClass = [bodyClassParam];
      }
    }

    if (params[this.PARAM_NAMES.instanceCountMin]) {
      const value = this.parseNumber(params[this.PARAM_NAMES.instanceCountMin]);
      if (value !== null) {
        filters.instanceCountMin = value;
      }
    }

    if (params[this.PARAM_NAMES.instanceCountMax]) {
      const value = this.parseNumber(params[this.PARAM_NAMES.instanceCountMax]);
      if (value !== null) {
        filters.instanceCountMax = value;
      }
    }

    if (params[this.PARAM_NAMES.search]) {
      filters.search = String(params[this.PARAM_NAMES.search]);
    }

    if (params[this.PARAM_NAMES.modelCombos]) {
      filters.modelCombos = String(params[this.PARAM_NAMES.modelCombos]);
    }

    // Pagination
    if (params[this.PARAM_NAMES.page]) {
      const value = this.parseNumber(params[this.PARAM_NAMES.page]);
      if (value !== null) {
        filters.page = value;
      }
    }

    if (params[this.PARAM_NAMES.size]) {
      const value = this.parseNumber(params[this.PARAM_NAMES.size]);
      if (value !== null) {
        filters.size = value;
      }
    }

    // Sorting
    if (params[this.PARAM_NAMES.sort]) {
      filters.sort = String(params[this.PARAM_NAMES.sort]);
    }

    if (params[this.PARAM_NAMES.sortDirection]) {
      const direction = String(params[this.PARAM_NAMES.sortDirection]);
      if (direction === 'asc' || direction === 'desc') {
        filters.sortDirection = direction;
      }
    }

    return filters;
  }

  /**
   * Extract highlight filters from URL parameters
   *
   * Looks for 'h_' prefixed parameters for chart highlighting.
   * These enable segmented statistics (total vs highlighted).
   *
   * @param params - URL query parameters
   * @returns Highlight filters object
   */
  extractHighlights(params: Params): Record<string, any> {
    const highlights: Record<string, any> = {};
    const prefix = 'h_';

    Object.keys(params).forEach(key => {
      if (key.startsWith(prefix)) {
        const highlightKey = key.substring(prefix.length);
        let value = params[key];

        // Normalize separators: Convert pipes to commas
        if (typeof value === 'string' && value.includes('|')) {
          value = value.replace(/\|/g, ',');
        }

        highlights[highlightKey] = value;
      }
    });

    return highlights;
  }

  /**
   * Parse number from URL parameter value
   *
   * @param value - URL parameter value
   * @returns Parsed number or null
   */
  private parseNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  /**
   * Get parameter name mapping
   *
   * @returns Parameter name mapping object
   */
  getParameterMapping(): Record<string, string> {
    return { ...this.PARAM_NAMES };
  }

  /**
   * Build shareable URL from filters
   *
   * @param baseUrl - Base URL (e.g., '/discover')
   * @param filters - Filter object
   * @returns Complete URL with query parameters
   */
  buildShareableUrl(baseUrl: string, filters: AutoSearchFilters): string {
    const params = this.toUrlParams(filters);
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Validate URL parameters
   *
   * @param params - URL query parameters
   * @returns Validation result with errors
   */
  validateUrlParams(params: Params): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check numeric fields
    const numericFields = [
      this.PARAM_NAMES.yearMin,
      this.PARAM_NAMES.yearMax,
      this.PARAM_NAMES.instanceCountMin,
      this.PARAM_NAMES.instanceCountMax,
      this.PARAM_NAMES.page,
      this.PARAM_NAMES.size
    ];

    numericFields.forEach(field => {
      if (params[field] !== undefined && params[field] !== null) {
        const value = this.parseNumber(params[field]);
        if (value === null) {
          errors.push(`Invalid numeric value for ${field}: ${params[field]}`);
        }
      }
    });

    // Check sort direction
    if (params[this.PARAM_NAMES.sortDirection]) {
      const direction = String(params[this.PARAM_NAMES.sortDirection]);
      if (direction !== 'asc' && direction !== 'desc') {
        errors.push(`Invalid sort direction: ${direction}. Must be 'asc' or 'desc'.`);
      }
    }

    // Check year range
    if (params[this.PARAM_NAMES.yearMin] && params[this.PARAM_NAMES.yearMax]) {
      const min = this.parseNumber(params[this.PARAM_NAMES.yearMin]);
      const max = this.parseNumber(params[this.PARAM_NAMES.yearMax]);
      if (min !== null && max !== null && min > max) {
        errors.push(`Year minimum (${min}) cannot be greater than maximum (${max})`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

---

### Step 502.2: Update the Barrel File

Update `src/app/domains/automobile/adapters/index.ts`:

```typescript
// src/app/domains/automobile/adapters/index.ts
// VERSION 2 (Section 502) - Added URL mapper

export * from './automobile-url-mapper';

// API Adapter (Section 503)
// export * from './automobile-api.adapter';

// Cache Key Builder (Section 503)
// export * from './automobile-cache-key.builder';
```

---

## Verification

### 1. Check File Exists

```bash
$ ls -la src/app/domains/automobile/adapters/automobile-url-mapper.ts
```

### 2. TypeScript Compilation Check

```bash
$ npx tsc --noEmit src/app/domains/automobile/adapters/automobile-url-mapper.ts
```

### 3. Test Mapping

```typescript
import { AutomobileUrlMapper } from '@app/domains/automobile/adapters';
import { AutoSearchFilters } from '@app/domains/automobile/models';

const mapper = new AutomobileUrlMapper();

// Test toUrlParams
const filters = new AutoSearchFilters({
  manufacturer: 'Toyota',
  yearMin: 2020,
  yearMax: 2024,
  bodyClass: ['Sedan', 'SUV'],
  page: 1,
  size: 20
});

const params = mapper.toUrlParams(filters);
console.log('URL params:', params);
// { manufacturer: 'Toyota', yearMin: '2020', yearMax: '2024',
//   bodyClass: 'Sedan,SUV', page: '1', size: '20' }

// Test fromUrlParams
const urlParams = {
  manufacturer: 'Honda',
  yearMin: '2022',
  page: '2'
};

const parsedFilters = mapper.fromUrlParams(urlParams);
console.log('Parsed filters:', parsedFilters);
// AutoSearchFilters { manufacturer: 'Honda', yearMin: 2022, page: 2 }

// Test highlight extraction
const highlightParams = {
  manufacturer: 'Ford',
  h_yearMin: '2023',
  h_yearMax: '2024'
};

const highlights = mapper.extractHighlights(highlightParams);
console.log('Highlights:', highlights);
// { yearMin: '2023', yearMax: '2024' }
```

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| Numbers come back as strings | Missing `parseNumber()` call | Use `parseNumber()` for numeric fields |
| Array comes back as string | Missing comma split | Check for comma and split |
| Highlight params not extracted | Wrong prefix check | Ensure `h_` prefix matching |
| Empty string in URL | Null/undefined not filtered | Check for null/undefined before adding |

---

## Key Takeaways

1. **Bidirectional mapping is essential** — Filters ↔ URL must work both ways
2. **Type conversion is critical** — URL strings must become proper types
3. **Parameter naming matters** — Consistency between URL and API simplifies debugging
4. **Highlight extraction enables charts** — `h_` prefix separates highlight from filter params

---

## Acceptance Criteria

- [ ] `src/app/domains/automobile/adapters/automobile-url-mapper.ts` exists
- [ ] Implements `IFilterUrlMapper<AutoSearchFilters>` interface
- [ ] `toUrlParams()` converts all filter fields to URL params
- [ ] `fromUrlParams()` parses all URL params to filter fields
- [ ] Numeric fields properly converted (string ↔ number)
- [ ] Array fields properly handled (bodyClass multiselect)
- [ ] `extractHighlights()` finds `h_` prefixed params
- [ ] Validation method checks for invalid values
- [ ] Barrel file exports the mapper
- [ ] TypeScript compilation succeeds
- [ ] JSDoc comments on all public methods

---

## Next Step

Proceed to `503-api-adapter.md` to implement the automobile API adapter.
