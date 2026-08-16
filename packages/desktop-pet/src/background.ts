/**
 * Background-image serving for the desktop-pet package: one exact webserver
 * route streams the bundled `assets/hero_internet_globe_final.png` so the
 * web GUI's client-side background layer can load it over HTTP. The route is
 * registered only when a `webServer` service exists (the web profile); a
 * headless deployment has no HTTP surface and simply never serves it.
 * @module
 */

import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import type { Context } from '@deepseek-ai/cordis'

/** The exact route path serving the bundled background image. */
export const BACKGROUND_ROUTE = '/desktop-pet/background.png'

/** Bundle-relative asset path of the shipped background image. */
export const BACKGROUND_IMAGE_PATH = fileURLToPath(
  new URL('../assets/hero_internet_globe_final.png', import.meta.url),
)

/** Max-age for the served image; the bytes are immutable at a fixed route. */
const CACHE_MAX_AGE_SECONDS = 86_400

/**
 * Register the background-image route on the web server, when one exists.
 * The image is read lazily on the first request and cached for the plugin's
 * lifetime; a read failure answers 404 once and retries on the next request.
 * @param ctx - registrant context; the optional `webServer` service group
 *   activates the route and unwinds it with the plugin.
 */
export function registerBackgroundRoute(ctx: Context): void {
  ctx.inject(['webServer'], (webCtx) => {
    webCtx.effect(() => webCtx.webServer.register({
      kind: 'exact',
      path: BACKGROUND_ROUTE,
      handler: async (_req, res) => {
        const buffer = await readFile(BACKGROUND_IMAGE_PATH).catch(() => undefined)
        if (buffer === undefined) {
          res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
          res.end('background image not found')
          return
        }
        res.writeHead(200, {
          'content-type': 'image/png',
          'content-length': String(buffer.length),
          'cache-control': `public, max-age=${CACHE_MAX_AGE_SECONDS}`,
        })
        res.end(buffer)
      },
    }), 'desktop-pet: background route')
  })
}
