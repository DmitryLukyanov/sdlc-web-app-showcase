# SDLCClient Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-10

## Active Technologies
- HTML5, CSS3, JavaScript ES2020 (modern browser baseline: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+) + None — vanilla frontend; no build toolchain; Jest 29 + jest-environment-jsdom for testing (copilot/add-black-white-css-themes)
- `localStorage` key `theme-preference` → `"black"` | `"white"`; default `"white"` when absent or invalid (copilot/add-black-white-css-themes)
- JavaScript (ES5/ES6 mixed, no transpilation) — Node 20 (Jest) / evergreen browser + Jest 29 (test runner), jest-environment-jsdom 29 (DOM emulation) — no production runtime dependencies (copilot/sdlcspac-7-display-weather-data)
- N/A — all data is in-memory; no persistence layer (copilot/sdlcspac-7-display-weather-data)

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
- copilot/sdlcspac-7-display-weather-data: Added JavaScript (ES5/ES6 mixed, no transpilation) — Node 20 (Jest) / evergreen browser + Jest 29 (test runner), jest-environment-jsdom 29 (DOM emulation) — no production runtime dependencies
- copilot/add-black-white-css-themes: Added HTML5, CSS3, JavaScript ES2020 (modern browser baseline: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+) + None — vanilla frontend; no build toolchain; Jest 29 + jest-environment-jsdom for testing

- copilot/sdlcspac-3-add-deploy-githubpages: Added GitHub Actions CI/CD pipeline (deploy-pages.yml); GITHUB_TOKEN OIDC; concurrency cancel-in-progress; test → deploy job gate; Node.js 20 LTS runner

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
