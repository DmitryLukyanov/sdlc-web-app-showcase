# Contract: GitHub Actions Workflow — `deploy-pages.yml`

**Feature**: SDLCSPAC-3 — Deploy Application to GitHub Pages  
**Phase**: 1 — Design  
**Date**: 2025-07-21  
**Contract Type**: CI/CD Workflow Interface

---

## Overview

This document specifies the interface contract for the `deploy-pages.yml` GitHub Actions
workflow. It defines inputs (triggers, environment expectations), outputs (deployment URL,
run status), permissions, job structure, and failure behaviour. Implementors MUST adhere
to this contract; any deviation requires updating this document first.

---

## Trigger Contract

| Property | Value | Notes |
|---|---|---|
| **Event** | `push` | Standard GitHub webhook event |
| **Branch filter** | `main` only | No other branches trigger deployment |
| **Tag filter** | None | Tags do not trigger this workflow |
| **Manual dispatch** | Not supported | Deployment is fully automated (FR-007) |
| **Schedule** | None | Event-driven only |

**Invariant**: Any `git push` to `main` — whether from a PR merge, a direct push, or a
rebase — triggers exactly one workflow run (subject to concurrency cancellation).

---

## Concurrency Contract

| Property | Value |
|---|---|
| **Group** | `pages` (shared across all runs of this workflow) |
| **cancel-in-progress** | `true` |

**Guarantee**: At most one Pipeline Run is active in the `pages` concurrency group at
any time. When a newer run starts, any older run in `queued` or `in_progress` state is
immediately cancelled. The newest-commit artifact is always the one that reaches Pages.

---

## Permissions Contract

### Workflow-level (default for all jobs)

| Permission | Value | Rationale |
|---|---|---|
| `contents` | `read` | Required by `actions/checkout` |
| All others | `none` (implicit) | Least-privilege baseline |

### `deploy` job override

| Permission | Value | Rationale |
|---|---|---|
| `pages` | `write` | Required to upload and deploy Pages artifacts |
| `id-token` | `write` | Required for OIDC token exchange by `actions/deploy-pages` |

**Security invariant**: The `test` job MUST NOT have `pages: write` or `id-token: write`.
Only the `deploy` job receives elevated permissions, and only after the `test` job passes.

---

## Job Contract: `test`

### Inputs

| Input | Source | Value |
|---|---|---|
| Source code | `actions/checkout@v4` | `github.sha` commit |
| Node.js runtime | `actions/setup-node@v4` | Version `20` LTS |
| npm cache | `actions/setup-node@v4` | Keyed on `package-lock.json` |

### Steps (ordered, must not be reordered)

| Step | Command | Failure behaviour |
|---|---|---|
| Checkout | `actions/checkout@v4` | Fails run; no artifact |
| Setup Node | `actions/setup-node@v4 (node-version: '20', cache: 'npm')` | Fails run |
| Install deps | `npm ci` | Fails run; no artifact |
| Run tests | `npm test` | Fails run; blocks `deploy` job |

### Outputs

This job produces no artifacts. Its exit status is the sole output consumed by the
`deploy` job via `needs: test`.

### Failure behaviour

If any step fails, the job exits with a non-zero status. The `deploy` job does not start.
The Pipeline Run is marked `failure`. The GitHub Pages Environment is not modified.

---

## Job Contract: `deploy`

### Prerequisites

- `needs: test` — `deploy` MUST NOT run unless `test` exits `success`
- GitHub Pages Source setting MUST be `GitHub Actions` (repository setting)

### Environment declaration

```yaml
environment:
  name: github-pages
  url: ${{ steps.deploy.outputs.page_url }}
```

The `github-pages` environment name is reserved by GitHub and required for Pages
deployments. The `url` field is populated after a successful deployment.

### Steps (ordered, must not be reordered)

| Step | Action | Key inputs | Outputs |
|---|---|---|---|
| Checkout | `actions/checkout@v4` | — | Source tree at `github.sha` |
| Configure Pages | `actions/configure-pages@v5` | — | `base_path`, validates Pages enabled |
| Upload artifact | `actions/upload-pages-artifact@v3` | `path: frontend/` | `artifact_id` |
| Deploy | `actions/deploy-pages@v4` | — | `page_url`, `deployment_id` |

### Outputs

| Output | Type | Description |
|---|---|---|
| `steps.deploy.outputs.page_url` | URL | Stable GitHub Pages URL for the deployment |
| `steps.deploy.outputs.deployment_id` | string | GitHub internal deployment identifier |

### Failure behaviour

| Failure cause | Effect |
|---|---|
| `configure-pages` fails (Pages not enabled) | Job fails; clear error in logs; no artifact uploaded |
| `upload-pages-artifact` fails (empty path) | Job fails; no deployment attempted |
| `deploy-pages` fails (OIDC / API error) | Job fails; Pages Environment unchanged from prior state |
| Any step fails | Pipeline Run marked `failure`; Pages Environment not modified |

**Security invariant**: No secrets, tokens, or credentials appear in step logs. The
`GITHUB_TOKEN` is provided by GitHub Actions and is never echoed. The OIDC exchange
happens inside `actions/deploy-pages` without logging the intermediate token.

---

## Artifact Contract

| Property | Requirement |
|---|---|
| **Source directory** | `frontend/` (relative to repository root) |
| **Required files** | `weather.html`, `weather.css`, `weather.js` |
| **Excluded content** | `node_modules/`, `tests/`, `.github/`, `specs/`, any file containing secrets |
| **Minimum size** | > 0 bytes (enforced by `upload-pages-artifact`) |
| **Format** | Standard GitHub Pages artifact (tar archive, managed by action) |

---

## Output Contract: GitHub Pages Environment

| Property | Value |
|---|---|
| **URL pattern** | `https://{owner}.github.io/{repo}/` |
| **Entry point** | `weather.html` (must be served at root or linked from root) |
| **Update behaviour** | Atomic overwrite; previous version replaced on successful deployment |
| **Availability** | Within ~1 minute of `deploy-pages` completing (CDN propagation) |
| **Downtime** | None for CDN-cached content during deployment; brief propagation window |

---

## Action Version Contract

| Action | Pinned version | Reason for version |
|---|---|---|
| `actions/checkout` | `v4` | LTS; supports sparse checkout |
| `actions/setup-node` | `v4` | Supports `cache: 'npm'`; active maintenance |
| `actions/configure-pages` | `v5` | Latest stable; validates Pages source setting |
| `actions/upload-pages-artifact` | `v3` | Matches `configure-pages@v5` artifact format |
| `actions/deploy-pages` | `v4` | Latest stable OIDC-based deploy |

**Policy**: Action versions are pinned to major version tags (not SHAs) for this feature.
If the organization's security policy requires SHA pinning, update the implementation
accordingly and document the SHA source.

---

## SLA Contract

| Metric | Target | Source |
|---|---|---|
| End-to-end deployment time | ≤ 10 minutes from push to Pages live | SC-001 |
| Pages availability after deploy | Immediate (CDN-cached) | FR-008 |
| Deployment failure visibility | Immediate (GitHub Actions run status) | SC-003 |

---

## Breaking Changes Policy

Changes to this workflow contract that affect the items below are considered **breaking**
and require updating this document, the plan, and the tasks before implementation:

- Trigger events or branch filters
- Job names (referenced by `needs:` and external status checks)
- Permission scopes (security-sensitive)
- Artifact source path (`frontend/`)
- Action major version bumps
- Concurrency group name
