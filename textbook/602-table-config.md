# 602: Table Config

**Status:** Planning
**Depends On:** 402-automobile-data-model, 204-table-config-interface
**Blocks:** 607-domain-config-assembly

---

## Learning Objectives

After completing this section, you will:
- Understand how table configuration separates data structure from presentation
- Know how to define columns with sorting, filtering, and width properties
- Recognize the pattern of lazy loading for large datasets

---

## Objective

Create the automobile table configuration that defines how vehicle results are displayed in the data table. This configuration controls columns, pagination, sorting, row expansion, and state persistence.

---

## Why

Data tables are one of the most common UI patterns in enterprise applications. Without configuration, you might hard-code table structure:

```html
<!-- Hard-coded table (anti-pattern) -->
<table>
  <tr>
    <th>Manufacturer</th>
    <th>Model</th>
    <th>Year</th>
  </tr>
  <tr *ngFor="let v of vehicles">
    <td>{{ v.manufacturer }}</td>
    <td>{{ v.model }}</td>
    <td>{{ v.year }}</td>
  </tr>
</table>
```

This approach has problems:

1. **No reusability** — Every domain needs its own table template
2. **No flexibility** — Adding columns requires template changes
3. **Missing features** — Sorting, filtering, pagination require custom code

The configuration-driven approach:

```typescript
<app-results-table
  [config]="AUTOMOBILE_TABLE_CONFIG"
  [data]="vehicles">
</app-results-table>
```

One generic component, unlimited configurations.

### Angular Style Guide References

- [Style 05-14](https://angular.io/guide/styleguide#style-05-14): Put logic in services, not components
- Configuration objects follow this principle by moving table structure to data

---

## What

### Step 602.1: Create the Table Configuration File

Create the file that will define the automobile results table.

Create `src/app/domain-config/automobile/configs/automobile.table-config.ts`:

```typescript
// src/app/domain-config/automobile/configs/automobile.table-config.ts

/**
 * Automobile Domain - Table Configuration
 *
 * Defines the main data table for displaying vehicle results.
 * Configures columns, pagination, sorting, filtering, and row expansion.
 *
 * Domain: Automobile Discovery
 */

import { TableConfig } from '../../../framework/models/table-config.interface';
import { VehicleResult } from '../models/automobile.data';

/**
 * Automobile table configuration
 *
 * Main table for displaying vehicle search results.
 * Supports pagination, sorting, filtering, and row expansion for VIN details.
 *
 * @example
 * ```typescript
 * <p-table
 *   [value]="vehicles"
 *   [columns]="AUTOMOBILE_TABLE_CONFIG.columns"
 *   [dataKey]="AUTOMOBILE_TABLE_CONFIG.dataKey"
 *   [stateStorage]="AUTOMOBILE_TABLE_CONFIG.stateStorage"
 *   [stateKey]="AUTOMOBILE_TABLE_CONFIG.stateKey">
 * </p-table>
 * ```
 */
export const AUTOMOBILE_TABLE_CONFIG: TableConfig<VehicleResult> = {
  /**
   * Unique table identifier
   */
  tableId: 'automobile-vehicles-table',

  /**
   * State persistence key
   * Saves column widths, order, visibility, filters, sorting, pagination
   */
  stateKey: 'auto-vehicles-state',

  /**
   * Data key field (must be unique per row)
   * Used for row expansion, selection, and state management
   */
  dataKey: 'vehicle_id',

  /**
   * Table columns configuration
   */
  columns: [
    {
      field: 'manufacturer',
      header: 'Manufacturer',
      sortable: true,
      filterable: true,
      filterMatchMode: 'contains',
      reorderable: true,
      width: '150px'
    },
    {
      field: 'model',
      header: 'Model',
      sortable: true,
      filterable: true,
      filterMatchMode: 'contains',
      reorderable: true,
      width: '150px'
    },
    {
      field: 'year',
      header: 'Year',
      sortable: true,
      filterable: true,
      filterMatchMode: 'equals',
      reorderable: true,
      width: '100px'
    },
    {
      field: 'body_class',
      header: 'Body Class',
      sortable: true,
      filterable: true,
      filterMatchMode: 'contains',
      reorderable: true,
      width: '120px'
    },
    {
      field: 'instance_count',
      header: 'VIN Count',
      sortable: true,
      filterable: false,
      reorderable: true,
      width: '100px'
    }
  ],

  /**
   * Row expansion enabled
   * Clicking expand button shows VIN instances for the vehicle
   */
  expandable: true,

  /**
   * Row selection disabled
   * Enable if you need multi-select functionality
   */
  selectable: false,

  /**
   * Selection mode (if selectable=true)
   */
  selectionMode: undefined,

  /**
   * Pagination enabled
   */
  paginator: true,

  /**
   * Default rows per page
   */
  rows: 20,

  /**
   * Rows per page options
   */
  rowsPerPageOptions: [10, 20, 50, 100],

  /**
   * Lazy loading enabled
   * Data fetched on demand (pagination, sorting, filtering)
   */
  lazy: true,

  /**
   * State persistence
   * Saves table state to localStorage
   */
  stateStorage: 'local',

  /**
   * Table style class
   * PrimeNG classes for styling
   */
  styleClass: 'p-datatable-striped p-datatable-gridlines',

  /**
   * Responsive layout
   */
  responsiveLayout: 'scroll',

  /**
   * Show grid lines
   */
  gridlines: true,

  /**
   * Striped rows
   */
  stripedRows: true,

  /**
   * Loading indicator
   */
  loading: false
};

/**
 * Column visibility presets
 *
 * Predefined column visibility configurations for different use cases
 */
export const AUTOMOBILE_TABLE_COLUMN_PRESETS = {
  /**
   * All columns visible
   */
  all: AUTOMOBILE_TABLE_CONFIG.columns,

  /**
   * Minimal view (core fields only)
   */
  minimal: AUTOMOBILE_TABLE_CONFIG.columns.filter((col) =>
    ['manufacturer', 'model', 'year', 'instance_count'].includes(col.field)
  ),

  /**
   * Summary view (no VIN count)
   */
  summary: AUTOMOBILE_TABLE_CONFIG.columns.filter(
    (col) => col.field !== 'instance_count'
  )
};

/**
 * Default sort configuration
 */
export const AUTOMOBILE_TABLE_DEFAULT_SORT = {
  field: 'manufacturer',
  order: 1 // 1 = ascending, -1 = descending
};

/**
 * Export format configurations
 *
 * Define which columns to include in exports
 */
export const AUTOMOBILE_TABLE_EXPORT_CONFIG = {
  /**
   * CSV export column configuration
   */
  csv: {
    columns: [
      { field: 'manufacturer', header: 'Manufacturer' },
      { field: 'model', header: 'Model' },
      { field: 'year', header: 'Year' },
      { field: 'body_class', header: 'Body Class' },
      { field: 'instance_count', header: 'VIN Count' }
    ],
    filename: 'automobile-vehicles'
  },

  /**
   * Excel export column configuration
   */
  excel: {
    columns: [
      { field: 'vehicle_id', header: 'Vehicle ID' },
      { field: 'manufacturer', header: 'Manufacturer' },
      { field: 'model', header: 'Model' },
      { field: 'year', header: 'Year' },
      { field: 'body_class', header: 'Body Class' },
      { field: 'instance_count', header: 'VIN Count' },
      { field: 'first_seen', header: 'First Seen' },
      { field: 'last_seen', header: 'Last Seen' }
    ],
    filename: 'automobile-vehicles',
    sheetName: 'Vehicles'
  }
};
```

---

### Step 602.2: Understand the Column Configuration

Each column definition controls how that column behaves:

| Property | Type | Description |
|----------|------|-------------|
| `field` | `string` | Property name in data object (e.g., 'manufacturer') |
| `header` | `string` | Display text in column header (e.g., 'Manufacturer') |
| `sortable` | `boolean` | Enable column sorting |
| `filterable` | `boolean` | Enable column filtering |
| `filterMatchMode` | `string` | Filter comparison: 'contains', 'equals', 'startsWith' |
| `reorderable` | `boolean` | Allow drag-and-drop column reordering |
| `width` | `string` | Column width (CSS units) |

**Field Mapping:**

The `field` property maps to the `VehicleResult` interface:

```typescript
interface VehicleResult {
  vehicle_id: string;     // field: 'vehicle_id'
  manufacturer: string;   // field: 'manufacturer'
  model: string;          // field: 'model'
  year: number;           // field: 'year'
  body_class: string;     // field: 'body_class'
  instance_count: number; // field: 'instance_count'
}
```

---

### Step 602.3: Understanding Lazy Loading

The `lazy: true` setting is critical for performance with large datasets:

```
┌────────────────────────────────────────────────────────────┐
│                    Without Lazy Loading                     │
├────────────────────────────────────────────────────────────┤
│ 1. API returns ALL 100,000 vehicles                        │
│ 2. Browser holds ALL in memory                             │
│ 3. Table renders first 20                                  │
│ 4. Slow initial load, high memory usage                    │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                    With Lazy Loading                        │
├────────────────────────────────────────────────────────────┤
│ 1. API returns only 20 vehicles (page 1)                   │
│ 2. Browser holds 20 in memory                              │
│ 3. Table renders 20                                        │
│ 4. User clicks "Next" → API returns next 20                │
│ 5. Fast loads, low memory usage                            │
└────────────────────────────────────────────────────────────┘
```

When `lazy: true`:
- The table emits `onLazyLoad` events with pagination/sort/filter parameters
- Your service calls the API with these parameters
- The API returns only the requested page

---

### Step 602.4: Understanding State Persistence

The `stateStorage: 'local'` and `stateKey: 'auto-vehicles-state'` settings save table state:

**What gets saved:**
- Column widths (after user resizes)
- Column order (after user reorders)
- Sort column and direction
- Current page number
- Rows per page selection
- Column filters

**Where it's saved:**
- `localStorage` with key `auto-vehicles-state`

**When it's restored:**
- On page reload, the table returns to the user's last state

This provides a personalized experience without requiring server-side storage.

---

### Step 602.5: Understanding Row Expansion

The `expandable: true` and `dataKey: 'vehicle_id'` settings enable row expansion:

```
┌────────────────┬────────────┬──────┬────────────┬───────────┐
│ Manufacturer   │ Model      │ Year │ Body Class │ VIN Count │
├────────────────┼────────────┼──────┼────────────┼───────────┤
│ ▶ Toyota       │ Camry      │ 2023 │ Sedan      │ 1,234     │
├────────────────┼────────────┼──────┼────────────┼───────────┤
│ ▼ Honda        │ Civic      │ 2022 │ Sedan      │ 987       │
│   ┌──────────────────────────────────────────────────────┐  │
│   │ VIN Instances (987 total)                            │  │
│   │ ┌──────────────────────────────────────────────────┐ │  │
│   │ │ 1HGBH41JXMN109186 │ First Seen: 2022-01-15      │ │  │
│   │ │ 1HGBH41JXMN109187 │ First Seen: 2022-01-16      │ │  │
│   │ │ 1HGBH41JXMN109188 │ First Seen: 2022-01-17      │ │  │
│   │ └──────────────────────────────────────────────────┘ │  │
│   └──────────────────────────────────────────────────────┘  │
├────────────────┼────────────┼──────┼────────────┼───────────┤
│ ▶ Ford         │ F-150      │ 2023 │ Truck      │ 2,345     │
└────────────────┴────────────┴──────┴────────────┴───────────┘
```

The `dataKey` identifies which row is expanded. Without a unique key, expansion state would be lost on sort/filter.

---

## Verification

### 1. Verify File Created

```bash
$ ls -la src/app/domain-config/automobile/configs/automobile.table-config.ts
```

Expected: File exists with correct size.

### 2. Verify TypeScript Compilation

```bash
$ cd ~/projects/vvroom
$ npx tsc --noEmit src/app/domain-config/automobile/configs/automobile.table-config.ts
```

Expected: No compilation errors.

### 3. Verify Column Count

```bash
$ grep -c "field:" src/app/domain-config/automobile/configs/automobile.table-config.ts
```

Expected: `13` (5 table columns + 5 CSV columns + 8 Excel columns - some overlap)

### 4. Verify Exports

```bash
$ grep "^export const" src/app/domain-config/automobile/configs/automobile.table-config.ts | wc -l
```

Expected: `4` (AUTOMOBILE_TABLE_CONFIG, AUTOMOBILE_TABLE_COLUMN_PRESETS, AUTOMOBILE_TABLE_DEFAULT_SORT, AUTOMOBILE_TABLE_EXPORT_CONFIG)

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| "Cannot find module '../models/automobile.data'" | Data model not yet created | Ensure Phase 4 (document 402) is complete |
| "Property 'vehicle_id' does not exist on type 'VehicleResult'" | Field name mismatch | Verify field names match VehicleResult interface |
| Table shows "No records found" | Lazy loading not wired up | Ensure component calls API on onLazyLoad events |
| Column widths not persisting | State key conflict | Use unique stateKey per table |
| Sort not working | Missing sortable: true | Add sortable: true to column definition |

---

## Key Takeaways

1. **Table configuration is data** — Column definitions, pagination, and sorting are all configuration objects
2. **Lazy loading is essential for large datasets** — Only fetch what the user can see
3. **State persistence provides personalization** — Users don't lose their column preferences on reload

---

## Acceptance Criteria

- [ ] `src/app/domain-config/automobile/configs/automobile.table-config.ts` exists
- [ ] `AUTOMOBILE_TABLE_CONFIG` has 5 column definitions (manufacturer, model, year, body_class, instance_count)
- [ ] `lazy: true` is set for lazy loading
- [ ] `stateStorage: 'local'` and `stateKey` are configured for state persistence
- [ ] `expandable: true` and `dataKey: 'vehicle_id'` enable row expansion
- [ ] `AUTOMOBILE_TABLE_COLUMN_PRESETS` provides 3 presets (all, minimal, summary)
- [ ] `AUTOMOBILE_TABLE_EXPORT_CONFIG` defines CSV and Excel export formats
- [ ] File compiles without TypeScript errors

---

## Next Step

Proceed to `603-picker-configs.md` to define the automobile picker configurations for selecting manufacturer-model combinations.
