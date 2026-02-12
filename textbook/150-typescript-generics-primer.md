# 150: TypeScript Generics Primer

**Status:** Planning
**Depends On:** 104-environment-config
**Blocks:** 201-domain-config-interface

---

## Learning Objectives

After completing this section, you will:
- Understand why generics exist and what problem they solve
- Be able to read and interpret generic type signatures
- Know the difference between concrete types and type parameters

---

## Objective

Build foundational understanding of TypeScript generics before tackling the framework models in Phase 2. This is a teaching interlude, not a code implementation section — you won't modify the vvroom project here.

---

## Why This Interlude Exists

Phase 2 introduces interfaces like this:

```typescript
export interface DomainConfig<TFilters, TData, TStatistics> {
  urlMapper: IFilterUrlMapper<TFilters>;
  apiAdapter: IApiAdapter<TFilters, TData, TStatistics>;
  tableConfig: TableConfig<TData>;
  // ...
}
```

If you've never worked with generics, this looks intimidating. What are `TFilters`, `TData`, and `TStatistics`? Why are there angle brackets everywhere?

This primer answers those questions. By the end, you'll read generic signatures as fluently as regular TypeScript.

---

## What Are Generics?

### The Problem: Type Safety vs Code Reuse

Consider a function that returns the first element of an array:

```typescript
// Without generics - loses type information
function getFirst(arr: any[]): any {
  return arr[0];
}

const numbers = [1, 2, 3];
const first = getFirst(numbers);  // first is 'any', not 'number'
```

The `any` type works, but we've lost type safety. TypeScript can't help us if we try to call `first.toUpperCase()` on a number.

We could write separate functions for each type:

```typescript
// Type-safe but repetitive
function getFirstNumber(arr: number[]): number {
  return arr[0];
}

function getFirstString(arr: string[]): string {
  return arr[0];
}

function getFirstVehicle(arr: Vehicle[]): Vehicle {
  return arr[0];
}
```

This is type-safe, but we've duplicated the same logic three times. What if we need 50 types?

### The Solution: Generics

Generics let us write one function that works with any type while preserving type information:

```typescript
// With generics - type-safe AND reusable
function getFirst<T>(arr: T[]): T {
  return arr[0];
}

const numbers = [1, 2, 3];
const first = getFirst(numbers);  // first is 'number'

const names = ['Alice', 'Bob'];
const name = getFirst(names);     // name is 'string'

const vehicles: Vehicle[] = [/* ... */];
const vehicle = getFirst(vehicles); // vehicle is 'Vehicle'
```

The `<T>` is a **type parameter**. When you call `getFirst(numbers)`, TypeScript infers that `T` is `number`. The function returns `T`, so the return type is also `number`.

**This is the Aha Moment: Generics give us type safety without code duplication.**

---

## Reading Generic Signatures

### The Anatomy of a Generic Type

```typescript
interface Container<T> {
  value: T;
  getValue(): T;
}
```

| Part | Meaning |
|------|---------|
| `Container` | The interface name |
| `<T>` | Type parameter declaration |
| `value: T` | Property of type T |
| `getValue(): T` | Method returning type T |

The `T` is a placeholder. When you use `Container<string>`, every `T` becomes `string`:

```typescript
const box: Container<string> = {
  value: 'hello',
  getValue() { return this.value; }
};

box.value;       // type is 'string'
box.getValue();  // returns 'string'
```

### Multiple Type Parameters

Generics can have multiple parameters:

```typescript
interface Pair<K, V> {
  key: K;
  value: V;
}

const entry: Pair<string, number> = {
  key: 'age',
  value: 30
};
```

Here `K` becomes `string` and `V` becomes `number`.

### Conventional Type Parameter Names

| Name | Convention |
|------|------------|
| `T` | General "Type" |
| `K` | Key type (in maps/objects) |
| `V` | Value type (in maps/objects) |
| `E` | Element type (in collections) |
| `R` | Return type |

These are conventions, not requirements. In vvroom, we use descriptive names:

| Name | Meaning in vvroom |
|------|------------------|
| `TFilters` | Filter model type (e.g., `AutomobileFilters`) |
| `TData` | Data model type (e.g., `VehicleResult`) |
| `TStats` | Statistics model type (e.g., `VehicleStatistics`) |

The `T` prefix indicates "this is a Type parameter, not a concrete type."

---

## Concrete Types vs Type Parameters

### Concrete Types

A **concrete type** is a specific, known type:

```typescript
// Concrete types - we know exactly what these are
let name: string;
let count: number;
let vehicle: Vehicle;
let filters: AutomobileFilters;
```

### Type Parameters

A **type parameter** is a placeholder filled in later:

```typescript
// Type parameters - placeholders
interface Container<T> {     // T is a parameter
  value: T;
}

// Now we fill in the parameter with a concrete type
const box: Container<string> = { value: 'hello' };
```

Think of type parameters like function parameters:

```typescript
// Function parameter: x is filled in when called
function double(x: number): number {
  return x * 2;
}
double(5);  // x = 5

// Type parameter: T is filled in when used
interface Container<T> {
  value: T;
}
const box: Container<string> = { value: 'hello' };  // T = string
```

---

## Built-in Generic Types

You've already used generics — TypeScript's built-in types use them extensively.

### Array<T>

```typescript
// These are equivalent
const numbers: number[] = [1, 2, 3];
const numbers: Array<number> = [1, 2, 3];
```

`Array<number>` means "an array where every element is a number."

### Promise<T>

```typescript
// A promise that resolves to a string
const greeting: Promise<string> = Promise.resolve('hello');

// A promise that resolves to a Vehicle
const vehiclePromise: Promise<Vehicle> = fetchVehicle(id);
```

`Promise<Vehicle>` means "a promise that, when resolved, gives you a Vehicle."

### Map<K, V>

```typescript
// A map from string keys to number values
const ages: Map<string, number> = new Map();
ages.set('Alice', 30);
ages.set('Bob', 25);

ages.get('Alice');  // returns number | undefined
```

### Partial<T>

```typescript
interface Vehicle {
  make: string;
  model: string;
  year: number;
}

// All properties become optional
const partial: Partial<Vehicle> = {
  make: 'Toyota'
  // model and year are optional
};
```

`Partial<Vehicle>` creates a new type where all properties of `Vehicle` are optional. This is useful for update operations where you only change some fields.

---

## Generic Constraints

Sometimes you need to limit what types can be used as a parameter.

### The Problem

```typescript
function getLength<T>(item: T): number {
  return item.length;  // Error: Property 'length' does not exist on type 'T'
}
```

TypeScript doesn't know that `T` has a `length` property. What if someone passes a number?

### The Solution: extends

```typescript
interface HasLength {
  length: number;
}

function getLength<T extends HasLength>(item: T): number {
  return item.length;  // Now TypeScript knows T has 'length'
}

getLength('hello');     // OK - strings have length
getLength([1, 2, 3]);   // OK - arrays have length
getLength(42);          // Error - numbers don't have length
```

The `extends` keyword constrains `T` to types that have a `length` property.

### Constraints in vvroom

In Phase 2, you'll see constraints like:

```typescript
interface IApiAdapter<TFilters, TData, TStatistics = any> {
  fetchData(filters: TFilters): Observable<ApiResponse<TData>>;
  // ...
}
```

The `= any` provides a default type. If you don't specify `TStatistics`, it defaults to `any`.

---

## Applying Generics: A Preview of Phase 2

Here's how vvroom uses generics. Don't memorize this — just recognize the patterns.

### The DomainConfig Interface

```typescript
export interface DomainConfig<TFilters, TData, TStatistics> {
  // Identity
  domainKey: string;
  displayName: string;

  // Type references (so the framework knows what types to expect)
  filterModel: Type<TFilters>;
  dataModel: Type<TData>;

  // Adapters (these use the same type parameters)
  apiAdapter: IApiAdapter<TFilters, TData, TStatistics>;
  urlMapper: IFilterUrlMapper<TFilters>;

  // UI configuration
  tableConfig: TableConfig<TData>;
}
```

**Reading this signature:**

1. `DomainConfig` takes three type parameters
2. `TFilters` flows through to `urlMapper` and `apiAdapter`
3. `TData` flows through to `apiAdapter` and `tableConfig`
4. `TStatistics` flows through to `apiAdapter`

### Using the Interface

When we create the automobile domain config:

```typescript
const AUTOMOBILE_CONFIG: DomainConfig<
  AutomobileFilters,    // TFilters = AutomobileFilters
  VehicleResult,        // TData = VehicleResult
  VehicleStatistics     // TStatistics = VehicleStatistics
> = {
  domainKey: 'automobile',
  displayName: 'Automobiles',
  filterModel: AutomobileFilters,
  dataModel: VehicleResult,
  apiAdapter: new AutomobileApiAdapter(),
  urlMapper: new AutomobileUrlMapper(),
  tableConfig: automobileTableConfig,
};
```

Now TypeScript knows:
- `urlMapper` must accept `AutomobileFilters`
- `tableConfig` must work with `VehicleResult`
- `apiAdapter` must return `VehicleStatistics`

If any of these are wrong, TypeScript catches the error at compile time.

---

## Practice Exercises

Try these in your editor or the TypeScript Playground (https://www.typescriptlang.org/play).

### Exercise 1: Read the Signature

What type is `result` in each case?

```typescript
function identity<T>(value: T): T {
  return value;
}

const result1 = identity('hello');
const result2 = identity(42);
const result3 = identity({ name: 'Alice' });
```

<details>
<summary>Answer</summary>

- `result1` is `string`
- `result2` is `number`
- `result3` is `{ name: string }`

TypeScript infers `T` from the argument type.
</details>

### Exercise 2: Write a Generic Function

Write a function `wrapInArray` that takes any value and returns it wrapped in an array.

```typescript
// Your code here

wrapInArray('hello');  // should be ['hello'] with type string[]
wrapInArray(42);       // should be [42] with type number[]
```

<details>
<summary>Answer</summary>

```typescript
function wrapInArray<T>(value: T): T[] {
  return [value];
}
```
</details>

### Exercise 3: Multiple Type Parameters

What are the types of `key` and `value`?

```typescript
interface Entry<K, V> {
  key: K;
  value: V;
}

const entry: Entry<string, number> = {
  key: 'count',
  value: 42
};

const { key, value } = entry;
```

<details>
<summary>Answer</summary>

- `key` is `string` (K = string)
- `value` is `number` (V = number)
</details>

---

## Common Mistakes

### Mistake 1: Forgetting Type Parameters

```typescript
// Wrong - DomainConfig needs type parameters
const config: DomainConfig = { /* ... */ };

// Right
const config: DomainConfig<AutomobileFilters, VehicleResult, VehicleStatistics> = { /* ... */ };
```

### Mistake 2: Mismatched Types

```typescript
interface Container<T> {
  value: T;
}

// Wrong - value type doesn't match
const box: Container<string> = {
  value: 42  // Error: number is not assignable to string
};
```

### Mistake 3: Confusing Type Parameters with Values

```typescript
// Wrong - TFilters is a type, not a value
function processFilters<TFilters>(filters: TFilters) {
  console.log(TFilters);  // Error: 'TFilters' only refers to a type
}

// Right - use the parameter, not the type
function processFilters<TFilters>(filters: TFilters) {
  console.log(filters);  // OK
}
```

---

## Key Takeaways

1. **Generics provide type safety without code duplication** — Write once, use with any type
2. **Type parameters are placeholders** — They're filled in when you use the generic type
3. **T-prefixed names indicate type parameters** — `TFilters`, `TData`, `TStats` are conventions, not requirements

---

## The Aha Moment

**Generics give us type safety without code duplication.**

In Phase 2, you'll create interfaces with generic parameters. These interfaces define contracts that work with *any* domain:

- `DomainConfig<TFilters, TData, TStats>` works for automobiles, real estate, or any future domain
- The framework code uses these interfaces without knowing the specific types
- Domain-specific code provides concrete types (`AutomobileFilters`, `VehicleResult`)
- TypeScript ensures everything matches up at compile time

Without generics, we'd either:
- Lose type safety (use `any` everywhere)
- Duplicate code for each domain

Generics give us both type safety and reusability. That's why they're foundational to vvroom's architecture.

---

## Acceptance Criteria

This is a teaching section with no code changes. Criteria are conceptual:

- [ ] You can explain what problem generics solve
- [ ] You can read `Interface<T, U>` and understand T and U are type parameters
- [ ] You can identify the difference between `string` (concrete type) and `T` (type parameter)
- [ ] You can explain what `DomainConfig<TFilters, TData, TStats>` means conceptually

---

## Next Step

Proceed to `201-domain-config-interface.md` to create the central configuration interface using the generic patterns you just learned.
