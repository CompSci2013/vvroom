# 906: App Module

**Status:** Planning
**Depends On:** 905-app-routing-module, 312-error-notification-service, 313-http-error-interceptor, 314-global-error-handler, 608-domain-providers
**Blocks:** 907-final-integration

---

## Learning Objectives

After completing this section, you will:
- Understand how to configure the root Angular module with all necessary providers
- Know how to set up HTTP interceptors for global error handling
- Be able to register domain configuration providers at the application level

---

## Objective

Configure the root `AppModule` — the central hub that bootstraps the application and registers all global services, providers, and configurations. This module ties together everything we've built across all phases.

---

## Why

The `AppModule` is the entry point for your Angular application. It:

1. **Bootstraps the Application** — Tells Angular which component to load first
2. **Registers Global Providers** — Services available throughout the app
3. **Configures HTTP Layer** — Sets up interceptors for error handling
4. **Imports Core Modules** — BrowserModule, HttpClient, etc.
5. **Registers Domain Configuration** — Makes domain config available via DI

### Angular Module Types

| Type | Purpose | Example |
|------|---------|---------|
| Root Module | Bootstraps app, global config | `AppModule` |
| Feature Module | Encapsulates a feature | `AutomobileModule` |
| Shared Module | Commonly used components/pipes | `SharedModule` |
| Core Module | Singleton services | `CoreModule` |

For vvroom, we use a simplified structure:
- `AppModule` handles root and core concerns
- Feature modules are lazy-loaded
- Framework services are provided at root level via `@Injectable({ providedIn: 'root' })`

### Angular Style Guide References

- [Style 04-12](https://angular.io/guide/styleguide#style-04-12): Do not export the root module
- [Style 04-13](https://angular.io/guide/styleguide#style-04-13): Use the root module for configuration

---

## What

### Step 906.1: Create the Complete AppModule

Replace the contents of `src/app/app.module.ts`:

```typescript
// src/app/app.module.ts
// VERSION 1 (Section 906) - Complete application module configuration

import { ErrorHandler, Injector, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

// Framework services for global configuration
import { HttpErrorInterceptor } from './framework/services/http-error.interceptor';
import { GlobalErrorHandler } from './framework/services/global-error.handler';
import { DOMAIN_CONFIG } from './framework/services/domain-config-registry.service';

// Domain configuration
import { createAutomobileDomainConfig } from './domain-config/automobile';

/**
 * Root Application Module
 *
 * Central configuration hub for the vvroom application.
 *
 * Responsibilities:
 * - Bootstrap the AppComponent
 * - Configure HTTP client with error interceptor
 * - Set up global error handling
 * - Provide domain configuration for dependency injection
 *
 * Module Import Order:
 * 1. BrowserModule (must be first for browser apps)
 * 2. BrowserAnimationsModule (enables Angular animations)
 * 3. HttpClientModule (enables HTTP requests)
 * 4. AppRoutingModule (application routes)
 *
 * Note: Feature modules (Home, Automobile, Popout) are lazy-loaded
 * via the router, not imported here.
 */
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    // Angular core modules
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,

    // Application routing
    AppRoutingModule
  ],
  providers: [
    // HTTP Error Interceptor - catches all HTTP errors
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorInterceptor,
      multi: true
    },

    // Global Error Handler - catches all unhandled errors
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler
    },

    // Domain Configuration - provides automobile config to all components
    {
      provide: DOMAIN_CONFIG,
      useFactory: createAutomobileDomainConfig,
      deps: [Injector]
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

**Module configuration explained:**

| Section | Purpose |
|---------|---------|
| `declarations` | Components owned by this module (only AppComponent) |
| `imports` | Other modules this module depends on |
| `providers` | Services and tokens available globally |
| `bootstrap` | The root component to start the application |

---

### Step 906.2: Understanding the Provider Configuration

Let's examine each provider in detail:

#### HTTP Interceptor

```typescript
{
  provide: HTTP_INTERCEPTORS,
  useClass: HttpErrorInterceptor,
  multi: true
}
```

- `HTTP_INTERCEPTORS` is an Angular token for HTTP middleware
- `useClass` instantiates `HttpErrorInterceptor`
- `multi: true` allows multiple interceptors (they chain together)

The interceptor catches HTTP errors before they reach components, enabling centralized error handling.

#### Global Error Handler

```typescript
{
  provide: ErrorHandler,
  useClass: GlobalErrorHandler
}
```

- `ErrorHandler` is Angular's built-in error handling token
- Replacing it with `GlobalErrorHandler` catches all unhandled errors
- Useful for logging, error reporting, and user notification

#### Domain Configuration

```typescript
{
  provide: DOMAIN_CONFIG,
  useFactory: createAutomobileDomainConfig,
  deps: [Injector]
}
```

- `DOMAIN_CONFIG` is our custom injection token (from Phase 3)
- `useFactory` calls a function to create the config
- `deps: [Injector]` provides the Injector to the factory
- Components can inject `DOMAIN_CONFIG` to access domain configuration

---

### Step 906.3: Domain Configuration Factory

The factory function creates the automobile domain configuration. This should be defined in `src/app/domain-config/automobile/index.ts`:

```typescript
// src/app/domain-config/automobile/index.ts
// VERSION 1 (Section 906) - Domain config factory

import { Injector } from '@angular/core';
import { DomainConfig } from '../../framework/models/domain-config.interface';
import { automobileDomainConfig } from './automobile.domain-config';

/**
 * Factory function for creating automobile domain configuration
 *
 * This factory is called by Angular's dependency injection system
 * when DOMAIN_CONFIG is first requested.
 *
 * @param injector - Angular's Injector for creating service instances
 * @returns Complete domain configuration for automobiles
 */
export function createAutomobileDomainConfig(injector: Injector): DomainConfig<any, any, any> {
  // The base config is defined in automobile.domain-config.ts
  // The factory allows us to inject dependencies if needed
  return automobileDomainConfig;
}

// Re-export everything from the domain config
export * from './automobile.domain-config';
export * from './models';
export * from './adapters';
export * from './configs';
export * from './chart-sources';
```

---

### Step 906.4: Main Entry Point

Verify the `main.ts` file bootstraps the AppModule:

```typescript
// src/main.ts
// VERSION 1 (Section 906) - Application bootstrap

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error('Bootstrap error:', err));
```

This is the entry point that Angular CLI uses to start the application.

---

### Step 906.5: Module Import Order

The order of imports in `AppModule` matters:

```typescript
imports: [
  BrowserModule,           // 1. Browser platform (must be first)
  BrowserAnimationsModule, // 2. Animation support
  HttpClientModule,        // 3. HTTP client
  AppRoutingModule         // 4. Routes (last, so it can use all imported modules)
]
```

**Why this order?**

1. `BrowserModule` provides browser-specific services and must be imported first in the root module
2. `BrowserAnimationsModule` must come after `BrowserModule`
3. `HttpClientModule` sets up the HTTP client that services will use
4. `AppRoutingModule` should be last so routes can reference any components from other imports

---

### Step 906.6: Production Considerations

For production, you may want additional configuration. Create/update `src/environments/environment.prod.ts`:

```typescript
// src/environments/environment.prod.ts
// VERSION 1 (Section 906) - Production environment

export const environment = {
  production: true,
  apiBaseUrl: 'http://generic-prime.minilab/api/specs/v1'
};
```

And in `main.ts`, you can enable production mode:

```typescript
// src/main.ts
// VERSION 2 (Section 906) - Production mode support

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error('Bootstrap error:', err));
```

---

## Verification

### 1. Build the Application

```bash
$ ng build
```

Expected: Build succeeds with no errors.

### 2. Serve the Application

```bash
$ ng serve
```

Expected: Application starts without errors. Console should show:

```
✔ Compiled successfully.
```

### 3. Check Provider Registration

Open browser DevTools and verify:

1. **HTTP Interceptor:** Make a request and check Network tab. Errors should be handled gracefully.

2. **Global Error Handler:** In console, run:
   ```javascript
   throw new Error('Test error');
   ```
   The error should be caught by `GlobalErrorHandler`.

3. **Domain Config:** Components should receive domain configuration. If the discover page loads and shows data, the config is working.

### 4. Verify Lazy Loading

In the Network tab, observe chunk files loading:
- Initial load: `main.js`, `vendor.js`, `polyfills.js`
- Navigate to `/automobiles`: `automobile-module.js` loads
- Navigate to `/automobiles/discover`: No new chunk (same module)

### 5. Full Application Test

Complete this workflow:
1. Open `http://localhost:4200` → Redirects to `/home`
2. Click "Automobiles" → Navigates to automobile landing
3. Click "Advanced Search" → Navigates to discover page
4. Apply filters → Data loads, URL updates
5. Refresh page → Filters persist
6. Pop out a panel → New window opens with synced state

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| "No provider for HttpClient" | HttpClientModule not imported | Add `HttpClientModule` to imports |
| "NullInjectorError: No provider for DOMAIN_CONFIG" | Factory not registered | Add DOMAIN_CONFIG provider with factory |
| Animations not working | BrowserAnimationsModule missing | Add `BrowserAnimationsModule` to imports |
| Multiple instances of services | Wrong providedIn setting | Use `providedIn: 'root'` for singletons |
| HTTP interceptor not firing | Not registered properly | Use `multi: true` with HTTP_INTERCEPTORS |
| "AppComponent is not known element" | Not in declarations | Add AppComponent to declarations array |

---

## Key Takeaways

1. **AppModule is the configuration hub** — It wires together all parts of the application
2. **Provider order doesn't matter, import order does** — Especially for BrowserModule
3. **Use factories for complex configuration** — The DOMAIN_CONFIG factory pattern is powerful

---

## Acceptance Criteria

- [ ] `AppModule` imports BrowserModule, BrowserAnimationsModule, HttpClientModule, and AppRoutingModule
- [ ] `AppComponent` is declared and bootstrapped
- [ ] `HTTP_INTERCEPTORS` provider registers `HttpErrorInterceptor`
- [ ] `ErrorHandler` provider registers `GlobalErrorHandler`
- [ ] `DOMAIN_CONFIG` provider uses factory function with Injector
- [ ] `main.ts` bootstraps `AppModule`
- [ ] Application builds without errors
- [ ] Application runs and all routes are accessible
- [ ] HTTP errors are caught by the interceptor
- [ ] Domain configuration is available throughout the app

---

## Architecture Note: Provider Scopes

Angular's dependency injection has different scopes:

| Scope | How to Achieve | Lifetime |
|-------|----------------|----------|
| Application (singleton) | `@Injectable({ providedIn: 'root' })` | Entire app lifetime |
| Module | `providers: []` in module | Module lifetime |
| Component | `providers: []` in component | Component lifetime |

In vvroom:
- **Root-level singletons:** `UrlStateService`, `DomainConfigRegistry`, `ErrorNotificationService`
- **Module-provided:** None (all framework services are root)
- **Component-provided:** `ResourceManagementService`, `PopOutManagerService` (new instance per component)

This design ensures:
- Shared services (URL state) are consistent across the app
- Per-page services (resource management) are isolated to their component

---

## Module Relationship Diagram

```
AppModule (root)
    │
    ├── BrowserModule
    ├── BrowserAnimationsModule
    ├── HttpClientModule
    ├── AppRoutingModule ─────────────────┐
    │                                      │
    │   Lazy-loaded via routes:           │
    │   ┌────────────────────────────────┘
    │   │
    │   ├── HomeModule
    │   │   └── HomeComponent
    │   │
    │   ├── AutomobileModule
    │   │   ├── AutomobileComponent
    │   │   ├── AutomobileDiscoverComponent
    │   │   └── Framework Component Modules
    │   │
    │   └── PopoutModule
    │       └── PopoutComponent
    │
    └── Providers:
        ├── HTTP_INTERCEPTORS → HttpErrorInterceptor
        ├── ErrorHandler → GlobalErrorHandler
        └── DOMAIN_CONFIG → createAutomobileDomainConfig()
```

---

## Next Step

Proceed to `907-final-integration.md` to complete the integration, perform final testing, and celebrate completing the vvroom application!
