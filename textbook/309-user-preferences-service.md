# 309: User Preferences Service

**Status:** Complete
**Depends On:** None (standalone)
**Blocks:** Phase 8 (Framework Components - for panel ordering)

---

## Learning Objectives

After completing this section, you will:
- Understand localStorage patterns for persistent state
- Know how to handle storage failures gracefully
- Recognize domain-aware key namespacing patterns
- Be able to implement a preferences service with reactive state

---

## Objective

Create the `UserPreferencesService` that persists user preferences (panel order, collapsed state) using localStorage with domain-aware namespacing and graceful degradation.

---

## Why

Users customize their experience:
- Drag panels to reorder them
- Collapse panels they don't use often
- Their preferences should persist across sessions

### Storage Options

| Option | Persistence | Sharing | Complexity |
|--------|-------------|---------|------------|
| Component state | None | None | Low |
| Service state | Session only | Same tab | Low |
| localStorage | Permanent | Same origin | Medium |
| Backend API | Permanent | All devices | High |

We use **localStorage** because:
- Works offline
- No backend required
- Suitable for UI preferences
- Falls back gracefully in private browsing

### Domain-Aware Namespacing

Vvroom supports multiple domains (automobile, agriculture, etc.). Each domain may have different panels and preferences. Keys are namespaced:

```
prefs:automobile:panelOrder → ['stats-1', 'chart-1', 'query-control']
prefs:automobile:collapsedPanels → ['chart-1']
prefs:agriculture:panelOrder → ['crop-stats', 'yield-chart']
```

### Graceful Degradation

localStorage can fail:
- Private browsing mode
- Storage quota exceeded
- SecurityError in iframes

The service:
1. Checks storage availability on init
2. Uses in-memory fallback if unavailable
3. Logs warnings in dev mode
4. Never crashes the app

---

## What

### Step 309.1: Create the User Preferences Service

Create the file `src/app/framework/services/user-preferences.service.ts`:

```typescript
// src/app/framework/services/user-preferences.service.ts
// VERSION 1 (Section 309) - User preferences with localStorage

import { Injectable, isDevMode } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * User preferences service
 *
 * Persists user preferences using localStorage with domain-aware namespacing.
 * Handles storage failures gracefully with in-memory fallback.
 *
 * **Features:**
 *
 * 1. **Domain namespacing** — Each domain has its own preferences
 * 2. **Reactive state** — BehaviorSubjects for real-time updates
 * 3. **Graceful degradation** — Works even if localStorage unavailable
 * 4. **Panel merge logic** — New panels inserted at correct positions
 *
 * **Storage Keys:**
 *
 * ```
 * prefs:{domain}:panelOrder → ['panel-1', 'panel-2', ...]
 * prefs:{domain}:collapsedPanels → ['panel-1']
 * ```
 *
 * @example
 * ```typescript
 * // In component
 * constructor(private prefs: UserPreferencesService) {
 *   // Subscribe to panel order changes
 *   this.prefs.getPanelOrder().subscribe(order => {
 *     this.panelOrder = order;
 *   });
 *
 *   // Save new order after drag-drop
 *   this.prefs.savePanelOrder(['panel-2', 'panel-1', 'panel-3']);
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class UserPreferencesService {
  /**
   * Default panel order when no preferences saved
   */
  private readonly DEFAULT_PANEL_ORDER = [
    'query-control',
    'statistics-panel-2',
    'results-table'
  ];

  /**
   * Default collapsed panels (none)
   */
  private readonly DEFAULT_COLLAPSED_PANELS: string[] = [];

  /**
   * Current domain extracted from URL
   */
  private currentDomain = this.extractCurrentDomain();

  /**
   * BehaviorSubject for panel order
   */
  private panelOrderSubject = new BehaviorSubject<string[]>(
    this.loadPanelOrder()
  );

  /**
   * BehaviorSubject for collapsed panels
   */
  private collapsedPanelsSubject = new BehaviorSubject<string[]>(
    this.loadCollapsedPanels()
  );

  /**
   * Storage availability flag
   */
  private storageAvailable = this.checkStorageAvailable();

  /**
   * Get panel order as observable
   *
   * Emits current order immediately, then on every change.
   *
   * @returns Observable of panel order array
   */
  getPanelOrder(): Observable<string[]> {
    return this.panelOrderSubject.asObservable();
  }

  /**
   * Get collapsed panels as observable
   *
   * @returns Observable of collapsed panel IDs
   */
  getCollapsedPanels(): Observable<string[]> {
    return this.collapsedPanelsSubject.asObservable();
  }

  /**
   * Get current panel order synchronously
   *
   * @returns Current panel order array
   */
  getCurrentPanelOrder(): string[] {
    return this.panelOrderSubject.value;
  }

  /**
   * Get current collapsed panels synchronously
   *
   * @returns Current collapsed panel IDs
   */
  getCurrentCollapsedPanels(): string[] {
    return this.collapsedPanelsSubject.value;
  }

  /**
   * Save panel order
   *
   * Updates BehaviorSubject and persists to localStorage.
   *
   * @param order - New panel order array
   */
  savePanelOrder(order: string[]): void {
    this.panelOrderSubject.next(order);
    this.saveToStorage('panelOrder', order);
  }

  /**
   * Save collapsed panels
   *
   * @param panels - Array of collapsed panel IDs
   */
  saveCollapsedPanels(panels: string[]): void {
    this.collapsedPanelsSubject.next(panels);
    this.saveToStorage('collapsedPanels', panels);
  }

  /**
   * Toggle panel collapsed state
   *
   * @param panelId - Panel to toggle
   * @returns New collapsed state
   */
  togglePanelCollapsed(panelId: string): boolean {
    const current = this.collapsedPanelsSubject.value;
    let newCollapsed: string[];
    let isCollapsed: boolean;

    if (current.includes(panelId)) {
      newCollapsed = current.filter(id => id !== panelId);
      isCollapsed = false;
    } else {
      newCollapsed = [...current, panelId];
      isCollapsed = true;
    }

    this.saveCollapsedPanels(newCollapsed);
    return isCollapsed;
  }

  /**
   * Check if panel is collapsed
   *
   * @param panelId - Panel to check
   * @returns True if collapsed
   */
  isPanelCollapsed(panelId: string): boolean {
    return this.collapsedPanelsSubject.value.includes(panelId);
  }

  /**
   * Reset preferences for current domain
   *
   * @param domain - Optional domain (defaults to current)
   */
  reset(domain?: string): void {
    const targetDomain = domain || this.currentDomain;

    if (this.storageAvailable) {
      try {
        localStorage.removeItem(this.getKey('panelOrder', targetDomain));
        localStorage.removeItem(this.getKey('collapsedPanels', targetDomain));
      } catch (e) {
        // Ignore errors on reset
      }
    }

    this.panelOrderSubject.next(this.DEFAULT_PANEL_ORDER);
    this.collapsedPanelsSubject.next(this.DEFAULT_COLLAPSED_PANELS);
  }

  /**
   * Switch to a different domain
   *
   * Loads preferences for the new domain.
   *
   * @param domain - Domain to switch to
   */
  switchDomain(domain: string): void {
    this.currentDomain = domain;
    this.panelOrderSubject.next(this.loadPanelOrder());
    this.collapsedPanelsSubject.next(this.loadCollapsedPanels());
  }

  /**
   * Get current domain
   *
   * @returns Current domain name
   */
  getCurrentDomain(): string {
    return this.currentDomain;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Load panel order from localStorage
   */
  private loadPanelOrder(): string[] {
    if (!this.storageAvailable) {
      return this.DEFAULT_PANEL_ORDER;
    }

    try {
      const key = this.getKey('panelOrder');
      const stored = localStorage.getItem(key);

      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Merge with defaults to include new panels
          return this.mergePanelOrder(parsed, this.DEFAULT_PANEL_ORDER);
        }
      }
    } catch (e) {
      this.logError('loadPanelOrder', e);
    }

    return this.DEFAULT_PANEL_ORDER;
  }

  /**
   * Load collapsed panels from localStorage
   */
  private loadCollapsedPanels(): string[] {
    if (!this.storageAvailable) {
      return this.DEFAULT_COLLAPSED_PANELS;
    }

    try {
      const key = this.getKey('collapsedPanels');
      const stored = localStorage.getItem(key);

      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      this.logError('loadCollapsedPanels', e);
    }

    return this.DEFAULT_COLLAPSED_PANELS;
  }

  /**
   * Merge stored order with defaults
   *
   * - Removes panels no longer in defaults
   * - Inserts new panels at their default relative position
   *
   * @param stored - User's stored order
   * @param defaults - Default order (source of truth for valid panels)
   * @returns Merged order
   */
  private mergePanelOrder(stored: string[], defaults: string[]): string[] {
    const defaultsSet = new Set(defaults);

    // Filter out panels that no longer exist
    const result = stored.filter(id => defaultsSet.has(id));
    const resultSet = new Set(result);

    // Insert new panels at their relative position
    for (let i = 0; i < defaults.length; i++) {
      const panelId = defaults[i];
      if (!resultSet.has(panelId)) {
        // Find insertion point based on previous panel in defaults
        let insertIndex = result.length;

        for (let j = i - 1; j >= 0; j--) {
          const prevPanel = defaults[j];
          const prevIndex = result.indexOf(prevPanel);
          if (prevIndex !== -1) {
            insertIndex = prevIndex + 1;
            break;
          }
        }

        result.splice(insertIndex, 0, panelId);
        resultSet.add(panelId);
      }
    }

    return result;
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(preference: string, value: any): void {
    if (!this.storageAvailable) {
      return;
    }

    try {
      const key = this.getKey(preference);
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      this.handleStorageError(e);
    }
  }

  /**
   * Get storage key with domain prefix
   */
  private getKey(preference: string, domain?: string): string {
    const targetDomain = domain || this.currentDomain;
    return `prefs:${targetDomain}:${preference}`;
  }

  /**
   * Check if localStorage is available
   */
  private checkStorageAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Handle storage errors
   */
  private handleStorageError(error: any): void {
    this.storageAvailable = false;
    this.logError('storage', error);
  }

  /**
   * Log error in dev mode only
   */
  private logError(context: string, error: any): void {
    if (isDevMode()) {
      console.debug(`[UserPreferencesService] ${context} error:`, error);
    }
  }

  /**
   * Extract current domain from URL
   */
  private extractCurrentDomain(): string {
    const path = window.location.pathname;
    const match = path.match(/^\/([a-z-]+)/);

    if (match && match[1] && match[1] !== 'popout') {
      return match[1];
    }

    return 'automobile'; // Default domain
  }
}
```

---

### Step 309.2: Update the Barrel File

Update `src/app/framework/services/index.ts`:

```typescript
// src/app/framework/services/index.ts
// VERSION 8 (Section 309) - Added UserPreferencesService

export * from './url-state.service';
export * from './api.service';
export * from './request-coordinator.service';
export * from './domain-config-registry.service';
export * from './domain-config-validator.service';
export * from './popout-context.service';
export * from './popout-manager.service';
export * from './user-preferences.service';
export * from './resource-management.service';
```

---

## Verification

### 1. Check File Exists

```bash
$ ls -la src/app/framework/services/user-preferences.service.ts
```

### 2. TypeScript Compilation Check

```bash
$ npx tsc --noEmit src/app/framework/services/user-preferences.service.ts
```

### 3. Build the Application

```bash
$ ng build
```

### 4. Verify Storage (Optional)

```typescript
// In any component
constructor(private prefs: UserPreferencesService) {
  // Save order
  this.prefs.savePanelOrder(['panel-b', 'panel-a', 'panel-c']);

  // Check localStorage in DevTools
  // Key: prefs:automobile:panelOrder
  // Value: ["panel-b","panel-a","panel-c"]

  // Subscribe to changes
  this.prefs.getPanelOrder().subscribe(order => {
    console.log('Current order:', order);
  });
}
```

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| Preferences not persisting | localStorage unavailable | Check private browsing mode |
| Wrong domain detected | URL pattern mismatch | Check extractCurrentDomain() logic |
| New panels missing | Not in DEFAULT_PANEL_ORDER | Update defaults when adding panels |
| Quota exceeded | Too much data | Clear old preferences or reduce data |
| JSON parse error | Corrupted data | Service handles with try/catch |

---

## Key Takeaways

1. **Graceful degradation is essential** — App works even if storage fails
2. **Domain namespacing enables multi-domain support** — Preferences don't conflict
3. **Panel merge logic handles updates** — New panels appear at correct positions

---

## Acceptance Criteria

- [ ] `src/app/framework/services/user-preferences.service.ts` exists
- [ ] Service is `@Injectable({ providedIn: 'root' })`
- [ ] `getPanelOrder()` returns observable
- [ ] `getCollapsedPanels()` returns observable
- [ ] `savePanelOrder()` persists to localStorage
- [ ] `saveCollapsedPanels()` persists to localStorage
- [ ] `togglePanelCollapsed()` toggles and saves
- [ ] `reset()` clears preferences
- [ ] `switchDomain()` loads different domain's preferences
- [ ] Domain-aware key namespacing works
- [ ] Graceful degradation when localStorage unavailable
- [ ] Panel merge logic handles new/removed panels
- [ ] TypeScript compilation succeeds
- [ ] JSDoc comments document all public methods

---

## Next Step

Proceed to `310-filter-options-service.md` to create the service for caching filter dropdown options.
