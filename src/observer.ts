import { applyTheme } from "./svg-theme";
import { MermaidTheme } from "./theme";
import type { SlickMermaidSettings } from "./settings";

const isMermaidSvg = (el: Element): el is SVGSVGElement => {
  if (!(el instanceof SVGSVGElement)) return false;
  if (!el.hasAttribute("aria-roledescription")) return false;
  return Boolean(el.closest(".mermaid, .mermaid-preview"));
};

/**
 * Watch the document for newly inserted / re-rendered Mermaid SVGs.
 *
 * Important: Mermaid blocks can contain other SVGs owned by Obsidian or our
 * controls (for example Lucide icons). Only SVGs with Mermaid's
 * `aria-roledescription` should be themed.
 *
 * Already-themed SVGs are intentionally reprocessed when inserted. Obsidian can
 * virtualize preview content, detach a themed diagram, and reattach it after a
 * theme switch; those diagrams need the current theme even if they still carry
 * `data-slick-themed`.
 */
export const observeSvgs = (
  getTheme: () => MermaidTheme,
  getSettings: () => SlickMermaidSettings,
  onThemedSvg?: (svg: SVGSVGElement) => void,
): MutationObserver => {
  const themeOne = (svg: SVGSVGElement): void => {
    try {
      applyTheme(svg, getTheme(), getSettings());
      onThemedSvg?.(svg);
    } catch (err) {
      console.error("[slick-mermaid] applyTheme failed", err);
    }
  };

  const themeNode = (node: Node): void => {
    if (!(node instanceof Element)) return;
    if (isMermaidSvg(node)) {
      themeOne(node);
      return;
    }
    node
      .querySelectorAll<SVGSVGElement>(".mermaid svg, .mermaid-preview svg")
      .forEach((svg) => {
        if (isMermaidSvg(svg)) themeOne(svg);
      });
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(themeNode);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return observer;
};
