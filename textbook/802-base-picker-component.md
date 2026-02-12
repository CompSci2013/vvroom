# 802: Base Picker Component

**Status:** Planning
**Depends On:** 205-picker-config-interface, 301-url-state-service, 306-resource-management-service, 311-picker-config-registry
**Blocks:** 806-query-panel-component

---

## Learning Objectives

After completing this section, you will:
- Understand the configuration-driven approach to building reusable UI components
- Know how to synchronize component state with URL parameters bidirectionally
- Be able to implement server-side pagination with selection persistence across pages

---

## Objective

Build a configuration-driven multi-select table component that wraps PrimeNG Table with selection management and URL synchronization. The picker loads data from an API, displays it in a paginated table, allows multi-row selection, and emits selected items for URL parameter updates.

---

## Why

Many data discovery applications need "picker" interfaces: tables where users select one or more items to filter results. For example, selecting specific vehicle models, manufacturers, or years.

Without a reusable picker component, each domain would require a custom implementation. The **Base Picker Component** eliminates this duplication by accepting configuration that describes:
- Which API endpoint to call
- Which columns to display
- How to serialize/deserialize selections to URL parameters

This is the Phase 8 pattern in action: **Generic components + specific configuration = infinite reusability**.

### Angular Style Guide References

- [Style 03-01](https://angular.io/guide/styleguide#style-03-01): Use single responsibility principle
- [Style 05-04](https://angular.io/guide/styleguide#style-05-04): Put logic in the component class

### URL-First Architecture Reference

The picker maintains bidirectional sync with URL parameters:
1. **URL to Picker**: When URL contains selection parameters, the picker hydrates those selections
2. **Picker to URL**: When user clicks "Apply", the component emits a selection event that the parent uses to update the URL

This ensures selections survive page refreshes and are shareable via URL.

---

## What

### Step 802.1: Create the Picker State Interface

Create the file `src/app/framework/components/base-picker/picker-state.interface.ts`:

```typescript
// src/app/framework/components/base-picker/picker-state.interface.ts
// VERSION 1 (Section 802) - Picker component state

/**
 * Internal state for BasePickerComponent
 *
 * Tracks loaded data, pagination, selection, and loading/error states.
 */
export interface PickerState<T> {
  /**
   * Currently loaded data rows (current page only)
   */
  data: T[];

  /**
   * Total count of records (for pagination)
   */
  totalCount: number;

  /**
   * Current page index (0-based)
   */
  currentPage: number;

  /**
   * Number of rows per page
   */
  pageSize: number;

  /**
   * Current sort field (if any)
   */
  sortField?: string;

  /**
   * Sort order: 1 = ascending, -1 = descending
   */
  sortOrder: number;

  /**
   * Current search/filter term
   */
  searchTerm: string;

  /**
   * Loading state flag
   */
  loading: boolean;

  /**
   * Error object (if any)
   */
  error: Error | null;

  /**
   * Whether initial data has been loaded
   */
  dataLoaded: boolean;

  /**
   * Set of selected row keys (for O(1) lookup)
   */
  selectedKeys: Set<string>;

  /**
   * Array of selected row objects
   */
  selectedItems: T[];

  /**
   * Keys pending hydration from URL (before data loads)
   */
  pendingHydration: string[];
}

/**
 * Get default picker state
 */
export function getDefaultPickerState<T>(pageSize = 20): PickerState<T> {
  return {
    data: [],
    totalCount: 0,
    currentPage: 0,
    pageSize,
    sortField: undefined,
    sortOrder: 1,
    searchTerm: '',
    loading: false,
    error: null,
    dataLoaded: false,
    selectedKeys: new Set<string>(),
    selectedItems: [],
    pendingHydration: []
  };
}
```

### Step 802.2: Create the Base Picker Component TypeScript

Create the file `src/app/framework/components/base-picker/base-picker.component.ts`:

```typescript
// src/app/framework/components/base-picker/base-picker.component.ts
// VERSION 1 (Section 802) - Configuration-driven multi-select table

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { distinctUntilChanged, map, takeUntil } from 'rxjs/operators';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';

import { PickerConfig, PickerSelectionEvent, PickerApiParams } from '../../models/picker-config.interface';
import { PickerConfigRegistry } from '../../services/picker-config-registry.service';
import { UrlStateService } from '../../services/url-state.service';
import { ResourceManagementService } from '../../services/resource-management.service';
import { PickerState, getDefaultPickerState } from './picker-state.interface';

/**
 * Base Picker Component
 *
 * Configuration-driven multi-select table with:
 * - Server-side pagination and sorting
 * - Search filtering
 * - Selection persistence across pages
 * - URL parameter synchronization
 *
 * @template T - The data model type for table rows
 *
 * @example
 * ```html
 * <!-- Using config from registry -->
 * <app-base-picker
 *   [configId]="'vehicle-picker'"
 *   (selectionChange)="onSelectionChange($event)">
 * </app-base-picker>
 *
 * <!-- Using direct config object -->
 * <app-base-picker
 *   [config]="vehiclePickerConfig"
 *   (selectionChange)="onSelectionChange($event)">
 * </app-base-picker>
 * ```
 */
@Component({
  selector: 'app-base-picker',
  templateUrl: './base-picker.component.html',
  styleUrls: ['./base-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BasePickerComponent<T> implements OnInit, OnDestroy, AfterViewInit {

  /**
   * Picker configuration ID (loads from registry)
   * Either configId or config must be provided.
   */
  @Input() configId?: string;

  /**
   * Direct picker configuration object
   * Either configId or config must be provided.
   */
  @Input() config?: PickerConfig<T>;

  /**
   * Emits when user clicks "Apply" with selected items
   */
  @Output() selectionChange = new EventEmitter<PickerSelectionEvent<T>>();

  /**
   * Current picker state
   */
  state: PickerState<T> = getDefaultPickerState();

  /**
   * Active configuration (resolved from configId or config)
   */
  activeConfig?: PickerConfig<T>;

  private destroy$ = new Subject<void>();

  constructor(
    private registry: PickerConfigRegistry,
    private urlState: UrlStateService,
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef,
    private resourceService: ResourceManagementService<any, any, any>
  ) {}

  // ============================================================================
  // Lifecycle
  // ============================================================================

  ngOnInit(): void {
    this.loadConfiguration();

    if (!this.activeConfig) {
      throw new Error('BasePickerComponent requires either configId or config input');
    }

    this.initializeState();
    this.subscribeToUrlChanges();
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.syncPaginatorWidth();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  private loadConfiguration(): void {
    if (this.config) {
      this.activeConfig = this.config;
    } else if (this.configId) {
      this.activeConfig = this.registry.get<T>(this.configId);
    }
  }

  private initializeState(): void {
    const pageSize = this.activeConfig!.pagination.defaultPageSize || 20;
    this.state = getDefaultPickerState<T>(pageSize);
  }

  // ============================================================================
  // URL Synchronization
  // ============================================================================

  private subscribeToUrlChanges(): void {
    const urlParam = this.activeConfig!.selection.urlParam;

    this.resourceService.filters$
      .pipe(
        map(filters => (filters as any)[urlParam] || null),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(filterValue => {
        if (filterValue) {
          this.hydrateFromUrl(String(filterValue));
        } else {
          // Clear selections
          this.state.selectedKeys = new Set<string>();
          this.state.selectedItems = [];
          this.state.pendingHydration = [];
          this.state.data = [...this.state.data];
          this.cdr.detectChanges();
        }
      });
  }

  private hydrateFromUrl(urlValue: string): void {
    const config = this.activeConfig!;
    const partialItems = config.selection.deserializer(urlValue);
    const keyGenerator = config.selection.keyGenerator || config.row.keyGenerator;
    const keys = partialItems.map(item => keyGenerator(item as T));

    if (this.state.dataLoaded) {
      this.hydrateSelections(keys);
    } else {
      this.state.pendingHydration = keys;
    }

    this.cdr.markForCheck();
  }

  private hydrateSelections(keys: string[]): void {
    const config = this.activeConfig!;
    this.state.selectedKeys = new Set<string>(keys);

    // Preserve items from other pages
    const existingItemsByKey = new Map<string, T>();
    this.state.selectedItems.forEach(item => {
      const key = config.row.keyGenerator(item);
      existingItemsByKey.set(key, item);
    });

    // Build new selectedItems array
    const newSelectedItems: T[] = [];
    keys.forEach(key => {
      const itemInCurrentPage = this.state.data.find(
        row => config.row.keyGenerator(row) === key
      );

      if (itemInCurrentPage) {
        newSelectedItems.push(itemInCurrentPage);
      } else if (existingItemsByKey.has(key)) {
        newSelectedItems.push(existingItemsByKey.get(key)!);
      }
    });

    this.state.selectedItems = newSelectedItems;
    this.cdr.markForCheck();
  }

  // ============================================================================
  // Data Loading
  // ============================================================================

  private loadData(): void {
    const config = this.activeConfig!;
    this.state.loading = true;
    this.state.error = null;
    this.cdr.markForCheck();

    const params: PickerApiParams = {
      page: this.state.currentPage,
      size: this.state.pageSize,
      search: this.state.searchTerm || undefined,
      sortField: this.state.sortField,
      sortOrder: this.state.sortOrder
    };

    const apiParams = config.api.paramMapper
      ? config.api.paramMapper(params)
      : params;

    config.api.fetchData(apiParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: response => {
          const transformed = config.api.responseTransformer(response);
          this.state.data = transformed.results;
          this.state.totalCount = transformed.total;
          this.state.loading = false;
          this.state.dataLoaded = true;

          // Hydrate pending selections
          if (this.state.pendingHydration.length > 0) {
            this.hydrateSelections(this.state.pendingHydration);
            this.state.pendingHydration = [];
          }

          this.cdr.markForCheck();
        },
        error: error => {
          this.state.loading = false;
          this.state.error = error;
          this.cdr.markForCheck();
        }
      });
  }

  // ============================================================================
  // Selection Handlers
  // ============================================================================

  onRowSelectionChange(row: T, checked: boolean): void {
    const key = this.activeConfig!.row.keyGenerator(row);

    if (checked) {
      this.state.selectedKeys.add(key);
      this.state.selectedItems.push(row);
    } else {
      this.state.selectedKeys.delete(key);
      this.state.selectedItems = this.state.selectedItems.filter(
        item => this.activeConfig!.row.keyGenerator(item) !== key
      );
    }

    this.cdr.markForCheck();
  }

  onSelectAll(checked: boolean): void {
    if (checked) {
      this.state.data.forEach(row => {
        const key = this.activeConfig!.row.keyGenerator(row);
        if (!this.state.selectedKeys.has(key)) {
          this.state.selectedKeys.add(key);
          this.state.selectedItems.push(row);
        }
      });
    } else {
      this.state.data.forEach(row => {
        const key = this.activeConfig!.row.keyGenerator(row);
        this.state.selectedKeys.delete(key);
      });
      this.state.selectedItems = this.state.selectedItems.filter(item => {
        const key = this.activeConfig!.row.keyGenerator(item);
        return this.state.selectedKeys.has(key);
      });
    }

    this.cdr.markForCheck();
  }

  isRowSelected(row: T): boolean {
    const key = this.activeConfig!.row.keyGenerator(row);
    return this.state.selectedKeys.has(key);
  }

  get allVisibleSelected(): boolean {
    if (this.state.data.length === 0) {
      return false;
    }
    return this.state.data.every(row => this.isRowSelected(row));
  }

  // ============================================================================
  // Pagination & Sorting
  // ============================================================================

  onLazyLoad(event: any): void {
    if (this.state.loading) {
      return;
    }

    this.state.currentPage = event.first / event.rows;
    this.state.pageSize = event.rows;
    this.state.sortField = event.sortField || undefined;
    this.state.sortOrder = event.sortOrder || 1;

    this.loadData();
  }

  onSearch(term: string): void {
    this.state.searchTerm = term;
    this.state.currentPage = 0;
    this.loadData();
  }

  // ============================================================================
  // Actions
  // ============================================================================

  applySelections(): void {
    const config = this.activeConfig!;
    const urlValue = config.selection.serializer(this.state.selectedItems);

    const event: PickerSelectionEvent<T> = {
      pickerId: config.id,
      selections: this.state.selectedItems,
      selectedKeys: Array.from(this.state.selectedKeys),
      urlValue
    };

    this.selectionChange.emit(event);
  }

  clearSelections(): void {
    this.state.selectedKeys = new Set<string>();
    this.state.selectedItems = [];
    this.state.data = [...this.state.data];
    this.cdr.markForCheck();

    // Emit empty selection
    const event: PickerSelectionEvent<T> = {
      pickerId: this.activeConfig!.id,
      selections: [],
      selectedKeys: [],
      urlValue: ''
    };
    this.selectionChange.emit(event);
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  fieldToString(field: keyof T): string {
    return String(field);
  }

  private syncPaginatorWidth(): void {
    const nativeEl = this.elementRef.nativeElement;
    const table = nativeEl.querySelector('.p-datatable-table') as HTMLElement;
    const paginator = nativeEl.querySelector('.p-paginator') as HTMLElement;

    if (table && paginator) {
      paginator.style.width = `${table.offsetWidth}px`;
    }
  }
}
```

### Step 802.3: Create the Base Picker Component Template

Create the file `src/app/framework/components/base-picker/base-picker.component.html`:

```html
<!-- src/app/framework/components/base-picker/base-picker.component.html -->
<!-- VERSION 1 (Section 802) - Picker table template -->

<div *ngIf="activeConfig" class="picker-container">
  <p-table
    [value]="state.data"
    [loading]="state.loading"
    [lazy]="activeConfig.pagination.mode === 'server'"
    [paginator]="true"
    [rows]="state.pageSize"
    [totalRecords]="state.totalCount"
    [rowsPerPageOptions]="activeConfig.pagination.pageSizeOptions || [10, 20, 50, 100]"
    [showCurrentPageReport]="true"
    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
    (onLazyLoad)="onLazyLoad($event)"
    styleClass="p-datatable-gridlines"
    responsiveLayout="scroll">

    <!-- Caption with search and actions -->
    <ng-template pTemplate="caption">
      <div class="table-caption">
        <!-- Search -->
        <div *ngIf="activeConfig.showSearch !== false" class="picker-search">
          <input
            type="text"
            pInputText
            [placeholder]="activeConfig.searchPlaceholder || 'Search...'"
            [value]="state.searchTerm"
            (input)="onSearch($any($event.target).value)"
            class="search-input">
        </div>
        <div class="table-actions">
          <button
            pButton
            type="button"
            label="Clear"
            icon="pi pi-times"
            class="p-button-outlined p-button-secondary"
            (click)="clearSelections()"
            [disabled]="state.selectedItems.length === 0">
          </button>
          <button
            pButton
            type="button"
            label="Apply"
            icon="pi pi-check"
            class="p-button-primary"
            (click)="applySelections()"
            [disabled]="state.selectedItems.length === 0">
          </button>
        </div>
      </div>
    </ng-template>

    <!-- Header -->
    <ng-template pTemplate="header">
      <tr>
        <!-- Select All Checkbox -->
        <th style="width: 3rem">
          <p-checkbox
            [ngModel]="allVisibleSelected"
            (onChange)="onSelectAll($any($event).checked)"
            [binary]="true"
            [disabled]="state.data.length === 0">
          </p-checkbox>
        </th>
        <!-- Column Headers -->
        <th *ngFor="let col of activeConfig.columns"
          [pSortableColumn]="col.sortable ? fieldToString(col.field) : ''"
          [ngStyle]="{ width: col.width, textAlign: col.align || 'left' }">
          {{ col.header }}
          <p-sortIcon
            *ngIf="col.sortable"
            [field]="fieldToString(col.field)">
          </p-sortIcon>
        </th>
      </tr>
    </ng-template>

    <!-- Body -->
    <ng-template pTemplate="body" let-row>
      <tr>
        <!-- Row Checkbox -->
        <td>
          <p-checkbox
            [ngModel]="isRowSelected(row)"
            (onChange)="onRowSelectionChange(row, $any($event).checked)"
            [binary]="true">
          </p-checkbox>
        </td>
        <!-- Column Data -->
        <td *ngFor="let col of activeConfig.columns"
          [ngStyle]="{ textAlign: col.align || 'left' }">
          {{ row[col.field] }}
        </td>
      </tr>
    </ng-template>

    <!-- Empty Message -->
    <ng-template pTemplate="emptymessage">
      <tr>
        <td [attr.colspan]="activeConfig.columns.length + 1">
          <div class="empty-message">
            <i class="pi pi-inbox empty-icon"></i>
            <p>No data available</p>
          </div>
        </td>
      </tr>
    </ng-template>

    <!-- Loading Body -->
    <ng-template pTemplate="loadingbody">
      <tr *ngFor="let i of [1, 2, 3, 4, 5]">
        <td [attr.colspan]="activeConfig.columns.length + 1">
          <div class="loading-row">
            <p-skeleton width="100%" height="2rem"></p-skeleton>
          </div>
        </td>
      </tr>
    </ng-template>
  </p-table>

  <!-- Error Display -->
  <div *ngIf="state.error" class="picker-error">
    <p-message
      severity="error"
      [text]="state.error.message || 'An error occurred'">
    </p-message>
  </div>
</div>
```

### Step 802.4: Create the Base Picker Component Styles

Create the file `src/app/framework/components/base-picker/base-picker.component.scss`:

```scss
// src/app/framework/components/base-picker/base-picker.component.scss
// VERSION 1 (Section 802) - Picker table styles

.picker-container {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
  background: var(--surface-card);
  border-radius: var(--border-radius);
  border: 1px solid var(--surface-border);
}

.picker-search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;

  .search-input {
    flex: 1;
    width: 100%;
  }
}

.table-caption {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  gap: 1rem;
  background-color: var(--surface-50);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
}

.table-actions {
  display: flex;
  gap: 0.5rem;
  white-space: nowrap;
}

.empty-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: var(--text-color-secondary);

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  p {
    margin: 0;
    font-size: 1rem;
  }
}

.loading-row {
  padding: 0.5rem;
}

.picker-error {
  margin-top: 1rem;
}

// PrimeNG table overrides
::ng-deep {
  .p-datatable {
    .p-datatable-thead > tr > th {
      background: var(--surface-section);
      color: var(--text-color);
      font-weight: 600;
      padding: 0.75rem 1rem;
    }

    .p-datatable-tbody > tr {
      background: var(--surface-card);
      color: var(--text-color);

      &:hover {
        background: var(--surface-hover);
      }

      > td {
        padding: 0.75rem 1rem;
      }
    }

    .p-paginator {
      background: var(--surface-section);
      color: var(--text-color);
      border: none;
      padding: 0.5rem 1rem;
    }
  }
}
```

### Step 802.5: Create the Module Export

Create the file `src/app/framework/components/base-picker/index.ts`:

```typescript
// src/app/framework/components/base-picker/index.ts
// VERSION 1 (Section 802) - Barrel export

export { BasePickerComponent } from './base-picker.component';
export { PickerState, getDefaultPickerState } from './picker-state.interface';
```

### Step 802.6: Register in Framework Module

Open `src/app/framework/framework.module.ts` and add the component:

```typescript
// src/app/framework/framework.module.ts
// VERSION 3 (Section 802) - Add BasePickerComponent
// Replaces VERSION 2 from Section 801

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';

import { BaseChartComponent } from './components/base-chart/base-chart.component';
import { BasePickerComponent } from './components/base-picker/base-picker.component';

@NgModule({
  declarations: [
    BaseChartComponent,
    BasePickerComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    CheckboxModule,
    InputTextModule,
    SkeletonModule,
    MessageModule
  ],
  exports: [
    BaseChartComponent,
    BasePickerComponent
  ]
})
export class FrameworkModule {}
```

---

## Verification

### 1. Build the Application

```bash
$ cd ~/projects/vvroom
$ ng build
```

Expected: Build succeeds with no errors.

### 2. Check TypeScript Compilation

```bash
$ npx tsc --noEmit
```

Expected: No type errors.

### 3. Verify Dependencies

```bash
$ grep -E "TableModule|CheckboxModule" src/app/framework/framework.module.ts
```

Expected: Both modules are in the imports array.

### 4. Manual Inspection

Check `src/app/framework/components/base-picker/base-picker.component.ts`:
- `PickerConfig` is used for configuration
- Selection is tracked with both `Set<string>` and `T[]`
- Lazy loading is implemented for server-side pagination

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| `No provider for PickerConfigRegistry` | Service not provided | Ensure `PickerConfigRegistry` is provided in root |
| Selections lost on page change | Hydration not preserving off-page items | Verify `hydrateSelections` merges with existing items |
| Checkbox state not updating | Change detection not triggered | Use `cdr.detectChanges()` instead of `markForCheck()` |
| Paginator width doesn't match table | `syncPaginatorWidth` not called | Verify it runs in `ngAfterViewInit` |
| `ExpressionChangedAfterItHasBeenCheckedError` | Mutating state during render | Move mutations to lifecycle hooks or use `setTimeout` |

---

## Key Takeaways

1. **Configuration drives behavior** - The same component renders different data based on `PickerConfig`
2. **Selections persist across pages** - Use a `Set` for O(1) lookup and an array for full item data
3. **URL hydration requires two-phase approach** - Store pending keys until data loads, then match

---

## Acceptance Criteria

- [ ] `BasePickerComponent` accepts `configId` or `config` input
- [ ] Table displays columns from configuration
- [ ] Server-side pagination triggers `loadData()` on page change
- [ ] Search input filters results (if enabled in config)
- [ ] Checkbox selection tracks items across pages
- [ ] "Apply" button emits `selectionChange` with serialized URL value
- [ ] "Clear" button resets all selections
- [ ] URL parameter changes hydrate selections
- [ ] Loading skeleton displays during data fetch
- [ ] Error message displays on API failure
- [ ] Component is registered in `FrameworkModule`
- [ ] `ng build` completes with no errors

---

## Next Step

Proceed to `803-basic-results-table.md` to build the domain-agnostic data table for displaying search results.
