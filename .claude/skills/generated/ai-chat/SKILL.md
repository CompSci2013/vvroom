---
name: ai-chat
description: "Skill for the Ai-chat area of vvroom. 11 symbols across 1 files."
---

# Ai-chat

11 symbols | 1 files | Cohesion: 100%

## When to Use

- Working with code in `src/`
- Understanding how sendMessage, onKeyDown, useExampleQuery work
- Modifying ai-chat-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/framework/components/ai-chat/ai-chat.component.ts` | sendMessage, onKeyDown, useExampleQuery, scrollToBottom, ngOnInit (+6) |

## Entry Points

Start here when exploring this area:

- **`sendMessage`** (Method) — `src/app/framework/components/ai-chat/ai-chat.component.ts:121`
- **`onKeyDown`** (Method) — `src/app/framework/components/ai-chat/ai-chat.component.ts:157`
- **`useExampleQuery`** (Method) — `src/app/framework/components/ai-chat/ai-chat.component.ts:258`
- **`scrollToBottom`** (Method) — `src/app/framework/components/ai-chat/ai-chat.component.ts:341`
- **`ngOnInit`** (Method) — `src/app/framework/components/ai-chat/ai-chat.component.ts:94`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `sendMessage` | Method | `src/app/framework/components/ai-chat/ai-chat.component.ts` | 121 |
| `onKeyDown` | Method | `src/app/framework/components/ai-chat/ai-chat.component.ts` | 157 |
| `useExampleQuery` | Method | `src/app/framework/components/ai-chat/ai-chat.component.ts` | 258 |
| `scrollToBottom` | Method | `src/app/framework/components/ai-chat/ai-chat.component.ts` | 341 |
| `ngOnInit` | Method | `src/app/framework/components/ai-chat/ai-chat.component.ts` | 94 |
| `checkConnection` | Method | `src/app/framework/components/ai-chat/ai-chat.component.ts` | 108 |
| `retryConnection` | Method | `src/app/framework/components/ai-chat/ai-chat.component.ts` | 243 |
| `onPaste` | Method | `src/app/framework/components/ai-chat/ai-chat.component.ts` | 167 |
| `processImageFile` | Method | `src/app/framework/components/ai-chat/ai-chat.component.ts` | 187 |
| `renderContent` | Method | `src/app/framework/components/ai-chat/ai-chat.component.ts` | 286 |
| `escapeHtml` | Method | `src/app/framework/components/ai-chat/ai-chat.component.ts` | 332 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `OnKeyDown → ScrollToBottom` | intra_community | 3 |
| `UseExampleQuery → ScrollToBottom` | intra_community | 3 |

## How to Explore

1. `gitnexus_context({name: "sendMessage"})` — see callers and callees
2. `gitnexus_query({query: "ai-chat"})` — find related execution flows
3. Read key files listed above for implementation details
