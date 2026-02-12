# Audit: PopOutContextService Comparison

**Date**: 2026-02-11
**vvroom Version**: Full documentation with JSDoc
**golden-extension Version**: Minimal documentation

---

## Overview

The PopOutContextService provides centralized pop-out window detection and cross-window communication using the BroadcastChannel API.

---

## Comparison Table

| Aspect | vvroom | golden-extension | Design Spec | Status |
|--------|--------|------------------|-------------|--------|
| **BroadcastChannel Pattern** | Per-panel channel (`panel-${panelId}`) | Same | Required | OK |
| **Message Buffering** | ReplaySubject(10) | ReplaySubject(10) | Required for late subscribers | OK |
| **NgZone Integration** | `ngZone.run()` for callbacks | Same | Required for change detection | OK |
| **Pop-out Detection** | `parsePopOutRoute(router.url)` | Same | URL-based detection | OK |
| **Double-init Prevention** | `initialized` flag | Same | Recommended | OK |
| **Error Handling** | Silent catch | Silent catch | N/A | OK |
| **Documentation** | Extensive JSDoc | Minimal | N/A | OK (vvroom better) |

---

## Detailed Analysis

### 1. Implementation Parity

The implementations are **functionally identical**. Both:

- Use `BroadcastChannel` for cross-window communication
- Create panel-specific channels with naming convention `panel-${panelId}`
- Use `ReplaySubject(10)` to buffer messages for late subscribers
- Run BroadcastChannel callbacks inside Angular's zone via `ngZone.run()`
- Parse pop-out context from router URL via `parsePopOutRoute()`
- Prevent double initialization with `initialized` flag
- Provide same public API:
  - `isInPopOut(): boolean`
  - `getContext(): PopOutContext | null`
  - `initializeAsPopOut(panelId: string): void`
  - `initializeAsParent(): void`
  - `sendMessage<T>(message: PopOutMessage<T>): void`
  - `getMessages$(): Observable<PopOutMessage>`
  - `createChannelForPanel(panelId: string): BroadcastChannel`
  - `close(): void`

### 2. Code Organization

**vvroom** (385 lines):
- Extensive JSDoc comments on every method
- Usage examples in documentation
- Detailed private field explanations

**golden-extension** (120 lines):
- Minimal comments
- Same implementation logic

**Analysis**: vvroom has better documentation which aids maintainability. The core logic is identical.

---

### 3. Channel Lifecycle

Both implementations:

```typescript
// Pop-out window initialization
initializeAsPopOut(panelId: string): void {
  if (this.initialized) return;
  this.initialized = true;
  this.setupChannel(panelId);
  this.sendMessage({ type: PopOutMessageType.PANEL_READY, timestamp: Date.now() });
}

// Main window initialization
initializeAsParent(): void {
  if (this.initialized) return;
  this.initialized = true;
}

// Channel setup
private setupChannel(panelId: string): void {
  const channelName = `panel-${panelId}`;
  if (this.channel) this.channel.close();
  this.channel = new BroadcastChannel(channelName);
  this.channel.onmessage = (event) => {
    this.ngZone.run(() => this.messagesSubject.next(event.data));
  };
}
```

---

### 4. Message Flow

Both implement the same message flow:

```
Main Window                          Pop-Out Window
    │                                      │
    │  [User opens pop-out]                │
    │  window.open('/panel/...')           │
    │  ─────────────────────────────────>  │
    │                                      │
    │                    initializeAsPopOut(panelId)
    │                    setupChannel('panel-picker')
    │                                      │
    │  <── PANEL_READY ──────────────────  │
    │                                      │
    │  ────── STATE_UPDATE ──────────────> │
    │        {state: currentState}         │
    │                                      │
    │  <── PICKER_SELECTION_CHANGE ──────  │
    │      {urlParam, urlValue}            │
    │                                      │
```

---

## URL-First Compliance

| Requirement | Compliance | Notes |
|-------------|------------|-------|
| Pop-outs communicate via BroadcastChannel | ✅ PASS | Per-panel channels |
| Pop-out detection by URL path | ✅ PASS | `parsePopOutRoute(router.url)` |
| Main window owns state, pop-outs receive | ✅ PASS | STATE_UPDATE message pattern |
| Pop-outs request URL changes from main | ✅ PASS | PICKER_SELECTION_CHANGE pattern |
| Zone-aware message handling | ✅ PASS | `ngZone.run()` wrapper |

---

## Issues Found

### Critical
None

### Medium
None

### Low
None

---

## Summary

The vvroom PopOutContextService is **identical in functionality** to golden-extension. The only difference is documentation level - vvroom has extensive JSDoc comments while golden-extension is minimal.

Both implementations correctly:
- Use BroadcastChannel API for cross-window communication
- Create per-panel channels for isolation
- Handle Angular zone integration
- Buffer messages for late subscribers
- Provide clean lifecycle management

**Overall Status**: ✅ COMPLIANT (Perfect match)
