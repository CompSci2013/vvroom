# 807: Column Manager Component

**Status:** Planning
**Depends On:** 204-table-config-interface, 803-basic-results-table
**Blocks:** 904-automobile-discover

---

## Learning Objectives

After completing this section, you will:
- Understand how to manage table column visibility with user preferences
- Know how to persist column settings to localStorage
- Be able to implement drag-and-drop column reordering

---

## Objective

Build a column manager component that allows users to show/hide and reorder table columns. The component displays a list of available columns with checkboxes and drag handles, persists preferences to localStorage, and emits column configuration changes to parent components.

---

## Why

Data tables often have many columns, but users typically only need a subset for their current task. The **Column Manager Component** provides:

1. **Column visibility toggle**: Show/hide columns without losing data
2. **Column reordering**: Drag columns to customize display order
3. **Persistence**: Settings survive browser refresh
4. **Domain-agnostic**: Works with any table configuration

This enhances user experience by letting each user customize their view.

### Angular Style Guide References

- [Style 03-01](https://angular.io/guide/styleguide#style-03-01): Use single responsibility principle
- [Style 05-02](https://angular.io/guide/styleguide#style-05-02): Use input properties for data binding

### LocalStorage Persistence

Column preferences are stored in localStorage using a domain-specific key:
```
vvroom_columns_{domainId}
```

This ensures settings persist across sessions and don't conflict between domains.

---

## What

### Step 807.1: Create the Column Manager Interface

Create the file `src/app/framework/components/column-manager/column-manager.interface.ts`:

```typescript
// src/app/framework/components/column-manager/column-manager.interface.ts
// VERSION 1 (Section 807) - Column manager types

import { TableColumn } from '../../models/table-config.interface';

/**
 * Column visibility state
 */
export interface ColumnState {
  /**
   * Column field name (unique identifier)
   */
  field: string;

  /**
   * Whether column is visible
   */
  visible: boolean;

  /**
   * Display order (lower = earlier)
   */
  order: number;
}

/**
 * Column manager output event
 */
export interface ColumnConfigEvent {
  /**
   * Visible columns in display order
   */
  visibleColumns: TableColumn[];

  /**
   * All column states (for persistence)
   */
  allColumnStates: ColumnState[];
}
```

### Step 807.2: Create the Column Manager Component TypeScript

Create the file `src/app/framework/components/column-manager/column-manager.component.ts`:

```typescript
// src/app/framework/components/column-manager/column-manager.component.ts
// VERSION 1 (Section 807) - Table column visibility manager

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

import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';

import { TableColumn } from '../../models/table-config.interface';
import { ColumnState, ColumnConfigEvent } from './column-manager.interface';

/**
 * Column Manager Component
 *
 * Provides UI for managing table column visibility and order.
 * Persists settings to localStorage.
 *
 * @example
 * ```html
 * <app-column-manager
 *   [columns]="tableConfig.columns"
 *   [domainId]="'automobile'"
 *   (columnConfigChange)="onColumnConfigChange($event)">
 * </app-column-manager>
 * ```
 */
@Component({
  selector: 'app-column-manager',
  templateUrl: './column-manager.component.html',
  styleUrls: ['./column-manager.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColumnManagerComponent implements OnInit, OnDestroy {

  /**
   * Available columns from table config
   */
  @Input() columns: TableColumn[] = [];

  /**
   * Domain ID for localStorage key
   */
  @Input() domainId = 'default';

  /**
   * Minimum number of visible columns required
   */
  @Input() minVisibleColumns = 1;

  /**
   * Emits when column configuration changes
   */
  @Output() columnConfigChange = new EventEmitter<ColumnConfigEvent>();

  /**
   * Whether the column manager dialog is visible
   */
  dialogVisible = false;

  /**
   * Column states for the manager UI
   */
  columnStates: ColumnState[] = [];

  private readonly STORAGE_KEY_PREFIX = 'vvroom_columns_';

  constructor(private readonly cdr: ChangeDetectorRef) {}

  // ============================================================================
  // Lifecycle
  // ============================================================================

  ngOnInit(): void {
    this.loadColumnStates();
    this.emitCurrentConfig();
  }

  ngOnDestroy(): void {
    // Save on destroy in case of unsaved changes
    this.saveColumnStates();
  }

  // ============================================================================
  // Dialog Management
  // ============================================================================

  /**
   * Open the column manager dialog
   */
  openDialog(): void {
    this.dialogVisible = true;
    this.cdr.markForCheck();
  }

  /**
   * Close the dialog and save changes
   */
  closeDialog(): void {
    this.saveColumnStates();
    this.emitCurrentConfig();
    this.dialogVisible = false;
    this.cdr.markForCheck();
  }

  // ============================================================================
  // Column State Management
  // ============================================================================

  /**
   * Load column states from localStorage or initialize from input columns
   */
  private loadColumnStates(): void {
    const storageKey = this.STORAGE_KEY_PREFIX + this.domainId;
    const savedStates = localStorage.getItem(storageKey);

    if (savedStates) {
      try {
        const parsed: ColumnState[] = JSON.parse(savedStates);

        // Merge saved states with current columns
        // (handles new columns added since last save)
        this.columnStates = this.mergeColumnStates(parsed);
      } catch {
        // Invalid JSON, initialize fresh
        this.initializeColumnStates();
      }
    } else {
      this.initializeColumnStates();
    }
  }

  /**
   * Initialize column states from input columns
   */
  private initializeColumnStates(): void {
    this.columnStates = this.columns.map((col, index) => ({
      field: col.field,
      visible: col.hidden !== true,
      order: index
    }));
  }

  /**
   * Merge saved states with current columns
   */
  private mergeColumnStates(savedStates: ColumnState[]): ColumnState[] {
    const savedByField = new Map(savedStates.map(s => [s.field, s]));
    const merged: ColumnState[] = [];

    // Add states for all current columns
    this.columns.forEach((col, index) => {
      const saved = savedByField.get(col.field);
      if (saved) {
        merged.push({ ...saved });
        savedByField.delete(col.field);
      } else {
        // New column not in saved states
        merged.push({
          field: col.field,
          visible: col.hidden !== true,
          order: index + 1000 // Put new columns at end
        });
      }
    });

    // Sort by order
    merged.sort((a, b) => a.order - b.order);

    // Normalize order values
    merged.forEach((state, index) => {
      state.order = index;
    });

    return merged;
  }

  /**
   * Save column states to localStorage
   */
  private saveColumnStates(): void {
    const storageKey = this.STORAGE_KEY_PREFIX + this.domainId;
    localStorage.setItem(storageKey, JSON.stringify(this.columnStates));
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle visibility checkbox change
   */
  onVisibilityChange(state: ColumnState): void {
    // Enforce minimum visible columns
    const visibleCount = this.columnStates.filter(s => s.visible).length;
    if (!state.visible && visibleCount <= this.minVisibleColumns) {
      // Can't hide, restore visible state
      state.visible = true;
      this.cdr.markForCheck();
      return;
    }

    this.cdr.markForCheck();
  }

  /**
   * Handle drag-drop reordering
   */
  onColumnDrop(event: CdkDragDrop<ColumnState[]>): void {
    moveItemInArray(this.columnStates, event.previousIndex, event.currentIndex);

    // Update order values
    this.columnStates.forEach((state, index) => {
      state.order = index;
    });

    this.cdr.markForCheck();
  }

  /**
   * Show all columns
   */
  showAll(): void {
    this.columnStates.forEach(state => {
      state.visible = true;
    });
    this.cdr.markForCheck();
  }

  /**
   * Reset to default column configuration
   */
  resetToDefault(): void {
    this.initializeColumnStates();
    this.cdr.markForCheck();
  }

  // ============================================================================
  // Output
  // ============================================================================

  /**
   * Emit current column configuration
   */
  private emitCurrentConfig(): void {
    // Build visible columns in order
    const visibleColumns: TableColumn[] = [];
    const columnsByField = new Map(this.columns.map(c => [c.field, c]));

    this.columnStates
      .filter(state => state.visible)
      .forEach(state => {
        const column = columnsByField.get(state.field);
        if (column) {
          visibleColumns.push(column);
        }
      });

    const event: ColumnConfigEvent = {
      visibleColumns,
      allColumnStates: [...this.columnStates]
    };

    this.columnConfigChange.emit(event);
  }

  // ============================================================================
  // Template Helpers
  // ============================================================================

  /**
   * Get column definition for a state
   */
  getColumn(state: ColumnState): TableColumn | undefined {
    return this.columns.find(c => c.field === state.field);
  }

  /**
   * Check if a column can be hidden
   */
  canHide(state: ColumnState): boolean {
    const visibleCount = this.columnStates.filter(s => s.visible).length;
    return state.visible && visibleCount > this.minVisibleColumns;
  }
}
```

### Step 807.3: Create the Column Manager Template

Create the file `src/app/framework/components/column-manager/column-manager.component.html`:

```html
<!-- src/app/framework/components/column-manager/column-manager.component.html -->
<!-- VERSION 1 (Section 807) - Column visibility manager UI -->

<!-- Trigger Button -->
<button
  pButton
  type="button"
  icon="pi pi-sliders-h"
  class="p-button-text p-button-secondary"
  pTooltip="Manage Columns"
  tooltipPosition="top"
  (click)="openDialog()">
</button>

<!-- Column Manager Dialog -->
<p-dialog
  header="Manage Columns"
  [(visible)]="dialogVisible"
  [modal]="true"
  [style]="{ width: '400px' }"
  [closable]="true"
  [closeOnEscape]="true"
  [dismissableMask]="true"
  (onHide)="closeDialog()">

  <!-- Dialog Content -->
  <div class="column-manager-content">
    <p class="instructions">
      Drag to reorder. Check/uncheck to show/hide columns.
    </p>

    <!-- Column List with Drag-Drop -->
    <div
      cdkDropList
      (cdkDropListDropped)="onColumnDrop($event)"
      class="column-list">

      <div
        *ngFor="let state of columnStates"
        cdkDrag
        class="column-item">

        <!-- Drag Handle -->
        <div class="drag-handle" cdkDragHandle>
          <i class="pi pi-bars"></i>
        </div>

        <!-- Visibility Checkbox -->
        <p-checkbox
          [(ngModel)]="state.visible"
          [binary]="true"
          (onChange)="onVisibilityChange(state)"
          [pTooltip]="!canHide(state) ? 'At least one column must be visible' : ''"
          tooltipPosition="right">
        </p-checkbox>

        <!-- Column Name -->
        <span class="column-name">
          {{ getColumn(state)?.header || state.field }}
        </span>
      </div>
    </div>
  </div>

  <!-- Dialog Footer -->
  <ng-template pTemplate="footer">
    <div class="dialog-actions">
      <button
        pButton
        type="button"
        label="Show All"
        icon="pi pi-eye"
        class="p-button-text"
        (click)="showAll()">
      </button>
      <button
        pButton
        type="button"
        label="Reset"
        icon="pi pi-refresh"
        class="p-button-text"
        (click)="resetToDefault()">
      </button>
      <button
        pButton
        type="button"
        label="Done"
        icon="pi pi-check"
        class="p-button-primary"
        (click)="closeDialog()">
      </button>
    </div>
  </ng-template>
</p-dialog>
```

### Step 807.4: Create the Column Manager Styles

Create the file `src/app/framework/components/column-manager/column-manager.component.scss`:

```scss
// src/app/framework/components/column-manager/column-manager.component.scss
// VERSION 1 (Section 807) - Column manager styles

.column-manager-content {
  .instructions {
    margin: 0 0 1rem 0;
    font-size: 0.875rem;
    color: var(--text-color-secondary);
  }
}

.column-list {
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  overflow: hidden;
}

.column-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
  cursor: default;

  &:last-child {
    border-bottom: none;
  }

  .drag-handle {
    cursor: move;
    color: var(--text-color-secondary);
    padding: 0.25rem;
    transition: color 0.2s;

    &:hover {
      color: var(--text-color);
    }

    i {
      font-size: 1rem;
    }
  }

  .column-name {
    flex: 1;
    font-size: 0.875rem;
    color: var(--text-color);
  }

  // CDK Drag states
  &.cdk-drag-preview {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    background: var(--surface-card);
    border: 1px solid var(--primary-color);
    border-radius: 4px;
  }

  &.cdk-drag-placeholder {
    opacity: 0.4;
    background: var(--surface-hover);
  }
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
```

### Step 807.5: Create the Module Export

Create the file `src/app/framework/components/column-manager/index.ts`:

```typescript
// src/app/framework/components/column-manager/index.ts
// VERSION 1 (Section 807) - Barrel export

export { ColumnManagerComponent } from './column-manager.component';
export { ColumnState, ColumnConfigEvent } from './column-manager.interface';
```

### Step 807.6: Register in Framework Module

Open `src/app/framework/framework.module.ts` and add the component:

```typescript
// src/app/framework/framework.module.ts
// VERSION 8 (Section 807) - Add ColumnManagerComponent
// Replaces VERSION 7 from Section 806

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
import { DialogModule } from 'primeng/dialog';

import { BaseChartComponent } from './components/base-chart/base-chart.component';
import { BasePickerComponent } from './components/base-picker/base-picker.component';
import { BasicResultsTableComponent } from './components/basic-results-table/basic-results-table.component';
import { StatisticsPanelComponent } from './components/statistics-panel/statistics-panel.component';
import { InlineFiltersComponent } from './components/inline-filters/inline-filters.component';
import { QueryPanelComponent } from './components/query-panel/query-panel.component';
import { ColumnManagerComponent } from './components/column-manager/column-manager.component';

@NgModule({
  declarations: [
    BaseChartComponent,
    BasePickerComponent,
    BasicResultsTableComponent,
    StatisticsPanelComponent,
    InlineFiltersComponent,
    QueryPanelComponent,
    ColumnManagerComponent
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
    CalendarModule,
    DialogModule
  ],
  exports: [
    BaseChartComponent,
    BasePickerComponent,
    BasicResultsTableComponent,
    StatisticsPanelComponent,
    InlineFiltersComponent,
    QueryPanelComponent,
    ColumnManagerComponent
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

### 3. Verify LocalStorage Key

Check `src/app/framework/components/column-manager/column-manager.component.ts`:
- `STORAGE_KEY_PREFIX` is defined
- `loadColumnStates` reads from localStorage
- `saveColumnStates` writes to localStorage

### 4. Verify Drag-Drop Integration

Check the template:
- `cdkDropList` on the column list
- `cdkDrag` on each column item
- `cdkDragHandle` on the drag handle

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| Column order not persisting | localStorage not saving | Verify `saveColumnStates` is called in `closeDialog` |
| New columns not appearing | Merge logic not handling new columns | Check `mergeColumnStates` adds missing columns |
| Can't hide last column | Minimum columns check working | This is expected behavior; verify `minVisibleColumns` input |
| Drag preview looks wrong | Missing CDK styles | Ensure `.cdk-drag-preview` styles are defined |
| Dialog doesn't close | `dialogVisible` not updating | Verify `closeDialog` sets `dialogVisible = false` |

---

## Key Takeaways

1. **LocalStorage provides simple persistence** - No backend required for user preferences
2. **Merge handles schema evolution** - New columns appear even if user has saved preferences
3. **CDK Drag-Drop is reusable** - Same pattern as StatisticsPanel (Section 804)

---

## Acceptance Criteria

- [ ] `ColumnManagerComponent` accepts `columns` and `domainId` inputs
- [ ] Clicking the button opens a dialog
- [ ] Columns display with checkboxes and drag handles
- [ ] Checking/unchecking toggles column visibility
- [ ] Dragging reorders columns
- [ ] At least one column must remain visible
- [ ] "Show All" button shows all columns
- [ ] "Reset" button restores default order and visibility
- [ ] "Done" button closes dialog and saves settings
- [ ] Settings persist to localStorage
- [ ] Settings survive page refresh
- [ ] `columnConfigChange` emits visible columns in correct order
- [ ] Component is registered in `FrameworkModule`
- [ ] `ng build` completes with no errors

---

## Next Step

Proceed to `808-statistics-panel-2.md` to build the refined CDK horizontal chart grid.
