# 607: Domain Config Assembly

**Status:** Planning
**Depends On:** 201-domain-config-interface, 401-403 (models), 501-503 (adapters), 601-606 (configs)
**Blocks:** 608-domain-providers, 902-automobile-landing

---

## Learning Objectives

After completing this section, you will:
- Understand how the domain config factory pattern assembles all domain pieces
- Know how Angular's Injector enables runtime dependency resolution
- Recognize the complete structure of a DomainConfig object

---

## Objective

Create the automobile domain configuration factory function that assembles all models, adapters, and UI configurations into a single DomainConfig object. This is the central integration point for everything automobile-related.

---

## Why

Throughout Phase 4, 5, and 6, you created many separate pieces:

**Phase 4 (Models):**
- AutoSearchFilters
- VehicleResult
- VehicleStatistics

**Phase 5 (Adapters):**
- AutomobileUrlMapper
- AutomobileApiAdapter
- AutomobileCacheKeyBuilder

**Phase 6 (Configs):**
- AUTOMOBILE_FILTER_DEFINITIONS
- AUTOMOBILE_TABLE_CONFIG
- AUTOMOBILE_PICKER_CONFIGS (factory)
- AUTOMOBILE_QUERY_CONTROL_FILTERS
- AUTOMOBILE_HIGHLIGHT_FILTERS
- AUTOMOBILE_CHART_CONFIGS

Now you need to assemble these pieces into a single object that the framework can consume.

**Why a factory function instead of a constant?**

Some pieces need Angular services (like ApiService for the ApiAdapter and pickers). Angular's dependency injection provides services at runtime, not at module load time. A factory function receives the Injector and can resolve dependencies dynamically.

```typescript
// This won't work - ApiService isn't available at import time
export const DOMAIN_CONFIG = {
  apiAdapter: new AutomobileApiAdapter(apiService) // Error: apiService undefined
};

// This works - Injector provides ApiService at runtime
export function createAutomobileDomainConfig(injector: Injector) {
  const apiService = injector.get(ApiService);
  return {
    apiAdapter: new AutomobileApiAdapter(apiService)
  };
}
```

### Angular Style Guide References

- Factory functions are a recognized Angular pattern for complex object creation
- The Provider pattern (`useFactory` with `deps`) is documented in Angular DI guide

---

## What

### Step 607.1: Create the Domain Config File

Create the file that assembles the complete automobile domain configuration.

Create `src/app/domain-config/automobile/automobile.domain-config.ts`:

```typescript
// src/app/domain-config/automobile/automobile.domain-config.ts

/**
 * Automobile Domain Configuration
 *
 * Complete domain configuration combining all models, adapters, and UI configs
 * from milestones D1-D4.
 */

import { Injector } from '@angular/core';
import { DomainConfig } from '../../framework/models';
import { ApiService } from '../../framework/services';
import { environment } from '../../environments/environment';
import {
  AutoSearchFilters,
  VehicleResult,
  VehicleStatistics
} from './models';
import {
  AutomobileApiAdapter,
  AutomobileUrlMapper,
  AutomobileCacheKeyBuilder
} from './adapters';
import {
  AUTOMOBILE_TABLE_CONFIG,
  AUTOMOBILE_FILTER_DEFINITIONS,
  AUTOMOBILE_QUERY_CONTROL_FILTERS,
  AUTOMOBILE_HIGHLIGHT_FILTERS,
  AUTOMOBILE_CHART_CONFIGS,
  createAutomobilePickerConfigs
} from './configs';
import {
  ManufacturerChartDataSource,
  TopModelsChartDataSource,
  BodyClassChartDataSource,
  YearChartDataSource
} from './chart-sources';
import { Provider } from '@angular/core';
import { DOMAIN_CONFIG } from '../../framework/services';

/**
 * Factory function to create Automobile Domain Configuration
 *
 * This factory creates the domain configuration with properly injected dependencies.
 * Must be called with Angular's Injector to resolve service dependencies.
 *
 * @param injector - Angular injector for resolving dependencies
 * @returns Complete automobile domain configuration
 *
 * @example
 * // In app module
 * providers: [
 *   {
 *     provide: DOMAIN_CONFIG,
 *     useFactory: createAutomobileDomainConfig,
 *     deps: [Injector]
 *   }
 * ]
 */
export function createAutomobileDomainConfig(injector: Injector): DomainConfig<
  AutoSearchFilters,
  VehicleResult,
  VehicleStatistics
> {
  const apiService = injector.get(ApiService);
  const apiBaseUrl = environment.apiBaseUrl;

  return {
    // ==================== Identity ====================
    domainName: 'automobile',
    domainLabel: 'Automobile Discovery',
    apiBaseUrl: apiBaseUrl,

    // ==================== Type Models ====================
    filterModel: AutoSearchFilters,
    dataModel: VehicleResult,
    statisticsModel: VehicleStatistics,

    // ==================== Adapters ====================
    apiAdapter: new AutomobileApiAdapter(apiService, apiBaseUrl),
    urlMapper: new AutomobileUrlMapper(),
    cacheKeyBuilder: new AutomobileCacheKeyBuilder(),

    // ==================== UI Configuration ====================
    tableConfig: AUTOMOBILE_TABLE_CONFIG,
    pickers: createAutomobilePickerConfigs(injector),
    filters: AUTOMOBILE_FILTER_DEFINITIONS,
    queryControlFilters: AUTOMOBILE_QUERY_CONTROL_FILTERS,
    highlightFilters: AUTOMOBILE_HIGHLIGHT_FILTERS,
    charts: AUTOMOBILE_CHART_CONFIGS,
    chartDataSources: {
      'manufacturer': new ManufacturerChartDataSource(),
      'top-models': new TopModelsChartDataSource(),
      'body-class': new BodyClassChartDataSource(),
      'year': new YearChartDataSource()
    },

    // ==================== Feature Flags ====================
    features: {
      // Required features
      highlights: true,
      popOuts: true,
      rowExpansion: true,

      // Optional features
      statistics: true,
      export: true,
      columnManagement: true,
      statePersistence: true
    },

    // ==================== Metadata ====================
    metadata: {
      version: '1.0.0',
      description: 'Automobile vehicle discovery and analysis',
      author: 'Vvroom Development Team',
      createdAt: '2026-02-09',
      updatedAt: '2026-02-09'
    }
  };
}

/**
 * Angular dependency injection provider for Automobile Domain Configuration
 *
 * Pre-configured provider that can be used directly in Angular module declarations
 * to register the automobile domain configuration with the dependency injection container.
 *
 * @constant {Provider} DOMAIN_PROVIDER
 * @remarks
 * This is an Angular Provider object that:
 * - Provides the DOMAIN_CONFIG injection token
 * - Uses a factory function to create the configuration instance
 * - Automatically resolves the Injector dependency
 *
 * **Usage in Module**:
 * ```typescript
 * @NgModule({
 *   providers: [DOMAIN_PROVIDER] // Add to any module
 * })
 * export class AppModule { }
 * ```
 *
 * **Internally**:
 * - provide: Points to the DOMAIN_CONFIG injection token
 * - useFactory: References createAutomobileDomainConfig function
 * - deps: Specifies that Injector should be injected into the factory
 *
 * @see createAutomobileDomainConfig - The factory function that creates the configuration
 * @see DomainConfig - The interface describing configuration structure
 * @see DOMAIN_CONFIG - The injection token this provider uses
 */
export const DOMAIN_PROVIDER: Provider = {
  provide: DOMAIN_CONFIG,
  useFactory: createAutomobileDomainConfig,
  deps: [Injector],
};
```

---

### Step 607.2: Create the Barrel Export

Create the index file that exports the domain config.

Create `src/app/domain-config/automobile/index.ts`:

```typescript
// src/app/domain-config/automobile/index.ts

export * from './automobile.domain-config';
```

---

### Step 607.3: Understand the DomainConfig Structure

The complete domain config has several sections:

**Identity:**
```typescript
{
  domainName: 'automobile',      // URL-safe identifier
  domainLabel: 'Automobile Discovery',  // Human-readable name
  apiBaseUrl: 'http://...'       // API base URL from environment
}
```

**Type Models:**
```typescript
{
  filterModel: AutoSearchFilters,    // Class reference for filter type
  dataModel: VehicleResult,          // Class reference for data type
  statisticsModel: VehicleStatistics // Class reference for stats type
}
```

These are class references (not instances) used for TypeScript type checking.

**Adapters:**
```typescript
{
  apiAdapter: new AutomobileApiAdapter(apiService, apiBaseUrl),
  urlMapper: new AutomobileUrlMapper(),
  cacheKeyBuilder: new AutomobileCacheKeyBuilder()
}
```

These are instances created with dependencies.

**UI Configuration:**
```typescript
{
  tableConfig: AUTOMOBILE_TABLE_CONFIG,
  pickers: createAutomobilePickerConfigs(injector),
  filters: AUTOMOBILE_FILTER_DEFINITIONS,
  queryControlFilters: AUTOMOBILE_QUERY_CONTROL_FILTERS,
  highlightFilters: AUTOMOBILE_HIGHLIGHT_FILTERS,
  charts: AUTOMOBILE_CHART_CONFIGS,
  chartDataSources: { /* ... */ }
}
```

**Feature Flags:**
```typescript
{
  features: {
    highlights: true,        // Enable highlight filters
    popOuts: true,           // Enable pop-out windows
    rowExpansion: true,      // Enable row expansion in table
    statistics: true,        // Enable statistics panel
    export: true,            // Enable data export
    columnManagement: true,  // Enable column visibility toggle
    statePersistence: true   // Enable state saving to localStorage
  }
}
```

**Metadata:**
```typescript
{
  metadata: {
    version: '1.0.0',
    description: 'Automobile vehicle discovery and analysis',
    author: 'Vvroom Development Team',
    createdAt: '2026-02-09',
    updatedAt: '2026-02-09'
  }
}
```

---

### Step 607.4: Understanding the Provider Pattern

The `DOMAIN_PROVIDER` constant is an Angular Provider:

```typescript
export const DOMAIN_PROVIDER: Provider = {
  provide: DOMAIN_CONFIG,           // Token to inject
  useFactory: createAutomobileDomainConfig,  // Factory function
  deps: [Injector],                 // Dependencies for factory
};
```

This is equivalent to:

```typescript
@NgModule({
  providers: [
    {
      provide: DOMAIN_CONFIG,
      useFactory: createAutomobileDomainConfig,
      deps: [Injector]
    }
  ]
})
```

But exported as a constant for reuse.

**How it works:**

1. Angular sees `provide: DOMAIN_CONFIG`
2. Angular calls `createAutomobileDomainConfig(injector)`
3. The factory returns the domain config object
4. Any component/service can inject `DOMAIN_CONFIG` to get the config

```typescript
// In a component
constructor(@Inject(DOMAIN_CONFIG) private config: DomainConfig<...>) {
  console.log(config.domainName); // 'automobile'
}
```

---

### Step 607.5: Understanding Chart Data Sources Mapping

The `chartDataSources` object maps dataSourceId to data source instances:

```typescript
chartDataSources: {
  'manufacturer': new ManufacturerChartDataSource(),
  'top-models': new TopModelsChartDataSource(),
  'body-class': new BodyClassChartDataSource(),
  'year': new YearChartDataSource()
}
```

This connects to chart configs from document 606:

```typescript
// Chart config
{ id: 'manufacturer-distribution', dataSourceId: 'manufacturer', ... }

// Resolution
const dataSource = chartDataSources['manufacturer'];
const traces = dataSource.transform(statistics);
```

**Note:** Chart data sources are implemented in Phase 7 (documents 651-654). This file references them but they don't exist yet. You'll create placeholder classes or add them after Phase 7.

---

### Step 607.6: Understanding Feature Flags

Feature flags enable/disable functionality without code changes:

```typescript
features: {
  highlights: true,        // Show highlight filter options
  popOuts: true,           // Show "pop out" buttons on panels
  rowExpansion: true,      // Show expand button on table rows
  statistics: true,        // Show statistics panel
  export: true,            // Show export buttons
  columnManagement: true,  // Show column visibility menu
  statePersistence: true   // Save/restore table state
}
```

Components check these flags:

```typescript
// In StatisticsPanelComponent
<div *ngIf="domainConfig.features.statistics">
  <!-- Chart content -->
</div>

// In TableComponent
<button *ngIf="domainConfig.features.export" (click)="exportCsv()">
  Export CSV
</button>
```

This allows:
- A/B testing features
- Disabling features for certain domains
- Progressive feature rollout

---

## Verification

### 1. Verify Files Created

```bash
$ ls -la src/app/domain-config/automobile/automobile.domain-config.ts
$ ls -la src/app/domain-config/automobile/index.ts
```

Expected: Both files exist.

### 2. Verify TypeScript Compilation

```bash
$ cd ~/projects/vvroom
$ npx tsc --noEmit src/app/domain-config/automobile/automobile.domain-config.ts
```

Expected: No compilation errors.

### 3. Verify Exports

```bash
$ grep "^export" src/app/domain-config/automobile/automobile.domain-config.ts
```

Expected: Two exports (createAutomobileDomainConfig function, DOMAIN_PROVIDER constant)

### 4. Verify Index Exports

```bash
$ cat src/app/domain-config/automobile/index.ts
```

Expected: `export * from './automobile.domain-config';`

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| "Cannot find module './models'" | Models barrel export missing | Create models/index.ts with exports |
| "Cannot find module './adapters'" | Adapters barrel export missing | Create adapters/index.ts with exports |
| "Cannot find module './configs'" | Configs barrel export missing | Create configs/index.ts with exports |
| "Cannot find module './chart-sources'" | Chart sources not yet created | Add after Phase 7 or create placeholder |
| "DOMAIN_CONFIG is not a type" | Injection token not imported | Import DOMAIN_CONFIG from framework/services |
| "Injector has no provider for ApiService" | ApiService not provided | Ensure ApiService is in root providers |

---

## Key Takeaways

1. **The domain config is the integration point** — All domain pieces connect through this one object
2. **Factory pattern enables dependency injection** — Services are resolved at runtime, not import time
3. **Feature flags provide runtime control** — Enable/disable features without code changes

---

## Acceptance Criteria

- [ ] `src/app/domain-config/automobile/automobile.domain-config.ts` exists
- [ ] `createAutomobileDomainConfig()` factory function is exported
- [ ] Factory receives Injector and resolves ApiService
- [ ] DomainConfig includes all sections: identity, models, adapters, UI config, features, metadata
- [ ] `DOMAIN_PROVIDER` constant is exported with correct provider shape
- [ ] `src/app/domain-config/automobile/index.ts` exports the domain config
- [ ] Chart data sources are mapped with correct keys matching dataSourceIds
- [ ] Feature flags include all required flags (highlights, popOuts, rowExpansion, statistics, export, columnManagement, statePersistence)
- [ ] File compiles without TypeScript errors

---

## Next Step

Proceed to `608-domain-providers.md` to create the domain providers registry that collects all domain configurations.
