# 103: Routing

**Status:** Planning
**Depends On:** 102-app-shell
**Blocks:** 104-environment-config

---

## Learning Objectives

After completing this section, you will:
- Understand how Angular Router maps URLs to components
- Know how to use `routerLink` for navigation without full page reloads
- Be able to highlight the current route using `routerLinkActive`

---

## Objective

Configure Angular Router with routes for Home, Discover, and Popout pages. Replace the placeholder `href` links with Angular's `routerLink` directive so navigation updates the URL without reloading the page.

---

## Why

The URL is the foundation of our application's state management. Before we build any features, we need the routing skeleton in place. Here's why routing comes early:

### URLs Are State

In traditional web applications, the server generates each page. In a single-page application (SPA), the client handles navigation — but the URL remains the source of truth. When a user bookmarks `/discover?make=Toyota`, they expect to return to that exact view.

This is the core insight of **URL-First State Management**: the URL isn't just an address; it's a serialized representation of application state.

### Why Not Just Use `href`?

Standard HTML links (`<a href="/home">`) work, but they cause problems:

| `href` Behavior | Problem |
|-----------------|---------|
| Full page reload | Loses JavaScript state |
| Server request | Slower navigation |
| Flash of white | Poor user experience |

Angular's `routerLink` directive intercepts clicks and updates the URL without reloading. The Router then renders the appropriate component. This is faster, smoother, and preserves application state.

### Angular Style Guide References

- [Style 04-10](https://angular.io/guide/styleguide#style-04-10): Use redirects for default routes
- [Style 02-05](https://angular.io/guide/styleguide#style-02-05): Suffix routing modules with `-routing`

### URL-First Architecture Reference

See `docs/README.md` for the full URL-First pattern. This section establishes the routing foundation that later sections will build upon.

---

## What

### Step 103.1: Create the Home Component

The Home component is a simple landing page. Create the file `src/app/features/home/home.component.ts`:

```typescript
// src/app/features/home/home.component.ts
// VERSION 1 (Section 103) - Placeholder component

import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  template: `
    <div class="home-container">
      <h1>Welcome to Vvroom</h1>
      <p>Your automobile discovery platform.</p>
      <p>Use the navigation above to explore vehicles.</p>
    </div>
  `,
  styles: [`
    .home-container {
      max-width: 600px;
      margin: 2rem auto;
      text-align: center;
    }

    h1 {
      color: #1976d2;
      margin-bottom: 1rem;
    }

    p {
      color: #666;
      margin-bottom: 0.5rem;
    }
  `]
})
export class HomeComponent {}
```

Delete the `.gitkeep` file since the directory now has real content:

```bash
$ rm src/app/features/home/.gitkeep
```

---

### Step 103.2: Create the Discover Component

The Discover component will eventually display vehicle search results. For now, it's a placeholder. Create `src/app/features/discover/discover.component.ts`:

```typescript
// src/app/features/discover/discover.component.ts
// VERSION 1 (Section 103) - Placeholder component
// This will be replaced with the full discover page in Phase 9

import { Component } from '@angular/core';

@Component({
  selector: 'app-discover',
  template: `
    <div class="discover-container">
      <h1>Discover Vehicles</h1>
      <p>Vehicle search and filtering will appear here.</p>
      <p class="hint">Watch the URL bar as you navigate — this is where state will live.</p>
    </div>
  `,
  styles: [`
    .discover-container {
      max-width: 800px;
      margin: 2rem auto;
    }

    h1 {
      color: #1976d2;
      margin-bottom: 1rem;
    }

    p {
      color: #666;
      margin-bottom: 0.5rem;
    }

    .hint {
      margin-top: 2rem;
      padding: 1rem;
      background-color: #e3f2fd;
      border-left: 4px solid #1976d2;
      color: #1565c0;
    }
  `]
})
export class DiscoverComponent {}
```

Delete the `.gitkeep` file:

```bash
$ rm src/app/features/discover/.gitkeep
```

---

### Step 103.3: Create the Popout Component

The Popout component renders in a separate browser window. It will display panels that users can pop out from the main interface. Create `src/app/features/popout/popout.component.ts`:

```typescript
// src/app/features/popout/popout.component.ts
// VERSION 1 (Section 103) - Placeholder component
// This will be replaced with the full popout implementation in Phase 3B

import { Component } from '@angular/core';

@Component({
  selector: 'app-popout',
  template: `
    <div class="popout-container">
      <h1>Popout Window</h1>
      <p>This component renders in a separate browser window.</p>
      <p>It will display charts and panels that communicate with the main window.</p>
    </div>
  `,
  styles: [`
    .popout-container {
      padding: 1rem;
    }

    h1 {
      color: #1976d2;
      margin-bottom: 1rem;
    }

    p {
      color: #666;
      margin-bottom: 0.5rem;
    }
  `]
})
export class PopoutComponent {}
```

Delete the `.gitkeep` file:

```bash
$ rm src/app/features/popout/.gitkeep
```

---

### Step 103.4: Create the Routing Module

Angular 13 uses a routing module to configure routes. Create `src/app/app-routing.module.ts`:

```typescript
// src/app/app-routing.module.ts
// VERSION 1 (Section 103) - Basic routing configuration

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './features/home/home.component';
import { DiscoverComponent } from './features/discover/discover.component';
import { PopoutComponent } from './features/popout/popout.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'discover', component: DiscoverComponent },
  { path: 'popout', component: PopoutComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
```

**What each route does:**

| Path | Component | Purpose |
|------|-----------|---------|
| `''` | (redirect) | Redirects root URL to `/home` |
| `home` | HomeComponent | Landing page |
| `discover` | DiscoverComponent | Vehicle search (placeholder) |
| `popout` | PopoutComponent | Pop-out window content |

**Why `pathMatch: 'full'`?**

Without `pathMatch: 'full'`, the empty path `''` would match every URL (since every URL starts with nothing). The `pathMatch: 'full'` option ensures the redirect only triggers when the entire URL path is empty.

---

### Step 103.5: Update AppModule

Import the routing module and declare the new components. Open `src/app/app.module.ts` and replace its contents with:

```typescript
// src/app/app.module.ts
// VERSION 2 (Section 103) - With routing and feature components
// Replaces VERSION 1 from Section 101

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './features/home/home.component';
import { DiscoverComponent } from './features/discover/discover.component';
import { PopoutComponent } from './features/popout/popout.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    DiscoverComponent,
    PopoutComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

**What changed:**

| Before | After |
|--------|-------|
| Only `AppComponent` declared | Four components declared |
| Only `BrowserModule` imported | `AppRoutingModule` also imported |

**Why declare components in AppModule?**

In Angular 13 with NgModules, every component must be declared in exactly one module. Since we don't have feature modules yet, all components go in `AppModule`. Later, as the application grows, we might create `HomeModule`, `DiscoverModule`, etc.

---

### Step 103.6: Add Router Outlet to AppComponent

The Router needs a place to render components. Update `src/app/app.component.ts` to add `<router-outlet>` and replace `href` with `routerLink`:

```typescript
// src/app/app.component.ts
// VERSION 3 (Section 103) - With router outlet and routerLink
// Replaces VERSION 2 from Section 102

import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <header class="app-header">
      <div class="app-header-brand">
        <span class="app-header-logo">🚗</span>
        <span class="app-header-title">vvroom</span>
      </div>
      <nav class="app-header-nav">
        <a class="nav-link" routerLink="/home" routerLinkActive="nav-link-active">Home</a>
        <a class="nav-link" routerLink="/discover" routerLinkActive="nav-link-active">Discover</a>
      </nav>
    </header>
    <main class="app-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      height: 56px;
      background-color: #1976d2;
      color: white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .app-header-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .app-header-logo {
      font-size: 1.5rem;
    }

    .app-header-title {
      font-size: 1.25rem;
      font-weight: 600;
      letter-spacing: -0.5px;
    }

    .app-header-nav {
      display: flex;
      gap: 0.5rem;
    }

    .nav-link {
      padding: 0.5rem 1rem;
      color: rgba(255, 255, 255, 0.9);
      text-decoration: none;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .nav-link:hover {
      background-color: rgba(255, 255, 255, 0.1);
      text-decoration: none;
    }

    .nav-link-active {
      background-color: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .app-content {
      flex: 1;
      padding: 1.5rem;
    }
  `]
})
export class AppComponent {}
```

**What changed from VERSION 2:**

| Before | After |
|--------|-------|
| `href="/home"` | `routerLink="/home"` |
| `href="/discover"` | `routerLink="/discover"` |
| Static placeholder text | `<router-outlet></router-outlet>` |
| No active link style | `.nav-link-active` class with `routerLinkActive` |

**Understanding the new directives:**

| Directive | Purpose |
|-----------|---------|
| `routerLink="/home"` | Navigate to `/home` without page reload |
| `routerLinkActive="nav-link-active"` | Add CSS class when this route is active |
| `<router-outlet>` | Placeholder where routed components render |

**Why `routerLinkActive`?**

Users need visual feedback about their current location. The `routerLinkActive` directive automatically adds a CSS class when the link's route matches the current URL. When you navigate to `/home`, the Home link gets the `nav-link-active` class, giving it a slightly different background.

---

### Step 103.7: Understanding Router Outlet

The `<router-outlet>` is a placeholder directive. When the URL changes, Angular:

1. Matches the URL against the routes array
2. Creates an instance of the matching component
3. Inserts the component's view after `<router-outlet>`

**Visual representation:**

When URL is `/home`:
```html
<main class="app-content">
  <router-outlet></router-outlet>
  <app-home>
    <div class="home-container">
      <h1>Welcome to Vvroom</h1>
      ...
    </div>
  </app-home>
</main>
```

When URL is `/discover`:
```html
<main class="app-content">
  <router-outlet></router-outlet>
  <app-discover>
    <div class="discover-container">
      <h1>Discover Vehicles</h1>
      ...
    </div>
  </app-discover>
</main>
```

The component renders as a sibling *after* the outlet, not inside it. This is why we styled `.app-content` rather than `router-outlet` — the outlet itself has no dimensions.

---

## The Aha Moment

**Routes are the skeleton. The URL is where state lives.**

Right now, our routes are simple: `/home`, `/discover`, `/popout`. But watch what happens when you click the navigation links:

1. The URL in your browser's address bar changes
2. The page does *not* reload
3. The content area updates instantly

This is the foundation of URL-First architecture. In later sections, we'll add query parameters to the URL:

```
/discover?make=Toyota&year=2023&page=2
```

Every piece of state — the selected make, the year filter, the current page — will be encoded in the URL. Users can:
- Bookmark their exact search
- Share the URL with colleagues
- Use the browser's back button to undo filter changes
- Refresh without losing their place

The URL becomes a serialized snapshot of application state. This section establishes the routing skeleton that makes all of this possible.

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
main.js                       | main          |  52.18 kB |
polyfills.js                  | polyfills     | 339.16 kB |
runtime.js                    | runtime       |   6.54 kB |
styles.css                    | styles        |   1.23 kB |

Build at: 2026-02-09T17:00:00.000Z - Hash: abc123 - Time: 5000ms
```

Note: `main.js` is slightly larger now because it includes the Router and three new components.

### 2. Serve the Application

```bash
$ ng serve --open
```

Browser opens to `http://localhost:4200`

### 3. Verify Redirect

When you first load `http://localhost:4200`, you should be redirected to `http://localhost:4200/home`. Check the URL bar — it should show `/home`, not just `/`.

### 4. Test Navigation

Click "Discover" in the navigation:
- URL changes to `http://localhost:4200/discover`
- Page does NOT reload (no white flash)
- Content area shows "Discover Vehicles" heading
- "Discover" link is highlighted (slightly brighter background)

Click "Home":
- URL changes to `http://localhost:4200/home`
- Content shows "Welcome to Vvroom"
- "Home" link is highlighted

### 5. Test Browser History

1. Navigate to Home
2. Navigate to Discover
3. Click the browser's back button

Expected: You return to Home without a page reload. The URL updates and the content changes instantly.

### 6. Test Direct URL Access

Open a new browser tab and navigate directly to:
- `http://localhost:4200/discover`

Expected: The Discover page loads directly, with the navigation showing Discover as active.

### 7. Test Popout Route

Navigate to `http://localhost:4200/popout` by typing it in the address bar:

Expected: The Popout placeholder component renders.

### 8. Inspect Active Link Styling

Open browser developer tools (F12), navigate to Home, and inspect the Home link:

```html
<a class="nav-link nav-link-active" ...>Home</a>
```

The `nav-link-active` class should be present.

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| `ng build` fails with "Cannot find module './features/home/home.component'" | Component file not created or wrong path | Verify file exists at `src/app/features/home/home.component.ts` |
| "Error: No component factory found for HomeComponent" | Component not declared in AppModule | Add `HomeComponent` to the `declarations` array |
| Links still cause full page reload | Still using `href` instead of `routerLink` | Replace `href="/home"` with `routerLink="/home"` |
| "Error: Cannot find primary outlet to load 'HomeComponent'" | Missing `<router-outlet>` in template | Add `<router-outlet></router-outlet>` to AppComponent template |
| Active link style not showing | Typo in `routerLinkActive` class name | Ensure the class name matches: `routerLinkActive="nav-link-active"` and `.nav-link-active` in styles |
| Navigating to `/` shows blank content | Redirect not working | Ensure route has `pathMatch: 'full'` on the redirect |
| "NullInjectorError: No provider for Router" | `AppRoutingModule` not imported | Add `AppRoutingModule` to the `imports` array in `AppModule` |

---

## Key Takeaways

1. **`routerLink` replaces `href`** — For SPA navigation without page reloads
2. **`<router-outlet>` is a placeholder** — Routed components render after it, not inside it
3. **`routerLinkActive` provides visual feedback** — Automatically adds a CSS class when the route matches

---

## Acceptance Criteria

- [ ] `src/app/features/home/home.component.ts` exists with placeholder content
- [ ] `src/app/features/discover/discover.component.ts` exists with placeholder content
- [ ] `src/app/features/popout/popout.component.ts` exists with placeholder content
- [ ] `src/app/app-routing.module.ts` configures routes for home, discover, and popout
- [ ] Root path (`/`) redirects to `/home`
- [ ] `src/app/app.module.ts` declares all components and imports `AppRoutingModule`
- [ ] `AppComponent` uses `routerLink` instead of `href`
- [ ] `AppComponent` uses `routerLinkActive` for current route highlighting
- [ ] `AppComponent` includes `<router-outlet>` in the template
- [ ] Navigation works without page reload
- [ ] Browser back/forward buttons work correctly
- [ ] Active link has visual distinction (`.nav-link-active` style applied)
- [ ] `ng build` completes with no errors
- [ ] `ng serve` shows working navigation
- [ ] Pop-out button on Discover page opens `/popout` in a new window

---

## What We Accomplished

| Item | Before | After |
|------|--------|-------|
| Routes | None | Home, Discover, Popout configured |
| Navigation | `href` (full reload) | `routerLink` (SPA navigation) |
| Active state | None | Visual highlight on current route |
| Content area | Static text | Dynamic `<router-outlet>` |
| Components | 1 (AppComponent) | 4 (App, Home, Discover, Popout) |
| URL behavior | Ignored | Foundation for state management |

---

## Architecture Note

All three feature components (Home, Discover, Popout) are **framework components** — they exist regardless of the domain. When we add automobile-specific functionality later:

- `HomeComponent` will remain a generic landing page
- `DiscoverComponent` will become `AutomobileDiscoverComponent` (domain-specific)
- `PopoutComponent` will remain generic (renders any domain's panels)

This separation follows the naming conventions in `053-naming-conventions.md`.

---

---

## Bonus: Pop-Outs Are Just Routes in New Windows

Before moving on, let's demonstrate something important: a pop-out window is nothing more than a route opened in a separate browser window. No special framework features are required — just `window.open()`.

### Step 103.8: Add a Pop-Out Button to Discover

Update `src/app/features/discover/discover.component.ts` to add a button that opens the popout route in a new window:

```typescript
// src/app/features/discover/discover.component.ts
// VERSION 2 (Section 103) - With pop-out button
// Replaces VERSION 1 from earlier in this section

import { Component } from '@angular/core';

@Component({
  selector: 'app-discover',
  template: `
    <div class="discover-container">
      <h1>Discover Vehicles</h1>
      <p>Vehicle search and filtering will appear here.</p>
      <p class="hint">Watch the URL bar as you navigate — this is where state will live.</p>

      <div class="popout-demo">
        <h2>Pop-Out Demo</h2>
        <p>Click the button below to open the popout route in a new window:</p>
        <button class="popout-button" (click)="openPopout()">
          Open Pop-Out Window
        </button>
        <p class="note">
          Notice: the pop-out is just <code>/popout</code> opened in a new window.
          Same Angular app, same routes, different window.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .discover-container {
      max-width: 800px;
      margin: 2rem auto;
    }

    h1 {
      color: #1976d2;
      margin-bottom: 1rem;
    }

    h2 {
      color: #1976d2;
      margin-bottom: 0.5rem;
      font-size: 1.25rem;
    }

    p {
      color: #666;
      margin-bottom: 0.5rem;
    }

    .hint {
      margin-top: 2rem;
      padding: 1rem;
      background-color: #e3f2fd;
      border-left: 4px solid #1976d2;
      color: #1565c0;
    }

    .popout-demo {
      margin-top: 2rem;
      padding: 1.5rem;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    .popout-button {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      background-color: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .popout-button:hover {
      background-color: #1565c0;
    }

    .note {
      margin-top: 1rem;
      font-size: 0.875rem;
      color: #888;
    }

    code {
      background-color: #e8e8e8;
      padding: 0.125rem 0.375rem;
      border-radius: 3px;
      font-family: monospace;
    }
  `]
})
export class DiscoverComponent {
  openPopout(): void {
    const popoutUrl = `${window.location.origin}/popout`;
    window.open(
      popoutUrl,
      'vvroomPopout',
      'width=600,height=400,menubar=no,toolbar=no,location=no,status=no'
    );
  }
}
```

**What the `openPopout()` method does:**

| Line | Purpose |
|------|---------|
| `window.location.origin` | Gets the base URL (e.g., `http://localhost:4200`) |
| `'/popout'` | The route we defined earlier |
| `'vvroomPopout'` | Window name (reuses same window if already open) |
| `'width=600,height=400,...'` | Window features (size, no browser chrome) |

### Verification: Test the Pop-Out

1. Navigate to `http://localhost:4200/discover`
2. Click the "Open Pop-Out Window" button
3. A new browser window opens showing the Popout component
4. The URL in the new window is `http://localhost:4200/popout`

**Key observation:** The pop-out window runs the same Angular application. It just happens to be displaying a different route in a separate window.

### Why This Matters

This simple demonstration reveals the core insight behind pop-out windows:

> **Pop-outs are not special. They're just routes rendered in separate windows.**

In Phase 3B (documents 307-308), we'll add services that enable the main window and pop-out windows to communicate. But the foundation is what you see here: `window.open()` pointing to a route in your application.

When you understand this, the complexity of pop-out panels dissolves. A "pop-out chart" is just:
1. A route that renders a chart component
2. Opened in a new window
3. With a service that syncs state between windows

Steps 1 and 2 are already working. Step 3 comes later.

---

## Next Step

Proceed to `104-environment-config.md` to configure environment settings and verify API connectivity.
