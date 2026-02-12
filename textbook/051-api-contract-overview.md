# 051: API Contract Overview

**Status:** Complete
**Depends On:** None
**Blocks:** 052, 053, all implementation phases

---

## Objective

Document the API contract that the vvroom application will consume. This includes base URL configuration, authentication requirements, pagination conventions, error formats, and general request/response patterns.

---

## Why

Before writing any code — models, services, or components — you must understand the shape of the data you're working with. The API contract is an **input** to the entire system:

- **Models** are defined by what the API returns
- **Adapters** translate between API responses and models
- **Services** call endpoints defined by the API
- **Components** display data shaped by the API

Without this document, developers would be guessing at data shapes, leading to runtime errors and constant refactoring.

---

## API Overview

### Base URL

| Environment | Base URL |
|-------------|----------|
| Development | `http://generic-prime.minilab/api/specs/v1` |
| Production | `http://generic-prime.minilab/api/specs/v1` |

The API is accessed via Traefik ingress on the Kubernetes cluster. The hostname `generic-prime.minilab` resolves to the cluster ingress controller.

### Authentication

**None required.** The API is accessible without authentication for this internal application.

### Content Type

All requests and responses use JSON:

```
Content-Type: application/json
Accept: application/json
```

---

## Pagination Convention

All list endpoints support pagination with these query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (1-indexed) |
| `size` | number | 20 | Items per page |

### Paginated Response Shape

```typescript
{
  "results": [...],      // Array of items for current page
  "total": 1234,         // Total items across all pages
  "page": 1,             // Current page number
  "size": 20,            // Items per page
  "totalPages": 62       // Total number of pages
}
```

---

## Sorting Convention

Sorting is controlled by these query parameters:

| Parameter | Type | Values | Description |
|-----------|------|--------|-------------|
| `sortBy` | string | field name | Field to sort by |
| `sortOrder` | string | `asc`, `desc` | Sort direction |

Example: `?sortBy=manufacturer&sortOrder=asc`

---

## Error Response Format

When an error occurs, the API returns:

```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",     // Error type identifier
    "message": "Invalid year range", // Human-readable message
    "details": {                     // Optional additional context
      "field": "yearMin",
      "reason": "must be less than yearMax"
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `NOT_FOUND` | 404 | Resource not found |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Highlight Parameters (h_* prefix)

The API supports "highlight" parameters for segmented statistics. These are query parameters with an `h_` prefix that tell the backend to compute statistics with a highlighted subset.

**Purpose:** Enable stacked bar charts showing "highlighted vs total" data.

**Example Request:**
```
GET /vehicles/details?manufacturer=Toyota&h_yearMin=2020&h_yearMax=2024
```

**Effect on Response:**
Statistics include `{total, highlighted}` objects instead of simple counts:

```json
{
  "statistics": {
    "byManufacturer": {
      "Toyota": { "total": 665, "highlighted": 234 },
      "Honda": { "total": 849, "highlighted": 0 }
    }
  }
}
```

Vehicles from Toyota are highlighted (234 of 665 match the year range 2020-2024), while Honda vehicles are not highlighted (0 of 849 match).

---

## Request/Response Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend Request                             │
│  GET /vehicles/details?manufacturer=Toyota&page=1&size=20           │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Backend Processing                           │
│  1. Parse query parameters                                           │
│  2. Build Elasticsearch query                                        │
│  3. Execute search                                                   │
│  4. Compute statistics aggregations                                  │
│  5. Format response                                                  │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API Response                                 │
│  {                                                                   │
│    "results": [{ vehicle_id, manufacturer, model, year, ... }],     │
│    "total": 234,                                                     │
│    "page": 1,                                                        │
│    "size": 20,                                                       │
│    "totalPages": 12,                                                 │
│    "statistics": { byManufacturer, byBodyClass, byYearRange, ... }  │
│  }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Files

### 1. API Response Interface (Framework-Level)

This interface is **domain-agnostic** and lives in the framework:

**File:** `src/app/framework/models/api-response.interface.ts`

```typescript
/**
 * Generic API response interface for paginated endpoints
 * @template TData - The type of data items in the results array
 */
export interface ApiResponse<TData> {
  /** Array of result items for the current page */
  results: TData[];

  /** Total number of items across all pages */
  total: number;

  /** Current page number (1-indexed) */
  page: number;

  /** Number of items per page */
  size: number;

  /** Total number of pages */
  totalPages: number;

  /** Optional statistics data (domain-specific) */
  statistics?: any;
}

/**
 * Generic error response from API
 */
export interface ApiErrorResponse {
  /** Success flag (always false for errors) */
  success: false;

  /** Error details */
  error: {
    /** Error code (e.g., 'VALIDATION_ERROR', 'NOT_FOUND') */
    code: string;

    /** Human-readable error message */
    message: string;

    /** Optional additional error details */
    details?: Record<string, any>;
  };
}

/**
 * Generic success response wrapper
 */
export interface ApiSuccessResponse<TData> {
  /** Success flag (always true for successful responses) */
  success: true;

  /** Response data */
  data: TData;
}

/**
 * Standard API response type (success or error)
 */
export type StandardApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;
```

### 2. Environment Configuration

**File:** `src/environments/environment.ts` (development)

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://generic-prime.minilab/api/specs/v1',
  includeTestIds: true
};
```

**File:** `src/environments/environment.prod.ts` (production)

```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'http://generic-prime.minilab/api/specs/v1',
  includeTestIds: false
};
```

---

## Verification

After implementing this section:

1. **Check file exists:**
   ```bash
   ls -la src/app/framework/models/api-response.interface.ts
   ```

2. **Check environment files:**
   ```bash
   grep apiBaseUrl src/environments/environment*.ts
   ```

3. **Verify TypeScript compiles:**
   ```bash
   npx tsc --noEmit
   ```

---

## Acceptance Criteria

- [x] `ApiResponse<TData>` interface created in `src/app/framework/models/`
- [x] `ApiErrorResponse` interface created
- [x] `ApiSuccessResponse<TData>` interface created
- [x] `StandardApiResponse<TData>` type alias created
- [x] `environment.ts` includes `apiBaseUrl` property
- [x] `environment.prod.ts` includes `apiBaseUrl` property

---

## Next Step

Proceed to `052-automobile-endpoints.md` for detailed documentation of each automobile-specific endpoint with request/response examples.
