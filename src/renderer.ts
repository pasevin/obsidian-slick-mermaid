import { App } from "obsidian";
import { applyTheme } from "./svg-theme";
import { MermaidTheme } from "./theme";
import { mountFullscreenButton } from "./fullscreen";

interface MermaidRenderResult {
  svg: string;
  bindFunctions?: (element: Element) => void;
}

interface MermaidLike {
  render: (
    id: string,
    source: string,
    container?: Element,
  ) => Promise<MermaidRenderResult> | MermaidRenderResult;
}

let renderCounter = 0;

const getMermaid = (): MermaidLike | undefined => {
  const w = window as unknown as { mermaid?: MermaidLike };
  return w.mermaid;
};

const makeRenderId = (): string => {
  renderCounter += 1;
  return `slick-mermaid-${Date.now()}-${renderCounter}`;
};

const parseSvg = (svgText: string): SVGSVGElement | null => {
  const template = document.createElement("template");
  template.innerHTML = svgText.trim();
  const svg = template.content.querySelector("svg");
  return svg instanceof SVGSVGElement ? svg : null;
};

export const renderMermaidBlock = async (
  app: App,
  source: string,
  el: HTMLElement,
  getTheme: () => MermaidTheme,
): Promise<void> => {
  const mermaid = getMermaid();
  if (!mermaid) {
    el.setText("Slick Mermaid: Mermaid is not available on window.");
    return;
  }

  const host = el.createDiv({ cls: "mermaid slick-mermaid-rendered" });
  const renderHost = document.createElement("div");

  try {
    const result = await mermaid.render(makeRenderId(), source, renderHost);
    const svg = parseSvg(result.svg);
    if (!svg) {
      host.setText("Slick Mermaid: Mermaid returned invalid SVG.");
      return;
    }

    host.empty();
    host.appendChild(svg);
    applyTheme(svg, getTheme());
    result.bindFunctions?.(host);
    mountFullscreenButton(app, host, getTheme);
  } catch (err) {
    host.empty();
    host.createEl("pre", {
      cls: "slick-mermaid-error",
      text: err instanceof Error ? err.message : String(err),
    });
  }
};
