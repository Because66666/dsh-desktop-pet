window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-desktop-pet",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region \0dsh-css:D:\python\deepseek-harness\packages\client\ui-desktop-pet\src\client\Background.module.css.mjs
		const css = ".xLsG4W_background{z-index:0;pointer-events:none;mix-blend-mode:multiply;background-position:50%;background-repeat:no-repeat;background-size:cover;position:fixed;inset:0}";
		const tagId = "@deepseek-ai/dsh-client-ui-desktop-pet/Background.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@deepseek-ai/dsh-client-ui-desktop-pet";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var Background_module_css_default = { "background": "xLsG4W_background" };
		//#endregion
		//#region src/client/Background.tsx
		/** Wire contract: the desktop-pet host plugin serves the image at this path. */
		const BACKGROUND_IMAGE_URL = "/desktop-pet/background.png";
		/** The requested background transparency (50%). */
		const BACKGROUND_OPACITY = .5;
		/**
		* The background layer. The image URL and opacity ride inline styles so the
		* exact contract values stay next to the component that renders them.
		* @param _props - the runtime share; the layer needs none of it.
		*/
		function Background(_props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: Background_module_css_default.background,
				style: {
					backgroundImage: `url(${BACKGROUND_IMAGE_URL})`,
					opacity: BACKGROUND_OPACITY
				},
				"aria-hidden": "true"
			});
		}
		//#endregion
		//#region src/client/index.ts
		/** Required services for the frame-wide background contribution. */
		const inject = ["slots"];
		/**
		* Client plugin body: wait for the frame's overlay declaration, then register
		* the background entry into it.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "desktop-pet-background"
			}, Background));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map