# 206: API Response Interface

**Status:** Planning
**Depends On:** 201-domain-config-interface
**Blocks:** 302-api-service

---

## Learning Objectives

After completing this section, you will:
- Understand why standardized API response formats simplify frontend development
- Know how TypeScript generics create type-safe response handling
- Recognize the relationship between API responses and pagination

---

## Objective

Create the `ApiResponse` interface that defines the standard format for paginated API responses. This interface ensures consistency between backend responses and frontend expectations, enabling type-safe data handling throughout the application.

---

## Why

APIs return data in various formats. Without a standard, every component must handle response parsing differently:

```typescript
// Anti-pattern: Ad-hoc response handling
this.http.get('/vehicles').subscribe(response => {
  // Is it response.data? response.results? response.items?
  // Is total in response.total? response.meta.total? response.pagination.count?
  this.vehicles = response.data; // Hope this is right...
  this.total = response.meta?.total ?? response.total ?? 0; // Defensive coding
});
```

With a standardized `ApiResponse` interface:

```typescript
// Better: Type-safe response handling
this.http.get<ApiResponse<Vehicle>>('/vehicles').subscribe(response => {
  this.vehicles = response.results; // TypeScript knows this exists
  this.total = response.total;      // TypeScript knows this exists
});
```

### API Contract Alignment

The `ApiResponse` interface aligns with the API contract defined in document 051 (API Contract Overview). The API server returns responses in this exact format:

```json
{
  "results": [...],
  "total": 1234,
  "page": 1,
  "size": 20,
  "totalPages": 62,
  "statistics": { ... }
}
```

By defining this interface, the frontend and backend agree on the response shape. TypeScript enforces this agreement at compile time.

---

## What

### Step 206.1: Create the API Response Interface

Create the file `src/app/framework/models/api-response.interface.ts`:

```typescript
// src/app/framework/models/api-response.interface.ts
// VERSION 1 (Section 206) - Standardized API response format

/**
 * Generic API response interface for paginated endpoints
 *
 * This interface defines the standard response format for all paginated
 * API endpoints in the vvroom application. Both the frontend and backend
 * agree on this format, enabling type-safe data handling.
 *
 * @template TData - The type of data items in the results array
 *
 * @example
 * ```typescript
 * interface Vehicle {
 *   vin: string;
 *   manufacturer: string;
 *   model: string;
 *   year: number;
 * }
 *
 * // Typed HTTP request
 * this.http.get<ApiResponse<Vehicle>>('/api/vehicles', { params })
 *   .subscribe(response => {
 *     console.log(response.results);     // Vehicle[]
 *     console.log(response.total);       // number
 *     console.log(response.page);        // number
 *     console.log(response.totalPages);  // number
 *   });
 * ```
 */
export interface ApiResponse<TData> {
  /**
   * Array of result items for the current page
   */
  results: TData[];

  /**
   * Total number of items across all pages
   * Used for pagination display: "Showing 1-20 of 1,234 results"
   */
  total: number;

  /**
   * Current page number (1-indexed)
   * Page 1 is the first page
   */
  page: number;

  /**
   * Number of items per page
   * Matches the `size` query parameter
   */
  size: number;

  /**
   * Total number of pages
   * Computed as: Math.ceil(total / size)
   */
  totalPages: number;

  /**
   * Optional statistics data (domain-specific)
   * Contains aggregations, counts, and other computed data
   *
   * @example
   * statistics: {
   *   manufacturerCounts: { Ford: 150, Toyota: 120, Honda: 89 },
   *   yearRange: { min: 1990, max: 2024 },
   *   totalVins: 1234
   * }
   */
  statistics?: any;
}

/**
 * Generic error response from API
 *
 * Defines the standard error format returned by the API server.
 * All API errors follow this structure for consistent error handling.
 *
 * @example
 * ```json
 * {
 *   "success": false,
 *   "error": {
 *     "code": "VALIDATION_ERROR",
 *     "message": "Invalid year range: min cannot exceed max",
 *     "details": {
 *       "field": "yearMin",
 *       "value": 2025,
 *       "constraint": "must be less than or equal to yearMax"
 *     }
 *   }
 * }
 * ```
 */
export interface ApiErrorResponse {
  /**
   * Success flag (always false for errors)
   */
  success: false;

  /**
   * Error details
   */
  error: {
    /**
     * Error code for programmatic handling
     * @example 'VALIDATION_ERROR', 'NOT_FOUND', 'UNAUTHORIZED'
     */
    code: string;

    /**
     * Human-readable error message
     * Suitable for display to users
     */
    message: string;

    /**
     * Optional additional error details
     * Contains field-specific validation info, etc.
     */
    details?: Record<string, any>;
  };
}

/**
 * Generic success response wrapper
 *
 * For non-paginated endpoints that return a single object or operation result.
 *
 * @template TData - The type of the response data
 *
 * @example
 * ```typescript
 * // Create vehicle response
 * interface CreateVehicleResult {
 *   vin: string;
 *   created: boolean;
 * }
 *
 * this.http.post<ApiSuccessResponse<CreateVehicleResult>>('/api/vehicles', vehicle)
 *   .subscribe(response => {
 *     if (response.success) {
 *       console.log('Created:', response.data.vin);
 *     }
 *   });
 * ```
 */
export interface ApiSuccessResponse<TData> {
  /**
   * Success flag (always true for successful responses)
   */
  success: true;

  /**
   * Response data
   */
  data: TData;
}

/**
 * Standard API response type (success or error)
 *
 * Union type for endpoints that may return either success or error.
 * Use type guards to narrow the type:
 *
 * @example
 * ```typescript
 * function handleResponse(response: StandardApiResponse<Vehicle>) {
 *   if (response.success) {
 *     // TypeScript knows response.data exists here
 *     console.log(response.data);
 *   } else {
 *     // TypeScript knows response.error exists here
 *     console.error(response.error.message);
 *   }
 * }
 * ```
 */
export type StandardApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;

/**
 * Type guard: Check if response is a success response
 *
 * @param response - API response to check
 * @returns True if response is a success response
 *
 * @example
 * ```typescript
 * const response = await firstValueFrom(http.get<StandardApiResponse<Vehicle>>(url));
 * if (isSuccessResponse(response)) {
 *   console.log(response.data); // TypeScript knows data exists
 * }
 * ```
 */
export function isSuccessResponse<T>(
  response: StandardApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard: Check if response is an error response
 *
 * @param response - API response to check
 * @returns True if response is an error response
 *
 * @example
 * ```typescript
 * const response = await firstValueFrom(http.get<StandardApiResponse<Vehicle>>(url));
 * if (isErrorResponse(response)) {
 *   console.error(response.error.message); // TypeScript knows error exists
 * }
 * ```
 */
export function isErrorResponse<T>(
  response: StandardApiResponse<T>
): response is ApiErrorResponse {
  return response.success === false;
}

/**
 * Empty paginated response
 *
 * Utility constant for initial state or empty results.
 *
 * @example
 * ```typescript
 * const [response, setResponse] = useState<ApiResponse<Vehicle>>(EMPTY_API_RESPONSE);
 * ```
 */
export const EMPTY_API_RESPONSE: ApiResponse<never> = {
  results: [],
  total: 0,
  page: 1,
  size: 20,
  totalPages: 0
};

/**
 * Create an empty ApiResponse with specified type
 *
 * @template T - The data type
 * @param size - Page size (default: 20)
 * @returns Empty ApiResponse
 *
 * @example
 * ```typescript
 * const initialState: ApiResponse<Vehicle> = createEmptyResponse(25);
 * ```
 */
export function createEmptyResponse<T>(size: number = 20): ApiResponse<T> {
  return {
    results: [],
    total: 0,
    page: 1,
    size,
    totalPages: 0
  };
}

/**
 * Calculate total pages from total and page size
 *
 * @param total - Total number of items
 * @param size - Page size
 * @returns Total number of pages
 *
 * @example
 * ```typescript
 * calculateTotalPages(100, 20); // Returns 5
 * calculateTotalPages(101, 20); // Returns 6
 * calculateTotalPages(0, 20);   // Returns 0
 * ```
 */
export function calculateTotalPages(total: number, size: number): number {
  if (total <= 0 || size <= 0) {
    return 0;
  }
  return Math.ceil(total / size);
}

/**
 * Check if there are more pages after the current page
 *
 * @param page - Current page (1-indexed)
 * @param totalPages - Total number of pages
 * @returns True if there are more pages
 */
export function hasNextPage(page: number, totalPages: number): boolean {
  return page < totalPages;
}

/**
 * Check if there are previous pages before the current page
 *
 * @param page - Current page (1-indexed)
 * @returns True if there are previous pages
 */
export function hasPreviousPage(page: number): boolean {
  return page > 1;
}
```

---

### Step 206.2: Update the Barrel Export

Update `src/app/framework/models/index.ts` to include the new interface:

```typescript
// src/app/framework/models/index.ts

// This barrel file exports all framework model interfaces.
// Import from '@app/framework/models' instead of individual files.

export * from './domain-config.interface';
export * from './resource-management.interface';
export * from './filter-definition.interface';
export * from './table-config.interface';
export * from './picker-config.interface';
export * from './api-response.interface';
```

---

### Step 206.3: Understand the Response Types

The API response interfaces cover three scenarios:

| Interface | Use Case | Example |
|-----------|----------|---------|
| `ApiResponse<T>` | Paginated list endpoints | `GET /vehicles?page=1&size=20` |
| `ApiSuccessResponse<T>` | Non-paginated success responses | `POST /vehicles` (create) |
| `ApiErrorResponse` | Error responses | Any failed request |

**The discriminated union pattern:**

`StandardApiResponse<T>` uses a discriminated union based on the `success` property:

```typescript
// TypeScript can narrow the type based on success
const response: StandardApiResponse<Vehicle> = await getVehicle(vin);

if (response.success) {
  // Here, TypeScript knows response is ApiSuccessResponse<Vehicle>
  console.log(response.data.manufacturer);
} else {
  // Here, TypeScript knows response is ApiErrorResponse
  console.error(response.error.code);
}
```

This pattern eliminates runtime type errors by leveraging TypeScript's type narrowing.

---

### Step 206.4: Example Usage in Services

Here's how the API response interfaces are used (preview for Phase 3):

```typescript
// Preview: API Service usage

import { ApiResponse, isSuccessResponse } from '@app/framework/models';

@Injectable({ providedIn: 'root' })
export class AutomobileApiService {
  constructor(private http: HttpClient) {}

  getVehicles(params: HttpParams): Observable<ApiResponse<Vehicle>> {
    return this.http.get<ApiResponse<Vehicle>>('/api/vehicles', { params });
  }

  // Usage in component
  loadVehicles(): void {
    this.apiService.getVehicles(params).subscribe(response => {
      // Full type safety - TypeScript knows the shape
      this.vehicles = response.results;
      this.total = response.total;
      this.currentPage = response.page;
      this.totalPages = response.totalPages;
    });
  }
}
```

---

## Verification

### 1. Check File Exists

```bash
$ ls -la src/app/framework/models/api-response.interface.ts
```

Expected output shows the file exists.

### 2. TypeScript Compilation Check

```bash
$ cd ~/projects/vvroom
$ npx tsc --noEmit src/app/framework/models/api-response.interface.ts
```

Expected: No output (no compilation errors).

### 3. Verify Exports

```bash
$ grep "^export" src/app/framework/models/api-response.interface.ts
```

Expected output:

```
export interface ApiResponse<TData> {
export interface ApiErrorResponse {
export interface ApiSuccessResponse<TData> {
export type StandardApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;
export function isSuccessResponse<T>(
export function isErrorResponse<T>(
export const EMPTY_API_RESPONSE: ApiResponse<never> = {
export function createEmptyResponse<T>(size: number = 20): ApiResponse<T> {
export function calculateTotalPages(total: number, size: number): number {
export function hasNextPage(page: number, totalPages: number): boolean {
export function hasPreviousPage(page: number): boolean {
```

### 4. Verify Barrel Export

```bash
$ grep "api-response" src/app/framework/models/index.ts
```

Expected output:

```
export * from './api-response.interface';
```

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| `Property 'results' does not exist` | Response not typed | Add generic: `http.get<ApiResponse<T>>(...)` |
| Type guard not narrowing | Using wrong comparison | Use `response.success === true` (strict) |
| `statistics` showing error | Using without check | Add optional chaining: `response.statistics?.field` |
| Page calculation wrong | Off-by-one error | Remember: API pages are 1-indexed |
| Empty response type error | Using wrong generic | Use `createEmptyResponse<YourType>()` |

---

## Key Takeaways

1. **Standardized response formats simplify development** — One interface, consistent handling everywhere
2. **Type guards enable safe type narrowing** — `isSuccessResponse()` and `isErrorResponse()` for discriminated unions
3. **Utility functions reduce boilerplate** — `calculateTotalPages()`, `hasNextPage()`, etc.

---

## Acceptance Criteria

- [ ] `src/app/framework/models/api-response.interface.ts` exists
- [ ] `ApiResponse<TData>` interface defines paginated response format
- [ ] `ApiErrorResponse` interface defines error response format
- [ ] `ApiSuccessResponse<TData>` interface defines success wrapper
- [ ] `StandardApiResponse<TData>` type union is defined
- [ ] Type guards `isSuccessResponse` and `isErrorResponse` are implemented
- [ ] Utility functions for pagination are implemented
- [ ] `EMPTY_API_RESPONSE` constant is defined
- [ ] Barrel file exports all API response types
- [ ] TypeScript compilation succeeds with no errors
- [ ] All interfaces have JSDoc documentation with examples

---

## Next Step

Proceed to `207-pagination-interface.md` to define pagination parameter interfaces.
