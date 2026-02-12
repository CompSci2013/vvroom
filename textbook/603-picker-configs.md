# 603: Picker Configs

**Status:** Planning
**Depends On:** 205-picker-config-interface, 302-api-service
**Blocks:** 607-domain-config-assembly

---

## Learning Objectives

After completing this section, you will:
- Understand the picker pattern for selecting related data from searchable tables
- Know how to configure server-side pagination for large option sets
- Recognize URL serialization patterns for complex multi-value selections

---

## Objective

Create the automobile picker configuration for selecting manufacturer-model combinations. Pickers are searchable, paginated tables that allow users to select one or more items from a large dataset.

---

## Why

Simple dropdowns work for small option sets (10-50 items). But what happens when you have:

- 2,000+ manufacturers
- 50,000+ manufacturer-model combinations
- Options that change frequently (new models added)

Loading all options into a dropdown is impractical:

```html
<!-- Anti-pattern: Loading 50,000 options into a dropdown -->
<select>
  <option *ngFor="let combo of allCombinations">
    {{ combo.manufacturer }}: {{ combo.model }}
  </option>
</select>
```

Problems:
1. **Slow initial load** — Fetching 50,000 items takes seconds
2. **Poor UX** — Scrolling through 50,000 items is unusable
3. **Memory bloat** — 50,000 DOM elements consume significant memory

The picker pattern solves this:

```
┌─────────────────────────────────────────────────────────────────┐
│ Select Manufacturer & Model                                [X]  │
├─────────────────────────────────────────────────────────────────┤
│ [Search: Toyota Cam____________________]                         │
├─────────────────────────────────────────────────────────────────┤
│ [ ] Manufacturer          Model                  Count          │
├─────────────────────────────────────────────────────────────────┤
│ [x] Toyota                Camry                  1,234          │
│ [x] Toyota                Camry Hybrid           567            │
│ [ ] Toyota                Camry Solara           89             │
│ [ ] Toyota                Camry XLE              234            │
├─────────────────────────────────────────────────────────────────┤
│ Showing 1-20 of 47 results        [<] [1] [2] [3] [>]           │
├─────────────────────────────────────────────────────────────────┤
│                              [Cancel]  [Apply 2 Selected]        │
└─────────────────────────────────────────────────────────────────┘
```

Benefits:
1. **Server-side pagination** — Only 20 items loaded at a time
2. **Search** — Type to filter without loading all options
3. **Multi-select** — Check multiple items before applying

### Angular Style Guide References

- [Style 05-14](https://angular.io/guide/styleguide#style-05-14): Put complex logic in services
- Picker configuration keeps selection logic in configuration, not component code

---

## What

### Step 603.1: Create the Picker Configurations File

Create the file that will define automobile picker configurations.

Create `src/app/domain-config/automobile/configs/automobile.picker-configs.ts`:

```typescript
// src/app/domain-config/automobile/configs/automobile.picker-configs.ts

/**
 * Automobile Domain - Picker Configurations
 *
 * Defines picker components for selecting related data.
 * Pickers are searchable tables with multi-select capabilities.
 *
 * Domain: Automobile Discovery
 */

import { PickerConfig } from '../../../framework/models/picker-config.interface';
import { Injector } from '@angular/core';
import { ApiService } from '../../../framework/services';
import { environment } from '../../../environments/environment';

/**
 * Manufacturer/Model row data type
 *
 * Represents a manufacturer-model combination with count
 */
export interface ManufacturerModelRow {
  /**
   * Manufacturer name (e.g., "Toyota", "Honda", "BMW")
   */
  manufacturer: string;

  /**
   * Vehicle model name (e.g., "Camry", "Civic", "X5")
   */
  model: string;

  /**
   * Number of vehicles matching this manufacturer-model combination
   */
  count: number;
}

/**
 * Create Manufacturer-Model Picker Configuration
 *
 * Factory function that creates picker config with injected dependencies.
 * Allows selection of manufacturer-model combinations for filtering.
 *
 * @param apiService - Injected API service
 * @param configId - Unique config ID for this picker instance
 * @returns Configured picker
 */
export function createManufacturerModelPickerConfig(
  apiService: ApiService,
  configId: string = 'manufacturer-model-picker'
): PickerConfig<ManufacturerModelRow> {
  return {
    id: configId,
    displayName: 'Select Manufacturer & Model',

    // Column definitions (PrimeNGColumn format)
    columns: [
      {
        field: 'manufacturer',
        header: 'Manufacturer',
        sortable: true,
        filterable: true,
        width: '40%'
      },
      {
        field: 'model',
        header: 'Model',
        sortable: true,
        filterable: true,
        width: '40%'
      },
      {
        field: 'count',
        header: 'Count',
        sortable: true,
        filterable: false,
        width: '20%'
      }
    ],

    // API configuration
    // Server-side pagination: API returns { data, total, page, size, totalPages }
    api: {
      fetchData: (params) => {
        const endpoint = `${environment.apiBaseUrl}/manufacturer-model-combinations`;
        return apiService.get<any>(endpoint, {
          params: {
            page: params.page + 1, // API is 1-indexed, picker is 0-indexed
            size: params.size,
            search: params.search || undefined,
            sortBy: params.sortField || 'manufacturer',
            sortOrder: params.sortOrder === -1 ? 'desc' : 'asc'
          }
        });
      },

      responseTransformer: (response) => {
        return {
          results: response.data || [],
          total: response.total || 0,
          page: response.page,
          size: response.size,
          totalPages: response.totalPages
        };
      }
    },

    // Row key configuration
    row: {
      keyGenerator: (row) => `${row.manufacturer}:${row.model}`,
      keyParser: (key) => {
        const [manufacturer, model] = key.split(':');
        return { manufacturer, model } as Partial<ManufacturerModelRow>;
      }
    },

    // Selection configuration
    selection: {
      mode: 'multiple',
      urlParam: 'modelCombos',

      // Serialize selected items to URL
      serializer: (items) => {
        if (!items || items.length === 0) return '';
        return items.map(item => `${item.manufacturer}:${item.model}`).join(',');
      },

      // Deserialize URL to partial items (for hydration)
      deserializer: (urlValue) => {
        if (!urlValue) return [];
        return urlValue.split(',').map(combo => {
          const [manufacturer, model] = combo.split(':');
          return { manufacturer, model } as Partial<ManufacturerModelRow>;
        });
      },

      // Optional: Custom key generator (defaults to row.keyGenerator)
      keyGenerator: (item) => `${item.manufacturer}:${item.model}`
    },

    // Pagination configuration
    // Server-side pagination: fetches only current page from API
    pagination: {
      mode: 'server',
      defaultPageSize: 20,
      pageSizeOptions: [10, 20, 50, 100]
    },

    // Search configuration
    showSearch: true,
    searchPlaceholder: 'Search manufacturer or model...'
  };
}

/**
 * Register all automobile picker configurations
 *
 * @param injector - Angular injector for dependency resolution
 * @param configIdPrefix - Optional prefix to make config IDs unique per page
 * @returns Array of picker configurations
 */
export function createAutomobilePickerConfigs(injector: Injector, configIdPrefix?: string): PickerConfig<any>[] {
  const apiService = injector.get(ApiService);
  const pickerId = configIdPrefix
    ? `${configIdPrefix}-manufacturer-model-picker`
    : 'manufacturer-model-picker';

  return [
    createManufacturerModelPickerConfig(apiService, pickerId)
    // Add more pickers here as needed
  ];
}

/**
 * Static export for backwards compatibility
 * Populated dynamically by domain config factory
 */
export const AUTOMOBILE_PICKER_CONFIGS: PickerConfig<any>[] = [];
```

---

### Step 603.2: Understand the Picker Configuration Structure

Each picker configuration has several key sections:

**Identity:**
```typescript
{
  id: 'manufacturer-model-picker',
  displayName: 'Select Manufacturer & Model'
}
```

**Column Definitions:**
```typescript
columns: [
  { field: 'manufacturer', header: 'Manufacturer', sortable: true, width: '40%' }
]
```

**API Configuration:**
```typescript
api: {
  fetchData: (params) => { /* Call API with page, size, search, sort */ },
  responseTransformer: (response) => { /* Normalize response shape */ }
}
```

**Row Key Generation:**
```typescript
row: {
  keyGenerator: (row) => `${row.manufacturer}:${row.model}`,  // Create unique key
  keyParser: (key) => { /* Parse key back to partial object */ }
}
```

**Selection Serialization:**
```typescript
selection: {
  serializer: (items) => /* Convert selected items to URL string */,
  deserializer: (urlValue) => /* Convert URL string back to items */
}
```

---

### Step 603.3: Understanding URL Serialization

Selected items must be serialized to the URL for URL-First architecture:

```
Before selection: /automobiles/discover
After selection:  /automobiles/discover?modelCombos=Toyota:Camry,Honda:Civic
```

The serialization flow:

```
┌─────────────────────────────────────────────────────────────────┐
│                     SELECTION → URL                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User selects:                                                   │
│  [x] Toyota - Camry                                              │
│  [x] Honda - Civic                                               │
│                                                                  │
│  ↓ serializer()                                                  │
│                                                                  │
│  URL: ?modelCombos=Toyota:Camry,Honda:Civic                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     URL → SELECTION                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  URL: ?modelCombos=Toyota:Camry,Honda:Civic                     │
│                                                                  │
│  ↓ deserializer()                                                │
│                                                                  │
│  Partial items:                                                  │
│  [ { manufacturer: 'Toyota', model: 'Camry' },                  │
│    { manufacturer: 'Honda', model: 'Civic' } ]                  │
│                                                                  │
│  ↓ Picker hydrates with full data from API                      │
│                                                                  │
│  Full items:                                                     │
│  [ { manufacturer: 'Toyota', model: 'Camry', count: 1234 },     │
│    { manufacturer: 'Honda', model: 'Civic', count: 987 } ]      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Step 603.4: Understanding Server-Side Pagination

The picker uses server-side pagination:

```typescript
api: {
  fetchData: (params) => {
    return apiService.get(endpoint, {
      params: {
        page: params.page + 1,  // Convert 0-indexed to 1-indexed
        size: params.size,       // e.g., 20
        search: params.search,   // User's search term
        sortBy: params.sortField,
        sortOrder: params.sortOrder === -1 ? 'desc' : 'asc'
      }
    });
  }
}
```

When user searches "Toyota":
1. Picker sends: `GET /manufacturer-model-combinations?page=1&size=20&search=Toyota`
2. API returns: `{ data: [/* 20 Toyota results */], total: 47, page: 1, size: 20, totalPages: 3 }`
3. Picker displays 20 results with pagination: "Showing 1-20 of 47"

---

### Step 603.5: Understanding Factory Pattern

The picker uses a factory function pattern:

```typescript
export function createManufacturerModelPickerConfig(
  apiService: ApiService,
  configId: string = 'manufacturer-model-picker'
): PickerConfig<ManufacturerModelRow> {
  return { /* config */ };
}
```

**Why a factory function instead of a constant?**

The picker needs the `ApiService` to make API calls. Angular's dependency injection provides the service at runtime, but configuration constants are created at module load time (before injection is available).

The factory pattern solves this:

```typescript
// In domain config factory
export function createAutomobileDomainConfig(injector: Injector) {
  const apiService = injector.get(ApiService);

  return {
    // ...
    pickers: createAutomobilePickerConfigs(injector)
  };
}
```

---

## Verification

### 1. Verify File Created

```bash
$ ls -la src/app/domain-config/automobile/configs/automobile.picker-configs.ts
```

Expected: File exists.

### 2. Verify TypeScript Compilation

```bash
$ cd ~/projects/vvroom
$ npx tsc --noEmit src/app/domain-config/automobile/configs/automobile.picker-configs.ts
```

Expected: No compilation errors.

### 3. Verify Interface Export

```bash
$ grep "^export interface" src/app/domain-config/automobile/configs/automobile.picker-configs.ts
```

Expected: `export interface ManufacturerModelRow {`

### 4. Verify Function Exports

```bash
$ grep "^export function" src/app/domain-config/automobile/configs/automobile.picker-configs.ts
```

Expected: Two function exports (createManufacturerModelPickerConfig, createAutomobilePickerConfigs)

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| "Cannot find module '../../../framework/services'" | Services not yet created | Ensure Phase 3 is complete |
| "Property 'get' does not exist on type 'ApiService'" | ApiService interface mismatch | Verify ApiService has get<T>() method |
| Picker shows empty | API endpoint not responding | Check API URL and network tab |
| Selection not persisting to URL | serializer/deserializer mismatch | Ensure serializer output matches deserializer input |
| Page numbers wrong | 0-indexed vs 1-indexed mismatch | Picker is 0-indexed, API is 1-indexed; convert |

---

## Key Takeaways

1. **Pickers handle large option sets** — Server-side pagination and search make 50,000+ items usable
2. **URL serialization enables sharing** — Selected items are in the URL, so users can share links
3. **Factory pattern enables dependency injection** — Services are injected at runtime, not import time

---

## Acceptance Criteria

- [ ] `src/app/domain-config/automobile/configs/automobile.picker-configs.ts` exists
- [ ] `ManufacturerModelRow` interface defines manufacturer, model, and count properties
- [ ] `createManufacturerModelPickerConfig()` factory function returns picker configuration
- [ ] Picker configuration includes 3 columns (manufacturer, model, count)
- [ ] `api.fetchData` function handles pagination, search, and sorting parameters
- [ ] `selection.serializer` converts items to URL string format "Manufacturer:Model,..."
- [ ] `selection.deserializer` parses URL string back to partial items
- [ ] `createAutomobilePickerConfigs()` returns array with manufacturer-model picker
- [ ] File compiles without TypeScript errors

---

## Next Step

Proceed to `604-query-control-filters.md` to define the query control filter definitions for dialog-based filter editing.
