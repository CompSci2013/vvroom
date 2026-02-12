# 312: Error Notification Service

**Status:** Complete
**Depends On:** 201-209 (Framework Models)
**Blocks:** 313-http-error-interceptor, 314-global-error-handler

---

## Learning Objectives

After completing this section, you will:
- Understand the need for centralized error notification
- Know how to deduplicate error messages to prevent notification spam
- Recognize the role of error categorization in user-facing messaging
- Be able to implement toast notifications using PrimeNG MessageService

---

## Objective

Create the `ErrorNotificationService` that provides centralized error notification using PrimeNG Toast. This service handles error deduplication, categorization, and consistent display for all user-facing error messages.

---

## Why

Applications generate errors from multiple sources:
- HTTP requests failing
- Validation errors from form inputs
- Component lifecycle errors
- Unhandled promise rejections

Without centralized error handling, each component handles errors differently. Users see inconsistent messages, and developers repeat the same error-handling logic.

### The Problem: Notification Spam

When errors occur, they often repeat rapidly:
- Network failures cause multiple retries
- Polling requests all fail simultaneously
- Component re-renders trigger the same error

Showing every error individually creates **notification spam** that overwhelms users.

### The Solution: Deduplication

The ErrorNotificationService maintains a short-term memory of recent errors. If the same error (same category + summary + detail) occurs within a deduplication window (3 seconds), subsequent errors are suppressed.

```typescript
// First error: Shows toast
showError('Connection Error', 'Unable to reach server');

// Same error within 3 seconds: Suppressed
showError('Connection Error', 'Unable to reach server'); // No toast

// After 3 seconds: Shows toast again
showError('Connection Error', 'Unable to reach server'); // Toast shown
```

### Error Categories

Errors are categorized by source and type:

| Category | Description | Default Severity |
|----------|-------------|------------------|
| `NETWORK` | Connection issues, timeouts | error |
| `VALIDATION` | Invalid input, business rules | warn |
| `AUTHORIZATION` | 401/403 errors | warn |
| `SERVER` | 5xx status codes | error |
| `CLIENT` | JavaScript errors | error |
| `APPLICATION` | Business logic errors | error |
| `UNKNOWN` | Uncategorized | error |

Categories drive two behaviors:
1. **Visual severity** — Maps to PrimeNG toast colors (error=red, warn=yellow)
2. **User-friendly summaries** — "Connection Error" instead of "NETWORK"

### PrimeNG Toast Integration

PrimeNG's `MessageService` provides toast notifications. The ErrorNotificationService wraps it to add:
- Error categorization
- Deduplication
- Consistent formatting
- Debug logging

---

## What

### Step 312.1: Create the Error Notification Interface

Create the file `src/app/framework/models/error-notification.interface.ts`:

```typescript
// src/app/framework/models/error-notification.interface.ts
// VERSION 1 (Section 312) - Error notification types

/**
 * Error category enumeration
 *
 * Categorizes errors by their source and nature for appropriate handling
 * and user messaging.
 */
export enum ErrorCategory {
  /**
   * Network-related errors (connection issues, timeouts, etc.)
   */
  NETWORK = 'NETWORK',

  /**
   * Validation errors (invalid input, business rule violations)
   */
  VALIDATION = 'VALIDATION',

  /**
   * Authorization/authentication errors (401, 403)
   */
  AUTHORIZATION = 'AUTHORIZATION',

  /**
   * Server-side errors (5xx status codes)
   */
  SERVER = 'SERVER',

  /**
   * Client-side errors (JavaScript errors, component errors)
   */
  CLIENT = 'CLIENT',

  /**
   * Application-level errors (business logic, state errors)
   */
  APPLICATION = 'APPLICATION',

  /**
   * Unknown or uncategorized errors
   */
  UNKNOWN = 'UNKNOWN'
}

/**
 * Error severity levels
 *
 * Maps to PrimeNG Toast severity levels for visual feedback
 */
export type ErrorSeverity = 'success' | 'info' | 'warn' | 'error';

/**
 * Error notification data structure
 *
 * Contains all information needed to display an error to the user
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
   */
  summary: string;

  /**
   * Detailed error message (shown as toast body)
   */
  detail: string;

  /**
   * Optional error code for debugging
   */
  code?: string;

  /**
   * Optional timestamp of when error occurred
   */
  timestamp?: string;

  /**
   * Optional URL where error occurred
   */
  url?: string;

  /**
   * Optional HTTP status code (for network errors)
   */
  status?: number;

  /**
   * Original error object (for logging/debugging)
   */
  originalError?: any;
}

/**
 * Error display options
 *
 * Configuration for how errors should be displayed to users
 */
export interface ErrorDisplayOptions {
  /**
   * Auto-hide duration in milliseconds
   * Set to 0 or null to prevent auto-hide
   * Default: 5000 (5 seconds)
   */
  life?: number;

  /**
   * Whether to show close button
   * Default: true
   */
  closable?: boolean;

  /**
   * Whether to show in sticky mode (no auto-hide)
   * Default: false
   */
  sticky?: boolean;

  /**
   * Custom CSS class for the toast
   */
  styleClass?: string;

  /**
   * Toast position key
   * Default: 'app-toast'
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
 * Maps error categories to default severity levels
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
 * HTTP status code to error category mapping
 *
 * @param status - HTTP status code
 * @returns Appropriate error category
 */
export function getErrorCategoryFromStatus(status: number): ErrorCategory {
  if (status === 0) {
    return ErrorCategory.NETWORK;
  }

  if (status === 401 || status === 403) {
    return ErrorCategory.AUTHORIZATION;
  }

  if (status === 400 || status === 422) {
    return ErrorCategory.VALIDATION;
  }

  if (status >= 500 && status < 600) {
    return ErrorCategory.SERVER;
  }

  if (status >= 400 && status < 500) {
    return ErrorCategory.CLIENT;
  }

  return ErrorCategory.UNKNOWN;
}

/**
 * Error code to error category mapping
 *
 * @param code - Error code string
 * @returns Appropriate error category
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
 * @returns Summary text
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
 * @param error - HTTP error object (from interceptor)
 * @returns ErrorNotification object
 */
export function createErrorNotificationFromHttpError(error: any): ErrorNotification {
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
    timestamp: error.timestamp,
    url: error.url,
    status,
    originalError: error
  };
}

/**
 * Create error notification from generic error
 *
 * @param error - Generic error object
 * @returns ErrorNotification object
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
```

---

### Step 312.2: Update the Models Barrel File

Update `src/app/framework/models/index.ts`:

```typescript
// src/app/framework/models/index.ts
// VERSION 9 (Section 312) - Added error notification types

export * from './domain-config.interface';
export * from './column-config.interface';
export * from './filter-config.interface';
export * from './picker-config.interface';
export * from './table-state.interface';
export * from './paginator-state.interface';
export * from './popout.interface';
export * from './user-preferences.interface';
export * from './error-notification.interface';
```

---

### Step 312.3: Create the Error Notification Service

Create the file `src/app/framework/services/error-notification.service.ts`:

```typescript
// src/app/framework/services/error-notification.service.ts
// VERSION 1 (Section 312) - Centralized error notification

import { Injectable, OnDestroy } from '@angular/core';
import { MessageService } from 'primeng/api';
import {
  ErrorNotification,
  ErrorCategory,
  ErrorDisplayOptions,
  DEFAULT_ERROR_DISPLAY_OPTIONS,
  createErrorNotificationFromHttpError,
  createErrorNotificationFromError
} from '../models/error-notification.interface';

/**
 * Error notification service
 *
 * Centralized error notification system using PrimeNG Toast for user-facing
 * error messages. Provides error deduplication, categorization, and
 * consistent error display.
 *
 * **Key Features:**
 *
 * 1. **Deduplication** — Same error within 3 seconds is suppressed
 * 2. **Categorization** — Errors categorized by type for appropriate messaging
 * 3. **Consistent Display** — All errors shown via PrimeNG Toast
 * 4. **Debug Logging** — All errors logged to console for debugging
 *
 * @example
 * ```typescript
 * // Show HTTP error
 * this.errorNotification.showHttpError(httpError);
 *
 * // Show custom error
 * this.errorNotification.showError(
 *   'Operation Failed',
 *   'Unable to save changes. Please try again.'
 * );
 *
 * // Show warning
 * this.errorNotification.showWarning(
 *   'Data Modified',
 *   'Some fields were automatically corrected.'
 * );
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorNotificationService implements OnDestroy {
  /**
   * Recent error messages for deduplication
   *
   * Maps error signature (hash of message) to timestamp. Used to suppress
   * duplicate errors shown within DEDUPLICATION_WINDOW milliseconds.
   */
  private recentErrors = new Map<string, number>();

  /**
   * Deduplication window in milliseconds
   *
   * Errors with the same signature within this window are suppressed
   * to prevent notification spam from repeated failures.
   */
  private readonly DEDUPLICATION_WINDOW = 3000; // 3 seconds

  /**
   * Cleanup interval for recent errors map
   *
   * Interval at which expired entries are removed from recentErrors
   * to prevent unbounded memory growth.
   */
  private readonly CLEANUP_INTERVAL = 10000; // 10 seconds

  /**
   * Cleanup timer reference
   */
  private cleanupTimer?: ReturnType<typeof setInterval>;

  /**
   * Constructor for dependency injection
   *
   * @param messageService - PrimeNG MessageService for displaying toast notifications
   */
  constructor(private messageService: MessageService) {
    this.startCleanupTimer();
  }

  /**
   * Show error notification
   *
   * @param summary - Brief error summary
   * @param detail - Detailed error message
   * @param options - Display options
   */
  showError(
    summary: string,
    detail: string,
    options?: ErrorDisplayOptions
  ): void {
    this.show(
      {
        category: ErrorCategory.APPLICATION,
        severity: 'error',
        summary,
        detail,
        timestamp: new Date().toISOString()
      },
      options
    );
  }

  /**
   * Show warning notification
   *
   * @param summary - Brief warning summary
   * @param detail - Detailed warning message
   * @param options - Display options
   */
  showWarning(
    summary: string,
    detail: string,
    options?: ErrorDisplayOptions
  ): void {
    this.show(
      {
        category: ErrorCategory.APPLICATION,
        severity: 'warn',
        summary,
        detail,
        timestamp: new Date().toISOString()
      },
      options
    );
  }

  /**
   * Show info notification
   *
   * @param summary - Brief info summary
   * @param detail - Detailed info message
   * @param options - Display options
   */
  showInfo(
    summary: string,
    detail: string,
    options?: ErrorDisplayOptions
  ): void {
    this.show(
      {
        category: ErrorCategory.APPLICATION,
        severity: 'info',
        summary,
        detail,
        timestamp: new Date().toISOString()
      },
      options
    );
  }

  /**
   * Show success notification
   *
   * @param summary - Brief success summary
   * @param detail - Detailed success message
   * @param options - Display options
   */
  showSuccess(
    summary: string,
    detail: string,
    options?: ErrorDisplayOptions
  ): void {
    this.show(
      {
        category: ErrorCategory.APPLICATION,
        severity: 'success',
        summary,
        detail,
        timestamp: new Date().toISOString()
      },
      options
    );
  }

  /**
   * Show HTTP error notification
   *
   * Automatically categorizes and formats HTTP errors from the interceptor
   *
   * @param error - HTTP error object from interceptor
   * @param options - Display options
   */
  showHttpError(error: any, options?: ErrorDisplayOptions): void {
    const notification = createErrorNotificationFromHttpError(error);
    this.show(notification, options);
  }

  /**
   * Show generic error notification
   *
   * Automatically categorizes and formats generic JavaScript errors
   *
   * @param error - Error object
   * @param options - Display options
   */
  showGenericError(error: Error, options?: ErrorDisplayOptions): void {
    const notification = createErrorNotificationFromError(error);
    this.show(notification, options);
  }

  /**
   * Show custom error notification
   *
   * @param notification - Error notification object
   * @param options - Display options
   */
  show(
    notification: ErrorNotification,
    options?: ErrorDisplayOptions
  ): void {
    // Check for duplicate
    if (this.isDuplicate(notification)) {
      console.debug('Suppressing duplicate error:', notification.summary);
      return;
    }

    // Record error for deduplication
    this.recordError(notification);

    // Merge options with defaults
    const displayOptions: ErrorDisplayOptions = {
      ...DEFAULT_ERROR_DISPLAY_OPTIONS,
      ...options
    };

    // Display toast notification
    this.messageService.add({
      severity: notification.severity,
      summary: notification.summary,
      detail: notification.detail,
      life: displayOptions.life,
      closable: displayOptions.closable,
      sticky: displayOptions.sticky,
      styleClass: displayOptions.styleClass,
      key: displayOptions.key
    });

    // Log error details
    this.logError(notification);
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.messageService.clear();
  }

  /**
   * Clear notifications by key
   *
   * @param key - Toast key to clear
   */
  clear(key?: string): void {
    this.messageService.clear(key);
  }

  /**
   * Check if error is duplicate
   *
   * @param notification - Error notification
   * @returns True if duplicate within deduplication window
   */
  private isDuplicate(notification: ErrorNotification): boolean {
    const signature = this.getErrorSignature(notification);
    const lastTime = this.recentErrors.get(signature);

    if (!lastTime) {
      return false;
    }

    const now = Date.now();
    return now - lastTime < this.DEDUPLICATION_WINDOW;
  }

  /**
   * Record error for deduplication tracking
   *
   * @param notification - Error notification
   */
  private recordError(notification: ErrorNotification): void {
    const signature = this.getErrorSignature(notification);
    this.recentErrors.set(signature, Date.now());
  }

  /**
   * Generate error signature for deduplication
   *
   * @param notification - Error notification
   * @returns Unique signature string
   */
  private getErrorSignature(notification: ErrorNotification): string {
    // Combine category, summary, and detail for signature
    return `${notification.category}:${notification.summary}:${notification.detail}`;
  }

  /**
   * Log error details for debugging
   *
   * @param notification - Error notification
   */
  private logError(notification: ErrorNotification): void {
    const logData: any = {
      category: notification.category,
      severity: notification.severity,
      summary: notification.summary,
      detail: notification.detail,
      timestamp: notification.timestamp || new Date().toISOString()
    };

    // Add optional fields if present
    if (notification.code) {
      logData.code = notification.code;
    }
    if (notification.url) {
      logData.url = notification.url;
    }
    if (notification.status) {
      logData.status = notification.status;
    }

    // Log based on severity
    switch (notification.severity) {
      case 'error':
        console.error('[Error Notification]', logData);
        if (notification.originalError) {
          console.error('Original error:', notification.originalError);
        }
        break;
      case 'warn':
        console.warn('[Warning Notification]', logData);
        break;
      case 'info':
        console.info('[Info Notification]', logData);
        break;
      case 'success':
        console.log('[Success Notification]', logData);
        break;
    }
  }

  /**
   * Start cleanup timer for recent errors map
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupRecentErrors();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Clean up expired entries from recent errors map
   */
  private cleanupRecentErrors(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // Find expired entries
    this.recentErrors.forEach((timestamp, key) => {
      if (now - timestamp > this.DEDUPLICATION_WINDOW * 2) {
        expiredKeys.push(key);
      }
    });

    // Remove expired entries
    expiredKeys.forEach((key) => {
      this.recentErrors.delete(key);
    });
  }

  /**
   * Stop cleanup timer (for cleanup)
   */
  ngOnDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }
}
```

---

### Step 312.4: Update the Services Barrel File

Update `src/app/framework/services/index.ts`:

```typescript
// src/app/framework/services/index.ts
// VERSION 11 (Section 312) - Added ErrorNotificationService

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
```

---

## Verification

### 1. Check Files Exist

```bash
$ ls -la src/app/framework/models/error-notification.interface.ts
$ ls -la src/app/framework/services/error-notification.service.ts
```

### 2. TypeScript Compilation Check

```bash
$ npx tsc --noEmit src/app/framework/services/error-notification.service.ts
```

### 3. Verify PrimeNG MessageService Provider

Ensure `MessageService` is provided in your `app.module.ts`:

```typescript
import { MessageService } from 'primeng/api';

@NgModule({
  providers: [MessageService],
  // ...
})
export class AppModule { }
```

### 4. Add Toast Component to Template

Add the PrimeNG Toast component to `app.component.html`:

```html
<p-toast key="app-toast"></p-toast>
<router-outlet></router-outlet>
```

### 5. Test Deduplication

```typescript
// In any component
constructor(private errorNotification: ErrorNotificationService) {
  // First error - shows toast
  this.errorNotification.showError('Test', 'This is a test error');

  // Same error within 3 seconds - suppressed
  setTimeout(() => {
    this.errorNotification.showError('Test', 'This is a test error');
    console.log('Second error call (should be suppressed)');
  }, 1000);

  // Same error after 4 seconds - shows toast
  setTimeout(() => {
    this.errorNotification.showError('Test', 'This is a test error');
    console.log('Third error call (should show)');
  }, 4000);
}
```

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| No toast appears | MessageService not provided | Add `MessageService` to app.module.ts providers |
| Toast appears but no styling | PrimeNG CSS not imported | Import PrimeNG theme in styles.scss |
| Multiple toasts for same error | Deduplication not working | Check signature generation logic |
| Memory leak warning | Cleanup timer not stopped | Ensure `ngOnDestroy` clears interval |
| Wrong toast position | Toast key mismatch | Ensure `key` matches in both service and template |

---

## Key Takeaways

1. **Deduplication prevents spam** — Same error within 3 seconds is suppressed
2. **Categorization drives messaging** — Error category determines summary text and severity
3. **PrimeNG Toast integration** — Wrapping MessageService adds value through deduplication and categorization

---

## Acceptance Criteria

- [ ] `src/app/framework/models/error-notification.interface.ts` exists with all types
- [ ] `src/app/framework/services/error-notification.service.ts` exists
- [ ] Service is `@Injectable({ providedIn: 'root' })`
- [ ] `showError()` displays error toast
- [ ] `showWarning()` displays warning toast
- [ ] `showInfo()` displays info toast
- [ ] `showSuccess()` displays success toast
- [ ] `showHttpError()` creates notification from HTTP error
- [ ] `showGenericError()` creates notification from Error object
- [ ] Deduplication prevents same error within 3 seconds
- [ ] Cleanup timer prevents memory leaks
- [ ] `ngOnDestroy()` clears cleanup timer
- [ ] TypeScript compilation succeeds
- [ ] JSDoc comments document all public methods

---

## Next Step

Proceed to `313-http-error-interceptor.md` to create the HTTP interceptor for automatic error handling.
