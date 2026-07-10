# Refactor `no-ngx-libs` — delta map + strategy (Unit 1)

Branch: `refactor/no-ngx-libs` (created at `6e99438`). Behavioral target: `feature/refactor` tip
(`d6beef6`) — Angular 14, the current running app. Goal: same behavior, **no `ngx-*`/`@halolabs` libraries**,
all code in `src/app/`, mergeable into `main`.

## The ngx footprint at the tip is TINY
Only three extraction touchpoints exist at `feature/refactor`:

| # | What | Where referenced | In-place source available |
|---|---|---|---|
| 1 | `@halolabs/ngx-popout` (`PopOutManagerService`, `PopOutMessageType`) | `src/app/features/discover/discover.component.ts:16` | `6e99438` has the local `popout-manager.service.ts` + popout code |
| 2 | `@halolabs/ngx-plotly-wrapper` (`PlotlyModule`) | `src/app/framework/framework.module.ts:7` | `6e99438` uses **direct Plotly.js** (no wrapper) |
| 3 | `projects/ngx-chart` (local library) | `base-chart.component.ts` / discover | source is in-repo under `projects/ngx-chart/` |

The 36 framework components stayed in `src/app/` at the tip — they were **not** extracted. So "un-ngx-ing"
is: inline 3 things + drop 2 deps + drop `projects/ngx-chart`.

## Two strategies (sizing)
- **Build-UP from `6e99438`** — apply the `6e99438`→tip `src/app` diff (**17 files, +302/−883**) by hand,
  redo the Angular 13→14 upgrade, then *still* strip the ngx refs. High effort, high risk, and the diff
  itself imports `@halolabs`. ✗
- **Strip-DOWN from the tip** — start the branch content at the tip (guaranteed-identical behavior,
  Ng14, all improvements already present) and change only the **3 touchpoints** + `package.json` +
  remove `projects/ngx-chart`. Lowest effort, and parity is *guaranteed* because we begin from the exact
  target. ✓ **RECOMMENDED.**

## Recommended plan (strip-down)
1. **Re-baseline branch content to the tip** while keeping the branch name `refactor/no-ngx-libs`
   (e.g. `git reset --hard feature/refactor` on this branch, or `git checkout feature/refactor -- .`).
   NOTE: this changes the *starting content* from `6e99438` to the tip — a deliberate deviation from the
   literal "start at 6e99438" because the tip is the behavior we must match. **Needs Odin's OK.**
2. **Inline plotly-wrapper (touchpoint 2):** revert `base-chart` + `framework.module` to direct
   `plotly.js-dist-min` calls (the `6e99438` approach) or inline the thin wrapper; drop
   `@halolabs/ngx-plotly-wrapper` from `package.json`.
3. **Inline popout (touchpoint 1):** move the portal-based popout code from `@halolabs/ngx-popout` into
   `src/app/` (keep the tip's portal behavior — it is an improvement over `6e99438`'s local version);
   rewire `discover.component.ts` to the local service; drop the dep.
4. **Inline ngx-chart (touchpoint 3):** move `projects/ngx-chart/src/lib` into `src/app/framework/...`;
   rewire imports; delete `projects/ngx-chart` + its `tsconfig`/`angular.json` project entry.
5. **Purge:** grep for `@halolabs`, `@sef`, `projects/ngx-`, `ngx-plotly-wrapper`, `ngx-popout` → zero.
6. **Build + serve (Ng14) + parity check** against the tip: home→tiles→discover; URL-First controls;
   year slider; charts click/select; table sort/paginate/expand (VIN sub-table); popout open/restore;
   panels collapse/reorder. Any `e2e/` tests pass equivalently.

## Open decision for Odin
The literal instruction was "start at `6e99438`." Strip-down instead starts the *content* at the tip
(branch name unchanged). This is the right engineering call (guaranteed parity, ~3 files vs a full
Ng14 re-port), but it deviates from the literal base point — **confirm before the code phase.**
