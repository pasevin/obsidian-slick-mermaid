# Slick Mermaid

Opinionated, minimal, theme-adaptive Mermaid diagrams for Obsidian.

Slick Mermaid makes Mermaid diagrams feel native to whatever Obsidian theme you use. It reads the active theme's background, border, and text colors, matches diagram surfaces to the surrounding note, and adds subtle contrast so nodes and groups stay readable in both light and dark mode.

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

- Adapts Mermaid diagrams to the active Obsidian theme using standard theme variables.
- Matches large diagram wrappers to the surrounding note surface, then adds subtle variation for nodes, borders, and edge-label pills.
- Neutralizes Mermaid's explicit `style` / `classDef` colors so diagrams stay cohesive across themes.
- Re-themes visible and virtualized diagrams after theme switches, without needing an Obsidian restart.
- Disables theme-level Mermaid SVG invert filters when present, so correctly themed diagrams are not visually inverted.

### Opinionated Controls

- Adds a plugin setting to turn opinionated container radius on or off.
- Defaults to an `8px` radius for nodes and group wrappers, with a slider shown only when the radius setting is on.

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
- Multiple light and dark Obsidian themes
- Obsidian 1.x

Slick Mermaid should work with most Obsidian themes that expose the standard background, border, and text variables. It is no longer tuned for a single theme; the goal is to make Mermaid feel native wherever it is rendered.

---

## Roadmap

- [ ] Style Settings integration for color overrides
- [ ] PNG/SVG export from fullscreen dialog

---

## License

MIT
