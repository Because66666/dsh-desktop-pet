//#region lib/types/invariant.js
/**
* Package-owned invariant companion for `@deepseek-ai/dsh-desktop-pet`.
* @module @deepseek-ai/dsh-desktop-pet/invariant
*/
const PACKAGE_NAME = "@deepseek-ai/dsh-desktop-pet";
/** Cordis companion plugin name. */
const name = "desktop-pet-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/**
* No runtime invariant: the outbound notification stream is private to the
* plugin's own listeners and exposes no package-owned event or snapshot that
* an independent companion can observe.
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
