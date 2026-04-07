# code-mux-plugin

[English](README.md) | 简体中文

面向 Claude、Codex、Qoder 和实验性目标的模板驱动生成器，用来生成桥接技能、命令和 staged memory pack。

包名：`@moonraing7/code-mux-plugin`  
许可证：`MIT`

## 这个项目解决什么问题

`code-mux-plugin` 会基于共享 adapter 模板生成面向不同宿主的文件系统产物。

Milestone 1 的范围刻意保持收敛：

- 只生成文件
- 支持项目内安装和全局安装
- 明确区分 verified hosts 和 experimental outputs
- 不做 provider 执行、鉴权配置、后台任务和 marketplace 打包

这个包不会直接调用外部 AI provider。它只负责生成你可以检查、提交、重复执行的文件。

## 宿主覆盖范围

### 已验证宿主

| Host | 产物类型 | 输出方式 |
| --- | --- | --- |
| `claude` | `skill`, `command` | 原生宿主路径 |
| `codex` | `skill` | 原生宿主路径 |
| `qoder` | `skill`, `command` | 原生宿主路径 |

### 实验性 staged outputs

| Host | 产物类型 | 输出方式 |
| --- | --- | --- |
| `kimi` | `memory-pack` | `.code-mux/experimental/...` |
| `gemini` | `skill` | `.code-mux/experimental/...` |
| `antigravity` | `skill` | `.code-mux/experimental/...` |

Milestone 1 当前内置的 bridge adapters：

- `kimi`
- `gemini`
- `qoder`
- `antigravity`

## 安装

### CLI 方式（推荐）

先全局安装已发布包：

```bash
npm install --global @moonraing7/code-mux-plugin
```

查看当前宿主矩阵：

```bash
code-mux list-platforms
```

### 在本仓库中本地开发

```bash
bun run build
node bin/code-mux.js list-platforms
```

## 快速开始

向一个项目中生成单个 verified 的 Codex skill：

```bash
code-mux init --host codex --artifact skill --adapter gemini --target /path/to/project
```

这会写入：

```text
/path/to/project/.codex/skills/mux-gemini/SKILL.md
```

向一个项目中生成所有 verified 宿主的全部 adapter 输出：

```bash
code-mux init --host all --target /path/to/project
```

显式生成一个 experimental staged output：

```bash
code-mux init --host kimi --artifact memory-pack --adapter kimi --target /path/to/project --include-experimental
```

这会写入：

```text
/path/to/project/.code-mux/experimental/kimi/mux-kimi/AGENTS.md
```

## 安装模式

### 项目内安装

使用 `--target` 写入指定项目根目录。

示例：

- Claude skill：`.claude/skills/mux-<adapter>/SKILL.md`
- Codex skill：`.codex/skills/mux-<adapter>/SKILL.md`
- Qoder command：`.qoder/commands/mux-<adapter>.md`

### 全局安装

写入当前用户 home 目录下的宿主根路径：

```bash
code-mux init --host all --global
```

示例：

- Claude skill：`~/.claude/skills/mux-<adapter>/SKILL.md`
- Codex skill：`~/.codex/skills/mux-<adapter>/SKILL.md`
- Qoder command：`~/.qoder/commands/mux-<adapter>.md`

## 命令说明

- `--host all` 默认只包含 verified hosts。
- experimental hosts 必须显式加 `--include-experimental`。
- `--artifact` 默认值是 `all`。
- `--adapter` 默认值是 `all`。

## 覆盖策略

- managed files 在重复执行时会被覆盖
- unmanaged files 默认报错
- 替换 unmanaged files 需要显式传 `--force`

## 开发

```bash
bun run build
bun run test
npm run pack:dry-run
```

## 发版

仓库使用 tag 驱动的发布流程：

1. 保持 `package.json` 版本与 release tag 一致
2. 推送匹配的 tag，例如 `v<semver>`
3. GitHub Actions 运行 build、test 和 `npm pack --dry-run`
4. 通过 Trusted Publishing 发布到 npm
5. 创建或更新对应的 GitHub Release

相关入口：

- release workflow：`.github/workflows/release.yml`
- npm 包：`@moonraing7/code-mux-plugin`
- GitHub 仓库：`moonraing7/code-mux-plugin`

## 参考项目

这些项目提供了结构和边界上的参考：

- [`openai/codex-plugin-cc`](https://github.com/openai/codex-plugin-cc)
- [`nextlevelbuilder/ui-ux-pro-max-skill`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
- [`thepushkarp/cc-gemini-plugin`](https://github.com/thepushkarp/cc-gemini-plugin)
- [`Z-M-Huang/claude-codex-gemini`](https://github.com/Z-M-Huang/claude-codex-gemini)
