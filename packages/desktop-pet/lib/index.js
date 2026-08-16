import z from "@deepseek-ai/schemastery";
//#region lib/types/index.js
/**
* Forward agent lifecycle moments — thinking, streaming output, and idle — to
* a local desktop-pet HTTP service. The plugin observes the live agent and
* session event streams and calls the pet's play endpoint once per moment; the
* desktop pet's own local HTTP server turns those into animations.
* @module @deepseek-ai/dsh-desktop-pet
*/
/** Cordis function-plugin name. */
const name = "desktop-pet";
/** Services whose streams the plugin observes; injection waits for them so no agent or session event can precede the listeners. */
const inject = ["agents", "sessions"];
/** Default pet event names for the three forwarded lifecycle moments. */
const DEFAULT_ACTIONS = {
	thinking: "deepthink",
	typing: "startwork",
	idle: "endwork"
};
/** Default per-request timeout in milliseconds. */
const DEFAULT_TIMEOUT_MS = 2e3;
/** Schemastery configuration for the desktop-pet notifier. */
const Config = z.object({
	endpoint: z.string().required(),
	method: z.union(["POST", "GET"]).default("POST"),
	token: z.string().default(""),
	timeoutMs: z.number().step(1).min(1).default(DEFAULT_TIMEOUT_MS),
	actions: z.object({
		thinking: z.string().default(DEFAULT_ACTIONS.thinking),
		typing: z.string().default(DEFAULT_ACTIONS.typing),
		idle: z.string().default(DEFAULT_ACTIONS.idle)
	}).default({ ...DEFAULT_ACTIONS })
});
/**
* Validate the configured endpoint: an absolute `http:` or `https:` URL.
* @param endpoint - the configured endpoint string.
* @returns the parsed URL.
* @throws when the endpoint is not an absolute HTTP(S) URL.
*/
function resolveEndpoint(endpoint) {
	const url = new URL(endpoint);
	if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error(`desktop-pet: endpoint must be an http(s) URL, got "${url.protocol}//"`);
	return url;
}
/**
* Build the play URL for one pet event: `<endpoint>/api/play/<event>`.
* @param endpoint - the validated base URL of the pet service.
* @param action - the resolved pet event name.
* @returns the absolute request URL.
*/
function playUrl(endpoint, action) {
	return `${endpoint.replace(/\/+$/, "")}/api/play/${encodeURIComponent(action)}`;
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
function apply(ctx, config) {
	resolveEndpoint(config.endpoint);
	const endpoint = config.endpoint;
	const method = config.method ?? "POST";
	const token = config.token ?? "";
	const timeoutMs = config.timeoutMs ?? 2e3;
	const actions = {
		thinking: config.actions?.thinking ?? DEFAULT_ACTIONS.thinking,
		typing: config.actions?.typing ?? DEFAULT_ACTIONS.typing,
		idle: config.actions?.idle ?? DEFAULT_ACTIONS.idle
	};
	const logger = ctx.logger;
	const typingSteps = /* @__PURE__ */ new WeakMap();
	let chain = Promise.resolve();
	const send = (action) => {
		const url = playUrl(endpoint, action);
		const headers = {};
		if (token.length > 0) headers["authorization"] = `Bearer ${token}`;
		chain = chain.then(() => fetch(url, {
			method,
			headers,
			signal: AbortSignal.timeout(timeoutMs)
		})).then(async (response) => {
			const body = await response.text();
			if (!response.ok) throw new Error(`HTTP ${response.status}: ${body}`);
		}).catch((error) => {
			logger.warn(`desktop-pet: notification to ${url} failed: ${error instanceof Error ? error.message : String(error)}`);
		});
	};
	ctx.effect(() => {
		const stopStatus = ctx.on("agent/status", ({ status }) => {
			send(status === "running" ? actions.thinking : actions.idle);
		});
		const stopEvent = ctx.on("session/event", (session, event) => {
			if (event.type !== "assistant/chunk") return;
			const key = `${event.data.turn}/${event.data.step}`;
			if (typingSteps.get(session) === key) return;
			typingSteps.set(session, key);
			send(actions.typing);
		});
		return () => {
			stopStatus();
			stopEvent();
		};
	}, "desktop-pet.notify()");
}
//#endregion
export { Config, DEFAULT_ACTIONS, DEFAULT_TIMEOUT_MS, apply, inject, name, playUrl, resolveEndpoint };
