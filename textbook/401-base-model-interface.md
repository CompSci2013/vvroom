# 401: Base Model Interface

**Status:** Complete
**Depends On:** 201-domain-config-interface
**Blocks:** 402-domain-data-models, 403-domain-filter-statistics-models

---

## Learning Objectives

After completing this section, you will:
- Understand why domain models use classes instead of interfaces
- Know how to implement the class-with-partial-constructor pattern
- Recognize the benefits of `fromApiResponse()` static factory methods
- Be able to create domain-agnostic base patterns for data models

---

## Objective

Establish the base patterns for domain data models that all specific domain models will follow. This section defines the conventions for creating type-safe, API-aware data classes.

---

## Why

Domain models represent the data your application works with. In Vvroom, the primary domain is **automobiles** — vehicles, manufacturers, models, body classes, and VIN instances.

### The Interface vs Class Decision

TypeScript offers two ways to define data shapes:

**Interfaces:**
```typescript
interface Vehicle {
  vehicle_id: string;
  manufacturer: string;
  model: string;
  year: number;
}
```

**Classes:**
```typescript
class Vehicle {
  vehicle_id!: string;
  manufacturer!: string;
  model!: string;
  year!: number;
}
```

At first glance, interfaces seem simpler. But classes provide crucial advantages:

| Feature | Interface | Class |
|---------|-----------|-------|
| Runtime existence | No (erased) | Yes |
| Methods | No | Yes |
| Computed properties | No | Yes (getters) |
| Factory methods | No | Yes (static) |
| Type guard with `instanceof` | No | Yes |
| Partial initialization | Manual | Constructor pattern |
| API transformation | External function | `fromApiResponse()` |

For domain models that need methods, transformation logic, and computed properties, classes are the better choice.

### The Partial Constructor Pattern

Domain models often come from APIs with varied data. The partial constructor pattern handles this:

```typescript
class Vehicle {
  vehicle_id!: string;
  manufacturer!: string;
  model!: string;
  year!: number;

  constructor(partial?: Partial<Vehicle>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
```

Benefits:
1. **Optional initialization** — Create empty instances or full ones
2. **Flexible merging** — `new Vehicle({ ...existing, year: 2024 })`
3. **Type safety** — `Partial<Vehicle>` ensures only valid properties
4. **IDE support** — Autocomplete works for constructor params

### The Static Factory Pattern

APIs often return data with different field naming conventions:

```json
{
  "vehicle_id": "TOY-CAM-2024",
  "manufacturer": "Toyota",
  "model_year": 2024,
  "body_class": "Sedan"
}
```

The `fromApiResponse()` static method handles transformation:

```typescript
class Vehicle {
  // ...

  static fromApiResponse(data: any): Vehicle {
    return new Vehicle({
      vehicle_id: data.vehicle_id || data.id,
      manufacturer: data.manufacturer,
      model: data.model,
      year: Number(data.model_year || data.year),
      body_class: data.body_class || data.bodyClass
    });
  }
}
```

Benefits:
1. **Single transformation point** — All API normalization in one place
2. **Handles both formats** — `model_year` and `year` both work
3. **Type coercion** — `Number()` ensures numeric types
4. **Testable** — Easy to unit test transformation logic

### Instance Methods for Computed Values

Classes can include methods for computed values:

```typescript
class Vehicle {
  // ...

  getDisplayName(): string {
    return `${this.manufacturer} ${this.model} ${this.year}`;
  }

  getAge(): number {
    return new Date().getFullYear() - this.year;
  }

  isCurrentYear(): boolean {
    return this.year === new Date().getFullYear();
  }
}
```

This encapsulates business logic in the model itself, making it reusable across components.

---

## What

### Step 401.1: Establish Model Conventions

Before creating specific models, establish the patterns all domain models will follow.

**Convention 1: Class with Non-Null Assertion**

Use `!` for required properties to indicate they will be set:

```typescript
class Model {
  required_field!: string;  // Will be set by constructor
  optional_field?: number;  // May or may not be set
}
```

**Convention 2: Partial Constructor**

Every model class has a partial constructor:

```typescript
constructor(partial?: Partial<ModelClass>) {
  if (partial) {
    Object.assign(this, partial);
  }
}
```

**Convention 3: Static Factory Method**

Models that come from APIs have `fromApiResponse()`:

```typescript
static fromApiResponse(data: any): ModelClass {
  return new ModelClass({
    // Map API fields to class properties
  });
}
```

**Convention 4: Display Methods**

Models with display requirements have getter methods:

```typescript
getDisplayName(): string { ... }
getFullDescription(): string { ... }
```

**Convention 5: JSDoc Documentation**

Every property and method has JSDoc:

```typescript
/**
 * Vehicle manufacturer name
 *
 * @example 'Toyota', 'Honda', 'Ford'
 */
manufacturer!: string;
```

---

### Step 401.2: Create the Domain Models Directory

Create the directory structure for automobile domain models.

```bash
$ mkdir -p src/app/domains/automobile/models
$ touch src/app/domains/automobile/models/index.ts
```

Create the barrel file `src/app/domains/automobile/models/index.ts`:

```typescript
// src/app/domains/automobile/models/index.ts
// VERSION 1 (Section 401) - Automobile domain models barrel

// Data models (Section 402)
// export * from './automobile.data';

// Filter and statistics models (Section 403)
// export * from './automobile.filters';
// export * from './automobile.statistics';
```

---

### Step 401.3: Document the Model Pattern

Create a reference document showing the complete model pattern.

The complete model pattern looks like this:

```typescript
/**
 * [Model Name]
 *
 * [Description of what this model represents]
 *
 * Domain: [Domain Name]
 *
 * @example
 * ```typescript
 * const instance: ModelClass = {
 *   field1: 'value1',
 *   field2: 123
 * };
 * ```
 */
export class ModelClass {
  /**
   * [Field description]
   *
   * @example 'example value'
   */
  field1!: string;

  /**
   * [Optional field description]
   *
   * @example 123
   */
  field2?: number;

  /**
   * Constructor with partial data
   *
   * @param partial - Partial ModelClass object
   */
  constructor(partial?: Partial<ModelClass>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  /**
   * Create ModelClass from API response
   *
   * @param data - Raw API response data
   * @returns ModelClass instance
   */
  static fromApiResponse(data: any): ModelClass {
    return new ModelClass({
      field1: data.field1 || data.field_1,
      field2: data.field2 !== undefined ? Number(data.field2) : undefined
    });
  }

  /**
   * Get display name
   *
   * @returns Formatted display string
   */
  getDisplayName(): string {
    return this.field1;
  }
}
```

---

## Verification

### 1. Check Directory Exists

```bash
$ ls -la src/app/domains/automobile/models/
```

Expected output:

```
total 8
drwxr-xr-x 2 user user 4096 Feb  9 12:00 .
drwxr-xr-x 3 user user 4096 Feb  9 12:00 ..
-rw-r--r-- 1 user user  200 Feb  9 12:00 index.ts
```

### 2. TypeScript Check

```bash
$ npx tsc --noEmit src/app/domains/automobile/models/index.ts
```

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| `Property has no initializer` | Missing `!` on required field | Add `!` or make optional with `?` |
| `Partial<T>` not accepting field | Wrong field name | Ensure field names match exactly |
| API fields not mapping | Missing transformation | Add case in `fromApiResponse()` |
| Methods not available | Using interface instead of class | Convert to class with methods |

---

## Key Takeaways

1. **Classes over interfaces for domain models** — Enable methods, factories, and instanceof checks
2. **Partial constructor pattern** — Flexible initialization with type safety
3. **Static factory for API data** — Single point for API field normalization
4. **Instance methods for computed values** — Encapsulate business logic in the model

---

## Acceptance Criteria

- [ ] Domain models directory structure created
- [ ] `src/app/domains/automobile/models/index.ts` exists
- [ ] Model conventions documented and understood:
  - [ ] Non-null assertion for required fields
  - [ ] Optional marker for optional fields
  - [ ] Partial constructor pattern
  - [ ] Static `fromApiResponse()` factory
  - [ ] Instance methods for computed values
  - [ ] JSDoc documentation on all members

---

## Next Step

Proceed to `402-domain-data-models.md` to create the vehicle and VIN instance data models.
