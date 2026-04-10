# Tasks: Automated Deployment to GitHub Pages

**Feature**: `001-deploy-github-pages`  
**Jira Key**: SDLCSPAC-3  
**Input**: Design documents from `specs/001-deploy-github-pages/`  
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | contracts/ ✅  
**Tests**: Not requested — no test tasks generated  

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in each description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the GitHub Actions workflow file scaffold and establish the CI/CD directory structure

- [X] T001 Create GitHub Actions workflow file scaffold at `.github/workflows/deploy-pages.yml` with top-level `name` field and empty `on`, `permissions`, `concurrency`, and `jobs` stubs

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Wire the event trigger and shared runner steps that both the `test` job and `deploy` job depend on — these must be complete before any user-story job logic can be added

**⚠️ CRITICAL**: No user-story job content can be added until the trigger and checkout/Node.js steps are defined

- [X] T002 Define `on: push: branches: [main]` trigger block in `.github/workflows/deploy-pages.yml` so the workflow fires on every push to `main` (including PR merges)
- [X] T003 Add `actions/checkout@v4` step to the `test` job in `.github/workflows/deploy-pages.yml` to check out the repository at the triggering commit
- [X] T004 Add `actions/setup-node@v4` step (with `node-version: '20'`) to the `test` job in `.github/workflows/deploy-pages.yml` to pin Node.js 20 LTS on the runner

**Checkpoint**: Trigger and shared runner steps are wired — user-story job content can now be implemented

---

## Phase 3: User Story 1 — Automatic Deployment on Merge (Priority: P1) 🎯 MVP

**Goal**: Every push to `main` automatically builds the app and deploys the `frontend/` directory to GitHub Pages — no manual steps required

**Independent Test**: Merge any pull request into `main` and confirm the GitHub Pages URL reflects the PR's changes within 10 minutes, with no manual action taken (SC-001, FR-001, FR-007)

### Implementation for User Story 1

- [X] T005 [US1] Add `actions/configure-pages@v5` step to the `deploy` job in `.github/workflows/deploy-pages.yml` to validate that GitHub Pages is enabled and emit the base path for the artifact
- [X] T006 [US1] Add `actions/upload-pages-artifact@v3` step (with `path: frontend/`) to the `deploy` job in `.github/workflows/deploy-pages.yml` to package the static `frontend/` directory as the Pages artifact
- [X] T007 [US1] Add `actions/deploy-pages@v4` step to the `deploy` job in `.github/workflows/deploy-pages.yml` to publish the uploaded artifact to the GitHub Pages environment via OIDC token exchange

**Checkpoint**: A full push-to-main event should now trigger the workflow, build the artifact from `frontend/`, and deploy it to GitHub Pages

---

## Phase 4: User Story 2 — Deployment Failure Visibility (Priority: P2)

**Goal**: Any pipeline failure surfaces in structured GitHub Actions logs and halts the deployment — no broken build ever reaches GitHub Pages

**Independent Test**: Introduce a deliberate test failure (e.g., a broken assertion in `weather.test.js`), push to `main`, and confirm the pipeline is marked failed, the `deploy` job is skipped, and the failure cause is visible in the run logs (FR-004, FR-005, SC-003)

### Implementation for User Story 2

- [X] T008 [US2] Add `npm install && npm test` run step to the `test` job in `.github/workflows/deploy-pages.yml`, and set `needs: test` on the `deploy` job so that any Jest failure blocks deployment (FR-004, R-006)

**Checkpoint**: A failing Jest test should now prevent the `deploy` job from running, with the failure visible in structured GitHub Actions logs

---

## Phase 5: User Story 3 — Stakeholder Access to Latest Deployment (Priority: P3)

**Goal**: GitHub Pages always serves the artifact from the most recently completed successful pipeline run — rapid sequential merges never leave an older version deployed

**Independent Test**: Merge two PRs in rapid succession and confirm that GitHub Pages ultimately reflects the second (newest) PR's content, not the first (FR-003, R-004, SC-002)

### Implementation for User Story 3

- [X] T009 [US3] Set `permissions: contents: read` at workflow level plus `permissions: pages: write / id-token: write` on the `deploy` job, and add `concurrency: group: pages / cancel-in-progress: true` at workflow level in `.github/workflows/deploy-pages.yml` to serialise deployments and guarantee the newest commit wins (FR-006, R-004)
- [X] T010 [P] [US3] Update `README.md` with a Deployment section documenting the GitHub Pages URL, the automatic trigger (push to `main`), how to view pipeline run logs, and the concurrency behaviour for rapid merges (FR-008)

**Checkpoint**: All three user stories are now independently functional — GitHub Pages is always current, failures are visible, and the newest merge always wins

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, inline documentation, and quickstart validation

- [X] T011 Add inline YAML comments to `.github/workflows/deploy-pages.yml` documenting: the OIDC rationale for `id-token: write`, the `cancel-in-progress` concurrency behaviour, the `needs: test` gate, and the note that workflow YAML cannot be unit-tested locally (plan.md Principle 2 caveat)
- [X] T012 [P] Run the `quickstart.md` validation checklist against the deployed workflow to confirm all acceptance scenarios for US1–US3 pass end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001) — **BLOCKS all user-story phases**
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion (T002, T003, T004)
- **User Story 2 (Phase 4)**: Depends on Phase 2 completion; T008 inserts into the `test` job established in Phase 2 — can proceed in parallel with Phase 3
- **User Story 3 (Phase 5)**: Depends on Phase 3 and Phase 4 completion (permissions must wrap the complete `deploy` job)
- **Polish (Phase 6)**: Depends on all user-story phases being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Phase 2 — no dependency on US2 or US3
- **User Story 2 (P2)**: Starts after Phase 2 — can run **in parallel with US1** (different job stanza, same file)
- **User Story 3 (P3)**: Depends on US1 (deploy job must exist before permissions/concurrency wrap it) and US2 (test gate must exist before `needs: test` is meaningful); T010 (README) is fully independent [P]

### Within Each User Story

- T005 → T006 → T007 must execute in order (each step depends on the previous being present)
- T008 must follow T003/T004 (inserts into the same `test` job)
- T009 must follow T007 (wraps the completed `deploy` job with permissions)
- T010 is independent of all workflow tasks [P]
- T011 follows all implementation tasks (annotates completed YAML)
- T012 follows T011 (validates the finalised workflow)

---

## Parallel Opportunities

### Phases 3 and 4 can run concurrently

```
# After Phase 2 completes, both can start at the same time:
Task T005: "Add actions/configure-pages step in deploy job"   # Phase 3 / US1
Task T008: "Add npm install && npm test step in test job"      # Phase 4 / US2
```

### README update is fully independent

```
# T010 can be written in parallel with any workflow task:
Task T010: "Update README.md with Deployment section"          # [P] — separate file
```

### Polish tasks can run in parallel

```
# After all user-story phases complete:
Task T011: "Add inline YAML comments to deploy-pages.yml"
Task T012: "Run quickstart.md validation checklist"            # [P] — read-only validation
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002, T003, T004) — **CRITICAL**
3. Complete Phase 3: User Story 1 (T005, T006, T007)
4. **STOP and VALIDATE**: Push to `main` and confirm GitHub Pages receives the `frontend/` artifact
5. Proceed to Phase 4 and Phase 5 to add failure visibility and concurrency guarantees

### Incremental Delivery

1. T001 → T002–T004 → Foundation ready (workflow triggers, runner configured)
2. Add T005–T007 → US1 complete → Deploy pipeline live (MVP!)
3. Add T008 → US2 complete → Test gate active; broken builds can't reach Pages
4. Add T009 → US3 partially complete → Permissions minimal; rapid merges serialised
5. Add T010 → US3 fully complete → Stakeholders have stable URL + docs
6. Add T011–T012 → Polish complete → Workflow self-documented and validated

### Single Developer Strategy

Work top-to-bottom through the task list. Each task is a small, targeted edit to
`.github/workflows/deploy-pages.yml` (or `README.md`). Commit after each logical
group (e.g., after T004, after T007, after T009) to enable easy bisection if a
workflow run fails validation.

---

## Notes

- **One source file**: This feature introduces exactly one new source file — `.github/workflows/deploy-pages.yml` — plus one documentation update (`README.md`)
- **Workflow filename**: The plan specifies `deploy-pages.yml` (not `deploy.yml`); use this name throughout
- **Two-job architecture**: `test` job (runs Jest) → `deploy` job (`needs: test`, runs Pages steps)
- **No secrets required**: Authentication uses the built-in `GITHUB_TOKEN` via OIDC; no repository secrets need to be configured
- **[P] tasks** = different files or non-conflicting stanzas, safe to run concurrently
- **[Story] label** maps each task to a specific user story for traceability
- Commit after each task or logical group; push to a feature branch and open a PR to `main` to trigger the live validation of US1–US3
