# Research: Automated GitHub Pages Deployment

**Feature**: SDLCSPAC-3 — Deploy Application to GitHub Pages  
**Phase**: 0 — Pre-design research  
**Date**: 2025-07-21  
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## Resolved Unknowns

All unknowns were resolved in the spec clarification session (2026-04-10) and validated
against GitHub Actions documentation and existing repository patterns.

---

### R-001 — Workflow Trigger

**Decision**: `on: push` to the `main` branch  
**Rationale**: GitHub surfaces PR merges as push events on the target branch. The push
trigger fires immediately on merge without requiring a `if: github.event.pull_request.merged == true`
conditional. It also handles direct pushes to `main` consistently (spec: "every push to
main initiates a deployment").  
**Alternatives considered**:

- `on: pull_request: types: [closed]` with merge check — rejected: adds a conditional,
  slightly delayed (PR event fires after push event), semantically misaligned with
  deployment intent
- `on: workflow_dispatch` only — rejected: requires manual trigger, violates FR-007

---

### R-002 — Authentication & Permissions

**Decision**: Built-in `GITHUB_TOKEN` with `pages: write` + `id-token: write` (OIDC)  
**Rationale**: The modern `actions/deploy-pages` action uses OpenID Connect (OIDC) to
exchange the workflow's `id-token` for a short-lived Pages deployment credential.
This avoids storing any Personal Access Token (PAT) as a repository secret, eliminating
credential rotation burden and scope-creep risk.  
**Alternatives considered**:

- PAT stored as `GH_TOKEN` repository secret — rejected: violates Principle 3 (Security),
  requires rotation, grants broader permissions than needed
- GitHub App token — rejected: over-engineered for a single-repo deployment workflow

---

### R-003 — Build Artefact Scope

**Decision**: Upload the `frontend/` directory verbatim as the Pages artifact  
**Rationale**: The spec clarification confirmed the application requires no transpilation
or bundling. `npm install` installs `devDependencies` for the test runner (Jest) but
produces no build output. The `frontend/` directory (`weather.html`, `weather.css`,
`weather.js`) is already production-ready. `node_modules/` (at repository root) is
excluded by scoping `upload-pages-artifact` `path` to `frontend/`.  
**Alternatives considered**:

- Build to a separate `dist/` directory — rejected: adds unnecessary complexity and
  a copy/move step with no benefit for a pure-static site
- Upload entire repository root — rejected: would include `node_modules/`, `tests/`,
  `.github/`, and spec files in the public artifact (security and size concern)

---

### R-004 — Concurrency & Race Conditions

**Decision**: `concurrency: group: pages, cancel-in-progress: true`  
**Rationale**: The spec edge-case analysis identifies rapid sequential PR merges as a
risk — the oldest pipeline run could finish last, leaving an outdated version live.
Setting `cancel-in-progress: true` on a shared `pages` group ensures any in-progress
deploy run is cancelled when a newer push triggers the workflow, so only the most
recently merged commit's artifact reaches Pages.  
**Alternatives considered**:

- No concurrency control — rejected: race condition risk identified in spec
- Queue without cancel (`cancel-in-progress: false`) — rejected: guarantees order but
  allows old artifacts to deploy unnecessarily; slower resolution when queue grows
- Per-SHA group — rejected: defeats the purpose; multiple runs would proceed in parallel

---

### R-005 — Node.js Version

**Decision**: Pin to Node.js `20` LTS in the workflow  
**Rationale**: The development environment runs Node 20.20.2 (confirmed). `package.json`
uses Jest 29 which supports Node 18+. Pinning to `20` ensures CI/local parity and
avoids silent breakage if the runner's LTS default advances to Node 22.  
**Alternatives considered**:

- `node-version: 'lts/*'` — rejected: floating version; may break Jest or other dev
  dependencies without explicit version bump
- `node-version: '18'` — rejected: older than dev environment; unnecessary divergence

---

### R-006 — Job Structure (Test Gate)

**Decision**: Two jobs — `test` (Jest) and `deploy` (`needs: test`)  
**Rationale**: FR-004 requires that a failing test prevents deployment. Separating CI
and CD into distinct jobs provides:

1. Clear per-job status in GitHub's PR check list
2. Independent log streams (easier failure diagnosis, SC-003)
3. Semantic correctness — "test" and "deploy" are different concerns  

**Alternatives considered**:

- Single job with sequential steps — rejected: conflates CI and CD in one log;
  harder to diagnose which phase failed
- Three jobs (lint + test + deploy) — rejected: ESLint is a dev tool, not a gate
  for deployment; over-engineers the pipeline for a 3-file static site

---

### R-007 — Pages Source Configuration

**Decision**: Repository `Settings → Pages → Source` must be set to **GitHub Actions**  
**Rationale**: The modern Pages Actions (`deploy-pages`) require the repository to use
"GitHub Actions" as the Pages source rather than a branch-based deploy. This is a
one-time repository setting, not a workflow concern. `actions/configure-pages` validates
this and fails with an actionable error if the setting is wrong.  
**Alternatives considered**:

- Branch-based deploy (e.g., `gh-pages` branch) — rejected: requires `peaceiris/actions-gh-pages`
  or manual git push; deprecated pattern; not compatible with `deploy-pages@v4`

---

## Summary Table

| ID | Unknown | Decision | Impact |
|---|---|---|---|
| R-001 | Trigger strategy | `on: push: branches: [main]` | Immediate, low-friction |
| R-002 | Auth model | `GITHUB_TOKEN` + OIDC | No secrets required |
| R-003 | Artifact scope | `frontend/` directory only | Clean, minimal artifact |
| R-004 | Concurrency | cancel-in-progress | Newest commit always wins |
| R-005 | Node.js version | Pin `20` LTS | CI/local parity |
| R-006 | Job structure | test → deploy (needs gate) | FR-004 compliance |
| R-007 | Pages source | GitHub Actions mode | Required for deploy-pages |
