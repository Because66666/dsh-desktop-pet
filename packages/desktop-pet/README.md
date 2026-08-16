# dsh-desktop-pet — Forward agent lifecycle moments to a local desktop pet

English | [中文](README.zh.md)

`dsh-desktop-pet` watches a running agent and calls a local desktop pet's play endpoint once per lifecycle moment — thinking, streaming output, and idle. The plugin is an observer: it registers no tool, prompt section, or service, so the model never sees it and the session log is untouched.

## The default wire protocol

The wire protocol is the desktop pet's local HTTP API (see the pet's own API documentation). Each moment sends one bodiless request to the pet's play route:

```
POST <endpoint>/api/play/<event>
```

`<endpoint>` is the configured base URL of the pet service (e.g. `http://127.0.0.1:9999`) and `<event>` is the resolved pet event name (defaults `deepthink`, `startwork`, `endwork`; overridable via `actions`). The request method defaults to `POST` (`GET` configurable); an optional `token` is sent as `Authorization: Bearer <token>`.

The pet answers `200` with `{"ok":true,"action":"..."}` when it accepts the event, and `409` with a JSON reason when it rejects it — a transition animation still playing, or the event's from-constraint not met (for example `endwork` requires the pet to be `working`). A rejection is expected control flow on the pet side; the plugin logs it as a warning and continues.

## Event mapping

| Moment | Source event | Default pet event | Fires |
|---|---|---|---|
| Thinking | `agent/status` → `running` | `deepthink` | When an agent starts processing a wake (a queued message, steering, or injected context). |
| Typing | first `assistant/chunk` of a step | `startwork` | Once per step, on the first stream chunk — later chunks of the same step are suppressed. |
| Idle | `agent/status` → `idle` | `endwork` | When the agent's driver finishes draining back to idle. |

Notifications are serialized in event order (FIFO) so the pet consumes the moments as a state machine: the thinking event always precedes the typing of the turn it opened, which precedes the idle that closes it. Thinking fires once per wake; a turn that spans several steps stays `running` and does not re-fire. The default mapping assumes the pet's stand → work → stand loop: `deepthink` plays from stand and returns to stand, `startwork` enters the working loop, and `endwork` leaves it.

## Configuration

All fields except `endpoint` have defaults and are optional in `cordis.yml`.

| Field | Type | Default | Meaning |
|---|---|---|---|
| `endpoint` | string | — (required) | Absolute `http:`/`https:` base URL of the pet service, e.g. `http://127.0.0.1:9999`. |
| `method` | `POST` \| `GET` | `POST` | HTTP method for every notification. |
| `token` | string | `''` | Bearer token; sent only when non-empty. |
| `timeoutMs` | number | `2000` | Per-request timeout; a hung pet service aborts the request and logs a warning. |
| `actions.thinking` | string | `deepthink` | Pet event sent when an agent starts running. |
| `actions.typing` | string | `startwork` | Pet event sent on the first chunk of each step. |
| `actions.idle` | string | `endwork` | Pet event sent when an agent returns to idle. |

Misconfiguration fails loud at load: a missing or non-`http(s)` `endpoint` rejects the plugin entry, so a broken pet bridge never boots silently.

## Mounting

Add the plugin row to your profile's patch layer — `$DSH_HOME/profiles/<name>/cordis.patch.yml` (the profile directory is printed by `dsh --profile <name> --dump-config`):

```yaml
# $DSH_HOME/profiles/web/cordis.patch.yml
- insert:
    # An explicit id keeps patch re-applications (hot reloads, watcher
    # refreshes) diff-stable; id-less insert rows are recreated per refresh.
    - id: desktop-pet
      name: '@deepseek-ai/dsh-desktop-pet'
      config:
        endpoint: 'http://127.0.0.1:9999'
```

The package resolves from the installation's node_modules like every in-box plugin; in a source checkout, `pnpm install` links the workspace member. Restart (or, on a long-lived surface, the patch hot-reload) applies the row, and every agent running in the profile starts notifying the endpoint.

A pet-side check that the bridge is alive, against the pet's own API:

```sh
curl http://127.0.0.1:9999/api/status
curl -X POST http://127.0.0.1:9999/api/play/startwork
```

## Failure handling

Every notification is fire-and-forget: a failed request (connection refused, non-2xx response, or timeout) logs a warning through `ctx.logger` and never propagates into the agent or session loop. The FIFO chain survives a failure, so a later notification still reaches the pet. There is no retry and no replay: a missed notification is dropped, not re-derived from the durable log.

## Model Experience

None, as the plugin registers no prompt section, tool schema, service, or other model-visible content — it only observes `agent/status` and `session/event` and sends outbound HTTP requests.

#### KV Cache effect

The plugin adds nothing to any model request, so it neither grows the request prefix nor changes its stability; request tokens and cache reuse are unaffected.

## Known Limitations and Deferred Work

- **All agents notify** — including subagents and forked children; the play route carries no session id, so a multi-agent deployment cannot filter by origin. A root-only filter is deferred until a consumer needs it.
- **No retry or replay** — a notification lost to a down pet service is dropped; the durable log still holds the events, but the plugin does not backfill the pet.
- **FIFO latency under a hung service** — a slow or hung pet endpoint delays later notifications by up to `timeoutMs` per stuck request, because order is preserved over throughput.
- **Observer-only, not a capability seam** — the package intentionally registers no service; if another consumer needs the same moments, extract a shared event-to-moment mapping first.
