import { MermaidTheme } from "./theme";

const THEMED_FLAG = "data-slick-themed";

const SHAPE_SELECTORS = [
  ".node rect",
  ".node circle",
  ".node ellipse",
  ".node polygon",
  ".node path",
  ".basic.label-container",
  ".label-container",
].join(",");

const CLUSTER_SELECTORS = [".cluster rect", ".cluster polygon", ".cluster path"].join(",");

const EDGE_PATH_SELECTORS = [".edgePath .path", ".flowchart-link"].join(",");

const MARKER_SELECTORS = [".marker", ".marker.cross", ".arrowMarkerPath", ".arrowheadPath"].join(",");

const EDGE_LABEL_BG_SELECTORS = [".edgeLabel rect", ".labelBkg", ".cluster-label rect"].join(",");

const isSvgElement = (el: Element): el is SVGElement =>
  el instanceof SVGElement;

const setSvgFill = (el: Element, color: string): void => {
  if (!isSvgElement(el)) return;
  el.style.setProperty("fill", color, "important");
  el.setAttribute("fill", color);
};

const setSvgStroke = (el: Element, color: string, width?: string): void => {
  if (!isSvgElement(el)) return;
  el.style.setProperty("stroke", color, "important");
  el.setAttribute("stroke", color);
  if (width !== undefined) {
    el.style.setProperty("stroke-width", width, "important");
    el.setAttribute("stroke-width", width);
  }
};

const themeShapes = (svg: SVGSVGElement, theme: MermaidTheme): void => {
  svg.querySelectorAll(SHAPE_SELECTORS).forEach((el) => {
    setSvgFill(el, theme.nodeFill);
    setSvgStroke(el, theme.nodeStroke, "1");
  });
};

const themeClusters = (svg: SVGSVGElement, theme: MermaidTheme): void => {
  svg.querySelectorAll(CLUSTER_SELECTORS).forEach((el) => {
    setSvgFill(el, theme.clusterFill);
    setSvgStroke(el, theme.clusterStroke, "1");
  });
};

const themeEdges = (svg: SVGSVGElement, theme: MermaidTheme): void => {
  svg.querySelectorAll(EDGE_PATH_SELECTORS).forEach((el) => {
    if (!isSvgElement(el)) return;
    el.style.setProperty("stroke", theme.edgeStroke, "important");
    el.style.setProperty("fill", "none", "important");
    el.setAttribute("stroke", theme.edgeStroke);
    el.setAttribute("fill", "none");
  });
  svg.querySelectorAll(MARKER_SELECTORS).forEach((el) => {
    setSvgFill(el, theme.edgeStroke);
    setSvgStroke(el, theme.edgeStroke);
  });
};

const themeEdgeLabels = (svg: SVGSVGElement, theme: MermaidTheme): void => {
  svg.querySelectorAll(EDGE_LABEL_BG_SELECTORS).forEach((el) => {
    setSvgFill(el, theme.edgeLabelBg);
    if (isSvgElement(el)) el.style.setProperty("opacity", "1", "important");
  });
};

const themeText = (svg: SVGSVGElement, theme: MermaidTheme): void => {
  svg.querySelectorAll<SVGTextElement>("text, tspan").forEach((el) => {
    el.style.setProperty("fill", theme.textColor, "important");
    el.setAttribute("fill", theme.textColor);
  });
  svg.querySelectorAll<HTMLElement>("foreignObject *").forEach((el) => {
    el.style.setProperty("color", theme.textColor, "important");
    el.style.setProperty("background", "transparent", "important");
    el.style.setProperty("background-color", "transparent", "important");
  });
};

/**
 * Mermaid injects an inline `<style>` element inside each SVG with hard-coded
 * default colors (e.g. `#ECECFF`, `#333333`). Replacing those literals in
 * place wins the cascade for any rule we don't selector-match, AND it forces
 * the browser to invalidate the SVG paint cache (mutating `<style>.textContent`
 * is treated as a stylesheet edit, which works around the `contain: paint`
 * caching that prevents external CSS from repainting).
 */
const rewriteInternalStyle = (svg: SVGSVGElement, theme: MermaidTheme): void => {
  const styleNodes = svg.querySelectorAll("style");
  styleNodes.forEach((node) => {
    const original = node.textContent ?? "";
    const replaced = original
      .replace(/#ECECFF/gi, theme.nodeFill)
      .replace(/#9370DB/gi, theme.nodeStroke)
      .replace(/#ffffde/gi, theme.clusterFill)
      .replace(/#aaaa33/gi, theme.clusterStroke)
      .replace(/rgba\(232,\s*232,\s*232,?\s*[\d.]*\s*\)/gi, theme.edgeLabelBg)
      .replace(/#333333/gi, theme.edgeStroke)
      .replace(/#333(?![0-9a-f])/gi, theme.textColor)
      .replace(/#552222/gi, theme.edgeStroke);
    if (replaced !== original) {
      node.textContent = replaced;
    }
  });
};

/**
 * Apply the theme by mutating DOM directly. NOTE: in Live Preview, Chromium
 * caches the painted SVG bitmap inside `contain: paint` ancestors, so these
 * mutations may not visually re-paint until the SVG is replaced or the page
 * is reloaded. The complementary path is hooking Mermaid itself to render
 * with our themeVariables (see src/mermaid-hook.ts), so newly created
 * diagrams come out themed without needing repaint tricks.
 */
export const applyTheme = (svg: SVGSVGElement, theme: MermaidTheme): SVGSVGElement => {
  themeShapes(svg, theme);
  themeClusters(svg, theme);
  themeEdges(svg, theme);
  themeEdgeLabels(svg, theme);
  themeText(svg, theme);
  rewriteInternalStyle(svg, theme);
  svg.setAttribute(THEMED_FLAG, "true");
  return svg;
};

export const themeAllVisibleSvgs = (theme: MermaidTheme): void => {
  document
    .querySelectorAll<SVGSVGElement>(".mermaid svg, .mermaid-preview svg")
    .forEach((svg) => applyTheme(svg, theme));
};
