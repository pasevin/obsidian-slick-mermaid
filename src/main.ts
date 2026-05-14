import { Plugin } from "obsidian";
import { MermaidTheme, readTheme } from "./theme";
import { applyTheme, themeAllVisibleSvgs } from "./svg-theme";
import { observeSvgs } from "./observer";
import { mountFullscreenButton } from "./fullscreen";
import { loadAndPatchMermaid } from "./mermaid-hook";
import { renderMermaidBlock } from "./renderer";
import {
  DEFAULT_SETTINGS,
  normalizeSettings,
  SlickMermaidSettingTab,
} from "./settings";
import type { SlickMermaidSettings } from "./settings";

const MERMAID_HOST_SELECTORS = [".mermaid", ".mermaid-preview"].join(",");

export default class SlickMermaidPlugin extends Plugin {
  private observer?: MutationObserver;
  private unpatchMermaid?: () => void;
  private cachedTheme: MermaidTheme = readTheme();
  private settings: SlickMermaidSettings = { ...DEFAULT_SETTINGS };
  private mermaidPatchVersion = 0;
  private themeRefreshFrame?: number;
  private themeRefreshTimers: number[] = [];

  async onload(): Promise<void> {
    await this.loadSettings();
    this.refreshTheme();

    this.addSettingTab(new SlickMermaidSettingTab(this.app, this, {
      getSettings: () => this.settings,
      updateSettings: (settings) => this.updateSettings(settings),
      resetSettingsToDefaults: () => this.resetSettingsToDefaults(),
    }));

    // Hook Mermaid so future renders come out themed natively. This is the
    // primary mechanism — we don't rely on post-render mutation to win.
    void this.refreshMermaidPatch();

    this.registerMarkdownCodeBlockProcessor("mermaid", async (source, el) => {
      await renderMermaidBlock(
        this.app,
        source,
        el,
        () => this.cachedTheme,
        () => this.settings,
      );
    });

    this.registerMarkdownPostProcessor((el) => {
      this.themeContainersWithin(el);
    });

    this.observer = observeSvgs(
      () => this.cachedTheme,
      () => this.settings,
      (svg) => {
        const host = svg.closest<HTMLElement>(MERMAID_HOST_SELECTORS);
        if (host) {
          mountFullscreenButton(
            this.app,
            host,
            () => this.cachedTheme,
            () => this.settings,
          );
        }
      },
    );

    this.registerEvent(
      this.app.workspace.on("css-change", () => {
        this.scheduleThemeRefresh();
      }),
    );

    this.app.workspace.onLayoutReady(() => {
      this.themeContainersWithin(document.body);
      window.setTimeout(() => this.themeContainersWithin(document.body), 250);
      window.setTimeout(() => this.themeContainersWithin(document.body), 1000);
    });
  }

  onunload(): void {
    this.mermaidPatchVersion += 1;
    this.clearScheduledThemeRefresh();
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
        el.removeAttribute("data-slick-fs-dblclick");
      });
  }

  private refreshTheme(): void {
    this.cachedTheme = readTheme();
  }

  private async loadSettings(): Promise<void> {
    const data = await this.loadData() as Partial<SlickMermaidSettings> | null;
    this.settings = normalizeSettings(data);
  }

  private async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private async resetSettingsToDefaults(): Promise<void> {
    this.settings = normalizeSettings(null);
    await this.saveSettings();
    this.refreshRenderedDiagrams(true);
  }

  private async updateSettings(
    settings: Partial<SlickMermaidSettings>,
  ): Promise<void> {
    this.settings = normalizeSettings({ ...this.settings, ...settings });
    await this.saveSettings();
    this.refreshRenderedDiagrams(true);
  }

  private refreshRenderedDiagrams(repatchMermaid: boolean): void {
    this.refreshTheme();
    if (repatchMermaid) {
      // Re-apply Mermaid config so future renders use the new theme.
      void this.refreshMermaidPatch();
    }
    themeAllVisibleSvgs(this.cachedTheme, this.settings);
    this.themeContainersWithin(document.body);
  }

  private clearScheduledThemeRefresh(): void {
    if (this.themeRefreshFrame !== undefined) {
      window.cancelAnimationFrame(this.themeRefreshFrame);
      this.themeRefreshFrame = undefined;
    }
    this.themeRefreshTimers.forEach((timer) => window.clearTimeout(timer));
    this.themeRefreshTimers = [];
  }

  private scheduleThemeRefresh(): void {
    this.clearScheduledThemeRefresh();

    this.refreshRenderedDiagrams(true);
    this.themeRefreshFrame = window.requestAnimationFrame(() => {
      this.themeRefreshFrame = undefined;
      this.refreshRenderedDiagrams(false);
    });

    [50, 150, 400, 1000].forEach((delay, index) => {
      const timer = window.setTimeout(() => {
        this.themeRefreshTimers = this.themeRefreshTimers.filter((value) => value !== timer);
        this.refreshRenderedDiagrams(index === 3);
      }, delay);
      this.themeRefreshTimers.push(timer);
    });
  }

  private async refreshMermaidPatch(): Promise<void> {
    const patchVersion = this.mermaidPatchVersion + 1;
    this.mermaidPatchVersion = patchVersion;
    this.unpatchMermaid?.();
    this.unpatchMermaid = undefined;

    const unpatch = await loadAndPatchMermaid(
      () => this.cachedTheme,
      () => this.settings,
    );
    if (patchVersion === this.mermaidPatchVersion) {
      this.unpatchMermaid = unpatch;
      return;
    }

    unpatch();
  }

  private themeContainersWithin(root: ParentNode): void {
    root
      .querySelectorAll<HTMLElement>(MERMAID_HOST_SELECTORS)
      .forEach((host) => {
        const svg = host.querySelector<SVGSVGElement>("svg");
        if (svg) applyTheme(svg, this.cachedTheme, this.settings);
        mountFullscreenButton(
          this.app,
          host,
          () => this.cachedTheme,
          () => this.settings,
        );
      });
  }
}
