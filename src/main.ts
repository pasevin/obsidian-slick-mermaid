import { Plugin } from "obsidian";
import { MermaidTheme, readTheme } from "./theme";
import { applyTheme, themeAllVisibleSvgs } from "./svg-theme";
import { observeSvgs } from "./observer";
import { mountFullscreenButton } from "./fullscreen";
import { patchMermaid } from "./mermaid-hook";
import { renderMermaidBlock } from "./renderer";

const MERMAID_HOST_SELECTORS = [".mermaid", ".mermaid-preview"].join(",");

export default class SlickMermaidPlugin extends Plugin {
  private observer?: MutationObserver;
  private unpatchMermaid?: () => void;
  private cachedTheme: MermaidTheme = readTheme();

  onload(): void {
    this.refreshTheme();

    // Hook Mermaid so future renders come out themed natively. This is the
    // primary mechanism — we don't rely on post-render mutation to win.
    this.unpatchMermaid = patchMermaid(() => this.cachedTheme);

    this.registerMarkdownCodeBlockProcessor("mermaid", async (source, el) => {
      await renderMermaidBlock(this.app, source, el, () => this.cachedTheme);
    });

    this.registerMarkdownPostProcessor((el) => {
      this.themeContainersWithin(el);
    });

    this.observer = observeSvgs(() => this.cachedTheme, (svg) => {
      const host = svg.closest<HTMLElement>(MERMAID_HOST_SELECTORS);
      if (host) mountFullscreenButton(this.app, host, () => this.cachedTheme);
    });

    this.registerEvent(
      this.app.workspace.on("css-change", () => {
        this.refreshTheme();
        // Re-apply Mermaid config so future renders use the new theme.
        this.unpatchMermaid?.();
        this.unpatchMermaid = patchMermaid(() => this.cachedTheme);
        themeAllVisibleSvgs(this.cachedTheme);
      }),
    );

    this.app.workspace.onLayoutReady(() => {
      this.themeContainersWithin(document.body);
      window.setTimeout(() => this.themeContainersWithin(document.body), 250);
      window.setTimeout(() => this.themeContainersWithin(document.body), 1000);
    });
  }

  onunload(): void {
    this.unpatchMermaid?.();
    this.observer?.disconnect();
    document
      .querySelectorAll(".slick-mermaid-fs-btn")
      .forEach((el) => el.remove());
    document
      .querySelectorAll(".slick-mermaid-host")
      .forEach((el) => {
        el.removeClass("slick-mermaid-host");
        el.removeAttribute("data-slick-fs");
      });
  }

  private refreshTheme(): void {
    this.cachedTheme = readTheme();
  }

  private themeContainersWithin(root: ParentNode): void {
    root
      .querySelectorAll<HTMLElement>(MERMAID_HOST_SELECTORS)
      .forEach((host) => {
        const svg = host.querySelector<SVGSVGElement>("svg");
        if (svg) applyTheme(svg, this.cachedTheme);
        mountFullscreenButton(this.app, host, () => this.cachedTheme);
      });
  }
}
