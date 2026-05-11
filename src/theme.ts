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
