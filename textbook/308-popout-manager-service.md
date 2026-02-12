# 308: Popout Manager Service

**Status:** Complete
**Depends On:** 307-popout-context-service, 208-popout-interface
**Blocks:** Phase 9 (Feature Components)

---

## Learning Objectives

After completing this section, you will:
- Understand the window.open() API and its configuration options
- Know how to track pop-out window lifecycle (open, close)
- Recognize the state broadcast pattern for multi-window synchronization
- Be able to implement a comprehensive pop-out window manager

---

## Objective

Create the `PopOutManagerService` that opens, tracks, and communicates with pop-out windows from the main window. This service is the counterpart to `PopOutContextService` — one manages from the main window, the other runs inside pop-outs.

---

## Why

`PopOutContextService` handles the pop-out side. Now we need the parent side:

| Service | Runs In | Responsibility |
|---------|---------|----------------|
| PopOutContextService | Pop-out window | Receive state, send events |
| PopOutManagerService | Main window | Open pop-outs, broadcast state, track lifecycle |

### The Manager's Responsibilities

1. **Open pop-out windows** — Call `window.open()` with correct URL and features
2. **Track open pop-outs** — Know which panels are currently popped out
3. **Broadcast state** — Send state updates to all pop-out windows
4. **Handle closing** — Detect when pop-outs close and clean up
5. **Prevent duplicates** — Don't open same panel twice

### Why Component-Level Injection?

Unlike `PopOutContextService` (singleton), `PopOutManagerService` is component-level:

```typescript
@Component({
  providers: [PopOutManagerService]
})
export class DiscoverComponent { ... }
```

Reasons:
- Manager is tied to a specific grid/layout
- Different pages might have different pop-out needs
- Cleanup is easier when tied to component lifecycle

### The State Broadcast Pattern

When filters change in the main window:

```
Main Window                          Pop-out Window
    │                                     │
    ├── Filters change                    │
    │                                     │
    ├── ResourceManagementService         │
    │   updates state$                    │
    │                                     │
    ├── Component subscribes to state$    │
    │                                     │
    ├── Component calls                   │
    │   popOutManager.broadcastState()    │
    │          │                          │
    │          └──── BroadcastChannel ───►│
    │                                     │
    │                                     ├── PopOutContextService
    │                                     │   receives message
    │                                     │
    │                                     ├── ResourceManagementService
    │                                     │   .syncStateFromExternal()
    │                                     │
    │                                     └── UI updates
```

Pop-outs never make API calls. They receive state from the main window.

### Window Lifecycle Detection

JavaScript can't directly listen for window close events on child windows. We use polling:

```typescript
const checkInterval = setInterval(() => {
  if (popoutWindow.closed) {
    clearInterval(checkInterval);
    this.handlePopOutClosed(panelId);
  }
}, 500);
```

---

## What

### Step 308.1: Create the Popout Manager Service

Create the file `src/app/framework/services/popout-manager.service.ts`:

```typescript
// src/app/framework/services/popout-manager.service.ts
// VERSION 1 (Section 308) - Pop-out window manager

import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import {
  buildWindowFeatures,
  PopOutMessage,
  PopOutMessageType,
  PopOutWindowFeatures,
  PopOutWindowRef
} from '../models/popout.interface';
import { PopOutContextService } from './popout-context.service';

/**
 * Pop-out manager service
 *
 * Manages pop-out windows from the main window. Opens windows,
 * broadcasts state, and tracks lifecycle.
 *
 * **Important:** This is a component-level service, not a singleton.
 * Each component that needs pop-out management provides its own instance.
 *
 * **Lifecycle:**
 *
 * 1. Component creates → Manager injected
 * 2. Component calls initialize() with grid ID
 * 3. User clicks pop-out button → openPopOut() called
 * 4. Filter changes → broadcastState() called
 * 5. Pop-out closes → Manager detects and cleans up
 * 6. Component destroys → All pop-outs closed
 *
 * @example
 * ```typescript
 * @Component({
 *   providers: [PopOutManagerService]
 * })
 * export class DiscoverComponent implements OnInit, OnDestroy {
 *   constructor(
 *     private popOutManager: PopOutManagerService,
 *     private resources: ResourceManagementService
 *   ) {}
 *
 *   ngOnInit(): void {
 *     this.popOutManager.initialize('discover-grid');
 *
 *     // Broadcast state to pop-outs when it changes
 *     this.resources.state$.subscribe(state => {
 *       this.popOutManager.broadcastState(state);
 *     });
 *
 *     // Handle pop-out closure
 *     this.popOutManager.closed$.subscribe(panelId => {
 *       console.log(`Pop-out ${panelId} closed`);
 *     });
 *   }
 *
 *   onPopOutClick(panelId: string, panelType: string): void {
 *     this.popOutManager.openPopOut(panelId, panelType);
 *   }
 * }
 * ```
 */
@Injectable() // Component-level, not providedIn: 'root'
export class PopOutManagerService implements OnDestroy {
  /**
   * Grid ID for URL construction
   */
  private gridId = '';

  /**
   * Set of currently popped-out panel IDs
   */
  private poppedOutPanels = new Set<string>();

  /**
   * Map of panel ID to window reference/channel
   */
  private popoutWindows = new Map<string, PopOutWindowRef>();

  /**
   * Subject for messages from pop-outs
   */
  private messagesSubject = new Subject<{ panelId: string; message: PopOutMessage }>();

  /**
   * Subject for pop-out close events
   */
  private closedSubject = new Subject<string>();

  /**
   * Subject for blocked pop-up events (browser blocked window.open)
   */
  private blockedSubject = new Subject<string>();

  /**
   * Handler for beforeunload to close all pop-outs
   */
  private beforeUnloadHandler = () => this.closeAllPopOuts();

  /**
   * Initialization flag
   */
  private initialized = false;

  // Public observables
  readonly messages$ = this.messagesSubject.asObservable();
  readonly closed$ = this.closedSubject.asObservable();
  readonly blocked$ = this.blockedSubject.asObservable();

  /**
   * Constructor
   *
   * @param popOutContext - Context service for channel creation
   * @param ngZone - NgZone for change detection
   */
  constructor(
    private popOutContext: PopOutContextService,
    private ngZone: NgZone
  ) {}

  /**
   * Initialize the manager
   *
   * Must be called before any pop-out operations.
   *
   * @param gridId - Grid identifier for URL construction
   */
  initialize(gridId: string): void {
    if (this.initialized) {
      return;
    }

    this.gridId = gridId;
    this.initialized = true;

    // Initialize context as parent
    this.popOutContext.initializeAsParent();

    // Close all pop-outs when main window closes
    window.addEventListener('beforeunload', this.beforeUnloadHandler);

    // Subscribe to messages from pop-outs
    this.popOutContext.getMessages$().subscribe(message => {
      this.messagesSubject.next({ panelId: '', message });
    });
  }

  /**
   * Check if a panel is currently popped out
   *
   * @param panelId - Panel identifier
   * @returns True if panel is popped out
   */
  isPoppedOut(panelId: string): boolean {
    return this.poppedOutPanels.has(panelId);
  }

  /**
   * Get all currently popped-out panel IDs
   *
   * @returns Array of panel IDs
   */
  getPoppedOutPanels(): string[] {
    return Array.from(this.poppedOutPanels);
  }

  /**
   * Open a panel in a pop-out window
   *
   * @param panelId - Panel identifier
   * @param panelType - Panel type (e.g., 'statistics-panel-2')
   * @param features - Optional window features
   * @returns True if opened successfully, false if blocked or already open
   */
  openPopOut(
    panelId: string,
    panelType: string,
    features?: Partial<PopOutWindowFeatures>
  ): boolean {
    // Don't open if already popped out
    if (this.poppedOutPanels.has(panelId)) {
      console.log(`[PopOutManager] Panel ${panelId} already popped out`);
      return false;
    }

    // Construct URL: /popout/:gridId/:panelId/:panelType
    const url = `/popout/${this.gridId}/${panelId}/${panelType}`;

    // Build window features string
    const windowFeatures = buildWindowFeatures({
      width: 1200,
      height: 800,
      left: 100,
      top: 100,
      resizable: true,
      scrollbars: true,
      ...features
    });

    // Open the window
    const popoutWindow = window.open(url, `panel-${panelId}`, windowFeatures);

    // Handle blocked popup
    if (!popoutWindow) {
      console.warn(`[PopOutManager] Pop-up blocked for panel ${panelId}`);
      this.blockedSubject.next(panelId);
      return false;
    }

    // Track the pop-out
    this.poppedOutPanels.add(panelId);

    // Create channel for this panel
    const channel = this.popOutContext.createChannelForPanel(panelId);

    // Listen for messages from this panel
    channel.onmessage = event => {
      this.ngZone.run(() => {
        this.messagesSubject.next({ panelId, message: event.data });
      });
    };

    // Poll to detect when window closes
    const checkInterval = window.setInterval(() => {
      if (popoutWindow.closed) {
        this.ngZone.run(() => {
          this.handlePopOutClosed(panelId, channel, checkInterval);
        });
      }
    }, 500);

    // Store reference
    this.popoutWindows.set(panelId, {
      window: popoutWindow,
      channel,
      checkInterval,
      panelId,
      panelType
    });

    console.log(`[PopOutManager] Opened pop-out for panel ${panelId}`);
    return true;
  }

  /**
   * Broadcast state to all pop-out windows
   *
   * Call this whenever state changes in the main window.
   *
   * @param state - Application state from ResourceManagementService
   * @param filterOptionsCache - Optional cached filter options
   */
  broadcastState(state: any, filterOptionsCache?: any): void {
    if (this.popoutWindows.size === 0) {
      return; // No pop-outs to broadcast to
    }

    const message: PopOutMessage = {
      type: PopOutMessageType.STATE_UPDATE,
      payload: {
        state,
        filterOptionsCache: filterOptionsCache || null
      },
      timestamp: Date.now()
    };

    // Send to all pop-out channels
    this.popoutWindows.forEach(({ channel }) => {
      try {
        channel.postMessage(message);
      } catch {
        // Silently ignore posting errors (channel may be closed)
      }
    });
  }

  /**
   * Close a specific pop-out window
   *
   * @param panelId - Panel identifier
   */
  closePopOut(panelId: string): void {
    const ref = this.popoutWindows.get(panelId);
    if (ref) {
      // Send close message
      ref.channel.postMessage({
        type: PopOutMessageType.CLOSE_POPOUT,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Close all pop-out windows
   *
   * Called when main window is closing.
   */
  closeAllPopOuts(): void {
    this.popoutWindows.forEach(({ channel }) => {
      channel.postMessage({
        type: PopOutMessageType.CLOSE_POPOUT,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Handle pop-out window closed
   *
   * @param panelId - Panel that closed
   * @param channel - BroadcastChannel to close
   * @param checkInterval - Interval to clear
   */
  private handlePopOutClosed(
    panelId: string,
    channel: BroadcastChannel,
    checkInterval: number
  ): void {
    // Clear polling interval
    clearInterval(checkInterval);

    // Close channel
    channel.close();

    // Remove from tracking
    this.popoutWindows.delete(panelId);
    this.poppedOutPanels.delete(panelId);

    // Emit closed event
    this.closedSubject.next(panelId);

    console.log(`[PopOutManager] Pop-out ${panelId} closed`);
  }

  /**
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    // Remove beforeunload listener
    window.removeEventListener('beforeunload', this.beforeUnloadHandler);

    // Close all pop-outs and cleanup
    this.popoutWindows.forEach(({ window: win, channel, checkInterval }) => {
      clearInterval(checkInterval);
      channel.close();
      if (win && !win.closed) {
        win.close();
      }
    });

    // Complete subjects
    this.messagesSubject.complete();
    this.closedSubject.complete();
    this.blockedSubject.complete();
  }
}
```

---

### Step 308.2: Update Popout Interface

Ensure `src/app/framework/models/popout.interface.ts` includes necessary types:

```typescript
// Add to src/app/framework/models/popout.interface.ts if not present
// VERSION 2 (Section 308) - Added window reference types

/**
 * Pop-out window features configuration
 */
export interface PopOutWindowFeatures {
  width: number;
  height: number;
  left: number;
  top: number;
  resizable: boolean;
  scrollbars: boolean;
  menubar?: boolean;
  toolbar?: boolean;
  location?: boolean;
  status?: boolean;
}

/**
 * Reference to an open pop-out window
 */
export interface PopOutWindowRef {
  /** Window object */
  window: Window;
  /** BroadcastChannel for communication */
  channel: BroadcastChannel;
  /** Interval ID for close detection */
  checkInterval: number;
  /** Panel identifier */
  panelId: string;
  /** Panel type */
  panelType: string;
}

/**
 * Build window.open() features string from options
 *
 * @param features - Window features configuration
 * @returns Features string for window.open()
 */
export function buildWindowFeatures(features: PopOutWindowFeatures): string {
  const parts: string[] = [
    `width=${features.width}`,
    `height=${features.height}`,
    `left=${features.left}`,
    `top=${features.top}`,
    `resizable=${features.resizable ? 'yes' : 'no'}`,
    `scrollbars=${features.scrollbars ? 'yes' : 'no'}`
  ];

  if (features.menubar !== undefined) {
    parts.push(`menubar=${features.menubar ? 'yes' : 'no'}`);
  }
  if (features.toolbar !== undefined) {
    parts.push(`toolbar=${features.toolbar ? 'yes' : 'no'}`);
  }
  if (features.location !== undefined) {
    parts.push(`location=${features.location ? 'yes' : 'no'}`);
  }
  if (features.status !== undefined) {
    parts.push(`status=${features.status ? 'yes' : 'no'}`);
  }

  return parts.join(',');
}
```

---

### Step 308.3: Update the Barrel File

Update `src/app/framework/services/index.ts`:

```typescript
// src/app/framework/services/index.ts
// VERSION 7 (Section 308) - Added PopOutManagerService

export * from './url-state.service';
export * from './api.service';
export * from './request-coordinator.service';
export * from './domain-config-registry.service';
export * from './domain-config-validator.service';
export * from './popout-context.service';
export * from './popout-manager.service';
export * from './resource-management.service';
```

---

## Phase 3B Milestone: Pop-Out Demo

After completing Section 308, demonstrate pop-out communication:

1. Add temporary route for pop-out testing
2. Create a simple pop-out component
3. Verify communication works

```typescript
// Temporary demo component in main window
@Component({
  selector: 'app-popout-demo',
  template: `
    <h2>Pop-Out Demo</h2>
    <button (click)="openPopOut()">Open Pop-Out</button>
    <p>Popped out: {{ isPoppedOut }}</p>
    <div *ngFor="let log of logs">{{ log }}</div>
  `,
  providers: [PopOutManagerService]
})
export class PopOutDemoComponent implements OnInit {
  isPoppedOut = false;
  logs: string[] = [];

  constructor(private popOutManager: PopOutManagerService) {}

  ngOnInit(): void {
    this.popOutManager.initialize('demo-grid');

    this.popOutManager.closed$.subscribe(panelId => {
      this.logs.push(`Panel ${panelId} closed`);
      this.isPoppedOut = false;
    });
  }

  openPopOut(): void {
    this.isPoppedOut = this.popOutManager.openPopOut('demo-panel', 'demo');
    if (this.isPoppedOut) {
      this.logs.push('Pop-out opened');
    }
  }
}
```

---

## Verification

### 1. Check File Exists

```bash
$ ls -la src/app/framework/services/popout-manager.service.ts
```

### 2. TypeScript Compilation Check

```bash
$ npx tsc --noEmit src/app/framework/services/popout-manager.service.ts
```

### 3. Build the Application

```bash
$ ng build
```

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| Pop-up blocked | Browser blocking window.open() | User must allow pop-ups for site |
| `blocked$` emits | window.open() returned null | Check browser pop-up settings |
| Messages not received | Channel name mismatch | Verify `panel-{panelId}` format |
| Pop-out not detected as closed | Polling interval issue | Check checkInterval is set |
| State not updating in pop-out | broadcastState not called | Subscribe to state$ and broadcast |

---

## Key Takeaways

1. **Pop-outs are core functionality** — Users need multi-monitor workflows
2. **BroadcastChannel simplifies messaging** — No window reference management
3. **Polling detects window close** — No direct event available

---

## Acceptance Criteria

- [ ] `src/app/framework/services/popout-manager.service.ts` exists
- [ ] Service is component-level `@Injectable()` (not singleton)
- [ ] `initialize()` sets up grid ID and event listeners
- [ ] `openPopOut()` opens window with correct URL pattern
- [ ] `isPoppedOut()` tracks open panels
- [ ] `broadcastState()` sends state to all pop-outs
- [ ] `closePopOut()` and `closeAllPopOuts()` work
- [ ] Pop-out close detection via polling works
- [ ] `closed$` emits when pop-outs close
- [ ] `blocked$` emits when pop-ups are blocked
- [ ] beforeunload handler closes all pop-outs
- [ ] TypeScript compilation succeeds
- [ ] JSDoc comments document all public methods

---

## The Aha Moment

**Pop-out windows share state with the parent through a coordination service.**

The main window fetches data. Pop-outs receive state through BroadcastChannel. This ensures:
- No duplicate API calls
- Consistent state across windows
- Clean separation of concerns

---

## Next Step

Proceed to `309-user-preferences-service.md` to create the service for persisting user preferences.
