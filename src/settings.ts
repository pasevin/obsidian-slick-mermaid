import { App, Plugin, PluginSettingTab, Setting } from "obsidian";

export type ExpandButtonVisibility = "on-hover" | "always";

export interface SlickMermaidSettings {
  nodeRadiusEnabled: boolean;
  nodeRadius: number;
  /** 50 = subtler differentiation, 100 = default, 150 = stronger */
  surfaceContrast: number;
  edgeLabelPadding: number;
  edgeLabelCornerRadius: number;
  expandButtonVisibility: ExpandButtonVisibility;
  inlineDoubleClickOpensFullscreen: boolean;
  compatNormalizeFlowchartLabels: boolean;
  compatNormalizeEscapedNewlines: boolean;
  /** When true, append strong !important overrides (default Slick look). */
  neutralizeAuthorStyles: boolean;
}

export interface SlickMermaidSettingsController {
  getSettings(): SlickMermaidSettings;
  updateSettings(settings: Partial<SlickMermaidSettings>): Promise<void>;
  resetSettingsToDefaults(): Promise<void>;
}

export const NODE_RADIUS_MIN = 0;
export const NODE_RADIUS_MAX = 40;
export const NODE_RADIUS_STEP = 1;

export const SURFACE_CONTRAST_MIN = 50;
export const SURFACE_CONTRAST_MAX = 150;
export const SURFACE_CONTRAST_STEP = 5;

export const EDGE_LABEL_PADDING_MIN = 0;
export const EDGE_LABEL_PADDING_MAX = 16;
export const EDGE_LABEL_PADDING_STEP = 1;

export const EDGE_LABEL_RADIUS_MIN = 0;
export const EDGE_LABEL_RADIUS_MAX = 16;
export const EDGE_LABEL_RADIUS_STEP = 1;

export const DEFAULT_SETTINGS: SlickMermaidSettings = {
  nodeRadiusEnabled: true,
  nodeRadius: 8,
  surfaceContrast: 100,
  edgeLabelPadding: 8,
  edgeLabelCornerRadius: 6,
  expandButtonVisibility: "on-hover",
  inlineDoubleClickOpensFullscreen: true,
  compatNormalizeFlowchartLabels: true,
  compatNormalizeEscapedNewlines: true,
  neutralizeAuthorStyles: true,
};

const normalizeNodeRadius = (value: unknown): number => {
  const radius = Number(value);
  if (!Number.isFinite(radius)) return DEFAULT_SETTINGS.nodeRadius;
  return Math.min(NODE_RADIUS_MAX, Math.max(NODE_RADIUS_MIN, Math.round(radius)));
};

const normalizeInt = (
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
};

const normalizeExpandVisibility = (value: unknown): ExpandButtonVisibility => {
  switch (value) {
    case "always":
      return "always";
    case "on-hover":
      return "on-hover";
    default:
      return DEFAULT_SETTINGS.expandButtonVisibility;
  }
};

export const normalizeSettings = (
  value: (Partial<SlickMermaidSettings> & { nodeRadiusStyle?: string }) | null | undefined,
): SlickMermaidSettings => {
  const legacyEnabled = value?.nodeRadiusStyle !== undefined
    ? value.nodeRadiusStyle !== "off"
    : DEFAULT_SETTINGS.nodeRadiusEnabled;

  return {
    nodeRadiusEnabled: typeof value?.nodeRadiusEnabled === "boolean"
      ? value.nodeRadiusEnabled
      : legacyEnabled,
    nodeRadius: normalizeNodeRadius(value?.nodeRadius),
    surfaceContrast: normalizeInt(
      value?.surfaceContrast,
      DEFAULT_SETTINGS.surfaceContrast,
      SURFACE_CONTRAST_MIN,
      SURFACE_CONTRAST_MAX,
    ),
    edgeLabelPadding: normalizeInt(
      value?.edgeLabelPadding,
      DEFAULT_SETTINGS.edgeLabelPadding,
      EDGE_LABEL_PADDING_MIN,
      EDGE_LABEL_PADDING_MAX,
    ),
    edgeLabelCornerRadius: normalizeInt(
      value?.edgeLabelCornerRadius,
      DEFAULT_SETTINGS.edgeLabelCornerRadius,
      EDGE_LABEL_RADIUS_MIN,
      EDGE_LABEL_RADIUS_MAX,
    ),
    expandButtonVisibility: normalizeExpandVisibility(value?.expandButtonVisibility),
    inlineDoubleClickOpensFullscreen: typeof value?.inlineDoubleClickOpensFullscreen === "boolean"
      ? value.inlineDoubleClickOpensFullscreen
      : DEFAULT_SETTINGS.inlineDoubleClickOpensFullscreen,
    compatNormalizeFlowchartLabels: typeof value?.compatNormalizeFlowchartLabels === "boolean"
      ? value.compatNormalizeFlowchartLabels
      : DEFAULT_SETTINGS.compatNormalizeFlowchartLabels,
    compatNormalizeEscapedNewlines: typeof value?.compatNormalizeEscapedNewlines === "boolean"
      ? value.compatNormalizeEscapedNewlines
      : DEFAULT_SETTINGS.compatNormalizeEscapedNewlines,
    neutralizeAuthorStyles: typeof value?.neutralizeAuthorStyles === "boolean"
      ? value.neutralizeAuthorStyles
      : DEFAULT_SETTINGS.neutralizeAuthorStyles,
  };
};

const addSliderWithValue = (
  setting: Setting,
  value: number,
  limits: { min: number; max: number; step: number },
  format: (n: number) => string,
  onChange: (value: number) => Promise<void>,
): void => {
  setting.addSlider((slider) => {
    slider
      .setLimits(limits.min, limits.max, limits.step)
      .setValue(value)
      .setDynamicTooltip()
      .onChange(async (nextValue) => {
        valueEl.setText(format(nextValue));
        await onChange(nextValue);
      });
  });

  const valueEl = setting.controlEl.createSpan({ text: format(value) });
  valueEl.addClass("setting-item-description");
};

export class SlickMermaidSettingTab extends PluginSettingTab {
  private readonly controller: SlickMermaidSettingsController;

  constructor(
    app: App,
    plugin: Plugin,
    controller: SlickMermaidSettingsController,
  ) {
    super(app, plugin);
    this.controller = controller;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    const settings = this.controller.getSettings();

    containerEl.createEl("h2", { text: "Slick Mermaid" });

    new Setting(containerEl)
      .setName("Reset to defaults")
      .setDesc("Restore every Slick Mermaid option to its factory default.")
      .addButton((button) => {
        button.setButtonText("Reset").setWarning().onClick(async () => {
          await this.controller.resetSettingsToDefaults();
          this.display();
        });
      });

    /* ─── Appearance ─────────────────────────────────────────────────── */

    containerEl.createEl("h3", { text: "Appearance" });

    new Setting(containerEl)
      .setName("Node radius style")
      .setDesc("Apply an opinionated corner radius to rectangular Mermaid containers.")
      .addToggle((toggle) => {
        toggle
          .setValue(settings.nodeRadiusEnabled)
          .onChange(async (value) => {
            await this.controller.updateSettings({ nodeRadiusEnabled: value });
            this.display();
          });
      });

    if (settings.nodeRadiusEnabled) {
      addSliderWithValue(
        new Setting(containerEl)
          .setName("Node radius")
          .setDesc("Corner radius for nodes, subgraphs, and ER table cells."),
        settings.nodeRadius,
        { min: NODE_RADIUS_MIN, max: NODE_RADIUS_MAX, step: NODE_RADIUS_STEP },
        (v) => `${v}px`,
        (nodeRadius) => this.controller.updateSettings({ nodeRadius }),
      );
    }

    addSliderWithValue(
      new Setting(containerEl)
        .setName("Surface contrast")
        .setDesc(
          "How strongly nodes and clusters differ from the note background. Lower is flatter, higher is bolder.",
        ),
      settings.surfaceContrast,
      {
        min: SURFACE_CONTRAST_MIN,
        max: SURFACE_CONTRAST_MAX,
        step: SURFACE_CONTRAST_STEP,
      },
      (v) => `${v}%`,
      (surfaceContrast) => this.controller.updateSettings({ surfaceContrast }),
    );

    /* ─── Edge labels ────────────────────────────────────────────────── */

    containerEl.createEl("h3", { text: "Edge labels" });

    addSliderWithValue(
      new Setting(containerEl)
        .setName("Edge label padding")
        .setDesc("Extra space around connector label pills."),
      settings.edgeLabelPadding,
      {
        min: EDGE_LABEL_PADDING_MIN,
        max: EDGE_LABEL_PADDING_MAX,
        step: EDGE_LABEL_PADDING_STEP,
      },
      (v) => `${v}px`,
      (edgeLabelPadding) => this.controller.updateSettings({ edgeLabelPadding }),
    );

    addSliderWithValue(
      new Setting(containerEl)
        .setName("Edge label corner radius")
        .setDesc("Rounding on SVG/HTML edge label backgrounds."),
      settings.edgeLabelCornerRadius,
      {
        min: EDGE_LABEL_RADIUS_MIN,
        max: EDGE_LABEL_RADIUS_MAX,
        step: EDGE_LABEL_RADIUS_STEP,
      },
      (v) => `${v}px`,
      (edgeLabelCornerRadius) => this.controller.updateSettings({ edgeLabelCornerRadius }),
    );

    /* ─── Diagram chrome ───────────────────────────────────────────── */

    containerEl.createEl("h3", { text: "Diagram chrome" });

    new Setting(containerEl)
      .setName("Expand button")
      .setDesc("When to show the larger-view control on diagrams.")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("on-hover", "Show on hover / focus")
          .addOption("always", "Always visible")
          .setValue(settings.expandButtonVisibility)
          .onChange(async (value) => {
            const expandButtonVisibility: ExpandButtonVisibility = (() => {
              switch (value) {
                case "always":
                  return "always";
                case "on-hover":
                  return "on-hover";
                default:
                  return DEFAULT_SETTINGS.expandButtonVisibility;
              }
            })();
            await this.controller.updateSettings({ expandButtonVisibility });
          });
      });

    new Setting(containerEl)
      .setName("Double-click diagram opens fullscreen")
      .setDesc("Double-click the inline diagram (not the button) to open the viewer.")
      .addToggle((toggle) => {
        toggle
          .setValue(settings.inlineDoubleClickOpensFullscreen)
          .onChange(async (value) => {
            await this.controller.updateSettings({ inlineDoubleClickOpensFullscreen: value });
          });
      });

    /* ─── Compatibility ────────────────────────────────────────────── */

    containerEl.createEl("h3", { text: "Compatibility" });

    new Setting(containerEl)
      .setName("Normalize flowchart labels for Obsidian")
      .setDesc(
        "Quote square-bracket labels that contain parentheses so Obsidian's Mermaid parser accepts them.",
      )
      .addToggle((toggle) => {
        toggle
          .setValue(settings.compatNormalizeFlowchartLabels)
          .onChange(async (value) => {
            await this.controller.updateSettings({ compatNormalizeFlowchartLabels: value });
          });
      });

    new Setting(containerEl)
      .setName("Treat \\n as line breaks in labels")
      .setDesc("Turns escaped newlines inside labels into real breaks for multiline nodes and edge labels.")
      .addToggle((toggle) => {
        toggle
          .setValue(settings.compatNormalizeEscapedNewlines)
          .onChange(async (value) => {
            await this.controller.updateSettings({ compatNormalizeEscapedNewlines: value });
          });
      });

    new Setting(containerEl)
      .setName("Neutralize author style/class colors")
      .setDesc(
        "When on, style and classDef colors are overridden so the diagram matches your theme. Turn off to keep author-defined colors (less consistent theming).",
      )
      .addToggle((toggle) => {
        toggle
          .setValue(settings.neutralizeAuthorStyles)
          .onChange(async (value) => {
            await this.controller.updateSettings({ neutralizeAuthorStyles: value });
          });
      });
  }
}
