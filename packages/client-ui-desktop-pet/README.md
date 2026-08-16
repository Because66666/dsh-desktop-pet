# dsh-client-ui-desktop-pet — the desktop-pet background layer

English | [中文](README.zh.md)

`dsh-client-ui-desktop-pet` adds the desktop-pet background image to the web GUI: one entry in the layout's frame-wide `shell.overlay` seat renders the bundled globe image as a fixed, cover-sized layer at 50% opacity. The layer blends with `mix-blend-mode: multiply`, so the light image tints the app surfaces while dark text keeps its full contrast. The layer is click-through (`pointer-events: none`) and `aria-hidden`, so it never blocks interaction or reaches assistive tech. Composing this plugin out of the web bundle removes the background entirely.

## The image contract

The layer loads its image from `/desktop-pet/background.png` — the exact route the desktop-pet host plugin (`@deepseek-ai/dsh-desktop-pet`) serves from its bundled asset. Both packages must be mounted for the background to appear: the client row renders the layer, the host row serves the bytes. Without the host row the image request 404s and the layer renders blank.

The opacity is 50% (`0.5`); the image is `background-size: cover` across the viewport. Both values are source constants in this package — the visual is the feature.

## Mounting

The row ships in the web-app bundle (`packages/bundle/web-app/cordis.patch.yml`, id `ui-desktop-pet`), so the web profile shows the background by default once both packages are installed. To turn it off, remove or disable the `ui-desktop-pet` row in a later patch layer (the profile's own `cordis.patch.yml`):

```yaml
# $DSH_HOME/profiles/web/cordis.patch.yml
- id: ui-desktop-pet
  disabled: true
```

The host half is mounted the same way as the notifier ([`dsh-desktop-pet`](../../integrations/desktop-pet/README.md)); its `endpoint` config is unrelated to the background.

## Model Experience

None, as the package registers no prompt section, tool schema, service, or other model-visible content — it renders one static background layer from a host-served image.

#### KV Cache effect

The package adds nothing to any model request, so request tokens and cache reuse are unaffected.

## Known Limitations and Deferred Work

- **Image and opacity are source constants** — the row carries no config, so changing the picture or its transparency requires editing this package (or replacing the served bytes at the same route). Browser plugin config is not part of the boot manifest, so per-deployment values are not plumbed yet.
- **Blank when the host row is absent** — the layer depends on the desktop-pet host plugin serving `/desktop-pet/background.png`; mounting the client row alone renders an empty layer.
- **Overlay, not behind-content** — the frame and its columns paint opaque surfaces, so the image renders above the app rather than behind it. The layer uses `mix-blend-mode: multiply` (a plain 50% wash would halve text contrast); on dark themes multiply against dark surfaces stays dark, so the image is barely visible there.
