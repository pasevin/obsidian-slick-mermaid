# Slick Mermaid

Minimal, monotone Mermaid plugin for Obsidian — designed for the [baseline](https://github.com/aaaaalexis/obsidian-baseline) theme.

Diagrams use baseline / Obsidian theme tokens, disable baseline's Mermaid invert filter, and include a larger-view dialog for reading wide diagrams.

---

## Install

1. Build the plugin: `npm install && npm run build`
2. Copy `main.js`, `manifest.json`, and `styles.css` into `<vault>/.obsidian/plugins/slick-mermaid/`
3. Open Obsidian → **Settings → Community plugins**
4. Enable **Slick Mermaid**

Done. All Mermaid diagrams in the vault will use the new theme.

---

## What it does

- Maps Obsidian / baseline CSS variables onto Mermaid theme variables
- Patches Mermaid rendering so diagrams are themed at first paint
- Disables baseline's Mermaid SVG invert filter (`invert(1) hue-rotate(180deg) saturate(1.25)`)
- Keeps Mermaid SVGs at intrinsic size to avoid clipped `foreignObject` labels
- Adds an expand button and double-click shortcut for a larger pan / zoom dialog
- Adapts automatically to light and dark mode via Obsidian CSS variables

## What it doesn't do yet

- Per-diagram overrides
- Support for themes other than baseline

---

## Compatibility

Tested with:
- baseline theme (target)
- Obsidian 1.x

---

## Roadmap

- [ ] Style Settings integration for color overrides
- [ ] PNG/SVG export from fullscreen dialog

---

## License

MIT
