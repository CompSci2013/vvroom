---
name: services
description: "Skill for the Services area of vvroom. 149 symbols across 22 files."
---

# Services

149 symbols | 22 files | Cohesion: 93%

## When to Use

- Working with code in `src/`
- Understanding how mergeDomainFeatures, parsePopOutRoute, validate work
- Modifying services-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/app/framework/services/user-preferences.service.ts` | getPanelOrder, getCollapsedPanels, savePanelOrder, saveCollapsedPanels, savePreferencesToBackend (+11) |
| `src/app/framework/services/ai.service.ts` | selectModel, getTimeout, sendMessage, summarizeResults, generateRequestId (+11) |
| `src/app/framework/services/domain-config-validator.service.ts` | validate, validateAndSanitize, validateRequiredString, validateRequiredField, validateDomainNameFormat (+10) |
| `src/app/framework/services/resource-management.service.ts` | updateFilters, clearFilters, constructor, watchUrlChanges, getCurrentState (+9) |
| `src/app/framework/services/error-notification.service.ts` | constructor, startCleanupTimer, cleanupRecentErrors, showError, showWarning (+7) |
| `src/app/features/discover/discover.component.ts` | handleComponentOutput, onUrlParamsChange, onClearAllFilters, onStandaloneChartClick, onPickerSelectionChangeAndUpdateUrl (+5) |
| `src/app/framework/services/global-error.handler.ts` | handleError, unwrapError, isHttpError, isChunkLoadError, isPromiseRejection (+5) |
| `src/app/framework/services/domain-config-registry.service.ts` | register, registerMultiple, setActive, has, getAllDomainNames (+5) |
| `src/app/framework/services/url-state.service.ts` | setParams, clearParams, setParam, watchParams, getParams (+4) |
| `src/app/framework/services/api.service.ts` | delete, get, post, put, patch (+2) |

## Entry Points

Start here when exploring this area:

- **`mergeDomainFeatures`** (Function) — `src/app/framework/models/domain-config.interface.ts:828`
- **`parsePopOutRoute`** (Function) — `src/app/framework/models/popout.interface.ts:386`
- **`validate`** (Method) — `src/app/framework/services/domain-config-validator.service.ts:46`
- **`validateAndSanitize`** (Method) — `src/app/framework/services/domain-config-validator.service.ts:121`
- **`validateRequiredString`** (Method) — `src/app/framework/services/domain-config-validator.service.ts:148`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `mergeDomainFeatures` | Function | `src/app/framework/models/domain-config.interface.ts` | 828 |
| `parsePopOutRoute` | Function | `src/app/framework/models/popout.interface.ts` | 386 |
| `validate` | Method | `src/app/framework/services/domain-config-validator.service.ts` | 46 |
| `validateAndSanitize` | Method | `src/app/framework/services/domain-config-validator.service.ts` | 121 |
| `validateRequiredString` | Method | `src/app/framework/services/domain-config-validator.service.ts` | 148 |
| `validateRequiredField` | Method | `src/app/framework/services/domain-config-validator.service.ts` | 182 |
| `validateDomainNameFormat` | Method | `src/app/framework/services/domain-config-validator.service.ts` | 199 |
| `validateApiBaseUrl` | Method | `src/app/framework/services/domain-config-validator.service.ts` | 222 |
| `validateApiAdapter` | Method | `src/app/framework/services/domain-config-validator.service.ts` | 244 |
| `validateUrlMapper` | Method | `src/app/framework/services/domain-config-validator.service.ts` | 263 |
| `validateCacheKeyBuilder` | Method | `src/app/framework/services/domain-config-validator.service.ts` | 291 |
| `validateTableConfig` | Method | `src/app/framework/services/domain-config-validator.service.ts` | 310 |
| `validateArray` | Method | `src/app/framework/services/domain-config-validator.service.ts` | 351 |
| `validatePickers` | Method | `src/app/framework/services/domain-config-validator.service.ts` | 378 |
| `validateFilters` | Method | `src/app/framework/services/domain-config-validator.service.ts` | 408 |
| `validateCharts` | Method | `src/app/framework/services/domain-config-validator.service.ts` | 446 |
| `validateFeatures` | Method | `src/app/framework/services/domain-config-validator.service.ts` | 492 |
| `toUrlParams` | Method | `src/app/framework/models/resource-management.interface.ts` | 15 |
| `setParams` | Method | `src/app/framework/services/url-state.service.ts` | 109 |
| `clearParams` | Method | `src/app/framework/services/url-state.service.ts` | 165 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `NgOnInit → BuildHttpParams` | cross_community | 5 |
| `NgOnInit → SetParams` | cross_community | 5 |
| `NgOnInit → ClearParams` | cross_community | 5 |
| `NgOnInit → ToUrlParams` | cross_community | 5 |
| `NgOnInit → BuildHttpParams` | cross_community | 5 |
| `Constructor → BuildHttpParams` | cross_community | 5 |
| `OnChartPopOut → Close` | cross_community | 5 |
| `NgOnInit → UpdateState` | cross_community | 4 |
| `Execute → BuildHttpParams` | cross_community | 4 |
| `ShowHttpError → GetErrorSignature` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Configs | 1 calls |
| Discover | 1 calls |

## How to Explore

1. `gitnexus_context({name: "mergeDomainFeatures"})` — see callers and callees
2. `gitnexus_query({query: "services"})` — find related execution flows
3. Read key files listed above for implementation details
