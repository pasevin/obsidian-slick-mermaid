import { MermaidTheme, contextualizeTheme } from "./theme";
import type { SlickMermaidSettings } from "./settings";

const THEMED_FLAG = "data-slick-themed";
const ORIGINAL_RX_ATTR = "data-slick-original-rx";
const ORIGINAL_RY_ATTR = "data-slick-original-ry";

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
const EDGE_LABEL_HTML_SELECTORS = [
  ".edgeLabel foreignObject .labelBkg",
  ".edgeLabel foreignObject span.edgeLabel",
  ".edgeLabel foreignObject span.edgeLabel p",
].join(",");

const EDGE_LABEL_PADDING_X = 8;
const EDGE_LABEL_PADDING_Y = 3;
const EDGE_LABEL_PADDED_FLAG = "data-slick-edge-label-padded";

const ER_ENTITY_SELECTORS = [".er.entityBox"].join(",");

const ER_ATTRIBUTE_ODD_SELECTORS = [".er.attributeBoxOdd"].join(",");

const ER_ATTRIBUTE_EVEN_SELECTORS = [".er.attributeBoxEven"].join(",");

const CONTAINER_RADIUS_SELECTORS = [
  ".node rect",
  ".node .basic.label-container",
  ".node .label-container",
  ".cluster rect",
  ".er.entityBox",
  ".er.attributeBoxOdd",
  ".er.attributeBoxEven",
].join(",");

const isSvgElement = (el: Element): el is SVGElement =>
  el instanceof SVGElement;

const clearInlineStyle = (el: Element): void => {
  el.removeAttribute("style");
};

const readNumericAttribute = (
  el: Element,
  attribute: string,
  fallback: number,
): number => {
  const value = Number.parseFloat(el.getAttribute(attribute) ?? "");
  return Number.isFinite(value) ? value : fallback;
};

const setSvgFill = (el: Element, color: string): void => {
  if (!isSvgElement(el)) return;
  clearInlineStyle(el);
  el.setCssProps({ fill: color });
  el.setAttribute("fill", color);
};

const setSvgStroke = (el: Element, color: string, width?: string): void => {
  if (!isSvgElement(el)) return;
  el.setCssProps({ stroke: color });
  el.setAttribute("stroke", color);
  if (width !== undefined) {
    el.setCssProps({ "stroke-width": width });
    el.setAttribute("stroke-width", width);
  }
};

const rememberOriginalRadius = (el: SVGElement): void => {
  if (!el.hasAttribute(ORIGINAL_RX_ATTR)) {
    el.setAttribute(ORIGINAL_RX_ATTR, el.getAttribute("rx") ?? "");
  }
  if (!el.hasAttribute(ORIGINAL_RY_ATTR)) {
    el.setAttribute(ORIGINAL_RY_ATTR, el.getAttribute("ry") ?? "");
  }
};

const restoreRadiusAttribute = (
  el: SVGElement,
  originalAttribute: string,
  targetAttribute: string,
): void => {
  const originalValue = el.getAttribute(originalAttribute);
  if (originalValue === null) return;
  if (originalValue === "") {
    el.removeAttribute(targetAttribute);
    return;
  }
  el.setAttribute(targetAttribute, originalValue);
};

const setContainerRadius = (
  svg: SVGSVGElement,
  settings: SlickMermaidSettings,
): void => {
  svg.querySelectorAll<SVGElement>(CONTAINER_RADIUS_SELECTORS).forEach((el) => {
    if (!(el instanceof SVGRectElement)) return;

    rememberOriginalRadius(el);

    if (!settings.nodeRadiusEnabled) {
      restoreRadiusAttribute(el, ORIGINAL_RX_ATTR, "rx");
      restoreRadiusAttribute(el, ORIGINAL_RY_ATTR, "ry");
      return;
    }

    el.setAttribute("rx", String(settings.nodeRadius));
    el.setAttribute("ry", String(settings.nodeRadius));
  });
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

const themeErTables = (svg: SVGSVGElement, theme: MermaidTheme): void => {
  svg.querySelectorAll(ER_ENTITY_SELECTORS).forEach((el) => {
    setSvgFill(el, theme.nodeFill);
    setSvgStroke(el, theme.nodeStroke, "1");
  });
  svg.querySelectorAll(ER_ATTRIBUTE_ODD_SELECTORS).forEach((el) => {
    setSvgFill(el, theme.nodeFill);
    setSvgStroke(el, theme.nodeStroke, "1");
  });
  svg.querySelectorAll(ER_ATTRIBUTE_EVEN_SELECTORS).forEach((el) => {
    setSvgFill(el, theme.clusterFill);
    setSvgStroke(el, theme.nodeStroke, "1");
  });
};

const themeEdges = (svg: SVGSVGElement, theme: MermaidTheme): void => {
  svg.querySelectorAll(EDGE_PATH_SELECTORS).forEach((el) => {
    if (!isSvgElement(el)) return;
    clearInlineStyle(el);
    el.setCssProps({
      stroke: theme.edgeStroke,
      fill: "none",
    });
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
    if (isSvgElement(el)) {
      el.setCssProps({ opacity: "1" });
      el.setAttribute("rx", "6");
      el.setAttribute("ry", "6");
    }
  });

  svg.querySelectorAll<SVGForeignObjectElement>(".edgeLabel foreignObject").forEach((el) => {
    if (el.hasAttribute(EDGE_LABEL_PADDED_FLAG)) return;

    const width = readNumericAttribute(el, "width", 0);
    const height = readNumericAttribute(el, "height", 0);
    const x = readNumericAttribute(el, "x", 0);
    const y = readNumericAttribute(el, "y", 0);

    if (width > 0 && height > 0) {
      el.setAttribute("x", String(x - EDGE_LABEL_PADDING_X));
      el.setAttribute("y", String(y - EDGE_LABEL_PADDING_Y));
      el.setAttribute("width", String(width + EDGE_LABEL_PADDING_X * 2));
      el.setAttribute("height", String(height + EDGE_LABEL_PADDING_Y * 2));
      el.setAttribute(EDGE_LABEL_PADDED_FLAG, "true");
    }
  });

  svg.querySelectorAll<HTMLElement>(EDGE_LABEL_HTML_SELECTORS).forEach((el) => {
    el.setCssProps({
      color: theme.textColor,
      "background-color": theme.edgeLabelBg,
    });
  });

  svg.querySelectorAll<HTMLElement>(".edgeLabel foreignObject .labelBkg").forEach((el) => {
    el.setCssProps({
      display: "flex",
      "align-items": "center",
      "justify-content": "center",
      width: "100%",
      height: "100%",
      "border-radius": "999px",
      "box-sizing": "border-box",
    });
  });
};

const themeText = (svg: SVGSVGElement, theme: MermaidTheme): void => {
  svg.querySelectorAll<SVGTextElement>("text, tspan").forEach((el) => {
    clearInlineStyle(el);
    el.setCssProps({ fill: theme.textColor });
    el.setAttribute("fill", theme.textColor);
  });
  svg.querySelectorAll<HTMLElement>("foreignObject *").forEach((el) => {
    el.setCssProps({
      color: theme.textColor,
      background: "transparent",
      "background-color": "transparent",
    });
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
  const neutralOverrideMarker = "/* slick-mermaid-neutral-overrides */";
  const svgScope = svg.id ? `#${svg.id}` : "";
  const styleNodes = svg.querySelectorAll("style");
  styleNodes.forEach((node) => {
    const original = (node.textContent ?? "").split(neutralOverrideMarker)[0];
    const replaced = original
      .replace(/#ECECFF/gi, theme.nodeFill)
      .replace(/#9370DB/gi, theme.nodeStroke)
      .replace(/#ffffde/gi, theme.clusterFill)
      .replace(/#aaaa33/gi, theme.clusterStroke)
      .replace(/rgba\(232,\s*232,\s*232,?\s*[\d.]*\s*\)/gi, theme.edgeLabelBg)
      .replace(/#333333/gi, theme.edgeStroke)
      .replace(/#333(?![0-9a-f])/gi, theme.textColor)
      .replace(/#552222/gi, theme.edgeStroke)
      .replace(/fill:\s*#[0-9a-f]{3,8}\s*!important/gi, `fill:${theme.nodeFill}!important`)
      .replace(/stroke:\s*#[0-9a-f]{3,8}\s*!important/gi, `stroke:${theme.nodeStroke}!important`)
      .replace(/color:\s*#[0-9a-f]{3,8}\s*!important/gi, `color:${theme.textColor}!important`);
    node.textContent = `${replaced}
${neutralOverrideMarker}
${svgScope} .cluster rect,
${svgScope} .cluster polygon,
${svgScope} .cluster path {
  fill: ${theme.clusterFill} !important;
  stroke: ${theme.clusterStroke} !important;
}
${svgScope} .node rect,
${svgScope} .node circle,
${svgScope} .node ellipse,
${svgScope} .node polygon,
${svgScope} .node path,
${svgScope} .basic.label-container,
${svgScope} .label-container {
  fill: ${theme.nodeFill} !important;
  stroke: ${theme.nodeStroke} !important;
}
${svgScope} .label text,
${svgScope} .label tspan,
${svgScope} .cluster-label text,
${svgScope} .cluster-label tspan,
${svgScope} foreignObject,
${svgScope} foreignObject * {
  fill: ${theme.textColor} !important;
  color: ${theme.textColor} !important;
}
`;
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
export const applyTheme = (
  svg: SVGSVGElement,
  theme: MermaidTheme,
  settings: SlickMermaidSettings,
): SVGSVGElement => {
  const contextualTheme = contextualizeTheme(theme, svg);
  themeShapes(svg, contextualTheme);
  setContainerRadius(svg, settings);
  themeClusters(svg, contextualTheme);
  themeErTables(svg, contextualTheme);
  themeEdges(svg, contextualTheme);
  themeText(svg, contextualTheme);
  themeEdgeLabels(svg, contextualTheme);
  rewriteInternalStyle(svg, contextualTheme);
  svg.setAttribute(THEMED_FLAG, "true");
  return svg;
};

export const themeAllVisibleSvgs = (
  theme: MermaidTheme,
  settings: SlickMermaidSettings,
): void => {
  document
    .querySelectorAll<SVGSVGElement>(".mermaid svg, .mermaid-preview svg")
    .forEach((svg) => applyTheme(svg, theme, settings));
};
