# code-mux-plugin

Template-driven generator for multi-host bridge skills and command packs.

Package: `@moonraing7/code-mux-plugin`

License: `MIT`

This repository is inspired by:

- [`openai/codex-plugin-cc`](https://github.com/openai/codex-plugin-cc)
- [`nextlevelbuilder/ui-ux-pro-max-skill`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
- [`thepushkarp/cc-gemini-plugin`](https://github.com/thepushkarp/cc-gemini-plugin)
- [`Z-M-Huang/claude-codex-gemini`](https://github.com/Z-M-Huang/claude-codex-gemini)

Milestone 1 ships a generator core only. It writes host artifacts to disk; it does not invoke external providers.

## Supported Surfaces

### Verified

- `claude`: `skill`, `command`
- `codex`: `skill`
- `qoder`: `skill`, `command`

### Experimental

- `kimi`: `memory-pack`
- `gemini`: `skill`
- `antigravity`: `skill`

## Adapters

- `kimi`
- `gemini`
- `qoder`
- `antigravity`

## Using CLI (Recommended)

Install from npm after release:

```bash
npm install --global @moonraing7/code-mux-plugin
```

Then run:

```bash
code-mux list-platforms
```

For local development, build first:

```bash
bun run build
```

List hosts:

```bash
node bin/code-mux.js list-platforms
```

Generate all verified hosts for all adapters into a project:

```bash
node bin/code-mux.js init --host all --target /path/to/project
```

Generate one verified artifact:

```bash
node bin/code-mux.js init --host codex --artifact skill --adapter gemini --target /path/to/project
```

Generate an experimental staged output:

```bash
node bin/code-mux.js init --host kimi --artifact memory-pack --adapter kimi --target /path/to/project --include-experimental
```

## Global Install (Available for All Projects)

Write verified outputs into user-home roots:

```bash
node bin/code-mux.js init --host all --global
```

Write one global command pack:

```bash
node bin/code-mux.js init --host claude --artifact command --adapter antigravity --global
```

## Overwrite Policy

- Managed files are overwritten on rerun.
- Unmanaged files fail by default.
- Use `--force` to replace unmanaged files.

## Development

```bash
bun run build
bun run test
npm run pack:dry-run
```

## Notes

- `--host all` includes verified hosts only.
- Add `--include-experimental` to stage experimental outputs.
- `--artifact` defaults to `all`.
- `--adapter` defaults to `all`.

## Release

This repository is configured for tag-driven releases:

1. Ensure npm Trusted Publishing is enabled for `@moonraing7/code-mux-plugin` and linked to `moonraing7/code-mux-plugin` on GitHub.
   Use the workflow file `.github/workflows/release.yml` when configuring the trusted publisher.
2. Bump `package.json` to the release version.
3. Push a matching Git tag such as `v0.1.0`.
4. GitHub Actions will build, test, dry-run the package, publish to npm, and create a GitHub Release.

Example:

```bash
git tag v0.1.0
git push origin v0.1.0
```

If npm Trusted Publishing has not been linked yet, configure the trusted publisher in the npm package settings before pushing the first release tag.

If npm does not let you attach a trusted publisher before the package exists, bootstrap once from a logged-in local machine:

```bash
bun run test
npm publish --access public
```
