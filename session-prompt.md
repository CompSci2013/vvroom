**Project: VVRoom - URL-First Angular Application**

This is an Angular 13 (NgModule-based) application demonstrating URL-First architecture where the URL is the single source of truth for application state.

**Key Architecture:**
- `UrlStateService` - manages URL parameters as the source of truth
- `ResourceManagementService` - handles API calls with caching
- `IFilterUrlMapper`, `IApiAdapter`, `ICacheKeyBuilder` - domain adapter interfaces
- `DomainConfig<TFilters, TData, TStatistics>` - configuration for each domain
- PrimeNG components with `BasicResultsTableComponent`, `BasePickerComponent`

**Recent Work Completed:**
1. **E2E Test Suite** - Categories 1-3 complete (Visual Appearance, URL-First Conformity, URL Consistency)
2. **Documentation** - Added ASCII architecture diagrams to all docs
3. **Textbook Revision** - Revised the URL-First Angular textbook with corrections and figures
4. **Brownfield Companion** - Updated companion guide for legacy app migration, generated PDF

**Codebase Structure:**
- `src/app/domain/` - domain configs and adapters
- `src/app/core/services/` - UrlStateService, ResourceManagementService
- `src/app/shared/components/` - reusable table/picker/chart components
- `e2e/tests/` - Playwright E2E tests
- `textbook-revised/` - main textbook content
- `textbook-brownfield/` - brownfield companion guide

**Pending Discussion:**
- Replacing year range dual-dropdown picker with PrimeNG Slider (`p-slider` with `[range]="true"`) for better UX
