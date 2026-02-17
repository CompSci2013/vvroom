# VVRoom Session Orientation

*Use this document to bootstrap a fresh Claude Code session with full context.*

---

## Workflow: Claude Code as Dispatcher

**You (Claude Code) do NOT write code directly for VVRoom tasks.**

Instead, your role is to:
1. **Dispatch Jerry** - Launch Jerry as a background subagent with a task prompt
2. **Monitor Progress** - Query Elasticsearch logs to observe Jerry's tool calls in real-time
3. **Provide Narrative** - Explain to the user what Jerry is doing, step by step
4. **Intervene if Needed** - If Jerry gets stuck, provide guidance or restart with better prompts

Jerry (the LLM agent on Mimir) does all the actual coding work.

---

## Current Task: GitLab Issue #1

**Title:** Replace year range dual-dropdown picker with PrimeNG Slider
**Branch:** `feature/year-range-slider`
**Assignee:** Jerry
**Status:** In Progress (partially complete)

### Requirements

1. Create feature branch `feature/year-range-slider` from `main` ✅ Done
2. Replace the dual-dropdown year picker with PrimeNG `p-slider`:
   - Use `[range]="true"` for min/max year selection
   - Maintain URL-First conformity (slider state must sync with URL parameters)
   - Ensure bidirectional binding: URL → Slider and Slider → URL
3. Preserve existing behavior:
   - Default year range values
   - Integration with `UrlStateService`
   - Proper filter URL mapping via `IFilterUrlMapper`

### Technical Context

- **Architecture:** URL-First pattern where URL is single source of truth
- **Key Service:** `UrlStateService` manages URL parameters
- **Target Component:** `src/app/framework/components/query-control/`

---

## What Jerry Completed (Session 2026-02-16)

| File | Status |
|------|--------|
| `src/app/primeng.module.ts` | ✅ Added SliderModule |
| `src/app/app.module.ts` | ✅ Added SliderModule import |
| `src/app/framework/components/query-control/query-control.component.ts` | ✅ Changed rangeMin/rangeMax to rangeValues[] |
| `src/app/framework/components/query-control/query-control.component.html` | ✅ Replaced p-inputNumber with p-slider |

### What Still Needs Done

1. **Fix `src/app/components/vehicle-search/vehicle-search.component.html:6`**
   - Error: `range="true"` should be `[range]="true"` (property binding, not string)
   - This is a DIFFERENT component than query-control!
2. Verify build succeeds (`npm run build`)
3. Test the slider functionality

### Key Insight from Last Session

Jerry got stuck because the build error pointed to `vehicle-search.component.html` but he kept editing `query-control.component.html`. The error message clearly shows the file path - Jerry needs to READ the error output carefully.

---

## Agentic-Engine Improvements (2026-02-16)

Added two new hints to help Jerry avoid getting stuck:

### 1. System Prompt Addition
```
**When commands fail with error messages:**
1. Carefully read ALL file paths and line numbers in the error
2. Errors may reference files OTHER than the one you're working on
3. Fix errors in the order they appear, starting with the first file mentioned
```

### 2. Failure Tracking (agent-loop.ts)
After 3+ consecutive Bash failures, this hint is injected:
```
⚠️ TROUBLESHOOTING HINT: You've attempted this operation N times without success.
Before trying again:
- Re-read the COMPLETE error output from your last attempt
- List every unique file path mentioned in errors
- Verify you're modifying the correct file(s)
```

---

## MiniLab Infrastructure

### Key Machines

| Machine | Hardware | Role |
|---------|----------|------|
| **Thor** | Workstation | Source of truth for ~/projects, observability stack |
| **Mimir** | Mac Studio M4 Max, 256GB | LLM inference via mlx-cli-server:8081 |
| **MiniLab** | k8s control plane | GitLab, mlx-forge web UI |

### Services

| Service | URL | Purpose |
|---------|-----|---------|
| mlx-cli-server | mimir:8081 | LLM inference (OpenAI-compatible API) |
| GitLab | gitlab.minilab | Source control, issues |
| Elasticsearch | thor:30398 | Agent logs and observability |
| Grafana | thor:30300 | Metrics dashboards |

---

## Jerry - The AI Code Worker

**Jerry** is not a person — he's an LLM agent in the MiniLab ecosystem.

- **Current Model:** `lmstudio-community/Qwen3-235B-A22B-Instruct-2507-MLX-6bit`
- **Host:** Mimir (Mac Studio M4 Max) on port 8081
- **Runtime:** agentic-engine (TypeScript CLI with tool execution)
- **Role:** Autonomous code worker that executes tasks dispatched by Claude Code

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           THOR (Workstation)                            │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      Claude Code (dispatcher)                   │    │
│  │  • Runs in VSCode terminal                                      │    │
│  │  • Dispatches tasks to Jerry via background Bash                │    │
│  │  • Monitors Elasticsearch for progress                          │    │
│  └──────────────────────────────┬──────────────────────────────────┘    │
│                                 │ bash (background)                     │
│                                 ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │              agentic-engine (node dist/bin/mlx.js run)          │    │
│  │  • Sends prompts to Mimir                                       │    │
│  │  • Parses LLM output for tool calls                             │    │
│  │  • Executes tools locally (Read, Edit, Bash, etc.)              │    │
│  │  • Logs to Elasticsearch                                        │    │
│  └──────────────────────────────┬──────────────────────────────────┘    │
│                                 │                                       │
└─────────────────────────────────┼───────────────────────────────────────┘
                                  │ HTTP (OpenAI API)
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           MIMIR (Mac Studio)                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                   mlx-cli-server :8081                          │    │
│  │  • Loads Qwen3-235B into memory                                 │    │
│  │  • Serves /v1/chat/completions                                  │    │
│  │  • "Jerry" = the LLM generating responses                       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Dispatching Jerry (from Claude Code)

Claude Code launches Jerry as a **background Bash task**:

```bash
cd ~/projects/agentic-engine && node dist/bin/mlx.js run \
  --model "lmstudio-community/Qwen3-235B-A22B-Instruct-2507-MLX-6bit" \
  -d ~/projects/vvroom \
  -y \
  "Your task prompt here"
```

Use `run_in_background: true` so Claude Code can continue monitoring while Jerry works.

### Monitoring Jerry's Work (Elasticsearch Queries)

```bash
# Recent tool calls (last 10)
curl -s "http://thor:30398/agent-tools-*/_search?size=10&sort=timestamp:desc" \
  | jq '.hits.hits[]._source | {tool: .toolName, success: .result.success, time: .timestamp}'

# Get full details including output/errors
curl -s "http://thor:30398/agent-tools-*/_search" \
  -H 'Content-Type: application/json' \
  -d '{"size": 5, "sort": [{"timestamp": "desc"}]}' \
  | jq '.hits.hits[]._source'

# Get latest Bash error output
curl -s "http://thor:30398/agent-tools-*/_search" \
  -H 'Content-Type: application/json' \
  -d '{"size": 1, "sort": [{"timestamp": "desc"}], "query": {"match": {"toolName": "Bash"}}}' \
  | jq '.hits.hits[]._source.result'
```

---

## Model Loading

```bash
# Check loaded model
curl http://mimir:8081/v1/models

# Load Qwen3-235B-6bit
curl -X POST http://mimir:8081/v1/load \
  -H "Content-Type: application/json" \
  -d '{"model": "lmstudio-community/Qwen3-235B-A22B-Instruct-2507-MLX-6bit"}'
```

---

## Key Project Files

### VVRoom (Angular app)
- `src/app/primeng.module.ts` - PrimeNG module imports
- `src/app/app.module.ts` - Main app module
- `src/app/framework/components/query-control/` - Target component for slider
- `src/app/components/vehicle-search/` - **Has build error to fix!**

### Agentic-Engine (Jerry's runtime)
- `~/projects/agentic-engine/src/core/system-prompt.ts` - System prompt with hints
- `~/projects/agentic-engine/src/core/agent-loop.ts` - Main loop with failure tracking
- `~/projects/agentic-engine/src/tools/edit.ts` - Edit tool with remediation hints

---

## Quick Commands

```bash
# Build vvroom
cd ~/projects/vvroom && npm run build

# Check Jerry's model is loaded
curl http://mimir:8081/v1/models

# Load Jerry's model
curl -X POST http://mimir:8081/v1/load -H "Content-Type: application/json" \
  -d '{"model": "lmstudio-community/Qwen3-235B-A22B-Instruct-2507-MLX-6bit"}'

# Rebuild agentic-engine after changes
cd ~/projects/agentic-engine && npm run build
```

### Example: Dispatch Jerry for Current Task

```bash
cd ~/projects/agentic-engine && node dist/bin/mlx.js run \
  --model "lmstudio-community/Qwen3-235B-A22B-Instruct-2507-MLX-6bit" \
  -d ~/projects/vvroom -y \
  "Fix the build error in src/app/components/vehicle-search/vehicle-search.component.html line 6. Change range=\"true\" to [range]=\"true\" (property binding). Then run npm run build to verify."
```

---

## Claude Code Session Checklist

When starting a new session:

1. [ ] Read this orientation file
2. [ ] Check if Jerry's model is loaded: `curl http://mimir:8081/v1/models`
3. [ ] Load model if needed
4. [ ] Dispatch Jerry with the task (background)
5. [ ] Monitor Elasticsearch logs and narrate progress to user
6. [ ] Report completion or escalate failures

---

*Last updated: 2026-02-16 05:40 UTC*
