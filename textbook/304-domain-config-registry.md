# 304: Domain Config Registry

**Status:** Complete
**Depends On:** 201-domain-config-interface
**Blocks:** 305-domain-config-validator, 306-resource-management-service, 310-filter-options-service, 311-picker-config-registry

---

## Learning Objectives

After completing this section, you will:
- Understand the Registry pattern and when to use it
- Know how to use Angular InjectionTokens for flexible configuration
- Recognize how runtime registration enables multi-domain applications
- Be able to implement a type-safe configuration registry

---

## Objective

Create the `DomainConfigRegistry` service that provides centralized management of domain configurations. This registry allows domains to be registered, retrieved, and switched at runtime.

---

## Why

The vvroom application is designed to be domain-agnostic. The framework doesn't know about automobiles — it knows about `DomainConfig`. This raises a question: *how does the framework access domain-specific configuration?*

### Option 1: Import Directly

```typescript
// In a component
import { AUTOMOBILE_DOMAIN_CONFIG } from './domain-config/automobile';

@Component({...})
export class DiscoverComponent {
  config = AUTOMOBILE_DOMAIN_CONFIG;
}
```

This works, but:
- Hard-codes the domain in the component
- Can't switch domains at runtime
- Can't add new domains without modifying framework code

### Option 2: Injection Token

```typescript
// In a module
providers: [
  { provide: DOMAIN_CONFIG, useValue: AUTOMOBILE_DOMAIN_CONFIG }
]

// In a component
constructor(@Inject(DOMAIN_CONFIG) private config: DomainConfig<...>) {}
```

Better, but:
- Only one domain at a time
- No runtime switching
- No validation

### Option 3: Registry Pattern (Our Approach)

```typescript
// At app startup
registry.register(AUTOMOBILE_DOMAIN_CONFIG);
registry.register(REAL_ESTATE_DOMAIN_CONFIG);

// In a component
const config = registry.getActive();

// Switch domain
registry.setActive('real-estate');
```

The registry:
- Stores multiple domain configurations
- Provides runtime switching
- Validates configurations on registration
- Offers type-safe retrieval

### Why Both Token AND Registry?

We use BOTH:
1. **`DOMAIN_CONFIG` token** — For component injection (simpler DI)
2. **`DomainConfigRegistry`** — For runtime management

The token is *populated from* the registry. Components inject `DOMAIN_CONFIG`, and the module provider gets it from the registry.

```typescript
providers: [
  {
    provide: DOMAIN_CONFIG,
    useFactory: (registry: DomainConfigRegistry) => registry.getActive(),
    deps: [DomainConfigRegistry]
  }
]
```

---

## What

### Step 304.1: Create the Domain Config Registry Service

Create the file `src/app/framework/services/domain-config-registry.service.ts`:

```typescript
// src/app/framework/services/domain-config-registry.service.ts
// VERSION 1 (Section 304) - Domain configuration registry

import { Injectable, InjectionToken, Injector, Provider } from '@angular/core';
import { DomainConfig } from '../models/domain-config.interface';
import { DomainConfigValidator } from './domain-config-validator.service';

/**
 * Injection token for domain configuration
 *
 * Used to provide domain-specific configuration to components.
 * The value is typically retrieved from DomainConfigRegistry.
 *
 * @example
 * ```typescript
 * // In domain module providers
 * providers: [
 *   {
 *     provide: DOMAIN_CONFIG,
 *     useFactory: (registry: DomainConfigRegistry) => registry.getActive(),
 *     deps: [DomainConfigRegistry]
 *   }
 * ]
 *
 * // In component
 * constructor(
 *   @Inject(DOMAIN_CONFIG) private domainConfig: DomainConfig<any, any, any>
 * ) {}
 * ```
 */
export const DOMAIN_CONFIG = new InjectionToken<DomainConfig<any, any, any>>(
  'Domain Configuration'
);

/**
 * Domain configuration registry service
 *
 * Centralized registry for managing multiple domain configurations.
 * Supports registering, retrieving, and switching between domains.
 *
 * **Why a Registry?**
 *
 * 1. **Multi-domain support** — Register multiple domains, switch at runtime
 * 2. **Validation** — Catch configuration errors early
 * 3. **Type safety** — Generic methods preserve type information
 * 4. **Centralized access** — Single point for all domain config access
 *
 * **Typical Usage Flow:**
 *
 * 1. App initializes → Register domain configs
 * 2. User navigates → Framework gets active config
 * 3. User switches domain → Registry changes active
 * 4. Framework components → Inject DOMAIN_CONFIG token
 *
 * @example
 * ```typescript
 * // Register domains at app initialization
 * registry.register(AUTOMOBILE_DOMAIN_CONFIG);
 * registry.register(REAL_ESTATE_DOMAIN_CONFIG);
 *
 * // Get active domain config
 * const config = registry.getActive();
 *
 * // Switch active domain
 * registry.setActive('real-estate');
 *
 * // List all registered domains
 * const domains = registry.getAllDomainNames(); // ['automobile', 'real-estate']
 *
 * // Get specific domain by name
 * const autoConfig = registry.get<AutoFilters, AutoData>('automobile');
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class DomainConfigRegistry {
  /**
   * Storage for registered domain configurations
   *
   * Maps domain name (e.g., 'automobile') to DomainConfig instance.
   */
  private configs = new Map<string, DomainConfig<any, any, any>>();

  /**
   * Currently active domain name
   *
   * Set to first registered domain by default.
   * Can be changed via setActive().
   */
  private activeDomainName?: string;

  /**
   * Constructor - injects validator
   *
   * @param validator - Service for validating domain configurations
   */
  constructor(private validator: DomainConfigValidator) {}

  /**
   * Register a domain configuration
   *
   * Validates the configuration (unless disabled) and adds it to the registry.
   * First registered domain becomes the active domain.
   *
   * @template TFilters - Filter model type
   * @template TData - Data model type
   * @template TStatistics - Statistics model type
   * @param config - Domain configuration to register
   * @param validate - Whether to validate configuration (default: true)
   * @throws Error if configuration is invalid (when validate=true)
   *
   * @example
   * ```typescript
   * // Register with validation
   * registry.register(AUTOMOBILE_DOMAIN_CONFIG);
   *
   * // Register without validation (e.g., in tests)
   * registry.register(TEST_CONFIG, false);
   * ```
   */
  register<TFilters, TData, TStatistics>(
    config: DomainConfig<TFilters, TData, TStatistics>,
    validate: boolean = true
  ): void {
    // Validate if requested
    if (validate) {
      const sanitizedConfig = this.validator.validateAndSanitize(config);
      config = sanitizedConfig as DomainConfig<TFilters, TData, TStatistics>;
    }

    // Check for duplicate (warn but allow overwrite)
    if (this.configs.has(config.domainName)) {
      console.warn(
        `Domain '${config.domainName}' already registered. Overwriting.`
      );
    }

    // Register the config
    this.configs.set(config.domainName, config);

    // Set as active if first domain
    if (!this.activeDomainName) {
      this.activeDomainName = config.domainName;
    }

    console.log(`Domain '${config.domainName}' registered successfully`);
  }

  /**
   * Register multiple domain configurations
   *
   * Convenience method for registering several domains at once.
   *
   * @param configs - Array of domain configurations
   * @param validate - Whether to validate configurations (default: true)
   */
  registerMultiple(
    configs: DomainConfig<any, any, any>[],
    validate: boolean = true
  ): void {
    configs.forEach((config) => this.register(config, validate));
  }

  /**
   * Get domain configuration by name
   *
   * @template TFilters - Filter model type
   * @template TData - Data model type
   * @template TStatistics - Statistics model type
   * @param domainName - Domain name to retrieve
   * @returns Domain configuration
   * @throws Error if domain not found
   *
   * @example
   * ```typescript
   * const config = registry.get<AutoFilters, VehicleResult>('automobile');
   * // config is typed as DomainConfig<AutoFilters, VehicleResult, any>
   * ```
   */
  get<TFilters, TData, TStatistics>(
    domainName: string
  ): DomainConfig<TFilters, TData, TStatistics> {
    const config = this.configs.get(domainName);

    if (!config) {
      const available = this.getAllDomainNames().join(', ');
      throw new Error(
        `Domain '${domainName}' not found. Available domains: ${available}`
      );
    }

    return config as DomainConfig<TFilters, TData, TStatistics>;
  }

  /**
   * Get active domain configuration
   *
   * Returns the currently active domain's configuration.
   *
   * @template TFilters - Filter model type
   * @template TData - Data model type
   * @template TStatistics - Statistics model type
   * @returns Active domain configuration
   * @throws Error if no domain is active
   */
  getActive<TFilters, TData, TStatistics>(): DomainConfig<
    TFilters,
    TData,
    TStatistics
  > {
    if (!this.activeDomainName) {
      throw new Error('No active domain. Register a domain first.');
    }

    return this.get<TFilters, TData, TStatistics>(this.activeDomainName);
  }

  /**
   * Set active domain
   *
   * Changes which domain is returned by getActive().
   *
   * @param domainName - Domain name to activate
   * @throws Error if domain not found
   */
  setActive(domainName: string): void {
    if (!this.configs.has(domainName)) {
      const available = this.getAllDomainNames().join(', ');
      throw new Error(
        `Cannot activate domain '${domainName}'. Available domains: ${available}`
      );
    }

    this.activeDomainName = domainName;
    console.log(`Active domain set to '${domainName}'`);
  }

  /**
   * Get active domain name
   *
   * @returns Active domain name or undefined if none
   */
  getActiveDomainName(): string | undefined {
    return this.activeDomainName;
  }

  /**
   * Check if domain is registered
   *
   * @param domainName - Domain name to check
   * @returns True if domain is registered
   */
  has(domainName: string): boolean {
    return this.configs.has(domainName);
  }

  /**
   * Get all registered domain names
   *
   * @returns Array of domain names
   */
  getAllDomainNames(): string[] {
    return Array.from(this.configs.keys());
  }

  /**
   * Get all registered domain configurations
   *
   * @returns Array of domain configurations
   */
  getAll(): DomainConfig<any, any, any>[] {
    return Array.from(this.configs.values());
  }

  /**
   * Unregister a domain
   *
   * Removes domain from registry. If it was active, activates the next available.
   *
   * @param domainName - Domain name to unregister
   * @returns True if domain was unregistered, false if not found
   */
  unregister(domainName: string): boolean {
    const result = this.configs.delete(domainName);

    // Handle active domain removal
    if (this.activeDomainName === domainName) {
      this.activeDomainName = undefined;

      // Set first remaining domain as active
      const remaining = this.getAllDomainNames();
      if (remaining.length > 0) {
        this.setActive(remaining[0]);
      }
    }

    if (result) {
      console.log(`Domain '${domainName}' unregistered`);
    }

    return result;
  }

  /**
   * Clear all registered domains
   */
  clear(): void {
    this.configs.clear();
    this.activeDomainName = undefined;
    console.log('All domains cleared');
  }

  /**
   * Get count of registered domains
   *
   * @returns Number of registered domains
   */
  getCount(): number {
    return this.configs.size;
  }

  /**
   * Validate a domain configuration without registering
   *
   * Useful for pre-validation before registration.
   *
   * @template TFilters - Filter model type
   * @template TData - Data model type
   * @template TStatistics - Statistics model type
   * @param config - Domain configuration to validate
   * @returns Validation result
   */
  validate<TFilters, TData, TStatistics>(
    config: DomainConfig<TFilters, TData, TStatistics>
  ) {
    return this.validator.validate(config);
  }

  /**
   * Get human-readable validation summary for a domain
   *
   * @param domainName - Domain name
   * @returns Validation summary string
   */
  getValidationSummary(domainName: string): string {
    const config = this.get(domainName);
    const result = this.validator.validate(config);
    return this.validator.getValidationSummary(result);
  }
}
```

---

### Step 304.2: Update the Barrel File

Update `src/app/framework/services/index.ts`:

```typescript
// src/app/framework/services/index.ts
// VERSION 4 (Section 304) - Added DomainConfigRegistry

export * from './url-state.service';
export * from './api.service';
export * from './request-coordinator.service';
export * from './domain-config-registry.service';
```

---

### Step 304.3: Understand the Dependency

Note that `DomainConfigRegistry` depends on `DomainConfigValidator` (Section 305). The registry won't compile until the validator exists.

This creates a circular documentation dependency:
- Registry (304) uses Validator (305)
- We document Registry first to show the pattern

In practice, you'll create both files, then build.

---

## Verification

### 1. Check File Exists

```bash
$ ls -la src/app/framework/services/domain-config-registry.service.ts
```

### 2. TypeScript Compilation Check

After creating Section 305 (Validator), run:

```bash
$ npx tsc --noEmit src/app/framework/services/domain-config-registry.service.ts
```

Expected: No output (no compilation errors).

### 3. Build the Application

After Section 305:

```bash
$ ng build
```

Expected: Build succeeds with no errors.

### 4. Verify Registration (Optional)

Add temporary test code:

```typescript
// In app.component.ts ngOnInit
import { DomainConfigRegistry } from './framework/services';

constructor(private registry: DomainConfigRegistry) {}

ngOnInit(): void {
  // Mock config for testing (real config comes in Phase 6)
  const mockConfig = {
    domainName: 'test-automobile',
    domainLabel: 'Test Automobiles',
    apiBaseUrl: 'http://example.com/api',
    filterModel: class {},
    dataModel: class {},
    apiAdapter: { fetchData: () => {} },
    urlMapper: { toUrlParams: () => ({}), fromUrlParams: () => ({}) },
    cacheKeyBuilder: { buildKey: () => '' },
    tableConfig: { tableId: 'test', dataKey: 'id', columns: [{ field: 'id' }] },
    pickers: [],
    filters: [],
    queryControlFilters: [],
    charts: [],
    features: { highlights: true, popOuts: true, rowExpansion: true }
  };

  this.registry.register(mockConfig as any, false); // Skip validation for test
  console.log('Registered domains:', this.registry.getAllDomainNames());
  console.log('Active domain:', this.registry.getActiveDomainName());
}
```

Console should show:
```
Domain 'test-automobile' registered successfully
Registered domains: ['test-automobile']
Active domain: test-automobile
```

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| `Cannot find module './domain-config-validator.service'` | Validator not created yet | Complete Section 305 first |
| `No active domain` error | No domains registered | Register at least one domain |
| `Domain 'X' not found` | Domain not registered | Check spelling, ensure registration happened |
| Validation errors on register | Config missing required fields | Check DomainConfig interface requirements |
| Console warnings about overwriting | Same domain registered twice | Remove duplicate registration |

---

## Key Takeaways

1. **Registry pattern enables runtime flexibility** — Register, retrieve, switch domains dynamically
2. **Injection tokens simplify component DI** — Components inject DOMAIN_CONFIG, not the registry
3. **Validation catches errors early** — Invalid configs fail at registration, not at runtime

---

## Acceptance Criteria

- [ ] `src/app/framework/services/domain-config-registry.service.ts` exists
- [ ] Barrel file exports the service and DOMAIN_CONFIG token
- [ ] Service is `@Injectable({ providedIn: 'root' })`
- [ ] `register()` validates and stores configurations
- [ ] `get()` retrieves configurations by name
- [ ] `getActive()` returns the active domain configuration
- [ ] `setActive()` changes the active domain
- [ ] First registered domain becomes active automatically
- [ ] `getAllDomainNames()` lists all registered domains
- [ ] `unregister()` removes domains and handles active domain gracefully
- [ ] DOMAIN_CONFIG InjectionToken is exported
- [ ] TypeScript compilation succeeds (after Section 305)
- [ ] JSDoc comments document all public methods

---

## Next Step

Proceed to `305-domain-config-validator.md` to create the validation service that the registry depends on.
