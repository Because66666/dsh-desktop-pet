# dsh-desktop-pet

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（dsh）的桌面宠物联动插件：把 agent 的生命周期节点（思考中 / 输出中 / 空闲）实时推送给本地桌宠的 HTTP API（默认适配 BluePet，`http://127.0.0.1:9999`,可在[blue-pet](https://blue-pet.cn/)下载程序）。

English documentation follows the Chinese section below.

## 包

| 包 | 目录 | 作用 |
|---|---|---|
| `@deepseek-ai/dsh-desktop-pet` | `packages/desktop-pet` | 宿主插件：监听 agent 事件并调用桌宠的 `/api/play/<event>` 接口 |

## 前提

- 已安装 dsh（打包安装或源码检出均可），插件运行时依赖（`@deepseek-ai/cordis`、`@deepseek-ai/schemastery` 等）由 dsh 安装自身提供，本仓库不含第三方依赖。
- 桌宠本体 blue_pet.exe 已启动，其本地 API 监听在 `http://127.0.0.1:9999`（见桌宠自带的 API 说明）。

## 安装

```sh
git clone https://github.com/Because66666/dsh-desktop-pet.git
cd dsh-desktop-pet

# 让 dsh 能解析到该包（file: 为拷贝安装，更新本仓库后需重新执行）
dsh plugin --profile web add file:$PWD/packages/desktop-pet
```

源码检出运行 dsh 的（`pnpm dsh ...`），把 `dsh` 换成 `pnpm dsh` 即可。

## 启用

编辑 profile 补丁层 `~/.dsh/profiles/web/cordis.patch.yml`，加入插件行（**`id` 必须显式给出**，否则补丁热重载会按随机 id 重建该行）：

```yaml
- insert:
    - id: desktop-pet
      name: '@deepseek-ai/dsh-desktop-pet'
      config:
        endpoint: 'http://127.0.0.1:9999'
```

Web 长驻界面对补丁层热重载，保存即生效；headless 一次性运行需重启。

## 验证

```sh
# 桌宠 API 存活
curl http://127.0.0.1:9999/api/status
```

在 dsh 里发起一次对话，桌宠应依次播放 `deepthink` → `startwork` → `endwork`。

## 事件映射与配置

| 时刻 | 默认桌宠事件 | 触发源 |
|---|---|---|
| 思考中 | `deepthink` | agent 状态变为 running |
| 输出中 | `startwork` | 每个 step 的首个流式 chunk |
| 空闲 | `endwork` | agent 回到 idle |

`config` 字段：`endpoint`（必填，桌宠服务基础 URL）、`method`（`POST`/`GET`，默认 `POST`）、`token`（可选 Bearer 头）、`timeoutMs`（默认 2000）、`actions.thinking/typing/idle`（逐项覆盖上表事件名）。

## 卸载

```sh
dsh plugin --profile web remove @deepseek-ai/dsh-desktop-pet
# 并删除 cordis.patch.yml 中对应行
```

---

# dsh-desktop-pet (English)

A desktop-pet integration plugin for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (dsh): forwards agent lifecycle moments (thinking / typing / idle) to a local desktop pet's HTTP API (BluePet-compatible, `http://127.0.0.1:9999` by default, downloaded it by [blue-pet](https://blue-pet.cn/)).

## Package

| Package | Directory | Role |
|---|---|---|
| `@deepseek-ai/dsh-desktop-pet` | `packages/desktop-pet` | Host plugin: watches agent events and calls the pet's `/api/play/<event>` endpoint |

## Prerequisites

- A dsh installation (packaged or source checkout). Runtime dependencies (`@deepseek-ai/cordis`, `@deepseek-ai/schemastery`, …) are provided by the dsh installation itself; this repo carries no third-party dependencies.
- The desktop pet running with its local API on `http://127.0.0.1:9999`.

## Install

```sh
git clone https://github.com/Because66666/dsh-desktop-pet.git
cd dsh-desktop-pet

# Make the package resolvable (file: copies; re-run after pulling updates)
dsh plugin --profile web add file:$PWD/packages/desktop-pet
```

## Enable

Edit the profile patch layer `~/.dsh/profiles/web/cordis.patch.yml` (**the `id` is required** — id-less insert rows are recreated on every patch reload):

```yaml
- insert:
    - id: desktop-pet
      name: '@deepseek-ai/dsh-desktop-pet'
      config:
        endpoint: 'http://127.0.0.1:9999'
```

The web surface hot-reloads the patch layer; one-shot surfaces need a restart.

## Verify

```sh
curl http://127.0.0.1:9999/api/status   # pet alive
```

Run one conversation turn in dsh — the pet should play `deepthink` → `startwork` → `endwork`.

## Configuration

| Moment | Default pet event | Source |
|---|---|---|
| Thinking | `deepthink` | agent status becomes `running` |
| Typing | `startwork` | first stream chunk of a step |
| Idle | `endwork` | agent back to `idle` |

Config fields: `endpoint` (required base URL), `method` (`POST`/`GET`), `token` (optional Bearer), `timeoutMs` (2000), `actions.thinking/typing/idle` (per-moment overrides).

## License

MIT
