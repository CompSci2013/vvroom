# 315: Pop-Out Token

**Status:** Complete
**Depends On:** 307-popout-context-service
**Blocks:** Phase 8 (Framework Components)

---

## Learning Objectives

After completing this section, you will:
- Understand how Angular injection tokens work
- Know when to use tokens vs services for dependency injection
- Recognize the benefits of compile-time constants for environment detection
- Be able to create and provide injection tokens

---

## Objective

Create the `IS_POPOUT_TOKEN` injection token that provides a boolean indicating whether the current window is a pop-out window. This token is used throughout the application to conditionally render components and enable/disable features based on pop-out context.

---

## Why

Pop-out windows need to behave differently from the main window:

| Behavior | Main Window | Pop-Out Window |
|----------|-------------|----------------|
| Navigation header | Shown | Hidden |
| Pop-out buttons | Enabled | Disabled (already popped out) |
| Close button | Hidden | Shown |
| State sync | Source | Receiver |

Components need to know "Am I in a pop-out?" to adjust their behavior.

### Option 1: Call a Service Method

```typescript
// In every component
constructor(private popoutContext: PopOutContextService) {}

get isPopOut(): boolean {
  return this.popoutContext.isInPopOut();
}
```

Problem: Every component needs to inject the service and call the method.

### Option 2: Use an Injection Token (Our Approach)

```typescript
// In any component
constructor(@Inject(IS_POPOUT_TOKEN) public isPopOut: boolean) {}
```

Benefits:
- **Simpler injection** — Just inject the boolean directly
- **Compile-time constant** — Value determined once at bootstrap
- **Template-friendly** — Use directly in templates: `*ngIf="!isPopOut"`
- **Testable** — Easy to provide different values in tests

### How It Works

1. **At bootstrap**, the router URL is checked for `/popout/` prefix
2. **A factory function** returns `true` or `false`
3. **The token is provided** at root level with this value
4. **Components inject** the token to get the boolean

```typescript
// Factory determines value once
export function isPopOutFactory(router: Router): boolean {
  return router.url.includes('/popout/');
}

// Provided at root
{
  provide: IS_POPOUT_TOKEN,
  useFactory: isPopOutFactory,
  deps: [Router]
}

// Injected in component
constructor(@Inject(IS_POPOUT_TOKEN) private isPopOut: boolean) {
  if (this.isPopOut) {
    // Pop-out specific behavior
  }
}
```

### Injection Token vs Service

| Feature | Injection Token | Service |
|---------|-----------------|---------|
| Value type | Primitive (boolean, string, etc.) | Object with methods |
| Computed | Once at creation | Can change over time |
| Dependencies | Via factory function | Via constructor |
| Use case | Static configuration | Dynamic behavior |

For "is this a pop-out?", an injection token is ideal because:
- The answer never changes during the window's lifetime
- It's a simple boolean, not a complex object
- Components just need to read it, not call methods

---

## What

### Step 315.1: Create the Tokens Directory

Create the tokens directory and barrel file.

Create `src/app/framework/tokens/index.ts`:

```typescript
// src/app/framework/tokens/index.ts
// VERSION 1 (Section 315) - Framework injection tokens

export * from './popout.token';
```

---

### Step 315.2: Create the Pop-Out Token

Create the file `src/app/framework/tokens/popout.token.ts`:

```typescript
// src/app/framework/tokens/popout.token.ts
// VERSION 1 (Section 315) - Pop-out window detection token

import { InjectionToken } from '@angular/core';

/**
 * Injection token for pop-out window detection
 *
 * Provides a boolean indicating whether the current window is a pop-out window.
 * This value is determined once at bootstrap based on the URL and never changes.
 *
 * **Usage:**
 *
 * ```typescript
 * constructor(@Inject(IS_POPOUT_TOKEN) public isPopOut: boolean) {}
 * ```
 *
 * **In Templates:**
 *
 * ```html
 * <nav *ngIf="!isPopOut">Main navigation</nav>
 * <button *ngIf="isPopOut" (click)="close()">Close</button>
 * ```
 *
 * **Providing the Token:**
 *
 * ```typescript
 * // In app.module.ts
 * {
 *   provide: IS_POPOUT_TOKEN,
 *   useFactory: () => window.location.pathname.includes('/popout/')
 * }
 * ```
 */
export const IS_POPOUT_TOKEN = new InjectionToken<boolean>('IS_POPOUT_TOKEN');
```

---

### Step 315.3: Create the Factory Function

Add a factory function to provide the token value. Update `src/app/framework/tokens/popout.token.ts`:

```typescript
// src/app/framework/tokens/popout.token.ts
// VERSION 2 (Section 315) - Added factory function

import { InjectionToken } from '@angular/core';

/**
 * Injection token for pop-out window detection
 *
 * Provides a boolean indicating whether the current window is a pop-out window.
 * This value is determined once at bootstrap based on the URL and never changes.
 *
 * **Usage:**
 *
 * ```typescript
 * constructor(@Inject(IS_POPOUT_TOKEN) public isPopOut: boolean) {}
 * ```
 *
 * **In Templates:**
 *
 * ```html
 * <nav *ngIf="!isPopOut">Main navigation</nav>
 * <button *ngIf="isPopOut" (click)="close()">Close</button>
 * ```
 */
export const IS_POPOUT_TOKEN = new InjectionToken<boolean>('IS_POPOUT_TOKEN');

/**
 * Factory function to determine if current window is a pop-out
 *
 * Checks the current URL pathname for the `/popout/` prefix.
 * This is called once during application bootstrap.
 *
 * @returns True if the current window is a pop-out window
 *
 * @example
 * ```typescript
 * // In app.module.ts
 * {
 *   provide: IS_POPOUT_TOKEN,
 *   useFactory: isPopOutFactory
 * }
 * ```
 */
export function isPopOutFactory(): boolean {
  // Check URL for popout prefix
  // Pop-out routes follow pattern: /popout/:panelId/:viewType
  return window.location.pathname.includes('/popout/');
}

/**
 * Provider configuration for IS_POPOUT_TOKEN
 *
 * Use this in your app.module.ts providers array.
 *
 * @example
 * ```typescript
 * import { IS_POPOUT_PROVIDER } from './framework/tokens';
 *
 * @NgModule({
 *   providers: [IS_POPOUT_PROVIDER]
 * })
 * export class AppModule { }
 * ```
 */
export const IS_POPOUT_PROVIDER = {
  provide: IS_POPOUT_TOKEN,
  useFactory: isPopOutFactory
};
```

---

### Step 315.4: Update the Barrel File

Update `src/app/framework/tokens/index.ts`:

```typescript
// src/app/framework/tokens/index.ts
// VERSION 1 (Section 315) - Framework injection tokens

export * from './popout.token';
```

---

### Step 315.5: Register the Provider

Update `src/app/app.module.ts` to provide the token:

```typescript
// src/app/app.module.ts (partial - add to existing)
import { IS_POPOUT_PROVIDER } from './framework/tokens';

@NgModule({
  // ...
  providers: [
    IS_POPOUT_PROVIDER
    // ... other providers
  ],
  // ...
})
export class AppModule { }
```

---

## Verification

### 1. Check Files Exist

```bash
$ ls -la src/app/framework/tokens/
```

Expected output:

```
total 12
drwxr-xr-x 2 user user 4096 Feb  9 12:00 .
drwxr-xr-x 5 user user 4096 Feb  9 12:00 ..
-rw-r--r-- 1 user user  123 Feb  9 12:00 index.ts
-rw-r--r-- 1 user user 1456 Feb  9 12:00 popout.token.ts
```

### 2. TypeScript Compilation Check

```bash
$ npx tsc --noEmit src/app/framework/tokens/popout.token.ts
```

### 3. Build the Application

```bash
$ ng build
```

### 4. Test Token Injection

Add temporary test code:

```typescript
// In any component
import { Inject } from '@angular/core';
import { IS_POPOUT_TOKEN } from './framework/tokens';

@Component({...})
export class TestComponent {
  constructor(@Inject(IS_POPOUT_TOKEN) private isPopOut: boolean) {
    console.log('Is pop-out window:', this.isPopOut);
  }
}
```

### 5. Verify Pop-Out Detection

1. Navigate to `http://localhost:4200/discover` → Console shows `false`
2. Navigate to `http://localhost:4200/popout/panel-1/chart` → Console shows `true`

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| `NullInjectorError: No provider for IS_POPOUT_TOKEN` | Token not provided | Add `IS_POPOUT_PROVIDER` to app.module.ts |
| Token always `false` | URL checked before navigation | Factory uses `window.location.pathname`, not Router |
| Token value changes | Token recreated per component | Ensure `providedIn: 'root'` behavior via app.module.ts |
| TypeScript error on `@Inject` | Missing import | Import `Inject` from `@angular/core` |

---

## Key Takeaways

1. **Injection tokens provide primitive values** — Use when you need a simple value, not a service
2. **Factory functions compute values once** — The pop-out check runs at bootstrap only
3. **Tokens simplify component code** — No service method calls, just inject the boolean

---

## Acceptance Criteria

- [ ] `src/app/framework/tokens/popout.token.ts` exists
- [ ] `IS_POPOUT_TOKEN` defined as `InjectionToken<boolean>`
- [ ] `isPopOutFactory()` function returns boolean based on URL
- [ ] `IS_POPOUT_PROVIDER` object ready for app.module.ts
- [ ] Barrel file exports all token-related items
- [ ] Token correctly detects `/popout/` in URL pathname
- [ ] TypeScript compilation succeeds
- [ ] JSDoc comments document usage patterns

---

## Phase 3 Complete

Congratulations! You have completed Phase 3: Framework Services.

**What you built:**

**Phase 3A - Core Services:**
- UrlStateService — URL-First state management
- ApiService — HTTP request wrapper
- RequestCoordinatorService — Cache, deduplication, retry
- DomainConfigRegistry — Domain configuration storage
- DomainConfigValidator — Runtime configuration validation
- ResourceManagementService — Core state orchestrator

**Phase 3B - Popout & Specialized Services:**
- PopOutContextService — Pop-out window detection
- PopOutManagerService — Pop-out window management
- UserPreferencesService — localStorage preferences
- FilterOptionsService — Filter dropdown caching
- PickerConfigRegistry — Picker configuration lookup

**Phase 3C - Error Handling:**
- ErrorNotificationService — Toast notifications with deduplication
- HttpErrorInterceptor — Automatic retry and error formatting
- GlobalErrorHandler — Catch-all for unhandled exceptions
- IS_POPOUT_TOKEN — Pop-out window detection token

**The Aha Moment:**
"Services are the nervous system of the application. They coordinate state, handle errors, and enable features to work together seamlessly."

---

## Next Step

Proceed to `401-base-model-interface.md` to begin Phase 4: Domain Models.
