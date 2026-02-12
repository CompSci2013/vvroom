# 403: Domain Filter and Statistics Models

**Status:** Complete
**Depends On:** 401-base-model-interface, 402-domain-data-models
**Blocks:** Phase 5 (Domain Adapters), Phase 6 (Charts)

---

## Learning Objectives

After completing this section, you will:
- Understand the difference between filter models and data models
- Know how to model search filters with pagination and sorting
- Recognize the structure of aggregated statistics for chart data
- Be able to implement highlight filters for segmented chart data

---

## Objective

Create the filter model (`AutoSearchFilters`) for search parameters and the statistics models (`VehicleStatistics`, `ManufacturerStat`, etc.) for chart and analytics data.

---

## Why

### Filter Models

When users search for vehicles, they apply filters:
- Manufacturer (Toyota)
- Year range (2020-2024)
- Body class (Sedan, SUV)
- Page number (1)
- Sort field (manufacturer)

These filters:
1. **Map to URL parameters** — Filters persist in the URL
2. **Map to API query strings** — Sent to backend for filtering
3. **Support multiple data types** — Strings, numbers, arrays

The `AutoSearchFilters` class models all filter options with utility methods for checking if filters are active.

### Highlight Filters

Vvroom supports **chart highlighting** — showing a subset of data emphasized within the total:

```
Total vehicles by manufacturer:
┌──────────────────────────────────────────────┐
│ Toyota    ██████████████████░░░░░ 234 (45 highlighted) │
│ Honda     ████████████████░░░░░░░ 187 (32 highlighted) │
│ Ford      ████████████░░░░░░░░░░░ 156 (0 highlighted)  │
└──────────────────────────────────────────────┘
```

Highlight filters are sent to the API with `h_` prefix:
- `?h_manufacturer=Toyota` — Highlight Toyota vehicles
- `?h_yearMin=2020&h_yearMax=2024` — Highlight 2020-2024 vehicles

The API returns segmented data: `{ total: 234, highlighted: 45 }`

### Statistics Models

Statistics provide aggregated data for:
- **Summary cards** — Total vehicles, total VINs, manufacturer count
- **Charts** — Top manufacturers, body class distribution, year distribution
- **Filters** — Year range for slider min/max

Statistics models handle two API response formats:

**Format 1: Array-based** (simpler endpoints)
```json
{
  "total_vehicles": 1247,
  "top_manufacturers": [
    { "name": "Toyota", "count": 234 }
  ]
}
```

**Format 2: Segmented** (chart-ready)
```json
{
  "byManufacturer": {
    "Toyota": { "total": 234, "highlighted": 45 },
    "Honda": { "total": 187, "highlighted": 32 }
  }
}
```

The `VehicleStatistics.fromApiResponse()` method detects and handles both formats.

---

## What

### Step 403.1: Create the Filter Models

Create the file `src/app/domains/automobile/models/automobile.filters.ts`:

```typescript
// src/app/domains/automobile/models/automobile.filters.ts
// VERSION 1 (Section 403) - Automobile domain filter models

/**
 * Highlight Filters
 *
 * Parameters for segmented statistics computation.
 * Sent to backend API as h_* query parameters.
 *
 * Purpose: Request segmented statistics with {total, highlighted} format
 * for chart visualization showing highlighted vs total data.
 *
 * @example
 * ```typescript
 * const highlights: HighlightFilters = {
 *   manufacturer: 'Ford',
 *   yearMin: 2020,
 *   yearMax: 2024
 * };
 * // URL: ?h_manufacturer=Ford&h_yearMin=2020&h_yearMax=2024
 * ```
 */
export interface HighlightFilters {
  /**
   * Year range highlighting (minimum)
   * URL parameter: h_yearMin
   */
  yearMin?: number;

  /**
   * Year range highlighting (maximum)
   * URL parameter: h_yearMax
   */
  yearMax?: number;

  /**
   * Manufacturer highlighting
   * URL parameter: h_manufacturer
   */
  manufacturer?: string;

  /**
   * Model combinations highlighting
   * Format: Manufacturer:Model,Manufacturer:Model
   * URL parameter: h_modelCombos
   */
  modelCombos?: string;

  /**
   * Body class highlighting
   * URL parameter: h_bodyClass
   */
  bodyClass?: string;
}

/**
 * Automobile search filters
 *
 * Comprehensive filter model for searching and filtering vehicle data.
 * All fields are optional to support partial filtering.
 *
 * @example
 * ```typescript
 * const filters: AutoSearchFilters = {
 *   manufacturer: 'Toyota',
 *   yearMin: 2020,
 *   yearMax: 2024,
 *   bodyClass: 'SUV',
 *   page: 1,
 *   size: 20,
 *   sort: 'year',
 *   sortDirection: 'desc'
 * };
 * ```
 */
export class AutoSearchFilters {
  /**
   * Vehicle manufacturer name
   * Case-insensitive partial match
   *
   * @example 'Toyota', 'Honda', 'Ford'
   */
  manufacturer?: string;

  /**
   * Vehicle model name
   * Case-insensitive partial match
   *
   * @example 'Camry', 'Accord', 'F-150'
   */
  model?: string;

  /**
   * Minimum year (inclusive)
   *
   * @example 2020
   */
  yearMin?: number;

  /**
   * Maximum year (inclusive)
   *
   * @example 2024
   */
  yearMax?: number;

  /**
   * Vehicle body class/type (supports multiple selections)
   * Case-insensitive partial match
   * Can be a single value or array for multi-select
   *
   * @example 'Sedan', ['SUV', 'Truck'], 'Coupe'
   */
  bodyClass?: string | string[];

  /**
   * Minimum VIN instance count
   * Filter vehicles with at least this many VIN instances
   *
   * @example 10
   */
  instanceCountMin?: number;

  /**
   * Maximum VIN instance count
   * Filter vehicles with at most this many VIN instances
   *
   * @example 1000
   */
  instanceCountMax?: number;

  /**
   * Page number (1-indexed)
   * Used for pagination
   *
   * @default 1
   */
  page?: number;

  /**
   * Page size (number of results per page)
   * Used for pagination
   *
   * @default 20
   */
  size?: number;

  /**
   * Sort field
   * Field name to sort by
   *
   * @example 'manufacturer', 'model', 'year', 'instance_count'
   */
  sort?: string;

  /**
   * Sort direction
   * Ascending or descending order
   *
   * @default 'asc'
   */
  sortDirection?: 'asc' | 'desc';

  /**
   * Search query (global search)
   * Searches across multiple fields (manufacturer, model, body class)
   *
   * @example 'Toyota Camry'
   */
  search?: string;

  /**
   * Model combinations (from picker)
   * Comma-separated manufacturer:model pairs
   *
   * @example 'Ford:F-150,Toyota:Camry,Honda:Accord'
   */
  modelCombos?: string;

  /**
   * Constructor with default values
   *
   * @param partial - Partial AutoSearchFilters object
   */
  constructor(partial?: Partial<AutoSearchFilters>) {
    Object.assign(this, partial);
  }

  /**
   * Create filters from partial object
   *
   * @param partial - Partial filter object
   * @returns AutoSearchFilters instance
   */
  static fromPartial(partial: Partial<AutoSearchFilters>): AutoSearchFilters {
    return new AutoSearchFilters(partial);
  }

  /**
   * Get default filters
   *
   * @returns Default filter values
   */
  static getDefaults(): AutoSearchFilters {
    return new AutoSearchFilters({
      page: 1,
      size: 20,
      sort: 'manufacturer',
      sortDirection: 'asc'
    });
  }

  /**
   * Check if filters are empty (no active filters except pagination/sort)
   *
   * @returns True if no search filters are active
   */
  isEmpty(): boolean {
    const hasBodyClass = Array.isArray(this.bodyClass)
      ? this.bodyClass.length > 0
      : !!this.bodyClass;

    return (
      !this.manufacturer &&
      !this.model &&
      !this.yearMin &&
      !this.yearMax &&
      !hasBodyClass &&
      !this.instanceCountMin &&
      !this.instanceCountMax &&
      !this.search &&
      !this.modelCombos
    );
  }

  /**
   * Clone filters
   *
   * @returns New AutoSearchFilters instance with same values
   */
  clone(): AutoSearchFilters {
    return new AutoSearchFilters({ ...this });
  }

  /**
   * Merge with other filters
   *
   * @param other - Filters to merge
   * @returns New AutoSearchFilters with merged values
   */
  merge(other: Partial<AutoSearchFilters>): AutoSearchFilters {
    return new AutoSearchFilters({
      ...this,
      ...other
    });
  }

  /**
   * Clear all filters except pagination and sort
   *
   * @returns New AutoSearchFilters with only pagination/sort
   */
  clearSearch(): AutoSearchFilters {
    return new AutoSearchFilters({
      page: this.page,
      size: this.size,
      sort: this.sort,
      sortDirection: this.sortDirection
    });
  }

  /**
   * Get active filter count
   *
   * @returns Number of active search filters
   */
  getActiveFilterCount(): number {
    let count = 0;
    if (this.manufacturer) count++;
    if (this.model) count++;
    if (this.yearMin) count++;
    if (this.yearMax) count++;
    if (this.bodyClass) count++;
    if (this.instanceCountMin) count++;
    if (this.instanceCountMax) count++;
    if (this.search) count++;
    if (this.modelCombos) count++;
    return count;
  }
}
```

---

### Step 403.2: Create the Statistics Models

Create the file `src/app/domains/automobile/models/automobile.statistics.ts`:

```typescript
// src/app/domains/automobile/models/automobile.statistics.ts
// VERSION 1 (Section 403) - Automobile domain statistics models

/**
 * Manufacturer statistic
 *
 * Aggregated data for a single manufacturer
 */
export class ManufacturerStat {
  /**
   * Manufacturer name
   * @example 'Toyota'
   */
  name!: string;

  /**
   * Number of vehicle configurations
   * @example 234
   */
  count!: number;

  /**
   * Total VIN instances
   * @example 8456
   */
  instanceCount?: number;

  /**
   * Percentage of total
   * @example 18.8
   */
  percentage!: number;

  /**
   * Number of unique models
   * @example 42
   */
  modelCount?: number;

  constructor(partial?: Partial<ManufacturerStat>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  static fromApiResponse(data: any): ManufacturerStat {
    return new ManufacturerStat({
      name: data.name || data.manufacturer,
      count: Number(data.count || data.vehicle_count || 0),
      instanceCount: data.instance_count || data.instanceCount,
      percentage: Number(data.percentage || 0),
      modelCount: data.model_count || data.modelCount
    });
  }
}

/**
 * Model statistic
 *
 * Aggregated data for a single vehicle model
 */
export class ModelStat {
  /**
   * Model name
   * @example 'Camry'
   */
  name!: string;

  /**
   * Manufacturer name
   * @example 'Toyota'
   */
  manufacturer!: string;

  /**
   * Number of vehicle configurations
   * @example 15
   */
  count!: number;

  /**
   * Total VIN instances
   * @example 3456
   */
  instanceCount!: number;

  /**
   * Percentage of total instances
   * @example 7.6
   */
  percentage!: number;

  constructor(partial?: Partial<ModelStat>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  static fromApiResponse(data: any): ModelStat {
    return new ModelStat({
      name: data.name || data.model,
      manufacturer: data.manufacturer,
      count: Number(data.count || data.vehicle_count || 0),
      instanceCount: Number(data.instance_count || data.instanceCount || 0),
      percentage: Number(data.percentage || 0)
    });
  }

  /**
   * Get full model name including manufacturer
   * @returns Full name (e.g., "Toyota Camry")
   */
  getFullName(): string {
    return `${this.manufacturer} ${this.name}`;
  }
}

/**
 * Body class statistic
 *
 * Aggregated data for a single body class
 */
export class BodyClassStat {
  /**
   * Body class name
   * @example 'Sedan'
   */
  name!: string;

  /**
   * Number of vehicle configurations
   * @example 456
   */
  count!: number;

  /**
   * Total VIN instances
   * @example 16789
   */
  instanceCount?: number;

  /**
   * Percentage of total
   * @example 36.6
   */
  percentage!: number;

  constructor(partial?: Partial<BodyClassStat>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  static fromApiResponse(data: any): BodyClassStat {
    return new BodyClassStat({
      name: data.name || data.body_class || data.bodyClass,
      count: Number(data.count || data.vehicle_count || 0),
      instanceCount: data.instance_count || data.instanceCount,
      percentage: Number(data.percentage || 0)
    });
  }
}

/**
 * Year statistic
 *
 * Aggregated data for a single vehicle year
 */
export class YearStat {
  /**
   * Vehicle year
   * @example 2024
   */
  year!: number;

  /**
   * Number of vehicle configurations
   * @example 89
   */
  count!: number;

  /**
   * Total VIN instances
   * @example 3245
   */
  instanceCount?: number;

  /**
   * Percentage of total
   * @example 7.1
   */
  percentage!: number;

  constructor(partial?: Partial<YearStat>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  static fromApiResponse(data: any): YearStat {
    return new YearStat({
      year: Number(data.year),
      count: Number(data.count || data.vehicle_count || 0),
      instanceCount: data.instance_count || data.instanceCount,
      percentage: Number(data.percentage || 0)
    });
  }

  /**
   * Check if this year is current year
   */
  isCurrentYear(): boolean {
    return this.year === new Date().getFullYear();
  }

  /**
   * Get age of vehicles from this year
   */
  getAge(): number {
    return new Date().getFullYear() - this.year;
  }
}

/**
 * Vehicle statistics
 *
 * Aggregated statistics across all filtered vehicles.
 * Provides high-level metrics and distributions for analysis.
 *
 * @example
 * ```typescript
 * const stats: VehicleStatistics = {
 *   totalVehicles: 1247,
 *   totalInstances: 45623,
 *   manufacturerCount: 23,
 *   modelCount: 412,
 *   yearRange: { min: 2010, max: 2024 },
 *   averageInstancesPerVehicle: 36.6
 * };
 * ```
 */
export class VehicleStatistics {
  /**
   * Total number of unique vehicle configurations
   * @example 1247
   */
  totalVehicles!: number;

  /**
   * Total number of VIN instances across all vehicles
   * @example 45623
   */
  totalInstances!: number;

  /**
   * Number of unique manufacturers
   * @example 23
   */
  manufacturerCount!: number;

  /**
   * Number of unique models
   * @example 412
   */
  modelCount!: number;

  /**
   * Number of unique body classes
   * @example 8
   */
  bodyClassCount?: number;

  /**
   * Year range (min and max years in dataset)
   */
  yearRange!: {
    min: number;
    max: number;
  };

  /**
   * Average VIN instances per vehicle configuration
   * @example 36.6
   */
  averageInstancesPerVehicle!: number;

  /**
   * Median VIN instances per vehicle configuration
   * @example 28
   */
  medianInstancesPerVehicle?: number;

  /**
   * Top manufacturers by vehicle count (top 20)
   */
  topManufacturers?: ManufacturerStat[];

  /**
   * Top models by instance count (top 20)
   */
  topModels?: ModelStat[];

  /**
   * Distribution by body class
   */
  bodyClassDistribution?: BodyClassStat[];

  /**
   * Distribution by year
   */
  yearDistribution?: YearStat[];

  /**
   * Complete manufacturer distribution
   */
  manufacturerDistribution?: ManufacturerStat[];

  /**
   * Raw segmented statistics by manufacturer
   * Format: { "Toyota": { total: 234, highlighted: 45 } }
   */
  byManufacturer?: Record<string, { total: number; highlighted: number }>;

  /**
   * Raw segmented statistics by body class
   */
  byBodyClass?: Record<string, { total: number; highlighted: number }>;

  /**
   * Raw segmented statistics by year
   */
  byYearRange?: Record<string, { total: number; highlighted: number }>;

  /**
   * Raw segmented statistics by model per manufacturer
   */
  modelsByManufacturer?: Record<string, Record<string, { total: number; highlighted: number }>>;

  constructor(partial?: Partial<VehicleStatistics>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  /**
   * Create VehicleStatistics from API response
   *
   * Handles two formats:
   * 1. Array-based statistics (topManufacturers, etc.)
   * 2. Segmented statistics (byManufacturer, modelsByManufacturer, etc.)
   *
   * @param data - Raw API response data
   * @returns VehicleStatistics instance
   */
  static fromApiResponse(data: any): VehicleStatistics {
    // Check if segmented format
    const byYearData = data.byYearRange || data.byYear;
    if (data.byManufacturer || data.modelsByManufacturer || data.byBodyClass || byYearData) {
      return VehicleStatistics.fromSegmentedStats(data);
    }

    // Array-based format
    return new VehicleStatistics({
      totalVehicles: Number(data.total_vehicles || data.totalVehicles || 0),
      totalInstances: Number(data.total_instances || data.totalInstances || 0),
      manufacturerCount: Number(data.manufacturer_count || data.manufacturerCount || 0),
      modelCount: Number(data.model_count || data.modelCount || 0),
      bodyClassCount: data.body_class_count || data.bodyClassCount,
      yearRange: {
        min: Number(data.year_range?.min || data.yearRange?.min || 0),
        max: Number(data.year_range?.max || data.yearRange?.max || 0)
      },
      averageInstancesPerVehicle: Number(
        data.average_instances_per_vehicle ||
        data.averageInstancesPerVehicle ||
        0
      ),
      medianInstancesPerVehicle: data.median_instances_per_vehicle || data.medianInstancesPerVehicle,
      topManufacturers: data.top_manufacturers?.map((m: any) =>
        ManufacturerStat.fromApiResponse(m)
      ) || data.topManufacturers?.map((m: any) =>
        ManufacturerStat.fromApiResponse(m)
      ),
      topModels: data.top_models?.map((m: any) =>
        ModelStat.fromApiResponse(m)
      ) || data.topModels?.map((m: any) =>
        ModelStat.fromApiResponse(m)
      ),
      bodyClassDistribution: data.body_class_distribution?.map((b: any) =>
        BodyClassStat.fromApiResponse(b)
      ) || data.bodyClassDistribution?.map((b: any) =>
        BodyClassStat.fromApiResponse(b)
      ),
      yearDistribution: data.year_distribution?.map((y: any) =>
        YearStat.fromApiResponse(y)
      ) || data.yearDistribution?.map((y: any) =>
        YearStat.fromApiResponse(y)
      )
    });
  }

  /**
   * Create from segmented statistics format
   */
  private static fromSegmentedStats(data: any): VehicleStatistics {
    const byYearData = data.byYearRange || data.byYear;

    const topManufacturers = VehicleStatistics.transformByManufacturer(data.byManufacturer);
    const topModels = VehicleStatistics.transformModelsByManufacturer(data.modelsByManufacturer);
    const bodyClassDistribution = VehicleStatistics.transformByBodyClass(data.byBodyClass);
    const yearDistribution = VehicleStatistics.transformByYearRange(byYearData);

    const totalVehicles = data.totalCount || 0;
    const manufacturerCount = topManufacturers?.length || 0;
    const modelCount = topModels?.length || 0;
    const bodyClassCount = bodyClassDistribution?.length || 0;

    const years = yearDistribution?.map(y => y.year) || [];
    const yearRange = years.length > 0
      ? { min: Math.min(...years), max: Math.max(...years) }
      : { min: 0, max: 0 };

    return new VehicleStatistics({
      totalVehicles,
      totalInstances: totalVehicles,
      manufacturerCount,
      modelCount,
      bodyClassCount,
      yearRange,
      averageInstancesPerVehicle: 0,
      topManufacturers,
      topModels,
      bodyClassDistribution,
      yearDistribution,
      manufacturerDistribution: topManufacturers,
      byManufacturer: data.byManufacturer,
      byBodyClass: data.byBodyClass,
      byYearRange: byYearData,
      modelsByManufacturer: data.modelsByManufacturer
    });
  }

  /**
   * Transform byManufacturer object to ManufacturerStat array
   */
  private static transformByManufacturer(
    byManufacturer: Record<string, any> | undefined
  ): ManufacturerStat[] | undefined {
    if (!byManufacturer) return undefined;

    const stats = Object.entries(byManufacturer).map(([name, countOrStats]) => {
      const count = typeof countOrStats === 'object'
        ? (countOrStats.total || 0)
        : (countOrStats || 0);

      return new ManufacturerStat({
        name,
        count,
        instanceCount: count,
        percentage: 0,
        modelCount: 0
      });
    });

    stats.sort((a, b) => b.count - a.count);

    const totalCount = stats.reduce((sum, s) => sum + s.count, 0);
    stats.forEach(s => {
      s.percentage = totalCount > 0 ? (s.count / totalCount) * 100 : 0;
    });

    return stats.slice(0, 20);
  }

  /**
   * Transform modelsByManufacturer to ModelStat array
   */
  private static transformModelsByManufacturer(
    modelsByManufacturer: Record<string, Record<string, any>> | undefined
  ): ModelStat[] | undefined {
    if (!modelsByManufacturer) return undefined;

    const stats: ModelStat[] = [];
    let totalCount = 0;

    Object.entries(modelsByManufacturer).forEach(([manufacturer, models]) => {
      Object.entries(models).forEach(([modelName, countOrStats]) => {
        const instanceCount = typeof countOrStats === 'object'
          ? (countOrStats.total || 0)
          : (countOrStats || 0);
        totalCount += instanceCount;
        stats.push(new ModelStat({
          name: modelName,
          manufacturer,
          count: 1,
          instanceCount,
          percentage: 0
        }));
      });
    });

    stats.sort((a, b) => b.instanceCount - a.instanceCount);

    stats.forEach(s => {
      s.percentage = totalCount > 0 ? (s.instanceCount / totalCount) * 100 : 0;
    });

    return stats.slice(0, 20);
  }

  /**
   * Transform byBodyClass to BodyClassStat array
   */
  private static transformByBodyClass(
    byBodyClass: Record<string, any> | undefined
  ): BodyClassStat[] | undefined {
    if (!byBodyClass) return undefined;

    const stats = Object.entries(byBodyClass).map(([name, countOrStats]) => {
      const count = typeof countOrStats === 'object'
        ? (countOrStats.total || 0)
        : (countOrStats || 0);

      return new BodyClassStat({
        name,
        count,
        instanceCount: count,
        percentage: 0
      });
    });

    const totalCount = stats.reduce((sum, s) => sum + s.count, 0);
    stats.forEach(s => {
      s.percentage = totalCount > 0 ? (s.count / totalCount) * 100 : 0;
    });

    stats.sort((a, b) => b.count - a.count);

    return stats;
  }

  /**
   * Transform byYearRange to YearStat array
   */
  private static transformByYearRange(
    byYearRange: Record<string, any> | undefined
  ): YearStat[] | undefined {
    if (!byYearRange) return undefined;

    const stats = Object.entries(byYearRange).map(([yearStr, countOrStats]) => {
      const count = typeof countOrStats === 'object'
        ? (countOrStats.total || 0)
        : (countOrStats || 0);

      return new YearStat({
        year: parseInt(yearStr, 10),
        count,
        instanceCount: count,
        percentage: 0
      });
    });

    const totalCount = stats.reduce((sum, s) => sum + s.count, 0);
    stats.forEach(s => {
      s.percentage = totalCount > 0 ? (s.count / totalCount) * 100 : 0;
    });

    stats.sort((a, b) => a.year - b.year);

    return stats;
  }

  /**
   * Get year span (number of years covered)
   */
  getYearSpan(): number {
    return this.yearRange.max - this.yearRange.min + 1;
  }

  /**
   * Get average vehicles per manufacturer
   */
  getAverageVehiclesPerManufacturer(): number {
    return this.manufacturerCount > 0
      ? this.totalVehicles / this.manufacturerCount
      : 0;
  }
}
```

---

### Step 403.3: Update the Barrel File

Update `src/app/domains/automobile/models/index.ts`:

```typescript
// src/app/domains/automobile/models/index.ts
// VERSION 3 (Section 403) - Complete domain models

export * from './automobile.data';
export * from './automobile.filters';
export * from './automobile.statistics';
```

---

## Verification

### 1. Check Files Exist

```bash
$ ls -la src/app/domains/automobile/models/
```

Expected output:

```
total 20
drwxr-xr-x 2 user user 4096 Feb  9 12:00 .
drwxr-xr-x 3 user user 4096 Feb  9 12:00 ..
-rw-r--r-- 1 user user 4567 Feb  9 12:00 automobile.data.ts
-rw-r--r-- 1 user user 3456 Feb  9 12:00 automobile.filters.ts
-rw-r--r-- 1 user user 8901 Feb  9 12:00 automobile.statistics.ts
-rw-r--r-- 1 user user  200 Feb  9 12:00 index.ts
```

### 2. TypeScript Compilation Check

```bash
$ npx tsc --noEmit src/app/domains/automobile/models/index.ts
```

### 3. Test Filter Usage

```typescript
import { AutoSearchFilters } from '@app/domains/automobile/models';

// Create filters
const filters = new AutoSearchFilters({
  manufacturer: 'Toyota',
  yearMin: 2020,
  yearMax: 2024,
  page: 1,
  size: 20
});

console.log('Is empty:', filters.isEmpty());
// Output: false

console.log('Active count:', filters.getActiveFilterCount());
// Output: 3 (manufacturer, yearMin, yearMax)

// Clone and modify
const newFilters = filters.merge({ bodyClass: 'SUV' });
console.log('Body class:', newFilters.bodyClass);
// Output: 'SUV'
```

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| Statistics empty | Wrong API format detection | Check for `byManufacturer` vs `topManufacturers` |
| Percentages all zero | Total count is zero | Check totalCount calculation |
| Year range wrong | Years not parsed as numbers | Use `parseInt()` for year keys |
| Highlight data missing | Not preserved in transformation | Keep raw `byManufacturer` etc. |

---

## Key Takeaways

1. **Filter models map to URL and API** — Same structure for URL params and query strings
2. **Statistics handle two formats** — Array-based and segmented for charts
3. **Highlight filters enable chart segmentation** — `h_*` prefix for API parameters
4. **Transformation preserves raw data** — Keep segmented data for chart highlighting

---

## Acceptance Criteria

- [ ] `src/app/domains/automobile/models/automobile.filters.ts` exists
- [ ] `HighlightFilters` interface defined
- [ ] `AutoSearchFilters` class with all filter fields
- [ ] Filter utility methods: `isEmpty()`, `clone()`, `merge()`, `clearSearch()`
- [ ] `src/app/domains/automobile/models/automobile.statistics.ts` exists
- [ ] Statistic classes: `ManufacturerStat`, `ModelStat`, `BodyClassStat`, `YearStat`
- [ ] `VehicleStatistics` class with all aggregation fields
- [ ] `fromApiResponse()` handles both array and segmented formats
- [ ] Segmented data preserved for chart highlighting
- [ ] Barrel file exports all models
- [ ] TypeScript compilation succeeds
- [ ] JSDoc comments on all properties and methods

---

## Phase 4 Complete

Congratulations! You have completed Phase 4: Domain Models.

**What you built:**
- Base model patterns with partial constructors
- `VehicleResult` and `VinInstance` data models
- `AutoSearchFilters` filter model
- `VehicleStatistics` and distribution stat models
- API response transformation for multiple formats

**The Aha Moment:**
"Domain models are more than data containers — they encapsulate transformation logic, business rules, and computed values."

---

## Next Step

Proceed to `501-domain-adapter-pattern.md` to begin Phase 5: Domain Adapters.
