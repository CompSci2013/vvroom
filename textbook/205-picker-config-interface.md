# 205: Picker Config Interface

**Status:** Planning
**Depends On:** 204-table-config-interface
**Blocks:** 603-picker-configs, 311-picker-config-registry, 802-base-picker-component

---

## Learning Objectives

After completing this section, you will:
- Understand how pickers extend table functionality with selection and URL synchronization
- Know how to configure row key generation and serialization for URL state
- Recognize the relationship between picker selections and URL query parameters

---

## Objective

Create the `PickerConfig` interface that defines how selection pickers work. Pickers are specialized tables with checkboxes that let users select items and synchronize those selections with URL parameters — supporting the URL-First architecture.

---

## Why

Pickers are tables with selection capabilities. In vvroom, users might:
- Select specific VINs to compare
- Choose manufacturers to focus on
- Pick models for detailed analysis

These selections must be:
1. **Persisted in the URL** — Sharing a URL shares the selection
2. **Restored from URL** — Loading a URL restores the selection
3. **Type-safe** — The framework knows what types are being selected

**The picker flow:**

```
┌─────────────────────────────────────────────────────────────────┐
│  User selects rows in picker table                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  serializer(selectedItems) → URL string                          │
│  Example: ["Ford", "Toyota"] → "Ford,Toyota"                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  URL updated: ?selectedManufacturers=Ford,Toyota                 │
└─────────────────────────────────────────────────────────────────┘
```

**Restoring from URL:**

```
┌─────────────────────────────────────────────────────────────────┐
│  URL: ?selectedManufacturers=Ford,Toyota                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  deserializer("Ford,Toyota") → [{manufacturer: "Ford"}, ...]     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Picker shows Ford, Toyota as selected                           │
└─────────────────────────────────────────────────────────────────┘
```

The `PickerConfig` interface defines the serialization/deserialization logic, API endpoints, and column configurations for each picker.

---

## What

### Step 205.1: Create the Picker Config Interface

Create the file `src/app/framework/models/picker-config.interface.ts`:

```typescript
// src/app/framework/models/picker-config.interface.ts
// VERSION 1 (Section 205) - Picker configuration for selection tables

import { Observable } from 'rxjs';
import { PrimeNGColumn } from './table-config.interface';

/**
 * Picker Configuration Interfaces
 *
 * Configuration-driven approach for selection pickers (multi-select tables).
 * Pickers use PrimeNG Table with checkboxes for row selection and
 * synchronize selections with URL query parameters.
 *
 * @example
 * ```typescript
 * const manufacturerPickerConfig: PickerConfig<Manufacturer> = {
 *   id: 'manufacturer-picker',
 *   displayName: 'Select Manufacturers',
 *   columns: [
 *     { field: 'name', header: 'Manufacturer', sortable: true },
 *     { field: 'country', header: 'Country', sortable: true }
 *   ],
 *   api: {
 *     fetchData: (params) => http.get('/api/manufacturers', { params }),
 *     responseTransformer: (r) => ({ results: r.data, total: r.total })
 *   },
 *   row: {
 *     keyGenerator: (row) => row.id,
 *     keyParser: (key) => ({ id: key })
 *   },
 *   selection: {
 *     mode: 'multiple',
 *     urlParam: 'manufacturers',
 *     serializer: (items) => items.map(i => i.id).join(','),
 *     deserializer: (url) => url.split(',').map(id => ({ id }))
 *   },
 *   pagination: {
 *     mode: 'server',
 *     defaultPageSize: 20
 *   }
 * };
 * ```
 */

/**
 * Picker API configuration
 *
 * Defines how the picker fetches data from the API.
 *
 * @template T - The data model type
 */
export interface PickerApiConfig<T> {
  /**
   * Function to fetch data from API
   * Receives pagination/filter params, returns Observable of raw response
   */
  fetchData: (params: PickerApiParams) => Observable<any>;

  /**
   * Transform API response to standard format
   * Required because different APIs have different response shapes
   */
  responseTransformer: (response: any) => PickerApiResponse<T>;

  /**
   * Optional parameter mapper
   * Maps internal picker params to API-specific format
   *
   * @example
   * paramMapper: (params) => ({
   *   offset: params.page * params.size,
   *   limit: params.size,
   *   sort: params.sortField
   * })
   */
  paramMapper?: (params: PickerApiParams) => any;
}

/**
 * Picker API request parameters
 *
 * Standard parameters sent to the API fetch function.
 */
export interface PickerApiParams {
  /**
   * Current page (0-indexed)
   */
  page: number;

  /**
   * Page size (rows per page)
   */
  size: number;

  /**
   * Sort field name
   */
  sortField?: string;

  /**
   * Sort order (1 = ascending, -1 = descending)
   */
  sortOrder?: 1 | -1;

  /**
   * Search/filter term from search box
   */
  search?: string;

  /**
   * Additional filters (domain-specific)
   */
  filters?: { [key: string]: any };
}

/**
 * Picker API response format
 *
 * Standard response format that all pickers expect.
 *
 * @template T - The data model type
 */
export interface PickerApiResponse<T> {
  /**
   * Array of result items for current page
   */
  results: T[];

  /**
   * Total number of items (for pagination)
   */
  total: number;

  /**
   * Current page number (optional, for verification)
   */
  page?: number;

  /**
   * Page size (optional, for verification)
   */
  size?: number;

  /**
   * Total pages (optional, computed from total/size)
   */
  totalPages?: number;
}

/**
 * Picker row configuration
 *
 * Defines how to generate unique keys for rows and parse them back.
 * Keys are used for selection tracking and URL serialization.
 *
 * @template T - The data model type
 */
export interface PickerRowConfig<T> {
  /**
   * Generate unique key from row data
   * Used for selection tracking and URL serialization
   *
   * @example
   * // Simple ID-based key
   * keyGenerator: (row) => row.id
   *
   * // Composite key
   * keyGenerator: (row) => `${row.manufacturer}|${row.model}`
   */
  keyGenerator: (row: T) => string;

  /**
   * Parse key back to partial row data
   * Used for URL hydration before data loads
   *
   * @example
   * // Simple ID-based parse
   * keyParser: (key) => ({ id: key })
   *
   * // Composite key parse
   * keyParser: (key) => {
   *   const [manufacturer, model] = key.split('|');
   *   return { manufacturer, model };
   * }
   */
  keyParser: (key: string) => Partial<T>;
}

/**
 * Picker selection configuration
 *
 * Defines selection behavior and URL synchronization.
 *
 * @template T - The data model type
 */
export interface PickerSelectionConfig<T> {
  /**
   * Selection mode
   * - 'single': Only one item can be selected
   * - 'multiple': Multiple items can be selected
   * @default 'multiple'
   */
  mode: 'single' | 'multiple';

  /**
   * URL query parameter name for storing selections
   *
   * @example
   * urlParam: 'selectedManufacturers'
   * // URL becomes: ?selectedManufacturers=Ford,Toyota,Honda
   */
  urlParam: string;

  /**
   * Serialize selected items to URL string
   *
   * @example
   * // Comma-separated IDs
   * serializer: (items) => items.map(i => i.id).join(',')
   *
   * // Composite keys
   * serializer: (items) => items.map(i => `${i.make}:${i.model}`).join(',')
   */
  serializer: (items: T[]) => string;

  /**
   * Deserialize URL string to partial item data
   * Returns partial objects that will be matched against loaded data
   *
   * @example
   * // Comma-separated IDs
   * deserializer: (url) => url.split(',').map(id => ({ id }))
   *
   * // Composite keys
   * deserializer: (url) => url.split(',').map(pair => {
   *   const [make, model] = pair.split(':');
   *   return { make, model };
   * })
   */
  deserializer: (urlString: string) => Partial<T>[];

  /**
   * Generate key from partial item (from deserializer)
   * If not provided, uses row.keyGenerator
   */
  keyGenerator?: (item: Partial<T>) => string;
}

/**
 * Picker pagination configuration
 */
export interface PickerPaginationConfig {
  /**
   * Pagination mode
   * - 'server': Server-side pagination (API handles paging)
   * - 'client': Client-side pagination (load all, page locally)
   * @default 'server'
   */
  mode: 'server' | 'client';

  /**
   * Default page size
   * @default 20
   */
  defaultPageSize?: number;

  /**
   * Page size options for dropdown
   * @default [10, 20, 50, 100]
   */
  pageSizeOptions?: number[];
}

/**
 * Picker caching configuration
 */
export interface PickerCachingConfig {
  /**
   * Enable caching of picker data
   * @default false
   */
  enabled: boolean;

  /**
   * Cache TTL in milliseconds
   * @default 300000 (5 minutes)
   */
  ttl?: number;
}

/**
 * Complete picker configuration
 *
 * @template T - The data model type
 */
export interface PickerConfig<T> {
  /**
   * Unique identifier for this picker
   * Used for registry lookup and state management
   */
  id: string;

  /**
   * Display name for picker (shown in UI headers)
   */
  displayName: string;

  /**
   * Column definitions
   * Reuses PrimeNGColumn from table config for consistency
   */
  columns: PrimeNGColumn<T>[];

  /**
   * API configuration
   */
  api: PickerApiConfig<T>;

  /**
   * Row key configuration
   */
  row: PickerRowConfig<T>;

  /**
   * Selection configuration
   */
  selection: PickerSelectionConfig<T>;

  /**
   * Pagination configuration
   */
  pagination: PickerPaginationConfig;

  /**
   * Optional caching configuration
   */
  caching?: PickerCachingConfig;

  /**
   * Optional description/help text
   */
  description?: string;

  /**
   * Show search box
   * @default true
   */
  showSearch?: boolean;

  /**
   * Search placeholder text
   * @default 'Search...'
   */
  searchPlaceholder?: string;
}

/**
 * Picker selection event
 *
 * Emitted when user changes selection.
 *
 * @template T - The data model type
 */
export interface PickerSelectionEvent<T> {
  /**
   * Picker ID that emitted the event
   */
  pickerId: string;

  /**
   * Selected item objects
   */
  selections: T[];

  /**
   * Selected item keys (from keyGenerator)
   */
  selectedKeys: string[];

  /**
   * Serialized URL parameter value
   */
  urlValue: string;
}

/**
 * Picker state
 *
 * Internal state tracking for picker component.
 *
 * @template T - The data model type
 */
export interface PickerState<T> {
  /**
   * All loaded data for current page
   */
  data: T[];

  /**
   * Total count (for pagination)
   */
  totalCount: number;

  /**
   * Selected row keys (as Set for O(1) lookup)
   */
  selectedKeys: Set<string>;

  /**
   * Selected row objects
   */
  selectedItems: T[];

  /**
   * Loading state
   */
  loading: boolean;

  /**
   * Error state
   */
  error: Error | null;

  /**
   * Current page (0-indexed)
   */
  currentPage: number;

  /**
   * Page size
   */
  pageSize: number;

  /**
   * Search term from search box
   */
  searchTerm: string;

  /**
   * Current sort field
   */
  sortField?: string;

  /**
   * Current sort order
   */
  sortOrder?: 1 | -1;

  /**
   * Pending hydration keys (from URL, before data loads)
   * These are keys that should be selected once data loads
   */
  pendingHydration: string[];

  /**
   * Whether data has been loaded at least once
   */
  dataLoaded: boolean;
}

/**
 * Create default picker state
 *
 * @template T - The data model type
 * @param pageSize - Initial page size
 * @returns Default PickerState
 */
export function getDefaultPickerState<T>(pageSize: number = 20): PickerState<T> {
  return {
    data: [],
    totalCount: 0,
    selectedKeys: new Set<string>(),
    selectedItems: [],
    loading: false,
    error: null,
    currentPage: 0,
    pageSize,
    searchTerm: '',
    sortField: undefined,
    sortOrder: undefined,
    pendingHydration: [],
    dataLoaded: false
  };
}

/**
 * Create default picker pagination config
 *
 * @returns Default PickerPaginationConfig
 */
export function getDefaultPaginationConfig(): PickerPaginationConfig {
  return {
    mode: 'server',
    defaultPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100]
  };
}

/**
 * Create default picker caching config
 *
 * @param enabled - Whether caching is enabled
 * @returns Default PickerCachingConfig
 */
export function getDefaultCachingConfig(enabled: boolean = false): PickerCachingConfig {
  return {
    enabled,
    ttl: 300000 // 5 minutes
  };
}
```

---

### Step 205.2: Update the Barrel Export

Update `src/app/framework/models/index.ts` to include the new interface:

```typescript
// src/app/framework/models/index.ts

// This barrel file exports all framework model interfaces.
// Import from '@app/framework/models' instead of individual files.

export * from './domain-config.interface';
export * from './resource-management.interface';
export * from './filter-definition.interface';
export * from './table-config.interface';
export * from './picker-config.interface';
```

---

### Step 205.3: Understand the Picker Architecture

Pickers have three key responsibilities:

| Responsibility | Configuration | Purpose |
|---------------|---------------|---------|
| **Data Fetching** | `api` | Load data from API with pagination/search |
| **Row Identity** | `row` | Generate/parse unique keys for each row |
| **URL Sync** | `selection` | Serialize/deserialize selections to/from URL |

**The hydration problem:**

When a user loads a URL like `?manufacturers=Ford,Toyota`, the picker must:

1. Parse the URL to get selection keys: `["Ford", "Toyota"]`
2. Store these as `pendingHydration`
3. Fetch data from API
4. Match loaded data against pending keys
5. Move matched items to `selectedItems`

This is why `keyParser` exists — it creates partial objects that can be matched against full data objects.

---

### Step 205.4: Example Automobile Picker Configuration

Here's how an automobile picker would be configured (you'll create this in Phase 6):

```typescript
// Preview: src/app/domain-config/automobile/configs/automobile.picker-configs.ts

import { PickerConfig, getDefaultPaginationConfig } from '@app/framework/models';

interface ManufacturerOption {
  name: string;
  country: string;
  vehicleCount: number;
}

export const MANUFACTURER_PICKER_CONFIG: PickerConfig<ManufacturerOption> = {
  id: 'manufacturer-picker',
  displayName: 'Select Manufacturers',
  columns: [
    { field: 'name', header: 'Manufacturer', sortable: true },
    { field: 'country', header: 'Country', sortable: true },
    { field: 'vehicleCount', header: 'Vehicles', sortable: true, align: 'right' }
  ],
  api: {
    fetchData: (params) => {
      // Injected via service
      return null as any;
    },
    responseTransformer: (response) => ({
      results: response.data,
      total: response.meta.total
    })
  },
  row: {
    keyGenerator: (row) => row.name,
    keyParser: (key) => ({ name: key })
  },
  selection: {
    mode: 'multiple',
    urlParam: 'manufacturer',
    serializer: (items) => items.map(i => i.name).join(','),
    deserializer: (url) => url.split(',').map(name => ({ name }))
  },
  pagination: getDefaultPaginationConfig(),
  showSearch: true,
  searchPlaceholder: 'Search manufacturers...'
};
```

---

## Verification

### 1. Check File Exists

```bash
$ ls -la src/app/framework/models/picker-config.interface.ts
```

Expected output shows the file exists.

### 2. TypeScript Compilation Check

```bash
$ cd ~/projects/vvroom
$ npx tsc --noEmit src/app/framework/models/picker-config.interface.ts
```

Expected: No output (no compilation errors).

### 3. Verify Exports

```bash
$ grep "^export" src/app/framework/models/picker-config.interface.ts
```

Expected output:

```
export interface PickerApiConfig<T> {
export interface PickerApiParams {
export interface PickerApiResponse<T> {
export interface PickerRowConfig<T> {
export interface PickerSelectionConfig<T> {
export interface PickerPaginationConfig {
export interface PickerCachingConfig {
export interface PickerConfig<T> {
export interface PickerSelectionEvent<T> {
export interface PickerState<T> {
export function getDefaultPickerState<T>(pageSize: number = 20): PickerState<T> {
export function getDefaultPaginationConfig(): PickerPaginationConfig {
export function getDefaultCachingConfig(enabled: boolean = false): PickerCachingConfig {
```

### 4. Verify Barrel Export

```bash
$ grep "picker-config" src/app/framework/models/index.ts
```

Expected output:

```
export * from './picker-config.interface';
```

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| `Observable is not defined` | Missing RxJS import | Add `import { Observable } from 'rxjs';` |
| `PrimeNGColumn is not defined` | Missing import | Add `import { PrimeNGColumn } from './table-config.interface';` |
| Selections not persisting | Wrong `urlParam` | Verify URL parameter name matches expected |
| Hydration not working | `keyParser` returns wrong shape | Ensure partial object matches data structure |
| Duplicate selections | `keyGenerator` not unique | Use unique identifier field(s) |

---

## Key Takeaways

1. **Pickers extend tables with URL-synchronized selection** — User selections become shareable URLs
2. **Key generation/parsing enables hydration** — Convert between data objects and URL-safe strings
3. **Serialization/deserialization are symmetric** — `deserialize(serialize(items))` should match original keys

---

## Acceptance Criteria

- [ ] `src/app/framework/models/picker-config.interface.ts` exists
- [ ] `PickerConfig<T>` interface defines complete picker configuration
- [ ] `PickerApiConfig<T>` defines data fetching with transformer
- [ ] `PickerRowConfig<T>` defines key generation and parsing
- [ ] `PickerSelectionConfig<T>` defines URL serialization/deserialization
- [ ] `PickerState<T>` includes `pendingHydration` for URL restoration
- [ ] `PickerSelectionEvent<T>` defines selection change events
- [ ] Utility functions for default configs are implemented
- [ ] Barrel file exports all picker configuration types
- [ ] TypeScript compilation succeeds with no errors
- [ ] All interfaces have JSDoc documentation with examples

---

## Next Step

Proceed to `206-api-response-interface.md` to define the standard API response interface.
