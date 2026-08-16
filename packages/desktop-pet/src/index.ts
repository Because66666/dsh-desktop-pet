/**
 * Forward agent lifecycle moments — thinking, streaming output, and idle — to
 * a local desktop-pet HTTP service. The plugin observes the live agent and
 * session event streams and calls the pet's play endpoint once per moment; the
 * desktop pet's own local HTTP server turns those into animations.
 * @module @deepseek-ai/dsh-desktop-pet
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type { Session } from '@deepseek-ai/dsh-session'
// Type-only: loads the dsh-agent `agent/status` Context event declaration.
import type {} from '@deepseek-ai/dsh-agent'
// Type-only: loads the dsh-host-webserver `webServer` Context declaration for
// the optional background-image route.
import type {} from '@deepseek-ai/dsh-host-webserver'
import { registerBackgroundRoute } from './background.ts'

/** Cordis function-plugin name. */
export const name = 'desktop-pet'
/** Services whose streams the plugin observes; injection waits for them so no agent or session event can precede the listeners. */
export const inject = ['agents', 'sessions']

/** Default pet event names for the three forwarded lifecycle moments. */
export const DEFAULT_ACTIONS = {
  thinking: 'deepthink',
  typing: 'startwork',
  idle: 'endwork',
} as const

/** Default per-request timeout in milliseconds. */
export const DEFAULT_TIMEOUT_MS = 2_000

/** Desktop-pet notifier configuration. */
export interface Config {
  /**
   * Base URL of the local desktop-pet HTTP service, for example
   * `http://127.0.0.1:9999`. Must be an absolute `http:` or `https:` URL;
   * notifications are sent to its `/api/play/<event>` route.
   */
  endpoint: string
  /** HTTP method for every notification. Defaults to `POST`. */
  method?: 'POST' | 'GET'
  /** Optional bearer token sent as an `Authorization: Bearer` header. */
  token?: string
  /** Per-request timeout in milliseconds. Defaults to {@link DEFAULT_TIMEOUT_MS}. */
  timeoutMs?: number
  /** Pet event names for the three forwarded moments; each overrides its default. */
  actions?: {
    /** Event sent when an agent starts processing (status becomes `running`). */
    thinking?: string
    /** Event sent once per step when the model streams its first chunk. */
    typing?: string
    /** Event sent when an agent returns to idle. */
    idle?: string
  }
}

/** Schemastery configuration for the desktop-pet notifier. */
export const Config: z<Config> = z.object({
  endpoint: z.string().required(),
  method: z.union(['POST', 'GET'] as const).default('POST'),
  token: z.string().default(''),
  timeoutMs: z.number().step(1).min(1).default(DEFAULT_TIMEOUT_MS),
  actions: z.object({
    thinking: z.string().default(DEFAULT_ACTIONS.thinking),
    typing: z.string().default(DEFAULT_ACTIONS.typing),
    idle: z.string().default(DEFAULT_ACTIONS.idle),
  }).default({ ...DEFAULT_ACTIONS }),
})

/**
 * Validate the configured endpoint: an absolute `http:` or `https:` URL.
 * @param endpoint - the configured endpoint string.
 * @returns the parsed URL.
 * @throws when the endpoint is not an absolute HTTP(S) URL.
 */
export function resolveEndpoint(endpoint: string): URL {
  const url = new URL(endpoint)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`desktop-pet: endpoint must be an http(s) URL, got "${url.protocol}//"`)
  }
  return url
}

/**
 * Build the play URL for one pet event: `<endpoint>/api/play/<event>`.
 * @param endpoint - the validated base URL of the pet service.
 * @param action - the resolved pet event name.
 * @returns the absolute request URL.
 */
export function playUrl(endpoint: string, action: string): string {
  return `${endpoint.replace(/\/+$/, '')}/api/play/${encodeURIComponent(action)}`
}

/**
 * Install the desktop-pet notifier. `agent/status` supplies the thinking and
 * idle moments; the `session/event` stream supplies the first stream chunk of
 * each step (typing). Notifications are fire-and-forget HTTP requests
 * serialized in event order; a failed request is logged and never propagates
 * into the agent or session loop.
 * @param ctx - registrant context carrying the agent and session services.
 * @param config - validated notifier configuration.
 */
export function apply(ctx: Context, config: Config): void {
  resolveEndpoint(config.endpoint)
  registerBackgroundRoute(ctx)
  // Defaults resolve explicitly at the boundary: the Loader schema already
  // applies them, but direct `apply` calls bypass validation.
  const endpoint = config.endpoint
  const method = config.method ?? 'POST'
  const token = config.token ?? ''
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const actions = {
    thinking: config.actions?.thinking ?? DEFAULT_ACTIONS.thinking,
    typing: config.actions?.typing ?? DEFAULT_ACTIONS.typing,
    idle: config.actions?.idle ?? DEFAULT_ACTIONS.idle,
  }
  const logger = ctx.logger
  // Typing fires once per step per session: later chunks of the same step are
  // suppressed. Keyed by the live Session object so disposed sessions are
  // collectible.
  const typingSteps = new WeakMap<Session, string>()

  // FIFO chain: the pet consumes actions as a state machine, so delivery must
  // preserve event order. A rejected link logs and the chain continues.
  let chain: Promise<void> = Promise.resolve()
  const send = (action: string): void => {
    const url = playUrl(endpoint, action)
    const headers: Record<string, string> = {}
    if (token.length > 0) headers['authorization'] = `Bearer ${token}`
    chain = chain
      .then(() => fetch(url, {
        method,
        headers,
        signal: AbortSignal.timeout(timeoutMs),
      }))
      .then(async (response) => {
        // The pet answers 409 with a JSON reason when an action is rejected
        // (busy transition or a violated from-constraint); surface it.
        const body = await response.text()
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${body}`)
      })
      .catch((error: unknown) => {
        logger.warn(`desktop-pet: notification to ${url} failed: ${error instanceof Error ? error.message : String(error)}`)
      })
  }

  ctx.effect(() => {
    const stopStatus = ctx.on('agent/status', ({ status }) => {
      send(status === 'running' ? actions.thinking : actions.idle)
    })
    const stopEvent = ctx.on('session/event', (session, event) => {
      if (event.type !== 'assistant/chunk') return
      const key = `${event.data.turn}/${event.data.step}`
      if (typingSteps.get(session) === key) return
      typingSteps.set(session, key)
      send(actions.typing)
    })
    return () => {
      stopStatus()
      stopEvent()
    }
  }, 'desktop-pet.notify()')
}
