# 307: Popout Context Service

**Status:** Complete
**Depends On:** 208-popout-interface, 306-resource-management-service
**Blocks:** 308-popout-manager-service

---

## Learning Objectives

After completing this section, you will:
- Understand the BroadcastChannel API for cross-window communication
- Know how to determine if code is running in a pop-out window
- Recognize the messaging patterns for parent-child window coordination
- Be able to implement bidirectional communication between windows

---

## Objective

Create the `PopOutContextService` that determines whether the current window is a pop-out and provides messaging infrastructure for communication between the main window and pop-out windows.

---

## Why

Pop-out windows are a core feature of vvroom. Users can detach panels (statistics, charts) into separate browser windows for multi-monitor workflows. This creates a challenge: *how do these windows communicate?*

### The Pop-Out Challenge

When you call `window.open()`, the new window is essentially a separate instance:
- Different JavaScript context
- Different Angular application instance
- No shared services or state

We need a way for:
1. **Main window** → Detect when pop-out is ready
2. **Main window** → Send state updates to pop-out
3. **Pop-out** → Receive state updates
4. **Pop-out** → Notify main window it's closing

### Communication Options

| Option | Pros | Cons |
|--------|------|------|
| `window.opener` | Direct reference | Security restrictions, fragile |
| `postMessage()` | Standard API | Requires origin checks, complex |
| `BroadcastChannel` | Simple, bidirectional | Browser support (good since 2017) |
| `SharedWorker` | Powerful | Complex setup |

We use **BroadcastChannel** because:
- Simple API: `channel.postMessage()` and `channel.onmessage`
- Works across same-origin windows
- No need to track window references
- Automatic cleanup when windows close

### The Context Service Pattern

`PopOutContextService` serves two roles:

1. **In pop-out window**: Determines "I am a pop-out" and sets up messaging
2. **In main window**: Initializes as parent for pop-out management

```typescript
// Pop-out window
if (contextService.isInPopOut()) {
  contextService.initializeAsPopOut('statistics-panel');
}

// Main window
contextService.initializeAsParent();
```

### Route-Based Detection

Pop-outs are identified by their URL pattern:

```
/popout/:gridId/:panelId/:panelType
```

Example: `/popout/main-grid/statistics-1/statistics-panel-2`

The service parses this URL to extract:
- `isPopOut`: true (URL starts with `/popout`)
- `gridId`: "main-grid"
- `panelId`: "statistics-1"
- `panelType`: "statistics-panel-2"

---

## What

### Step 307.1: Replace the Placeholder Service

Replace the placeholder created in Section 306 with the full implementation.

Update `src/app/framework/services/popout-context.service.ts`:

```typescript
// src/app/framework/services/popout-context.service.ts
// VERSION 2 (Section 307) - Full implementation with BroadcastChannel

import { Injectable, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, ReplaySubject } from 'rxjs';
import {
  PopOutMessage,
  PopOutMessageType,
  PopOutContext,
  parsePopOutRoute
} from '../models/popout.interface';

/**
 * Pop-out context service
 *
 * Determines whether the current window is a pop-out and provides
 * messaging infrastructure for parent-child window communication.
 *
 * **Two Modes:**
 *
 * 1. **Pop-out mode** — Running in a pop-out window
 *    - `isInPopOut()` returns true
 *    - Sets up BroadcastChannel to receive state from main window
 *    - Sends PANEL_READY message when initialized
 *
 * 2. **Parent mode** — Running in main window
 *    - `isInPopOut()` returns false
 *    - Manages channels for each pop-out panel
 *    - Broadcasts state updates to all pop-outs
 *
 * **BroadcastChannel Pattern:**
 *
 * Each panel gets its own channel named `panel-{panelId}`.
 * This allows targeted messaging to specific panels.
 *
 * @example
 * ```typescript
 * // In pop-out window component
 * if (this.context.isInPopOut()) {
 *   const ctx = this.context.getContext();
 *   this.context.initializeAsPopOut(ctx.panelId);
 *
 *   this.context.getMessages$().subscribe(message => {
 *     if (message.type === PopOutMessageType.STATE_UPDATE) {
 *       this.handleStateUpdate(message.payload);
 *     }
 *   });
 * }
 *
 * // In main window
 * this.context.initializeAsParent();
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class PopOutContextService implements OnDestroy {
  /**
   * BroadcastChannel for this window
   *
   * In pop-out: channel for receiving messages from main window
   * In parent: may be null (uses per-panel channels via PopOutManager)
   */
  private channel: BroadcastChannel | null = null;

  /**
   * ReplaySubject for incoming messages
   *
   * ReplaySubject with buffer of 10 ensures late subscribers
   * can receive recent messages they might have missed.
   */
  private messagesSubject = new ReplaySubject<PopOutMessage>(10);

  /**
   * Parsed context from URL
   *
   * Contains isPopOut, gridId, panelId, panelType
   */
  private context: PopOutContext | null = null;

  /**
   * Initialization flag to prevent double-init
   */
  private initialized = false;

  /**
   * Constructor - parses URL to determine context
   *
   * @param router - Angular Router for URL access
   * @param ngZone - NgZone for ensuring change detection
   */
  constructor(
    private router: Router,
    private ngZone: NgZone
  ) {
    // Parse context from current URL
    this.context = parsePopOutRoute(this.router.url);
  }

  /**
   * Check if current window is a pop-out
   *
   * Determined by URL pattern: /popout/:gridId/:panelId/:panelType
   *
   * @returns True if in pop-out window
   */
  isInPopOut(): boolean {
    // Re-parse if context not set (defensive)
    if (!this.context) {
      this.context = parsePopOutRoute(this.router.url);
    }
    return this.context?.isPopOut || false;
  }

  /**
   * Get parsed pop-out context
   *
   * @returns Context object with gridId, panelId, panelType, or null
   */
  getContext(): PopOutContext | null {
    if (!this.context) {
      this.context = parsePopOutRoute(this.router.url);
    }
    return this.context;
  }

  /**
   * Initialize as pop-out window
   *
   * Sets up BroadcastChannel for receiving messages from main window.
   * Sends PANEL_READY message to notify main window.
   *
   * @param panelId - Panel identifier for channel naming
   */
  initializeAsPopOut(panelId: string): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.setupChannel(panelId);

    // Notify main window that pop-out is ready
    this.sendMessage({
      type: PopOutMessageType.PANEL_READY,
      timestamp: Date.now()
    });
  }

  /**
   * Initialize as parent window
   *
   * Called by main window to set initialized flag.
   * Actual channel management is handled by PopOutManagerService.
   */
  initializeAsParent(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    // Parent doesn't set up a channel here - PopOutManager handles per-panel channels
  }

  /**
   * Set up BroadcastChannel for this panel
   *
   * @param panelId - Panel identifier for channel naming
   */
  private setupChannel(panelId: string): void {
    const channelName = `panel-${panelId}`;

    // Close existing channel if any
    if (this.channel) {
      this.channel.close();
    }

    // Create new channel
    this.channel = new BroadcastChannel(channelName);

    // Handle incoming messages
    this.channel.onmessage = (event: MessageEvent) => {
      const message = event.data as PopOutMessage;
      // Use NgZone to ensure Angular change detection runs
      this.ngZone.run(() => {
        this.messagesSubject.next(message);
      });
    };

    // Handle message errors (rare, but log them)
    this.channel.onmessageerror = () => {
      console.warn('[PopOutContextService] Message deserialization error');
    };
  }

  /**
   * Send message to channel
   *
   * Used by pop-out to send messages to main window.
   *
   * @template T - Payload type
   * @param message - Message to send
   */
  sendMessage<T = any>(message: PopOutMessage<T>): void {
    if (!this.channel) {
      console.warn('[PopOutContextService] No channel available for sending');
      return;
    }

    // Add timestamp if not present
    if (!message.timestamp) {
      message.timestamp = Date.now();
    }

    try {
      this.channel.postMessage(message);
    } catch (error) {
      console.error('[PopOutContextService] Failed to send message:', error);
    }
  }

  /**
   * Get observable of incoming messages
   *
   * @returns Observable of PopOutMessage
   */
  getMessages$(): Observable<PopOutMessage> {
    return this.messagesSubject.asObservable();
  }

  /**
   * Create a BroadcastChannel for a specific panel
   *
   * Used by PopOutManagerService to create channels for pop-out windows.
   *
   * @param panelId - Panel identifier
   * @returns New BroadcastChannel instance
   */
  createChannelForPanel(panelId: string): BroadcastChannel {
    const channelName = `panel-${panelId}`;
    return new BroadcastChannel(channelName);
  }

  /**
   * Close the channel
   *
   * Call when pop-out is closing or service is destroyed.
   */
  close(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }

    this.initialized = false;
  }

  /**
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    this.close();
    this.messagesSubject.complete();
  }
}
```

---

### Step 307.2: Verify Popout Interface Exists

Ensure `src/app/framework/models/popout.interface.ts` exists (from Section 208).

If the interface doesn't include `parsePopOutRoute`, add it:

```typescript
// Add to src/app/framework/models/popout.interface.ts
// VERSION 2 (Section 307) - Added parsePopOutRoute function

/**
 * Parse pop-out route to extract context
 *
 * @param url - Current router URL
 * @returns PopOutContext with parsed values, or default context if not pop-out
 *
 * @example
 * ```typescript
 * parsePopOutRoute('/popout/main-grid/stats-1/statistics-panel-2')
 * // Returns: { isPopOut: true, gridId: 'main-grid', panelId: 'stats-1', panelType: 'statistics-panel-2' }
 *
 * parsePopOutRoute('/discover')
 * // Returns: { isPopOut: false, gridId: '', panelId: '', panelType: '' }
 * ```
 */
export function parsePopOutRoute(url: string): PopOutContext {
  // Pattern: /popout/:gridId/:panelId/:panelType
  const match = url.match(/^\/popout\/([^\/]+)\/([^\/]+)\/([^\/\?]+)/);

  if (match) {
    return {
      isPopOut: true,
      gridId: match[1],
      panelId: match[2],
      panelType: match[3]
    };
  }

  return {
    isPopOut: false,
    gridId: '',
    panelId: '',
    panelType: ''
  };
}
```

---

### Step 307.3: Update the Barrel File

The barrel file should already export this service from Section 306. Verify:

```typescript
// src/app/framework/services/index.ts
export * from './popout-context.service';
```

---

## Verification

### 1. Check File Updated

```bash
$ wc -l src/app/framework/services/popout-context.service.ts
```

Should show ~200+ lines (not the short placeholder).

### 2. TypeScript Compilation Check

```bash
$ npx tsc --noEmit src/app/framework/services/popout-context.service.ts
```

Expected: No output (no compilation errors).

### 3. Build the Application

```bash
$ ng build
```

Expected: Build succeeds with no errors.

### 4. Verify Context Detection (Optional)

Add temporary test code:

```typescript
// In app.component.ts
import { PopOutContextService } from './framework/services';

constructor(private popOutContext: PopOutContextService) {
  console.log('Is pop-out?', this.popOutContext.isInPopOut());
  console.log('Context:', this.popOutContext.getContext());
}
```

Navigate to `/` — Should log `Is pop-out? false`
Navigate to `/popout/grid1/panel1/stats` — Should log `Is pop-out? true`

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| `Cannot find module '../models/popout.interface'` | Interface file missing | Complete Section 208 first |
| `parsePopOutRoute is not a function` | Function not exported | Add to popout.interface.ts and export |
| isInPopOut always false | URL doesn't match pattern | Check URL pattern is `/popout/...` |
| Messages not received | Channel name mismatch | Verify both sides use `panel-{panelId}` |
| Change detection not running | Missing NgZone.run() | Wrap message handling in ngZone.run() |

---

## Key Takeaways

1. **BroadcastChannel enables simple cross-window messaging** — No window references needed
2. **URL pattern determines pop-out status** — Route-based detection is reliable
3. **ReplaySubject with buffer catches late subscribers** — Messages aren't lost

---

## Acceptance Criteria

- [ ] `src/app/framework/services/popout-context.service.ts` fully implemented
- [ ] `isInPopOut()` correctly detects pop-out windows by URL pattern
- [ ] `getContext()` returns parsed gridId, panelId, panelType
- [ ] `initializeAsPopOut()` sets up BroadcastChannel
- [ ] `initializeAsParent()` sets initialized flag
- [ ] `sendMessage()` sends via BroadcastChannel
- [ ] `getMessages$()` returns observable of incoming messages
- [ ] `createChannelForPanel()` creates channels for parent use
- [ ] `parsePopOutRoute()` function added to popout.interface.ts
- [ ] NgZone.run() wraps message handling
- [ ] TypeScript compilation succeeds
- [ ] JSDoc comments document all public methods

---

## Next Step

Proceed to `308-popout-manager-service.md` to create the service that manages pop-out windows from the main window.
