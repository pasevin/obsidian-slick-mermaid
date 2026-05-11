# Slick Mermaid

Minimal, theme-aware Mermaid plugin for Obsidian — inspired by the [baseline](https://github.com/aaaaalexis/obsidian-baseline) theme's neutral, typography-first aesthetic.

Slick Mermaid makes Obsidian diagrams feel native to your workspace: subdued surfaces, thin strokes, readable labels, and a larger pan / zoom dialog for complex graphs. It uses standard Obsidian theme variables, so it adapts to light and dark mode and can be used with themes beyond baseline.

![Slick Mermaid light theme sequence diagram dialog](assets/slick-mermaid-light-dialog.png)

![Slick Mermaid light theme flow and sequence diagrams](assets/slick-mermaid-light-flow-sequence.png)

![Slick Mermaid light theme git graph and pie chart](assets/slick-mermaid-light-git-pie.png)

![Slick Mermaid light theme class diagram](assets/slick-mermaid-light-class.png)

## Demo Videos

- [Watch the light mode demo](assets/slick-mermaid-light.mp4)
- [Watch the dark mode demo](assets/slick-mermaid-dark.mp4)

---

## Install

### Community Plugins

Once accepted into the Obsidian Community Plugins directory:

1. Open Obsidian → **Settings → Community plugins**.
2. Browse for **Slick Mermaid**.
3. Install and enable the plugin.

### Manual Install

1. Download the latest release assets: `main.js`, `manifest.json`, and `styles.css`.
2. Copy them into `<vault>/.obsidian/plugins/slick-mermaid/`.
3. Open Obsidian → **Settings → Community plugins**.
4. Enable **Slick Mermaid**.

### Development Install

1. Clone the repo.
2. Run `npm install && npm run build`.
3. Copy `main.js`, `manifest.json`, and `styles.css` into `<vault>/.obsidian/plugins/slick-mermaid/`.

Done. All Mermaid diagrams in the vault will use the new theme.

---

## What it does

### Native Obsidian Styling

- Maps Obsidian CSS variables onto Mermaid theme variables.
- Uses dark monotone fills, thin borders, and readable text instead of Mermaid's bright defaults.
- Disables theme-level Mermaid SVG invert filters when present, including baseline's `invert(1) hue-rotate(180deg) saturate(1.25)`, which otherwise turns correctly themed dark nodes back into light boxes.
- Adapts automatically to light and dark mode via Obsidian CSS variables.

### Better Mermaid Compatibility

- Patches Mermaid rendering so diagrams are themed at first paint.
- Normalizes common flowchart labels before parsing, so Obsidian accepts labels like `canTransfer(from, to, amount)` without requiring manual quotes.
- Supports escaped newline labels like `A["Smart Contracts\n(on-chain events)"]`, rendering them as real multiline nodes instead of literal `\n` text.
- Themes ER diagram table rows (`entityBox`, `attributeBoxOdd`, `attributeBoxEven`) so table-style components do not keep white backgrounds.

### Larger Diagram Viewer

- Adds an expand button and double-click shortcut for a larger dialog.
- Opens diagrams fitted by default.
- Supports drag-to-pan and wheel-to-zoom for wide or dense diagrams.
- Keeps inline Mermaid SVGs contained in the note while allowing the dialog view to zoom freely.

## What it doesn't do yet

- Per-diagram overrides
- Per-theme presets beyond Obsidian's standard theme variables

---

## Compatibility

Tested with:
- baseline theme (primary design reference)
- Obsidian 1.x

Slick Mermaid should work with most Obsidian themes that expose the standard background, border, and text variables. Visual tuning may vary by theme.

---

## Roadmap

- [ ] Style Settings integration for color overrides
- [ ] PNG/SVG export from fullscreen dialog

---

## License

MIT
