---
name: base-chart
description: "Skill for the Base-chart area of vvroom. 12 symbols across 1 files."
---

# Base-chart

12 symbols | 1 files | Cohesion: 100%

## When to Use

- Working with code in `src/`
- Understanding how transform, getTitle, ngOnInit work
- Modifying base-chart-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/framework/components/base-chart/base-chart.component.ts` | transform, getTitle, ngOnInit, ngOnChanges, onPlotlyError (+7) |

## Entry Points

Start here when exploring this area:

- **`transform`** (Method) — `src/app/framework/components/base-chart/base-chart.component.ts:40`
- **`getTitle`** (Method) — `src/app/framework/components/base-chart/base-chart.component.ts:47`
- **`ngOnInit`** (Method) — `src/app/framework/components/base-chart/base-chart.component.ts:89`
- **`ngOnChanges`** (Method) — `src/app/framework/components/base-chart/base-chart.component.ts:98`
- **`onPlotlyError`** (Method) — `src/app/framework/components/base-chart/base-chart.component.ts:142`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `transform` | Method | `src/app/framework/components/base-chart/base-chart.component.ts` | 40 |
| `getTitle` | Method | `src/app/framework/components/base-chart/base-chart.component.ts` | 47 |
| `ngOnInit` | Method | `src/app/framework/components/base-chart/base-chart.component.ts` | 89 |
| `ngOnChanges` | Method | `src/app/framework/components/base-chart/base-chart.component.ts` | 98 |
| `onPlotlyError` | Method | `src/app/framework/components/base-chart/base-chart.component.ts` | 142 |
| `retryRender` | Method | `src/app/framework/components/base-chart/base-chart.component.ts` | 146 |
| `buildConfig` | Method | `src/app/framework/components/base-chart/base-chart.component.ts` | 153 |
| `updateChart` | Method | `src/app/framework/components/base-chart/base-chart.component.ts` | 174 |
| `handleRenderError` | Method | `src/app/framework/components/base-chart/base-chart.component.ts` | 224 |
| `handleClick` | Method | `src/app/framework/components/base-chart/base-chart.component.ts` | 48 |
| `onPlotlyClick` | Method | `src/app/framework/components/base-chart/base-chart.component.ts` | 114 |
| `onPlotlySelected` | Method | `src/app/framework/components/base-chart/base-chart.component.ts` | 128 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `NgOnInit → Transform` | intra_community | 3 |
| `NgOnInit → HandleRenderError` | intra_community | 3 |
| `NgOnChanges → Transform` | intra_community | 3 |
| `NgOnChanges → HandleRenderError` | intra_community | 3 |
| `RetryRender → Transform` | intra_community | 3 |
| `RetryRender → HandleRenderError` | intra_community | 3 |

## How to Explore

1. `gitnexus_context({name: "transform"})` — see callers and callees
2. `gitnexus_query({query: "base-chart"})` — find related execution flows
3. Read key files listed above for implementation details
