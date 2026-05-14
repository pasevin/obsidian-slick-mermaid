import { App, Plugin, PluginSettingTab, Setting } from "obsidian";

export interface SlickMermaidSettings {
  nodeRadiusEnabled: boolean;
  nodeRadius: number;
}

export interface SlickMermaidSettingsController {
  getSettings(): SlickMermaidSettings;
  updateSettings(settings: Partial<SlickMermaidSettings>): Promise<void>;
}

export const NODE_RADIUS_MIN = 0;
export const NODE_RADIUS_MAX = 40;
export const NODE_RADIUS_STEP = 1;

export const DEFAULT_SETTINGS: SlickMermaidSettings = {
  nodeRadiusEnabled: true,
  nodeRadius: 8,
};

const normalizeNodeRadius = (value: unknown): number => {
  const radius = Number(value);
  if (!Number.isFinite(radius)) return DEFAULT_SETTINGS.nodeRadius;
  return Math.min(NODE_RADIUS_MAX, Math.max(NODE_RADIUS_MIN, Math.round(radius)));
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
  };
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
      .setName("Node radius style")
      .setDesc("Apply an opinionated corner radius to rectangular Mermaid nodes.")
      .addToggle((toggle) => {
        toggle
          .setValue(settings.nodeRadiusEnabled)
          .onChange(async (value) => {
            await this.controller.updateSettings({ nodeRadiusEnabled: value });
            this.display();
          });
      });

    if (!settings.nodeRadiusEnabled) return;

    const radiusSetting = new Setting(containerEl)
      .setName("Node radius")
      .setDesc("Adjust the corner radius applied to rectangular Mermaid nodes.");

    radiusSetting.addSlider((slider) => {
      slider
        .setLimits(NODE_RADIUS_MIN, NODE_RADIUS_MAX, NODE_RADIUS_STEP)
        .setValue(settings.nodeRadius)
        .setDynamicTooltip()
        .onChange(async (value) => {
          radiusValue.setText(`${value}px`);
          await this.controller.updateSettings({ nodeRadius: value });
        });
    });

    const radiusValue = radiusSetting.controlEl.createSpan({
      text: `${settings.nodeRadius}px`,
    });
    radiusValue.addClass("setting-item-description");
  }
}
