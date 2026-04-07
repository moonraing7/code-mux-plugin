# code-mux-plugin

## Intent

This repository builds a template-driven generator that emits bridge skills, commands, and staged memory packs for AI coding hosts.

Milestone 1 is intentionally narrow:

- generate filesystem artifacts only
- support local project install and global user install
- keep verified hosts separate from experimental outputs
- do not ship runtime provider invocation, auth setup, background jobs, or marketplace publishing

## Reference Anchors

Use these projects as design inputs, not as a license to clone scope blindly:

- `openai/codex-plugin-cc`
  - borrow command layout discipline, task-routing clarity, and repo structure ideas
  - do not import its background job system or hook machinery into Milestone 1
- `nextlevelbuilder/ui-ux-pro-max-skill`
  - borrow the multi-platform distributor shape
  - preserve the two install modes:
    - Using CLI (Recommended)
    - Global Install (Available for All Projects)
  - prefer template-driven expansion over hardcoded copy logic
- `thepushkarp/cc-gemini-plugin`
  - borrow the minimal Claude plugin/command/skill footprint
- `Z-M-Huang/claude-codex-gemini`
  - borrow the initializer mindset and cross-tool orchestration boundaries

## Product Boundary

### Verified hosts in Milestone 1

- `claude`
- `codex`
- `qoder`

### Experimental staged outputs in Milestone 1

- `kimi`
- `gemini`
- `antigravity`

Experimental means:

- generated output is allowed
- host-native execution is not claimed
- files are staged under `.code-mux/experimental/...` instead of pretending to be native host contracts

## Core Model

- `host`: where files are installed
- `adapter`: the external workflow profile rendered into content
- `artifactType`: `skill`, `command`, or `memory-pack`
- `tier`: `verified` or `experimental`

Milestone 1 bridge adapters:

- `kimi`
- `gemini`
- `qoder`
- `antigravity`

## Install Modes

### Using CLI (Recommended)

Generate into a target project root.

Examples:

- Claude skill: `.claude/skills/mux-<adapter>/SKILL.md`
- Codex skill: `.codex/skills/mux-<adapter>/SKILL.md`
- Qoder command: `.qoder/commands/mux-<adapter>.md`

### Global Install (Available for All Projects)

Generate into user-home-scoped host roots.

Examples:

- Claude skill: `~/.claude/skills/mux-<adapter>/SKILL.md`
- Codex skill: `~/.codex/skills/mux-<adapter>/SKILL.md`
- Qoder command: `~/.qoder/commands/mux-<adapter>.md`

## Package Distribution

- npm package name: `@moonraing7/code-mux-plugin`
- license: `MIT`
- default release trigger: push Git tag `v<semver>`
- release workflow: `.github/workflows/release.yml`
- preferred publish path: npm Trusted Publishing from GitHub Actions

Release contract:

- do not commit long-lived npm tokens or require checked-in publish secrets
- keep `package.json` version aligned with the pushed release tag
- run build, tests, and `npm pack --dry-run` before `npm publish`
- publish the scoped package as public
- create or update the matching GitHub Release after a successful publish
- keep the release flow idempotent where practical, especially for already-published versions and existing GitHub Releases

One-time bootstrap exception:

- if npm requires the package to exist before a trusted publisher can be attached, a one-time manual `npm publish --access public` is allowed from a logged-in maintainer machine
- after bootstrap, return to the tag-driven GitHub Actions flow

## Multilingual README Contract

- `README.md` is the canonical English source for repository-facing documentation.
- Localized README files must live at the repo root and follow the `README_<LANG>.md` naming pattern.
- Every supported README must expose reciprocal language navigation near the top of the file.
- Every supported README must preserve the same major section order as the canonical README.
- These parity-critical facts must remain identical across languages:
  - package name
  - install commands
  - verified hosts
  - experimental targets
  - Milestone 1 scope boundaries
  - license
  - only release and publish facts that are already true in the repository
- When a canonical README change touches parity-critical facts, localized READMEs must be updated in the same change.
- Do not add placeholder language files; every `README_<LANG>.md` must be a usable translation, not a stub.
- README copy may improve framing and scanability, but it must not overclaim beyond current Milestone 1 behavior.

## Execution Rules

1. `AGENTS.md` stays ahead of the code. If scope changes, update this file and the PRD before broadening implementation.
2. Keep generation template-first. Centralize host and recipe metadata; do not hardcode one-off installer branches per host.
3. Do not claim native host support without primary-source evidence.
4. Do not add provider execution shims in Milestone 1.
5. Use managed-file ownership markers so reruns are deterministic and safe.
6. Default overwrite policy:
   - overwrite managed files
   - fail on unmanaged files
   - allow override only with `--force`
7. Keep npm release automation declarative and repo-local:
   - package identity and access live in `package.json`
   - release orchestration lives in GitHub Actions
   - do not move release-critical logic into undocumented local-only commands
8. Treat Trusted Publishing setup as an external prerequisite, not application logic:
   - document the npm package, GitHub repo, and workflow filename that must be linked
   - fail clearly when publish prerequisites are not met instead of adding token workarounds by default

## Current Milestone

Milestone 1 should produce:

- top-level repo contract
- package/tooling spine
- `list-platforms`
- `init`
- local/global path resolution
- verified host generation
- experimental staged output generation
- tests for pathing, gating, and idempotency
- npm package metadata for public publishing
- tag-driven GitHub Actions release automation
- GitHub Release creation wired to successful package publish
- release documentation for Trusted Publishing setup and operator flow

Milestone 1 should not produce:

- provider auth logic
- external CLI execution
- Claude plugin marketplace packaging
- job persistence
- review hooks

## Verification

Before claiming completion, run:

- build
- tests
- smoke generation into temporary directories
- `npm pack --dry-run`

Evidence must show:

- stable host listing
- verified local/global paths work
- experimental outputs require explicit opt-in
- reruns respect overwrite policy
- published tarball contains the intended runtime payload
- release automation enforces tag/version alignment before publish
- release automation is configured for Trusted Publishing rather than checked-in secrets

## Reporting

Final status reports should include:

- changed files
- simplifications made
- remaining risks, especially around experimental targets, unverified host contracts, and external release prerequisites
- release-readiness status, including any required npm or GitHub configuration still left to the maintainer
