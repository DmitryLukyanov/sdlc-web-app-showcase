# SDLCClient Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-10

## Active Technologies
- GitHub Actions (YAML 1.2) + actions/checkout@v4; actions/setup-node@v4; actions/configure-pages@v5; actions/upload-pages-artifact@v3; actions/deploy-pages@v4 (CI/CD pipeline); GITHUB_TOKEN OIDC auth (copilot/sdlcspac-3-add-deploy-githubpages)
- HTML5 + CSS3 + JavaScript ES2020 (modern browser baseline: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+) + None (runtime); Jest 29 + jest-environment-jsdom 29 (dev/test only) (copilot/sdlcspac-1-create-simple-calculator-0bbc3250-915c-4941-8ca6-bab7bfe39154)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

HTML5 + CSS3 + JavaScript ES2020 (modern browser baseline: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+): Follow standard conventions

## Recent Changes
- copilot/sdlcspac-3-add-deploy-githubpages: Added GitHub Actions CI/CD pipeline (deploy-pages.yml); GITHUB_TOKEN OIDC; concurrency cancel-in-progress; test → deploy job gate; Node.js 20 LTS runner
- copilot/sdlcspac-1-create-simple-calculator-0bbc3250-915c-4941-8ca6-bab7bfe39154: Added HTML5 + CSS3 + JavaScript ES2020 (modern browser baseline: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+) + None (runtime); Jest 29 + jest-environment-jsdom 29 (dev/test only)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
