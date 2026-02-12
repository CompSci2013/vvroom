# 101: Project Cleanup

**Status:** Planning
**Depends On:** 000-book-conventions, 051-api-contract-overview
**Blocks:** 102-app-shell

---

## Learning Objectives

After completing this section, you will:
- Understand why removing boilerplate establishes ownership of your codebase
- Know how Angular environment files enable configuration without code changes
- Recognize the directory structure that separates framework code from domain code

---

## Objective

Remove Angular CLI boilerplate and establish the directory structure that will support our URL-First architecture. After this section, you will have a clean foundation ready for building the vvroom application.

---

## Why

When you generate a new Angular project with `ng new`, the CLI creates placeholder content designed to help newcomers verify their setup works. This placeholder content includes:

- A welcome message with the Angular logo
- Links to Angular documentation
- Sample text that has nothing to do with your application

**This is noise.** Every line of code in your project should serve a purpose. Removing boilerplate immediately establishes a professional mindset: you own every line of code in this project, and you understand why it's there.

Additionally, we need to:

1. **Configure the environment** — Set the API base URL so our services know where to fetch data
2. **Establish the directory structure** — Create folders that match our architecture before we need them
3. **Update the HTML title** — Small detail, but professionalism shows in the details

### Angular Style Guide References

- [Style 04-06](https://angular.io/guide/styleguide#style-04-06): Create sub-folders for feature areas
- [Style 04-07](https://angular.io/guide/styleguide#style-04-07): Create a folder for each feature module

---

## What

### Step 101.1: Understand the Current State

Before making changes, examine what the Angular CLI generated. Open a terminal and navigate to your project:

```bash
$ cd ~/projects/vvroom
$ ls -la src/app/
```

You should see:

```
total 16
drwxr-xr-x 2 user user 4096 Feb  9 10:00 .
drwxr-xr-x 5 user user 4096 Feb  9 10:00 ..
-rw-r--r-- 1 user user 1234 Feb  9 10:00 app.component.ts
-rw-r--r-- 1 user user  345 Feb  9 10:00 app.module.ts
```

The current `src/app/app.component.ts` contains placeholder content with an inline template showing a welcome message, the Angular logo, and documentation links. This is what we'll clean up.

---

### Step 101.2: Clean Up AppComponent

Open `src/app/app.component.ts` and replace its entire contents with:

```typescript
// src/app/app.component.ts
// VERSION 1 (Section 101) - Minimal placeholder
// This will be replaced with the full shell in Section 102

import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <h1>vvroom</h1>
    <p>Automobile Discovery Platform</p>
  `,
  styles: []
})
export class AppComponent {}
```

**What changed:**

| Before | After |
|--------|-------|
| 32 lines with placeholder content | 13 lines of clean code |
| `title` property (unused baggage) | No unnecessary properties |
| Inline Angular logo (base64 SVG) | Removed |
| Documentation links | Removed |

**Why this template?**

The simple heading and tagline serve as a "smoke test" — when you run the app, you'll immediately see whether your changes worked. We're not adding navigation or routing yet; that comes in document 102.

---

### Step 101.3: Configure Environment for API Access

Our application will fetch data from the automobile API. Configure the base URL in the environment file.

Open `src/environments/environment.ts` and replace its contents with:

```typescript
// src/environments/environment.ts

export const environment = {
  production: false,
  apiBaseUrl: 'http://generic-prime.minilab/api/specs/v1'
};
```

Now create the production environment file. Open `src/environments/environment.prod.ts` and replace its contents with:

```typescript
// src/environments/environment.prod.ts

export const environment = {
  production: true,
  apiBaseUrl: 'http://generic-prime.minilab/api/specs/v1'
};
```

**Why the same URL for both?**

In this application, development and production use the same API server. In a typical enterprise environment, you might have:

- Development: `http://localhost:3000/api`
- Production: `https://api.yourcompany.com/v1`

The environment file pattern allows this flexibility without changing application code.

---

### Step 101.4: Create Directory Structure

Create the directories that will hold our framework and domain-specific code:

```bash
$ cd ~/projects/vvroom

# Framework directories (domain-agnostic, reusable)
$ mkdir -p src/app/framework/services
$ mkdir -p src/app/framework/models
$ mkdir -p src/app/framework/components
$ mkdir -p src/app/framework/tokens

# Feature directories (page-level components)
$ mkdir -p src/app/features/home
$ mkdir -p src/app/features/discover
$ mkdir -p src/app/features/popout

# Domain configuration (automobile-specific)
$ mkdir -p src/app/domain-config/automobile/models
$ mkdir -p src/app/domain-config/automobile/adapters
$ mkdir -p src/app/domain-config/automobile/configs
$ mkdir -p src/app/domain-config/automobile/chart-sources
```

Verify the structure:

```bash
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

**What do these directories mean?**

| Directory | Purpose | Examples |
|-----------|---------|----------|
| `framework/services` | Domain-agnostic services | `UrlStateService`, `ApiService` |
| `framework/models` | TypeScript interfaces for framework | `DomainConfig`, `ApiResponse` |
| `framework/components` | Reusable UI components | `BaseChartComponent`, `ResultsTableComponent` |
| `framework/tokens` | Angular injection tokens | `DOMAIN_CONFIG`, `IS_POPOUT_TOKEN` |
| `features/*` | Page-level components | `HomeComponent`, `DiscoverComponent` |
| `domain-config/automobile/*` | Automobile-specific configuration | Filters, adapters, chart sources |

This structure directly reflects the architecture described in `053-naming-conventions.md`. Framework code never changes when you add a new domain; only `domain-config/` grows.

---

### Step 101.5: Add Placeholder Files

Empty directories are ignored by git. Add `.gitkeep` files to preserve the structure:

```bash
$ cd ~/projects/vvroom

# Add .gitkeep to each empty directory
$ touch src/app/framework/services/.gitkeep
$ touch src/app/framework/models/.gitkeep
$ touch src/app/framework/components/.gitkeep
$ touch src/app/framework/tokens/.gitkeep
$ touch src/app/features/home/.gitkeep
$ touch src/app/features/discover/.gitkeep
$ touch src/app/features/popout/.gitkeep
$ touch src/app/domain-config/automobile/models/.gitkeep
$ touch src/app/domain-config/automobile/adapters/.gitkeep
$ touch src/app/domain-config/automobile/configs/.gitkeep
$ touch src/app/domain-config/automobile/chart-sources/.gitkeep
```

**Note:** These `.gitkeep` files are a convention, not a git feature. They're empty files that exist solely to make git track otherwise-empty directories. We'll delete them as we add real files to each directory.

---

### Step 101.6: Update Page Title

Open `src/index.html` and verify it has a meaningful title:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Vvroom - Automobile Discovery</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
  <app-root></app-root>
</body>
</html>
```

The only change is the `<title>` tag: from "Vvroom" to "Vvroom - Automobile Discovery".

---

### Step 101.7: Add Base Styles

Open `src/styles.css` and add minimal global styles:

```css
/* src/styles.css */

/* Reset and base styles */
*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: #333;
  background-color: #f5f5f5;
}

h1, h2, h3, h4, h5, h6 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-weight: 500;
  line-height: 1.2;
}

a {
  color: #1976d2;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
```

**Why these styles?**

- `box-sizing: border-box` — Makes width/height calculations predictable (padding included)
- System font stack — Uses the operating system's native font for fast loading and native feel
- Reset margins — Browsers have inconsistent defaults; we normalize them
- Link color — A professional blue that's accessible and familiar

These styles provide a clean foundation. We'll add component-specific styles as we build the UI.

---

## Verification

### 1. Build the Application

```bash
$ cd ~/projects/vvroom
$ ng build
```

Expected output (no errors):

```
✔ Browser application bundle generation complete.
✔ Copying assets complete.
✔ Index html generation complete.

Initial Chunk Files           | Names         |  Raw Size
main.js                       | main          |  47.42 kB |
polyfills.js                  | polyfills     | 339.16 kB |
runtime.js                    | runtime       |   6.54 kB |
styles.css                    | styles        |   1.23 kB |

Build at: 2026-02-09T17:00:00.000Z - Hash: abc123 - Time: 5000ms
```

### 2. Serve the Application

```bash
$ ng serve --open
```

Your browser should open to `http://localhost:4200` showing:

```
vvroom
Automobile Discovery Platform
```

If you see the Angular logo and "Welcome to vvroom!" links, you missed Step 101.2. Go back and update `app.component.ts`.

### 3. Check the Browser Tab

The browser tab should show "Vvroom - Automobile Discovery" (not just "Vvroom").

### 4. Verify Directory Structure

```bash
$ find src/app -type d | wc -l
```

Expected: `16` (the app directory plus 15 subdirectories we created)

### 5. Check Environment Configuration

```bash
$ grep -r "apiBaseUrl" src/environments/
```

Expected output:

```
src/environments/environment.ts:  apiBaseUrl: 'http://generic-prime.minilab/api/specs/v1'
src/environments/environment.prod.ts:  apiBaseUrl: 'http://generic-prime.minilab/api/specs/v1'
```

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| `ng build` fails with "Cannot find module '@angular/core'" | Node modules not installed | Run `npm install` in the project root |
| Browser shows blank page | Template syntax error in `app.component.ts` | Check for missing backticks or quotes in the template |
| "Vvroom" title instead of "Vvroom - Automobile Discovery" | Didn't save `index.html` | Save the file and refresh the browser |
| Directories not created | Typo in `mkdir` command | Re-run the commands carefully; use tab completion |
| `ng serve` shows "Port 4200 is already in use" | Another process using the port | Kill the other process or use `ng serve --port 4201` |

---

## Key Takeaways

1. **Own your code** — Remove boilerplate so every line serves a purpose you understand
2. **Environment files separate configuration from code** — Change URLs without changing TypeScript
3. **Directory structure reflects architecture** — Framework code in `framework/`, domain code in `domain-config/`

---

## Acceptance Criteria

- [ ] `src/app/app.component.ts` contains only the clean template (no Angular logo, no links)
- [ ] Application displays "vvroom" heading and "Automobile Discovery Platform" tagline
- [ ] `src/environments/environment.ts` includes `apiBaseUrl` property
- [ ] `src/environments/environment.prod.ts` includes `apiBaseUrl` property
- [ ] Directory structure created: `framework/`, `features/`, `domain-config/`
- [ ] All directories contain `.gitkeep` placeholder files
- [ ] Browser tab shows "Vvroom - Automobile Discovery"
- [ ] `src/styles.css` contains base reset styles
- [ ] `ng build` completes with no errors
- [ ] `ng serve` shows the clean application

---

## What We Accomplished

| Item | Before | After |
|------|--------|-------|
| AppComponent | 32 lines of boilerplate | 13 lines of clean code |
| Environment config | No API URL | API URL configured |
| Directory structure | Flat `src/app/` | Organized by architecture |
| Page title | Generic "Vvroom" | Descriptive "Vvroom - Automobile Discovery" |
| Global styles | Empty | Professional base styles |

---

## Next Step

Proceed to `102-app-shell.md` to build the application shell with navigation layout.
