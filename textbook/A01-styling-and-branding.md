# Appendix A01: Styling and Branding

## Overview

This appendix documents the styling system and branding configuration for the vvroom application. The visual design follows the dark theme pattern established in generic-prime while applying vvroom-specific branding.

## Theme Configuration

### PrimeNG Theme

The application uses PrimeNG's **lara-dark-blue** theme as the base, providing:
- Dark background colors (#2a2a2a, #3c3c3c)
- Blue accent colors (#64B5F6, #64c8ff)
- Consistent component styling

### Global Styles (styles.scss)

```scss
/* PrimeNG Theme and Component Styles */
@import "primeng/resources/themes/lara-dark-blue/theme.css";
@import "primeng/resources/primeng.min.css";
@import "primeicons/primeicons.css";

/* KaTeX CSS for LaTeX rendering */
@import "katex/dist/katex.min.css";

/* Global Styles */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--font-family);
  background-color: #3c3c3c;
  color: #ffffff;
}
```

### Color Palette

| Purpose | Color | Usage |
|---------|-------|-------|
| Background (dark) | `#2a2a2a` | Header, panels |
| Background (main) | `#3c3c3c` | Page background |
| Text primary | `#ffffff` | Main text |
| Text secondary | `#888888` | Version labels, hints |
| Accent | `#64B5F6` | Interactive elements |
| Accent hover | `#64c8ff` | Hover states |
| Border | `#444444` | Dividers, separators |

## App Component Styling

### Header Structure

```scss
.app-header {
  background-color: #2a2a2a;
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 2rem;
  border-bottom: 1px solid #444;
  height: 60px;
}
```

### Navigation Links

```scss
.home-link,
.discover-link {
  color: #ffffff;
  text-decoration: none;
  font-size: 1.2rem;
  font-weight: bold;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    color: #64c8ff;
  }
}
```

## Branding Configuration

### Domain Label

The primary branding appears in the **domain configuration** (`domainLabel` property):

**File**: `src/app/domain-config/automobile/automobile.domain-config.ts`

```typescript
return {
  domainName: 'automobile',
  domainLabel: 'Vvroom Discovery',  // Branding displayed in discover header
  apiBaseUrl: apiBaseUrl,
  // ...
};
```

### Application Title

**File**: `src/app/app.component.ts`

```typescript
@Component({ ... })
export class AppComponent {
  title = 'vvroom';
  // ...
}
```

### HTML Title

**File**: `src/index.html`

```html
<title>Vvroom - Automobile Discovery</title>
```

## Pop-Out Window Styling

Pop-out windows require special handling to hide scrollbars:

```scss
body.popout-body {
  overflow: hidden;
  height: 100vh;
  width: 100vw;
}

html.popout-html {
  overflow: hidden;
  height: 100vh;
  width: 100vw;

  .app-content {
    overflow: hidden !important;
    height: 100vh !important;
  }
}
```

## Component Style Files

Each component has its own SCSS file for component-specific styles:

| Component | Style File |
|-----------|-----------|
| App Shell | `app.component.scss` |
| Discover | `features/discover/discover.component.scss` |
| Home | `features/home/home.component.scss` |
| Query Control | `framework/components/query-control/query-control.component.scss` |
| Query Panel | `framework/components/query-panel/query-panel.component.scss` |
| Base Chart | `framework/components/base-chart/base-chart.component.scss` |
| Base Picker | `framework/components/base-picker/base-picker.component.scss` |
| Results Table | `framework/components/results-table/results-table.component.scss` |
| Statistics Panel | `framework/components/statistics-panel-2/statistics-panel-2.component.scss` |

## Implementation Checklist

- [ ] Import PrimeNG lara-dark-blue theme in styles.scss
- [ ] Set body background to #3c3c3c
- [ ] Configure header with #2a2a2a background
- [ ] Update domainLabel to "Vvroom Discovery"
- [ ] Set app component title to "vvroom"
- [ ] Update index.html title tag
- [ ] Apply hover colors (#64c8ff) to interactive elements

## Reference

- **PrimeNG Themes**: https://primeng.org/theming
- **Source Reference**: generic-prime/frontend/src/styles.scss
- **Color System**: VS Code Dark Theme inspired
