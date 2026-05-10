import { App, Modal, setIcon } from "obsidian";
import { applyTheme } from "./svg-theme";
import { MermaidTheme } from "./theme";

const FS_BUTTON_CLASS = "slick-mermaid-fs-btn";
const FS_BUTTON_FLAG = "data-slick-fs";

interface DiagramSize {
  width: number;
  height: number;
}

interface PanZoomState {
  scale: number;
  x: number;
  y: number;
}

const MIN_SCALE = 0.25;
const MAX_SCALE = 6;
const INITIAL_ZOOM_BOOST = 1.45;
const MIN_INITIAL_SCALE = 1;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const readDiagramSize = (svg: SVGSVGElement): DiagramSize => {
  const viewBox = svg.viewBox.baseVal;
  if (viewBox.width > 0 && viewBox.height > 0) {
    return { width: viewBox.width, height: viewBox.height };
  }

  const width = Number.parseFloat(svg.getAttribute("width") ?? "");
  const height = Number.parseFloat(svg.getAttribute("height") ?? "");
  return {
    width: Number.isFinite(width) && width > 0 ? width : 800,
    height: Number.isFinite(height) && height > 0 ? height : 500,
  };
};

const applyTransform = (svg: SVGSVGElement, state: PanZoomState): void => {
  svg.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
};

class FullscreenSvgModal extends Modal {
  private readonly source: SVGSVGElement;
  private readonly theme: MermaidTheme;
  private cleanupPanZoom?: () => void;

  constructor(app: App, source: SVGSVGElement, theme: MermaidTheme) {
    super(app);
    this.source = source;
    this.theme = theme;
  }

  onOpen(): void {
    this.modalEl.addClass("slick-mermaid-fs-modal");
    this.contentEl.empty();

    const header = this.contentEl.createDiv({ cls: "slick-mermaid-fs-header" });
    header.createDiv({
      cls: "slick-mermaid-fs-title",
      text: "Mermaid diagram",
    });
    header.createDiv({
      cls: "slick-mermaid-fs-hint",
      text: "Drag to pan | Wheel to zoom | Esc to close",
    });

    const stage = this.contentEl.createDiv({ cls: "slick-mermaid-fs-stage" });
    const clone = this.source.cloneNode(true) as SVGSVGElement;
    const size = readDiagramSize(clone);

    clone.setAttribute("width", String(size.width));
    clone.setAttribute("height", String(size.height));
    clone.setAttribute("preserveAspectRatio", "xMidYMid meet");
    clone.style.width = `${size.width}px`;
    clone.style.height = `${size.height}px`;
    clone.style.maxWidth = "none";
    clone.style.maxHeight = "none";

    stage.appendChild(clone);
    applyTheme(clone, this.theme);
    this.cleanupPanZoom = this.schedulePanZoomSetup(stage, clone, size);
  }

  onClose(): void {
    this.cleanupPanZoom?.();
    this.contentEl.empty();
  }

  private schedulePanZoomSetup(
    stage: HTMLElement,
    svg: SVGSVGElement,
    size: DiagramSize,
  ): () => void {
    let cleanup: (() => void) | undefined;
    let disposed = false;
    let attempts = 0;
    let frame = 0;
    let timeout = 0;

    const init = (): void => {
      if (disposed || cleanup) return;
      if (!this.contentEl.contains(stage)) return;
      attempts += 1;

      if (stage.clientWidth === 0 || stage.clientHeight === 0) {
        if (attempts < 10) {
          frame = window.requestAnimationFrame(init);
          timeout = window.setTimeout(init, 50);
        }
        return;
      }

      cleanup = this.setupPanZoom(stage, svg, size);
    };

    frame = window.requestAnimationFrame(init);
    timeout = window.setTimeout(init, 50);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      cleanup?.();
    };
  }

  private setupPanZoom(
    stage: HTMLElement,
    svg: SVGSVGElement,
    size: DiagramSize,
  ): () => void {
    const stageRect = stage.getBoundingClientRect();
    const fitScale = Math.min(
      stageRect.width / size.width,
      stageRect.height / size.height,
    );
    const state: PanZoomState = {
      scale: clamp(
        Math.max(fitScale * INITIAL_ZOOM_BOOST, MIN_INITIAL_SCALE),
        MIN_SCALE,
        MAX_SCALE,
      ),
      x: 0,
      y: 0,
    };

    const centerDiagram = (): void => {
      state.x = (stage.clientWidth - size.width * state.scale) / 2;
      state.y = (stage.clientHeight - size.height * state.scale) / 2;
      applyTransform(svg, state);
    };

    centerDiagram();

    let activePointerId: number | null = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let startX = 0;
    let startY = 0;

    const onPointerDown = (event: PointerEvent): void => {
      if (event.button !== 0) return;
      activePointerId = event.pointerId;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      startX = state.x;
      startY = state.y;
      stage.addClass("is-panning");
      stage.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent): void => {
      if (activePointerId !== event.pointerId) return;
      state.x = startX + event.clientX - dragStartX;
      state.y = startY + event.clientY - dragStartY;
      applyTransform(svg, state);
    };

    const stopPan = (event: PointerEvent): void => {
      if (activePointerId !== event.pointerId) return;
      activePointerId = null;
      stage.removeClass("is-panning");
      if (stage.hasPointerCapture(event.pointerId)) {
        stage.releasePointerCapture(event.pointerId);
      }
    };

    const onWheel = (event: WheelEvent): void => {
      event.preventDefault();
      const rect = stage.getBoundingClientRect();
      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;
      const diagramX = (pointerX - state.x) / state.scale;
      const diagramY = (pointerY - state.y) / state.scale;
      const zoomDelta = Math.exp(-event.deltaY * 0.0015);
      const nextScale = clamp(state.scale * zoomDelta, MIN_SCALE, MAX_SCALE);

      state.scale = nextScale;
      state.x = pointerX - diagramX * nextScale;
      state.y = pointerY - diagramY * nextScale;
      applyTransform(svg, state);
    };

    const onDblClick = (event: MouseEvent): void => {
      event.preventDefault();
      centerDiagram();
    };

    stage.addEventListener("pointerdown", onPointerDown);
    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerup", stopPan);
    stage.addEventListener("pointercancel", stopPan);
    stage.addEventListener("wheel", onWheel, { passive: false });
    stage.addEventListener("dblclick", onDblClick);

    return () => {
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerup", stopPan);
      stage.removeEventListener("pointercancel", stopPan);
      stage.removeEventListener("wheel", onWheel);
      stage.removeEventListener("dblclick", onDblClick);
    };
  }
}

export const mountFullscreenButton = (
  app: App,
  container: HTMLElement,
  getTheme: () => MermaidTheme,
): void => {
  if (container.getAttribute(FS_BUTTON_FLAG) === "true") return;
  container.setAttribute(FS_BUTTON_FLAG, "true");
  container.addClass("slick-mermaid-host");

  const button = container.createEl("button", { cls: FS_BUTTON_CLASS });
  button.setAttr("aria-label", "Open larger Mermaid diagram");
  button.setAttr("title", "Open larger diagram");
  setIcon(button, "expand");

  const open = (): void => {
    const svg = container.querySelector<SVGSVGElement>("svg");
    if (!svg) return;
    new FullscreenSvgModal(app, svg, getTheme()).open();
  };

  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    open();
  });

  container.addEventListener("dblclick", (event) => {
    event.preventDefault();
    event.stopPropagation();
    open();
  });
};
