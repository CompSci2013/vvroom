# 311: Picker Config Registry

**Status:** Complete
**Depends On:** 205-picker-config-interface, 304-domain-config-registry
**Blocks:** Phase 8 (Framework Components - for picker dialogs)

---

## Learning Objectives

After completing this section, you will:
- Understand the Registry pattern for UI configurations
- Know how to decouple picker configuration from picker components
- Recognize the benefits of ID-based configuration lookup
- Be able to implement a type-safe configuration registry

---

## Objective

Create the `PickerConfigRegistry` that provides centralized management of picker configurations. Pickers are dialogs that let users select items (vehicles, manufacturers, models) from searchable tables.

---

## Why

Vvroom has multiple picker dialogs:
- **Vehicle Picker** — Select vehicles to compare
- **Manufacturer/Model Picker** — Filter by manufacturer and model
- **VIN Picker** — Find vehicles by VIN

Each picker needs configuration:
- Which columns to display
- How to fetch data
- Selection behavior (single vs multi-select)

### The Configuration Challenge

Where should picker configuration live?

**Option 1: In the picker component**
```typescript
@Component({...})
export class VehiclePickerComponent {
  columns = [
    { field: 'manufacturer', header: 'Manufacturer' },
    { field: 'model', header: 'Model' },
    // ...
  ];
}
```

Problem: Every picker duplicates configuration logic.

**Option 2: In the domain config**
```typescript
const AUTOMOBILE_CONFIG = {
  pickers: [VEHICLE_PICKER_CONFIG, MODEL_PICKER_CONFIG]
};
```

Problem: Components need to search arrays to find their config.

**Option 3: In a registry (our approach)**
```typescript
// At initialization
registry.register(VEHICLE_PICKER_CONFIG);

// In component
const config = registry.get('vehicle-picker');
```

Benefits:
- **O(1) lookup** by ID
- **Type-safe** retrieval with generics
- **Decoupled** from component hierarchy
- **Centralized** validation and management

### Usage Pattern

```typescript
// Domain config module registers pickers
@NgModule({...})
export class AutomobileDomainModule {
  constructor(private registry: PickerConfigRegistry) {
    registry.registerMultiple([
      VEHICLE_PICKER_CONFIG,
      MANUFACTURER_MODEL_PICKER_CONFIG
    ]);
  }
}

// Component looks up config by ID
@Component({...})
export class VehicleSelectionComponent {
  pickerConfig = this.registry.get<VehicleResult>('vehicle-picker');
}

// Or use ID in template
<app-base-picker [configId]="'vehicle-picker'"></app-base-picker>
```

---

## What

### Step 311.1: Create the Picker Config Registry Service

Create the file `src/app/framework/services/picker-config-registry.service.ts`:

```typescript
// src/app/framework/services/picker-config-registry.service.ts
// VERSION 1 (Section 311) - Picker configuration registry

import { Injectable } from '@angular/core';
import { PickerConfig } from '../models/picker-config.interface';

/**
 * Picker configuration registry service
 *
 * Centralized registry for managing picker configurations.
 * Allows registration and retrieval of picker configs by ID.
 *
 * **Why a Registry?**
 *
 * 1. **O(1) lookup** — Get config by ID without searching arrays
 * 2. **Type safety** — Generic retrieval preserves types
 * 3. **Centralized** — Single source of truth for picker configs
 * 4. **Decoupled** — Components don't need to know about domain config
 *
 * **Typical Flow:**
 *
 * 1. Domain module registers picker configs at init
 * 2. Components/templates reference pickers by ID
 * 3. BasePicker component looks up config from registry
 *
 * @example
 * ```typescript
 * // Registration (in domain module)
 * constructor(private registry: PickerConfigRegistry) {
 *   registry.registerMultiple(AUTOMOBILE_PICKER_CONFIGS);
 * }
 *
 * // Lookup (in component)
 * const config = registry.get<VehicleResult>('vehicle-picker');
 *
 * // Template usage
 * <app-base-picker [configId]="'vehicle-picker'"></app-base-picker>
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class PickerConfigRegistry {
  /**
   * Storage for registered picker configurations
   */
  private configs = new Map<string, PickerConfig<any>>();

  /**
   * Register a picker configuration
   *
   * @template T - The data model type
   * @param config - Picker configuration to register
   *
   * @example
   * ```typescript
   * const vehicleConfig: PickerConfig<VehicleResult> = {
   *   id: 'vehicle-picker',
   *   displayName: 'Vehicle Selection',
   *   columns: [...],
   *   // ...
   * };
   *
   * registry.register(vehicleConfig);
   * ```
   */
  register<T>(config: PickerConfig<T>): void {
    if (this.configs.has(config.id)) {
      console.warn(
        `[PickerConfigRegistry] Picker '${config.id}' already registered. Overwriting.`
      );
    }

    this.configs.set(config.id, config);
  }

  /**
   * Register multiple picker configurations
   *
   * @param configs - Array of picker configurations
   *
   * @example
   * ```typescript
   * registry.registerMultiple([
   *   VEHICLE_PICKER_CONFIG,
   *   MANUFACTURER_MODEL_PICKER_CONFIG,
   *   VIN_PICKER_CONFIG
   * ]);
   * ```
   */
  registerMultiple(configs: PickerConfig<any>[]): void {
    configs.forEach(config => this.register(config));
  }

  /**
   * Get picker configuration by ID
   *
   * @template T - The data model type
   * @param id - Picker configuration ID
   * @returns Picker configuration
   * @throws Error if picker ID not found
   *
   * @example
   * ```typescript
   * const config = registry.get<VehicleResult>('vehicle-picker');
   * // config is typed as PickerConfig<VehicleResult>
   * ```
   */
  get<T>(id: string): PickerConfig<T> {
    const config = this.configs.get(id);

    if (!config) {
      const available = this.getAllIds().join(', ') || '(none)';
      throw new Error(
        `[PickerConfigRegistry] Picker '${id}' not found. Available: ${available}`
      );
    }

    return config as PickerConfig<T>;
  }

  /**
   * Get picker configuration by ID (returns null if not found)
   *
   * @template T - The data model type
   * @param id - Picker configuration ID
   * @returns Picker configuration or null
   */
  tryGet<T>(id: string): PickerConfig<T> | null {
    return (this.configs.get(id) as PickerConfig<T>) ?? null;
  }

  /**
   * Check if picker configuration exists
   *
   * @param id - Picker configuration ID
   * @returns True if picker exists
   */
  has(id: string): boolean {
    return this.configs.has(id);
  }

  /**
   * Get all registered picker IDs
   *
   * @returns Array of picker IDs
   */
  getAllIds(): string[] {
    return Array.from(this.configs.keys());
  }

  /**
   * Get all registered picker configurations
   *
   * @returns Array of all picker configurations
   */
  getAll(): PickerConfig<any>[] {
    return Array.from(this.configs.values());
  }

  /**
   * Unregister a picker configuration
   *
   * @param id - Picker configuration ID
   * @returns True if removed, false if not found
   */
  unregister(id: string): boolean {
    return this.configs.delete(id);
  }

  /**
   * Clear all registered picker configurations
   */
  clear(): void {
    this.configs.clear();
  }

  /**
   * Get count of registered pickers
   *
   * @returns Number of registered pickers
   */
  getCount(): number {
    return this.configs.size;
  }

  /**
   * Get pickers by category (if categories are defined)
   *
   * @param category - Category to filter by
   * @returns Array of picker configurations in that category
   */
  getByCategory(category: string): PickerConfig<any>[] {
    return this.getAll().filter(config => config.category === category);
  }
}
```

---

### Step 311.2: Update the Barrel File

Update `src/app/framework/services/index.ts`:

```typescript
// src/app/framework/services/index.ts
// VERSION 10 (Section 311) - Added PickerConfigRegistry

export * from './url-state.service';
export * from './api.service';
export * from './request-coordinator.service';
export * from './domain-config-registry.service';
export * from './domain-config-validator.service';
export * from './popout-context.service';
export * from './popout-manager.service';
export * from './user-preferences.service';
export * from './filter-options.service';
export * from './picker-config-registry.service';
export * from './resource-management.service';
```

---

### Step 311.3: Ensure PickerConfig Interface Exists

Verify `src/app/framework/models/picker-config.interface.ts` includes the `category` property:

```typescript
// Add to PickerConfig interface if not present
export interface PickerConfig<T> {
  /** Unique picker identifier */
  id: string;

  /** Display name for the picker dialog */
  displayName: string;

  /** Columns to display in picker table */
  columns: ColumnConfig[];

  /** Optional category for grouping */
  category?: string;

  // ... other properties from Section 205
}
```

---

## Verification

### 1. Check File Exists

```bash
$ ls -la src/app/framework/services/picker-config-registry.service.ts
```

### 2. TypeScript Compilation Check

```bash
$ npx tsc --noEmit src/app/framework/services/picker-config-registry.service.ts
```

### 3. Build the Application

```bash
$ ng build
```

### 4. Verify Registration (Optional)

```typescript
// In any component
constructor(private pickerRegistry: PickerConfigRegistry) {
  // Register test config
  this.pickerRegistry.register({
    id: 'test-picker',
    displayName: 'Test Picker',
    columns: [{ field: 'name', header: 'Name' }]
  } as any);

  console.log('Registered pickers:', this.pickerRegistry.getAllIds());
  console.log('Test picker:', this.pickerRegistry.get('test-picker'));
}
```

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| `Picker 'X' not found` | Not registered | Register before component init |
| Registration order issues | Component loads before module | Use APP_INITIALIZER |
| Type errors on get<T>() | Wrong type parameter | Check data model matches config |
| Config overwritten warning | Same ID registered twice | Use unique IDs |

---

## Key Takeaways

1. **O(1) lookup beats array search** — Registry is faster than filtering arrays
2. **ID-based access decouples components** — Components don't know about domain config structure
3. **Type-safe retrieval preserves generics** — get<VehicleResult>() returns typed config

---

## Acceptance Criteria

- [ ] `src/app/framework/services/picker-config-registry.service.ts` exists
- [ ] Service is `@Injectable({ providedIn: 'root' })`
- [ ] `register()` stores config by ID
- [ ] `registerMultiple()` registers array of configs
- [ ] `get<T>()` returns typed config, throws if not found
- [ ] `tryGet<T>()` returns null instead of throwing
- [ ] `has()` checks if picker exists
- [ ] `getAllIds()` returns all registered IDs
- [ ] `getAll()` returns all configs
- [ ] `unregister()` removes config
- [ ] `clear()` removes all configs
- [ ] `getByCategory()` filters by category
- [ ] TypeScript compilation succeeds
- [ ] JSDoc comments document all public methods

---

## Phase 3B Complete

Congratulations! You have completed Phase 3B: Popout & Specialized Services.

**What you built:**
- PopOutContextService — Pop-out window detection and messaging
- PopOutManagerService — Pop-out window management from main window
- UserPreferencesService — localStorage-based preferences
- FilterOptionsService — Filter dropdown caching
- PickerConfigRegistry — Picker configuration lookup

**The Aha Moment:**
"Pop-out windows share state with the parent through a coordination service."

---

## Next Step

Proceed to `312-error-notification-service.md` to begin Phase 3C: Error Handling.
