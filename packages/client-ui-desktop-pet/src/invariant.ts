/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-client-ui-desktop-pet`.
 * @module @deepseek-ai/dsh-client-ui-desktop-pet/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@deepseek-ai/dsh-client-ui-desktop-pet'

/** Cordis companion plugin name. */
export const name = 'client-ui-desktop-pet-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: the package is a pure presentation contribution —
 * one static `shell.overlay` entry that renders a fixed background layer and
 * owns no state, no events, and no cross-plugin mutable data. Disposal is
 * proven by the HMR-safety spec over the real SlotRegistry.
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
