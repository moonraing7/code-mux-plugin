# code-mux-plugin

English | [简体中文](README_ZH.md)

Template-driven generator for bridge skills, commands, and staged memory packs across Claude, Codex, Qoder, and experimental hosts.

Package: `@moonraing7/code-mux-plugin`  
License: `MIT`

## Why This Exists

`code-mux-plugin` generates host-specific filesystem artifacts from shared adapter templates.

Milestone 1 is intentionally narrow:

- generate files only
- support local project install and global user install
- keep verified hosts separate from experimental outputs
- avoid provider execution, auth setup, background jobs, and marketplace packaging

This package does not run external AI providers. It writes the files you can inspect, version, and rerun safely.

## Host Coverage

### Verified hosts

| Host | Artifacts | Output style |
| --- | --- | --- |
| `claude` | `skill`, `command` | native host paths |
| `codex` | `skill` | native host paths |
| `qoder` | `skill`, `command` | native host paths |

### Experimental staged outputs

| Host | Artifacts | Output style |
| --- | --- | --- |
| `kimi` | `memory-pack` | `.code-mux/experimental/...` |
| `gemini` | `skill` | `.code-mux/experimental/...` |
| `antigravity` | `skill` | `.code-mux/experimental/...` |

Bridge adapters currently shipped in Milestone 1:

- `kimi`
- `gemini`
- `qoder`
- `antigravity`

## Install

### Using CLI (Recommended)

Install the published package globally:

```bash
npm install --global @moonraing7/code-mux-plugin
```

Check the current host matrix:

```bash
code-mux list-platforms
```

### Local development from this repo

```bash
bun run build
node bin/code-mux.js list-platforms
```

## Quick Start

Generate one verified Codex skill into a project:

```bash
code-mux init --host codex --artifact skill --adapter gemini --target /path/to/project
```

This writes:

```text
/path/to/project/.codex/skills/mux-gemini/SKILL.md
```

Generate all verified outputs for all adapters into a project:

```bash
code-mux init --host all --target /path/to/project
```

Generate a staged experimental output explicitly:

```bash
code-mux init --host kimi --artifact memory-pack --adapter kimi --target /path/to/project --include-experimental
```

This writes:

```text
/path/to/project/.code-mux/experimental/kimi/mux-kimi/AGENTS.md
```

## Install Modes

### Local project install

Writes into the target project root you pass with `--target`.

Examples:

- Claude skill: `.claude/skills/mux-<adapter>/SKILL.md`
- Codex skill: `.codex/skills/mux-<adapter>/SKILL.md`
- Qoder command: `.qoder/commands/mux-<adapter>.md`

### Global install

Writes into the current user's home-scoped host roots:

```bash
code-mux init --host all --global
```

Examples:

- Claude skill: `~/.claude/skills/mux-<adapter>/SKILL.md`
- Codex skill: `~/.codex/skills/mux-<adapter>/SKILL.md`
- Qoder command: `~/.qoder/commands/mux-<adapter>.md`

## Command Notes

- `--host all` includes verified hosts only.
- Experimental hosts require `--include-experimental`.
- `--artifact` defaults to `all`.
- `--adapter` defaults to `all`.

## Overwrite Policy

- managed files are overwritten on rerun
- unmanaged files fail by default
- `--force` is required to replace unmanaged files

## Development

```bash
bun run build
bun run test
npm run pack:dry-run
```

## Release

The repository uses tag-driven release automation:

1. keep `package.json` version aligned with the release tag
2. push a matching tag such as `v<semver>`
3. GitHub Actions runs build, test, and `npm pack --dry-run`
4. npm publish runs through Trusted Publishing
5. the matching GitHub Release is created or updated

Workflow:

- release workflow: `.github/workflows/release.yml`
- npm package: `@moonraing7/code-mux-plugin`
- GitHub repo: `moonraing7/code-mux-plugin`

## Reference Anchors

These projects informed structure and scope decisions:

- [`openai/codex-plugin-cc`](https://github.com/openai/codex-plugin-cc)
- [`nextlevelbuilder/ui-ux-pro-max-skill`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
- [`thepushkarp/cc-gemini-plugin`](https://github.com/thepushkarp/cc-gemini-plugin)
- [`Z-M-Huang/claude-codex-gemini`](https://github.com/Z-M-Huang/claude-codex-gemini)
