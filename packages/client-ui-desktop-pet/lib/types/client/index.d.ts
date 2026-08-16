/**
 * Desktop-pet background plugin, browser half: contributes one entry into the
 * layout's frame-wide `shell.overlay` list — a fixed, 50%-opacity, cover-sized
 * image served by the desktop-pet host plugin at `/desktop-pet/background.png`.
 * The entry declares no children and holds no state; composing this plugin out
 * of cordis.yml removes the background entirely.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
/** Required services for the frame-wide background contribution. */
export declare const inject: string[];
/**
 * Client plugin body: wait for the frame's overlay declaration, then register
 * the background entry into it.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map