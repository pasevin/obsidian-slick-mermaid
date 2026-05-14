import { loadMermaid } from "obsidian";
import { MermaidTheme } from "./theme";
import { normalizeMermaidSource, type MermaidNormalizeOptions } from "./source-normalizer";
import type { SlickMermaidSettings } from "./settings";

/**
 * Obsidian bundles a single Mermaid instance and exposes it as `window.mermaid`.
 * Every time it renders a diagram it goes through `mermaid.render(...)` after
 * applying the active configuration via `mermaid.initialize(...)`.
 *
 * Strategy: monkey-patch `mermaid.initialize` so any future call (Obsidian's
 * own re-init on theme/CSS change) MERGES our theme variables into Mermaid's
 * config. This way diagrams come out themed on the FIRST paint — we don't
 * fight Chromium's `contain: paint` cache because we never need to re-paint.
 */

interface MermaidLike {
  initialize: (config: Record<string, unknown>) => void;
  render: (
    id: string,
    source: string,
    container?: Element,
  ) => unknown;
  __slickMermaidPatched?: boolean;
  __slickMermaidLastConfig?: Record<string, unknown>;
}

const buildThemeVariables = (theme: MermaidTheme): Record<string, string> => ({
  // Base palette — Mermaid 11 derives most colors from these
  background: theme.canvas,
  primaryColor: theme.nodeFill,
  primaryBorderColor: theme.nodeStroke,
  primaryTextColor: theme.textColor,
  secondaryColor: theme.nodeFill,
  secondaryBorderColor: theme.nodeStroke,
  secondaryTextColor: theme.textColor,
  tertiaryColor: theme.clusterFill,
  tertiaryBorderColor: theme.clusterStroke,
  tertiaryTextColor: theme.textColor,
  // Edges + labels
  lineColor: theme.edgeStroke,
  edgeLabelBackground: theme.edgeLabelBg,
  textColor: theme.textColor,
  nodeBorder: theme.nodeStroke,
  clusterBkg: theme.clusterFill,
  clusterBorder: theme.clusterStroke,
  // Sequence / class / state diagrams
  mainBkg: theme.nodeFill,
  errorBkgColor: theme.nodeFill,
  errorTextColor: theme.textColor,
  // Misc
  noteBkgColor: theme.clusterFill,
  noteBorderColor: theme.nodeStroke,
  noteTextColor: theme.textColor,
  // ER diagrams render table-like attribute rows with dedicated variables.
  entityBkg: theme.nodeFill,
  entityBorder: theme.nodeStroke,
  attributeBackgroundColorOdd: theme.nodeFill,
  attributeBackgroundColorEven: theme.clusterFill,
  attributeBorderColor: theme.nodeStroke,
  relationshipColor: theme.edgeStroke,
});

const buildConfig = (theme: MermaidTheme): Record<string, unknown> => ({
  theme: "base",
  themeVariables: buildThemeVariables(theme),
  flowchart: {
    htmlLabels: true,
    curve: "basis",
  },
  securityLevel: "loose",
});

const findMermaid = (): MermaidLike | undefined => {
  const w = window as unknown as { mermaid?: MermaidLike };
  return w.mermaid;
};

const normalizeOptionsFromSettings = (
  settings: SlickMermaidSettings,
): MermaidNormalizeOptions => ({
  normalizeFlowchartLabels: settings.compatNormalizeFlowchartLabels,
  normalizeEscapedNewlines: settings.compatNormalizeEscapedNewlines,
});

/**
 * Patch mermaid.initialize so every call merges our theme. Returns a cleanup
 * function that restores the original initialize.
 */
export const patchMermaid = (
  getTheme: () => MermaidTheme,
  getSettings: () => SlickMermaidSettings,
): (() => void) => {
  const mermaid = findMermaid();
  if (!mermaid) {
    console.warn("[slick-mermaid] window.mermaid not available; skipping hook");
    return () => undefined;
  }
  if (mermaid.__slickMermaidPatched) {
    // Re-apply with current theme even if already patched (e.g. plugin reload)
    mermaid.initialize(buildConfig(getTheme()));
    return () => undefined;
  }

  const original = mermaid.initialize.bind(mermaid);
  const originalRender = mermaid.render.bind(mermaid);
  mermaid.__slickMermaidPatched = true;

  const merged = (incoming: Record<string, unknown>): void => {
    const theme = getTheme();
    const themed = buildConfig(theme);
    const themeVariables = {
      ...((incoming.themeVariables as Record<string, string>) ?? {}),
      ...themed.themeVariables as Record<string, string>,
    };
    const finalConfig = { ...incoming, ...themed, themeVariables };
    mermaid.__slickMermaidLastConfig = finalConfig;
    original(finalConfig);
  };

  mermaid.initialize = merged as MermaidLike["initialize"];
  mermaid.render = ((id, source, container) =>
    originalRender(
      id,
      normalizeMermaidSource(source, normalizeOptionsFromSettings(getSettings())),
      container,
    )) as MermaidLike["render"];

  // Force an immediate re-init so any future renders pick up our theme.
  merged({});

  return () => {
    if (mermaid.initialize === merged) {
      mermaid.initialize = original;
    }
    mermaid.render = originalRender;
    mermaid.__slickMermaidPatched = false;
  };
};

export const loadAndPatchMermaid = async (
  getTheme: () => MermaidTheme,
  getSettings: () => SlickMermaidSettings,
): Promise<() => void> => {
  await loadMermaid();
  return patchMermaid(getTheme, getSettings);
};
