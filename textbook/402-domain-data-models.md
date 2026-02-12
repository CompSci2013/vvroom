# 402: Domain Data Models

**Status:** Complete
**Depends On:** 401-base-model-interface
**Blocks:** 403-domain-filter-statistics-models, Phase 5 (Domain Adapters)

---

## Learning Objectives

After completing this section, you will:
- Understand how to model domain entities as TypeScript classes
- Know how to handle API response transformation for different naming conventions
- Recognize the relationship between aggregate data (VehicleResult) and detail data (VinInstance)
- Be able to implement utility methods that encapsulate business logic

---

## Objective

Create the core data models for the automobile domain: `VehicleResult` for vehicle configurations and `VinInstance` for individual VIN records.

---

## Why

The automobile domain centers on two core entities:

### VehicleResult — The Aggregate

A `VehicleResult` represents a **unique vehicle configuration** — a specific combination of:
- Manufacturer (Toyota, Honda, Ford)
- Model (Camry, Accord, F-150)
- Year (2024, 2023, 2022)
- Body Class (Sedan, SUV, Truck)

Each configuration has an `instance_count` showing how many individual vehicles (VINs) exist for that configuration.

```
Toyota Camry 2024 Sedan — 156 instances
Honda Accord 2023 Sedan — 89 instances
Ford F-150 2024 Truck — 234 instances
```

### VinInstance — The Detail

A `VinInstance` represents a **single vehicle** with a unique VIN (Vehicle Identification Number). When users expand a row in the data table, they see individual VINs for that vehicle configuration.

```
1HGCM82633A123456 — Toyota Camry 2024
1HGCM82633A123457 — Toyota Camry 2024
1HGCM82633A123458 — Toyota Camry 2024
```

### The Relationship

```
VehicleResult (1) ———— (many) VinInstance
     ↓
manufacturer: Toyota
model: Camry
year: 2024
body_class: Sedan
instance_count: 156
     ↓
     Links to 156 VinInstance records
```

### API Response Handling

The API may return data in different formats:

```json
// snake_case from backend
{
  "vehicle_id": "TOY-CAM-2024-SED",
  "body_class": "Sedan",
  "instance_count": 156,
  "first_seen": "2024-01-15T10:30:00Z"
}

// camelCase from some endpoints
{
  "vehicleId": "TOY-CAM-2024-SED",
  "bodyClass": "Sedan",
  "instanceCount": 156,
  "firstSeen": "2024-01-15T10:30:00Z"
}
```

The `fromApiResponse()` method handles both:

```typescript
static fromApiResponse(data: any): VehicleResult {
  return new VehicleResult({
    vehicle_id: data.vehicle_id || data.vehicleId || data.id,
    body_class: data.body_class || data.bodyClass,
    instance_count: Number(data.instance_count || data.instanceCount || 0),
    first_seen: data.first_seen || data.firstSeen
  });
}
```

---

## What

### Step 402.1: Create the Vehicle Result Model

Create the file `src/app/domains/automobile/models/automobile.data.ts`:

```typescript
// src/app/domains/automobile/models/automobile.data.ts
// VERSION 1 (Section 402) - Automobile domain data models

/**
 * Vehicle result data
 *
 * Represents a unique vehicle configuration with aggregated VIN instance count.
 * Each record represents a distinct combination of manufacturer, model, year, and body class.
 *
 * Domain: Automobile Discovery
 *
 * @example
 * ```typescript
 * const vehicle: VehicleResult = {
 *   vehicle_id: 'TOY-CAM-2024-SED',
 *   manufacturer: 'Toyota',
 *   model: 'Camry',
 *   year: 2024,
 *   body_class: 'Sedan',
 *   instance_count: 156,
 *   first_seen: '2024-01-15T10:30:00Z',
 *   last_seen: '2024-11-20T14:22:00Z'
 * };
 * ```
 */
export class VehicleResult {
  /**
   * Unique vehicle identifier
   * Composite key: manufacturer-model-year-bodyclass
   *
   * @example 'TOY-CAM-2024-SED', 'HON-ACC-2023-SED'
   */
  vehicle_id!: string;

  /**
   * Vehicle manufacturer name
   *
   * @example 'Toyota', 'Honda', 'Ford', 'Chevrolet'
   */
  manufacturer!: string;

  /**
   * Vehicle model name
   *
   * @example 'Camry', 'Accord', 'F-150', 'Silverado'
   */
  model!: string;

  /**
   * Vehicle model year
   *
   * @example 2024, 2023, 2022
   */
  year!: number;

  /**
   * Vehicle body class/type
   *
   * @example 'Sedan', 'SUV', 'Truck', 'Coupe', 'Wagon', 'Van'
   */
  body_class!: string;

  /**
   * Number of VIN instances for this vehicle configuration
   * Represents how many individual vehicles (VINs) exist for this configuration
   *
   * @example 156 (means 156 unique VINs for this vehicle config)
   */
  instance_count!: number;

  /**
   * Date/time this vehicle configuration was first seen in the system
   * ISO 8601 format
   *
   * @example '2024-01-15T10:30:00Z'
   */
  first_seen?: string;

  /**
   * Date/time this vehicle configuration was last updated
   * ISO 8601 format
   *
   * @example '2024-11-20T14:22:00Z'
   */
  last_seen?: string;

  /**
   * Drive type
   * @example 'FWD', 'RWD', 'AWD', '4WD'
   */
  drive_type?: string;

  /**
   * Engine configuration
   * @example 'V6', 'I4', 'V8', 'Electric'
   */
  engine?: string;

  /**
   * Transmission type
   * @example 'Automatic', 'Manual', 'CVT'
   */
  transmission?: string;

  /**
   * Fuel type
   * @example 'Gasoline', 'Diesel', 'Electric', 'Hybrid'
   */
  fuel_type?: string;

  /**
   * Vehicle class/category
   * @example 'Passenger Car', 'Light Truck', 'Commercial Vehicle'
   */
  vehicle_class?: string;

  /**
   * Constructor with partial data
   *
   * @param partial - Partial VehicleResult object
   */
  constructor(partial?: Partial<VehicleResult>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  /**
   * Create VehicleResult from API response
   *
   * Handles both snake_case and camelCase field names from API.
   *
   * @param data - Raw API response data
   * @returns VehicleResult instance
   */
  static fromApiResponse(data: any): VehicleResult {
    return new VehicleResult({
      vehicle_id: data.vehicle_id || data.vehicleId || data.id,
      manufacturer: data.manufacturer,
      model: data.model,
      year: Number(data.year),
      body_class: data.body_class || data.bodyClass,
      instance_count: Number(data.instance_count || data.instanceCount || 0),
      first_seen: data.first_seen || data.firstSeen,
      last_seen: data.last_seen || data.lastSeen,
      drive_type: data.drive_type || data.driveType,
      engine: data.engine,
      transmission: data.transmission,
      fuel_type: data.fuel_type || data.fuelType,
      vehicle_class: data.vehicle_class || data.vehicleClass
    });
  }

  /**
   * Get display name for vehicle
   *
   * @returns Formatted display string
   * @example 'Toyota Camry 2024'
   */
  getDisplayName(): string {
    return `${this.manufacturer} ${this.model} ${this.year}`;
  }

  /**
   * Get full description for vehicle
   *
   * @returns Detailed description string
   * @example 'Toyota Camry 2024 Sedan (156 instances)'
   */
  getFullDescription(): string {
    return `${this.manufacturer} ${this.model} ${this.year} ${this.body_class} (${this.instance_count} instances)`;
  }

  /**
   * Check if vehicle has VIN instances
   *
   * @returns True if instance_count > 0
   */
  hasInstances(): boolean {
    return this.instance_count > 0;
  }

  /**
   * Get age of vehicle in years
   *
   * @returns Age in years from current year
   */
  getAge(): number {
    const currentYear = new Date().getFullYear();
    return currentYear - this.year;
  }

  /**
   * Check if vehicle is current year
   *
   * @returns True if year matches current year
   */
  isCurrentYear(): boolean {
    return this.year === new Date().getFullYear();
  }
}

/**
 * VIN instance detail
 *
 * Represents a single VIN instance for a vehicle configuration.
 * Used in row expansion to show individual VINs.
 *
 * @example
 * ```typescript
 * const vin: VinInstance = {
 *   vin: '1HGCM82633A123456',
 *   vehicle_id: 'HON-ACC-2023-SED',
 *   registration_date: '2023-05-10',
 *   registration_state: 'CA',
 *   odometer_reading: 15234
 * };
 * ```
 */
export class VinInstance {
  /**
   * Vehicle Identification Number (17 characters)
   *
   * @example '1HGCM82633A123456'
   */
  vin!: string;

  /**
   * Associated vehicle configuration ID
   * Links to VehicleResult.vehicle_id
   *
   * @example 'HON-ACC-2023-SED'
   */
  vehicle_id!: string;

  /**
   * Registration date
   * @example '2023-05-10'
   */
  registration_date?: string;

  /**
   * Registration state/province
   * @example 'CA', 'TX', 'NY'
   */
  registration_state?: string;

  /**
   * Odometer reading (miles)
   * @example 15234
   */
  odometer_reading?: number;

  /**
   * Vehicle status
   * @example 'Active', 'Salvage', 'Totaled', 'Stolen'
   */
  status?: string;

  /**
   * Color
   * @example 'White', 'Black', 'Silver'
   */
  color?: string;

  /**
   * Current owner/registrant (anonymized)
   * @example 'Owner-12345'
   */
  owner_id?: string;

  /**
   * Last update timestamp
   * @example '2024-11-20T10:30:00Z'
   */
  last_updated?: string;

  /**
   * Constructor with partial data
   *
   * @param partial - Partial VinInstance object
   */
  constructor(partial?: Partial<VinInstance>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  /**
   * Create VinInstance from API response
   *
   * @param data - Raw API response data
   * @returns VinInstance instance
   */
  static fromApiResponse(data: any): VinInstance {
    return new VinInstance({
      vin: data.vin,
      vehicle_id: data.vehicle_id || data.vehicleId,
      registration_date: data.registration_date || data.registrationDate,
      registration_state: data.registration_state || data.registrationState,
      odometer_reading: data.odometer_reading || data.odometerReading,
      status: data.status,
      color: data.color,
      owner_id: data.owner_id || data.ownerId,
      last_updated: data.last_updated || data.lastUpdated
    });
  }

  /**
   * Get formatted VIN (groups of 4 characters)
   *
   * @returns Formatted VIN string
   * @example '1HGC M826 33A1 2345 6'
   */
  getFormattedVin(): string {
    return this.vin.match(/.{1,4}/g)?.join(' ') || this.vin;
  }

  /**
   * Check if VIN is valid length
   *
   * @returns True if VIN is 17 characters
   */
  isValidLength(): boolean {
    return this.vin?.length === 17;
  }
}
```

---

### Step 402.2: Update the Barrel File

Update `src/app/domains/automobile/models/index.ts`:

```typescript
// src/app/domains/automobile/models/index.ts
// VERSION 2 (Section 402) - Added data models

export * from './automobile.data';

// Filter and statistics models (Section 403)
// export * from './automobile.filters';
// export * from './automobile.statistics';
```

---

## Verification

### 1. Check File Exists

```bash
$ ls -la src/app/domains/automobile/models/automobile.data.ts
```

### 2. TypeScript Compilation Check

```bash
$ npx tsc --noEmit src/app/domains/automobile/models/automobile.data.ts
```

### 3. Test Model Usage

Create a temporary test:

```typescript
// In any component or test file
import { VehicleResult, VinInstance } from '@app/domains/automobile/models';

// Test VehicleResult
const vehicle = VehicleResult.fromApiResponse({
  vehicle_id: 'TOY-CAM-2024-SED',
  manufacturer: 'Toyota',
  model: 'Camry',
  year: '2024', // String from API
  body_class: 'Sedan',
  instance_count: '156' // String from API
});

console.log('Display name:', vehicle.getDisplayName());
// Output: 'Toyota Camry 2024'

console.log('Full description:', vehicle.getFullDescription());
// Output: 'Toyota Camry 2024 Sedan (156 instances)'

console.log('Age:', vehicle.getAge());
// Output: 0 (if current year is 2024)

// Test VinInstance
const vin = new VinInstance({
  vin: '1HGCM82633A123456',
  vehicle_id: 'HON-ACC-2023-SED'
});

console.log('Formatted VIN:', vin.getFormattedVin());
// Output: '1HGC M826 33A1 2345 6'

console.log('Valid length:', vin.isValidLength());
// Output: true
```

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| `year` is string not number | API returns string | Use `Number()` in `fromApiResponse()` |
| `instance_count` is `NaN` | Missing or null from API | Default to 0: `Number(data.instance_count || 0)` |
| `body_class` undefined | Different API field name | Check for both `body_class` and `bodyClass` |
| Methods not available on object | Plain object, not class instance | Use `fromApiResponse()` or `new VehicleResult()` |

---

## Key Takeaways

1. **Classes enable methods and transformation** — `getDisplayName()`, `getAge()`, etc.
2. **Handle both API naming conventions** — Check for `body_class` and `bodyClass`
3. **Type coercion is essential** — API sends strings, models need numbers
4. **Instance methods encapsulate logic** — Business rules live in the model

---

## Acceptance Criteria

- [ ] `src/app/domains/automobile/models/automobile.data.ts` exists
- [ ] `VehicleResult` class with all required fields
- [ ] `VinInstance` class with all required fields
- [ ] Both classes have partial constructor
- [ ] Both classes have `fromApiResponse()` static method
- [ ] `VehicleResult` has utility methods:
  - [ ] `getDisplayName()`
  - [ ] `getFullDescription()`
  - [ ] `hasInstances()`
  - [ ] `getAge()`
  - [ ] `isCurrentYear()`
- [ ] `VinInstance` has utility methods:
  - [ ] `getFormattedVin()`
  - [ ] `isValidLength()`
- [ ] Barrel file exports both classes
- [ ] TypeScript compilation succeeds
- [ ] JSDoc comments on all properties and methods

---

## Next Step

Proceed to `403-domain-filter-statistics-models.md` to create the filter and statistics models.
