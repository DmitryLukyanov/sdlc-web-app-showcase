# Feature Specification: Black/White CSS Theme Toggle

**Feature Branch**: `001-css-theme-toggle`  
**Created**: 2025-07-17  
**Status**: Clarified  
**Input**: Add Black/White css themes — switch happens with radio button on UI

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Apply Theme via Radio Button (Priority: P1)

A user opens the application and sees a radio button control offering "Black" (dark) and "White" (light) theme options. They select their preferred theme and the entire application's visual appearance updates instantly to reflect the chosen theme — all backgrounds, text colours, and UI elements switch coherently.

**Why this priority**: This is the core, visible behaviour that delivers the feature's primary value. Without it, nothing else in this feature exists.

**Independent Test**: Navigate to the application, locate the theme radio button, select each option in turn, and confirm the full page appearance changes immediately to the corresponding dark or light palette. This can be verified visually without any other user story being implemented.

**Acceptance Scenarios**:

1. **Given** the application is loaded with the default theme, **When** the user selects the "Black" radio button, **Then** the application immediately switches to a dark visual theme (dark backgrounds, light text).
2. **Given** the application is loaded with the default theme, **When** the user selects the "White" radio button, **Then** the application immediately switches to a light visual theme (light backgrounds, dark text).
3. **Given** a theme is already applied, **When** the user selects the same theme again, **Then** the appearance remains unchanged and no errors occur.

---

### User Story 2 - Persist Theme Across Sessions (Priority: P2)

A user selects a theme, closes or refreshes the browser, and returns to the application. Their previously chosen theme is automatically applied without them having to select it again.

**Why this priority**: Persistence removes the need to re-select a theme on every visit, turning a novelty into a lasting accessibility and comfort improvement. It depends on P1 being in place.

**Independent Test**: Select a theme, close and reopen the browser tab, and confirm the previously chosen theme is active on page load without any user interaction.

**Acceptance Scenarios**:

1. **Given** a user has selected the "Black" theme and closes the browser, **When** they reopen the application, **Then** the dark theme is applied automatically and the "Black" radio button is shown as selected.
2. **Given** a user has selected the "White" theme and refreshes the page, **When** the page reloads, **Then** the light theme is applied automatically and the "White" radio button is shown as selected.
3. **Given** a user has never selected a theme, **When** they open the application for the first time, **Then** a sensible default theme is applied (white/light).

---

### Edge Cases

- What happens when the stored theme preference is corrupted or unrecognisable? The application must fall back gracefully to the default (light/white) theme without showing an error.
- What happens when the radio button control is interacted with via keyboard only (Tab + Space/Arrow)? Both theme options must be reachable and selectable without a mouse.
- How does the system handle rapid repeated switching between themes? The UI must remain stable and not flicker uncontrollably or accumulate CSS conflicts.
- What happens if the user's browser does not support the chosen persistence mechanism? The feature must degrade gracefully — the theme works for the session but does not persist.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST display a radio button control offering exactly two theme options: "Black" (dark theme) and "White" (light theme).
- **FR-002**: The radio button control MUST be placed in the **header/navigation bar**, ensuring it is always visible on every page of the application without requiring navigation to a settings screen.
- **FR-003**: Selecting a theme option via the radio button MUST update the application's visual appearance immediately, with no page reload required.
- **FR-004**: The dark ("Black") theme MUST use CSS variables with `background-color: #000000` and `color: #ffffff` applied globally across **all pages** of the application.
- **FR-005**: The light ("White") theme MUST use CSS variables with `background-color: #ffffff` and `color: #000000` applied globally across **all pages** of the application.
- **FR-006**: The selected theme MUST be persisted in **`localStorage`** under the key `theme-preference` with values `"black"` or `"white"`. No server-side storage is used.
- **FR-007**: On first visit (no stored `theme-preference` key present), the application MUST default to the **white/light theme**. The OS/browser `prefers-color-scheme` setting MUST be ignored; the white default applies regardless.
- **FR-008**: The radio button MUST visually reflect the currently active theme (i.e., the correct option appears selected at all times, including on page load from a persisted preference).
- **FR-009**: The theme toggle control MUST be operable via keyboard alone (without requiring a mouse or pointer device).
- **FR-010**: If the stored `theme-preference` value cannot be read or is not one of the expected values (`"black"` or `"white"`), the application MUST silently fall back to the default white theme without displaying an error to the user.
- **FR-011**: Theme switching MUST be implemented using **CSS custom properties (variables)** on the `:root` element. A data attribute or class on `<html>` or `<body>` selects the active variable set; no full class-swap of individual elements is used.
- **FR-012**: To prevent flash-of-unstyled-content (FOUC), an **inline `<script>` block placed in `<head>`** MUST read `localStorage.getItem('theme-preference')` and apply the correct theme attribute before the page renders.

### Key Entities

- **Theme Preference**: The user's chosen visual theme. Stored in `localStorage` under the key `theme-preference`. Valid values: `"black"` (dark theme) or `"white"` (light theme). Loaded at page initialisation via an inline `<head>` script. Invalid or absent values resolve to `"white"`.
- **Theme Definition**: The set of CSS custom properties for each theme, declared at `:root` level. White theme: `--bg: #ffffff; --fg: #000000`. Black theme: `--bg: #000000; --fg: #ffffff`. Definitions cover all visible UI surfaces (backgrounds, text, borders, interactive elements).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can switch between the black and white themes using only the radio button control, with the full visual change visible within 300 milliseconds of selection.
- **SC-002**: The selected theme is correctly restored on 100% of page reloads when a valid preference (`"black"` or `"white"`) has previously been stored in `localStorage`.
- **SC-003**: The theme radio button control is reachable and operable using keyboard navigation alone, meeting **WCAG AA** keyboard accessibility requirements.
- **SC-004**: No visible FOUC, page reflow, or layout shift occurs during theme application on page load (inline `<head>` script ensures theme is set before first paint).
- **SC-005**: Both themes achieve **WCAG AA colour contrast compliance**: minimum **4.5:1** contrast ratio for normal text and **3:1** for large text across all major UI elements.
- **SC-006**: The theme switch applies globally — all pages of the application reflect the selected theme immediately after switching, with no page-specific overrides.

## Assumptions

- The application is a web-based frontend; theme switching is achieved via **CSS custom properties (variables)** on `:root` — not by swapping large class sets on individual elements.
- Theme preference persistence uses **`localStorage`** exclusively (key: `theme-preference`, values: `"black"` / `"white"`). No user account or server-side profile storage is required for this feature.
- Only two themes (black/dark and white/light) are in scope for this ticket; the design does not need to accommodate additional themes at this stage.
- No external design-system assets are required. Colour palettes are fully defined by the CSS variable values agreed in clarification: white theme `#ffffff`/`#000000`, black theme `#000000`/`#ffffff`.
- The radio button control is rendered in the **header/navigation bar** so it is always visible on every page.
- The feature does not require any changes to back-end services, user accounts, or authentication.
- The OS/browser `prefers-color-scheme` media feature is **intentionally ignored**; the default is always white unless the user has explicitly saved a preference.

## Clarifications

### Session 2026-04-10

- Q: Where should the radio button control be placed in the UI? → A: Header/navigation bar — always visible on every page (Option A).
- Q: How should the selected theme be persisted? → A: `localStorage` (client-side only); key `theme-preference`, values `"black"` or `"white"`. No server-side storage.
- Q: What colour values and design guidelines apply to each theme? → A: CSS variables only. White theme: `#ffffff` background, `#000000` text. Black theme: `#000000` background, `#ffffff` text. Standard contrast ratios apply.
- Q: Which pages does the theme switch affect? → A: All pages of the application globally.
- Q: What accessibility standard must the themes meet? → A: WCAG AA — minimum 4.5:1 contrast for normal text, 3:1 for large text.
- Q: Which CSS strategy should be used for theming? → A: CSS custom properties (variables) on `:root`; not class-swap.
- Q: What is the default theme on first visit? → A: White (light) theme.
- Q: Should the OS `prefers-color-scheme` setting be respected? → A: No — always default to white unless user has an explicit saved preference.
- Q: How should FOUC be prevented? → A: Inline `<script>` in `<head>` reads `localStorage` and sets the theme attribute before first paint.
