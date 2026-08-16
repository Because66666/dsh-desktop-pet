/**
 * Frame-wide background layer for the desktop-pet integration: a fixed,
 * cover-sized image at 50% opacity, contributed into the layout's
 * `shell.overlay` list seat. Pure presentation — no state, no hooks, no
 * pointer events — so it can never block the app underneath.
 */
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
/** Full props for the frame-wide background entry (no owner params). */
export type BackgroundProps = PropsRuntime<'shell.overlay'>;
/**
 * The background layer. The image URL and opacity ride inline styles so the
 * exact contract values stay next to the component that renders them.
 * @param _props - the runtime share; the layer needs none of it.
 */
export declare function Background(_props: BackgroundProps): import("react").JSX.Element;
//# sourceMappingURL=Background.d.ts.map