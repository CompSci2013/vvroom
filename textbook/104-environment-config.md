# 104: Environment Config Verification

**Status:** Planning
**Depends On:** 103-routing
**Blocks:** 150-typescript-generics-primer

---

## Learning Objectives

After completing this section, you will:
- Understand how Angular's environment files enable build-time configuration
- Know how to verify your project compiles and runs correctly
- Recognize that Phase 1 establishes the foundation for all subsequent work

---

## Objective

Verify the environment configuration from Section 101 and confirm the Phase 1 foundation is complete. This section is a consolidation checkpoint — ensuring everything from Sections 101-103 works together before proceeding to framework development.

---

## Why

### Checkpoints Prevent Cascading Errors

Before building framework services and components, we must confirm the foundation is solid. A misconfigured environment or broken route will cause confusing errors later. It's easier to diagnose problems in isolation than to debug a broken service that depends on three other broken things.

### The Phase 1 Checkpoint

Document 002 (Dissection Rubric) defines this checkpoint:

> **Phase 1 Checkpoint:** Navigation between empty pages works. Browser history works. Readers observe URL changes in dev tools.

This section verifies we've achieved that checkpoint.

---

## What

### Step 104.1: Verify Environment Files

The environment files should already exist from Section 101. Confirm their contents.

Open `src/environments/environment.ts` and verify it contains:

```typescript
// src/environments/environment.ts

export const environment = {
  production: false,
  apiBaseUrl: 'http://generic-prime.minilab/api/specs/v1'
};
```

Open `src/environments/environment.prod.ts` and verify it contains:

```typescript
// src/environments/environment.prod.ts

export const environment = {
  production: true,
  apiBaseUrl: 'http://generic-prime.minilab/api/specs/v1'
};
```

If these files don't match, update them now. The `apiBaseUrl` property will be used by services in Phase 3.

---

### Step 104.2: Understand Build-Time File Replacement

Angular's build system replaces environment files at build time. This is configured in `angular.json`:

```json
"configurations": {
  "production": {
    "fileReplacements": [
      {
        "replace": "src/environments/environment.ts",
        "with": "src/environments/environment.prod.ts"
      }
    ]
  }
}
```

When you run `ng build --configuration=production`, Angular swaps `environment.ts` for `environment.prod.ts`. Your code always imports from `environment.ts`, but the actual values come from the appropriate file.

**This is not runtime configuration.** The values are baked into the compiled JavaScript bundle. To change the API URL, you must rebuild.

---

### Step 104.3: Verify Project Structure

Run the following command to confirm the directory structure from Section 101:

```bash
$ cd ~/projects/vvroom
$ find src/app -type d | sort
```

Expected output:

```
src/app
src/app/domain-config
src/app/domain-config/automobile
src/app/domain-config/automobile/adapters
src/app/domain-config/automobile/chart-sources
src/app/domain-config/automobile/configs
src/app/domain-config/automobile/models
src/app/features
src/app/features/discover
src/app/features/home
src/app/features/popout
src/app/framework
src/app/framework/components
src/app/framework/models
src/app/framework/services
src/app/framework/tokens
```

If directories are missing, create them using the commands from Section 101.

---

### Step 104.4: Verify Component Files

Confirm the feature components from Section 103 exist:

```bash
$ ls -la src/app/features/*/
```

Expected output:

```
src/app/features/discover/:
discover.component.ts

src/app/features/home/:
home.component.ts

src/app/features/popout/:
popout.component.ts
```

---

### Step 104.5: Build and Serve

Run the build to confirm everything compiles:

```bash
$ cd ~/projects/vvroom
$ ng build
```

Expected: Build succeeds with no errors.

Start the development server:

```bash
$ ng serve
```

Open your browser to `http://localhost:4200`.

---

### Step 104.6: Execute Phase 1 Checkpoint Tests

Perform each test manually:

**Test 1: Root Redirect**
1. Navigate to `http://localhost:4200`
2. Observe: URL changes to `http://localhost:4200/home`
3. Observe: Home component content displays

**Test 2: Navigation Without Reload**
1. Click "Discover" in the navigation
2. Observe: URL changes to `/discover`
3. Observe: Page does NOT reload (no white flash)
4. Observe: Discover component content displays

**Test 3: Active Link Highlighting**
1. While on `/discover`, observe: "Discover" link has brighter background
2. Click "Home"
3. Observe: "Home" link now has brighter background

**Test 4: Browser History**
1. Navigate: Home → Discover → Home → Discover
2. Click browser back button
3. Observe: Returns to Home without reload
4. Click browser forward button
5. Observe: Returns to Discover without reload

**Test 5: Direct URL Access**
1. Open new tab
2. Navigate directly to `http://localhost:4200/discover`
3. Observe: Discover page loads correctly
4. Observe: "Discover" link is highlighted

**Test 6: Popout Route**
1. Navigate to `http://localhost:4200/popout`
2. Observe: Popout component content displays

---

## Phase 1 Complete

You have successfully completed Phase 1: Foundation. Your application now has:

| Capability | Status |
|------------|--------|
| Clean project structure | Ready for framework and domain code |
| Environment configuration | API URL configured for both dev and prod |
| App shell with navigation | Header, content area, flexbox layout |
| Angular Router | Routes for Home, Discover, Popout |
| SPA navigation | No page reloads when clicking links |
| Browser history integration | Back/forward buttons work |
| Active route highlighting | Visual feedback for current location |

### The Phase 1 Aha Moment

**Routes are the skeleton. The URL is where state lives.**

Right now, your URLs are simple paths: `/home`, `/discover`, `/popout`. In Phase 3, we'll add services that read and write query parameters:

```
/discover?make=Toyota&year=2023&bodyClass=SUV&page=2
```

Every filter selection, every page navigation, every user choice will be encoded in the URL. This is URL-First State Management — and Phase 1 established the routing skeleton that makes it possible.

---

## Verification

All verification is covered in Step 104.6. If any test fails, review the relevant section:

| Failed Test | Review Section |
|-------------|----------------|
| Root redirect | 103, Step 103.4 (routes) |
| Navigation reloads page | 103, Step 103.6 (routerLink) |
| Active link not highlighted | 103, Step 103.6 (routerLinkActive) |
| Browser history broken | 103, Step 103.5 (AppRoutingModule) |
| Direct URL access fails | 103, Step 103.4 (routes) |
| Build errors | 101, 102, 103 (various) |

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| Build fails with environment error | `apiBaseUrl` not added to environment files | Update both environment files per Step 104.1 |
| Missing directories | Section 101 steps skipped | Run mkdir commands from Section 101 |
| Component files missing | Section 103 steps skipped | Create components per Section 103 |
| Tests pass locally but not described here | You're ahead of the manuscript | Great! Continue to the next section |

---

## Key Takeaways

1. **Environment files are build-time configuration** — Values are baked into the bundle, not loaded at runtime
2. **Checkpoints prevent cascading errors** — Verify the foundation before building on it
3. **Phase 1 establishes the routing skeleton** — All URL-First state management builds on this foundation

---

## Acceptance Criteria

- [ ] `src/environments/environment.ts` contains `apiBaseUrl`
- [ ] `src/environments/environment.prod.ts` contains `apiBaseUrl`
- [ ] Directory structure matches expected layout
- [ ] All three feature components exist (Home, Discover, Popout)
- [ ] `ng build` succeeds with no errors
- [ ] `ng serve` starts without errors
- [ ] Root URL redirects to `/home`
- [ ] Navigation works without page reload
- [ ] Active links are visually highlighted
- [ ] Browser back/forward buttons work
- [ ] Direct URL access works for all routes

---

## What We Accomplished

| Phase 1 Document | Content |
|------------------|---------|
| 101: Project Cleanup | Removed boilerplate, created directories, configured environment |
| 102: App Shell | Built header, navigation, content area with flexbox layout |
| 103: Routing | Configured Router, created components, added routerLink |
| 104: Verification | Confirmed all pieces work together |

---

## Next Step

Proceed to `150-typescript-generics-primer.md` (Interlude A) to build foundational understanding of TypeScript generics before tackling the framework models in Phase 2.
