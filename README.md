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
- support a central registry and registry-backed update/repair flows
- keep verified hosts separate from experimental outputs
- avoid provider execution, auth setup, background jobs, and marketplace packaging
- allow package-manager-mediated self-update only for supported npm install contexts

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

Go to your project and generate one verified Codex skill:

```bash
cd /path/to/project
code-mux init --ai codex --ada kimi
```

This writes:

```text
/path/to/project/.codex/skills/mux-kimi/SKILL.md
```

Generate all verified outputs for all adapters into the current project:

```bash
cd /path/to/project
code-mux init --ai all
```

Generate a staged experimental output explicitly:

```bash
cd /path/to/project
code-mux init --ai kimi --artifact memory-pack --ada kimi --include-experimental
```

This writes:

```text
/path/to/project/.code-mux/experimental/kimi/mux-kimi/AGENTS.md
```

Refresh previously registered installs with the latest generator output:

```bash
code-mux update
```

## Install Modes

### Local project install

Writes into the current working directory. The recommended flow is:

```bash
cd /path/to/project
code-mux init --ai codex --ada kimi
```

Examples:

- Claude skill: `.claude/skills/mux-<adapter>/SKILL.md`
- Codex skill: `.codex/skills/mux-<adapter>/SKILL.md`
- Qoder command: `.qoder/commands/mux-<adapter>.md`

### Global install

Writes into the current user's home-scoped host roots:

```bash
code-mux init --ai codex --ada kimi --global
```

Examples:

- Claude skill: `~/.claude/skills/mux-<adapter>/SKILL.md`
- Codex skill: `~/.codex/skills/mux-<adapter>/SKILL.md`
- Qoder command: `~/.qoder/commands/mux-<adapter>.md`

## Update And Registry

`code-mux` keeps a central registry at `~/.code-mux/registry.json` so later update runs can refresh historical installs without scanning the filesystem.

Supported Milestone 1 self-update contexts:

- global npm install invoked as `code-mux`
- project-local npm install invoked via `node_modules/.bin/code-mux`

Rejected in Milestone 1 with manual instructions:

- source-checkout runs such as `node bin/code-mux.js`
- transient runners such as `npx` and `npm exec`
- non-npm launchers such as `bunx`

When `code-mux update` finds a missing project path, it continues healthy refreshes first and then prints simple repair commands:

```bash
code-mux relink <entry-id> /new/path
code-mux forget <entry-id>
```

## Command Notes

- `--ai` is the preferred host selector and `--ada` is the preferred adapter selector.
- `--host` and `--adapter` remain supported for compatibility.
- `--target` remains supported for compatibility, but the recommended local install flow is to run from the project root.
- `update` refreshes registry-tracked installs and only self-updates in the supported npm contexts above.
- `--ai all` includes verified hosts only.
- Experimental hosts require `--include-experimental`.
- `--artifact` defaults to `all`.
- `--ada` defaults to `all`.

## Overwrite Policy

- managed files are overwritten on rerun
- unmanaged files fail by default
- `--force` is required to replace unmanaged files

## Development

```bash
bun run build
bun run test
bun run smoke
bun run verify
bun run clean:test-artifacts
npm run pack:dry-run
```

Development flow notes:

- `bun run test` runs under an isolated sandbox `HOME` and isolated test temp root so automated tests cannot write into the maintainer `~/.code-mux/registry.json`.
- `bun run smoke` runs the local/global/update smoke flow in the same kind of isolated sandbox and cleans it afterwards.
- `bun run verify` runs the full build + isolated test + isolated smoke + pack dry-run sequence.
- `bun run clean:test-artifacts` removes leaked test-shaped registry entries and their temp directories from the maintainer machine if an older manual run polluted `~/.code-mux/registry.json`.

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
