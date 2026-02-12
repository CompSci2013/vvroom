# 208: Popout Interface

**Status:** Planning
**Depends On:** 201-domain-config-interface
**Blocks:** 307-popout-context-service, 308-popout-manager-service, 904-popout-component

---

## Learning Objectives

After completing this section, you will:
- Understand how pop-out windows communicate with the parent application
- Know how to use the BroadcastChannel API for cross-window messaging
- Recognize the challenges of maintaining state synchronization across windows

---

## Objective

Create the popout interfaces that define how pop-out windows communicate with the parent application. These interfaces establish the message protocol, window configuration, and context tracking needed for the pop-out feature.

---

## Why

The vvroom application supports "pop-out" functionality: users can detach panels (charts, pickers, filters) into separate browser windows. This is powerful for multi-monitor setups where users might want a chart on one screen while filtering on another.

**The challenge:** How do separate browser windows share state?

```
┌─────────────────────────────────────────────────────────────────┐
│  Parent Window (Main Application)                                │
│  - Controls URL state                                            │
│  - Manages filter selections                                     │
│  - Coordinates all pop-outs                                      │
└─────────────────────────────────────────────────────────────────┘
        │                           │                           │
        │ BroadcastChannel          │                           │
        ▼                           ▼                           ▼
┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐
│   Pop-out: Chart  │    │  Pop-out: Picker  │    │ Pop-out: Filters  │
│   (Separate Tab)  │    │  (Separate Tab)   │    │  (Separate Tab)   │
└───────────────────┘    └───────────────────┘    └───────────────────┘
```

**Solution:** The [BroadcastChannel API](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel) allows communication between browser contexts (tabs, windows, iframes) on the same origin.

The popout interfaces define:
1. **Message types** — What kinds of messages can be sent
2. **Message payloads** — What data each message contains
3. **Window configuration** — Size, position, features
4. **Context tracking** — Is this window a pop-out? Which panel?

---

## What

### Step 208.1: Create the Popout Interface

Create the file `src/app/framework/models/popout.interface.ts`:

```typescript
// src/app/framework/models/popout.interface.ts
// VERSION 1 (Section 208) - Pop-out window communication interfaces

/**
 * Popout Interfaces
 *
 * Defines the communication protocol between the parent application
 * and pop-out windows. Uses BroadcastChannel API for cross-window messaging.
 */

/**
 * Pop-out message structure
 *
 * All messages between parent and pop-out windows follow this format.
 *
 * @template T - The payload type for this message
 */
export interface PopOutMessage<T = any> {
  /**
   * Message type identifier
   */
  type: PopOutMessageType;

  /**
   * Message payload (type depends on message type)
   */
  payload?: T;

  /**
   * Timestamp when message was created
   * Used for debugging and ordering
   */
  timestamp?: number;
}

/**
 * Pop-out message types
 *
 * Enumeration of all possible message types in the pop-out protocol.
 */
export enum PopOutMessageType {
  /**
   * State update from parent to pop-out
   * Sent when URL/filter state changes
   */
  STATE_UPDATE = 'STATE_UPDATE',

  /**
   * Request to close a pop-out window
   * Sent from parent when pop-out should be closed
   */
  CLOSE_POPOUT = 'CLOSE_POPOUT',

  /**
   * Pop-out panel is ready to receive messages
   * Sent from pop-out after initialization
   */
  PANEL_READY = 'PANEL_READY',

  /**
   * Picker selection changed in pop-out
   * Sent from pop-out picker to update parent URL
   */
  PICKER_SELECTION_CHANGE = 'PICKER_SELECTION_CHANGE',

  /**
   * Filter added in pop-out
   * Sent from pop-out filter panel to update parent URL
   */
  FILTER_ADD = 'FILTER_ADD',

  /**
   * Filter removed in pop-out
   * Sent from pop-out filter panel to update parent URL
   */
  FILTER_REMOVE = 'FILTER_REMOVE',

  /**
   * Highlight removed in pop-out
   * Sent from pop-out to remove h_* parameter
   */
  HIGHLIGHT_REMOVE = 'HIGHLIGHT_REMOVE',

  /**
   * Clear all highlights
   * Sent from pop-out to remove all h_* parameters
   */
  CLEAR_HIGHLIGHTS = 'CLEAR_HIGHLIGHTS',

  /**
   * Clear all filters
   * Sent from pop-out to reset all filters
   */
  CLEAR_ALL_FILTERS = 'CLEAR_ALL_FILTERS',

  /**
   * URL parameters changed in parent
   * Sent to pop-outs when URL updates
   */
  URL_PARAMS_CHANGED = 'URL_PARAMS_CHANGED',

  /**
   * Request URL parameter sync
   * Pop-out requests current URL state from parent
   */
  URL_PARAMS_SYNC = 'URL_PARAMS_SYNC',

  /**
   * Chart element clicked in pop-out
   * Sent to parent to apply filter from chart click
   */
  CHART_CLICK = 'CHART_CLICK'
}

/**
 * Payload for picker selection change messages
 */
export interface PickerSelectionPayload {
  /**
   * Picker configuration ID
   */
  configId: string;

  /**
   * URL parameter name for this picker's selections
   */
  urlParam: string;

  /**
   * Serialized selection value for URL
   */
  urlValue: string;
}

/**
 * Reference to an open pop-out window
 *
 * Used by PopOutManagerService to track and manage pop-out windows.
 */
export interface PopOutWindowRef {
  /**
   * Reference to the Window object
   */
  window: Window;

  /**
   * BroadcastChannel for communication
   */
  channel: BroadcastChannel;

  /**
   * Interval ID for checking if window is still open
   */
  checkInterval: number;

  /**
   * Panel ID within the grid
   */
  panelId: string;

  /**
   * Panel type (e.g., 'chart', 'picker', 'filter')
   */
  panelType: string;
}

/**
 * Window features for pop-out creation
 *
 * Configures the appearance and behavior of pop-out windows.
 */
export interface PopOutWindowFeatures {
  /**
   * Window width in pixels
   * @default 1200
   */
  width?: number;

  /**
   * Window height in pixels
   * @default 800
   */
  height?: number;

  /**
   * Left position in pixels
   * @default 100
   */
  left?: number;

  /**
   * Top position in pixels
   * @default 100
   */
  top?: number;

  /**
   * Show menu bar
   * @default false
   */
  menubar?: boolean;

  /**
   * Show toolbar
   * @default false
   */
  toolbar?: boolean;

  /**
   * Show location/address bar
   * @default false
   */
  location?: boolean;

  /**
   * Show status bar
   * @default false
   */
  status?: boolean;

  /**
   * Allow window resizing
   * @default true
   */
  resizable?: boolean;

  /**
   * Show scrollbars when needed
   * @default true
   */
  scrollbars?: boolean;
}

/**
 * Route parameters for pop-out URLs
 *
 * Pop-out windows use a special route format:
 * /popout/:gridId/:panelId/:type
 */
export interface PopOutRouteParams {
  /**
   * Grid container ID (e.g., 'automobile-discover')
   */
  gridId: string;

  /**
   * Panel ID within the grid (e.g., 'chart-year')
   */
  panelId: string;

  /**
   * Panel type (e.g., 'chart', 'picker', 'table')
   */
  type: string;
}

/**
 * Pop-out context information
 *
 * Provides context about whether the current window is a pop-out
 * and what panel it represents.
 */
export interface PopOutContext {
  /**
   * Whether this window is a pop-out (vs main application)
   */
  isPopOut: boolean;

  /**
   * Panel ID if this is a pop-out
   */
  panelId?: string;

  /**
   * Grid ID if this is a pop-out
   */
  gridId?: string;

  /**
   * Panel type if this is a pop-out
   */
  panelType?: string;
}

/**
 * Build window features string for window.open()
 *
 * Converts PopOutWindowFeatures to the comma-separated string
 * required by window.open().
 *
 * @param features - Window feature configuration
 * @returns Feature string for window.open()
 *
 * @example
 * ```typescript
 * const features = buildWindowFeatures({ width: 800, height: 600 });
 * // "width=800,height=600,left=100,top=100,menubar=no,..."
 *
 * window.open('/popout/grid/panel/chart', 'popout-panel', features);
 * ```
 */
export function buildWindowFeatures(features: PopOutWindowFeatures): string {
  const {
    width = 1200,
    height = 800,
    left = 100,
    top = 100,
    menubar = false,
    toolbar = false,
    location = false,
    status = false,
    resizable = true,
    scrollbars = true
  } = features;

  const boolToYesNo = (val: boolean) => (val ? 'yes' : 'no');

  return [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    `menubar=${boolToYesNo(menubar)}`,
    `toolbar=${boolToYesNo(toolbar)}`,
    `location=${boolToYesNo(location)}`,
    `status=${boolToYesNo(status)}`,
    `resizable=${boolToYesNo(resizable)}`,
    `scrollbars=${boolToYesNo(scrollbars)}`
  ].join(',');
}

/**
 * Parse pop-out route to extract context
 *
 * Parses a pop-out URL path to extract grid ID, panel ID, and type.
 *
 * @param url - URL path to parse
 * @returns PopOutContext if URL matches pop-out pattern, null otherwise
 *
 * @example
 * ```typescript
 * const context = parsePopOutRoute('/popout/automobile-discover/chart-year/chart');
 * // {
 * //   isPopOut: true,
 * //   gridId: 'automobile-discover',
 * //   panelId: 'chart-year',
 * //   panelType: 'chart'
 * // }
 *
 * const notPopout = parsePopOutRoute('/discover');
 * // null
 * ```
 */
export function parsePopOutRoute(url: string): PopOutContext | null {
  // Match /popout/:gridId/:panelId/:type
  const match = url.match(/^\/popout\/([^/]+)\/([^/]+)\/([^/?]+)/);

  if (!match) {
    return null;
  }

  return {
    isPopOut: true,
    gridId: match[1],
    panelId: match[2],
    panelType: match[3]
  };
}

/**
 * Build pop-out URL from route parameters
 *
 * @param params - Route parameters
 * @param queryString - Optional query string to append
 * @returns Pop-out URL path
 *
 * @example
 * ```typescript
 * const url = buildPopOutUrl({
 *   gridId: 'automobile-discover',
 *   panelId: 'chart-year',
 *   type: 'chart'
 * }, '?manufacturer=Ford');
 * // '/popout/automobile-discover/chart-year/chart?manufacturer=Ford'
 * ```
 */
export function buildPopOutUrl(
  params: PopOutRouteParams,
  queryString: string = ''
): string {
  return `/popout/${params.gridId}/${params.panelId}/${params.type}${queryString}`;
}

/**
 * Create a pop-out message with timestamp
 *
 * @param type - Message type
 * @param payload - Message payload
 * @returns Complete PopOutMessage
 *
 * @example
 * ```typescript
 * const message = createPopOutMessage(
 *   PopOutMessageType.STATE_UPDATE,
 *   { filters: currentFilters }
 * );
 * channel.postMessage(message);
 * ```
 */
export function createPopOutMessage<T>(
  type: PopOutMessageType,
  payload?: T
): PopOutMessage<T> {
  return {
    type,
    payload,
    timestamp: Date.now()
  };
}

/**
 * Default window features for charts
 */
export const CHART_POPOUT_FEATURES: PopOutWindowFeatures = {
  width: 900,
  height: 600,
  resizable: true,
  scrollbars: false
};

/**
 * Default window features for pickers
 */
export const PICKER_POPOUT_FEATURES: PopOutWindowFeatures = {
  width: 800,
  height: 700,
  resizable: true,
  scrollbars: true
};

/**
 * Default window features for filter panels
 */
export const FILTER_POPOUT_FEATURES: PopOutWindowFeatures = {
  width: 500,
  height: 600,
  resizable: true,
  scrollbars: true
};

/**
 * BroadcastChannel name prefix
 * Each pop-out gets a unique channel: `${CHANNEL_PREFIX}-${panelId}`
 */
export const POPOUT_CHANNEL_PREFIX = 'vvroom-popout';

/**
 * Create BroadcastChannel name for a panel
 *
 * @param panelId - Panel identifier
 * @returns Channel name
 */
export function getPopOutChannelName(panelId: string): string {
  return `${POPOUT_CHANNEL_PREFIX}-${panelId}`;
}
```

---

### Step 208.2: Update the Barrel Export

Update `src/app/framework/models/index.ts` to include the new interface:

```typescript
// src/app/framework/models/index.ts

// This barrel file exports all framework model interfaces.
// Import from '@app/framework/models' instead of individual files.

export * from './domain-config.interface';
export * from './resource-management.interface';
export * from './filter-definition.interface';
export * from './table-config.interface';
export * from './picker-config.interface';
export * from './api-response.interface';
export * from './pagination.interface';
export * from './popout.interface';
```

---

### Step 208.3: Understand the Pop-out Architecture

Pop-out communication follows a parent-child pattern:

**Parent Window Responsibilities:**
- Owns the URL state (single source of truth)
- Opens pop-out windows with specific routes
- Sends STATE_UPDATE when URL changes
- Receives messages from pop-outs (filter changes, etc.)
- Updates URL based on pop-out messages

**Pop-out Window Responsibilities:**
- Renders a single panel (chart, picker, etc.)
- Listens for STATE_UPDATE from parent
- Sends user actions to parent (clicks, selections)
- Closes cleanly when parent closes or navigates away

**Message Flow Example:**

```
┌─────────────────────────────────────────────────────────────────┐
│  User clicks "Pop Out Chart"                                     │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  Parent: window.open('/popout/grid/chart/chart', features)       │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  Pop-out: Initializes, sends PANEL_READY                         │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  Parent: Receives PANEL_READY, sends STATE_UPDATE with filters   │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│  Pop-out: Receives STATE_UPDATE, renders chart with data         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Verification

### 1. Check File Exists

```bash
$ ls -la src/app/framework/models/popout.interface.ts
```

Expected output shows the file exists.

### 2. TypeScript Compilation Check

```bash
$ cd ~/projects/vvroom
$ npx tsc --noEmit src/app/framework/models/popout.interface.ts
```

Expected: No output (no compilation errors).

### 3. Verify Exports

```bash
$ grep "^export" src/app/framework/models/popout.interface.ts
```

Expected output:

```
export interface PopOutMessage<T = any> {
export enum PopOutMessageType {
export interface PickerSelectionPayload {
export interface PopOutWindowRef {
export interface PopOutWindowFeatures {
export interface PopOutRouteParams {
export interface PopOutContext {
export function buildWindowFeatures(features: PopOutWindowFeatures): string {
export function parsePopOutRoute(url: string): PopOutContext | null {
export function buildPopOutUrl(
export function createPopOutMessage<T>(
export const CHART_POPOUT_FEATURES: PopOutWindowFeatures = {
export const PICKER_POPOUT_FEATURES: PopOutWindowFeatures = {
export const FILTER_POPOUT_FEATURES: PopOutWindowFeatures = {
export const POPOUT_CHANNEL_PREFIX = 'vvroom-popout';
export function getPopOutChannelName(panelId: string): string {
```

### 4. Verify Barrel Export

```bash
$ grep "popout" src/app/framework/models/index.ts
```

Expected output:

```
export * from './popout.interface';
```

---

## Common Problems

| Symptom | Cause | Solution |
|---------|-------|----------|
| BroadcastChannel not defined | Older browser | Check browser compatibility or use polyfill |
| Pop-out shows blank | Route not configured | Add pop-out routes to app.routes.ts |
| Messages not received | Wrong channel name | Verify both windows use same channel name |
| Pop-out loses state on refresh | URL not preserved | Include query params in pop-out URL |
| Window features ignored | Browser restrictions | Some browsers limit window.open() features |

---

## Key Takeaways

1. **BroadcastChannel enables cross-window communication** — Same-origin windows can send messages
2. **The parent owns URL state** — Pop-outs request changes, parent applies them
3. **Message types create a protocol** — Typed messages ensure consistent communication

---

## Acceptance Criteria

- [ ] `src/app/framework/models/popout.interface.ts` exists
- [ ] `PopOutMessage<T>` interface defines message structure
- [ ] `PopOutMessageType` enum lists all message types
- [ ] `PopOutWindowRef` interface tracks open windows
- [ ] `PopOutWindowFeatures` interface configures window appearance
- [ ] `PopOutContext` interface identifies pop-out windows
- [ ] `buildWindowFeatures` function generates feature string
- [ ] `parsePopOutRoute` function extracts context from URL
- [ ] Default feature constants for charts, pickers, filters exist
- [ ] Barrel file exports all popout types
- [ ] TypeScript compilation succeeds with no errors

---

## Next Step

Proceed to `209-error-notification-interface.md` to define the error notification interfaces.
