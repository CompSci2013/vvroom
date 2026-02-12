# 207: Pagination Interface

**Status:** Planning
**Depends On:** 206-api-response-interface
**Blocks:** 302-api-service, 803-basic-results-table

---

## Learning Objectives

After completing this section, you will:
- Understand the difference between pagination parameters (request) and metadata (response)
- Know how to combine pagination with sorting for API requests
- Recognize the relationship between URL state and pagination

---

## Objective

Create the pagination interfaces that define how pagination and sorting parameters are structured for API requests and responses. These interfaces complement the `ApiResponse` interface by defining the input side of paginated queries.

---

## Why

Pagination in vvroom follows the URL-First architecture. When a user navigates to:

```
/discover?manufacturer=Ford&page=2&size=50&sortBy=year&sortOrder=desc
```

The application must:
1. Parse `page=2`, `size=50` into `PaginationParams`
2. Parse `sortBy=year`, `sortOrder=desc` into `SortParams`
3. Send these to the API
4. Receive `PaginationMetadata` in the response

The interfaces in this document define these structures, ensuring consistency between URL state, API requests, and response handling.

**Request flow:**

```
┌─────────────────────────────────────────────────────────────────┐
│  URL: ?page=2&size=50&sortBy=year&sortOrder=desc                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Parse into typed objects:                                       │
│  PaginationParams { page: 2, size: 50 }                          │
│  SortParams { sortBy: 'year', sortOrder: 'desc' }                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  API Request: GET /vehicles?page=2&size=50&sort=year:desc        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Response includes PaginationMetadata:                           │
│  { page: 2, size: 50, total: 1234, totalPages: 25, hasMore: true }│
└─────────────────────────────────────────────────────────────────┘
```

---

## What

### Step 207.1: Create the Pagination Interface

Create the file `src/app/framework/models/pagination.interface.ts`:

```typescript
// src/app/framework/models/pagination.interface.ts
// VERSION 1 (Section 207) - Pagination and sorting interfaces

/**
 * Pagination Interfaces
 *
 * These interfaces define pagination and sorting parameters for API requests
 * and responses. They complement the ApiResponse interface by defining
 * the input/output structures for paginated queries.
 */

/**
 * Pagination parameters for API requests
 *
 * Represents the pagination portion of an API request.
 * These values are derived from URL query parameters.
 *
 * @example
 * ```typescript
 * // From URL: ?page=2&size=50
 * const params: PaginationParams = {
 *   page: 2,
 *   size: 50
 * };
 *
 * // Convert to HTTP params
 * const httpParams = new HttpParams()
 *   .set('page', params.page.toString())
 *   .set('size', params.size.toString());
 * ```
 */
export interface PaginationParams {
  /**
   * Page number (1-indexed)
   * Page 1 is the first page of results
   */
  page: number;

  /**
   * Number of items per page
   * Common values: 10, 20, 50, 100
   */
  size: number;
}

/**
 * Pagination metadata from API responses
 *
 * Contains complete pagination information returned by the API.
 * Use this to display pagination controls and navigation.
 *
 * @example
 * ```typescript
 * // Display pagination info
 * const metadata: PaginationMetadata = response.pagination;
 * console.log(`Page ${metadata.page} of ${metadata.totalPages}`);
 * console.log(`Showing ${metadata.size} of ${metadata.total} results`);
 *
 * if (metadata.hasMore) {
 *   showNextButton();
 * }
 * ```
 */
export interface PaginationMetadata {
  /**
   * Current page number (1-indexed)
   */
  page: number;

  /**
   * Number of items per page
   */
  size: number;

  /**
   * Total number of items across all pages
   */
  total: number;

  /**
   * Total number of pages
   * Computed as: Math.ceil(total / size)
   */
  totalPages: number;

  /**
   * Whether there are more pages after current page
   * Equivalent to: page < totalPages
   */
  hasMore: boolean;
}

/**
 * Sorting parameters for API requests
 *
 * Represents the sorting portion of an API request.
 * These values are derived from URL query parameters.
 *
 * @example
 * ```typescript
 * // From URL: ?sortBy=year&sortOrder=desc
 * const params: SortParams = {
 *   sortBy: 'year',
 *   sortOrder: 'desc'
 * };
 *
 * // Convert to HTTP params (API-specific format)
 * const sortParam = `${params.sortBy}:${params.sortOrder}`;
 * // Results in: sort=year:desc
 * ```
 */
export interface SortParams {
  /**
   * Field to sort by
   * Must match a field name in the data model
   */
  sortBy?: string;

  /**
   * Sort direction
   * - 'asc': Ascending (A-Z, 1-9, oldest first)
   * - 'desc': Descending (Z-A, 9-1, newest first)
   */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Combined pagination and sort parameters
 *
 * Convenience interface for endpoints that support both pagination and sorting.
 *
 * @example
 * ```typescript
 * // Build from URL state
 * const params: PaginatedSortParams = {
 *   page: 1,
 *   size: 20,
 *   sortBy: 'manufacturer',
 *   sortOrder: 'asc'
 * };
 * ```
 */
export interface PaginatedSortParams extends PaginationParams, SortParams {}

/**
 * Default pagination parameters
 */
export const DEFAULT_PAGINATION: PaginationParams = {
  page: 1,
  size: 20
};

/**
 * Default sort parameters (no sorting)
 */
export const DEFAULT_SORT: SortParams = {
  sortBy: undefined,
  sortOrder: undefined
};

/**
 * Common page size options
 */
export const PAGE_SIZE_OPTIONS: number[] = [10, 20, 50, 100];

/**
 * Create pagination metadata from response data
 *
 * Utility function to construct PaginationMetadata from API response.
 *
 * @param page - Current page number
 * @param size - Items per page
 * @param total - Total items
 * @returns Complete PaginationMetadata object
 *
 * @example
 * ```typescript
 * const response = await fetchData();
 * const metadata = createPaginationMetadata(
 *   response.page,
 *   response.size,
 *   response.total
 * );
 * ```
 */
export function createPaginationMetadata(
  page: number,
  size: number,
  total: number
): PaginationMetadata {
  const totalPages = size > 0 ? Math.ceil(total / size) : 0;
  return {
    page,
    size,
    total,
    totalPages,
    hasMore: page < totalPages
  };
}

/**
 * Parse pagination from URL query parameters
 *
 * @param params - URL query parameters
 * @param defaults - Default values to use if not in URL
 * @returns Parsed PaginationParams
 *
 * @example
 * ```typescript
 * const urlParams = new URLSearchParams(location.search);
 * const pagination = parsePaginationFromUrl({
 *   page: urlParams.get('page'),
 *   size: urlParams.get('size')
 * });
 * ```
 */
export function parsePaginationFromUrl(
  params: { page?: string | null; size?: string | null },
  defaults: PaginationParams = DEFAULT_PAGINATION
): PaginationParams {
  return {
    page: params.page ? parseInt(params.page, 10) : defaults.page,
    size: params.size ? parseInt(params.size, 10) : defaults.size
  };
}

/**
 * Parse sort from URL query parameters
 *
 * @param params - URL query parameters
 * @returns Parsed SortParams
 *
 * @example
 * ```typescript
 * const urlParams = new URLSearchParams(location.search);
 * const sort = parseSortFromUrl({
 *   sortBy: urlParams.get('sortBy'),
 *   sortOrder: urlParams.get('sortOrder')
 * });
 * ```
 */
export function parseSortFromUrl(
  params: { sortBy?: string | null; sortOrder?: string | null }
): SortParams {
  const sortOrder = params.sortOrder?.toLowerCase();
  return {
    sortBy: params.sortBy || undefined,
    sortOrder: sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : undefined
  };
}

/**
 * Convert pagination params to URL query parameters
 *
 * @param pagination - Pagination parameters
 * @returns Object with string values for URL
 *
 * @example
 * ```typescript
 * const urlParams = paginationToUrlParams({ page: 2, size: 50 });
 * // { page: '2', size: '50' }
 * ```
 */
export function paginationToUrlParams(
  pagination: PaginationParams
): { page: string; size: string } {
  return {
    page: pagination.page.toString(),
    size: pagination.size.toString()
  };
}

/**
 * Convert sort params to URL query parameters
 *
 * @param sort - Sort parameters
 * @returns Object with string values for URL (empty object if no sort)
 *
 * @example
 * ```typescript
 * const urlParams = sortToUrlParams({ sortBy: 'year', sortOrder: 'desc' });
 * // { sortBy: 'year', sortOrder: 'desc' }
 *
 * const noSort = sortToUrlParams({});
 * // {}
 * ```
 */
export function sortToUrlParams(
  sort: SortParams
): { sortBy?: string; sortOrder?: string } {
  const result: { sortBy?: string; sortOrder?: string } = {};

  if (sort.sortBy) {
    result.sortBy = sort.sortBy;
  }

  if (sort.sortOrder) {
    result.sortOrder = sort.sortOrder;
  }

  return result;
}

/**
 * Calculate the range of items shown on current page
 *
 * @param page - Current page (1-indexed)
 * @param size - Items per page
 * @param total - Total items
 * @returns Object with start and end indices (1-indexed, inclusive)
 *
 * @example
 * ```typescript
 * const range = getPageRange(2, 20, 45);
 * // { start: 21, end: 40 }
 *
 * const lastPage = getPageRange(3, 20, 45);
 * // { start: 41, end: 45 }
 * ```
 */
export function getPageRange(
  page: number,
  size: number,
  total: number
): { start: number; end: number } {
  if (total === 0) {
    return { start: 0, end: 0 };
  }

  const start = (page - 1) * size + 1;
  const end = Math.min(page * size, total);

  return { start, end };
}

/**
 * Format pagination for display
 *
 * @param page - Current page
 * @param size - Items per page
 * @param total - Total items
 * @returns Formatted string like "Showing 21-40 of 1,234 results"
 *
 * @example
 * ```typescript
 * const display = formatPaginationDisplay(2, 20, 1234);
 * // "Showing 21-40 of 1,234 results"
 * ```
 */
export function formatPaginationDisplay(
  page: number,
  size: number,
  total: number
): string {
  if (total === 0) {
    return 'No results';
  }

  const { start, end } = getPageRange(page, size, total);
  const formattedTotal = total.toLocaleString();

  return `Showing ${start}-${end} of ${formattedTotal} results`;
}
```

---

### Step 207.2: Update the Barrel Export

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
export * from './pagination.interface';
```

---

### Step 207.3: Understand the Pagination Flow

The pagination interfaces connect URL state to API requests:

| Layer | Interface | Example |
|-------|-----------|---------|
| **URL** | String params | `?page=2&size=50&sortBy=year` |
| **Parse** | `PaginationParams`, `SortParams` | `{ page: 2, size: 50 }`, `{ sortBy: 'year' }` |
| **API Request** | Combined params | `GET /vehicles?page=2&size=50&sort=year` |
| **API Response** | `PaginationMetadata` in `ApiResponse` | `{ page: 2, size: 50, total: 1234, ... }` |

The utility functions handle conversions between these layers.

---

### Step 207.4: Example Usage

Here's how pagination interfaces are used throughout the application:

```typescript
// In a component
import {
  PaginationParams,
  SortParams,
  parsePaginationFromUrl,
  parseSortFromUrl,
  formatPaginationDisplay
} from '@app/framework/models';

@Component({...})
export class DiscoverComponent implements OnInit {
  pagination: PaginationMetadata;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      // Parse pagination from URL
      const pagination = parsePaginationFromUrl({
        page: params['page'],
        size: params['size']
      });

      // Parse sort from URL
      const sort = parseSortFromUrl({
        sortBy: params['sortBy'],
        sortOrder: params['sortOrder']
      });

      // Fetch data with these params
      this.loadData(pagination, sort);
    });
  }

  get paginationDisplay(): string {
    return formatPaginationDisplay(
      this.pagination.page,
      this.pagination.size,
      this.pagination.total
    );
  }
}
```

---

## Verification

### 1. Check File Exists

```bash
$ ls -la src/app/framework/models/pagination.interface.ts
```

Expected output shows the file exists.

### 2. TypeScript Compilation Check

```bash
$ cd ~/projects/vvroom
$ npx tsc --noEmit src/app/framework/models/pagination.interface.ts
```

Expected: No output (no compilation errors).

### 3. Verify Exports

```bash
$ grep "^export" src/app/framework/models/pagination.interface.ts
```

Expected output:

```
export interface PaginationParams {
export interface PaginationMetadata {
export interface SortParams {
export interface PaginatedSortParams extends PaginationParams, SortParams {}
export const DEFAULT_PAGINATION: PaginationParams = {
export const DEFAULT_SORT: SortParams = {
export const PAGE_SIZE_OPTIONS: number[] = [10, 20, 50, 100];
export function createPaginationMetadata(
export function parsePaginationFromUrl(
export function parseSortFromUrl(
export function paginationToUrlParams(
export function sortToUrlParams(
export function getPageRange(
export function formatPaginationDisplay(
```

### 4. Verify Barrel Export

```bash
$ grep "pagination" src/app/framework/models/index.ts
```

Expected output:

```
export * from './pagination.interface';
```

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| Page showing 0 results | Page is 0-indexed in code but 1-indexed in API | Use 1-indexed pages consistently |
| Sort not applied | `sortBy` is undefined | Check URL param parsing |
| Pagination display wrong | Off-by-one in range calculation | Use `getPageRange` helper |
| `hasMore` always false | Total not set correctly | Verify API returns total count |
| NaN in pagination | String not parsed | Use `parseInt()` with radix 10 |

---

## Key Takeaways

1. **Separate input params from output metadata** — `PaginationParams` for requests, `PaginationMetadata` for responses
2. **Utility functions handle URL <-> object conversion** — Consistent parsing and formatting
3. **1-indexed pages match user expectations** — Page 1 is the first page, not page 0

---

## Acceptance Criteria

- [ ] `src/app/framework/models/pagination.interface.ts` exists
- [ ] `PaginationParams` interface defines page and size
- [ ] `PaginationMetadata` interface includes hasMore boolean
- [ ] `SortParams` interface defines sortBy and sortOrder
- [ ] `PaginatedSortParams` combines both interfaces
- [ ] Default constants `DEFAULT_PAGINATION`, `DEFAULT_SORT` are defined
- [ ] `PAGE_SIZE_OPTIONS` constant provides common page sizes
- [ ] Parsing functions handle null/undefined gracefully
- [ ] `formatPaginationDisplay` produces user-friendly output
- [ ] Barrel file exports all pagination types
- [ ] TypeScript compilation succeeds with no errors

---

## Next Step

Proceed to `208-popout-interface.md` to define the pop-out window communication interfaces.
