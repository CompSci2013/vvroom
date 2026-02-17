# Two-Stage Pipeline Demonstration

This document shows the exact inputs and outputs for the Kibana-to-GitLab comment pipeline.

**Model:** `mlx-community/Qwen3-VL-235B-A22B-Instruct-4bit`

---

## Stage 1: Raw Kibana Logs → Structured Summary

### Input (Raw Elasticsearch JSON)

```json
[
  {"iteration": 1, "toolName": "Edit", "success": true, "error": null, "output_preview": "Successfully edited file"},
  {"iteration": 2, "toolName": "Bash", "success": false, "error": "Command failed with exit code 1", "output_preview": "rg: command not found"},
  {"iteration": 3, "toolName": "Edit", "success": true, "error": null, "output_preview": "Successfully edited file"},
  {"iteration": 4, "toolName": "Bash", "success": false, "error": "Command failed with exit code 1", "output_preview": "error TS2339: Property rangeMin does not exist"},
  {"iteration": 5, "toolName": "Edit", "success": false, "error": "old_string not found in file", "output_preview": "The specified text was not found"},
  {"iteration": 6, "toolName": "Edit", "success": true, "error": null, "output_preview": "Successfully edited file"},
  {"iteration": 7, "toolName": "Bash", "success": false, "error": "Command failed with exit code 1", "output_preview": "error TS2339: Property rangeMin does not exist"},
  {"iteration": 8, "toolName": "Edit", "success": true, "error": null, "output_preview": "Successfully edited file"},
  {"iteration": 9, "toolName": "Bash", "success": false, "error": "Command failed with exit code 1", "output_preview": "rg: command not found"},
  {"iteration": 10, "toolName": "Bash", "success": false, "error": "Command failed with exit code 1", "output_preview": "rg: command not found"}
]
```

### Prompt Sent to Model

```
You are receiving raw Kibana/Elasticsearch logs from an AI agent session. These logs show tool executions during an automated coding task.

Parse these logs and return a structured summary with:
1. Total iterations
2. Tools used and their success/failure counts
3. Key errors encountered
4. Overall session outcome (success/partial/failed)

Raw logs:
[the JSON above]
```

### Model Response

```json
{
  "total_iterations": 10,
  "tools_used": {
    "Edit": {
      "success_count": 5,
      "failure_count": 1
    },
    "Bash": {
      "success_count": 0,
      "failure_count": 4
    }
  },
  "key_errors": [
    "Command failed with exit code 1: 'rg: command not found'",
    "Command failed with exit code 1: 'error TS2339: Property rangeMin does not exist'",
    "Edit tool failure: 'old_string not found in file'"
  ],
  "overall_session_outcome": "failed"
}
```

**Token Usage:** 438 prompt + 116 completion = 554 total

---

## Stage 2: Structured Summary → GitLab Comment

### Input (Structured Summary from Stage 1)

```json
{
  "total_iterations": 10,
  "tools_used": {
    "Edit": {"success_count": 5, "failure_count": 1},
    "Bash": {"success_count": 0, "failure_count": 4}
  },
  "key_errors": [
    "rg: command not found",
    "error TS2339: Property rangeMin does not exist",
    "old_string not found in file"
  ],
  "overall_session_outcome": "failed"
}
```

### Prompt Sent to Model

```
Generate a GitLab issue comment based on this agent session summary. The comment should be:
- Concise (2-4 sentences)
- Use emoji for visual scanning
- Highlight blockers or next steps
- Suitable for a developer to quickly understand what happened

Summary:
[the JSON above]
```

### Model Response

```
🚨 Session failed after 10 iterations — Bash tool failed 4x (missing `rg`), and Edit had 1 failure (old_string not found).
🔧 Blockers: Install `ripgrep` + fix TS2339 (rangeMin undefined).
✅ Next: Fix type errors & ensure tools are available before retry.
```

**Token Usage:** 149 prompt + 64 completion = 213 total

---

## Pipeline Diagram

```
┌─────────────────────┐
│  Elasticsearch      │
│  (Kibana logs)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Stage 1 Prompt     │
│  "Parse these logs" │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Qwen3-VL-235B      │
│  (on Mimir)         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Structured JSON    │
│  (machine-readable) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Stage 2 Prompt     │
│  "Generate comment" │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Qwen3-VL-235B      │
│  (on Mimir)         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  GitLab Comment     │
│  (ready to post)    │
└─────────────────────┘
```

---

## Model Comparison

| Aspect | Qwen2.5-7B | Qwen3-VL-235B |
|--------|------------|---------------|
| Stage 1 output format | Markdown | Pure JSON |
| Stage 1 tokens | ~200 | 554 |
| Stage 2 tokens | ~150 | 213 |
| Parseability | Needs extraction | Direct `jq` |
| Blockers/Next steps | Implicit | Explicit sections |

---

*Generated: 2026-02-15*
*Model: mlx-community/Qwen3-VL-235B-A22B-Instruct-4bit*
