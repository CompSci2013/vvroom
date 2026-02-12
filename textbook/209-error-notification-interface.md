# 209: Error Notification Interface

**Status:** Planning
**Depends On:** 201-domain-config-interface
**Blocks:** 312-error-notification-service, 313-http-error-interceptor

---

## Learning Objectives

After completing this section, you will:
- Understand how centralized error handling simplifies application-wide error management
- Know how to categorize errors by source and severity for appropriate user feedback
- Recognize the relationship between HTTP interceptors and error notification services

---

## Objective

Create the error notification interfaces that define how errors are categorized, formatted, and displayed to users. These interfaces establish a consistent error handling pattern using PrimeNG Toast for user-friendly error messages.

---

## Why

Errors happen. APIs fail, networks drop, validation rules are violated. How you handle these errors determines user experience:

**Poor error handling:**
```
Error: [object Object]
```

**Good error handling:**
```
Connection Error
Unable to reach the server. Please check your network connection.
[Retry] [Dismiss]
```

The error notification interfaces define:
1. **Error categories** — Network, validation, authorization, server, client
2. **Severity levels** — Maps to PrimeNG Toast colors (success, info, warn, error)
3. **Notification structure** — Summary, detail, timestamp, original error
4. **Display options** — Auto-hide duration, closable, sticky

**Centralized error handling benefits:**

| Without Centralization | With Centralization |
|----------------------|---------------------|
| Error handling in every component | Single error service |
| Inconsistent error messages | Consistent formatting |
| Easy to miss errors | All errors captured |
| No logging | Centralized logging |

---

## What

### Step 209.1: Create the Error Notification Interface

Create the file `src/app/framework/models/error-notification.interface.ts`:

```typescript
// src/app/framework/models/error-notification.interface.ts
// VERSION 1 (Section 209) - Error notification interfaces

/**
 * Error Notification Interfaces
 *
 * Provides comprehensive error categorization and notification configuration
 * for user-facing error messages using PrimeNG Toast.
 */

/**
 * Error category enumeration
 *
 * Categorizes errors by their source and nature for appropriate handling
 * and user messaging.
 */
export enum ErrorCategory {
  /**
   * Network-related errors (connection issues, timeouts, etc.)
   * HTTP status 0 or network failures
   */
  NETWORK = 'NETWORK',

  /**
   * Validation errors (invalid input, business rule violations)
   * HTTP status 400, 422
   */
  VALIDATION = 'VALIDATION',

  /**
   * Authorization/authentication errors
   * HTTP status 401 (unauthorized), 403 (forbidden)
   */
  AUTHORIZATION = 'AUTHORIZATION',

  /**
   * Server-side errors
   * HTTP status 5xx
   */
  SERVER = 'SERVER',

  /**
   * Client-side errors (JavaScript errors, component errors)
   * Runtime errors in the application
   */
  CLIENT = 'CLIENT',

  /**
   * Application-level errors (business logic, state errors)
   * Custom application errors
   */
  APPLICATION = 'APPLICATION',

  /**
   * Unknown or uncategorized errors
   * Fallback for unrecognized error types
   */
  UNKNOWN = 'UNKNOWN'
}

/**
 * Error severity levels
 *
 * Maps to PrimeNG Toast severity levels for visual feedback.
 * - 'success': Green (not typically used for errors)
 * - 'info': Blue (informational messages)
 * - 'warn': Yellow/Orange (warnings, validation errors)
 * - 'error': Red (critical errors)
 */
export type ErrorSeverity = 'success' | 'info' | 'warn' | 'error';

/**
 * Error notification data structure
 *
 * Contains all information needed to display an error to the user.
 *
 * @example
 * ```typescript
 * const notification: ErrorNotification = {
 *   category: ErrorCategory.NETWORK,
 *   severity: 'error',
 *   summary: 'Connection Error',
 *   detail: 'Unable to reach the server. Please check your network connection.',
 *   timestamp: new Date().toISOString(),
 *   status: 0
 * };
 * ```
 */
export interface ErrorNotification {
  /**
   * Error category for categorization and routing
   */
  category: ErrorCategory;

  /**
   * Display severity (maps to PrimeNG Toast severity)
   */
  severity: ErrorSeverity;

  /**
   * Brief error summary (shown as toast title)
   * Should be short and actionable
   */
  summary: string;

  /**
   * Detailed error message (shown as toast body)
   * Provides more context about the error
   */
  detail: string;

  /**
   * Optional error code for debugging
   * From API or generated locally
   */
  code?: string;

  /**
   * Timestamp of when error occurred
   * ISO 8601 format
   */
  timestamp?: string;

  /**
   * URL where error occurred (for HTTP errors)
   */
  url?: string;

  /**
   * HTTP status code (for network errors)
   */
  status?: number;

  /**
   * Original error object (for logging/debugging)
   * Not displayed to user, but useful for console/reporting
   */
  originalError?: any;
}

/**
 * Error display options
 *
 * Configuration for how errors should be displayed to users.
 * Passed to PrimeNG Toast component.
 */
export interface ErrorDisplayOptions {
  /**
   * Auto-hide duration in milliseconds
   * Set to 0 or null to prevent auto-hide
   * @default 5000 (5 seconds)
   */
  life?: number;

  /**
   * Whether to show close button
   * @default true
   */
  closable?: boolean;

  /**
   * Whether to show in sticky mode (no auto-hide)
   * @default false
   */
  sticky?: boolean;

  /**
   * Custom CSS class for the toast
   */
  styleClass?: string;

  /**
   * Toast position key (used with multiple toast containers)
   * @default 'app-toast'
   */
  key?: string;
}

/**
 * Default error display options
 */
export const DEFAULT_ERROR_DISPLAY_OPTIONS: ErrorDisplayOptions = {
  life: 5000,
  closable: true,
  sticky: false,
  key: 'app-toast'
};

/**
 * Error severity mapping configuration
 *
 * Maps error categories to default severity levels.
 * - NETWORK, SERVER, CLIENT, APPLICATION, UNKNOWN → 'error' (red)
 * - VALIDATION, AUTHORIZATION → 'warn' (yellow)
 */
export const ERROR_CATEGORY_SEVERITY_MAP: Record<ErrorCategory, ErrorSeverity> = {
  [ErrorCategory.NETWORK]: 'error',
  [ErrorCategory.VALIDATION]: 'warn',
  [ErrorCategory.AUTHORIZATION]: 'warn',
  [ErrorCategory.SERVER]: 'error',
  [ErrorCategory.CLIENT]: 'error',
  [ErrorCategory.APPLICATION]: 'error',
  [ErrorCategory.UNKNOWN]: 'error'
};

/**
 * Determine error category from HTTP status code
 *
 * @param status - HTTP status code
 * @returns Appropriate error category
 *
 * @example
 * ```typescript
 * getErrorCategoryFromStatus(401); // ErrorCategory.AUTHORIZATION
 * getErrorCategoryFromStatus(500); // ErrorCategory.SERVER
 * getErrorCategoryFromStatus(0);   // ErrorCategory.NETWORK
 * ```
 */
export function getErrorCategoryFromStatus(status: number): ErrorCategory {
  // Status 0 typically means network failure
  if (status === 0) {
    return ErrorCategory.NETWORK;
  }

  // Authentication/authorization errors
  if (status === 401 || status === 403) {
    return ErrorCategory.AUTHORIZATION;
  }

  // Validation errors
  if (status === 400 || status === 422) {
    return ErrorCategory.VALIDATION;
  }

  // Server errors
  if (status >= 500 && status < 600) {
    return ErrorCategory.SERVER;
  }

  // Other client errors
  if (status >= 400 && status < 500) {
    return ErrorCategory.CLIENT;
  }

  return ErrorCategory.UNKNOWN;
}

/**
 * Determine error category from error code string
 *
 * @param code - Error code string
 * @returns Appropriate error category
 *
 * @example
 * ```typescript
 * getErrorCategoryFromCode('NETWORK_TIMEOUT');    // ErrorCategory.NETWORK
 * getErrorCategoryFromCode('VALIDATION_FAILED'); // ErrorCategory.VALIDATION
 * getErrorCategoryFromCode('UNAUTHORIZED');      // ErrorCategory.AUTHORIZATION
 * ```
 */
export function getErrorCategoryFromCode(code: string): ErrorCategory {
  const upperCode = code.toUpperCase();

  if (upperCode.includes('NETWORK') || upperCode.includes('TIMEOUT')) {
    return ErrorCategory.NETWORK;
  }

  if (upperCode.includes('VALIDATION') || upperCode.includes('INVALID')) {
    return ErrorCategory.VALIDATION;
  }

  if (
    upperCode.includes('UNAUTHORIZED') ||
    upperCode.includes('FORBIDDEN') ||
    upperCode.includes('AUTH')
  ) {
    return ErrorCategory.AUTHORIZATION;
  }

  if (upperCode.includes('SERVER') || upperCode.includes('INTERNAL')) {
    return ErrorCategory.SERVER;
  }

  if (upperCode.includes('CLIENT')) {
    return ErrorCategory.CLIENT;
  }

  return ErrorCategory.UNKNOWN;
}

/**
 * Get user-friendly summary for error category
 *
 * @param category - Error category
 * @returns Summary text suitable for toast title
 */
export function getSummaryForCategory(category: ErrorCategory): string {
  switch (category) {
    case ErrorCategory.NETWORK:
      return 'Connection Error';
    case ErrorCategory.VALIDATION:
      return 'Validation Error';
    case ErrorCategory.AUTHORIZATION:
      return 'Access Denied';
    case ErrorCategory.SERVER:
      return 'Server Error';
    case ErrorCategory.CLIENT:
      return 'Application Error';
    case ErrorCategory.APPLICATION:
      return 'Operation Failed';
    case ErrorCategory.UNKNOWN:
    default:
      return 'Error';
  }
}

/**
 * Create error notification from HTTP error
 *
 * Converts an HTTP error response to an ErrorNotification.
 * Typically called from HTTP error interceptor.
 *
 * @param error - HTTP error object (from HttpErrorResponse or interceptor)
 * @returns ErrorNotification object ready for display
 *
 * @example
 * ```typescript
 * // In HTTP interceptor
 * catchError((error: HttpErrorResponse) => {
 *   const notification = createErrorNotificationFromHttpError({
 *     status: error.status,
 *     message: error.message,
 *     url: error.url,
 *     code: error.error?.code
 *   });
 *   this.errorService.show(notification);
 *   return throwError(() => error);
 * })
 * ```
 */
export function createErrorNotificationFromHttpError(error: {
  status?: number;
  message?: string;
  url?: string;
  code?: string;
  timestamp?: string;
}): ErrorNotification {
  const status = error.status || 0;
  const code = error.code || 'UNKNOWN_ERROR';
  const category = getErrorCategoryFromStatus(status);
  const severity = ERROR_CATEGORY_SEVERITY_MAP[category];

  return {
    category,
    severity,
    summary: getSummaryForCategory(category),
    detail: error.message || 'An unexpected error occurred',
    code,
    timestamp: error.timestamp || new Date().toISOString(),
    url: error.url,
    status,
    originalError: error
  };
}

/**
 * Create error notification from generic Error
 *
 * Converts a JavaScript Error to an ErrorNotification.
 * Typically called from global error handler.
 *
 * @param error - JavaScript Error object
 * @returns ErrorNotification object ready for display
 *
 * @example
 * ```typescript
 * // In global error handler
 * handleError(error: Error): void {
 *   const notification = createErrorNotificationFromError(error);
 *   this.errorService.show(notification);
 * }
 * ```
 */
export function createErrorNotificationFromError(error: Error): ErrorNotification {
  const code = (error as any).code;
  const category = code
    ? getErrorCategoryFromCode(code)
    : ErrorCategory.CLIENT;
  const severity = ERROR_CATEGORY_SEVERITY_MAP[category];

  return {
    category,
    severity,
    summary: getSummaryForCategory(category),
    detail: error.message || 'An unexpected error occurred',
    code,
    timestamp: new Date().toISOString(),
    originalError: error
  };
}

/**
 * Create a custom error notification
 *
 * For application-specific errors that don't come from HTTP or JavaScript errors.
 *
 * @param summary - Brief error summary
 * @param detail - Detailed error message
 * @param category - Error category (default: APPLICATION)
 * @returns ErrorNotification object
 *
 * @example
 * ```typescript
 * // Business logic error
 * if (cart.items.length === 0) {
 *   const notification = createCustomErrorNotification(
 *     'Empty Cart',
 *     'Please add items to your cart before checkout.',
 *     ErrorCategory.APPLICATION
 *   );
 *   this.errorService.show(notification);
 * }
 * ```
 */
export function createCustomErrorNotification(
  summary: string,
  detail: string,
  category: ErrorCategory = ErrorCategory.APPLICATION
): ErrorNotification {
  const severity = ERROR_CATEGORY_SEVERITY_MAP[category];

  return {
    category,
    severity,
    summary,
    detail,
    timestamp: new Date().toISOString()
  };
}

/**
 * Default display options by error category
 *
 * Some error types should be more prominent than others.
 * - Authorization errors are sticky (user must acknowledge)
 * - Validation errors auto-hide quickly
 */
export const CATEGORY_DISPLAY_OPTIONS: Record<ErrorCategory, Partial<ErrorDisplayOptions>> = {
  [ErrorCategory.NETWORK]: { life: 8000 },
  [ErrorCategory.VALIDATION]: { life: 4000 },
  [ErrorCategory.AUTHORIZATION]: { sticky: true, closable: true },
  [ErrorCategory.SERVER]: { life: 6000 },
  [ErrorCategory.CLIENT]: { life: 5000 },
  [ErrorCategory.APPLICATION]: { life: 5000 },
  [ErrorCategory.UNKNOWN]: { life: 5000 }
};

/**
 * Merge display options with category defaults
 *
 * @param category - Error category
 * @param options - Custom display options
 * @returns Merged display options
 */
export function mergeDisplayOptions(
  category: ErrorCategory,
  options?: Partial<ErrorDisplayOptions>
): ErrorDisplayOptions {
  return {
    ...DEFAULT_ERROR_DISPLAY_OPTIONS,
    ...CATEGORY_DISPLAY_OPTIONS[category],
    ...options
  };
}
```

---

### Step 209.2: Update the Barrel Export

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
export * from './popout.interface';
export * from './error-notification.interface';
```

---

### Step 209.3: Understand the Error Handling Flow

Error handling in vvroom follows this pattern:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Error Occurs                                 │
│  (HTTP Error, Runtime Error, Business Error)                     │
└─────────────────────────────────────────────────────────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ HTTP Error    │    │ Runtime Error │    │ Business      │
│ Interceptor   │    │ Handler       │    │ Logic         │
└───────────────┘    └───────────────┘    └───────────────┘
        │                    │                    │
        │                    │                    │
        └────────────────────┴────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  createErrorNotification*()                      │
│         Convert to ErrorNotification structure                   │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  ErrorNotificationService                        │
│         Display via PrimeNG Toast, log to console               │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       PrimeNG Toast                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Connection Error                               [×]      │    │
│  │  Unable to reach the server.                            │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

### Step 209.4: Phase 2 Complete

Congratulations! You have completed Phase 2: Framework Models.

**What you built:**

| Document | Interface | Purpose |
|----------|-----------|---------|
| 201 | `DomainConfig<T>` | Central configuration for domains |
| 202 | `IApiAdapter<T>`, `IFilterUrlMapper<T>` | URL-First adapters |
| 203 | `FilterDefinition<T>` | Query Control filters |
| 204 | `TableConfig<T>`, `PrimeNGColumn<T>` | Data table configuration |
| 205 | `PickerConfig<T>` | Selection picker configuration |
| 206 | `ApiResponse<T>` | Standard API response format |
| 207 | `PaginationParams`, `SortParams` | Pagination utilities |
| 208 | `PopOutMessage`, `PopOutContext` | Pop-out communication |
| 209 | `ErrorNotification`, `ErrorCategory` | Error handling |

**Phase 2 Aha Moment achieved:** "TypeScript interfaces are executable documentation."

These interfaces don't execute at runtime — they have zero impact on bundle size. But they provide:
- **Compile-time safety** — TypeScript catches configuration errors
- **IDE support** — Autocomplete and inline documentation
- **Living documentation** — The interface IS the specification

---

## Verification

### 1. Check File Exists

```bash
$ ls -la src/app/framework/models/error-notification.interface.ts
```

Expected output shows the file exists.

### 2. TypeScript Compilation Check

```bash
$ cd ~/projects/vvroom
$ npx tsc --noEmit src/app/framework/models/error-notification.interface.ts
```

Expected: No output (no compilation errors).

### 3. Verify All Model Files Exist

```bash
$ ls -1 src/app/framework/models/
```

Expected output:

```
api-response.interface.ts
domain-config.interface.ts
error-notification.interface.ts
filter-definition.interface.ts
index.ts
pagination.interface.ts
picker-config.interface.ts
popout.interface.ts
resource-management.interface.ts
table-config.interface.ts
```

### 4. Verify Barrel Exports All Interfaces

```bash
$ grep "export" src/app/framework/models/index.ts
```

Expected: All 9 interface files are exported.

### 5. Phase 2 Checkpoint

```bash
$ cd ~/projects/vvroom
$ ng build
```

Expected: Build succeeds with no errors. All interfaces compile.

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| `ErrorCategory is not defined` | Missing import | Import from the interface file |
| Toast not appearing | MessageService not provided | Add to providers in AppModule |
| Severity color wrong | Wrong severity string | Use: 'success', 'info', 'warn', 'error' |
| Timestamp format wrong | Not ISO 8601 | Use `new Date().toISOString()` |
| originalError circular reference | Logging issue | JSON.stringify with replacer |

---

## Key Takeaways

1. **Centralized error handling provides consistency** — One place to format and display all errors
2. **Error categories enable smart handling** — Different categories get different treatment
3. **Factory functions simplify error creation** — `createErrorNotificationFromHttpError()`, etc.

---

## Acceptance Criteria

- [ ] `src/app/framework/models/error-notification.interface.ts` exists
- [ ] `ErrorCategory` enum defines all error categories
- [ ] `ErrorSeverity` type matches PrimeNG Toast severities
- [ ] `ErrorNotification` interface captures all error information
- [ ] `ErrorDisplayOptions` interface configures toast behavior
- [ ] `getErrorCategoryFromStatus` correctly categorizes HTTP errors
- [ ] `getErrorCategoryFromCode` correctly categorizes error codes
- [ ] Factory functions create notifications from different error sources
- [ ] `CATEGORY_DISPLAY_OPTIONS` provides sensible defaults per category
- [ ] Barrel file exports all error notification types
- [ ] TypeScript compilation succeeds with no errors

---

## Phase 2 Checkpoint

Before proceeding to Phase 3 (Framework Services), verify:

- [ ] All 9 interface files exist in `src/app/framework/models/`
- [ ] Barrel file (`index.ts`) exports all interfaces
- [ ] `ng build` completes with no errors
- [ ] Each interface has JSDoc documentation
- [ ] No runtime code exists yet — these are all types

---

## Next Step

Proceed to `250-rxjs-patterns-primer.md` (Interlude B) to learn the RxJS patterns needed for Phase 3 services.
