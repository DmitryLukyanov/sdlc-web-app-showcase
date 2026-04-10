# Implementation Plan: Automated Deployment to GitHub Pages

**Branch**: `copilot/sdlcspac-3-add-deploy-githubpages` | **Date**: 2025-07-21 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/001-deploy-github-pages/spec.md`  
**Jira Key**: SDLCSPAC-3

---

## Summary

Add a GitHub Actions workflow that automatically builds and deploys the static frontend
(`frontend/` directory) to GitHub Pages on every push to `main` (which includes all PR
merges). The workflow uses Node.js `npm install` as its build step, then publishes the
`frontend/` directory as a Pages artifact via the modern GitHub Pages Actions
(`actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`).
Authentication uses the built-in `GITHUB_TOKEN`; no external secrets are required.
Concurrent deployments are serialised so the most recently merged commit always wins.

---

## Technical Context

**Language/Version**: Node.js 20 LTS (GitHub-hosted runner), YAML 1.2 (workflow)  
**Primary Dependencies**:

| Action | Purpose |
|---|---|
| `actions/checkout@v4` | Checkout source at the merge commit |
| `actions/setup-node@v4` | Pin Node.js 20 LTS on the runner |
| `actions/configure-pages@v5` | Validate Pages is enabled; emit base-path |
| `actions/upload-pages-artifact@v3` | Package `frontend/` as the Pages artifact |
| `actions/deploy-pages@v4` | Publish the artifact to the Pages environment |

**Storage**: N/A (static file hosting, no database)  
**Testing**: Jest 29 + jest-environment-jsdom 29 (existing; run in CI before deploy)  
**Target Platform**: GitHub Actions (`ubuntu-latest` runner), GitHub Pages (CDN-backed static host)  
**Project Type**: CI/CD pipeline configuration — no application source code changes  
**Performance Goals**: End-to-end deployment completes within 10 minutes of any merge to `main` (SC-001)  
**Constraints**:

- `GITHUB_TOKEN` only — no external tokens or stored repository secrets  
- Minimal permission scope: `contents: read`, `pages: write`, `id-token: write`  
- No external notifications (FR-009)  
- No deployment history / versioning — each deploy overwrites (FR-003)  
- Concurrency group serialises or cancels superseded runs to guarantee newest commit wins

**Scale/Scope**: Single repository, single Pages environment, small static site (~3 files, <50 kB)

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

### Principle 1 — Quality ✅ PASS

The change is a single, focused workflow file (`deploy-pages.yml`). It has one stated
purpose (build + deploy on push to main) and introduces no unrelated concerns.  
No existing code patterns are altered; the PR touches only `.github/workflows/` and
`specs/`.

### Principle 2 — Testing ✅ PASS (with documented caveat)

The existing Jest suite runs as the first job in the workflow (`test` job). Deployment
is gated on `needs: test` — a failing test run prevents any deploy (FR-004).  
GitHub Actions workflow YAML itself cannot be unit-tested locally; correctness is
validated by GitHub's runtime linter on push and by the E2E acceptance criteria defined
in the spec (User Stories 1–3). This limitation is documented inline in the workflow file.

### Principle 3 — Security & Configuration ✅ PASS

- No secrets committed to the repository at any point  
- Only the built-in `GITHUB_TOKEN` is used, granted minimal permissions per job  
- The `frontend/` artifact contains only static HTML/CSS/JS — no runtime credentials  
- Logs cannot expose secrets because no secrets are present  
- `id-token: write` is required by `actions/deploy-pages` for OIDC-based Pages auth

### Principle 4 — Delivery ✅ PASS

The repository build remains green after this change (no source code modifications).
The new workflow file is self-documenting via inline comments; the concurrency-cancel
behaviour and permission rationale are documented where they appear in the YAML.

**Gate result: ALL PRINCIPLES PASS — proceed to Phase 0.**

---

## Project Structure

### Documentation (this feature)

```text
specs/001-deploy-github-pages/
├── spec.md              # Feature specification (input)
├── plan.md              # This file (Phase 0–1 output)
├── research.md          # Phase 0: resolved unknowns
├── data-model.md        # Phase 1: key entities
├── contracts/
│   └── workflow-schema.md   # Phase 1: workflow interface contract
├── quickstart.md        # Phase 1: developer how-to
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
.github/
└── workflows/
    └── deploy-pages.yml     # NEW — the only source change for this feature

frontend/
├── weather.html             # Deployed as-is (no build transform)
├── weather.css              # Deployed as-is
└── weather.js               # Deployed as-is

tests/
└── weather.test.js          # Existing; run by the test job in the new workflow

package.json                 # Existing; npm install + npm test unchanged
```

**Structure Decision**: Single-project layout (Option 1). The repository already has a
flat structure with `frontend/` for static files and `tests/` for Jest tests. This
feature adds exactly one file (`.github/workflows/deploy-pages.yml`) and no new
directories outside of `specs/`.

---

## Phase 0: Research

> All unknowns were resolved during the spec clarification session (2026-04-10).
> This section documents decisions and rationale in place of a separate agent dispatch.

### R-001 — Trigger Strategy

**Decision**: `on: push` to `main` branch (not `pull_request: closed` + merge check).  
**Rationale**: GitHub surfaces PR merges as push events on the target branch. A push
trigger is the canonical, low-latency mechanism for post-merge CI. The `pull_request: closed`
+ `merged == true` pattern (used in `pr-merged.yml`) is reserved for meta-operations
(issue closing, Jira updates) and adds an unnecessary join for deployment.  
**Alternative considered**: `on: pull_request: types: [closed]` with `if: merged == true` —
rejected because it introduces a conditional and is semantically a PR event, not a
deployment trigger.

### R-002 — Pages Authentication Model

**Decision**: `GITHUB_TOKEN` with `pages: write` + `id-token: write` (OIDC).  
**Rationale**: The modern GitHub Pages Actions (`deploy-pages@v4`) use OIDC token exchange
to obtain a short-lived Pages deployment token. This eliminates the need for a stored
`GH_TOKEN` PAT and is the approach recommended in GitHub's official documentation.  
**Alternative considered**: Personal Access Token stored as repository secret — rejected
(violates Principle 3; requires rotation; broader scope than needed).

### R-003 — Build Artefact Definition

**Decision**: The `frontend/` directory is uploaded verbatim as the Pages artifact.  
**Rationale**: The spec clarification confirmed no transpilation or bundling is required.
`npm install` populates `node_modules/` (needed for the test job), but `node_modules/`
is explicitly excluded from the Pages artifact — only `frontend/` is uploaded.  
**Alternative considered**: Build into a separate `dist/` directory — rejected (adds
unnecessary complexity; `frontend/` is already production-ready static content).

### R-004 — Concurrency Control

**Decision**: Single concurrency group (`pages`) with `cancel-in-progress: true`.  
**Rationale**: The spec edge-case analysis requires that when two PRs merge rapidly, only
the most recently triggered run completes deployment. `cancel-in-progress: true` cancels
any in-flight deployment run when a newer one is queued, guaranteeing the newest commit
always becomes the live Pages version.  
**Alternative considered**: Queue (no cancel) — rejected because it can leave the site
temporarily on an older commit if the second run finishes before the first.

### R-005 — Node.js Version Pinning

**Decision**: Pin to Node.js 20 LTS in the workflow (`node-version: '20'`).  
**Rationale**: The development environment already uses Node 20 (confirmed via `node --version`).
Pinning ensures runner/local parity and avoids unintended upgrades when GitHub updates
its default.  
**Alternative considered**: `node-version: 'lts/*'` — rejected (floating version risks
silent breaking changes).

### R-006 — Test Gate Before Deploy

**Decision**: Split workflow into two jobs: `test` (runs Jest) and `deploy` (`needs: test`).  
**Rationale**: FR-004 requires that a failed build/test must prevent deployment.
Separating jobs gives clear log attribution per phase and allows GitHub to display per-job
status in the PR status check list.  
**Alternative considered**: Single job with sequential steps — rejected because it conflates
CI and CD into one log stream, making failure diagnosis harder (violates SC-003 intent).

---

## Phase 1: Design & Contracts

### Data Model

See [`data-model.md`](./data-model.md) — generated below.

### Workflow Contract

See [`contracts/workflow-schema.md`](./contracts/workflow-schema.md) — generated below.

### Developer Quickstart

See [`quickstart.md`](./quickstart.md) — generated below.

---

## Implementation Blueprint

### Workflow Architecture

```
push → main
        │
        ▼
┌───────────────────┐
│   Job: test       │  ubuntu-latest
│   ─────────────── │
│   checkout        │
│   setup-node 20   │
│   npm ci          │
│   npm test        │
└────────┬──────────┘
         │ success (needs: test)
         ▼
┌───────────────────┐
│   Job: deploy     │  ubuntu-latest
│   ─────────────── │
│   checkout        │
│   configure-pages │  → validates Pages enabled, emits base_url
│   upload-artifact │  → packages frontend/ as pages artifact
│   deploy-pages    │  → OIDC exchange → deploy to Pages CDN
└───────────────────┘
         │
         ▼
   GitHub Pages URL
   (stable, predictable)
```

### Permissions Model

```yaml
# Workflow-level defaults (least-privilege baseline)
permissions:
  contents: read        # checkout

# deploy job overrides (additive for Pages OIDC)
  pages: write          # upload + deploy artifact
  id-token: write       # OIDC token for deploy-pages action
```

The `test` job inherits only `contents: read`. The `deploy` job adds `pages: write` and
`id-token: write` scoped to that job alone.

### Concurrency Strategy

```yaml
concurrency:
  group: pages
  cancel-in-progress: true
```

A single named group ensures at most one Pages deployment runs at a time. Any in-progress
run is cancelled when a newer push triggers the workflow.

### Workflow File — Annotated Design

```yaml
# .github/workflows/deploy-pages.yml
name: Deploy to GitHub Pages
run-name: "Deploy → Pages · ${{ github.ref_name }}@${{ github.sha }}"

on:
  push:
    branches: [main]     # Triggers on every push to main (incl. PR merges)

concurrency:
  group: pages
  cancel-in-progress: true  # Newest commit always wins

permissions:
  contents: read

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test

  deploy:
    name: Deploy
    needs: test                 # Gate: only runs if test job passes
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    permissions:
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: frontend/       # Only the static files; node_modules excluded
      - id: deploy
        uses: actions/deploy-pages@v4
```

### GitHub Pages Repository Settings (one-time)

These settings must be configured in the repository's GitHub Pages settings
(`Settings → Pages`) **before** or **alongside** merging the workflow PR:

| Setting | Value |
|---|---|
| **Source** | GitHub Actions (not a branch) |
| **Branch** | — (not applicable when source = Actions) |

Switching source to "GitHub Actions" is required for `actions/deploy-pages` to work.
No other repository settings changes are needed.

---

## Complexity Tracking

No constitution violations identified. No complexity justification required.

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Pages not enabled in org/repo plan | Low | High | Document prerequisite in quickstart; `configure-pages` fails fast with a clear error |
| Two deploys race and oldest wins | Low | Medium | `cancel-in-progress: true` on `concurrency.group: pages` |
| Empty artifact deployed | Very Low | High | `upload-pages-artifact` rejects empty directories by default; test job gate catches broken builds |
| GITHUB_TOKEN permissions insufficient | Low | High | Workflow sets `pages: write` + `id-token: write` explicitly; `configure-pages` validates and surfaces config errors |
| `node_modules` accidentally included in artifact | Very Low | Medium | `upload-pages-artifact` `path` is set to `frontend/` only; `node_modules` lives at repo root |

---

## Acceptance Criteria Traceability

| Spec Requirement | Implementation Element |
|---|---|
| FR-001: Trigger on push to main | `on: push: branches: [main]` |
| FR-002: npm install + copy frontend/ | `test` job: `npm ci`; `deploy` job: `upload-pages-artifact path: frontend/` |
| FR-003: Overwrite Pages site | `deploy-pages` always overwrites; no versioning |
| FR-004: No deploy on build failure | `needs: test` gate on `deploy` job |
| FR-005: Structured deployment logs | GitHub Actions run logs retained per run |
| FR-006: No secrets in logs/artifacts | Only `GITHUB_TOKEN` used; `frontend/` contains no secrets |
| FR-007: No manual steps | Fully automated via `on: push` trigger |
| FR-008: Stable Pages URL | `environment.url: ${{ steps.deploy.outputs.page_url }}` |
| FR-009: No external notifications | No notification steps in workflow |
| SC-001: Deploy within 10 min | Two-job pipeline on small static site; expected ~2–4 min |
| SC-004: Zero secrets in output | Verified by permissions model and artifact path scope |
| Edge case: rapid sequential merges | `concurrency.cancel-in-progress: true` |
| Edge case: empty artifact | `upload-pages-artifact` built-in validation |
| Edge case: missing permissions | `configure-pages` validation step surfaces error immediately |
