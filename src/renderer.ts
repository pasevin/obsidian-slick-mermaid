import { App, loadMermaid } from "obsidian";
import { applyTheme } from "./svg-theme";
import { MermaidTheme } from "./theme";
import { mountFullscreenButton } from "./fullscreen";
import { normalizeMermaidSource } from "./source-normalizer";
import type { SlickMermaidSettings } from "./settings";

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

const getMermaid = async (): Promise<MermaidLike | undefined> => {
  const w = window as unknown as { mermaid?: MermaidLike };
  return w.mermaid ?? await loadMermaid() as MermaidLike;
};

const makeRenderId = (): string => {
  renderCounter += 1;
  return `slick-mermaid-${Date.now()}-${renderCounter}`;
};

const parseSvg = (svgText: string): SVGSVGElement | null => {
  const document = new DOMParser().parseFromString(
    svgText.trim(),
    "text/html",
  );
  const svg = document.querySelector("svg");
  return svg instanceof SVGSVGElement ? svg : null;
};

export const renderMermaidBlock = async (
  app: App,
  source: string,
  el: HTMLElement,
  getTheme: () => MermaidTheme,
  getSettings: () => SlickMermaidSettings,
): Promise<void> => {
  const mermaid = await getMermaid();
  if (!mermaid) {
    el.setText("Slick Mermaid: Mermaid is not available on window.");
    return;
  }

  const host = el.createDiv({ cls: "mermaid slick-mermaid-rendered" });
  const renderHost = document.body.createDiv({ cls: "slick-mermaid-measure-host" });

  try {
    const result = await mermaid.render(
      makeRenderId(),
      normalizeMermaidSource(source, {
        normalizeFlowchartLabels: getSettings().compatNormalizeFlowchartLabels,
        normalizeEscapedNewlines: getSettings().compatNormalizeEscapedNewlines,
      }),
      renderHost,
    );
    const svg = parseSvg(result.svg);
    if (!svg) {
      host.setText("Slick Mermaid: Mermaid returned invalid SVG.");
      return;
    }

    host.empty();
    host.appendChild(svg);
    applyTheme(svg, getTheme(), getSettings());
    result.bindFunctions?.(host);
    mountFullscreenButton(app, host, getTheme, getSettings);
  } catch (err) {
    host.empty();
    host.createEl("pre", {
      cls: "slick-mermaid-error",
      text: err instanceof Error ? err.message : String(err),
    });
  } finally {
    renderHost.remove();
  }
};
