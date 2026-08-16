//#region lib/types/invariant.js
/**
* Package-owned invariant companion for `@deepseek-ai/dsh-client-ui-desktop-pet`.
* @module @deepseek-ai/dsh-client-ui-desktop-pet/invariant
*/
const PACKAGE_NAME = "@deepseek-ai/dsh-client-ui-desktop-pet";
/** Cordis companion plugin name. */
const name = "client-ui-desktop-pet-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/**
* No runtime invariant: the package is a pure presentation contribution —
* one static `shell.overlay` entry that renders a fixed background layer and
* owns no state, no events, and no cross-plugin mutable data. Disposal is
* proven by the HMR-safety spec over the real SlotRegistry.
*/
const install = () => {};
/**
* Register this package's invariant companion.
* @param ctx - Cordis context carrying the invariant service.
* @returns the installed registration's disposer after setup succeeds.
*/
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
