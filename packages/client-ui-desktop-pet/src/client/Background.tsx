/**
 * Frame-wide background layer for the desktop-pet integration: a fixed,
 * cover-sized image at 50% opacity, contributed into the layout's
 * `shell.overlay` list seat. Pure presentation — no state, no hooks, no
 * pointer events — so it can never block the app underneath.
 */
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import css from './Background.module.css'

/** Wire contract: the desktop-pet host plugin serves the image at this path. */
const BACKGROUND_IMAGE_URL = '/desktop-pet/background.png'

/** The requested background transparency (50%). */
const BACKGROUND_OPACITY = 0.5

/** Full props for the frame-wide background entry (no owner params). */
export type BackgroundProps = PropsRuntime<'shell.overlay'>

/**
 * The background layer. The image URL and opacity ride inline styles so the
 * exact contract values stay next to the component that renders them.
 * @param _props - the runtime share; the layer needs none of it.
 */
export function Background(_props: BackgroundProps) {
  return (
    <div
      className={css.background}
      style={{ backgroundImage: `url(${BACKGROUND_IMAGE_URL})`, opacity: BACKGROUND_OPACITY }}
      aria-hidden="true"
    />
  )
}
