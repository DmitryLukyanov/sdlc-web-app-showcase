<!--
SYNC IMPACT REPORT
==================
Version change      : NEW → 1.0.0
Bump rationale      : MINOR — initial formal adoption of the project constitution;
                      four principles established with full governance scaffolding.
Ratification date   : 2026-04-10
Last amended date   : 2026-04-10

Modified principles : N/A (initial creation)
Added sections      : All (Preamble, Principles 1–4, Governance)
Removed sections    : N/A

Template propagation status
  .specify/templates/plan-template.md    ⚠ pending — file does not exist yet
  .specify/templates/spec-template.md    ⚠ pending — file does not exist yet
  .specify/templates/tasks-template.md   ⚠ pending — file does not exist yet
  .specify/templates/commands/*.md       ⚠ pending — directory does not exist yet
  config/spec-kit/constitution.md        ✅ consistent — same 4 principles; informal
                                            format only; no edits required
  .github/copilot-instructions.md        ✅ consistent — references constitution by
                                            path; no principle text embedded
  config/spec-kit/defaults.json          ✅ consistent — "Align with the constitution"
                                            directive unchanged

Follow-up TODOs
  TODO(RATIFICATION_DATE): Confirm exact original project ratification date if it
    predates 2026-04-10. Update this field and bump PATCH version accordingly.
  TODO(TEMPLATES): Create .specify/templates/{plan,spec,tasks}-template.md and
    .specify/templates/commands/*.md once the SpecKit scaffold is initialised.
    Each template must embed a "Constitution Check" section referencing the four
    principle names defined here.
-->

# Project Constitution

**Version**: 1.0.0
**Ratified**: 2026-04-10
**Last Amended**: 2026-04-10

These principles govern all automated and manual work in this repository.
They are non-negotiable within any feature, fix, or infrastructure change.
Deviations require an explicit amendment (see Governance).

---

## Principles

### 1. Quality

Changes MUST be small, focused, and reviewable with a single, clearly stated
purpose. Pull requests that mix unrelated concerns are not acceptable without
explicit justification.

Existing code patterns MUST be preserved unless a task explicitly requires and
documents a new approach. Pattern changes that arrive unremarked are a quality
defect, not a style preference.

**Rationale**: Small, intent-clear changes reduce review burden, limit blast
radius on defects, and keep the git history readable as a project log.

### 2. Testing

Tests MUST be added or updated whenever observable behaviour changes. A change
that omits corresponding test coverage is incomplete and MUST NOT be merged.

Existing tests MUST NOT be weakened (assertions loosened, cases removed, or
tests skipped) to make a change pass without explicit, recorded product
approval.

**Rationale**: Tests are the authoritative specification of intended behaviour.
Weakening them silently destroys the team's ability to detect regressions.

### 3. Security & Configuration

Secrets (API keys, tokens, passwords, certificates, or any credential) MUST
NOT be committed to the repository under any circumstance. Environment
variables or GitHub Secrets MUST be used instead.

All inputs received at system boundaries (HTTP endpoints, CLI arguments, file
reads, environment variables consumed at runtime) MUST be validated before use.
Trust no external input by default.

**Rationale**: A single committed secret invalidates trust in the entire
repository history. Input validation at boundaries prevents entire classes of
injection and corruption defects.

### 4. Delivery

The codebase MUST remain buildable and typecheck-clean after every logical
change. A failing build or typecheck error MUST be resolved before any
subsequent work is committed on the same branch.

Non-obvious decisions MUST be documented inline (code comment, ADR entry, or
commit message) where the code alone cannot convey the reason. "Obvious" is
defined from the perspective of a competent engineer unfamiliar with the
immediate context.

**Rationale**: A perpetually green build is a forcing function for incremental
correctness. Undocumented decisions accumulate as invisible technical debt that
blocks future contributors.

---

## Governance

### Amendment Procedure

1. Open a pull request that modifies this file (`constitution.md`) with a
   rationale comment explaining why the amendment is needed.
2. The amendment MUST be reviewed and approved by at least one maintainer
   before merge.
3. Automated agents (`speckit.analyze`, `code.review`) treat this file as
   authoritative and will flag constitution conflicts as CRITICAL findings.
   Their findings MUST be addressed or formally overridden before a PR merges.

### Versioning Policy

This constitution follows Semantic Versioning (`MAJOR.MINOR.PATCH`):

| Change type | Version bump |
|---|---|
| Principle removed or backward-incompatibly redefined | **MAJOR** |
| New principle or section added; material guidance expanded | **MINOR** |
| Clarifications, wording improvements, typo corrections | **PATCH** |

The `Version` header and `Last Amended` date MUST be updated with every
amendment. The Sync Impact Report HTML comment MUST be updated to reflect the
new version, changed sections, and template propagation status.

### Compliance Review

- All pull requests MUST be checked against this constitution during code
  review. Constitution violations are blocking; they MUST be resolved or
  formally overridden with recorded rationale before merge.
- Automated agents enforce this constitution within their scope and MUST NOT
  silently ignore principle conflicts or reinterpret principles to avoid
  friction.
- A periodic review of this constitution SHOULD occur no less than once per
  quarter to assess whether principles remain fit for purpose as the project
  evolves.
