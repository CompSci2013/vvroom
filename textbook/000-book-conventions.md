# 000: Book Conventions

**Document Type:** Meta
**Purpose:** Establish the style and structure for all textbook documents in this series

---

## Overview

This `textbook/` directory contains the manuscript for a comprehensive Angular 13 programming book. The book follows the style of Apress technical publications, with a focus on learning-by-doing through the incremental construction of a real application: **vvroom**, an automobile discovery platform.

The application implements the **URL-First State Management** pattern, documented in `docs/`.

---

## Target Audience

A junior developer who will:
- Type every line of code shown
- Understand why each decision was made
- Have a working, testable application at every checkpoint

---

## Document Structure

Each numbered document (`001-*.md`, `002-*.md`, etc.) represents a chapter or major section. Every document follows this structure:

### 1. Header Block

```markdown
# NNN: Title

**Status:** Planning | In Progress | Complete
**Depends On:** List of prerequisite document numbers
**Blocks:** List of documents that depend on this one
```

### 2. Objective

A single paragraph stating what this section accomplishes.

### 3. Why (Rationale)

- Explain the reasoning behind the approach
- Reference industry standards:
  - Angular Style Guide (https://angular.io/guide/styleguide)
  - URL-First pattern (see `docs/README.md`)
  - TypeScript best practices
  - RxJS patterns
- Cite specific rules when applicable (e.g., "Style 04-10: Use redirects for default routes")

### 4. What (Implementation)

Step-by-step instructions with:
- **Full absolute paths** for every file (e.g., `src/app/features/home/home.component.ts`)
- **Complete file contents** — no ellipses, no "add similar code"
- **Every import statement** — never assume the reader knows what to import
- **Terminal commands** with expected output where applicable

### 5. Verification

- How to confirm the step worked
- What to see in the browser
- What to see in the console
- Any tests to run

### 6. Acceptance Criteria

Checkbox list of requirements that must be met before proceeding.

### 7. Next Step

Pointer to the next document in the sequence.

---

## File Path Conventions

Always use paths relative to the project root (`~/projects/vvroom/`):

```
src/app/app.component.ts           # Root component
src/app/app.routes.ts              # Route definitions
src/app/features/home/             # Feature module directory
src/app/features/discover/         # Feature module directory
src/app/framework/services/        # Shared services
src/app/framework/models/          # TypeScript interfaces
```

When referencing files in prose, use backticks and the full path:
- Correct: "Open `src/app/app.component.ts`"
- Incorrect: "Open the app component"

---

## Code Block Conventions

### New Files

When creating a new file, show the complete contents:

```typescript
// src/app/features/home/home.component.ts

import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  template: `<h1>Home</h1>`
})
export class HomeComponent {}
```

### Modifications to Existing Files

When modifying an existing file, show:
1. The file path
2. What to find (the existing code)
3. What to replace it with (the new code)

```typescript
// src/app/app.routes.ts
// REPLACE this:
export const routes: Routes = [];

// WITH this:
export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent }
];
```

For additions, specify where to add the code:

```typescript
// src/app/app.routes.ts
// ADD after the existing imports:
import { HomeComponent } from './features/home/home.component';
```

---

## Terminal Command Conventions

Show commands with their expected output:

```bash
$ ng serve --port 4228 --open

✔ Browser application bundle generation complete.

Initial Chunk Files   | Names         |  Raw Size
vendor.js             | vendor        |   2.05 MB |
polyfills.js          | polyfills     | 339.16 kB |
styles.css            | styles        |  95.54 kB |
main.js               | main          |  47.42 kB |
runtime.js            | runtime       |   6.54 kB |

Build at: 2026-02-11T20:00:00.000Z - Hash: abc123 - Time: 5000ms

** Angular Live Development Server is listening on localhost:4228 **
```

---

## Naming Schema

Documents are numbered by phase:

| Number | Phase |
|--------|-------|
| 000-049 | Meta documents (conventions, rubric) |
| 050-099 | Phase 0: API Contract & Naming Conventions |
| 100-149 | Phase 1: Foundation |
| 150-199 | Interlude A: TypeScript Generics Primer |
| 200-249 | Phase 2: Framework Models |
| 250-299 | Interlude B: RxJS Patterns |
| 300-399 | Phase 3: Framework Services (3A: Core, 3B: Popout, 3C: Error Handling) |
| 400-499 | Phase 4: Domain Models |
| 500-599 | Phase 5: Domain Adapters |
| 600-649 | Phase 6: Domain Configs |
| 650-699 | Phase 7: Chart Data Sources |
| 800-899 | Phase 8: Framework Components |
| 900-949 | Phase 9: Feature Components |
| 950-999 | Appendices |

---

## Reference Implementation

The **generic-prime** project (branch `angular/13`) serves as the canonical reference for all code in this book:

| Property | Value |
|----------|-------|
| Location | `~/projects/generic-prime` |
| Branch | `angular/13` |

When working on chapters:
1. Ensure generic-prime is on the `angular/13` branch
2. Copy relevant code files to vvroom
3. Adapt the textbook to accurately describe the copied code

To access the reference implementation:

```bash
cd ~/projects/generic-prime
git checkout angular/13
```

---

## Reference Material

| Resource | Location |
|----------|----------|
| URL-First Architecture | `docs/README.md` |
| Full Architecture Spec | `docs/ARCHITECTURE-OVERVIEW.md` |
| State Management Spec | `docs/STATE-MANAGEMENT-SPECIFICATION.md` |
| Pop-out Architecture | `docs/POPOUT-ARCHITECTURE.md` |
| Implementation Audit | `docs/URL-FIRST-AS-IMPLEMENTED.md` |
| Reference Implementation | `~/projects/generic-prime` @ `angular/13` |

---

## Principles

1. **No magic** — Every line of code is explained or shown
2. **Compiles at every step** — The application must build and run after each section
3. **Why before what** — Rationale precedes implementation
4. **Full paths always** — Never ambiguous file references
5. **One concept per section** — Don't combine unrelated changes
6. **Test what you build** — Verification steps after every implementation

---

## URL-First Compliance

Every implementation step must adhere to the URL-First State Management paradigm:

```
User Action → URL Update → State Service → Components Re-render
```

See `instructions.md` for the complete URL-First Compliance Checklist.

---

*This document establishes the contract between author and reader. All subsequent documents in `textbook/` will adhere to these conventions.*
