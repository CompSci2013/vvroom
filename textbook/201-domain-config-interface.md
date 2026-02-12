# 201: Domain Config Interface

**Status:** Planning
**Depends On:** 150-typescript-generics-primer
**Blocks:** 202-resource-management-interface, 304-domain-config-registry

---

## Learning Objectives

After completing this section, you will:
- Understand how a single interface can define the contract for an entire domain's behavior
- Know how TypeScript generics enable type-safe domain configurations
- Recognize the relationship between configuration interfaces and framework services

---

## Objective

Create the `DomainConfig` interface that serves as the central configuration schema for any domain in the vvroom application. This interface defines all adapters, UI configurations, and feature flags required for the framework to operate with domain-specific data.

---

## Why

The `DomainConfig` interface is the cornerstone of vvroom's architecture. It answers a critical question: *How do we make the framework work with any domain (automobiles, real estate, inventory) without changing framework code?*

The answer is **configuration-driven design**. Instead of hard-coding domain-specific behavior into services and components, we define a configuration interface that each domain must implement. The framework reads this configuration and adapts its behavior accordingly.

**This is the Phase 2 Aha Moment in action:** TypeScript interfaces are executable documentation. The `DomainConfig` interface documents *exactly* what any domain must provide to work with the framework. TypeScript enforces this contract at compile time.

### Benefits of Configuration-Driven Design

| Approach | Adding a New Domain Requires |
|----------|------------------------------|
| Hard-coded | Modifying framework services, components, routes |
| Configuration-driven | Creating one configuration file that implements DomainConfig |

### Angular Style Guide References

- [Style 03-01](https://angular.io/guide/styleguide#style-03-01): Use interfaces for type definitions
- [Style 07-04](https://angular.io/guide/styleguide#style-07-04): Create service interfaces for complex services

### TypeScript Best Practices

This interface uses several TypeScript features you learned in the generics primer:

1. **Generic type parameters** (`TFilters`, `TData`, `TStatistics`) — Allow type-safe domain configuration
2. **`Type<T>`** — Angular's type for class constructors, enabling runtime instantiation
3. **Optional properties** — Features like `highlightFilters` and `metadata` are not required for every domain

---

## What

### Step 201.1: Create the Framework Models Directory Index

Before creating individual interface files, create a barrel export file that will aggregate all model exports.

Create the file `src/app/framework/models/index.ts`:

```typescript
// src/app/framework/models/index.ts
// VERSION 1 (Section 201) - Barrel file for framework models

// This barrel file exports all framework model interfaces.
// Import from '@app/framework/models' instead of individual files.

export * from './domain-config.interface';
```

Delete the `.gitkeep` file since the directory now has real content:

```bash
$ rm src/app/framework/models/.gitkeep
```

**Why a barrel file?**

Barrel files simplify imports throughout the application:

```typescript
// Without barrel file (verbose):
import { DomainConfig } from './framework/models/domain-config.interface';
import { TableConfig } from './framework/models/table-config.interface';

// With barrel file (clean):
import { DomainConfig, TableConfig } from './framework/models';
```

We'll add more exports as we create additional interface files.

---

### Step 201.2: Create the Domain Config Interface

Create the file `src/app/framework/models/domain-config.interface.ts`:

```typescript
// src/app/framework/models/domain-config.interface.ts
// VERSION 1 (Section 201) - Core domain configuration interface

import { Type } from '@angular/core';

/**
 * Domain configuration interface
 *
 * Complete configuration schema for a domain-specific implementation.
 * Defines all adapters, UI configurations, and feature flags required
 * for the framework to operate with domain-specific data.
 *
 * @template TFilters - Domain-specific filter model type
 * @template TData - Domain-specific data model type
 * @template TStatistics - Domain-specific statistics model type (optional)
 *
 * @example
 * ```typescript
 * const AUTOMOBILE_DOMAIN_CONFIG: DomainConfig<
 *   AutomobileFilters,
 *   VehicleResult,
 *   VehicleStatistics
 * > = {
 *   domainName: 'automobile',
 *   domainLabel: 'Automobile Discovery',
 *   apiBaseUrl: 'http://auto-discovery.minilab/api/v1',
 *   filterModel: AutomobileFilters,
 *   dataModel: VehicleResult,
 *   statisticsModel: VehicleStatistics,
 *   apiAdapter: new AutomobileApiAdapter(),
 *   urlMapper: new AutomobileUrlMapper(),
 *   cacheKeyBuilder: new AutomobileCacheKeyBuilder(),
 *   tableConfig: AUTOMOBILE_TABLE_CONFIG,
 *   pickers: AUTOMOBILE_PICKER_CONFIGS,
 *   filters: AUTOMOBILE_FILTER_DEFINITIONS,
 *   queryControlFilters: AUTOMOBILE_QUERY_CONTROL_FILTERS,
 *   charts: AUTOMOBILE_CHART_CONFIGS,
 *   features: {
 *     highlights: true,
 *     popOuts: true,
 *     rowExpansion: true
 *   }
 * };
 * ```
 */
export interface DomainConfig<TFilters, TData, TStatistics = any> {
  /**
   * Unique domain identifier (lowercase, no spaces)
   * Used for routing, storage keys, and internal identification
   *
   * @example 'automobile', 'real-estate', 'inventory'
   */
  domainName: string;

  /**
   * Human-readable domain label
   * Used for display in UI (page titles, navigation, etc.)
   *
   * @example 'Automobile Discovery', 'Real Estate Listings'
   */
  domainLabel: string;

  /**
   * Base URL for domain-specific API
   * All API requests will be prefixed with this URL
   *
   * @example 'http://auto-discovery.minilab/api/v1'
   */
  apiBaseUrl: string;

  /**
   * Filter model class/constructor
   * Used for type checking and instantiation
   */
  filterModel: Type<TFilters>;

  /**
   * Data model class/constructor
   * Used for type checking and instantiation
   */
  dataModel: Type<TData>;

  /**
   * Statistics model class/constructor (optional)
   * Used for type checking and instantiation
   */
  statisticsModel?: Type<TStatistics>;

  /**
   * API adapter for data fetching
   * Implements domain-specific API calls and response transformation
   */
  apiAdapter: IApiAdapter<TFilters, TData, TStatistics>;

  /**
   * URL mapper for filter serialization
   * Converts between filter objects and URL parameters
   */
  urlMapper: IFilterUrlMapper<TFilters>;

  /**
   * Cache key builder for request coordination
   * Generates unique cache keys from filter objects
   */
  cacheKeyBuilder: ICacheKeyBuilder<TFilters>;

  /**
   * Table configuration for main data display
   * Defines columns, pagination, sorting, etc.
   */
  tableConfig: TableConfig<TData>;

  /**
   * Picker configurations
   * Array of picker configs for multi-select data pickers
   */
  pickers: PickerConfig<any>[];

  /**
   * Inline filter definitions for results table
   * Defines inline filter controls displayed above the results table
   */
  filters: FilterDefinition[];

  /**
   * Query Control filter definitions
   * Defines filters available in the Query Control component dialogs
   */
  queryControlFilters: QueryFilterDefinition<TFilters>[];

  /**
   * Highlight filter definitions (optional)
   * Defines highlight filters available in the Query Control component
   * These filters add h_* URL parameters for segmented statistics in charts
   */
  highlightFilters?: QueryFilterDefinition<any>[];

  /**
   * Chart configurations
   * Defines available charts and their data sources
   */
  charts: ChartConfig[];

  /**
   * Chart data sources map
   * Maps dataSourceId to ChartDataSource instances
   * Used by StatisticsPanelComponent to instantiate charts
   */
  chartDataSources?: Record<string, any>;

  /**
   * Feature flags
   * Controls which framework features are enabled for this domain
   */
  features: DomainFeatures;

  /**
   * Optional metadata
   * Additional domain-specific information
   */
  metadata?: DomainMetadata;

  /**
   * Default filters for the domain (optional)
   * These filters are applied when the application first loads or when filters are cleared.
   */
  defaultFilters?: Partial<TFilters>;
}

/**
 * Domain feature flags
 *
 * Controls which framework features are enabled/disabled for a specific domain
 */
export interface DomainFeatures {
  /**
   * Enable/disable highlight system
   * Allows users to highlight specific data subsets
   */
  highlights: boolean;

  /**
   * Enable/disable pop-out window system
   * Allows panels to be moved to separate browser windows
   */
  popOuts: boolean;

  /**
   * Enable/disable row expansion in tables
   * Allows rows to be expanded to show additional details
   */
  rowExpansion: boolean;

  /**
   * Enable/disable statistics panel
   * Shows aggregated statistics and charts
   */
  statistics?: boolean;

  /**
   * Enable/disable export functionality
   * Allows users to export data to CSV, Excel, etc.
   */
  export?: boolean;

  /**
   * Enable/disable column management
   * Allows users to show/hide and reorder columns
   */
  columnManagement?: boolean;

  /**
   * Enable/disable state persistence
   * Saves user preferences to local storage
   */
  statePersistence?: boolean;
}

/**
 * Domain metadata
 *
 * Additional information about the domain
 */
export interface DomainMetadata {
  /**
   * Domain version (semantic versioning)
   */
  version?: string;

  /**
   * Domain description
   */
  description?: string;

  /**
   * Domain author/maintainer
   */
  author?: string;

  /**
   * Creation date
   */
  createdAt?: string;

  /**
   * Last update date
   */
  updatedAt?: string;

  /**
   * Custom metadata fields
   */
  [key: string]: any;
}

/**
 * Filter format configuration
 *
 * Controls how filter values are displayed and processed.
 */
export interface FilterFormat {
  /**
   * Number formatting options
   */
  number?: FilterNumberFormat;

  /**
   * Date formatting options
   */
  date?: FilterDateFormat;

  /**
   * Whether string matching is case-sensitive
   * @default true
   */
  caseSensitive?: boolean;

  /**
   * Text transformation to apply before sending to API
   */
  transform?: 'lowercase' | 'uppercase' | 'titlecase' | 'trim' | 'none';

  /**
   * Custom formatting function for display
   */
  displayFormatter?: (value: any) => string;

  /**
   * Custom parsing function for input
   */
  valueParser?: (input: string) => any;
}

/**
 * Number formatting options
 *
 * Based on Intl.NumberFormat options for consistency with browser standards
 */
export interface FilterNumberFormat {
  /**
   * Use thousand separators (commas)
   * @default true
   */
  useGrouping?: boolean;

  /**
   * Minimum decimal places
   * @default 0
   */
  minimumFractionDigits?: number;

  /**
   * Maximum decimal places
   * @default 0 for integers, 2 for decimals
   */
  maximumFractionDigits?: number;

  /**
   * Locale for number formatting
   * @default 'en-US'
   */
  locale?: string;

  /**
   * Custom format pattern
   */
  pattern?: string;
}

/**
 * Date formatting options
 */
export interface FilterDateFormat {
  /**
   * Date format pattern
   * @default 'YYYY-MM-DD'
   */
  pattern?: string;

  /**
   * Locale for date formatting
   * @default 'en-US'
   */
  locale?: string;

  /**
   * Whether to show time component
   * @default false
   */
  includeTime?: boolean;
}

/**
 * Filter control types
 */
export type FilterType =
  | 'text'
  | 'number'
  | 'date'
  | 'daterange'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'range'
  | 'autocomplete';

/**
 * Filter operators
 */
export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'greaterThanOrEqual'
  | 'lessThan'
  | 'lessThanOrEqual'
  | 'in'
  | 'notIn'
  | 'between';

/**
 * Filter option for select/multiselect
 */
export interface FilterOption {
  value: any;
  label: string;
  icon?: string;
  disabled?: boolean;
}

/**
 * Filter validation rules
 */
export interface FilterValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp | string;
  custom?: (value: any) => boolean | string;
}

/**
 * Chart configuration interface
 */
export interface ChartConfig {
  id: string;
  title: string;
  type: ChartType;
  dataSourceId: string;
  options?: any;
  height?: number;
  width?: number | string;
  visible?: boolean;
  collapsible?: boolean;
}

/**
 * Chart types
 */
export type ChartType =
  | 'bar'
  | 'line'
  | 'pie'
  | 'doughnut'
  | 'scatter'
  | 'histogram'
  | 'heatmap'
  | 'treemap'
  | 'sunburst';

/**
 * Configuration validation error
 */
export interface ConfigValidationError {
  type: ConfigErrorType;
  field: string;
  message: string;
  expected?: string;
  actual?: any;
}

/**
 * Configuration error types
 */
export enum ConfigErrorType {
  MISSING_REQUIRED = 'MISSING_REQUIRED',
  INVALID_TYPE = 'INVALID_TYPE',
  INVALID_VALUE = 'INVALID_VALUE',
  EMPTY_ARRAY = 'EMPTY_ARRAY',
  DUPLICATE_ID = 'DUPLICATE_ID'
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  valid: boolean;
  errors: ConfigValidationError[];
  warnings?: ConfigValidationError[];
}

/**
 * Default domain features
 * Used when features object is not fully specified
 */
export const DEFAULT_DOMAIN_FEATURES: DomainFeatures = {
  highlights: true,
  popOuts: true,
  rowExpansion: true,
  statistics: true,
  export: true,
  columnManagement: true,
  statePersistence: true
};

/**
 * Merge partial domain features with defaults
 */
export function mergeDomainFeatures(
  features: Partial<DomainFeatures>
): DomainFeatures {
  return {
    ...DEFAULT_DOMAIN_FEATURES,
    ...features
  };
}

// Forward declarations for interfaces defined in other files
// These will be properly imported once those files are created

/**
 * API adapter interface (defined in resource-management.interface.ts)
 */
export interface IApiAdapter<TFilters, TData, TStatistics = any> {
  fetchData(filters: TFilters, highlights?: any): any;
}

/**
 * Filter URL mapper interface (defined in resource-management.interface.ts)
 */
export interface IFilterUrlMapper<TFilters> {
  toUrlParams(filters: TFilters): any;
  fromUrlParams(params: any): TFilters;
  extractHighlights?(params: any): any;
}

/**
 * Cache key builder interface (defined in resource-management.interface.ts)
 */
export interface ICacheKeyBuilder<TFilters> {
  buildKey(filters: TFilters, highlights?: any): string;
}

/**
 * Table config interface (defined in table-config.interface.ts)
 */
export interface TableConfig<T> {
  tableId: string;
  stateKey: string;
  columns: any[];
  dataKey: keyof T;
  [key: string]: any;
}

/**
 * Picker config interface (defined in picker-config.interface.ts)
 */
export interface PickerConfig<T> {
  id: string;
  displayName: string;
  columns: any[];
  [key: string]: any;
}

/**
 * Filter definition interface (defined in filter-definition.interface.ts)
 */
export interface FilterDefinition {
  id: string;
  label: string;
  type: FilterType;
  [key: string]: any;
}

/**
 * Query filter definition interface (defined in filter-definition.interface.ts)
 */
export interface QueryFilterDefinition<T> {
  field: keyof T;
  label: string;
  type: string;
  [key: string]: any;
}
```

---

### Step 201.3: Understand the Interface Structure

The `DomainConfig` interface is organized into logical sections:

| Section | Properties | Purpose |
|---------|------------|---------|
| **Identity** | `domainName`, `domainLabel`, `apiBaseUrl` | Identify the domain and where to fetch data |
| **Type Models** | `filterModel`, `dataModel`, `statisticsModel` | Runtime type information for instantiation |
| **Adapters** | `apiAdapter`, `urlMapper`, `cacheKeyBuilder` | Domain-specific data transformation logic |
| **UI Configuration** | `tableConfig`, `pickers`, `filters`, `charts` | Define how data is displayed |
| **Feature Flags** | `features` | Enable/disable framework capabilities |
| **Metadata** | `metadata`, `defaultFilters` | Optional additional information |

**Why so many forward declarations?**

The `DomainConfig` interface references types from other files we haven't created yet. The forward declarations at the bottom are temporary placeholders. As we create each interface file (documents 202-209), we'll update the imports to use the real definitions.

This is a common pattern when building a system in dependency order: you need to reference types that will exist later. TypeScript allows this through interface merging and forward declarations.

---

## The Aha Moment

**TypeScript interfaces are executable documentation.**

Look at the `DomainConfig` interface. It's not just code — it's a specification. This interface documents *exactly* what any domain must provide to work with the vvroom framework:

- An identity (`domainName`, `domainLabel`)
- A data source (`apiBaseUrl`, `apiAdapter`)
- A way to serialize state to URLs (`urlMapper`)
- UI configurations (`tableConfig`, `filters`, `charts`)
- Feature toggles (`features`)

When you create a new domain (like agriculture or real estate), the compiler becomes your guide. Try to create a `DomainConfig<AgricultureFilters, CropResult>` object, and TypeScript will tell you exactly what's missing.

This is why we invested time in the Generics Primer (Section 150). The generic parameters `TFilters`, `TData`, and `TStatistics` ensure that when you wire up an automobile domain, the `urlMapper` accepts `AutomobileFilters`, and the `tableConfig` works with `VehicleResult`. Type mismatches are caught at compile time, not runtime.

**The interface is the contract. TypeScript enforces it.**

---

## Verification

### 1. Check File Exists

```bash
$ ls -la src/app/framework/models/
```

Expected output shows both files:

```
total 16
drwxr-xr-x 2 user user 4096 Feb  9 12:00 .
drwxr-xr-x 5 user user 4096 Feb  9 12:00 ..
-rw-r--r-- 1 user user  123 Feb  9 12:00 index.ts
-rw-r--r-- 1 user user 8234 Feb  9 12:00 domain-config.interface.ts
```

### 2. TypeScript Compilation Check

```bash
$ cd ~/projects/vvroom
$ npx tsc --noEmit src/app/framework/models/domain-config.interface.ts
```

Expected: No output (no compilation errors).

### 3. Verify Exports

```bash
$ grep "export" src/app/framework/models/domain-config.interface.ts | head -5
```

Expected output shows multiple exports:

```
export interface DomainConfig<TFilters, TData, TStatistics = any> {
export interface DomainFeatures {
export interface DomainMetadata {
export interface FilterFormat {
export interface FilterNumberFormat {
```

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| `Cannot find module '@angular/core'` | Angular not installed or wrong path | Run `npm install` in project root |
| `Type 'X' is not generic` | Forgot generic parameters | Add type parameters: `DomainConfig<TFilters, TData>` |
| `Property 'X' does not exist on type 'DomainConfig'` | Using wrong property name | Check interface definition for exact property names |
| Red squiggles on forward declarations | Expected — these are temporary | Will be resolved in subsequent documents |
| `Duplicate identifier 'FilterOption'` | Name collision with another file | Use unique names or namespaces |

---

## Key Takeaways

1. **TypeScript interfaces are executable documentation** — The `DomainConfig` interface documents exactly what any domain must provide to work with the framework
2. **Generic type parameters enable type safety** — `TFilters`, `TData`, and `TStatistics` ensure type-safe configuration
3. **Configuration-driven design enables extensibility** — New domains require only configuration, not framework changes

---

## Acceptance Criteria

- [ ] `src/app/framework/models/domain-config.interface.ts` exists with complete interface definition
- [ ] `src/app/framework/models/index.ts` exports the domain config interface
- [ ] Interface includes all required properties: `domainName`, `domainLabel`, `apiBaseUrl`, etc.
- [ ] Interface uses TypeScript generics for type-safe configuration
- [ ] `DomainFeatures` interface defines all feature flags
- [ ] `DomainMetadata` interface provides extensible metadata structure
- [ ] Helper function `mergeDomainFeatures` is implemented
- [ ] `DEFAULT_DOMAIN_FEATURES` constant is defined
- [ ] TypeScript compilation succeeds with no errors
- [ ] JSDoc comments document all public interfaces and properties

---

## Next Step

Proceed to `202-resource-management-interface.md` to define the adapters that `DomainConfig` references.
