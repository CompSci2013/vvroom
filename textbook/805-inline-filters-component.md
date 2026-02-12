# 805: Inline Filters Component

**Status:** Planning
**Depends On:** 203-filter-definition-interface, 301-url-state-service, 306-resource-management-service
**Blocks:** 904-automobile-discover

---

## Learning Objectives

After completing this section, you will:
- Understand how to display active filters as interactive chips
- Know how to synchronize chip state with URL parameters
- Be able to implement click-to-edit and click-to-remove functionality

---

## Objective

Build a compact inline filters component that displays active filters as chips. Each chip shows the filter label and value(s), can be clicked to edit, and has a remove button. This component provides a non-intrusive way to show what filters are currently active.

---

## Why

Users need to see what filters are active without opening a panel. The **Inline Filters Component** provides:

1. **Visibility**: Users immediately see which filters are applied
2. **Quick removal**: One-click removal of any filter
3. **Edit access**: Click a chip to open the filter editor
4. **Compact display**: Uses minimal vertical space

This component complements the Query Panel (806) by showing the "output" of filter selections in a condensed format.

### Angular Style Guide References

- [Style 03-01](https://angular.io/guide/styleguide#style-03-01): Use single responsibility principle
- [Style 05-02](https://angular.io/guide/styleguide#style-05-02): Use input properties for data binding

### URL-First Architecture Reference

The inline filters component reads active filters from URL state (via `UrlStateService`) and displays them as chips. When a chip is removed, the component emits an event that clears the corresponding URL parameter. The component never stores filter state internally - it only reflects URL state.

---

## What

### Step 805.1: Create the Inline Filters Component TypeScript

Create the file `src/app/framework/components/inline-filters/inline-filters.component.ts`:

```typescript
// src/app/framework/components/inline-filters/inline-filters.component.ts
// VERSION 1 (Section 805) - Active filter chip display

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
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ChipModule } from 'primeng/chip';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';

import { FilterDefinition } from '../../models/filter-definition.interface';
import { UrlStateService } from '../../services/url-state.service';

/**
 * Active filter representation for display
 */
export interface ActiveFilterChip {
  /**
   * Filter definition from domain config
   */
  definition: FilterDefinition;

  /**
   * Display values (may be truncated)
   */
  values: (string | number)[];

  /**
   * URL parameter value for this filter
   */
  urlValue: string;
}

/**
 * Inline Filters Component
 *
 * Displays active filters as removable chips.
 * Reads filter state from URL and emits events for removal/editing.
 *
 * @example
 * ```html
 * <app-inline-filters
 *   [filterDefinitions]="domainConfig.queryControlFilters"
 *   (filterRemove)="onFilterRemove($event)"
 *   (filterEdit)="onFilterEdit($event)">
 * </app-inline-filters>
 * ```
 */
@Component({
  selector: 'app-inline-filters',
  templateUrl: './inline-filters.component.html',
  styleUrls: ['./inline-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InlineFiltersComponent implements OnInit, OnDestroy {

  private readonly destroy$ = new Subject<void>();

  /**
   * Filter definitions from domain config
   */
  @Input() filterDefinitions: FilterDefinition[] = [];

  /**
   * Highlight filter definitions (optional)
   */
  @Input() highlightDefinitions: FilterDefinition[] = [];

  /**
   * Whether to show a "Clear All" button
   */
  @Input() showClearAll = true;

  /**
   * Emits when a filter chip is removed
   */
  @Output() filterRemove = new EventEmitter<ActiveFilterChip>();

  /**
   * Emits when a filter chip is clicked for editing
   */
  @Output() filterEdit = new EventEmitter<ActiveFilterChip>();

  /**
   * Emits when "Clear All" is clicked
   */
  @Output() clearAll = new EventEmitter<void>();

  /**
   * Active filters derived from URL state
   */
  activeFilters: ActiveFilterChip[] = [];

  /**
   * Active highlights derived from URL state
   */
  activeHighlights: ActiveFilterChip[] = [];

  constructor(
    private readonly urlState: UrlStateService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  // ============================================================================
  // Lifecycle
  // ============================================================================

  ngOnInit(): void {
    // Subscribe to URL changes to rebuild active filter chips
    this.urlState.params$
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.buildActiveFilters(params);
        this.buildActiveHighlights(params);
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================================
  // Active Filter Management
  // ============================================================================

  /**
   * Build active filter chips from URL params
   */
  private buildActiveFilters(params: Record<string, any>): void {
    this.activeFilters = [];

    for (const filterDef of this.filterDefinitions) {
      const chip = this.buildChipFromParams(params, filterDef);
      if (chip) {
        this.activeFilters.push(chip);
      }
    }
  }

  /**
   * Build active highlight chips from URL params
   */
  private buildActiveHighlights(params: Record<string, any>): void {
    this.activeHighlights = [];

    for (const filterDef of this.highlightDefinitions) {
      const chip = this.buildChipFromParams(params, filterDef);
      if (chip) {
        this.activeHighlights.push(chip);
      }
    }
  }

  /**
   * Build a chip from URL params for a given filter definition
   */
  private buildChipFromParams(
    params: Record<string, any>,
    filterDef: FilterDefinition
  ): ActiveFilterChip | null {
    if (filterDef.type === 'range') {
      // Range filters have min/max params
      const urlParamsConfig = filterDef.urlParams as { min: string; max: string };
      const minValue = params[urlParamsConfig.min];
      const maxValue = params[urlParamsConfig.max];

      if (minValue || maxValue) {
        const values: (string | number)[] = [];
        if (minValue) values.push(minValue);
        if (maxValue) values.push(maxValue);

        return {
          definition: filterDef,
          values,
          urlValue: `${minValue || ''}-${maxValue || ''}`
        };
      }
    } else {
      // Other filters have a single param
      const paramName = filterDef.urlParams as string;
      const paramValue = params[paramName];

      if (paramValue) {
        const values = Array.isArray(paramValue)
          ? paramValue
          : String(paramValue).split(',');

        return {
          definition: filterDef,
          values,
          urlValue: Array.isArray(paramValue) ? paramValue.join(',') : paramValue
        };
      }
    }

    return null;
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle chip remove click
   */
  onChipRemove(chip: ActiveFilterChip, event: Event): void {
    event.stopPropagation(); // Prevent chip click (edit) from firing
    this.filterRemove.emit(chip);
  }

  /**
   * Handle chip click (edit)
   */
  onChipClick(chip: ActiveFilterChip): void {
    this.filterEdit.emit(chip);
  }

  /**
   * Handle clear all click
   */
  onClearAll(): void {
    this.clearAll.emit();
  }

  // ============================================================================
  // Display Helpers
  // ============================================================================

  /**
   * Get display label for a chip
   */
  getChipLabel(chip: ActiveFilterChip): string {
    if (chip.definition.type === 'range') {
      const values = chip.values;
      if (values.length === 2) {
        return `${chip.definition.label}: ${values[0]} - ${values[1]}`;
      } else if (values.length === 1) {
        return `${chip.definition.label}: ${values[0]}+`;
      }
      return chip.definition.label;
    }

    // For multiselect, truncate if too many values
    const displayValues = chip.values.slice(0, 3).join(', ');
    const remaining = chip.values.length - 3;
    return remaining > 0
      ? `${chip.definition.label}: ${displayValues}... +${remaining}`
      : `${chip.definition.label}: ${displayValues}`;
  }

  /**
   * Get tooltip for a chip
   */
  getChipTooltip(chip: ActiveFilterChip): string {
    return `${chip.definition.label}: ${chip.values.join(', ')} (Click to edit)`;
  }

  /**
   * Check if there are any active filters or highlights
   */
  get hasActiveFilters(): boolean {
    return this.activeFilters.length > 0 || this.activeHighlights.length > 0;
  }
}
```

### Step 805.2: Create the Inline Filters Template

Create the file `src/app/framework/components/inline-filters/inline-filters.component.html`:

```html
<!-- src/app/framework/components/inline-filters/inline-filters.component.html -->
<!-- VERSION 1 (Section 805) - Active filter chips -->

<div class="inline-filters-container" *ngIf="hasActiveFilters">
  <!-- Filter Chips -->
  <div class="filter-chips" *ngIf="activeFilters.length > 0">
    <span class="chips-label">Filters:</span>
    <p-chip
      *ngFor="let chip of activeFilters"
      [label]="getChipLabel(chip)"
      [pTooltip]="getChipTooltip(chip)"
      tooltipPosition="top"
      [removable]="true"
      (onRemove)="onChipRemove(chip, $event)"
      (click)="onChipClick(chip)"
      styleClass="filter-chip clickable">
    </p-chip>
  </div>

  <!-- Highlight Chips -->
  <div class="highlight-chips" *ngIf="activeHighlights.length > 0">
    <span class="chips-label">Highlights:</span>
    <p-chip
      *ngFor="let chip of activeHighlights"
      [label]="getChipLabel(chip)"
      [pTooltip]="getChipTooltip(chip)"
      tooltipPosition="top"
      [removable]="true"
      (onRemove)="onChipRemove(chip, $event)"
      (click)="onChipClick(chip)"
      styleClass="highlight-chip clickable">
    </p-chip>
  </div>

  <!-- Clear All Button -->
  <button
    *ngIf="showClearAll && hasActiveFilters"
    pButton
    type="button"
    label="Clear All"
    icon="pi pi-times"
    class="p-button-text p-button-sm clear-all-button"
    (click)="onClearAll()">
  </button>
</div>
```

### Step 805.3: Create the Inline Filters Styles

Create the file `src/app/framework/components/inline-filters/inline-filters.component.scss`:

```scss
// src/app/framework/components/inline-filters/inline-filters.component.scss
// VERSION 1 (Section 805) - Filter chip styles

.inline-filters-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--surface-ground);
  border-radius: 6px;
  border: 1px solid var(--surface-border);
}

.filter-chips,
.highlight-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.chips-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color-secondary);
  margin-right: 0.25rem;
}

// Filter chip styling
::ng-deep {
  .filter-chip {
    background: var(--primary-color);
    color: var(--primary-color-text, #ffffff);
    border-radius: 16px;
    font-size: 0.875rem;

    &.clickable {
      cursor: pointer;
      transition: background-color 0.2s, transform 0.1s;

      &:hover {
        background: var(--primary-600, #4338ca);
        transform: translateY(-1px);
      }
    }

    .p-chip-remove-icon {
      color: var(--primary-color-text, #ffffff);
      margin-left: 0.5rem;

      &:hover {
        color: var(--red-400, #f87171);
      }
    }
  }

  .highlight-chip {
    background: var(--yellow-500, #eab308);
    color: var(--gray-900, #111827);
    border-radius: 16px;
    font-size: 0.875rem;

    &.clickable {
      cursor: pointer;
      transition: background-color 0.2s, transform 0.1s;

      &:hover {
        background: var(--yellow-600, #ca8a04);
        transform: translateY(-1px);
      }
    }

    .p-chip-remove-icon {
      color: var(--gray-900, #111827);
      margin-left: 0.5rem;

      &:hover {
        color: var(--red-600, #dc2626);
      }
    }
  }
}

.clear-all-button {
  margin-left: auto;
  color: var(--text-color-secondary);

  &:hover {
    color: var(--red-500, #ef4444);
    background: var(--red-50, #fef2f2);
  }
}

// Responsive
@media (max-width: 768px) {
  .inline-filters-container {
    flex-direction: column;
    align-items: flex-start;
  }

  .clear-all-button {
    margin-left: 0;
    margin-top: 0.5rem;
  }
}
```

### Step 805.4: Create the Module Export

Create the file `src/app/framework/components/inline-filters/index.ts`:

```typescript
// src/app/framework/components/inline-filters/index.ts
// VERSION 1 (Section 805) - Barrel export

export { InlineFiltersComponent, ActiveFilterChip } from './inline-filters.component';
```

### Step 805.5: Register in Framework Module

Open `src/app/framework/framework.module.ts` and add the component:

```typescript
// src/app/framework/framework.module.ts
// VERSION 6 (Section 805) - Add InlineFiltersComponent
// Replaces VERSION 5 from Section 804

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';
import { RippleModule } from 'primeng/ripple';
import { ChipModule } from 'primeng/chip';
import { TooltipModule } from 'primeng/tooltip';

import { BaseChartComponent } from './components/base-chart/base-chart.component';
import { BasePickerComponent } from './components/base-picker/base-picker.component';
import { BasicResultsTableComponent } from './components/basic-results-table/basic-results-table.component';
import { StatisticsPanelComponent } from './components/statistics-panel/statistics-panel.component';
import { InlineFiltersComponent } from './components/inline-filters/inline-filters.component';

@NgModule({
  declarations: [
    BaseChartComponent,
    BasePickerComponent,
    BasicResultsTableComponent,
    StatisticsPanelComponent,
    InlineFiltersComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    ButtonModule,
    TableModule,
    CheckboxModule,
    InputTextModule,
    SkeletonModule,
    MessageModule,
    RippleModule,
    ChipModule,
    TooltipModule
  ],
  exports: [
    BaseChartComponent,
    BasePickerComponent,
    BasicResultsTableComponent,
    StatisticsPanelComponent,
    InlineFiltersComponent
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

### 3. Verify PrimeNG Chip Import

```bash
$ grep "ChipModule" src/app/framework/framework.module.ts
```

Expected: `ChipModule` is in imports array.

### 4. Manual Inspection

Check `src/app/framework/components/inline-filters/inline-filters.component.ts`:
- Subscribes to `urlState.params$`
- Builds chips from URL parameters
- Emits events for remove/edit/clear all

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| Chips not showing | URL params not matching filter definitions | Verify `urlParams` in filter definitions match actual URL param names |
| Remove button doesn't work | Event propagation | Verify `event.stopPropagation()` is called in `onChipRemove` |
| Chip click and remove both fire | Missing stop propagation | Add `event.stopPropagation()` to remove handler |
| Highlights not distinguishable | Same styling as filters | Verify `.highlight-chip` has different background color |
| Chips wrap incorrectly | Missing `flex-wrap` | Ensure container has `flex-wrap: wrap` |

---

## Key Takeaways

1. **Chips provide compact filter visibility** - Users see active filters at a glance
2. **Events enable parent coordination** - The component doesn't modify URL directly; it emits events
3. **Separate filter and highlight sections** - Different visual treatment for different purposes

---

## Acceptance Criteria

- [ ] `InlineFiltersComponent` accepts filter and highlight definitions
- [ ] Active filters from URL display as chips
- [ ] Filter chips have primary color styling
- [ ] Highlight chips have yellow/warning color styling
- [ ] Clicking a chip emits `filterEdit` event
- [ ] Clicking remove icon emits `filterRemove` event
- [ ] "Clear All" button emits `clearAll` event
- [ ] Chips show truncated values with "+N more" for long lists
- [ ] Tooltips show full filter details
- [ ] Component hides when no active filters
- [ ] Component is registered in `FrameworkModule`
- [ ] `ng build` completes with no errors

---

## Next Step

Proceed to `806-query-panel-component.md` to build the full filter management panel.
