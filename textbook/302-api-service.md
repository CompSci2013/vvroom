# 302: API Service

**Status:** Complete
**Depends On:** 206-api-response-interface
**Blocks:** 303-request-coordinator, 310-filter-options-service, 502-api-adapter

---

## Learning Objectives

After completing this section, you will:
- Understand the role of a thin HTTP wrapper service in Angular applications
- Know how to serialize query parameters for HTTP requests
- Recognize when to handle errors at the service level vs. propagate them
- Be able to implement a domain-agnostic API service

---

## Objective

Create the `ApiService` that provides a type-safe, domain-agnostic wrapper around Angular's `HttpClient`. This service handles common patterns like query parameter serialization, error transformation, and response typing.

---

## Why

Every Angular application needs to make HTTP requests. The question is: *how do we structure these requests?*

**Option 1: Direct HttpClient Usage**

```typescript
// In component
this.http.get<Vehicle[]>('/api/vehicles', {
  params: new HttpParams()
    .set('page', '1')
    .set('size', '20')
    .set('manufacturer', 'Ford,Toyota')
}).subscribe(data => {
  // handle response
});
```

This works, but has problems:
- Verbose param building repeated everywhere
- Error handling duplicated in each call
- No consistent typing strategy
- Hard to add cross-cutting concerns (logging, auth)

**Option 2: Domain-Specific Services**

```typescript
// In VehicleService
getVehicles(filters: VehicleFilters): Observable<Vehicle[]> {
  return this.http.get<Vehicle[]>('/api/vehicles', {
    params: this.buildParams(filters)
  });
}
```

Better, but now every domain needs its own service with repeated boilerplate.

**Option 3: Thin HTTP Wrapper (Our Approach)**

```typescript
// ApiService provides thin wrapper
this.api.get<Vehicle>('/api/vehicles', { params: filters })

// Domain adapter uses it
this.api.get<Vehicle>(this.baseUrl + '/vehicles', { params: filters })
```

`ApiService` handles:
- Query parameter serialization (including arrays)
- Error transformation to consistent format
- Response typing

Domain adapters (created in Phase 5) use `ApiService` for domain-specific logic.

### Why Not More Abstraction?

You might wonder: *Why not build a full data layer with repositories, unit of work, etc.?*

The answer is **YAGNI (You Aren't Gonna Need It)**. The vvroom application:
- Reads data from a REST API
- Displays it in tables and charts
- Filters via URL parameters

A thin HTTP wrapper is all we need. Adding more abstraction would increase complexity without benefit.

### Error Handling Strategy

`ApiService` catches errors and transforms them into consistent Error objects. It does NOT:
- Show UI notifications (that's the component's job)
- Retry failed requests (that's `RequestCoordinator`'s job)
- Log to external services (that's the error handler's job)

Each layer has its responsibility.

---

## What

### Step 302.1: Create the API Service

Create the file `src/app/framework/services/api.service.ts`:

```typescript
// src/app/framework/services/api.service.ts
// VERSION 1 (Section 302) - Domain-agnostic HTTP wrapper

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiResponse, StandardApiResponse } from '../models/api-response.interface';

/**
 * Options for API requests
 *
 * Provides a simplified interface for common HTTP options.
 */
export interface ApiRequestOptions {
  /**
   * Query parameters to append to the URL
   * Arrays are serialized as comma-separated values
   */
  params?: Record<string, any>;

  /**
   * HTTP headers to include in the request
   */
  headers?: Record<string, string>;

  /**
   * Whether to include credentials (cookies) in the request
   */
  withCredentials?: boolean;

  /**
   * Response type (default: 'json')
   */
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
}

/**
 * Domain-agnostic API service for making HTTP requests
 *
 * This service provides a thin, type-safe wrapper around Angular's HttpClient.
 * It handles common patterns like query parameter serialization and error handling.
 *
 * **Design Philosophy:**
 *
 * 1. **Thin wrapper** - Doesn't add unnecessary abstraction over HttpClient
 * 2. **Type-safe** - Generic methods return typed observables
 * 3. **Domain-agnostic** - No domain-specific logic here
 * 4. **Error transformation** - Converts HTTP errors to consistent Error objects
 *
 * Domain-specific logic (like URL construction, response transformation) belongs
 * in domain adapters (created in Phase 5), not here.
 *
 * @example
 * ```typescript
 * // GET request with pagination
 * this.api.get<VehicleResult>('/api/vehicles', {
 *   params: { page: 1, size: 20, manufacturer: ['Ford', 'Toyota'] }
 * }).subscribe(response => {
 *   console.log(response.results);
 * });
 *
 * // POST request
 * this.api.post<VehicleResult>('/api/vehicles', {
 *   manufacturer: 'Ford',
 *   model: 'F-150'
 * }).subscribe(vehicle => {
 *   console.log('Created:', vehicle);
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  /**
   * Constructor - injects HttpClient
   *
   * Using `readonly` to ensure the dependency isn't reassigned.
   */
  constructor(private readonly http: HttpClient) {}

  /**
   * Execute a GET request
   *
   * Returns the standard paginated API response format.
   *
   * @template TData - The type of items in the response
   * @param endpoint - API endpoint (absolute or relative URL)
   * @param options - Request options (params, headers, etc.)
   * @returns Observable of paginated response
   *
   * @example
   * ```typescript
   * this.api.get<VehicleResult>('/api/vehicles', {
   *   params: { page: 1, manufacturer: 'Ford' }
   * }).subscribe(response => {
   *   console.log(`Found ${response.total} vehicles`);
   *   console.log('Results:', response.results);
   * });
   * ```
   */
  get<TData>(
    endpoint: string,
    options?: ApiRequestOptions
  ): Observable<ApiResponse<TData>> {
    const httpParams = this.buildHttpParams(options?.params);

    return this.http
      .get<ApiResponse<TData>>(endpoint, {
        params: httpParams,
        headers: options?.headers,
        withCredentials: options?.withCredentials
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * Execute a POST request
   *
   * @template TData - The type of response data
   * @param endpoint - API endpoint (absolute or relative URL)
   * @param body - Request body
   * @param options - Request options (params, headers, etc.)
   * @returns Observable of response data
   */
  post<TData>(
    endpoint: string,
    body: any,
    options?: ApiRequestOptions
  ): Observable<TData> {
    const httpParams = this.buildHttpParams(options?.params);

    return this.http
      .post<TData>(endpoint, body, {
        params: httpParams,
        headers: options?.headers,
        withCredentials: options?.withCredentials
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * Execute a PUT request
   *
   * @template TData - The type of response data
   * @param endpoint - API endpoint (absolute or relative URL)
   * @param body - Request body
   * @param options - Request options (params, headers, etc.)
   * @returns Observable of response data
   */
  put<TData>(
    endpoint: string,
    body: any,
    options?: ApiRequestOptions
  ): Observable<TData> {
    const httpParams = this.buildHttpParams(options?.params);

    return this.http
      .put<TData>(endpoint, body, {
        params: httpParams,
        headers: options?.headers,
        withCredentials: options?.withCredentials
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * Execute a PATCH request
   *
   * @template TData - The type of response data
   * @param endpoint - API endpoint (absolute or relative URL)
   * @param body - Request body
   * @param options - Request options (params, headers, etc.)
   * @returns Observable of response data
   */
  patch<TData>(
    endpoint: string,
    body: any,
    options?: ApiRequestOptions
  ): Observable<TData> {
    const httpParams = this.buildHttpParams(options?.params);

    return this.http
      .patch<TData>(endpoint, body, {
        params: httpParams,
        headers: options?.headers,
        withCredentials: options?.withCredentials
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * Execute a DELETE request
   *
   * @template TData - The type of response data
   * @param endpoint - API endpoint (absolute or relative URL)
   * @param options - Request options (params, headers, etc.)
   * @returns Observable of response data
   */
  delete<TData>(
    endpoint: string,
    options?: ApiRequestOptions
  ): Observable<TData> {
    const httpParams = this.buildHttpParams(options?.params);

    return this.http
      .delete<TData>(endpoint, {
        params: httpParams,
        headers: options?.headers,
        withCredentials: options?.withCredentials
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * Execute a GET request that returns a standard success/error response
   *
   * Some APIs wrap responses in a success/error envelope:
   * ```json
   * { "success": true, "data": { ... } }
   * { "success": false, "error": { "message": "..." } }
   * ```
   *
   * This method unwraps successful responses and throws on error.
   *
   * @template TData - The type of data in the response
   * @param endpoint - API endpoint (absolute or relative URL)
   * @param options - Request options (params, headers, etc.)
   * @returns Observable of response data (unwrapped from success envelope)
   */
  getStandard<TData>(
    endpoint: string,
    options?: ApiRequestOptions
  ): Observable<TData> {
    const httpParams = this.buildHttpParams(options?.params);

    return this.http
      .get<StandardApiResponse<TData>>(endpoint, {
        params: httpParams,
        headers: options?.headers,
        withCredentials: options?.withCredentials
      })
      .pipe(
        map(response => {
          if (response.success) {
            return response.data;
          } else {
            throw new Error(response.error.message);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Build HttpParams from a plain object
   *
   * Handles:
   * - Null/undefined value filtering (skipped)
   * - Array serialization (comma-separated)
   * - Boolean/number to string conversion
   *
   * @param params - Plain object of query parameters
   * @returns HttpParams instance
   *
   * @example
   * ```typescript
   * // Input
   * { page: 1, manufacturer: ['Ford', 'Toyota'], active: true, empty: null }
   *
   * // Output HttpParams
   * page=1&manufacturer=Ford,Toyota&active=true
   * // Note: 'empty' is skipped because it's null
   * ```
   */
  private buildHttpParams(params?: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();

    if (!params) {
      return httpParams;
    }

    Object.keys(params).forEach(key => {
      const value = params[key];

      // Skip null/undefined values
      if (value === null || value === undefined) {
        return;
      }

      // Handle arrays (comma-separated)
      if (Array.isArray(value)) {
        httpParams = httpParams.set(key, value.join(','));
        return;
      }

      // Convert to string
      httpParams = httpParams.set(key, String(value));
    });

    return httpParams;
  }

  /**
   * Handle HTTP errors
   *
   * Transforms HttpErrorResponse into a consistent Error format.
   * Logs the error for debugging, then re-throws for upstream handling.
   *
   * @param error - HTTP error response
   * @returns Observable that throws a formatted error
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Network error: ${error.error.message}`;
    } else {
      // Backend error
      if (error.error?.error?.message) {
        // Structured error response: { error: { message: "..." } }
        errorMessage = error.error.error.message;
      } else if (error.error?.message) {
        // Simple error response: { message: "..." }
        errorMessage = error.error.message;
      } else if (error.message) {
        // HttpErrorResponse message
        errorMessage = error.message;
      } else {
        // Fallback to status
        errorMessage = `Server error: ${error.status} ${error.statusText}`;
      }
    }

    console.error('API Error:', errorMessage, error);

    return throwError(() => new Error(errorMessage));
  }
}
```

---

### Step 302.2: Update the Barrel File

Update `src/app/framework/services/index.ts` to export the new service:

```typescript
// src/app/framework/services/index.ts
// VERSION 2 (Section 302) - Added ApiService

export * from './url-state.service';
export * from './api.service';
```

---

### Step 302.3: Ensure HttpClientModule is Imported

The `ApiService` depends on `HttpClient`, which requires `HttpClientModule` to be imported in the app module.

Verify `src/app/app.module.ts` includes:

```typescript
// src/app/app.module.ts
// Ensure HttpClientModule is imported

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';  // <-- Required

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule  // <-- Must be here
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

If `HttpClientModule` is missing, add it as shown.

---

## Verification

### 1. Check File Exists

```bash
$ ls -la src/app/framework/services/
```

Expected output includes:

```
-rw-r--r-- 1 user user 7234 Feb  9 12:00 api.service.ts
```

### 2. TypeScript Compilation Check

```bash
$ cd ~/projects/vvroom
$ npx tsc --noEmit src/app/framework/services/api.service.ts
```

Expected: No output (no compilation errors).

### 3. Build the Application

```bash
$ ng build
```

Expected: Build succeeds with no errors.

### 4. Verify in Browser (Optional)

If you have a working API endpoint, you can test:

```typescript
// Temporary test in any component
constructor(private api: ApiService) {
  this.api.get<any>('http://generic-prime.minilab/api/specs/v1/automobiles', {
    params: { page: 1, size: 5 }
  }).subscribe({
    next: response => console.log('API Response:', response),
    error: err => console.error('API Error:', err)
  });
}
```

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| `NullInjectorError: No provider for HttpClient` | HttpClientModule not imported | Add HttpClientModule to app.module.ts imports |
| `Cannot find module '../models/api-response.interface'` | Interface file missing | Create it in Section 206 first |
| CORS errors in browser | API doesn't allow cross-origin | Configure API server or use proxy |
| `Type 'Observable<Object>' is not assignable to...` | Generic type mismatch | Ensure response type matches expected type |
| Arrays serialized as `[object Object]` | Nested objects in params | Flatten objects before passing to params |

---

## Key Takeaways

1. **Thin wrappers reduce boilerplate** — ApiService handles serialization and errors so each call site doesn't have to
2. **Arrays serialize as comma-separated values** — This matches common REST API conventions
3. **Error handling transforms, doesn't swallow** — Errors are logged and re-thrown for upstream handling

---

## Acceptance Criteria

- [ ] `src/app/framework/services/api.service.ts` exists with complete implementation
- [ ] Barrel file exports the service
- [ ] Service is `@Injectable({ providedIn: 'root' })`
- [ ] `get<T>()` method returns typed Observable
- [ ] `post<T>()`, `put<T>()`, `patch<T>()`, `delete<T>()` methods implemented
- [ ] `getStandard<T>()` unwraps success/error envelope responses
- [ ] `buildHttpParams()` correctly serializes arrays as comma-separated
- [ ] `handleError()` transforms errors consistently
- [ ] HttpClientModule is imported in app.module.ts
- [ ] TypeScript compilation succeeds
- [ ] JSDoc comments document all public methods

---

## Next Step

Proceed to `303-request-coordinator.md` to create the service that coordinates API requests with caching and deduplication.
