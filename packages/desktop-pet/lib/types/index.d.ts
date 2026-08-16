/**
 * Forward agent lifecycle moments — thinking, streaming output, and idle — to
 * a local desktop-pet HTTP service. The plugin observes the live agent and
 * session event streams and calls the pet's play endpoint once per moment; the
 * desktop pet's own local HTTP server turns those into animations.
 * @module @deepseek-ai/dsh-desktop-pet
 */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
/** Cordis function-plugin name. */
export declare const name = "desktop-pet";
/** Services whose streams the plugin observes; injection waits for them so no agent or session event can precede the listeners. */
export declare const inject: string[];
/** Default pet event names for the three forwarded lifecycle moments. */
export declare const DEFAULT_ACTIONS: {
    readonly thinking: "deepthink";
    readonly typing: "startwork";
    readonly idle: "endwork";
};
/** Default per-request timeout in milliseconds. */
export declare const DEFAULT_TIMEOUT_MS = 2000;
/** Desktop-pet notifier configuration. */
export interface Config {
    /**
     * Base URL of the local desktop-pet HTTP service, for example
     * `http://127.0.0.1:9999`. Must be an absolute `http:` or `https:` URL;
     * notifications are sent to its `/api/play/<event>` route.
     */
    endpoint: string;
    /** HTTP method for every notification. Defaults to `POST`. */
    method?: 'POST' | 'GET';
    /** Optional bearer token sent as an `Authorization: Bearer` header. */
    token?: string;
    /** Per-request timeout in milliseconds. Defaults to {@link DEFAULT_TIMEOUT_MS}. */
    timeoutMs?: number;
    /** Pet event names for the three forwarded moments; each overrides its default. */
    actions?: {
        /** Event sent when an agent starts processing (status becomes `running`). */
        thinking?: string;
        /** Event sent once per step when the model streams its first chunk. */
        typing?: string;
        /** Event sent when an agent returns to idle. */
        idle?: string;
    };
}
/** Schemastery configuration for the desktop-pet notifier. */
export declare const Config: z<Config>;
/**
 * Validate the configured endpoint: an absolute `http:` or `https:` URL.
 * @param endpoint - the configured endpoint string.
 * @returns the parsed URL.
 * @throws when the endpoint is not an absolute HTTP(S) URL.
 */
export declare function resolveEndpoint(endpoint: string): URL;
/**
 * Build the play URL for one pet event: `<endpoint>/api/play/<event>`.
 * @param endpoint - the validated base URL of the pet service.
 * @param action - the resolved pet event name.
 * @returns the absolute request URL.
 */
export declare function playUrl(endpoint: string, action: string): string;
/**
 * Install the desktop-pet notifier. `agent/status` supplies the thinking and
 * idle moments; the `session/event` stream supplies the first stream chunk of
 * each step (typing). Notifications are fire-and-forget HTTP requests
 * serialized in event order; a failed request is logged and never propagates
 * into the agent or session loop.
 * @param ctx - registrant context carrying the agent and session services.
 * @param config - validated notifier configuration.
 */
export declare function apply(ctx: Context, config: Config): void;
//# sourceMappingURL=index.d.ts.map