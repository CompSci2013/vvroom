# 608: Domain Providers

**Status:** Planning
**Depends On:** 607-domain-config-assembly
**Blocks:** 906-app-config

---

## Learning Objectives

After completing this section, you will:
- Understand the purpose of a domain providers registry
- Know how to add new domains to the application
- Recognize the pattern of collecting providers from multiple sources

---

## Objective

Create the domain providers file that exports an array of all domain configuration providers. This is the single point where all domains are registered for the application.

---

## Why

The vvroom application is designed to support multiple domains. While we only have automobiles now, the architecture anticipates:

- Agriculture (crops, yields, regions)
- Chemistry (compounds, reactions)
- Physics (particles, experiments)
- Finance (stocks, portfolios)

Each domain has its own `DOMAIN_PROVIDER`. The domain providers file collects them all:

```typescript
// Without domain providers registry
@NgModule({
  providers: [
    automobileDomainProvider,
    agricultureDomainProvider,
    chemistryDomainProvider,
    // ... manually list each one
  ]
})
```

```typescript
// With domain providers registry
import { DOMAIN_PROVIDERS } from '../domain-config/domain-providers';

@NgModule({
  providers: [
    ...DOMAIN_PROVIDERS  // Spread all domain providers
  ]
})
```

Benefits:
1. **Single source of truth** — All domains listed in one file
2. **Easy to add domains** — Add one line to add a new domain
3. **Clear inventory** — Easy to see what domains exist

### For Vvroom (Automobile Only)

Since vvroom only has automobiles, the domain providers file is simple. But the pattern prepares for future expansion.

---

## What

### Step 608.1: Create the Domain Providers File

Create the file that exports all domain providers.

Create `src/app/domain-config/domain-providers.ts`:

```typescript
// src/app/domain-config/domain-providers.ts

import { Provider } from '@angular/core';
import { DOMAIN_PROVIDER as automobileDomainProvider } from './automobile';

/**
 * Array of all domain configuration providers.
 *
 * Each domain should export a `DOMAIN_PROVIDER` that can be added to this array.
 * This allows for dynamic registration of domains at application startup.
 *
 * @example
 * ```typescript
 * // Add a new domain
 * import { DOMAIN_PROVIDER as newDomainProvider } from './new-domain';
 *
 * export const DOMAIN_PROVIDERS: Provider[] = [
 *   automobileDomainProvider,
 *   newDomainProvider
 * ];
 * ```
 */
export const DOMAIN_PROVIDERS: Provider[] = [
  automobileDomainProvider,
];
```

---

### Step 608.2: Understand the Provider Array Pattern

The `DOMAIN_PROVIDERS` array is a collection of Angular Provider objects:

```typescript
// Each item is a Provider
const automobileDomainProvider: Provider = {
  provide: DOMAIN_CONFIG,
  useFactory: createAutomobileDomainConfig,
  deps: [Injector]
};

// The array collects all providers
export const DOMAIN_PROVIDERS: Provider[] = [
  automobileDomainProvider,
  // future: agricultureDomainProvider,
  // future: chemistryDomainProvider,
];
```

When used in a module:

```typescript
@NgModule({
  providers: [
    ...DOMAIN_PROVIDERS  // Spreads all providers into the module
  ]
})
```

This is equivalent to:

```typescript
@NgModule({
  providers: [
    {
      provide: DOMAIN_CONFIG,
      useFactory: createAutomobileDomainConfig,
      deps: [Injector]
    }
    // All other domain providers...
  ]
})
```

---

### Step 608.3: Understanding Single vs Multi Providers

Currently, `DOMAIN_PROVIDERS` contains one provider. In a multi-domain app, you might want the `DOMAIN_CONFIG` token to provide multiple configs.

Angular supports this with `multi: true`:

```typescript
// Single provider (current approach)
{ provide: DOMAIN_CONFIG, useFactory: createAutomobileDomainConfig, deps: [Injector] }

// Multi-provider (for multiple domains)
{ provide: DOMAIN_CONFIG, useFactory: createAutomobileDomainConfig, deps: [Injector], multi: true },
{ provide: DOMAIN_CONFIG, useFactory: createAgricultureDomainConfig, deps: [Injector], multi: true }
```

With `multi: true`, injecting `DOMAIN_CONFIG` provides an array:

```typescript
constructor(@Inject(DOMAIN_CONFIG) private configs: DomainConfig[]) {
  // configs is an array of all registered domain configs
}
```

For vvroom, we use single providers because we only have one domain. The pattern is established for future expansion.

---

### Step 608.4: Understanding the Import Pattern

Note the import pattern:

```typescript
import { DOMAIN_PROVIDER as automobileDomainProvider } from './automobile';
```

Each domain exports a `DOMAIN_PROVIDER`. We rename them on import to avoid conflicts:

```typescript
// If we had multiple domains:
import { DOMAIN_PROVIDER as automobileDomainProvider } from './automobile';
import { DOMAIN_PROVIDER as agricultureDomainProvider } from './agriculture';
import { DOMAIN_PROVIDER as chemistryDomainProvider } from './chemistry';

export const DOMAIN_PROVIDERS: Provider[] = [
  automobileDomainProvider,
  agricultureDomainProvider,
  chemistryDomainProvider,
];
```

The `as` keyword prevents naming conflicts when all domains export the same `DOMAIN_PROVIDER` name.

---

### Step 608.5: Understanding Usage in App Config

The domain providers are used in the application configuration:

```typescript
// src/app/app.config.ts (document 906)
import { DOMAIN_PROVIDERS } from '../domain-config/domain-providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    ...DOMAIN_PROVIDERS,  // Register all domain configs
  ]
};
```

This makes the domain configuration available throughout the application via dependency injection.

---

### Step 608.6: Adding a New Domain (Future)

To add a new domain in the future, you would:

1. Create the domain directory: `src/app/domain-config/new-domain/`
2. Implement models, adapters, and configs (Phases 4-6 for new domain)
3. Export `DOMAIN_PROVIDER` from `new-domain/index.ts`
4. Add to domain-providers.ts:

```typescript
import { DOMAIN_PROVIDER as automobileDomainProvider } from './automobile';
import { DOMAIN_PROVIDER as newDomainProvider } from './new-domain';

export const DOMAIN_PROVIDERS: Provider[] = [
  automobileDomainProvider,
  newDomainProvider,  // Add new domain
];
```

5. Add routes for the new domain in `app.routes.ts`

That's it. No changes to framework code.

---

## Verification

### 1. Verify File Created

```bash
$ ls -la src/app/domain-config/domain-providers.ts
```

Expected: File exists.

### 2. Verify TypeScript Compilation

```bash
$ cd ~/projects/vvroom
$ npx tsc --noEmit src/app/domain-config/domain-providers.ts
```

Expected: No compilation errors.

### 3. Verify Export

```bash
$ grep "^export const DOMAIN_PROVIDERS" src/app/domain-config/domain-providers.ts
```

Expected: `export const DOMAIN_PROVIDERS: Provider[] = [`

### 4. Verify Provider Count

```bash
$ grep -c "DomainProvider" src/app/domain-config/domain-providers.ts
```

Expected: `1` (automobileDomainProvider only)

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| "Cannot find module './automobile'" | Barrel export missing | Ensure automobile/index.ts exists and exports DOMAIN_PROVIDER |
| "DOMAIN_PROVIDER is not exported" | Export missing from domain config | Add `export const DOMAIN_PROVIDER` to automobile.domain-config.ts |
| "Provider[] is not a type" | Missing import | Add `import { Provider } from '@angular/core';` |
| Circular dependency error | Domain imports from framework that imports domain | Check import paths; domain should only import from framework |

---

## Key Takeaways

1. **Domain providers registry centralizes registration** — One file lists all domain providers
2. **The pattern scales to multiple domains** — Add imports and array entries to add domains
3. **Framework code remains unchanged** — New domains only require domain-config changes

---

## Acceptance Criteria

- [ ] `src/app/domain-config/domain-providers.ts` exists
- [ ] File imports `DOMAIN_PROVIDER` from automobile domain
- [ ] `DOMAIN_PROVIDERS` array is exported
- [ ] Array contains automobile domain provider
- [ ] Documentation comments explain the pattern
- [ ] Example shows how to add new domains
- [ ] File compiles without TypeScript errors

---

## Phase 6 Checkpoint

Congratulations! You have completed Phase 6: Automobile Domain Configs.

**What you created:**
| Document | File | Purpose |
|----------|------|---------|
| 601 | automobile.filter-definitions.ts | Query panel filter controls |
| 602 | automobile.table-config.ts | Results table columns and behavior |
| 603 | automobile.picker-configs.ts | Manufacturer-model picker |
| 604 | automobile.query-control-filters.ts | Add filter dialog definitions |
| 605 | automobile.highlight-filters.ts | Chart segmentation filters |
| 606 | automobile.chart-configs.ts | Statistics panel charts |
| 607 | automobile.domain-config.ts | Assembly of all domain pieces |
| 608 | domain-providers.ts | Domain registration |

**The Phase 6 Aha Moment:**

> "Configuration is declarative code. You describe what you want, not how to get it."

You defined filters, tables, pickers, and charts using configuration objects. The framework components (which you'll build in Phase 8) will interpret these configurations to generate the actual UI.

**What's next:**

- Phase 7: Chart Data Sources (documents 651-654) — Transform statistics into Plotly trace format
- Phase 8: Framework Components (documents 801-809) — Build the generic UI components

---

## Next Step

Proceed to `651-manufacturer-chart-source.md` to implement the first chart data source.
