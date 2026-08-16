/**
 * Desktop-pet background plugin, browser half: contributes one entry into the
 * layout's frame-wide `shell.overlay` list — a fixed, 50%-opacity, cover-sized
 * image served by the desktop-pet host plugin at `/desktop-pet/background.png`.
 * The entry declares no children and holds no state; composing this plugin out
 * of cordis.yml removes the background entirely.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the ui-layout SlotMap merge that declares 'shell.overlay'.
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import { Background } from './Background.tsx'

/** Required services for the frame-wide background contribution. */
export const inject = ['slots']

/**
 * Client plugin body: wait for the frame's overlay declaration, then register
 * the background entry into it.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.slots.inject(
    'shell.overlay',
    () => ctx.slots.register({
      name: 'shell.overlay',
      // A fresh list id beside the shipped overlay entries, never replacing one.
      id: 'desktop-pet-background',
    }, Background),
  )
}
