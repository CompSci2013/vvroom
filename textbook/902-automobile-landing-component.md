# 902: Automobile Landing Component

**Status:** Planning
**Depends On:** 901-home-component, 607-domain-config-assembly
**Blocks:** 903-discover-page-component

---

## Learning Objectives

After completing this section, you will:
- Understand how to create a domain-specific landing page within a feature module
- Know how to provide context and navigation for a domain's features
- Be able to structure informational content that guides users to key functionality

---

## Objective

Build the Automobile Landing component — the entry point to the automobile domain that introduces users to available features and guides them toward the discovery interface. This component bridges the gap between the general Home page and the feature-rich Discover page.

---

## Why

When users click "Automobiles" from the Home page, they need orientation before diving into complex data exploration. The Automobile Landing component serves as this orientation layer:

1. **Domain Context** — Tells users what kind of data they'll explore
2. **Feature Preview** — Shows available capabilities before committing
3. **Clear Call-to-Action** — Guides users to the primary feature (Discover)
4. **Supporting Information** — Provides dataset stats and usage tips

### The Landing Page Pattern

Many successful applications use a two-level navigation pattern:

```
Home (all domains) → Domain Landing (one domain) → Feature Page (specific task)
```

This progressive disclosure prevents cognitive overload. Users make one decision at a time:
1. "I want to explore automobiles" (Home → Automobile Landing)
2. "I want to search and analyze data" (Landing → Discover)

### Angular Style Guide References

- [Style 04-07](https://angular.io/guide/styleguide#style-04-07): Feature areas should have their own folder
- [Style 02-01](https://angular.io/guide/styleguide#style-02-01): Name files with their feature name (`automobile`)

---

## What

### Step 902.1: Create the Automobile Feature Directory

```bash
$ cd ~/projects/vvroom
$ mkdir -p src/app/features/automobile
```

---

### Step 902.2: Create the Automobile Landing Component

Create `src/app/features/automobile/automobile.component.ts`:

```typescript
// src/app/features/automobile/automobile.component.ts
// VERSION 1 (Section 902) - Automobile domain landing page

import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * Automobile Component - Domain Landing Page
 *
 * Feature component serving as the entry point for the Automobile domain.
 * Provides navigation and context for automobile-related data exploration.
 *
 * This component:
 * - Introduces the automobile domain to users
 * - Previews available features (search, analytics, specs)
 * - Guides users to the Discover page for data exploration
 * - Displays dataset information and usage tips
 *
 * This is a pure presentation component with no business logic.
 * All data exploration happens in the Discover component.
 */
@Component({
  selector: 'app-automobile',
  templateUrl: './automobile.component.html',
  styleUrls: ['./automobile.component.scss']
})
export class AutomobileComponent {}
```

---

### Step 902.3: Create the Automobile Landing Template

Create `src/app/features/automobile/automobile.component.html`:

```html
<!-- src/app/features/automobile/automobile.component.html -->
<!-- VERSION 1 (Section 902) - Automobile landing page with feature preview -->

<div class="automobile-container">
  <!-- Features Grid -->
  <div class="features-section">
    <h2><span class="section-icon">🚗</span> Explore Automobile Data</h2>
    <div class="features-grid">
      <!-- Primary Feature Card (Linked) -->
      <a routerLink="/automobiles/discover" class="feature-card feature-card-primary">
        <div class="feature-icon">🔍</div>
        <h3>Advanced Search</h3>
        <p>Filter and search across thousands of vehicles using advanced criteria</p>
        <span class="card-action">Start Exploring →</span>
      </a>

      <!-- Preview Feature Cards (Not Yet Linked) -->
      <div class="feature-card">
        <div class="feature-icon">📊</div>
        <h3>Analytics</h3>
        <p>View comprehensive statistics and visualizations of vehicle data</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🛠️</div>
        <h3>Detailed Specs</h3>
        <p>Access detailed specifications for every vehicle in the database</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">⚡</div>
        <h3>Performance</h3>
        <p>Compare performance metrics and find the perfect vehicle match</p>
      </div>
    </div>
  </div>

  <!-- Info Section -->
  <div class="info-section">
    <div class="info-card info-card-highlight">
      <h3>Ready to Explore?</h3>
      <p>Click "Advanced Search" above to dive into the full discovery experience with filters, charts, and data tables.</p>
    </div>
    <div class="info-card">
      <h3>Dataset Information</h3>
      <ul>
        <li><strong>Vehicle Count:</strong> 55,000+ vehicles</li>
        <li><strong>Data Fields:</strong> Manufacturer, model, year, body class, and more</li>
        <li><strong>Coverage:</strong> Comprehensive automobile market data</li>
      </ul>
    </div>
    <div class="info-card">
      <h3>Quick Tips</h3>
      <ul>
        <li>Use filters to narrow down search results</li>
        <li>Hover over charts for detailed information</li>
        <li>Pop-out panels for multi-monitor workflows</li>
        <li>URL state persists across page reloads</li>
      </ul>
    </div>
  </div>
</div>
```

**Template structure explained:**

| Section | Purpose |
|---------|---------|
| `.features-section` | Grid of feature cards previewing capabilities |
| `.feature-card-primary` | The main call-to-action linking to Discover |
| Other `.feature-card` elements | Preview features (some may not be implemented yet) |
| `.info-section` | Supporting information cards |

**Design decision:** Only the "Advanced Search" card links to a page. Other feature cards show what's possible but don't have links yet. This is intentional — it shows users the application's scope while guiding them to the implemented feature.

---

### Step 902.4: Create the Automobile Landing Styles

Create `src/app/features/automobile/automobile.component.scss`:

```scss
// src/app/features/automobile/automobile.component.scss
// VERSION 1 (Section 902) - Automobile landing page styles

.automobile-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

// Features section
.features-section {
  margin-bottom: 3rem;

  h2 {
    font-size: 1.75rem;
    color: #333;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .section-icon {
      font-size: 1.5rem;
    }
  }
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;

  .feature-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  h3 {
    font-size: 1.125rem;
    color: #333;
    margin-bottom: 0.5rem;
  }

  p {
    font-size: 0.9rem;
    color: #666;
    margin: 0;
    line-height: 1.5;
  }
}

// Primary feature card (linked)
.feature-card-primary {
  display: block;
  text-decoration: none;
  color: inherit;
  border: 2px solid #1976d2;
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(25, 118, 210, 0.2);
    text-decoration: none;
  }

  .card-action {
    display: block;
    margin-top: 1rem;
    color: #1976d2;
    font-weight: 600;
    font-size: 0.9rem;
  }
}

// Info section
.info-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.info-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  h3 {
    font-size: 1rem;
    color: #333;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #eee;
  }

  p {
    font-size: 0.9rem;
    color: #666;
    margin: 0;
    line-height: 1.6;
  }

  ul {
    margin: 0;
    padding-left: 1.25rem;

    li {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 0.5rem;
      line-height: 1.4;

      strong {
        color: #333;
      }

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

.info-card-highlight {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  color: white;

  h3 {
    color: white;
    border-bottom-color: rgba(255, 255, 255, 0.2);
  }

  p {
    color: rgba(255, 255, 255, 0.9);
  }
}
```

**Key styling patterns:**

| Pattern | Purpose |
|---------|---------|
| `.feature-card-primary` with border | Visual distinction for actionable card |
| `.info-card-highlight` with gradient | Draws attention to the call-to-action |
| Consistent `border-radius: 12px` | Establishes visual consistency across cards |
| `translateY` hover effect | Indicates clickability on interactive elements |

---

### Step 902.5: Create the Automobile Feature Module

Create `src/app/features/automobile/automobile.module.ts`:

```typescript
// src/app/features/automobile/automobile.module.ts
// VERSION 1 (Section 902) - Automobile feature module

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AutomobileComponent } from './automobile.component';

@NgModule({
  declarations: [
    AutomobileComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [
    AutomobileComponent
  ]
})
export class AutomobileModule {}
```

**Note:** This module will grow in document 903 when we add the Discover component. For now, it only contains the landing component.

---

### Step 902.6: Create the Index Barrel Export

Create `src/app/features/automobile/index.ts`:

```typescript
// src/app/features/automobile/index.ts
// VERSION 1 (Section 902) - Barrel export for automobile feature

export * from './automobile.component';
export * from './automobile.module';
```

---

## Verification

### 1. Check File Structure

```bash
$ find src/app/features/automobile -type f | sort
```

Expected output:

```
src/app/features/automobile/automobile.component.html
src/app/features/automobile/automobile.component.scss
src/app/features/automobile/automobile.component.ts
src/app/features/automobile/automobile.module.ts
src/app/features/automobile/index.ts
```

### 2. Build the Application

```bash
$ ng build
```

Expected: Build succeeds with no errors.

### 3. Visual Verification (After Routing)

Once routing is configured (document 905), navigate to `http://localhost:4200/automobiles`:

- Section header with car emoji: "Explore Automobile Data"
- Four feature cards in a responsive grid
- "Advanced Search" card has blue border and "Start Exploring →" link
- Three info cards at the bottom
- Blue highlighted card inviting users to explore

### 4. Navigation Test

Click "Start Exploring →" on the Advanced Search card:
- URL should change to `/automobiles/discover`
- (The Discover component will be created in document 903)

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| Grid layout shows one column | Container too narrow | Check `max-width` on `.automobile-container` |
| Primary card not visually distinct | Missing `.feature-card-primary` class | Verify HTML has both `feature-card` and `feature-card-primary` classes |
| Hover effect not working | CSS transition not applied | Check that `.feature-card-primary` has `transition` property |
| Link not navigating | Route not configured | Routes will be set up in document 905 |
| Styles bleeding to other components | Missing component encapsulation | Ensure styles are in component-specific SCSS file |

---

## Key Takeaways

1. **Landing pages provide context** — They orient users before complex features
2. **Progressive disclosure reduces overwhelm** — Show features one level at a time
3. **Visual hierarchy guides attention** — Use borders, colors, and hover effects to indicate primary actions

---

## Acceptance Criteria

- [ ] `src/app/features/automobile/automobile.component.ts` exists with proper decorator
- [ ] `src/app/features/automobile/automobile.component.html` contains feature cards and info sections
- [ ] `src/app/features/automobile/automobile.component.scss` provides responsive grid styles
- [ ] `src/app/features/automobile/automobile.module.ts` declares and exports the component
- [ ] Primary feature card (Advanced Search) has visual distinction and links to `/automobiles/discover`
- [ ] Info cards display dataset information and quick tips
- [ ] `ng build` completes without errors

---

## Architecture Note

The Automobile Landing component is the first **domain-specific feature component** we've built. Notice the pattern:

```
features/
├── home/                    # Application-level (no domain)
│   └── home.component.ts
└── automobile/              # Domain-specific
    └── automobile.component.ts
```

The `home` feature is domain-agnostic — it navigates to domains but contains no domain logic. The `automobile` feature is domain-specific — it lives entirely within the automobile context.

This separation matters because:
- Home component never changes when automobile features change
- Automobile module can be lazy-loaded independently
- Future domains (if any) follow the same pattern

---

## Next Step

Proceed to `903-discover-page-component.md` to build the main discovery interface where users explore automobile data with filters, charts, and tables.
