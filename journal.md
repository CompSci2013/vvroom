You are to meticulously document each action we take in building this application.
Each entry will contain a timestamp: YYYY-MM-DD-HH-MM-SS where time is the system time of the thor server.
You will always append entries to the bottom of this file: ~/projects/vvroom/journal.md
Give the timestamp of the entry, and then write the action taken on the next line.
There should be a blank line between entries.
You will add these entries automatically after each action.
After you have recorded the last action taken, you will read the first 9 lines of this file.
You will then read instructions.md
Then tail the last 40 lines of this file, journal.md, to remember where you left off.

# vvroom Development Journal

## Project Overview

**vvroom** is a fresh Angular 13 project created to document the process of building a discovery application from scratch.

---

## 2026-02-11: Project Creation

### Initial Setup

Created new Angular 13 project using Angular CLI 13.3.11:

```bash
cd ~/projects
npx @angular/cli@13.3.11 new vvroom --style=scss --routing=true --skip-git=false --skip-tests=true
```

### Configuration
- **Angular Version**: 13.3.12
- **TypeScript**: 4.6.4
- **RxJS**: 7.5.7
- **Styling**: SCSS
- **Routing**: Enabled
- **Port**: 4207

### Dependencies Added

Hand-edited `package.json` to add dependencies we'll need later:

| Package | Version | Purpose |
|---------|---------|---------|
| `primeng` | ^13.4.1 | UI component library (Angular 13 compatible) |
| `primeicons` | ^5.0.0 | Icon library for PrimeNG |
| `dockview-core` | ^4.13.1 | Panel layout management |
| `plotly.js-dist-min` | ^2.27.0 | Charting library |
| `playwright` | ^1.57.0 | E2E testing |

### Dependency Resolution Issue

**Problem**: Initially tried to use PrimeNG 14.2.3, which failed:
```
npm error peer @angular/common@"^14.0.0" from primeng@14.2.3
```

**Solution**: Downgraded to PrimeNG 13.4.1 and primeicons 5.0.0 to match Angular 13.

### Version Compatibility Matrix

| Angular | PrimeNG | PrimeIcons | TypeScript |
|---------|---------|------------|------------|
| 13.x | 13.x | 5.x | 4.6.x |
| 14.x | 14.x | 6.x | 4.7-4.8.x |
| 15.x | 15.x | 6.x | 4.8-4.9.x |

### Workspace

Added to `~/projects/track-projects.code-workspace` for multi-project development.

---

## Action Log

2026-02-12-00-35-00
Established journal documentation protocol. Each action will be timestamped and appended to this file.

2026-02-11-19-39-43
Configured journal to use thor server time for all timestamps.

2026-02-11-19-41-48
Prepended journal.md with documentation rules in HTML comment block.

2026-02-11-19-47-18
Created project pedigree table documenting lineage of generic-prime, golden-extension, vroom, and vvroom.

---

## Project Pedigree

| Project | Created | Angular | TypeScript | Purpose | Lineage |
|---------|---------|---------|------------|---------|---------|
| **generic-prime** | 2025-11-20 | 14.3.0 | ~4.7.0 | Production multi-domain discovery app | Original/Pioneer |
| **golden-extension** | 2026-02-06 | 13.3.0 | ~4.6.2 | Reference implementation (~17K LOC) | Derived from generic-prime patterns |
| **vroom** | 2026-02-09 | 13.3.0 | ~4.6.2 | Educational textbook (71 docs, 9 phases) | Documents golden-extension |
| **vvroom** | 2026-02-11 | 13.3.12 | 4.6.4 | Fresh build with journaling | Implements vroom patterns |

### Lineage Diagram

```
generic-prime (Nov 2025) - Angular 14, multi-domain pioneer
       ↓
golden-extension (Feb 6, 2026) - Angular 13, clean reference implementation
       ↓
vroom (Feb 9, 2026) - Textbook documenting URL-First architecture
       ↓
vvroom (Feb 11, 2026) - Fresh implementation following vroom patterns
```

2026-02-11-19-54-45
Verified directory structure created in vvroom (40 directories matching vroom architecture).

2026-02-11-20-22-08
Created instructions.md documenting the textbook-driven build process using generic-prime as reference.

2026-02-11-20-26-22
Updated instructions.md with methodology shift section explaining why vvroom inverts the original vroom approach (copy working code first, then adapt textbook).

2026-02-11-20-32-45
Added comprehensive URL-First Compliance Checklist to instructions.md synthesized from vvroom/docs/ (README.md, STATE-MANAGEMENT-SPECIFICATION.md, ARCHITECTURE-OVERVIEW.md, POPOUT-ARCHITECTURE.md, URL-FIRST-AS-IMPLEMENTED.md).

2026-02-11-20-35-07
Created textbook/000-book-conventions.md - adapted from vroom/plan, updated references to use generic-prime (angular/13) as reference implementation instead of golden-extension.

2026-02-11-20-37-06
Processed 051-api-contract-overview.md:
- Copied api-response.interface.ts from generic-prime to src/app/framework/models/
- Updated environment.ts with apiBaseUrl and includeTestIds
- Updated environment.prod.ts with apiBaseUrl and includeTestIds
- Created textbook/051-api-contract-overview.md

2026-02-11-20-37-35
Processed Phase 0 API Contract (052-053):
- Copied 052-automobile-endpoints.md to textbook (documentation only, no code)
- Copied 053-naming-conventions.md to textbook (documentation only, no code)

2026-02-11-20-38-53
Processed 101-project-cleanup.md:
- Cleaned up app.component.ts (removed boilerplate, minimal placeholder)
- Removed app.component.html and app.component.scss (using inline template)
- Updated index.html title to "Vvroom - Automobile Discovery"
- Updated styles.scss with base reset styles
- Added .gitkeep files to empty directories
- Created textbook/101-project-cleanup.md

2026-02-11-20-41-00
Completed Phase 1 Foundation (102-104):
- Updated app.component.ts with shell (header, navigation, router-outlet)
- Created home.component.ts, discover.component.ts, popout.component.ts
- Updated app-routing.module.ts with routes for home, discover, popout
- Updated app.module.ts to declare all components
- Created textbook/102-app-shell.md, 103-routing.md, 104-environment-config.md
- Build successful: 217.40 kB total bundle

2026-02-11-20-49-13
Captured Phase 1 screenshots using Playwright:
- Created e2e/capture-screenshots.js script
- Started dev server on port 4228
- Captured e2e/screenshots/home-2026-02-12T01-49-01.png (23.6 KB)
- Captured e2e/screenshots/discover-2026-02-12T01-49-01.png (25.6 KB)

2026-02-11-20-51-10
Completed Interlude A and Phase 2 Framework Models:
- Created textbook/150-typescript-generics-primer.md (teaching doc, no code)
- Copied 11 framework model files from generic-prime to src/app/framework/models/
  (domain-config, resource-management, filter-definition, table-config, picker-config,
   api-response, pagination, popout, error-notification, ai.models, index)
- Created textbook pages 201-209 for Phase 2
- Created textbook/250-rxjs-patterns-primer.md (teaching doc, no code)
- Build successful: 217.40 kB total bundle

2026-02-11-21-03-36
Completed bulk copy of Phases 3-9 from generic-prime and resolved build errors:
- Copied 14 framework service files to src/app/framework/services/
- Copied framework token file (popout.token.ts)
- Copied 22+ domain config files (automobile models, adapters, configs, chart-sources)
- Copied framework components (ai-chat, base-chart, base-picker, results tables, query panels, statistics)
- Copied feature components (automobile, panel-popout with updated templates)
- Created primeng.module.ts (centralized PrimeNG imports)
- Created framework.module.ts (framework component declarations)
- Updated app.module.ts to VERSION 3 with full framework integration
- Fixed import path errors: changed ../../../ to ../../ in feature components
- Fixed environment import paths: changed to ../../../../environments/environment
- Installed @angular/cdk@^13.0.0 for drag-drop support
- Installed katex and @types/katex for AI chat math rendering
- Created src/types/plotly.d.ts with comprehensive Plotly type declarations
- Updated tsconfig.json to include custom types
- Adjusted angular.json budgets for large Plotly.js bundle (5.44 MB)
- Build successful: 5.44 MB total bundle (includes Plotly.js charting library)
- Captured screenshots: e2e/screenshots/home-2026-02-12T02-03-31.png, discover-2026-02-12T02-03-31.png

2026-02-11-21-12-47
Committed and pushed vvroom to self-hosted GitLab:
- Committed 206 files (68,809 insertions) to main branch
- Created GitLab project under halo group (project ID: 85)
- Repository URL: http://gitlab.minilab/halo/vvroom
- Remote configured: origin → http://gitlab.minilab/halo/vvroom.git
- Push successful: main branch tracking origin/main

2026-02-11-21-21-09
Applied dark theme styling and updated branding from Generic-Prime to Vvroom:
- Created textbook/A01-styling-and-branding.md (appendix documenting theme system)
- Updated styles.scss with PrimeNG lara-dark-blue theme imports
- Created app.component.html with dark header and navigation
- Created app.component.scss with dark theme styles (#2a2a2a header, #3c3c3c body)
- Updated app.component.ts to VERSION 3 with external template/styles
- Changed domainLabel from "Generic-Prime Discovery -p 4205" to "Vvroom Discovery"
- Build successful: 5.62 MB total bundle (includes PrimeNG dark theme CSS)
- Captured screenshots: e2e/screenshots/home-2026-02-12T02-21-04.png, discover-2026-02-12T02-21-04.png
