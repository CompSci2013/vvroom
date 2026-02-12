# 806: Query Panel Component

**Status:** Planning
**Depends On:** 203-filter-definition-interface, 301-url-state-service, 306-resource-management-service, 802-base-picker-component
**Blocks:** 904-automobile-discover

---

## Learning Objectives

After completing this section, you will:
- Understand how to render form controls dynamically from configuration
- Know how to implement debounced input handling for performance
- Be able to coordinate multiple filter types in a single panel

---

## Objective

Build a configuration-driven filter panel that renders filter controls dynamically based on `DomainConfig.filters`. This component supports multiple filter types (text, number, select, multiselect, autocomplete, range, boolean, date) and integrates with the ResourceManagementService for state updates.

---

## Why

Every data discovery application needs a way for users to filter results. The challenge is that different domains have different filter requirements: automobiles need year ranges and manufacturer dropdowns; products need category hierarchies and price ranges.

The **Query Panel Component** solves this by:

1. Reading filter definitions from `DomainConfig.filters`
2. Rendering appropriate PrimeNG controls for each filter type
3. Handling value changes with debouncing for performance
4. Syncing all filter state with URL parameters

This is the Phase 8 pattern: **Generic components + specific configuration = infinite reusability**.

### Angular Style Guide References

- [Style 03-01](https://angular.io/guide/styleguide#style-03-01): Use single responsibility principle
- [Style 05-04](https://angular.io/guide/styleguide#style-05-04): Put logic in the component class

### URL-First Architecture Reference

When a user changes a filter value:
1. The component updates its local model immediately (for UI responsiveness)
2. After debounce delay (for text inputs), it calls `ResourceManagementService.updateFilters()`
3. ResourceManagementService updates URL state
4. URL change triggers new API request

This flow ensures filters are shareable via URL and survive page refreshes.

---

## What

### Step 806.1: Create the Query Panel Component TypeScript

Create the file `src/app/framework/components/query-panel/query-panel.component.ts`:

```typescript
// src/app/framework/components/query-panel/query-panel.component.ts
// VERSION 1 (Section 806) - Configuration-driven filter panel

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { takeUntil, filter, debounceTime } from 'rxjs/operators';

import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CheckboxModule } from 'primeng/checkbox';
import { CalendarModule } from 'primeng/calendar';

import { DomainConfig, FilterDefinition, FilterOption } from '../../models/domain-config.interface';
import { ResourceManagementService } from '../../services/resource-management.service';
import { PopOutContextService } from '../../services/popout-context.service';
import { PopOutMessageType } from '../../models/popout.interface';

/**
 * Query Panel Component
 *
 * Domain-agnostic filter panel that renders controls based on configuration.
 *
 * Supported filter types:
 * - text: Text input with clear button
 * - number: Numeric input with spinner
 * - range: Dual inputs for min/max values
 * - select: Single-select dropdown
 * - multiselect: Multi-select dropdown
 * - autocomplete: Text input with suggestions from API
 * - date: Date picker
 * - boolean: Checkbox
 *
 * @template TFilters - Domain-specific filter model type
 * @template TData - Domain-specific data model type
 * @template TStatistics - Domain-specific statistics model type
 *
 * @example
 * ```html
 * <app-query-panel
 *   [domainConfig]="automobileDomainConfig">
 * </app-query-panel>
 * ```
 */
@Component({
  selector: 'app-query-panel',
  templateUrl: './query-panel.component.html',
  styleUrls: ['./query-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QueryPanelComponent<TFilters = any, TData = any, TStatistics = any>
  implements OnInit, OnDestroy {

  /**
   * Domain configuration with filter definitions
   */
  @Input() domainConfig!: DomainConfig<TFilters, TData, TStatistics>;

  /**
   * Emits when URL parameters should be updated (for pop-out sync)
   */
  @Output() urlParamsChange = new EventEmitter<{ [key: string]: any }>();

  /**
   * Emits when all filters should be cleared
   */
  @Output() clearAllFilters = new EventEmitter<void>();

  /**
   * Observable of current filter state
   */
  filters$!: Observable<TFilters>;

  /**
   * Local filter values (for form binding)
   */
  currentFilters: Record<string, any> = {};

  /**
   * Dynamic options loaded from API
   */
  dynamicOptions: Record<string, FilterOption[]> = {};

  /**
   * Autocomplete suggestions by filter ID
   */
  autocompleteSuggestions: Record<string, string[]> = {};

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<{ field: string; value: any }>();

  constructor(
    private resourceService: ResourceManagementService<TFilters, TData, TStatistics>,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private popOutContext: PopOutContextService
  ) {
    // Setup debounced search for text inputs
    this.searchSubject.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(({ field, value }) => {
      this.applyFilterChange(field, value);
    });
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  ngOnInit(): void {
    if (!this.domainConfig) {
      throw new Error('QueryPanelComponent requires domainConfig input');
    }

    // Load dynamic options for filters with endpoints
    this.loadDynamicFilterOptions();

    // Subscribe to filter state
    this.filters$ = this.resourceService.filters$;

    this.filters$
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.currentFilters = { ...filters as any };
        this.cdr.markForCheck();
      });

    // Pop-out window support
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================================
  // Filter Change Handling
  // ============================================================================

  /**
   * Handle filter input change
   *
   * @param field - Filter field ID
   * @param value - New value
   * @param debounce - Whether to debounce this change
   */
  onFilterChange(field: string, value: any, debounce = false): void {
    // Update local model immediately
    this.currentFilters[field] = value;

    if (debounce) {
      this.searchSubject.next({ field, value });
    } else {
      this.applyFilterChange(field, value);
    }
  }

  /**
   * Apply filter change to state management
   */
  private applyFilterChange(field: string, value: any): void {
    const isEmpty = value === null ||
                    value === undefined ||
                    value === '' ||
                    (Array.isArray(value) && value.length === 0);

    const paramValue = isEmpty ? null : value;

    if (this.popOutContext.isInPopOut()) {
      // In pop-out: emit event for parent
      this.urlParamsChange.emit({
        [field]: paramValue,
        page: 1
      });
    } else {
      // In main window: update ResourceManagementService
      const newFilters: Record<string, any> = {
        ...this.currentFilters,
        page: 1
      };

      if (isEmpty) {
        newFilters[field] = undefined;
      } else {
        newFilters[field] = value;
      }

      this.resourceService.updateFilters(newFilters as unknown as TFilters);
    }
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    if (this.popOutContext.isInPopOut()) {
      this.clearAllFilters.emit();
    } else {
      this.resourceService.updateFilters({
        page: 1,
        size: this.currentFilters['size'] || 20
      } as unknown as TFilters);
    }
  }

  // ============================================================================
  // Options Management
  // ============================================================================

  /**
   * Get options for a filter
   */
  getFilterOptions(filterId: string): FilterOption[] {
    if (this.dynamicOptions[filterId]) {
      return this.dynamicOptions[filterId];
    }
    const filterDef = this.domainConfig.filters.find(f => f.id === filterId);
    return filterDef?.options || [];
  }

  /**
   * Load dynamic options from API
   */
  private loadDynamicFilterOptions(): void {
    const filtersWithEndpoint = this.domainConfig.filters.filter(f => f.optionsEndpoint);

    filtersWithEndpoint.forEach(filterDef => {
      const endpoint = `${this.domainConfig.apiBaseUrl}/agg/${filterDef.optionsEndpoint}`;

      this.http.get<{ field: string; values: Array<{ value: string; count: number }> }>(endpoint)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.dynamicOptions[filterDef.id] = response.values.map(item => ({
              value: item.value,
              label: item.value
            }));
            this.cdr.markForCheck();
          },
          error: (err) => {
            console.error(`Failed to load options for ${filterDef.id}:`, err);
          }
        });
    });
  }

  // ============================================================================
  // Autocomplete
  // ============================================================================

  /**
   * Handle autocomplete search
   */
  onAutocompleteSearch(event: { query: string }, filterDef: FilterDefinition): void {
    if (!filterDef.autocompleteEndpoint) {
      return;
    }

    const query = event.query;
    const limit = 10;
    const endpoint = `${this.domainConfig.apiBaseUrl}/${filterDef.autocompleteEndpoint}?search=${encodeURIComponent(query)}&limit=${limit}`;

    this.http.get<Record<string, string[]>>(endpoint)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const values = Object.values(response)[0] || [];
          this.autocompleteSuggestions[filterDef.id] = values;
          this.cdr.detectChanges();
        },
        error: () => {
          this.autocompleteSuggestions[filterDef.id] = [];
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Handle autocomplete focus - load initial suggestions
   */
  onAutocompleteFocus(filterDef: FilterDefinition): void {
    if (this.autocompleteSuggestions[filterDef.id]?.length > 0) {
      return;
    }
    this.onAutocompleteSearch({ query: '' }, filterDef);
  }
}
```

### Step 806.2: Create the Query Panel Template

Create the file `src/app/framework/components/query-panel/query-panel.component.html`:

```html
<!-- src/app/framework/components/query-panel/query-panel.component.html -->
<!-- VERSION 1 (Section 806) - Dynamic filter controls -->

<div class="query-panel-container">
  <div class="filter-panel-container">
    <div class="filter-grid">
      <!-- Dynamic Filter Rendering -->
      <ng-container *ngFor="let filterDef of domainConfig.filters">
        <!-- Skip search filter (handled separately) -->
        <ng-container *ngIf="filterDef.id !== 'search'">
          <div class="filter-field">
            <label [for]="filterDef.id">{{ filterDef.label }}</label>

            <!-- Text Input -->
            <ng-container *ngIf="filterDef.type === 'text'">
              <span class="p-input-icon-right" style="display: block;">
                <i *ngIf="currentFilters[filterDef.id]"
                  class="pi pi-times"
                  (click)="onFilterChange(filterDef.id, null)"
                  style="cursor: pointer;"></i>
                <input pInputText
                  [id]="filterDef.id"
                  [(ngModel)]="currentFilters[filterDef.id]"
                  (ngModelChange)="onFilterChange(filterDef.id, $event, true)"
                  [placeholder]="filterDef.placeholder || ''"
                  style="width: 100%;">
              </span>
            </ng-container>

            <!-- Number Input -->
            <ng-container *ngIf="filterDef.type === 'number'">
              <div class="p-inputgroup">
                <p-inputNumber
                  [id]="filterDef.id"
                  [(ngModel)]="currentFilters[filterDef.id]"
                  (ngModelChange)="onFilterChange(filterDef.id, $event)"
                  [showButtons]="true"
                  [min]="+(filterDef.min ?? 0)"
                  [max]="+(filterDef.max ?? 999999)"
                  [step]="filterDef.step ?? 1"
                  [placeholder]="filterDef.placeholder || ''">
                </p-inputNumber>
                <button *ngIf="currentFilters[filterDef.id] != null"
                  pButton
                  type="button"
                  icon="pi pi-times"
                  class="p-button-outlined p-button-secondary"
                  (click)="onFilterChange(filterDef.id, null)">
                </button>
              </div>
            </ng-container>

            <!-- Range Input (Min) -->
            <ng-container *ngIf="filterDef.type === 'range'">
              <div class="p-inputgroup">
                <p-inputNumber
                  [id]="filterDef.id + 'Min'"
                  [(ngModel)]="currentFilters[filterDef.id + 'Min']"
                  (ngModelChange)="onFilterChange(filterDef.id + 'Min', $event)"
                  [showButtons]="true"
                  [min]="+(filterDef.min ?? 0)"
                  [max]="+(filterDef.max ?? 999999)"
                  placeholder="Min">
                </p-inputNumber>
                <button *ngIf="currentFilters[filterDef.id + 'Min'] != null"
                  pButton
                  type="button"
                  icon="pi pi-times"
                  class="p-button-outlined p-button-secondary"
                  (click)="onFilterChange(filterDef.id + 'Min', null)">
                </button>
              </div>
            </ng-container>

            <!-- Select Dropdown -->
            <ng-container *ngIf="filterDef.type === 'select'">
              <p-dropdown
                [id]="filterDef.id"
                [(ngModel)]="currentFilters[filterDef.id]"
                (ngModelChange)="onFilterChange(filterDef.id, $event)"
                [options]="getFilterOptions(filterDef.id)"
                optionLabel="label"
                optionValue="value"
                [showClear]="true"
                [filter]="true"
                filterBy="label"
                [placeholder]="filterDef.placeholder || 'Select...'">
              </p-dropdown>
            </ng-container>

            <!-- Multi-Select -->
            <ng-container *ngIf="filterDef.type === 'multiselect'">
              <p-multiSelect
                [id]="filterDef.id"
                [(ngModel)]="currentFilters[filterDef.id]"
                (ngModelChange)="onFilterChange(filterDef.id, $event)"
                [options]="getFilterOptions(filterDef.id)"
                optionLabel="label"
                optionValue="value"
                [filter]="true"
                [showClear]="true"
                [placeholder]="filterDef.placeholder || 'Select...'">
              </p-multiSelect>
            </ng-container>

            <!-- Autocomplete -->
            <ng-container *ngIf="filterDef.type === 'autocomplete'">
              <p-autoComplete
                [id]="filterDef.id"
                [(ngModel)]="currentFilters[filterDef.id]"
                (onSelect)="onFilterChange(filterDef.id, $event)"
                (onClear)="onFilterChange(filterDef.id, null)"
                [suggestions]="autocompleteSuggestions[filterDef.id] || []"
                (completeMethod)="onAutocompleteSearch($event, filterDef)"
                (onFocus)="onAutocompleteFocus(filterDef)"
                [minLength]="1"
                [forceSelection]="false"
                [placeholder]="filterDef.placeholder || 'Type to search...'"
                [showClear]="true"
                [delay]="300"
                appendTo="body"
                styleClass="w-full">
              </p-autoComplete>
            </ng-container>

            <!-- Date Picker -->
            <ng-container *ngIf="filterDef.type === 'date'">
              <div class="p-inputgroup">
                <p-calendar
                  [id]="filterDef.id"
                  [(ngModel)]="currentFilters[filterDef.id]"
                  (ngModelChange)="onFilterChange(filterDef.id, $event)"
                  dateFormat="yy-mm-dd">
                </p-calendar>
                <button *ngIf="currentFilters[filterDef.id]"
                  pButton
                  type="button"
                  icon="pi pi-times"
                  class="p-button-outlined p-button-secondary"
                  (click)="onFilterChange(filterDef.id, null)">
                </button>
              </div>
            </ng-container>

            <!-- Boolean Checkbox -->
            <ng-container *ngIf="filterDef.type === 'boolean'">
              <p-checkbox
                [id]="filterDef.id"
                [(ngModel)]="currentFilters[filterDef.id]"
                (ngModelChange)="onFilterChange(filterDef.id, $event)"
                [binary]="true">
              </p-checkbox>
            </ng-container>
          </div>

          <!-- Range Max (second input) -->
          <div *ngIf="filterDef.type === 'range'" class="filter-field">
            <label [for]="filterDef.id + 'Max'">{{ filterDef.label }} Max</label>
            <div class="p-inputgroup">
              <p-inputNumber
                [id]="filterDef.id + 'Max'"
                [(ngModel)]="currentFilters[filterDef.id + 'Max']"
                (ngModelChange)="onFilterChange(filterDef.id + 'Max', $event)"
                [showButtons]="true"
                [min]="+(filterDef.min ?? 0)"
                [max]="+(filterDef.max ?? 999999)"
                placeholder="Max">
              </p-inputNumber>
              <button *ngIf="currentFilters[filterDef.id + 'Max'] != null"
                pButton
                type="button"
                icon="pi pi-times"
                class="p-button-outlined p-button-secondary"
                (click)="onFilterChange(filterDef.id + 'Max', null)">
              </button>
            </div>
          </div>
        </ng-container>
      </ng-container>

      <!-- Clear Filters Button -->
      <div class="filter-field">
        <label>&nbsp;</label>
        <button pButton
          type="button"
          label="Clear Filters"
          icon="pi pi-filter-slash"
          class="p-button-outlined"
          (click)="clearFilters()">
        </button>
      </div>
    </div>
  </div>
</div>
```

### Step 806.3: Create the Query Panel Styles

Create the file `src/app/framework/components/query-panel/query-panel.component.scss`:

```scss
// src/app/framework/components/query-panel/query-panel.component.scss
// VERSION 1 (Section 806) - Filter panel styles

.query-panel-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;

  .filter-panel-container {
    border: 1px solid var(--surface-border);
    border-radius: 6px;
    overflow: hidden;
    background: var(--surface-card);
  }

  .filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    align-items: end;
    padding: 1rem;

    .filter-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      label {
        font-weight: 600;
        font-size: 0.875rem;
        color: var(--text-color);
      }

      input,
      p-inputNumber,
      p-dropdown,
      p-multiSelect,
      p-calendar,
      p-autoComplete,
      p-checkbox {
        width: 100%;
      }

      // Make PrimeNG components full width
      ::ng-deep {
        .p-dropdown,
        .p-multiselect,
        .p-calendar,
        .p-autocomplete {
          width: 100%;
        }

        .p-autocomplete-input {
          width: 100%;
        }
      }
    }
  }
}
```

### Step 806.4: Create the Module Export

Create the file `src/app/framework/components/query-panel/index.ts`:

```typescript
// src/app/framework/components/query-panel/index.ts
// VERSION 1 (Section 806) - Barrel export

export { QueryPanelComponent } from './query-panel.component';
```

### Step 806.5: Register in Framework Module

Open `src/app/framework/framework.module.ts` and add the component:

```typescript
// src/app/framework/framework.module.ts
// VERSION 7 (Section 806) - Add QueryPanelComponent
// Replaces VERSION 6 from Section 805

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { RippleModule } from 'primeng/ripple';
import { ChipModule } from 'primeng/chip';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CalendarModule } from 'primeng/calendar';

import { BaseChartComponent } from './components/base-chart/base-chart.component';
import { BasePickerComponent } from './components/base-picker/base-picker.component';
import { BasicResultsTableComponent } from './components/basic-results-table/basic-results-table.component';
import { StatisticsPanelComponent } from './components/statistics-panel/statistics-panel.component';
import { InlineFiltersComponent } from './components/inline-filters/inline-filters.component';
import { QueryPanelComponent } from './components/query-panel/query-panel.component';

@NgModule({
  declarations: [
    BaseChartComponent,
    BasePickerComponent,
    BasicResultsTableComponent,
    StatisticsPanelComponent,
    InlineFiltersComponent,
    QueryPanelComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    DragDropModule,
    ButtonModule,
    TableModule,
    CheckboxModule,
    InputTextModule,
    InputNumberModule,
    SkeletonModule,
    MessageModule,
    RippleModule,
    ChipModule,
    TooltipModule,
    DropdownModule,
    MultiSelectModule,
    AutoCompleteModule,
    CalendarModule
  ],
  exports: [
    BaseChartComponent,
    BasePickerComponent,
    BasicResultsTableComponent,
    StatisticsPanelComponent,
    InlineFiltersComponent,
    QueryPanelComponent
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

### 3. Verify All PrimeNG Imports

```bash
$ grep -E "DropdownModule|MultiSelectModule|AutoCompleteModule|CalendarModule" src/app/framework/framework.module.ts
```

Expected: All modules are in imports array.

### 4. Manual Inspection

Check `src/app/framework/components/query-panel/query-panel.component.html`:
- Each filter type has its own `*ngIf` block
- All inputs use `[(ngModel)]` for two-way binding
- Text inputs use `debounce: true` in `onFilterChange`

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| Filter controls not rendering | `filterDef.type` not matching template conditions | Verify filter type strings match exactly |
| Dropdown options empty | Dynamic options not loaded | Check `optionsEndpoint` in filter definition |
| Autocomplete not showing suggestions | API endpoint incorrect | Verify `autocompleteEndpoint` and API response format |
| Debounce not working | `searchSubject` not subscribed | Ensure constructor sets up debounce subscription |
| Clear button doesn't reset page | `page: 1` not included in update | Verify `applyFilterChange` includes page reset |

---

## Key Takeaways

1. **Dynamic rendering from configuration** - One component handles all filter types
2. **Debounce improves performance** - Text inputs wait before triggering API calls
3. **Two-way binding with manual updates** - `ngModel` updates local state; `ngModelChange` triggers state management

---

## Acceptance Criteria

- [ ] `QueryPanelComponent` accepts `domainConfig` input
- [ ] Text filters render with clear button
- [ ] Number filters render with spinner buttons
- [ ] Range filters render as two inputs (Min/Max)
- [ ] Select filters render as dropdowns
- [ ] Multiselect filters render as multi-select dropdowns
- [ ] Autocomplete filters load suggestions from API
- [ ] Date filters render as date pickers
- [ ] Boolean filters render as checkboxes
- [ ] Text inputs debounce for 300ms before applying
- [ ] "Clear Filters" button resets all filters
- [ ] Filter changes update URL state
- [ ] Pop-out window receives state updates
- [ ] Component is registered in `FrameworkModule`
- [ ] `ng build` completes with no errors

---

## Next Step

Proceed to `807-column-manager-component.md` to build the table column visibility manager.
