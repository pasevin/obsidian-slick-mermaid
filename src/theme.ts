/**
 * Resolves Obsidian theme CSS variables into concrete colors that we can
 * stamp directly onto SVG elements. Reading variables once per render lets us
 * apply them as inline `style="fill:..."` and `<style>` text replacements,
 * which is the only reliable path in Live Preview (external CSS doesn't
 * repaint cached SVG bitmaps inside CodeMirror's `contain: paint` widget).
 */

export interface MermaidTheme {
  nodeFill: string;
  nodeStroke: string;
  clusterFill: string;
  clusterStroke: string;
  edgeStroke: string;
  textColor: string;
  edgeLabelBg: string;
  canvas: string;
}

interface RgbColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

const FALLBACK: MermaidTheme = {
  nodeFill: "#262626",
  nodeStroke: "#363636",
  clusterFill: "#1e1e1e",
  clusterStroke: "#363636",
  edgeStroke: "#9a9a9a",
  textColor: "#dadada",
  edgeLabelBg: "#1e1e1e",
  canvas: "#1e1e1e",
};

const readVar = (cs: CSSStyleDeclaration, name: string, fallback: string): string =>
  cs.getPropertyValue(name).trim() || fallback;

const clampColor = (value: number): number =>
  Math.max(0, Math.min(255, Math.round(value)));

const parseCssColor = (color: string): RgbColor | null => {
  const trimmed = color.trim();
  if (trimmed === "" || trimmed === "transparent") return null;

  const hex = trimmed.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const value = hex[1];
    const expanded = value.length === 3
      ? value.split("").map((part) => part + part).join("")
      : value;
    return {
      r: Number.parseInt(expanded.slice(0, 2), 16),
      g: Number.parseInt(expanded.slice(2, 4), 16),
      b: Number.parseInt(expanded.slice(4, 6), 16),
      a: 1,
    };
  }

  const rgb = trimmed.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
  );
  if (!rgb) return null;

  return {
    r: Number.parseFloat(rgb[1]),
    g: Number.parseFloat(rgb[2]),
    b: Number.parseFloat(rgb[3]),
    a: rgb[4] === undefined ? 1 : Number.parseFloat(rgb[4]),
  };
};

const toRgbString = (color: RgbColor): string =>
  `rgb(${clampColor(color.r)}, ${clampColor(color.g)}, ${clampColor(color.b)})`;

const mix = (from: RgbColor, to: RgbColor, amount: number): RgbColor => ({
  r: from.r + (to.r - from.r) * amount,
  g: from.g + (to.g - from.g) * amount,
  b: from.b + (to.b - from.b) * amount,
  a: 1,
});

const relativeLuminance = (color: RgbColor): number => {
  const channel = (value: number): number => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
};

const visibleBackgroundFor = (root: Element): string | null => {
  let current: Element | null = root;
  while (current) {
    const color = parseCssColor(getComputedStyle(current).backgroundColor);
    if (color && color.a > 0) return toRgbString(color);
    current = current.parentElement;
  }

  const bodyColor = parseCssColor(getComputedStyle(document.body).backgroundColor);
  return bodyColor && bodyColor.a > 0 ? toRgbString(bodyColor) : null;
};

const varySurface = (surface: RgbColor, amount: number): string => {
  const dark = relativeLuminance(surface) < 0.5;
  const target = dark
    ? { r: 255, g: 255, b: 255, a: 1 }
    : { r: 0, g: 0, b: 0, a: 1 };
  return toRgbString(mix(surface, target, amount));
};

export function readTheme(): MermaidTheme {
  const cs = getComputedStyle(document.body);
  return {
    nodeFill: readVar(cs, "--background-secondary", FALLBACK.nodeFill),
    nodeStroke: readVar(cs, "--background-modifier-border", FALLBACK.nodeStroke),
    clusterFill: readVar(cs, "--background-primary", FALLBACK.clusterFill),
    clusterStroke: readVar(cs, "--background-modifier-border", FALLBACK.clusterStroke),
    edgeStroke: readVar(cs, "--text-muted", FALLBACK.edgeStroke),
    textColor: readVar(cs, "--text-normal", FALLBACK.textColor),
    edgeLabelBg: readVar(cs, "--background-primary", FALLBACK.edgeLabelBg),
    canvas: readVar(cs, "--background-primary", FALLBACK.canvas),
  };
}

export function contextualizeTheme(
  theme: MermaidTheme,
  root: Element,
  contrastPercent: number,
): MermaidTheme {
  const surfaceColor = visibleBackgroundFor(root);
  const surface = surfaceColor ? parseCssColor(surfaceColor) : null;
  if (!surfaceColor || !surface) return theme;

  const factor = Math.min(1.5, Math.max(0.5, contrastPercent / 100));

  return {
    ...theme,
    canvas: surfaceColor,
    clusterFill: varySurface(surface, 0.025 * factor),
    edgeLabelBg: varySurface(surface, 0.08 * factor),
    nodeFill: varySurface(surface, 0.07 * factor),
    nodeStroke: varySurface(surface, 0.14 * factor),
    clusterStroke: varySurface(surface, 0.11 * factor),
  };
}
