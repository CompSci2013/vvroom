# 204: Table Config Interface

**Status:** Planning
**Depends On:** 201-domain-config-interface
**Blocks:** 602-table-config, 803-basic-results-table

---

## Learning Objectives

After completing this section, you will:
- Understand how configuration objects can drive complex UI components like data tables
- Know how to use TypeScript generics for type-safe column definitions
- Recognize the benefits of configuration-driven tables versus custom table components

---

## Objective

Create the `TableConfig` interface that defines how data tables are configured for display. This interface specifies columns, pagination, sorting, and other table behaviors — allowing the framework to render domain-appropriate tables without custom code.

---

## Why

Data tables are central to vvroom's UI. Users browse automobile data in tables, sort columns, paginate through results, and expand rows for details. Instead of building a custom table component for automobiles, we use PrimeNG Table with **configuration-driven behavior**.

**The problem with custom table components:**

```typescript
// Anti-pattern: Custom component for each domain
@Component({
  selector: 'automobile-table',
  template: `
    <p-table [value]="vehicles">
      <ng-template pTemplate="header">
        <tr>
          <th pSortableColumn="manufacturer">Manufacturer</th>
          <th pSortableColumn="model">Model</th>
          <th pSortableColumn="year">Year</th>
          <!-- Hard-coded for automobiles -->
        </tr>
      </ng-template>
    </p-table>
  `
})
export class AutomobileTableComponent { }
```

If you add a real estate domain, you'd need a completely new `RealEstateTableComponent`.

**The configuration-driven approach:**

```typescript
// Better: Generic component reads configuration
@Component({
  selector: 'results-table',
  template: `
    <p-table [value]="data" [columns]="config.columns">
      <ng-template pTemplate="header">
        <tr>
          <th *ngFor="let col of config.columns" [pSortableColumn]="col.field">
            {{ col.header }}
          </th>
        </tr>
      </ng-template>
    </p-table>
  `
})
export class ResultsTableComponent {
  @Input() config: TableConfig<any>;
  @Input() data: any[];
}
```

Now the same component works for any domain — just provide different configuration.

### PrimeNG Integration

The `TableConfig` interface is designed to work with PrimeNG Table. Column definitions map directly to PrimeNG's expectations:

| TableConfig Property | PrimeNG Feature |
|---------------------|-----------------|
| `columns[].sortable` | `pSortableColumn` directive |
| `columns[].filterable` | Column filter templates |
| `paginator`, `rows` | `[paginator]`, `[rows]` bindings |
| `stateStorage`, `stateKey` | State persistence features |

---

## What

### Step 204.1: Create the Table Config Interface

Create the file `src/app/framework/models/table-config.interface.ts`:

```typescript
// src/app/framework/models/table-config.interface.ts
// VERSION 1 (Section 204) - Table configuration for PrimeNG Table

/**
 * Table Configuration Interfaces
 *
 * Configuration-driven approach for PrimeNG Table.
 * These interfaces provide type-safe table configuration without
 * requiring custom table wrapper components.
 *
 * @example
 * ```typescript
 * const vehicleTableConfig: TableConfig<Vehicle> = {
 *   tableId: 'vehicle-table',
 *   stateKey: 'vehicle-table-state',
 *   dataKey: 'id',
 *   columns: [
 *     { field: 'manufacturer', header: 'Manufacturer', sortable: true },
 *     { field: 'model', header: 'Model', sortable: true, filterable: true }
 *   ],
 *   expandable: true,
 *   selectable: false,
 *   paginator: true,
 *   rows: 20,
 *   lazy: true,
 *   stateStorage: 'local'
 * };
 * ```
 */

/**
 * PrimeNG column configuration
 *
 * Defines a single column in a PrimeNG Table with type-safe field reference.
 *
 * @template T - The data model type
 */
export interface PrimeNGColumn<T> {
  /**
   * Field name from data model (type-safe via keyof T)
   */
  field: keyof T;

  /**
   * Display header text
   */
  header: string;

  /**
   * Enable column sorting
   * @default false
   */
  sortable?: boolean;

  /**
   * Enable column filtering
   * @default false
   */
  filterable?: boolean;

  /**
   * Filter match mode for PrimeNG
   * @default 'contains'
   */
  filterMatchMode?:
    | 'startsWith'
    | 'contains'
    | 'notContains'
    | 'endsWith'
    | 'equals'
    | 'notEquals'
    | 'in'
    | 'lt'
    | 'lte'
    | 'gt'
    | 'gte'
    | 'between'
    | 'dateIs'
    | 'dateIsNot'
    | 'dateBefore'
    | 'dateAfter';

  /**
   * Enable column reordering
   * @default true
   */
  reorderable?: boolean;

  /**
   * Column width (CSS value: '100px', '20%', etc.)
   */
  width?: string;

  /**
   * Frozen column (stick to left/right during horizontal scroll)
   * @default false
   */
  frozen?: boolean;

  /**
   * Alignment of column content
   * @default 'left'
   */
  align?: 'left' | 'center' | 'right';

  /**
   * Custom CSS classes for column
   */
  styleClass?: string;

  /**
   * Data type for better filtering/sorting
   */
  dataType?: 'text' | 'numeric' | 'date' | 'boolean';
}

/**
 * Table configuration for PrimeNG Table
 *
 * Comprehensive configuration object that drives PrimeNG Table behavior.
 * Use this instead of creating custom table wrapper components.
 *
 * @template T - The data model type
 */
export interface TableConfig<T> {
  /**
   * Unique identifier for this table instance
   * Used for debugging and state management
   */
  tableId: string;

  /**
   * State storage key for PrimeNG's stateStorage feature
   * Used to persist column order, filters, etc. in local/session storage
   */
  stateKey: string;

  /**
   * Column definitions
   */
  columns: PrimeNGColumn<T>[];

  /**
   * Unique key field for row tracking (required for expandable/selectable)
   * Should be a unique identifier field like 'id' or 'vin'
   */
  dataKey: keyof T;

  /**
   * Enable row expansion
   * When true, rows can be expanded to show additional details
   * @default false
   */
  expandable?: boolean;

  /**
   * Enable row selection
   * @default false
   */
  selectable?: boolean;

  /**
   * Selection mode if selectable is true
   * @default 'multiple'
   */
  selectionMode?: 'single' | 'multiple';

  /**
   * Enable paginator
   * @default true
   */
  paginator?: boolean;

  /**
   * Number of rows per page
   * @default 20
   */
  rows?: number;

  /**
   * Rows per page options for paginator dropdown
   * @default [10, 20, 50, 100]
   */
  rowsPerPageOptions?: number[];

  /**
   * Enable lazy loading mode (server-side pagination/sorting/filtering)
   * When true, table emits events instead of handling data locally
   * @default true
   */
  lazy?: boolean;

  /**
   * State storage mode for persisting table state
   * - 'local': localStorage (persists across sessions)
   * - 'session': sessionStorage (cleared on browser close)
   * - null: no persistence
   * @default 'local'
   */
  stateStorage?: 'local' | 'session' | null;

  /**
   * Enable responsive mode
   * @default true
   */
  responsive?: boolean;

  /**
   * Responsive layout mode
   * - 'scroll': Horizontal scrollbar on small screens
   * - 'stack': Stack columns vertically on small screens
   * @default 'scroll'
   */
  responsiveLayout?: 'scroll' | 'stack';

  /**
   * Enable column resizing
   * @default false
   */
  resizableColumns?: boolean;

  /**
   * Column resize mode
   * - 'fit': Resizing a column adjusts adjacent columns
   * - 'expand': Resizing a column expands table width
   * @default 'fit'
   */
  columnResizeMode?: 'fit' | 'expand';

  /**
   * Enable column reordering via drag-and-drop
   * @default true
   */
  reorderableColumns?: boolean;

  /**
   * CSS style classes for table element
   */
  styleClass?: string;

  /**
   * Show gridlines between cells
   * @default true
   */
  gridlines?: boolean;

  /**
   * Alternate row colors (zebra striping)
   * @default true
   */
  stripedRows?: boolean;

  /**
   * Show table caption/header
   */
  showCaption?: boolean;

  /**
   * Caption text
   */
  caption?: string;

  /**
   * Enable virtual scrolling for large datasets
   * When true, only visible rows are rendered
   * @default false
   */
  virtualScroll?: boolean;

  /**
   * Virtual scroll item size (height in pixels)
   * Required if virtualScroll is true
   */
  virtualScrollItemSize?: number;

  /**
   * Show loading indicator
   * Typically bound to loading state from service
   * @default false
   */
  loading?: boolean;
}

/**
 * Table state for managing table UI state
 *
 * Represents the runtime state of a table instance.
 * Used by components to track selection, expansion, pagination, etc.
 *
 * @template T - The data model type
 */
export interface TableState<T> {
  /**
   * Currently selected rows
   */
  selection: T[];

  /**
   * Expanded row keys
   * Key is the value of dataKey field, value is boolean
   */
  expandedRowKeys: { [key: string]: boolean };

  /**
   * First row index (for pagination, 0-indexed)
   */
  first: number;

  /**
   * Rows per page
   */
  rows: number;

  /**
   * Total records (for pagination display)
   */
  totalRecords: number;

  /**
   * Current sort field
   */
  sortField?: keyof T;

  /**
   * Sort order (1 = ascending, -1 = descending)
   */
  sortOrder?: 1 | -1;

  /**
   * Active filters (PrimeNG filter format)
   */
  filters?: { [key: string]: any };
}

/**
 * Create default table configuration
 *
 * Utility function that provides sensible defaults for common table setups.
 * Override specific properties as needed.
 *
 * @template T - The data model type
 * @param tableId - Unique table identifier
 * @param dataKey - Unique key field for row tracking
 * @param columns - Column definitions
 * @returns Complete TableConfig with defaults applied
 *
 * @example
 * ```typescript
 * const config = getDefaultTableConfig<Vehicle>(
 *   'vehicle-table',
 *   'vin',
 *   [
 *     { field: 'manufacturer', header: 'Manufacturer', sortable: true },
 *     { field: 'model', header: 'Model', sortable: true }
 *   ]
 * );
 * ```
 */
export function getDefaultTableConfig<T>(
  tableId: string,
  dataKey: keyof T,
  columns: PrimeNGColumn<T>[]
): TableConfig<T> {
  return {
    tableId,
    stateKey: `${tableId}-state`,
    columns,
    dataKey,
    expandable: false,
    selectable: false,
    selectionMode: 'multiple',
    paginator: true,
    rows: 20,
    rowsPerPageOptions: [10, 20, 50, 100],
    lazy: true,
    stateStorage: 'local',
    responsive: true,
    responsiveLayout: 'scroll',
    resizableColumns: false,
    columnResizeMode: 'fit',
    reorderableColumns: true,
    styleClass: 'p-datatable-striped p-datatable-gridlines',
    gridlines: true,
    stripedRows: true,
    showCaption: false,
    virtualScroll: false,
    loading: false
  };
}

/**
 * Get visible columns from configuration
 *
 * Filters out hidden columns and returns array suitable for template iteration.
 * Currently returns all columns; extend to support column visibility.
 *
 * @template T - The data model type
 * @param config - Table configuration
 * @returns Array of visible columns
 */
export function getVisibleColumns<T>(
  config: TableConfig<T>
): PrimeNGColumn<T>[] {
  return config.columns;
}

/**
 * Extract PrimeNG Table bindings from config
 *
 * Converts TableConfig to object suitable for PrimeNG Table attribute binding.
 * Use with spread operator: `<p-table ...getTableBindings(config)>`
 *
 * @template T - The data model type
 * @param config - Table configuration
 * @returns Object with PrimeNG Table bindings
 */
export function getTableBindings<T>(config: TableConfig<T>): {
  dataKey: keyof T;
  stateStorage: 'local' | 'session' | null;
  stateKey: string;
  paginator: boolean;
  rows: number;
  rowsPerPageOptions: number[];
  lazy: boolean;
  reorderableColumns: boolean;
  resizableColumns: boolean;
  columnResizeMode: 'fit' | 'expand';
  responsive: boolean;
  responsiveLayout: 'scroll' | 'stack';
  styleClass: string;
} {
  return {
    dataKey: config.dataKey,
    stateStorage: config.stateStorage ?? 'local',
    stateKey: config.stateKey,
    paginator: config.paginator ?? true,
    rows: config.rows ?? 20,
    rowsPerPageOptions: config.rowsPerPageOptions ?? [10, 20, 50, 100],
    lazy: config.lazy ?? true,
    reorderableColumns: config.reorderableColumns ?? true,
    resizableColumns: config.resizableColumns ?? false,
    columnResizeMode: config.columnResizeMode ?? 'fit',
    responsive: config.responsive ?? true,
    responsiveLayout: config.responsiveLayout ?? 'scroll',
    styleClass: config.styleClass ?? 'p-datatable-striped p-datatable-gridlines'
  };
}

/**
 * Create default table state
 *
 * @template T - The data model type
 * @param rows - Initial rows per page
 * @returns Default TableState
 */
export function getDefaultTableState<T>(rows: number = 20): TableState<T> {
  return {
    selection: [],
    expandedRowKeys: {},
    first: 0,
    rows,
    totalRecords: 0,
    sortField: undefined,
    sortOrder: undefined,
    filters: undefined
  };
}
```

---

### Step 204.2: Update the Barrel Export

Update `src/app/framework/models/index.ts` to include the new interface:

```typescript
// src/app/framework/models/index.ts

// This barrel file exports all framework model interfaces.
// Import from '@app/framework/models' instead of individual files.

export * from './domain-config.interface';
export * from './resource-management.interface';
export * from './filter-definition.interface';
export * from './table-config.interface';
```

---

### Step 204.3: Example Automobile Table Configuration

Here's how an automobile table would be configured (you'll create this in Phase 6):

```typescript
// Preview: src/app/domain-config/automobile/configs/automobile.table-config.ts

import { TableConfig, getDefaultTableConfig } from '@app/framework/models';
import { VehicleResult } from '../models/automobile.data';

export const AUTOMOBILE_TABLE_CONFIG: TableConfig<VehicleResult> = {
  ...getDefaultTableConfig<VehicleResult>('automobile-results', 'vin', []),
  columns: [
    { field: 'manufacturer', header: 'Manufacturer', sortable: true, width: '150px' },
    { field: 'model', header: 'Model', sortable: true, width: '150px' },
    { field: 'year', header: 'Year', sortable: true, width: '80px', align: 'center' },
    { field: 'bodyClass', header: 'Body Class', sortable: true },
    { field: 'engineCylinders', header: 'Cylinders', sortable: true, width: '100px', align: 'center' },
    { field: 'fuelType', header: 'Fuel Type', sortable: true }
  ],
  expandable: true,
  rows: 25
};
```

The `getDefaultTableConfig` helper provides sensible defaults, and we override only what's specific to automobiles.

---

## Verification

### 1. Check File Exists

```bash
$ ls -la src/app/framework/models/table-config.interface.ts
```

Expected output shows the file exists.

### 2. TypeScript Compilation Check

```bash
$ cd ~/projects/vvroom
$ npx tsc --noEmit src/app/framework/models/table-config.interface.ts
```

Expected: No output (no compilation errors).

### 3. Verify Exports

```bash
$ grep "^export" src/app/framework/models/table-config.interface.ts
```

Expected output:

```
export interface PrimeNGColumn<T> {
export interface TableConfig<T> {
export interface TableState<T> {
export function getDefaultTableConfig<T>(
export function getVisibleColumns<T>(
export function getTableBindings<T>(config: TableConfig<T>): {
export function getDefaultTableState<T>(rows: number = 20): TableState<T> {
```

### 4. Verify Barrel Export

```bash
$ grep "table-config" src/app/framework/models/index.ts
```

Expected output:

```
export * from './table-config.interface';
```

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| `keyof T` shows error | TypeScript strict mode issue | Ensure T extends object type |
| Column field not recognized | Field name typo | Use IDE autocomplete for `field` property |
| Sorting not working | `sortable: true` missing | Add `sortable: true` to column definition |
| State not persisting | `stateStorage` is null | Set `stateStorage: 'local'` or `'session'` |
| Virtual scroll not working | Missing `virtualScrollItemSize` | Set item height when using virtual scroll |

---

## Key Takeaways

1. **Configuration replaces custom components** — One generic table component serves all domains
2. **Type-safe column definitions** — `keyof T` ensures field names match data model properties
3. **Utility functions reduce boilerplate** — `getDefaultTableConfig` provides sensible defaults

---

## Acceptance Criteria

- [ ] `src/app/framework/models/table-config.interface.ts` exists
- [ ] `PrimeNGColumn<T>` interface defines type-safe column configuration
- [ ] `TableConfig<T>` interface includes all PrimeNG Table options
- [ ] `TableState<T>` interface captures runtime table state
- [ ] `getDefaultTableConfig` utility function is implemented
- [ ] `getTableBindings` utility function is implemented
- [ ] `getVisibleColumns` utility function is implemented
- [ ] `getDefaultTableState` utility function is implemented
- [ ] Barrel file exports all table configuration types
- [ ] TypeScript compilation succeeds with no errors
- [ ] All interfaces have JSDoc documentation with examples

---

## Next Step

Proceed to `205-picker-config-interface.md` to define the picker configuration interface for multi-select data pickers.
