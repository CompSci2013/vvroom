# Category 6: Router Navigate Encapsulation Tests

**Session Scope:** 4 tests (code analysis, no screenshots)

## Prerequisites

Before starting, ensure:
- Categories 1-5 are complete
- No server needed - these are static code analysis tests

## Critical Requirements

**IMPORTANT: Verification is Mandatory**

A test is NOT complete until you have verified the results. The grep command running without errors does NOT mean the test passes - you must verify the output meets criteria.

---

## Execution Model: Parallel Subagents

The orchestrator (main agent) spawns subagents to run all 4 tests in parallel.

### Subagent Task
Each subagent receives ONE test to execute. The subagent must:
1. Run the grep/analysis command
2. Verify output meets test-rubric.md criteria
3. Return a structured result:
   - Test ID
   - PASS or FAIL
   - Command output summary
   - Verification notes (what was observed)
   - Any issues found

### Orchestrator Responsibilities
After all subagents complete:
1. Collect all subagent results
2. Update test-checklist.md with `[x]`
3. Append journal entries for each test
4. If all passed: commit and push

### Subagent Prompt Template
```
You are a test execution agent. Run exactly ONE code analysis test and verify the results.

Test ID: R6.x
Command: [grep command]
Description: [test description]
Expected: [expected output]

After running the command:
1. Verify the output matches expected criteria
2. Return your findings in this format:
   TEST_ID: R6.x
   STATUS: PASS or FAIL
   OUTPUT: [summary of grep output]
   VERIFIED: [what you observed]
   ISSUES: [any problems found, or "none"]
```

---

## Test List

| Test ID | Description |
|---------|-------------|
| R6.1 | router.navigate only appears in UrlStateService |
| R6.2 | Components do not call router.navigate directly |
| R6.3 | Pop-out components do not call router.navigate |
| R6.4 | UrlStateService has setParams method for navigation |

## Startup Sequence

```
Read ~/projects/vvroom/textbook-quality/test-checklist.md
Read ~/projects/vvroom/textbook-quality/quality-journal.md (first 11 lines)
Tail ~/projects/vvroom/textbook-quality/quality-journal.md (last 150 lines)
Read ~/projects/vvroom/textbook-quality/test-rubric.md (Category 6 section)
Read ~/projects/vvroom/textbook-quality/kickoff-prompt.md
```

**Note:** Category 6 tests are code analysis only (no screenshots needed).

## Subsection Workflows

---

### R6.x - Router Encapsulation (4 tests)

**Spawn 4 subagents in parallel**, one for each test:

| Test ID | Command | Expected |
|---------|---------|----------|
| R6.1 | `grep -rn "router\.navigate" ~/projects/vvroom/src --include="*.ts"` | All results in url-state.service.ts (or .spec.ts files) |
| R6.2 | `grep -rn "router\.navigate" ~/projects/vvroom/src/app --include="*.component.ts"` | No results |
| R6.3 | `grep -rn "router\.navigate" ~/projects/vvroom/src/app --include="*popout*.ts" --include="*pop-out*.ts"` | No results |
| R6.4 | `grep -n "setParams\|clearParams\|router\.navigate" ~/projects/vvroom/src/app/framework/services/url-state.service.ts` | Results showing navigation abstraction |

**After all 4 subagents return:**
Verify all tests passed.

Commit message: `Complete R6.x router encapsulation tests (4 tests)`

---

## Journal Entry Format

For code analysis tests, the journal entry format is:

```markdown
YYYY-MM-DD_HH:MM:SS
Test R6.1 - router.navigate only in UrlStateService: PASS
Verified: grep found N occurrences of router.navigate, all in url-state.service.ts
No violations in component or pop-out files
```

---

## Category Completion

After all 4 tests are complete:

```bash
# Verify spec file exists and has 4 tests
grep -c "test('" e2e/tests/category-6-router-encapsulation.spec.ts  # Must output: 4
```

Update test-checklist.md with all 4 tests marked complete (no screenshot column needed).

**STOP HERE.** Inform the user that Category 6 is complete. Do not proceed to Category 7 in this session.

Final commit: `Category 6 Router Encapsulation Tests complete (4/4 tests)`
