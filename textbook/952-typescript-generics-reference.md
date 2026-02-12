# 952: TypeScript Generics Reference

**Status:** Reference Document
**Type:** Appendix

---

## Learning Objectives

After reading this reference, you will:
- Have a quick reference for generic patterns used in vvroom
- Understand advanced generic techniques beyond the primer
- Be able to look up type utilities without leaving the book

---

## Overview

This appendix extends the TypeScript Generics Primer (document 150) with advanced patterns and a complete reference of generic types used in the vvroom application.

---

## Quick Reference: Generic Syntax

### Declaration Syntax

| Syntax | Meaning |
|--------|---------|
| `<T>` | Single type parameter |
| `<T, U>` | Multiple type parameters |
| `<T extends Base>` | Constrained type parameter |
| `<T = Default>` | Type parameter with default |
| `<T extends Base = Default>` | Constrained with default |

### Usage Syntax

| Syntax | Meaning |
|--------|---------|
| `Array<string>` | Concrete instantiation |
| `Partial<User>` | Utility type application |
| `keyof T` | Get keys of T as union |
| `T[K]` | Indexed access type |
| `T extends U ? X : Y` | Conditional type |

---

## Vvroom Generic Patterns

### The Domain Config Pattern

The central generic pattern in vvroom:

```typescript
interface DomainConfig<TFilters, TData, TStatistics> {
  domainKey: string;
  displayName: string;
  urlMapper: IFilterUrlMapper<TFilters>;
  apiAdapter: IApiAdapter<TFilters, TData, TStatistics>;
  tableConfig: TableConfig<TData>;
  chartDataSources?: Record<string, ChartDataSource<TStatistics>>;
}
```

**Type flow:**

```
DomainConfig<AutomobileFilters, VehicleResult, VehicleStatistics>
     │                │                │                │
     │                │                │                └─► chartDataSources value types
     │                │                └─► apiAdapter, tableConfig
     │                └─► apiAdapter, urlMapper
     └─► The whole thing
```

### The Adapter Pattern

Adapters connect framework code to domain-specific implementations:

```typescript
interface IApiAdapter<TFilters, TData, TStatistics> {
  fetchData(filters: TFilters): Observable<ApiResponse<TData>>;
  fetchStatistics(filters: TFilters): Observable<TStatistics>;
}

// Concrete implementation
class AutomobileApiAdapter implements IApiAdapter<
  AutomobileFilters,
  VehicleResult,
  VehicleStatistics
> {
  fetchData(filters: AutomobileFilters): Observable<ApiResponse<VehicleResult>> {
    // Implementation
  }
}
```

### The Service Generic Pattern

Services that work with any domain use type parameters:

```typescript
class ResourceManagementService<TFilters, TData, TStatistics> {
  private readonly state$ = new BehaviorSubject<ResourceState<TFilters, TData, TStatistics>>(
    initialState
  );

  get data$(): Observable<TData[] | undefined> {
    return this.state$.pipe(map(s => s.data));
  }
}
```

---

## Built-in Utility Types

### Partial<T>

Makes all properties optional:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// All properties optional
type PartialUser = Partial<User>;
// { id?: number; name?: string; email?: string; }

// Use case: Update operations
function updateUser(id: number, updates: Partial<User>) {
  // Only changed fields are required
}

updateUser(1, { name: 'New Name' }); // OK - only name provided
```

**Used in vvroom:** Filter updates, partial state changes

---

### Required<T>

Makes all properties required (opposite of Partial):

```typescript
interface Config {
  debug?: boolean;
  timeout?: number;
}

type RequiredConfig = Required<Config>;
// { debug: boolean; timeout: number; }
```

---

### Readonly<T>

Makes all properties readonly:

```typescript
interface State {
  count: number;
  items: string[];
}

type ReadonlyState = Readonly<State>;
// { readonly count: number; readonly items: string[]; }

const state: ReadonlyState = { count: 0, items: [] };
state.count = 1; // Error: Cannot assign to 'count'
```

**Used in vvroom:** Immutable state patterns

---

### Pick<T, K>

Creates a type with only the specified properties:

```typescript
interface Vehicle {
  vin: string;
  make: string;
  model: string;
  year: number;
  color: string;
}

type VehicleIdentity = Pick<Vehicle, 'vin' | 'make' | 'model'>;
// { vin: string; make: string; model: string; }
```

**Used in vvroom:** Extracting subsets for display or API calls

---

### Omit<T, K>

Creates a type without the specified properties:

```typescript
interface Vehicle {
  vin: string;
  make: string;
  model: string;
  year: number;
  internalId: string; // Don't send to API
}

type VehicleForApi = Omit<Vehicle, 'internalId'>;
// { vin: string; make: string; model: string; year: number; }
```

---

### Record<K, V>

Creates an object type with keys of type K and values of type V:

```typescript
type ChartSourceMap = Record<string, ChartDataSource>;
// { [key: string]: ChartDataSource }

const sources: ChartSourceMap = {
  'manufacturer': new ManufacturerChartSource(),
  'year': new YearChartSource()
};
```

**Used in vvroom:** `chartDataSources`, URL parameters

---

### Extract<T, U>

Extracts types from T that are assignable to U:

```typescript
type EventTypes = 'click' | 'focus' | 'blur' | 'scroll' | 'resize';
type MouseEvents = Extract<EventTypes, 'click' | 'scroll'>;
// 'click' | 'scroll'
```

---

### Exclude<T, U>

Excludes types from T that are assignable to U:

```typescript
type EventTypes = 'click' | 'focus' | 'blur' | 'scroll' | 'resize';
type KeyboardEvents = Exclude<EventTypes, 'click' | 'scroll' | 'resize'>;
// 'focus' | 'blur'
```

---

### NonNullable<T>

Removes null and undefined from T:

```typescript
type MaybeString = string | null | undefined;
type DefinitelyString = NonNullable<MaybeString>;
// string
```

---

### ReturnType<T>

Gets the return type of a function type:

```typescript
function createFilters(): AutomobileFilters {
  return new AutomobileFilters();
}

type Filters = ReturnType<typeof createFilters>;
// AutomobileFilters
```

---

### Parameters<T>

Gets the parameter types of a function as a tuple:

```typescript
function fetchData(filters: AutomobileFilters, page: number): Promise<VehicleResult[]> {
  // ...
}

type FetchParams = Parameters<typeof fetchData>;
// [AutomobileFilters, number]
```

---

## Advanced Patterns

### Mapped Types

Transform properties of a type:

```typescript
// Make all properties nullable
type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

interface User {
  name: string;
  age: number;
}

type NullableUser = Nullable<User>;
// { name: string | null; age: number | null; }
```

### Conditional Types

Types that depend on conditions:

```typescript
type IsArray<T> = T extends any[] ? true : false;

type A = IsArray<string[]>;  // true
type B = IsArray<string>;    // false
```

**Practical example:**

```typescript
// Unwrap array types, leave others alone
type Unwrap<T> = T extends (infer U)[] ? U : T;

type A = Unwrap<string[]>;  // string
type B = Unwrap<number>;    // number
```

### Template Literal Types

Create types from string patterns:

```typescript
type FilterKey = 'manufacturer' | 'year' | 'model';
type HighlightKey = `h_${FilterKey}`;
// 'h_manufacturer' | 'h_year' | 'h_model'

// Used in URL state management
function isHighlightParam(key: string): key is HighlightKey {
  return key.startsWith('h_');
}
```

---

## Type Guards with Generics

### User-Defined Type Guards

Narrow types safely:

```typescript
interface ApiError {
  code: number;
  message: string;
}

interface ApiSuccess<T> {
  data: T;
}

type ApiResponse<T> = ApiError | ApiSuccess<T>;

function isSuccess<T>(response: ApiResponse<T>): response is ApiSuccess<T> {
  return 'data' in response;
}

// Usage
function handleResponse<T>(response: ApiResponse<T>): T | null {
  if (isSuccess(response)) {
    return response.data;  // TypeScript knows this is ApiSuccess<T>
  }
  console.error(response.message);  // TypeScript knows this is ApiError
  return null;
}
```

---

## Generic Constraints in Vvroom

### Constraining to Interfaces

```typescript
interface HasId {
  id: string;
}

function findById<T extends HasId>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}

// Works with any type that has an 'id' property
const vehicle = findById(vehicles, 'VIN123');
const user = findById(users, 'USER456');
```

### Constraining to Keys

```typescript
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const vehicle = { make: 'Toyota', year: 2022 };
const make = getProperty(vehicle, 'make');  // string
const year = getProperty(vehicle, 'year');  // number
const bad = getProperty(vehicle, 'color');  // Error: 'color' not in keyof vehicle
```

---

## Observable Generic Patterns

RxJS uses generics extensively:

```typescript
// Observable of specific type
statistics$: Observable<VehicleStatistics>;

// Subject with type parameter
private readonly state$ = new BehaviorSubject<ResourceState<TFilters, TData>>(initial);

// Operators preserve/transform types
this.state$.pipe(
  map(state => state.data),      // Observable<TData[] | undefined>
  filter((data): data is TData[] => data !== undefined),  // Observable<TData[]>
  map(data => data.length)       // Observable<number>
);
```

---

## Common Mistakes

### Mistake 1: Missing Type Arguments

```typescript
// Wrong - Map needs type arguments
const cache = new Map();  // Map<any, any>

// Right
const cache = new Map<string, VehicleResult>();
```

### Mistake 2: Overly Narrow Constraints

```typescript
// Too restrictive - only works with AutomobileFilters
function process<T extends AutomobileFilters>(filters: T) { }

// Better - works with any filter type
function process<T>(filters: T) { }

// Or if you need specific properties
function process<T extends { page?: number }>(filters: T) { }
```

### Mistake 3: Ignoring Inference

```typescript
// Unnecessary - TypeScript infers T
const result = identity<string>('hello');

// Let TypeScript infer
const result = identity('hello');  // T is inferred as string
```

### Mistake 4: Using `any` Instead of Generics

```typescript
// Bad - loses type safety
function firstElement(arr: any[]): any {
  return arr[0];
}

// Good - preserves type
function firstElement<T>(arr: T[]): T | undefined {
  return arr[0];
}
```

---

## Quick Reference Table: Vvroom Generic Types

| Type | Purpose | Type Parameters |
|------|---------|-----------------|
| `DomainConfig<F, D, S>` | Domain configuration | Filters, Data, Statistics |
| `IApiAdapter<F, D, S>` | API adapter interface | Filters, Data, Statistics |
| `IFilterUrlMapper<F>` | URL mapping interface | Filters |
| `TableConfig<D>` | Table configuration | Data row type |
| `ChartDataSource<S>` | Chart data transformation | Statistics type |
| `ResourceState<F, D, S>` | Service state | Filters, Data, Statistics |
| `ApiResponse<D>` | API response wrapper | Data type |
| `Observable<T>` | RxJS observable | Emitted value type |
| `BehaviorSubject<T>` | RxJS subject with initial value | Value type |

---

## Key Takeaways

1. **Generics flow through the architecture** — From DomainConfig through services to components
2. **Utility types reduce boilerplate** — Use Partial, Pick, Omit instead of redefining
3. **Constraints ensure type safety** — Use `extends` to require specific properties
4. **Let TypeScript infer when possible** — Don't over-annotate

---

## Further Reading

- [TypeScript Handbook: Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [TypeScript Handbook: Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [TypeScript Handbook: Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
