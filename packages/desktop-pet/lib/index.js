import z from "@deepseek-ai/schemastery";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
//#region lib/types/background.js
/**
* Background-image serving for the desktop-pet package: one exact webserver
* route streams the bundled `assets/hero_internet_globe_final.png` so the
* web GUI's client-side background layer can load it over HTTP. The route is
* registered only when a `webServer` service exists (the web profile); a
* headless deployment has no HTTP surface and simply never serves it.
* @module
*/
/** The exact route path serving the bundled background image. */
const BACKGROUND_ROUTE = "/desktop-pet/background.png";
/** Bundle-relative asset path of the shipped background image. */
const BACKGROUND_IMAGE_PATH = fileURLToPath(new URL("../assets/hero_internet_globe_final.png", import.meta.url));
/** Max-age for the served image; the bytes are immutable at a fixed route. */
const CACHE_MAX_AGE_SECONDS = 86400;
/**
* Register the background-image route on the web server, when one exists.
* The image is read lazily on the first request and cached for the plugin's
* lifetime; a read failure answers 404 once and retries on the next request.
* @param ctx - registrant context; the optional `webServer` service group
*   activates the route and unwinds it with the plugin.
*/
function registerBackgroundRoute(ctx) {
	ctx.inject(["webServer"], (webCtx) => {
		webCtx.effect(() => webCtx.webServer.register({
			kind: "exact",
			path: BACKGROUND_ROUTE,
			handler: async (_req, res) => {
				const buffer = await readFile(BACKGROUND_IMAGE_PATH).catch(() => void 0);
				if (buffer === void 0) {
					res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
					res.end("background image not found");
					return;
				}
				res.writeHead(200, {
					"content-type": "image/png",
					"content-length": String(buffer.length),
					"cache-control": `public, max-age=${CACHE_MAX_AGE_SECONDS}`
				});
				res.end(buffer);
			}
		}), "desktop-pet: background route");
	});
}
//#endregion
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
	registerBackgroundRoute(ctx);
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
