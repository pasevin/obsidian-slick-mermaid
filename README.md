# obsidian-slick-mermaid

Minimal, monotone Mermaid CSS theme for Obsidian — designed for the [baseline](https://github.com/aaaaalexis/obsidian-baseline) theme.

Diagrams fit the content width by default. Monotone palette derived entirely from baseline's CSS variable system. No configuration required.

---

## Install

1. Download `slick-mermaid.css`
2. Copy it into your vault's snippets folder: `<vault>/.obsidian/snippets/`
3. Open Obsidian → **Settings → Appearance → CSS Snippets**
4. Enable **slick-mermaid**

Done. All Mermaid diagrams in the vault will use the new theme.

---

## What it does

- Maps baseline's `--color-base-*` token scale onto Mermaid's theme variables
- All diagram types covered: flowcharts, sequence, Gantt, git graph, ER, state
- SVGs scale to fill the full content width — no horizontal scroll, no clipping
- Thin strokes, no drop shadows, Geist font throughout
- Adapts automatically to light and dark mode via baseline's CSS variables

## What it doesn't do (yet)

- Fullscreen / pan / zoom — that requires the JS plugin layer (coming)
- Per-diagram overrides
- Support for themes other than baseline

---

## Compatibility

Tested with:
- baseline theme (target)
- Obsidian 1.x

---

## Roadmap

- [ ] JS plugin layer: fullscreen dialog, pan, zoom
- [ ] Style Settings integration for color overrides
- [ ] PNG/SVG export from fullscreen dialog

---

## License

MIT
