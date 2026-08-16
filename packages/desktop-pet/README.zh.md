# dsh-desktop-pet — 将 agent 生命周期节点转发给本地桌宠

[English](README.md) | 中文

`dsh-desktop-pet` 监听运行中的 agent，并在每个生命周期节点——思考中、流式输出中、空闲——调用一次本地桌宠的播放端点。该插件是纯观察者：不注册任何工具、提示词段落或服务，因此模型永远不会看到它，会话日志也保持不变。

## 默认线协议

线协议即桌宠的本地 HTTP API（见桌宠自带的 API 文档）。每个节点向桌宠的播放路由发送一次无请求体的请求：

```
POST <endpoint>/api/play/<event>
```

`<endpoint>` 是配置的桌宠服务基础 URL（例如 `http://127.0.0.1:9999`），`<event>` 是解析后的桌宠事件名（默认为 `deepthink`、`startwork`、`endwork`，可通过 `actions` 覆盖）。请求方法默认为 `POST`（可配置为 `GET`）；可选的 `token` 以 `Authorization: Bearer <token>` 头发送。

桌宠接受事件时返回 `200` 与 `{"ok":true,"action":"..."}`；拒绝时返回 `409` 与 JSON 原因——过渡动画尚未播完，或事件的前提约束不满足（例如 `endwork` 要求桌宠处于 `working`）。拒绝在桌宠侧是正常的控制流；插件将其记录为警告并继续。

## 事件映射

| 节点 | 源事件 | 默认桌宠事件 | 触发时机 |
|---|---|---|---|
| 思考中 | `agent/status` → `running` | `deepthink` | agent 开始处理一次唤醒（排队的消息、steering 或注入的上下文）时。 |
| 打字中 | 某 step 的第一个 `assistant/chunk` | `startwork` | 每个 step 仅一次，在首个流式块到达时——同一 step 的后续块被抑制。 |
| 空闲 | `agent/status` → `idle` | `endwork` | agent 的驱动排空回到空闲时。 |

通知按事件顺序（FIFO）串行发送，因此桌宠可将其作为状态机消费：思考事件总是先于该轮次开启的打字事件，而打字事件又先于收尾的空闲事件。思考每次唤醒只触发一次；一个跨多 step 的轮次始终保持 `running`，不会重复触发。默认映射假定桌宠的 stand → work → stand 循环：`deepthink` 从 stand 播放并自动回到 stand，`startwork` 进入 working 循环，`endwork` 退出循环。

## 配置

除 `endpoint` 外所有字段均有默认值，在 `cordis.yml` 中均可省略。

| 字段 | 类型 | 默认值 | 含义 |
|---|---|---|---|
| `endpoint` | string | —（必填） | 桌宠服务的绝对 `http:`/`https:` 基础 URL，例如 `http://127.0.0.1:9999`。 |
| `method` | `POST` \| `GET` | `POST` | 每次通知使用的 HTTP 方法。 |
| `token` | string | `''` | Bearer 令牌；仅在非空时发送。 |
| `timeoutMs` | number | `2000` | 单请求超时；桌宠服务挂起时请求中止并记录警告。 |
| `actions.thinking` | string | `deepthink` | agent 开始运行时发送的桌宠事件名。 |
| `actions.typing` | string | `startwork` | 每个 step 首个块到达时发送的桌宠事件名。 |
| `actions.idle` | string | `endwork` | agent 回到空闲时发送的桌宠事件名。 |

错误配置在加载时即大声失败：`endpoint` 缺失或非 `http(s)` 会使插件条目被拒绝，因此损坏的桌宠桥接绝不会静默启动。

## 挂载

将插件行加入 profile 的补丁层——`$DSH_HOME/profiles/<name>/cordis.patch.yml`（profile 目录可通过 `dsh --profile <name> --dump-config` 查看）：

```yaml
# $DSH_HOME/profiles/web/cordis.patch.yml
- insert:
    # 显式 id 让补丁的重复应用（热重载、watcher 刷新）保持 diff 稳定；
    # 无 id 的 insert 行每次刷新都会被重建。
    - id: desktop-pet
      name: '@deepseek-ai/dsh-desktop-pet'
      config:
        endpoint: 'http://127.0.0.1:9999'
```

该包与所有内置插件一样从安装的 node_modules 解析；在源码检出中，`pnpm install` 会链接工作区成员。重启（或在长驻界面上，补丁热重载）后该行生效，profile 中运行的每个 agent 都会开始向该端点发送通知。

针对桌宠自带 API 的桥接存活检查：

```sh
curl http://127.0.0.1:9999/api/status
curl -X POST http://127.0.0.1:9999/api/play/startwork
```

## Web GUI 背景图片

除了通知桌宠，插件还在存在 `webServer` 服务（web profile；headless 无 HTTP 面，从不提供）时，于确切路由 `/desktop-pet/background.png` 提供包内 `assets/hero_internet_globe_final.png`。该路由不可变（`cache-control: public, max-age=86400`、`content-type: image/png`），并随插件一起卸载。

客户端半部 [`dsh-client-ui-desktop-pet`](../../client/ui-desktop-pet/README.md) 将该图片渲染为 Web GUI 的框架级背景，透明度 50%。背景要显示，两行都必须挂载——此处的路由，彼处的图层。

## 失败处理

每条通知都是 fire-and-forget：失败的请求（连接被拒、非 2xx 响应或超时）通过 `ctx.logger` 记录警告，绝不会传播回 agent 或会话循环。FIFO 链在失败后继续存活，后续通知仍能到达桌宠。没有重试、没有重放：错过的通知直接丢弃，不会从持久化日志重新推导。

## 模型体验

无，因为该插件不注册任何提示词段落、工具 schema、服务或其他模型可见内容——它只观察 `agent/status` 与 `session/event` 并发送出站 HTTP 请求。

#### KV Cache 影响

该插件不向任何模型请求添加内容，既不增加请求前缀，也不改变其稳定性；请求 token 与缓存复用均不受影响。

## 已知限制与暂缓事项

- **所有 agent 都会通知**——包括子 agent 与 fork 出的子会话；播放路由不携带会话 id，多 agent 部署无法按来源过滤。仅在出现实际需求时再考虑 root-only 过滤。
- **无重试、无重放**——桌宠服务不可用期间丢失的通知直接丢弃；持久化日志仍保留事件，但插件不会回填桌宠。
- **挂起服务下的 FIFO 延迟**——桌宠端点缓慢或挂起时，每个卡住的请求最多使后续通知延迟 `timeoutMs`，因为保序优先于吞吐。
- **纯观察者，不是能力 seam**——该包刻意不注册任何服务；若其他消费者也需要同样的节点，应先将共享的事件到节点映射抽取出来。
