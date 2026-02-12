# 313: HTTP Error Interceptor

**Status:** Complete
**Depends On:** 302-api-service, 312-error-notification-service
**Blocks:** 314-global-error-handler

---

## Learning Objectives

After completing this section, you will:
- Understand how Angular HTTP interceptors work
- Know how to implement automatic retry for transient errors
- Recognize the importance of consistent error formatting
- Be able to create user-friendly error messages from HTTP status codes

---

## Objective

Create the `HttpErrorInterceptor` that provides global error handling for all HTTP requests. This interceptor automatically retries transient errors, formats error responses consistently, and logs errors for debugging.

---

## Why

Every HTTP request can fail. Without centralized handling, each component must:
- Catch errors in its subscription
- Determine the error type
- Format user-friendly messages
- Log for debugging
- Decide whether to retry

This leads to duplicated logic and inconsistent error handling.

### The Interceptor Pattern

Angular's HTTP interceptor pattern allows you to intercept and modify HTTP requests and responses globally. For error handling:

```
Request → Interceptor → HTTP → Server Response
                              ↓
                         Error? → Retry? → Format → Component
```

### Automatic Retry for Transient Errors

Some errors are **transient** — they succeed on retry:

| Status Code | Meaning | Retryable? |
|-------------|---------|------------|
| 429 | Too Many Requests | Yes — wait and retry |
| 500 | Internal Server Error | Maybe — server might recover |
| 502 | Bad Gateway | Yes — proxy might recover |
| 503 | Service Unavailable | Yes — server restarting |
| 504 | Gateway Timeout | Yes — might just be slow |
| 400 | Bad Request | No — client error won't change |
| 401 | Unauthorized | No — need authentication |
| 404 | Not Found | No — resource doesn't exist |

The interceptor automatically retries for status codes 429, 500, 502, 503, 504 up to 2 times before giving up.

### Consistent Error Formatting

The interceptor transforms Angular's `HttpErrorResponse` into a consistent format:

```typescript
// Input: HttpErrorResponse
{
  status: 500,
  statusText: 'Internal Server Error',
  error: { message: 'Database connection failed' },
  url: '/api/vehicles'
}

// Output: Formatted error object
{
  code: 'INTERNAL_SERVER_ERROR',
  message: 'Internal server error. Please try again later.',
  status: 500,
  statusText: 'Internal Server Error',
  url: '/api/vehicles',
  timestamp: '2024-02-09T12:00:00.000Z'
}
```

This consistent format makes error handling predictable for:
- The ErrorNotificationService
- Component error handlers
- Error logging systems

### Error Code Mapping

Each HTTP status maps to a semantic error code:

| Status | Error Code |
|--------|------------|
| 400 | `BAD_REQUEST` |
| 401 | `UNAUTHORIZED` |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND` |
| 409 | `CONFLICT` |
| 422 | `VALIDATION_ERROR` |
| 429 | `RATE_LIMIT_EXCEEDED` |
| 500 | `INTERNAL_SERVER_ERROR` |
| 502 | `BAD_GATEWAY` |
| 503 | `SERVICE_UNAVAILABLE` |
| 504 | `GATEWAY_TIMEOUT` |

---

## What

### Step 313.1: Create the HTTP Error Interceptor

Create the file `src/app/framework/services/http-error.interceptor.ts`:

```typescript
// src/app/framework/services/http-error.interceptor.ts
// VERSION 1 (Section 313) - HTTP error interceptor

import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

/**
 * Configuration for error interceptor retry behavior
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** HTTP status codes that should trigger retry */
  retryableStatusCodes: number[];
}

/**
 * Default retry configuration
 *
 * Retries transient server errors (5xx) and rate limiting (429).
 * Does not retry client errors (4xx) as they won't succeed without changes.
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  retryableStatusCodes: [429, 500, 502, 503, 504]
};

/**
 * Map HTTP status code to semantic error code
 *
 * @param status - HTTP status code
 * @returns Semantic error code string
 */
function getErrorCode(status: number): string {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'VALIDATION_ERROR';
    case 429:
      return 'RATE_LIMIT_EXCEEDED';
    case 500:
      return 'INTERNAL_SERVER_ERROR';
    case 502:
      return 'BAD_GATEWAY';
    case 503:
      return 'SERVICE_UNAVAILABLE';
    case 504:
      return 'GATEWAY_TIMEOUT';
    default:
      return status >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR';
  }
}

/**
 * Get user-friendly error message from HTTP error
 *
 * Attempts to extract message from error response body,
 * falls back to standard messages based on status code.
 *
 * @param error - HTTP error response
 * @returns User-friendly error message
 */
function getErrorMessage(error: HttpErrorResponse): string {
  // Try to get message from nested error object
  if (error.error?.error?.message) {
    return error.error.error.message;
  }

  // Try to get message from error object
  if (error.error?.message) {
    return error.error.message;
  }

  // Fall back to status-based messages
  switch (error.status) {
    case 0:
      return 'Unable to connect to server. Please check your network connection.';
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Authentication required. Please log in.';
    case 403:
      return 'Access denied. You do not have permission to access this resource.';
    case 404:
      return 'Resource not found.';
    case 409:
      return 'Conflict. The resource already exists or is in an invalid state.';
    case 422:
      return 'Validation failed. Please check your input.';
    case 429:
      return 'Too many requests. Please wait and try again.';
    case 500:
      return 'Internal server error. Please try again later.';
    case 502:
      return 'Bad gateway. The server is temporarily unavailable.';
    case 503:
      return 'Service unavailable. Please try again later.';
    case 504:
      return 'Gateway timeout. The server took too long to respond.';
    default:
      return error.message || `HTTP error: ${error.status} ${error.statusText}`;
  }
}

/**
 * Log error details for debugging
 *
 * @param error - HTTP error response
 * @param request - Original HTTP request
 * @param errorCode - Formatted error code
 * @param errorMessage - Formatted error message
 */
function logError(
  error: HttpErrorResponse,
  request: HttpRequest<unknown>,
  errorCode: string,
  errorMessage: string
): void {
  const logDetails = {
    code: errorCode,
    message: errorMessage,
    status: error.status,
    statusText: error.statusText,
    url: request.url,
    method: request.method,
    timestamp: new Date().toISOString()
  };

  console.error('HTTP Error:', logDetails);

  // Log response body for additional context
  if (error.error) {
    console.error('Error details:', error.error);
  }
}

/**
 * Handle HTTP error and format response
 *
 * @param error - HTTP error response
 * @param request - Original HTTP request
 * @returns Observable that throws formatted error
 */
function handleError(error: HttpErrorResponse, request: HttpRequest<unknown>) {
  let errorMessage: string;
  let errorCode: string;

  // Check if error is client-side (ErrorEvent) or server-side
  if (error.error instanceof ErrorEvent) {
    // Client-side error (network issue, etc.)
    errorCode = 'CLIENT_ERROR';
    errorMessage = `Network error: ${error.error.message}`;
  } else {
    // Server-side error
    errorCode = getErrorCode(error.status);
    errorMessage = getErrorMessage(error);
  }

  // Log for debugging
  logError(error, request, errorCode, errorMessage);

  // Return formatted error object
  return throwError(() => ({
    code: errorCode,
    message: errorMessage,
    status: error.status,
    statusText: error.statusText,
    url: request.url,
    timestamp: new Date().toISOString()
  }));
}

/**
 * HTTP error interceptor
 *
 * Handles global error processing for all HTTP requests:
 * - Automatic retry for transient errors (5xx, 429)
 * - Consistent error formatting
 * - Error logging
 *
 * **Retry Behavior:**
 *
 * The interceptor retries failed requests up to 2 times for specific
 * status codes (429, 500, 502, 503, 504). This handles transient
 * failures that often succeed on retry.
 *
 * **Error Format:**
 *
 * All errors are transformed to a consistent format:
 * ```typescript
 * {
 *   code: string;      // Semantic error code (e.g., 'UNAUTHORIZED')
 *   message: string;   // User-friendly message
 *   status: number;    // HTTP status code
 *   statusText: string;
 *   url: string;
 *   timestamp: string;
 * }
 * ```
 *
 * @example
 * ```typescript
 * // In app.module.ts
 * providers: [
 *   {
 *     provide: HTTP_INTERCEPTORS,
 *     useClass: HttpErrorInterceptor,
 *     multi: true
 *   }
 * ]
 * ```
 */
@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  /**
   * Intercept HTTP requests and handle errors
   *
   * @param request - Outgoing HTTP request
   * @param next - HTTP handler for the next interceptor
   * @returns Observable of HTTP events
   */
  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    const retryConfig = DEFAULT_RETRY_CONFIG;

    return next.handle(request).pipe(
      // Retry transient errors
      retry(retryConfig.maxRetries),
      // Catch and format errors
      catchError((error: HttpErrorResponse) => {
        return handleError(error, request);
      })
    );
  }
}
```

---

### Step 313.2: Update the Services Barrel File

Update `src/app/framework/services/index.ts`:

```typescript
// src/app/framework/services/index.ts
// VERSION 12 (Section 313) - Added HttpErrorInterceptor

export * from './url-state.service';
export * from './api.service';
export * from './request-coordinator.service';
export * from './domain-config-registry.service';
export * from './domain-config-validator.service';
export * from './popout-context.service';
export * from './popout-manager.service';
export * from './user-preferences.service';
export * from './filter-options.service';
export * from './picker-config-registry.service';
export * from './resource-management.service';
export * from './error-notification.service';
export * from './http-error.interceptor';
```

---

### Step 313.3: Register the Interceptor

Update `src/app/app.module.ts` to register the interceptor:

```typescript
// src/app/app.module.ts (partial - add to existing)
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpErrorInterceptor } from './framework/services';

@NgModule({
  // ...
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorInterceptor,
      multi: true
    }
  ],
  // ...
})
export class AppModule { }
```

---

## Verification

### 1. Check File Exists

```bash
$ ls -la src/app/framework/services/http-error.interceptor.ts
```

### 2. TypeScript Compilation Check

```bash
$ npx tsc --noEmit src/app/framework/services/http-error.interceptor.ts
```

### 3. Build the Application

```bash
$ ng build
```

### 4. Test Error Handling

Create a test that triggers an HTTP error:

```typescript
// In any component
constructor(private api: ApiService) {
  // Request a non-existent endpoint
  this.api.get('/api/non-existent-endpoint').subscribe({
    next: (data) => console.log('Data:', data),
    error: (error) => {
      console.log('Caught error:', error);
      // Error should be formatted as:
      // { code: 'NOT_FOUND', message: 'Resource not found.', status: 404, ... }
    }
  });
}
```

### 5. Verify Retry Behavior

To test retry, you can temporarily modify your API to return 503:

```typescript
// In browser DevTools Network tab:
// 1. Enable "Offline" mode briefly
// 2. Watch for retry attempts in console logs
// 3. See that after 2 retries, error is thrown
```

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| Interceptor not running | Not registered in providers | Add HTTP_INTERCEPTORS provider to app.module.ts |
| `multi: true` missing | Single interceptor overwrites others | Always use `multi: true` with HTTP_INTERCEPTORS |
| Infinite retry loop | All errors trigger retry | Only retry specific status codes (429, 5xx) |
| Error format wrong | Custom error handler | Ensure components expect the formatted error object |
| Retry too fast | No exponential backoff | Consider adding delay with `timer()` in retry |

---

## Key Takeaways

1. **Interceptors provide global error handling** — Every HTTP request flows through the interceptor
2. **Transient errors deserve retries** — 5xx and 429 errors often succeed on retry
3. **Consistent formatting simplifies handling** — Components receive the same error shape regardless of source

---

## Acceptance Criteria

- [ ] `src/app/framework/services/http-error.interceptor.ts` exists
- [ ] Interceptor implements `HttpInterceptor` interface
- [ ] `intercept()` method handles requests and errors
- [ ] Retry logic attempts 2 retries for 429, 500, 502, 503, 504
- [ ] Error formatting produces consistent object shape
- [ ] Error codes map correctly (400 → BAD_REQUEST, etc.)
- [ ] User-friendly messages for each status code
- [ ] Client-side errors (ErrorEvent) handled separately
- [ ] Error logging includes request URL and method
- [ ] Interceptor registered with `HTTP_INTERCEPTORS` provider
- [ ] TypeScript compilation succeeds
- [ ] JSDoc comments document all functions

---

## Next Step

Proceed to `314-global-error-handler.md` to create the global error handler for unhandled exceptions.
