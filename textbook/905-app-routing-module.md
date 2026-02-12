# 905: App Routing Module

**Status:** Planning
**Depends On:** 901-home-component, 902-automobile-landing-component, 903-discover-page-component, 904-popout-component
**Blocks:** 906-app-module

---

## Learning Objectives

After completing this section, you will:
- Understand how to configure Angular Router with lazy loading for feature modules
- Know how to structure routes with nested children for complex navigation
- Be able to implement route guards and redirects for improved UX

---

## Objective

Configure the application's routing module to connect all feature components into a cohesive, navigable application. This is where the individual pieces we've built come together as a unified experience.

---

## Why

The routing module is the skeleton of your application. It defines:

1. **Navigation Paths** — What URLs map to which components
2. **Loading Strategy** — Which features load immediately vs. on demand
3. **User Experience** — Default routes, redirects, and error handling

### Angular Router Key Concepts

| Concept | Purpose |
|---------|---------|
| `Routes` | Array of route configurations |
| `RouterModule.forRoot()` | Configures router at application level |
| `loadChildren` | Lazy-loads a feature module on navigation |
| `redirectTo` | Redirects one path to another |
| `pathMatch` | Determines how path is matched ('full' or 'prefix') |

### Angular Style Guide References

- [Style 04-10](https://angular.io/guide/styleguide#style-04-10): Use redirects for default routes
- [Style 04-11](https://angular.io/guide/styleguide#style-04-11): Consider lazy loading for large features

### URL-First Architecture

The router is central to URL-First architecture. Every view in the application corresponds to a URL, and the URL is the source of truth for application state. The routing module defines what those URLs are.

---

## What

### Step 905.1: Create the App Routing Module

Create `src/app/app-routing.module.ts`:

```typescript
// src/app/app-routing.module.ts
// VERSION 1 (Section 905) - Complete application routing configuration

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

/**
 * Application Routes Configuration
 *
 * Defines all navigation paths for the vvroom application.
 * Uses lazy loading for feature modules to improve initial load time.
 *
 * Route Structure:
 * - / (root): Redirects to /home
 * - /home: Home landing page
 * - /automobiles: Automobile domain landing
 * - /automobiles/discover: Main discovery interface
 * - /popout/:gridId/:componentId/:type: Pop-out window routes
 */
const routes: Routes = [
  // Default route - redirect to home
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },

  // Home page (eager loaded for instant landing)
  {
    path: 'home',
    loadChildren: () => import('./features/home/home.module')
      .then(m => m.HomeModule)
  },

  // Automobile domain routes (lazy loaded)
  {
    path: 'automobiles',
    loadChildren: () => import('./features/automobile/automobile.module')
      .then(m => m.AutomobileModule)
  },

  // Pop-out window routes (lazy loaded)
  {
    path: 'popout/:gridId/:componentId',
    loadChildren: () => import('./features/popout/popout.module')
      .then(m => m.PopoutModule)
  },

  // Wildcard route - redirect unknown paths to home
  {
    path: '**',
    redirectTo: 'home'
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      // Enable URL fragment scrolling
      anchorScrolling: 'enabled',
      // Scroll to top on navigation
      scrollPositionRestoration: 'enabled',
      // Preserve query params on redirect (important for URL-First)
      paramsInheritanceStrategy: 'always'
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
```

**Route configuration explained:**

| Route | Purpose | Loading Strategy |
|-------|---------|------------------|
| `''` | Root path, redirects to home | Immediate redirect |
| `'home'` | Home landing page | Lazy loaded |
| `'automobiles'` | Automobile feature area | Lazy loaded |
| `'popout/:gridId/:componentId'` | Pop-out windows | Lazy loaded |
| `'**'` | Catch-all for unknown routes | Redirect to home |

---

### Step 905.2: Update Feature Modules for Routing

Each feature module needs internal routes. Update the modules created earlier.

#### Update Home Module

Update `src/app/features/home/home.module.ts`:

```typescript
// src/app/features/home/home.module.ts
// VERSION 2 (Section 905) - Add routing configuration
// Replaces VERSION 1 from Section 901

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './home.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  }
];

@NgModule({
  declarations: [
    HomeComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class HomeModule {}
```

#### Update Automobile Module

Update `src/app/features/automobile/automobile.module.ts`:

```typescript
// src/app/features/automobile/automobile.module.ts
// VERSION 3 (Section 905) - Add routing configuration
// Replaces VERSION 2 from Section 903

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { AutomobileComponent } from './automobile.component';
import { AutomobileDiscoverComponent } from './automobile-discover/automobile-discover.component';

// Framework component imports (from Phase 8)
import { QueryControlModule } from '../../framework/components/query-control/query-control.module';
import { BasePickerModule } from '../../framework/components/base-picker/base-picker.module';
import { StatisticsPanel2Module } from '../../framework/components/statistics-panel-2/statistics-panel-2.module';
import { BaseChartModule } from '../../framework/components/base-chart/base-chart.module';
import { DynamicResultsTableModule } from '../../framework/components/dynamic-results-table/dynamic-results-table.module';

const routes: Routes = [
  {
    path: '',
    component: AutomobileComponent
  },
  {
    path: 'discover',
    component: AutomobileDiscoverComponent
  }
];

@NgModule({
  declarations: [
    AutomobileComponent,
    AutomobileDiscoverComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    // Framework component modules
    QueryControlModule,
    BasePickerModule,
    StatisticsPanel2Module,
    BaseChartModule,
    DynamicResultsTableModule
  ]
})
export class AutomobileModule {}
```

---

### Step 905.3: Understanding Route Parameters

The pop-out route uses parameters to identify what component to show:

```
/popout/:gridId/:componentId/:type
        │       │            │
        │       │            └── Component type (chart, picker, etc.)
        │       └── Unique panel identifier
        └── Source grid identifier (e.g., automobile-discover)
```

**Example URLs:**

| URL | Meaning |
|-----|---------|
| `/popout/automobile-discover/chart-year/chart` | Year chart from automobile discover |
| `/popout/automobile-discover/query-control/query-control` | Query control panel |
| `/popout/automobile-discover/results-table/basic-results` | Results table |

The PopoutComponent extracts these parameters to:
1. Set the correct domain (`automobile`)
2. Initialize BroadcastChannel with the right ID (`chart-year`)
3. Load the appropriate child component via router

---

### Step 905.4: Update AppComponent for Router Outlet

Ensure `src/app/app.component.ts` includes the router outlet:

```typescript
// src/app/app.component.ts
// VERSION 3 (Section 905) - Router outlet support
// Replaces VERSION 2 from Section 102

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

/**
 * Root Application Component
 *
 * Main container for the vvroom application. Provides:
 * - Application shell with header navigation
 * - Router outlet for feature components
 * - Pop-out detection to hide header in pop-out windows
 */
@Component({
  selector: 'app-root',
  template: `
    <!-- Navigation Header (hidden in pop-outs) -->
    <header class="app-header" *ngIf="!isPopOut">
      <div class="app-header-brand">
        <a routerLink="/home" class="brand-link">
          <span class="app-header-logo">🚗</span>
          <span class="app-header-title">vvroom</span>
        </a>
      </div>
      <nav class="app-header-nav">
        <a routerLink="/home" routerLinkActive="active" class="nav-link">Home</a>
        <a routerLink="/automobiles" routerLinkActive="active" class="nav-link">Automobiles</a>
      </nav>
    </header>

    <!-- Main Content Area -->
    <main class="app-content" [class.popout-content]="isPopOut">
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
    }

    .brand-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: white;
      text-decoration: none;
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
    }

    .nav-link.active {
      background-color: rgba(255, 255, 255, 0.2);
    }

    .app-content {
      flex: 1;
      background: #f5f5f5;
    }

    .popout-content {
      padding: 0;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  isPopOut = false;
  private destroy$ = new Subject<void>();

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Check if current route is a pop-out
    this.isPopOut = this.router.url.startsWith('/popout');

    // Watch for route changes
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(event => {
      this.isPopOut = event.urlAfterRedirects.startsWith('/popout');
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**Key features:**

| Feature | Purpose |
|---------|---------|
| `*ngIf="!isPopOut"` | Hides header in pop-out windows |
| `routerLinkActive="active"` | Highlights current route in navigation |
| `[class.popout-content]` | Removes padding for pop-out content |
| Route change detection | Updates `isPopOut` on navigation |

---

### Step 905.5: Router Configuration Options

The `RouterModule.forRoot()` options we used:

```typescript
RouterModule.forRoot(routes, {
  anchorScrolling: 'enabled',
  scrollPositionRestoration: 'enabled',
  paramsInheritanceStrategy: 'always'
})
```

| Option | Purpose |
|--------|---------|
| `anchorScrolling` | Enables scrolling to `#fragment` anchors |
| `scrollPositionRestoration` | Scrolls to top when navigating between routes |
| `paramsInheritanceStrategy: 'always'` | Query params available in all child routes |

The `paramsInheritanceStrategy` is particularly important for URL-First architecture — it ensures query parameters are accessible throughout the component tree.

---

## Verification

### 1. Build the Application

```bash
$ ng build
```

Expected: Build succeeds with no errors.

### 2. Serve and Navigate

```bash
$ ng serve --open
```

Test these navigation paths:

| Action | Expected Result |
|--------|-----------------|
| Open `http://localhost:4200` | Redirects to `/home` |
| Click "Automobiles" in header | Navigates to `/automobiles` |
| Click "Advanced Search" card | Navigates to `/automobiles/discover` |
| Click "Home" in header | Returns to `/home` |
| Enter unknown URL like `/foo` | Redirects to `/home` |

### 3. Verify Lazy Loading

Open browser DevTools (Network tab) and observe:

1. Initial load: Only main bundle and home module
2. Navigate to `/automobiles`: Automobile module loads
3. Navigate to `/automobiles/discover`: No additional load (same module)

### 4. Check Router Link Active

The navigation link for the current route should have the `active` class applied, showing a slightly different background color.

### 5. Verify Query Param Persistence

1. Navigate to `/automobiles/discover?manufacturer=Toyota`
2. Note the query parameter in URL
3. Refresh the page
4. Query parameter should persist

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| "Cannot find module" error | Import path wrong | Verify feature module paths are correct |
| Blank page on navigation | Component not declared in module | Add component to module's declarations |
| Query params lost on navigation | Wrong `paramsInheritanceStrategy` | Set to `'always'` in RouterModule.forRoot |
| Pop-out routes not loading | Missing route parameters | Verify URL includes gridId and componentId |
| "No provider" errors | Services not provided | Add providers to feature module or app module |
| Redirect loops | Conflicting route definitions | Check for multiple matching paths |

---

## Key Takeaways

1. **Lazy loading improves performance** — Feature modules load only when needed
2. **Route parameters enable dynamic content** — The pop-out route uses params to determine what to show
3. **RouterModule.forRoot() vs forChild()** — `forRoot()` at app level, `forChild()` in feature modules

---

## Acceptance Criteria

- [ ] `AppRoutingModule` configures all application routes
- [ ] Root path (`/`) redirects to `/home`
- [ ] Home, Automobile, and Popout routes are lazy loaded
- [ ] Unknown routes (`**`) redirect to home
- [ ] Feature modules define their internal routes with `RouterModule.forChild()`
- [ ] `AppComponent` hides header for pop-out routes
- [ ] `routerLinkActive` highlights current navigation item
- [ ] Query parameters persist across navigation
- [ ] `ng build` completes without errors
- [ ] Navigation between all routes works correctly

---

## Architecture Note: Route Hierarchy

The complete route structure:

```
/
├── home                          → HomeComponent
├── automobiles                   → AutomobileComponent
│   └── discover                  → AutomobileDiscoverComponent
└── popout/:gridId/:componentId
    ├── query-control             → QueryControlComponent
    ├── picker                    → BasePickerComponent
    ├── chart                     → BaseChartComponent
    ├── basic-results             → DynamicResultsTableComponent
    └── statistics-2              → StatisticsPanel2Component
```

This hierarchy reflects the application's information architecture:
- Top level: Application areas (home, automobiles, popout)
- Second level: Features within areas (landing, discover)
- Pop-out level: Individual components in isolation

---

## Next Step

Proceed to `906-app-module.md` to configure the root AppModule with all necessary imports, providers, and bootstrap configuration.
