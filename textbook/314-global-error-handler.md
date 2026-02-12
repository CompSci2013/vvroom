# 314: Global Error Handler

**Status:** Complete
**Depends On:** 312-error-notification-service, 313-http-error-interceptor
**Blocks:** Phase 8 (Framework Components)

---

## Learning Objectives

After completing this section, you will:
- Understand how Angular's ErrorHandler interface works
- Know how to catch unhandled exceptions globally
- Recognize different error types (HTTP, chunk load, promise rejection)
- Be able to provide user-friendly messages for JavaScript errors

---

## Objective

Create the `GlobalErrorHandler` that catches all unhandled exceptions in the Angular application and displays user-friendly error messages using the ErrorNotificationService.

---

## Why

Errors escape individual component handlers for many reasons:
- Developers forget to add `.catch()` to promises
- Observable subscriptions don't include error callbacks
- Third-party libraries throw unexpectedly
- Template expressions throw during rendering

Without global error handling, these errors:
- Crash silently with cryptic console messages
- Leave users staring at broken UIs with no feedback
- Make debugging difficult without context

### Angular's ErrorHandler

Angular provides an `ErrorHandler` class that catches all unhandled errors. By default, it just logs to console. We replace it with our `GlobalErrorHandler` that:

1. **Categorizes errors** — HTTP vs chunk load vs promise rejection vs generic
2. **Shows user feedback** — Toast notifications explain what went wrong
3. **Logs context** — URL, route, stack trace for debugging

### Error Types

The global handler categorizes errors by type:

| Type | Detection | Example |
|------|-----------|---------|
| HTTP Error | `instanceof HttpErrorResponse` | API returned 500 |
| Chunk Load Error | Message contains "loading chunk" | Lazy module failed to load |
| Promise Rejection | Error has `.rejection` property | Unhandled async error |
| Generic Error | Default | TypeError, ReferenceError |

Each type gets appropriate handling:

| Type | Display | Duration |
|------|---------|----------|
| HTTP Error | Error toast | 5 seconds |
| Chunk Load Error | Sticky toast (requires action) | Until dismissed |
| Promise Rejection | Error toast | 7 seconds |
| Generic Error | Sticky toast | Until dismissed |

### The Lazy-Loading Trick

The GlobalErrorHandler uses Angular's `Injector` to get the `ErrorNotificationService` instead of constructor injection:

```typescript
// Wrong - can cause circular dependency
constructor(private errorNotification: ErrorNotificationService) { }

// Right - lazy loading via injector
constructor(private injector: Injector) { }

private get errorNotificationService(): ErrorNotificationService {
  return this.injector.get(ErrorNotificationService);
}
```

This avoids circular dependency issues because:
1. ErrorHandler is created very early in Angular's bootstrap
2. ErrorNotificationService may depend on services not yet created
3. Lazy injection defers resolution until first use

### Chunk Load Errors

A special case is **chunk load errors** — when lazy-loaded modules fail to load:

```
Error: Loading chunk 5 failed.
```

These typically happen when:
- Network connection drops during navigation
- Server deployment changed chunk hashes
- Browser cache serves stale chunk

The handler shows a sticky message prompting the user to refresh.

---

## What

### Step 314.1: Create the Global Error Handler

Create the file `src/app/framework/services/global-error.handler.ts`:

```typescript
// src/app/framework/services/global-error.handler.ts
// VERSION 1 (Section 314) - Global error handler

import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorNotificationService } from './error-notification.service';
import { ErrorCategory } from '../models/error-notification.interface';

/**
 * Global error handler
 *
 * Catches all unhandled errors in the Angular application and displays
 * user-friendly error messages using the ErrorNotificationService.
 *
 * This handler:
 * - Intercepts all unhandled exceptions
 * - Categorizes errors by type (HTTP, Promise rejection, component error, etc.)
 * - Displays appropriate user-facing messages
 * - Logs detailed error information for debugging
 *
 * **Why Lazy Injection?**
 *
 * Uses Injector.get() instead of constructor injection to avoid circular
 * dependency issues. ErrorHandler is created very early in Angular's
 * bootstrap process, before some services are fully initialized.
 *
 * @example
 * ```typescript
 * // In app.module.ts
 * providers: [
 *   {
 *     provide: ErrorHandler,
 *     useClass: GlobalErrorHandler
 *   }
 * ]
 * ```
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  /**
   * ErrorNotificationService instance
   *
   * Lazy-loaded via getter to avoid circular dependency issues.
   * Service is requested from injector on first access.
   */
  private get errorNotificationService(): ErrorNotificationService {
    return this.injector.get(ErrorNotificationService);
  }

  /**
   * Constructor with injector for lazy service loading
   *
   * @param injector - Angular injector for lazy-loading services
   */
  constructor(private injector: Injector) {}

  /**
   * Handle error
   *
   * Main error handling method called by Angular for all unhandled errors
   *
   * @param error - The error object
   */
  handleError(error: any): void {
    // Extract actual error from Angular's wrapper
    const actualError = this.unwrapError(error);

    // Log to console for debugging
    this.logErrorToConsole(actualError);

    // Handle different error types
    if (this.isHttpError(actualError)) {
      this.handleHttpError(actualError);
    } else if (this.isChunkLoadError(actualError)) {
      this.handleChunkLoadError(actualError);
    } else if (this.isPromiseRejection(error)) {
      this.handlePromiseRejection(actualError);
    } else {
      this.handleGenericError(actualError);
    }
  }

  /**
   * Unwrap error from Angular's ErrorEvent wrapper
   *
   * Angular sometimes wraps errors in objects with `.rejection` or `.error`
   * properties. This extracts the actual error object.
   *
   * @param error - Potentially wrapped error
   * @returns Actual error object
   */
  private unwrapError(error: any): any {
    // Angular wraps promise rejections in rejection field
    if (error && error.rejection) {
      return error.rejection;
    }

    // Angular wraps errors in error field
    if (error && error.error) {
      return error.error;
    }

    return error;
  }

  /**
   * Check if error is HTTP error
   *
   * @param error - Error object
   * @returns True if HTTP error
   */
  private isHttpError(error: any): boolean {
    return error instanceof HttpErrorResponse;
  }

  /**
   * Check if error is chunk load error (lazy-loaded module)
   *
   * Chunk load errors occur when lazy-loaded JavaScript files fail to load.
   * This typically happens due to network issues or server deployments
   * that change chunk hashes.
   *
   * @param error - Error object
   * @returns True if chunk load error
   */
  private isChunkLoadError(error: any): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    const message = error.message.toLowerCase();
    return (
      message.includes('loading chunk') ||
      message.includes('failed to fetch') ||
      message.includes('dynamically imported module')
    );
  }

  /**
   * Check if error is promise rejection
   *
   * @param error - Error object
   * @returns True if promise rejection
   */
  private isPromiseRejection(error: any): boolean {
    return error && error.promise && error.rejection;
  }

  /**
   * Handle HTTP errors
   *
   * HTTP errors are already handled by the HTTP interceptor, but may
   * bubble up if not caught in component subscriptions.
   *
   * @param error - HTTP error response
   */
  private handleHttpError(error: HttpErrorResponse): void {
    // Check if error was already formatted by interceptor
    if (error.error && error.error.code) {
      // Already formatted by interceptor
      this.errorNotificationService.showHttpError(error.error);
    } else {
      // Not formatted - format now
      this.errorNotificationService.showHttpError({
        code: 'HTTP_ERROR',
        message: error.message || 'An HTTP error occurred',
        status: error.status,
        statusText: error.statusText,
        url: error.url || undefined,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handle chunk load errors (lazy-loaded modules)
   *
   * These occur when lazy-loaded JavaScript chunks fail to load,
   * typically due to network issues or deployments.
   *
   * Shows a sticky toast prompting the user to refresh.
   *
   * @param error - Chunk load error
   */
  private handleChunkLoadError(error: Error): void {
    this.errorNotificationService.show(
      {
        category: ErrorCategory.NETWORK,
        severity: 'error',
        summary: 'Loading Error',
        detail:
          'Failed to load application module. Please refresh the page. ' +
          'If the problem persists, clear your browser cache.',
        code: 'CHUNK_LOAD_ERROR',
        timestamp: new Date().toISOString(),
        originalError: error
      },
      {
        sticky: true, // Don't auto-hide - requires user action
        life: 0
      }
    );
  }

  /**
   * Handle promise rejections
   *
   * Unhandled promise rejections that weren't caught with .catch()
   *
   * @param error - Rejected promise value
   */
  private handlePromiseRejection(error: any): void {
    // If it's an HTTP error, handle as HTTP
    if (this.isHttpError(error)) {
      this.handleHttpError(error);
      return;
    }

    // Generic promise rejection
    this.errorNotificationService.show(
      {
        category: ErrorCategory.APPLICATION,
        severity: 'error',
        summary: 'Operation Failed',
        detail:
          error?.message ||
          'An asynchronous operation failed. Please try again.',
        code: 'PROMISE_REJECTION',
        timestamp: new Date().toISOString(),
        originalError: error
      },
      {
        life: 7000 // Longer display for async errors
      }
    );
  }

  /**
   * Handle generic errors
   *
   * All other unhandled errors (component errors, TypeError, etc.)
   *
   * Shows a sticky toast for serious programming errors.
   *
   * @param error - Error object
   */
  private handleGenericError(error: any): void {
    const errorMessage =
      error?.message || error?.toString() || 'An unexpected error occurred';

    // Check for known error patterns
    const isTypeError = error instanceof TypeError;
    const isReferenceError = error instanceof ReferenceError;

    let detail = errorMessage;
    if (isTypeError || isReferenceError) {
      detail +=
        ' This is likely a programming error. Please report this issue.';
    }

    this.errorNotificationService.show(
      {
        category: ErrorCategory.CLIENT,
        severity: 'error',
        summary: 'Application Error',
        detail,
        code: 'UNHANDLED_ERROR',
        timestamp: new Date().toISOString(),
        originalError: error
      },
      {
        sticky: true, // Keep visible for debugging
        life: 0
      }
    );
  }

  /**
   * Log error to console for debugging
   *
   * Groups error information for easier debugging in DevTools.
   *
   * @param error - Error object
   */
  private logErrorToConsole(error: any): void {
    const timestamp = new Date().toISOString();

    console.group(`[Global Error Handler] ${timestamp}`);
    console.error('Error caught by global handler:', error);

    // Log stack trace if available
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }

    // Log additional context
    console.error('Error type:', error?.constructor?.name || typeof error);

    // Log location information
    console.error('Location:', {
      url: window.location.href,
      route: window.location.pathname
    });

    console.groupEnd();
  }
}
```

---

### Step 314.2: Update the Services Barrel File

Update `src/app/framework/services/index.ts`:

```typescript
// src/app/framework/services/index.ts
// VERSION 13 (Section 314) - Added GlobalErrorHandler

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
export * from './global-error.handler';
```

---

### Step 314.3: Register the Global Error Handler

Update `src/app/app.module.ts` to register the handler:

```typescript
// src/app/app.module.ts (partial - add to existing)
import { ErrorHandler } from '@angular/core';
import { GlobalErrorHandler } from './framework/services';

@NgModule({
  // ...
  providers: [
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler
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
$ ls -la src/app/framework/services/global-error.handler.ts
```

### 2. TypeScript Compilation Check

```bash
$ npx tsc --noEmit src/app/framework/services/global-error.handler.ts
```

### 3. Build the Application

```bash
$ ng build
```

### 4. Test Unhandled Error

Add temporary code to throw an error:

```typescript
// In any component ngOnInit
ngOnInit(): void {
  // Uncomment to test - should show sticky toast
  // throw new Error('Test unhandled error');
}
```

### 5. Test Promise Rejection

```typescript
// In any component
ngOnInit(): void {
  // Uncomment to test - should show error toast
  // Promise.reject(new Error('Test promise rejection'));
}
```

### 6. Test Chunk Load Error

Simulate by modifying the error check temporarily, or:
1. Build the application
2. Delete a chunk file from dist
3. Navigate to the route that loads that chunk

### 7. Verify Console Logging

When an error is caught, check the browser console for grouped log output:

```
▼ [Global Error Handler] 2024-02-09T12:00:00.000Z
  Error caught by global handler: Error: Test error
  Stack trace: Error: Test error
    at Component.ngOnInit (component.ts:15)
    ...
  Error type: Error
  Location: {url: "http://localhost:4200/discover", route: "/discover"}
```

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| Circular dependency error | ErrorHandler created too early | Use `Injector.get()` instead of constructor injection |
| No toast appears | ErrorNotificationService not provided | Ensure MessageService is in app.module.ts providers |
| Error handled twice | HTTP interceptor + global handler | Check if error already formatted (has `.code` property) |
| Console shows "NullInjectorError" | Service not available | Ensure all dependencies are provided |
| Chunk load error not detected | Message pattern changed | Update `isChunkLoadError()` detection patterns |

---

## Key Takeaways

1. **Global error handling catches everything** — Even errors developers forgot to handle
2. **Lazy injection avoids circular dependencies** — Use `Injector.get()` for early-loaded services
3. **Error categorization enables appropriate responses** — Chunk errors need refresh, promise errors need retry

---

## Acceptance Criteria

- [ ] `src/app/framework/services/global-error.handler.ts` exists
- [ ] Handler extends Angular's `ErrorHandler` interface
- [ ] `handleError()` method catches all unhandled errors
- [ ] HTTP errors detected and formatted
- [ ] Chunk load errors show sticky refresh prompt
- [ ] Promise rejections handled with 7-second display
- [ ] Generic errors show sticky toast
- [ ] Console logging includes stack trace and location
- [ ] Lazy injection via `Injector.get()` to avoid circular deps
- [ ] Handler registered with `provide: ErrorHandler` in app.module.ts
- [ ] TypeScript compilation succeeds
- [ ] JSDoc comments document all methods

---

## Phase 3C Complete

Congratulations! You have completed Phase 3C: Error Handling.

**What you built:**
- ErrorNotification interface — Error categorization and display types
- ErrorNotificationService — Centralized toast notifications with deduplication
- HttpErrorInterceptor — Automatic retry and consistent error formatting
- GlobalErrorHandler — Catch-all for unhandled exceptions

**The Aha Moment:**
"Errors are inevitable. User-friendly error messages are not."

---

## Next Step

Proceed to `315-popout-token.md` to create the injection token for pop-out window detection.
