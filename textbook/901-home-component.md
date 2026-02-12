# 901: Home Component

**Status:** Planning
**Depends On:** 102-app-shell, 103-routing
**Blocks:** 907-final-integration

---

## Learning Objectives

After completing this section, you will:
- Understand how to create a landing page component that serves as a domain hub
- Know how to use Angular's `RouterModule` for in-app navigation links
- Be able to apply CSS Grid to create responsive card layouts

---

## Objective

Build the Home component — the application's main entry point that welcomes users and provides navigation to the automobile discovery features. This component establishes the visual identity of vvroom and guides users to explore automobile data.

---

## Why

Every application needs a home base. The Home component serves several critical purposes:

1. **First Impression** — Users land here first; it sets expectations for the entire application
2. **Navigation Hub** — Provides clear pathways to key features without overwhelming users
3. **Domain Introduction** — Explains what the application does before diving into specifics

### Angular Style Guide References

- [Style 02-01](https://angular.io/guide/styleguide#style-02-01): Use consistent naming conventions (`home.component.ts`)
- [Style 04-07](https://angular.io/guide/styleguide#style-04-07): Create a folder for each feature component

### Design Principles

The Home component is intentionally simple. It contains no business logic, no API calls, and no complex state management. It's pure presentation:

- Static content
- Navigation links
- Visual styling

This simplicity is deliberate. The Home component should load instantly and never fail. It's the fallback when something goes wrong elsewhere.

---

## What

### Step 901.1: Create the Home Component Directory

First, ensure the home feature directory exists:

```bash
$ cd ~/projects/vvroom
$ mkdir -p src/app/features/home
```

---

### Step 901.2: Create the Home Component

Create `src/app/features/home/home.component.ts`:

```typescript
// src/app/features/home/home.component.ts
// VERSION 1 (Section 901) - Complete home component with navigation

import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

/**
 * Home Component - Landing Page
 *
 * Serves as the main entry point for the vvroom application.
 * Provides navigation to the automobile discovery features.
 *
 * This component is intentionally simple - pure presentation
 * with no business logic or state management.
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {}
```

**What this code does:**

| Element | Purpose |
|---------|---------|
| `selector: 'app-home'` | The HTML tag used to render this component |
| `templateUrl` | External HTML file for better separation of concerns |
| `styleUrls` | External SCSS file for component-specific styles |
| Empty class body | No logic needed — this is pure presentation |

---

### Step 901.3: Create the Home Component Template

Create `src/app/features/home/home.component.html`:

```html
<!-- src/app/features/home/home.component.html -->
<!-- VERSION 1 (Section 901) - Home page with domain navigation -->

<div class="home-container">
  <!-- Header Section -->
  <div class="header">
    <h1>Vvroom</h1>
    <p class="subtitle">Automobile Discovery Platform</p>
  </div>

  <!-- Domain Cards Section -->
  <div class="domains-section">
    <h2>Explore Data</h2>
    <div class="domain-grid">
      <a routerLink="/automobiles" class="domain-card">
        <div class="card-icon">🚗</div>
        <h3>Automobiles</h3>
        <p>Browse and analyze vehicle data from thousands of manufacturers</p>
      </a>
    </div>
  </div>

  <!-- Quick Start Section -->
  <div class="quickstart-section">
    <h2>Quick Start</h2>
    <div class="quickstart-grid">
      <div class="quickstart-card">
        <div class="step-number">1</div>
        <h4>Select a Domain</h4>
        <p>Click on Automobiles above to begin exploring vehicle data</p>
      </div>
      <div class="quickstart-card">
        <div class="step-number">2</div>
        <h4>Apply Filters</h4>
        <p>Use the query panel to narrow down results by manufacturer, year, and more</p>
      </div>
      <div class="quickstart-card">
        <div class="step-number">3</div>
        <h4>Analyze Results</h4>
        <p>View charts, statistics, and detailed data tables</p>
      </div>
    </div>
  </div>
</div>
```

**Template structure explained:**

| Section | Purpose |
|---------|---------|
| `.header` | Application branding and tagline |
| `.domains-section` | Navigation cards to feature areas |
| `.quickstart-section` | User guidance for first-time visitors |

**Note on `routerLink`:** The `routerLink` directive from `RouterModule` creates navigation links that work with Angular's router. Unlike regular `href` attributes, `routerLink` doesn't cause a full page reload — it performs client-side navigation.

---

### Step 901.4: Create the Home Component Styles

Create `src/app/features/home/home.component.scss`:

```scss
// src/app/features/home/home.component.scss
// VERSION 1 (Section 901) - Home page styles

.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

// Header styles
.header {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem 0;

  h1 {
    font-size: 3rem;
    font-weight: 700;
    color: #1976d2;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    font-size: 1.25rem;
    color: #666;
    margin: 0;
  }
}

// Domain cards section
.domains-section {
  margin-bottom: 3rem;

  h2 {
    font-size: 1.5rem;
    color: #333;
    margin-bottom: 1.5rem;
    text-align: center;
  }
}

.domain-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  justify-items: center;
}

.domain-card {
  display: block;
  background: white;
  border-radius: 12px;
  padding: 2rem;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  max-width: 320px;
  width: 100%;
  text-align: center;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    text-decoration: none;
  }

  .card-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  h3 {
    font-size: 1.25rem;
    color: #1976d2;
    margin-bottom: 0.5rem;
  }

  p {
    font-size: 0.9rem;
    color: #666;
    margin: 0;
    line-height: 1.5;
  }
}

// Quick start section
.quickstart-section {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 2rem;

  h2 {
    font-size: 1.5rem;
    color: #333;
    margin-bottom: 1.5rem;
    text-align: center;
  }
}

.quickstart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.quickstart-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;

  .step-number {
    width: 40px;
    height: 40px;
    background: #1976d2;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 auto 1rem;
  }

  h4 {
    font-size: 1rem;
    color: #333;
    margin-bottom: 0.5rem;
  }

  p {
    font-size: 0.875rem;
    color: #666;
    margin: 0;
    line-height: 1.4;
  }
}
```

**CSS techniques used:**

| Technique | Purpose |
|-----------|---------|
| `max-width` + `margin: auto` | Centers content with a maximum width |
| CSS Grid with `auto-fit` | Creates responsive columns that adapt to screen size |
| `translateY` on hover | Provides visual lift effect for interactive cards |
| `box-shadow` transitions | Smooth shadow changes on interaction |
| SCSS nesting | Keeps related styles organized and readable |

---

### Step 901.5: Register the Home Component in a Feature Module

For Angular 13 with NgModules, create a module for the home feature.

Create `src/app/features/home/home.module.ts`:

```typescript
// src/app/features/home/home.module.ts
// VERSION 1 (Section 901) - Home feature module

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { HomeComponent } from './home.component';

@NgModule({
  declarations: [
    HomeComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [
    HomeComponent
  ]
})
export class HomeModule {}
```

**Module structure explained:**

| Property | Purpose |
|----------|---------|
| `declarations` | Components that belong to this module |
| `imports` | Other modules this module depends on |
| `exports` | Components available to other modules that import HomeModule |

---

### Step 901.6: Create the Index Barrel Export

Create `src/app/features/home/index.ts`:

```typescript
// src/app/features/home/index.ts
// VERSION 1 (Section 901) - Barrel export for home feature

export * from './home.component';
export * from './home.module';
```

This barrel export allows clean imports elsewhere in the application:

```typescript
import { HomeComponent, HomeModule } from './features/home';
```

---

## Verification

### 1. Check File Structure

```bash
$ find src/app/features/home -type f | sort
```

Expected output:

```
src/app/features/home/home.component.html
src/app/features/home/home.component.scss
src/app/features/home/home.component.ts
src/app/features/home/home.module.ts
src/app/features/home/index.ts
```

### 2. Build the Application

```bash
$ ng build
```

Expected: Build succeeds with no errors. If you see errors about missing routes, that's expected — we'll configure routing in document 905.

### 3. Visual Verification (After Routing)

Once routing is configured (document 905), navigate to `http://localhost:4200/home`:

- Large "Vvroom" heading with blue color
- "Automobile Discovery Platform" subtitle
- Single domain card for Automobiles
- Three quick-start steps at the bottom
- Card lifts on hover with shadow effect

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| Component not found error | Module not imported in AppModule | Add `HomeModule` to AppModule imports (done in document 906) |
| `routerLink` not working | RouterModule not imported | Ensure `RouterModule` is in the HomeModule imports |
| Styles not applying | Wrong file path in `styleUrls` | Verify the path matches the actual file location |
| Emoji not displaying | System font issue | Use an SVG icon instead, or accept platform variation |
| Grid layout broken | Browser doesn't support CSS Grid | Add fallback styles or use flexbox for older browsers |

---

## Key Takeaways

1. **Feature components live in feature folders** — `src/app/features/home/` keeps all home-related files together
2. **Simple components are powerful** — The Home component has no logic but serves a critical role
3. **CSS Grid enables responsive layouts** — `auto-fit` and `minmax` create layouts that adapt to any screen size

---

## Acceptance Criteria

- [ ] `src/app/features/home/home.component.ts` exists with proper decorator configuration
- [ ] `src/app/features/home/home.component.html` contains header, domain card, and quickstart sections
- [ ] `src/app/features/home/home.component.scss` contains responsive grid layout styles
- [ ] `src/app/features/home/home.module.ts` declares and exports HomeComponent
- [ ] `src/app/features/home/index.ts` provides barrel exports
- [ ] Component uses `routerLink` for navigation (not `href`)
- [ ] `ng build` completes without errors

---

## Architecture Note

The Home component exemplifies the separation between **feature components** and **framework components**:

- **Feature components** (like Home) are page-level, application-specific
- **Framework components** (from Phase 8) are reusable across any domain

The Home component contains no domain logic — it's pure navigation and branding. This means:

- It loads instantly (no API calls)
- It never fails (no dependencies)
- It can be tested in isolation

This pattern will repeat for other feature components: they orchestrate framework components and provide page-level structure.

---

## Next Step

Proceed to `902-automobile-landing-component.md` to build the automobile domain's landing page.
