# 102: App Shell

**Status:** Planning
**Depends On:** 101-project-cleanup
**Blocks:** 103-routing

---

## Learning Objectives

After completing this section, you will:
- Understand the container/presentational component pattern for application layout
- Know how to use the `:host` CSS selector to style Angular components
- Be able to create a flexbox-based full-viewport layout

---

## Objective

Build the application shell — the outermost structural component that provides consistent navigation and layout across all pages. After this section, you'll have a header with navigation links and a content area where routed components will render.

---

## Why

Every web application needs a shell: a consistent frame that surrounds page content. The shell typically includes:

- **Header** — Application name/logo and primary navigation
- **Content area** — Where page-specific content renders
- **Optional footer** — Copyright, links, version info

Building the shell before routing has practical benefits:

1. **Visual confirmation** — You see the navigation structure before wiring it up
2. **Router outlet placement** — You know exactly where routed content will appear
3. **Separation of concerns** — Layout logic stays in AppComponent; page logic stays in feature components

### Angular Style Guide References

- [Style 02-01](https://angular.io/guide/styleguide#style-02-01): Use consistent naming for components
- [Style 05-03](https://angular.io/guide/styleguide#style-05-03): Put presentation logic in the component class

### URL-First Architecture Reference

The shell is framework code — it doesn't change when you add new domains. The navigation links will eventually include domain-specific routes, but the shell structure remains constant.

---

## What

### Step 102.1: Design the Shell Layout

Before writing code, understand what we're building:

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER                                                          │
│  ┌─────────┐  ┌──────────────────────────────────────────────┐  │
│  │  vvroom  │  │  Home  │  Discover  │                        │  │
│  └─────────┘  └──────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CONTENT AREA (router-outlet renders here)                       │
│                                                                  │
│                                                                  │
│                                                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

The shell has two parts:
1. **Header** — Fixed at the top, contains logo and navigation
2. **Main content** — Takes remaining vertical space, contains `<router-outlet>`

---

### Step 102.2: Update AppComponent with Shell Structure

Open `src/app/app.component.ts` and replace its contents with:

```typescript
// src/app/app.component.ts
// VERSION 2 (Section 102) - Shell with navigation
// Replaces VERSION 1 from Section 101

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
        <a class="nav-link" href="/home">Home</a>
        <a class="nav-link" href="/discover">Discover</a>
      </nav>
    </header>
    <main class="app-content">
      <p>Content will appear here once routing is configured.</p>
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

    .app-content {
      flex: 1;
      padding: 1.5rem;
    }
  `]
})
export class AppComponent {}
```

**What this code does:**

| Element | Purpose |
|---------|---------|
| `:host` | Styles the component itself as a flex column taking full viewport height |
| `.app-header` | Blue header bar with flexbox layout |
| `.app-header-brand` | Logo and title grouped together |
| `.app-header-nav` | Navigation links aligned to the right |
| `.nav-link` | Styled anchor tags with hover effect |
| `.app-content` | Main content area with `flex: 1` to fill remaining space |

**Why inline styles?**

For small components, inline styles in the `styles` array keep everything in one file. This follows Angular's recommendation for simple components. We'll extract styles to separate files for larger components later.

**Note on the emoji:** We're using 🚗 as a temporary logo. In a production application, you'd use an SVG or image file. The emoji works fine for learning.

---

### Step 102.3: Understand the Navigation Links (Temporary)

Notice the navigation links use plain `href` attributes:

```html
<a class="nav-link" href="/home">Home</a>
<a class="nav-link" href="/discover">Discover</a>
```

**This is intentional but temporary.** These are standard HTML links that cause a full page reload. In the next document (103-routing), we'll:

1. Import `RouterModule`
2. Replace `href` with `routerLink`
3. Add `routerLinkActive` for highlighting the current route

For now, clicking these links will show a 404 or reload the app — that's expected.

---

### Step 102.4: Update AppModule to Import Required Modules

The current `AppModule` is minimal. We don't need any additional imports yet, but let's verify it's correct.

Open `src/app/app.module.ts` and confirm it contains:

```typescript
// src/app/app.module.ts

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

No changes needed yet. We'll add `RouterModule` in document 103.

---

### Step 102.5: Understanding the Flex Layout

The shell uses flexbox for layout. Here's how it works:

```css
:host {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
```

This makes the component a vertical flex container that's at least viewport height.

```css
.app-header {
  height: 56px;
  /* ... other styles ... */
}
```

The header has a fixed height of 56px (a common Material Design height).

```css
.app-content {
  flex: 1;
  /* ... other styles ... */
}
```

The content area uses `flex: 1` to expand and fill all remaining vertical space.

**Visual result:**

```
┌────────────────────────────────────┐
│ Header (fixed 56px)                │
├────────────────────────────────────┤
│                                    │
│ Content (flexible, fills rest)     │
│                                    │
│                                    │
│                                    │
└────────────────────────────────────┘
```

This ensures the app always fills the viewport, even with little content.

---

### Step 102.6: The Host Element Pattern

Notice we style `:host` rather than adding a wrapper div:

```css
:host {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
```

`:host` is a CSS pseudo-class that targets the component's host element — in this case, `<app-root>`. This is an Angular best practice:

**Without :host (anti-pattern):**
```html
<app-root>
  <div class="wrapper">  <!-- Unnecessary wrapper -->
    <header>...</header>
    <main>...</main>
  </div>
</app-root>
```

**With :host (correct):**
```html
<app-root>  <!-- app-root IS the flex container -->
  <header>...</header>
  <main>...</main>
</app-root>
```

One less DOM element, cleaner structure, same result.

---

## Verification

### 1. Build the Application

```bash
$ cd ~/projects/vvroom
$ ng build
```

Expected: Build succeeds with no errors.

### 2. Serve the Application

```bash
$ ng serve --open
```

Expected: Browser opens to `http://localhost:4200`

### 3. Visual Check

You should see:

```
┌─────────────────────────────────────────────────────────────────┐
│  🚗 vvroom                                    Home    Discover   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Content will appear here once routing is configured.            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

- Blue header with white text
- Logo emoji and "vvroom" title on the left
- "Home" and "Discover" links on the right
- Gray background in the content area
- Links change background on hover

### 4. Test Navigation Links (Expected Behavior)

Click "Home" or "Discover":
- The page will reload or show an error
- This is expected — we haven't configured routing yet

### 5. Responsive Check

Resize your browser window:
- The header should stay at the top
- The content area should resize fluidly
- Navigation links should remain visible (no responsive menu yet)

### 6. Inspect the DOM

Open browser developer tools (F12) and inspect the HTML:

```html
<app-root>
  <header class="app-header">...</header>
  <main class="app-content">...</main>
</app-root>
```

Notice there's no wrapper div — the `<app-root>` element itself is the flex container.

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| Header not full width | Missing `:host` styles | Ensure `:host { display: flex; }` is present |
| Content area doesn't fill viewport | Missing `min-height: 100vh` on `:host` | Add the missing style |
| Emoji not displaying | System font doesn't support emoji | This is rare; try a different browser |
| Styles not applying | Syntax error in `styles` array | Check for missing backticks or brackets |
| White gap at bottom of page | `flex: 1` not on `.app-content` | Add `flex: 1` to the content area |

---

## Key Takeaways

1. **The shell is the application frame** — It provides consistent structure across all pages
2. **`:host` styles the component element** — No wrapper divs needed
3. **`flex: 1` fills remaining space** — Combined with `min-height: 100vh`, creates full-viewport layouts

---

## Acceptance Criteria

- [ ] `src/app/app.component.ts` contains the shell template with header and content area
- [ ] Header displays logo (🚗), title (vvroom), and navigation links (Home, Discover)
- [ ] Header has blue background (#1976d2) with white text
- [ ] Navigation links have hover effect
- [ ] Content area fills remaining viewport height
- [ ] `:host` selector is used for component-level layout
- [ ] `ng build` completes with no errors
- [ ] `ng serve` shows the shell correctly in the browser

---

## What We Accomplished

| Item | Before | After |
|------|--------|-------|
| AppComponent template | Simple heading | Full shell with header and content |
| Layout | None | Flexbox-based full-height layout |
| Navigation | None | Placeholder links (non-functional) |
| Styling | None | Professional header with hover effects |
| Component pattern | Basic | Uses `:host` for layout |

---

## Architecture Note

The app shell follows the **container/presentational pattern**:

- **AppComponent (container)** — Provides structure and layout
- **Feature components (presentational)** — Render inside the content area

This separation means:
- Layout changes happen in one place (AppComponent)
- Feature components focus on their specific functionality
- The shell is framework code — it works for any domain

---

## Next Step

Proceed to `103-routing.md` to configure Angular Router and make the navigation links functional.
