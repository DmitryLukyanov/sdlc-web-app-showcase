# Data Model: Automated GitHub Pages Deployment

**Feature**: SDLCSPAC-3 — Deploy Application to GitHub Pages  
**Phase**: 1 — Design  
**Date**: 2025-07-21

---

## Overview

This feature is a CI/CD pipeline configuration. It introduces no new application data
structures, databases, or persistent storage. The entities below describe the **runtime
concepts** that the GitHub Actions workflow manages. They are documented for reasoning
about correctness, edge cases, and acceptance criteria — not as schema definitions.

---

## Entity: Pipeline Run

A single execution of the `deploy-pages.yml` workflow, triggered by a push event on
the `main` branch.

| Field | Type | Source | Notes |
|---|---|---|---|
| `run_id` | integer | GitHub Actions | Unique across the repository |
| `trigger_sha` | string (SHA-1) | `github.sha` | Commit that triggered the run |
| `trigger_ref` | string | `github.ref` | Always `refs/heads/main` for this workflow |
| `status` | enum | GitHub Actions | `queued` → `in_progress` → `success` / `failure` / `cancelled` |
| `started_at` | timestamp | GitHub Actions | When the first job began |
| `completed_at` | timestamp | GitHub Actions | When the last job finished |
| `logs_url` | URL | GitHub Actions | `https://github.com/{owner}/{repo}/actions/runs/{run_id}` |
| `cancelled_by` | run_id / null | Concurrency system | Set when this run was cancelled by a newer run |

**State transitions**:

```
queued → in_progress → success
                     → failure    (test job failed OR deploy job failed)
                     → cancelled  (superseded by newer run via concurrency group)
```

**Invariant**: A Pipeline Run in `success` state MUST have an associated Deployment
in `active` state on the GitHub Pages Environment.

---

## Entity: Build Artifact

The deployable output of the `test` + `deploy` job sequence — the packaged contents of
the `frontend/` directory.

| Field | Type | Source | Notes |
|---|---|---|---|
| `artifact_id` | integer | GitHub Actions | Assigned by `upload-pages-artifact` |
| `source_path` | string | Workflow config | Always `frontend/` (relative to repo root) |
| `contents` | file list | Repository | `weather.html`, `weather.css`, `weather.js` |
| `size_bytes` | integer | Actions runtime | Must be > 0 (empty artifact is rejected) |
| `run_id` | integer | GitHub Actions | Parent Pipeline Run |
| `uploaded_at` | timestamp | GitHub Actions | When `upload-pages-artifact` completed |
| `retention_days` | integer | GitHub Actions default | 1 day (Pages artifacts are ephemeral) |

**Validation rules**:

- `size_bytes > 0` — enforced by `upload-pages-artifact`; an empty `frontend/` directory
  causes the action to fail, which blocks the deploy job
- Contents MUST NOT include `node_modules/`, `.github/`, `tests/`, or `specs/` —
  guaranteed by scoping `path` to `frontend/`
- Contents MUST NOT include secrets, API keys, or credentials — `frontend/` contains
  only static HTML/CSS/JS with no runtime configuration

---

## Entity: Deployment

The act of publishing a Build Artifact to the GitHub Pages Environment.

| Field | Type | Source | Notes |
|---|---|---|---|
| `deployment_id` | string | `deploy-pages` output | GitHub internal Pages deployment ID |
| `page_url` | URL | `steps.deploy.outputs.page_url` | Stable, predictable Pages URL |
| `artifact_id` | integer | Build Artifact | What was deployed |
| `run_id` | integer | Pipeline Run | Which run produced this deployment |
| `commit_sha` | string | `github.sha` | Source commit for this deployment |
| `status` | enum | GitHub Pages | `in_progress` → `active` / `failed` |
| `deployed_at` | timestamp | GitHub Actions | When `deploy-pages` completed |

**State transitions**:

```
in_progress → active   (Pages CDN reflects new artifact)
            → failed   (Pages API rejected the artifact or OIDC exchange failed)
```

**Invariant**: Only one Deployment can be in `active` state at any time on the GitHub
Pages Environment. Each new successful Deployment atomically replaces the previous one
(overwrite — no versioning).

---

## Entity: GitHub Pages Environment

The hosted environment where the application is served to users and stakeholders.

| Field | Type | Value |
|---|---|---|
| `environment_name` | string | `github-pages` (GitHub reserved name) |
| `url` | URL | `https://{owner}.github.io/{repo}/` |
| `source` | enum | `GitHub Actions` (must be set in repo settings) |
| `current_deployment` | Deployment | The most recently `active` Deployment |
| `visibility` | enum | `public` (GitHub.com public repository) |

**Invariant**: The `url` is stable and does not change between deployments. Stakeholders
bookmark this URL once and always receive the most recently deployed version.

---

## Entity Relationships

```
push event (github.sha)
      │
      ▼
Pipeline Run (1)
      │
      ├── [test job] → pass/fail
      │
      └── [deploy job, needs: test]
               │
               ▼
         Build Artifact (1)
               │
               ▼
           Deployment (1)
               │
               ▼
     GitHub Pages Environment (1, shared)
```

- One push event → one Pipeline Run  
- One Pipeline Run → zero or one Build Artifact (zero if test job fails)  
- One Build Artifact → zero or one Deployment (zero if deploy job fails)  
- One Deployment → replaces the current state of the GitHub Pages Environment

---

## State Machine: End-to-End Flow

```
Push to main
    │
    ▼
[concurrency check]
    ├── older run in progress? → cancel older run
    └── proceed
    │
    ▼
[test job]
    ├── npm ci + npm test → FAIL → Pipeline Run status: failure
    │                              No artifact created. No deployment.
    └── PASS
    │
    ▼
[deploy job]
    ├── configure-pages → Pages not enabled? → FAIL → Pipeline Run: failure
    ├── upload-pages-artifact → empty frontend/? → FAIL → Pipeline Run: failure
    ├── deploy-pages → OIDC failure / API error? → FAIL → Pipeline Run: failure
    └── SUCCESS
    │
    ▼
Pipeline Run: success
Deployment: active
GitHub Pages Environment: updated to trigger_sha content
```

---

## Non-Entities (explicitly out of scope)

| Concept | Reason Not Modelled |
|---|---|
| Deployment history / versions | Spec FR-003: overwrite only, no versioning retained |
| Rollback mechanism | Out of scope for this feature |
| Notification records | Spec FR-009: no external notifications |
| Application data (weather, cities) | Pre-existing; no changes in this feature |
