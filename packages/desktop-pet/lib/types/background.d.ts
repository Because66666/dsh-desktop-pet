/**
 * Background-image serving for the desktop-pet package: one exact webserver
 * route streams the bundled `assets/hero_internet_globe_final.png` so the
 * web GUI's client-side background layer can load it over HTTP. The route is
 * registered only when a `webServer` service exists (the web profile); a
 * headless deployment has no HTTP surface and simply never serves it.
 * @module
 */
import type { Context } from '@deepseek-ai/cordis';
/** The exact route path serving the bundled background image. */
export declare const BACKGROUND_ROUTE = "/desktop-pet/background.png";
/** Bundle-relative asset path of the shipped background image. */
export declare const BACKGROUND_IMAGE_PATH: string;
/**
 * Register the background-image route on the web server, when one exists.
 * The image is read lazily on the first request and cached for the plugin's
 * lifetime; a read failure answers 404 once and retries on the next request.
 * @param ctx - registrant context; the optional `webServer` service group
 *   activates the route and unwinds it with the plugin.
 */
export declare function registerBackgroundRoute(ctx: Context): void;
//# sourceMappingURL=background.d.ts.map