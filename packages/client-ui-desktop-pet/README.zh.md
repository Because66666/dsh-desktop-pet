# dsh-client-ui-desktop-pet — 桌宠背景层

[English](README.md) | 中文

`dsh-client-ui-desktop-pet` 为 Web GUI 添加桌宠背景图片：在布局的框架级 `shell.overlay` 席位注册一个条目，将内置的地球图片以 50% 透明度渲染为固定、铺满视口的图层。图层以 `mix-blend-mode: multiply` 混合，浅色图片只给应用表面着色，深色文字保持原有对比度。该图层可点击穿透（`pointer-events: none`）且 `aria-hidden`，绝不阻塞交互或到达辅助技术。从 web bundle 中组合移除该插件，背景即完全消失。

## 图片契约

图层从 `/desktop-pet/background.png` 加载图片——这正是桌宠宿主插件（`@deepseek-ai/dsh-desktop-pet`）从包内资源提供的确切路由。背景要显示，两个包都必须挂载：客户端行渲染图层，宿主行提供字节。缺少宿主行时图片请求 404，图层渲染为空白。

透明度为 50%（`0.5`）；图片按 `background-size: cover` 铺满视口。这两个值都是本包中的源码常量——这个视觉效果本身就是功能。

## 挂载

该行随 web-app bundle 发布（`packages/bundle/web-app/cordis.patch.yml`，id 为 `ui-desktop-pet`），因此两个包安装后，web profile 默认显示背景。要关闭它，在更靠后的补丁层（profile 自己的 `cordis.patch.yml`）中移除或禁用 `ui-desktop-pet` 行：

```yaml
# $DSH_HOME/profiles/web/cordis.patch.yml
- id: ui-desktop-pet
  disabled: true
```

宿主半部与通知器一样挂载（[`dsh-desktop-pet`](../../integrations/desktop-pet/README.md)）；它的 `endpoint` 配置与背景无关。

## Model Experience

None, as the package registers no prompt section, tool schema, service, or other model-visible content — it renders one static background layer from a host-served image.

#### KV Cache effect

The package adds nothing to any model request, so request tokens and cache reuse are unaffected.

## 已知限制与暂缓事项

- **图片与透明度是源码常量**——该行不带任何配置，更换图片或调整透明度需要修改本包（或在同一路由替换所提供的字节）。浏览器插件配置不在启动清单中，因此暂未打通按部署配置的值。
- **缺少宿主行时渲染空白**——图层依赖桌宠宿主插件提供 `/desktop-pet/background.png`；仅挂载客户端行会渲染出一个空图层。
- **是覆盖层而非内容后的背景**——框架及其列绘制不透明表面，因此图片渲染在应用之上而非之后。图层使用 `mix-blend-mode: multiply`（直接 50% 覆盖会把文字对比度减半）；在深色主题下，multiply 作用于深色表面仍为深色，图片几乎不可见。
