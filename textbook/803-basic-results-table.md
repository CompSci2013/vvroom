# 803: Basic Results Table

**Status:** Planning
**Depends On:** 204-table-config-interface, 301-url-state-service, 306-resource-management-service
**Blocks:** 904-automobile-discover

---

## Learning Objectives

After completing this section, you will:
- Understand how to bind a data table to reactive streams from a service
- Know how to implement server-side pagination and sorting via URL state
- Be able to create expandable row details using PrimeNG Table templates

---

## Objective

Build a configuration-driven results table component that displays data from `ResourceManagementService`, supports server-side pagination and sorting, and shows expandable row details. This component is the primary way users view search results in the discover interface.

---

## Why

The results table is the heart of any data discovery application. Users search, filter, and browse results in this table. However, different domains have different columns and data structures. The **Basic Results Table** solves this by:

1. Reading column definitions from `DomainConfig.tableConfig`
2. Binding to reactive streams (`results$`, `loading$`, `totalResults$`) from `ResourceManagementService`
3. Emitting pagination and sort changes that update URL state

This keeps the component domain-agnostic while still providing rich functionality.

### Angular Style Guide References

- [Style 05-02](https://angular.io/guide/styleguide#style-05-02): Use input properties for data binding
- [Style 05-15](https://angular.io/guide/styleguide#style-05-15): Provide a selector prefix

### URL-First Architecture Reference

When users click pagination controls or column headers to sort, the table emits events that ultimately update URL parameters. The `ResourceManagementService` watches these URL changes and triggers new API requests. This maintains our URL-First principle: the URL is the single source of truth.

---

## What

### Step 803.1: Create the Basic Results Table Component TypeScript

Create the file `src/app/framework/components/basic-results-table/basic-results-table.component.ts`:

```typescript
// src/app/framework/components/basic-results-table/basic-results-table.component.ts
// VERSION 1 (Section 803) - Configuration-driven results display

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
import { Observable, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { SkeletonModule } from 'primeng/skeleton';

import { DomainConfig } from '../../models/domain-config.interface';
import { ResourceManagementService } from '../../services/resource-management.service';
import { PopOutContextService } from '../../services/popout-context.service';
import { PopOutMessageType } from '../../models/popout.interface';

/**
 * Basic Results Table Component
 *
 * Displays search results in a paginated, sortable table with expandable rows.
 * Reads configuration from DomainConfig and data from ResourceManagementService.
 *
 * @template TFilters - Domain-specific filter model type
 * @template TData - Domain-specific data model type
 * @template TStatistics - Domain-specific statistics model type
 *
 * @example
 * ```html
 * <app-basic-results-table
 *   [domainConfig]="automobileDomainConfig">
 * </app-basic-results-table>
 * ```
 */
@Component({
  selector: 'app-basic-results-table',
  templateUrl: './basic-results-table.component.html',
  styleUrls: ['./basic-results-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BasicResultsTableComponent<TFilters = any, TData = any, TStatistics = any>
  implements OnInit, AfterViewInit, OnDestroy {

  private readonly destroy$ = new Subject<void>();

  /**
   * Domain configuration with table columns and settings
   */
  @Input() domainConfig!: DomainConfig<TFilters, TData, TStatistics>;

  /**
   * Emits when URL parameters should be updated (for pop-out sync)
   */
  @Output() urlParamsChange = new EventEmitter<{ [key: string]: any }>();

  /**
   * Track expanded rows by data key
   */
  expandedRows: { [key: string]: boolean } = {};

  /**
   * Reference to Object for template use
   */
  Object = Object;

  constructor(
    private readonly resourceService: ResourceManagementService<TFilters, TData, TStatistics>,
    private readonly cdr: ChangeDetectorRef,
    private readonly popOutContext: PopOutContextService,
    private readonly elementRef: ElementRef
  ) {}

  // ============================================================================
  // Observable Streams
  // ============================================================================

  get filters$(): Observable<TFilters> {
    return this.resourceService.filters$;
  }

  get results$(): Observable<TData[]> {
    return this.resourceService.results$;
  }

  get totalResults$(): Observable<number> {
    return this.resourceService.totalResults$;
  }

  get loading$(): Observable<boolean> {
    return this.resourceService.loading$;
  }

  // ============================================================================
  // Computed Properties
  // ============================================================================

  /**
   * Calculate paginator first index from current filters
   */
  get paginatorFirst(): number {
    const filters = this.resourceService.getCurrentFilters() as Record<string, any>;
    const page = filters['page'] || 1;
    const size = filters['size'] || 20;
    return (page - 1) * size;
  }

  /**
   * Get current filters for template bindings
   */
  get currentFilters(): Record<string, any> {
    return this.resourceService.getCurrentFilters() as Record<string, any>;
  }

  // ============================================================================
  // Template Helpers
  // ============================================================================

  /**
   * Get object keys for row expansion display
   */
  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  ngOnInit(): void {
    if (!this.domainConfig) {
      throw new Error('BasicResultsTableComponent requires domainConfig input');
    }

    // Pop-out window support: sync state from parent window
    if (this.popOutContext.isInPopOut()) {
      this.popOutContext
        .getMessages$()
        .pipe(
          filter(msg => msg.type === PopOutMessageType.STATE_UPDATE),
          takeUntil(this.destroy$)
        )
        .subscribe(message => {
          if (message.payload && message.payload.state) {
            this.resourceService.syncStateFromExternal(message.payload.state);
            this.cdr.markForCheck();
          }
        });
    }
  }

  ngAfterViewInit(): void {
    this.syncPaginatorWidth();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle pagination change
   */
  onPageChange(event: any): void {
    const page = event.first / event.rows + 1;
    const size = event.rows;

    if (this.popOutContext.isInPopOut()) {
      // In pop-out: emit for parent to handle
      this.urlParamsChange.emit({ page, size });
    } else {
      // In main window: update filters directly
      const currentFilters = this.resourceService.getCurrentFilters() as Record<string, any>;
      const newFilters = {
        ...currentFilters,
        page,
        size
      } as unknown as TFilters;
      this.resourceService.updateFilters(newFilters);
    }
  }

  /**
   * Handle sort change
   */
  onSort(event: any): void {
    const sort = event.field;
    const sortDirection = event.order === 1 ? 'asc' : 'desc';

    if (this.popOutContext.isInPopOut()) {
      this.urlParamsChange.emit({ sort, sortDirection });
    } else {
      const currentFilters = this.resourceService.getCurrentFilters() as Record<string, any>;
      const newFilters = {
        ...currentFilters,
        sort,
        sortDirection
      } as unknown as TFilters;
      this.resourceService.updateFilters(newFilters);
    }
  }

  /**
   * Refresh current results
   */
  refresh(): void {
    this.resourceService.refresh();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Sync paginator width to match table width
   */
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

### Step 803.2: Create the Basic Results Table Template

Create the file `src/app/framework/components/basic-results-table/basic-results-table.component.html`:

```html
<!-- src/app/framework/components/basic-results-table/basic-results-table.component.html -->
<!-- VERSION 1 (Section 803) - Results table template -->

<div class="basic-results-table-container">
  <div class="table-container">
    <p-table
      [value]="(results$ | async) || []"
      [columns]="domainConfig.tableConfig.columns"
      [dataKey]="$any(domainConfig.tableConfig.dataKey)"
      [loading]="(loading$ | async) || false"
      [lazy]="true"
      [paginator]="true"
      [rows]="currentFilters['size'] || 20"
      [first]="paginatorFirst"
      [totalRecords]="(totalResults$ | async) || 0"
      [rowsPerPageOptions]="domainConfig.tableConfig.rowsPerPageOptions || [10, 20, 50]"
      [styleClass]="domainConfig.tableConfig.styleClass || ''"
      [responsiveLayout]="domainConfig.tableConfig.responsiveLayout || 'scroll'"
      [expandedRowKeys]="expandedRows"
      (onPage)="onPageChange($event)"
      (onSort)="onSort($event)"
      [showCurrentPageReport]="true"
      [currentPageReportTemplate]="'Showing {first} to {last} of {totalRecords} results'">

      <!-- Caption with result count -->
      <ng-template pTemplate="caption">
        <div class="table-caption">
          <span class="caption-count">
            {{ (totalResults$ | async) || 0 }} result(s)
          </span>
        </div>
      </ng-template>

      <!-- Header -->
      <ng-template pTemplate="header" let-columns>
        <tr>
          <th *ngIf="domainConfig.tableConfig.expandable" style="width: 3rem"></th>
          <th *ngFor="let col of columns"
            [pSortableColumn]="col.sortable ? col.field : undefined"
            [ngStyle]="{ 'width': col.width }">
            {{ col.header }}
            <p-sortIcon *ngIf="col.sortable" [field]="col.field"></p-sortIcon>
          </th>
        </tr>
      </ng-template>

      <!-- Body -->
      <ng-template pTemplate="body" let-row let-columns="columns" let-expanded="expanded">
        <tr>
          <!-- Expand toggle -->
          <td *ngIf="domainConfig.tableConfig.expandable">
            <button type="button"
              pButton
              pRipple
              [pRowToggler]="row"
              class="p-button-text p-button-rounded p-button-plain"
              [icon]="expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'">
            </button>
          </td>

          <!-- Data columns -->
          <td *ngFor="let col of columns">
            {{ row[col.field] }}
          </td>
        </tr>
      </ng-template>

      <!-- Row Expansion -->
      <ng-template pTemplate="rowexpansion" let-row>
        <tr>
          <td [attr.colspan]="domainConfig.tableConfig.columns.length + 1">
            <div class="row-expansion">
              <h3>Details</h3>
              <div class="expansion-grid">
                <div *ngFor="let key of getObjectKeys(row)" class="expansion-field">
                  <strong>{{ key }}:</strong> {{ row[key] }}
                </div>
              </div>
            </div>
          </td>
        </tr>
      </ng-template>

      <!-- Empty message -->
      <ng-template pTemplate="emptymessage">
        <tr>
          <td [attr.colspan]="domainConfig.tableConfig.columns.length + (domainConfig.tableConfig.expandable ? 1 : 0)">
            <div class="empty-message">
              <i class="pi pi-inbox" style="font-size: 3rem"></i>
              <p>No results found</p>
              <p class="empty-hint">Try adjusting your filters</p>
            </div>
          </td>
        </tr>
      </ng-template>

      <!-- Loading skeleton -->
      <ng-template pTemplate="loadingbody">
        <tr *ngFor="let i of [1, 2, 3, 4, 5]">
          <td [attr.colspan]="domainConfig.tableConfig.columns.length + (domainConfig.tableConfig.expandable ? 1 : 0)">
            <p-skeleton width="100%" height="2rem"></p-skeleton>
          </td>
        </tr>
      </ng-template>
    </p-table>
  </div>
</div>
```

### Step 803.3: Create the Basic Results Table Styles

Create the file `src/app/framework/components/basic-results-table/basic-results-table.component.scss`:

```scss
// src/app/framework/components/basic-results-table/basic-results-table.component.scss
// VERSION 1 (Section 803) - Results table styles

.basic-results-table-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;

  .table-container {
    background: var(--surface-card);
    border-radius: 6px;
    padding: 1rem;

    ::ng-deep .p-datatable {
      .p-datatable-thead > tr > th,
      .p-datatable-tbody > tr > td {
        padding: 0.5rem 0.75rem;
        border: 1px solid var(--surface-border);
      }

      .p-datatable-thead > tr > th {
        border-bottom-width: 2px;
        background: var(--surface-section);
        font-weight: 600;
      }

      .p-datatable-table {
        border: 1px solid var(--surface-border);
      }

      .p-paginator {
        border: none;
        background: var(--surface-section);
      }

      .p-datatable-table-container {
        overflow-x: auto;
      }
    }

    .table-caption {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      padding: 0.5rem 1rem;
      background-color: var(--surface-50);
      border-bottom: 1px solid var(--surface-border);

      .caption-count {
        font-size: 0.875rem;
        color: var(--text-color-secondary);
      }
    }

    .empty-message {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-color-secondary);

      i {
        color: var(--text-color-secondary);
        opacity: 0.5;
      }

      p {
        margin: 1rem 0 0.5rem;
        font-size: 1.125rem;
      }

      .empty-hint {
        font-size: 0.875rem;
        margin: 0.5rem 0 0;
      }
    }

    .row-expansion {
      padding: 1.5rem;
      background: var(--surface-ground);
      border-left: 3px solid var(--primary-color);

      h3 {
        margin: 0 0 1rem;
        font-size: 1.125rem;
        color: var(--text-color);
      }

      .expansion-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 0;

        .expansion-field {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 0.75rem;
          border: 1px solid var(--surface-border);

          strong {
            color: var(--text-color-secondary);
            font-size: 0.75rem;
            text-transform: uppercase;
          }
        }
      }
    }
  }
}
```

### Step 803.4: Create the Module Export

Create the file `src/app/framework/components/basic-results-table/index.ts`:

```typescript
// src/app/framework/components/basic-results-table/index.ts
// VERSION 1 (Section 803) - Barrel export

export { BasicResultsTableComponent } from './basic-results-table.component';
```

### Step 803.5: Register in Framework Module

Open `src/app/framework/framework.module.ts` and add the component:

```typescript
// src/app/framework/framework.module.ts
// VERSION 4 (Section 803) - Add BasicResultsTableComponent
// Replaces VERSION 3 from Section 802

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { RippleModule } from 'primeng/ripple';

import { BaseChartComponent } from './components/base-chart/base-chart.component';
import { BasePickerComponent } from './components/base-picker/base-picker.component';
import { BasicResultsTableComponent } from './components/basic-results-table/basic-results-table.component';

@NgModule({
  declarations: [
    BaseChartComponent,
    BasePickerComponent,
    BasicResultsTableComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    CheckboxModule,
    InputTextModule,
    SkeletonModule,
    MessageModule,
    RippleModule
  ],
  exports: [
    BaseChartComponent,
    BasePickerComponent,
    BasicResultsTableComponent
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

### 3. Verify Observable Bindings

Check `src/app/framework/components/basic-results-table/basic-results-table.component.ts`:
- `results$`, `loading$`, `totalResults$` are getter properties
- They delegate to `ResourceManagementService`

### 4. Verify Template Bindings

Check `src/app/framework/components/basic-results-table/basic-results-table.component.html`:
- `async` pipe is used with all observables
- Null coalescing (`|| []`, `|| 0`, `|| false`) handles initial null values

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| Table shows no data | `results$` returning empty array | Verify `ResourceManagementService` has data loaded |
| Pagination not working | `[lazy]="true"` without `onLazyLoad` handler | This component uses `onPageChange` instead; ensure it updates filters |
| Sort not persisting on refresh | Sort params not in URL | Verify `onSort` updates URL state |
| Expandable rows not working | `dataKey` not set | Ensure `tableConfig.dataKey` is set in domain config |
| `ExpressionChangedAfterItHasBeenCheckedError` | Calling `getCurrentFilters()` in template | Use computed property instead |

---

## Key Takeaways

1. **Reactive binding with async pipe** - The template subscribes to observables; no manual subscription management needed
2. **Lazy loading enables server-side operations** - The table delegates pagination/sorting to the service
3. **Pop-out support is built-in** - The same component works in both main window and pop-out windows

---

## Acceptance Criteria

- [ ] `BasicResultsTableComponent` accepts `domainConfig` input
- [ ] Table columns render from `tableConfig.columns`
- [ ] Pagination controls trigger `onPageChange` which updates filters
- [ ] Column headers trigger `onSort` which updates filters
- [ ] Loading skeleton displays while `loading$` is true
- [ ] Empty message displays when `results$` is empty
- [ ] Expandable rows show all object properties (if `tableConfig.expandable` is true)
- [ ] Result count displays in caption
- [ ] Pop-out window receives state updates via `PopOutContextService`
- [ ] Component is registered in `FrameworkModule`
- [ ] `ng build` completes with no errors

---

## Next Step

Proceed to `804-statistics-panel-component.md` to build the chart grid container component.
