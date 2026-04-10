# sdlc-web-app-showcase

## Jira board (before):

<img width="1203" height="553" alt="image" src="https://github.com/user-attachments/assets/efa2d9b3-e65d-4934-82f4-922c60f22831" />

## Jira board (after first run)

<img width="1412" height="613" alt="image" src="https://github.com/user-attachments/assets/269edb99-f0f6-41d1-8bef-5af0487711c5" />

## Jira board (after second run)

<img width="1411" height="672" alt="image" src="https://github.com/user-attachments/assets/d2bdc9a0-a4cc-41a2-9e47-03c472c23eea" /> (it should be in the "BLOCKED" state instead of "IN_REVIEW", in this run it happened in this way because of outdated config issue)

The issue is that the provided ticket doesn't have description (so didn't pass validation):
<img width="860" height="275" alt="image" src="https://github.com/user-attachments/assets/22dc19bc-8016-4729-9bb3-70d0db03829a" />

The jira has appropriate comment:
<img width="778" height="551" alt="image" src="https://github.com/user-attachments/assets/357849b5-2ead-4ca1-95bc-fa2ba81c9ce9" />

## Relaunched

![Uploading image.png…]()


---

## Deployment

The frontend (`frontend/` directory) is automatically deployed to **GitHub Pages** on every push to the `main` branch, including all merged pull requests. No manual deployment steps are required.

### Live URL

```
https://<org-or-user>.github.io/sdlc-web-app-showcase/
```

Replace `<org-or-user>` with the GitHub organisation or user name that owns this repository.

### How it works

The deployment is handled by `.github/workflows/deploy-pages.yml`, which runs a two-job pipeline:

| Job | Steps | Purpose |
|-----|-------|---------|
| **test** | `npm ci` → `npm test` | Runs the full Jest suite; blocks deployment if any test fails |
| **deploy** | configure-pages → upload-artifact → deploy-pages | Packages `frontend/` and publishes it to GitHub Pages via OIDC |

The `deploy` job only starts when `test` passes (`needs: test`). This guarantees that no broken build can ever reach the live site.

### Concurrency

The workflow uses `concurrency: group: pages` with `cancel-in-progress: true`. If two PRs are merged in rapid succession, the older deployment run is automatically cancelled and only the newest commit is deployed. GitHub Pages will always reflect the most recently merged change.

### Viewing pipeline logs

1. Go to the **Actions** tab of this repository.
2. Click the **Deploy to GitHub Pages** workflow.
3. Select a run to inspect the `test` and `deploy` job logs.

If the `test` job fails, the failure cause (failed assertion, syntax error, etc.) appears in that job's log and the `deploy` job is skipped entirely.

### One-time repository setup (required before first deploy)

GitHub Pages must be configured to use GitHub Actions as its source before the workflow can publish successfully:

1. Navigate to **Settings → Pages** in this repository.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Save the setting.

After this one-time change, every merge to `main` will trigger an automatic deployment. No additional secrets or tokens need to be configured — authentication uses the built-in OIDC token exchange.
# Jira board is fixed

## Issues and PRs
<img width="1510" height="445" alt="image" src="https://github.com/user-attachments/assets/59399a7c-b762-4ffd-9f3f-db8e5c272507" />


