# Quickstart: Automated GitHub Pages Deployment

**Feature**: SDLCSPAC-3 — Deploy Application to GitHub Pages  
**Audience**: Developers, maintainers, and contributors to this repository  
**Date**: 2025-07-21

---

## What This Does

Every time a pull request is merged into `main` (or any direct push to `main`), a
GitHub Actions workflow automatically:

1. Runs the Jest test suite
2. Packages the `frontend/` directory as a deployable artifact
3. Publishes it to GitHub Pages

No manual steps are required at any point.

---

## Prerequisites (One-Time Setup)

Before the workflow can deploy successfully, a repository administrator must enable
GitHub Pages in Actions mode:

1. Go to **Settings → Pages** in the GitHub repository
2. Under **Build and deployment → Source**, select **GitHub Actions**
3. Save. No branch needs to be selected.

This setting only needs to be configured once. It is a prerequisite for
`actions/deploy-pages` to work and is validated by `actions/configure-pages` at
the start of every deploy job.

> **Note**: If your organization restricts GitHub Pages to specific plans or policies,
> confirm with your GitHub organization admin that Pages is permitted for this repository.

---

## How to Deploy

### Normal workflow (recommended)

```
1. Create a feature branch
2. Make your changes in frontend/ (or anywhere else)
3. Open a pull request → have it reviewed and approved
4. Merge the pull request into main
5. The Deploy to GitHub Pages workflow starts automatically
6. Visit Actions tab to monitor progress
7. On success, the Pages URL reflects your changes
```

### Deployment timeline

| Step | Typical duration |
|---|---|
| Trigger to first job start | < 30 seconds |
| Test job (`npm ci` + `npm test`) | ~1–2 minutes |
| Deploy job (upload + deploy) | ~1–2 minutes |
| CDN propagation | ~1 minute |
| **Total: push → live** | **~3–5 minutes** (well within the 10-minute SLA) |

---

## Finding Your Pages URL

After the first successful deployment, your Pages URL is:

```
https://<owner>.github.io/<repo>/
```

Where `<owner>` is the GitHub username or organization name and `<repo>` is the
repository name. The URL is also displayed in:

- The **deploy** job's summary panel in GitHub Actions
- The repository's **Environments → github-pages** sidebar

---

## Monitoring a Deployment

1. Navigate to the **Actions** tab in the repository
2. Click the **Deploy to GitHub Pages** workflow
3. Select the run triggered by your merge commit
4. Expand the **test** job to inspect test results
5. Expand the **deploy** job to see Pages deployment status and the live URL

A green checkmark on both jobs means the deployment succeeded. A red X on either job
means it failed — the Pages site remains on the previous successful version.

---

## What Gets Deployed

Only the contents of the `frontend/` directory are deployed:

```
frontend/
├── weather.html    ← entry point
├── weather.css
└── weather.js
```

The following are **never** included in the deployed artifact:

- `node_modules/` (test/build tooling)
- `tests/` (Jest test files)
- `.github/` (workflow configuration)
- `specs/` (planning documents)

---

## Troubleshooting

### Workflow does not trigger on merge

**Cause**: The push did not go to `main`, or the workflow file is on a branch that
hasn't been merged yet.  
**Fix**: Confirm the base branch of the merged PR was `main`. Check the workflow file
exists on `main` at `.github/workflows/deploy-pages.yml`.

### `configure-pages` step fails with "Pages not enabled"

**Cause**: The repository Pages source is not set to GitHub Actions.  
**Fix**: See [Prerequisites (One-Time Setup)](#prerequisites-one-time-setup) above.

### `upload-pages-artifact` step fails with "No files found"

**Cause**: The `frontend/` directory is empty or missing.  
**Fix**: Ensure `weather.html`, `weather.css`, and `weather.js` exist in `frontend/`
on the `main` branch.

### Test job fails and deployment is skipped

**Cause**: `npm test` (Jest) reported one or more test failures.  
**Fix**: Review the test job logs in GitHub Actions. Fix the failing tests on a new
branch, open a PR, and merge it. The next push to `main` will re-trigger deployment.

### Old version still showing after successful deployment

**Cause**: Browser cache or CDN propagation delay (usually < 1 minute).  
**Fix**: Hard-refresh the Pages URL (`Ctrl+Shift+R` / `Cmd+Shift+R`) or open in a
private/incognito window. If still stale after 5 minutes, check the Actions run was
actually successful.

### Two merges happened at the same time — which version is live?

**Behaviour**: The workflow uses `concurrency: cancel-in-progress: true`. The run
triggered by the **newer** commit cancels any older in-progress run. The live Pages
site will reflect the **most recently merged commit** that completed a successful
deployment.

---

## Permissions Reference

The workflow uses only the built-in `GITHUB_TOKEN`. No repository secrets need to be
configured. The token is automatically scoped to this repository and expires at the end
of each workflow run.

| Permission | Scope | Used by |
|---|---|---|
| `contents: read` | Repository source | `actions/checkout` |
| `pages: write` | Pages artifact upload | `actions/upload-pages-artifact`, `actions/deploy-pages` |
| `id-token: write` | OIDC exchange | `actions/deploy-pages` |

---

## Local Development

Deployment only happens via GitHub Actions. There is no local deployment command.

For local development and testing:

```bash
# Install dependencies
npm install

# Run tests
npm test

# Open the app locally
open frontend/weather.html   # macOS
xdg-open frontend/weather.html  # Linux
start frontend\weather.html  # Windows
```

The app runs as a local file with no server required (`file://` protocol). All data
is embedded in `weather.js`.

---

## Workflow File Location

```
.github/workflows/deploy-pages.yml
```

To modify the deployment process, edit this file on a feature branch and open a pull
request. Changes to the workflow take effect from the next push to `main` after merge.
