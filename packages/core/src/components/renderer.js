/**
 * The default renderer.
 *
 * Owns the DOM and nothing else. All tour behaviour — lifecycle, navigation,
 * target resolution, events — lives in the engine, which calls into this
 * module through the renderer contract.
 *
 * Responsibilities:
 *   - create the tour root and append it to the document
 *   - build the correct surface (anchored tooltip or centred modal) per step
 *   - drive positioning on present and on every subsequent layout change
 *   - install keyboard handling, the live region and focus management
 *   - release every one of those on unmount
 */

import { CLS } from "../constants.js";
import { createOverlay } from "./overlay/index.js";
import { createSpotlight } from "./spotlight/index.js";
import { createTooltip } from "./tooltip/index.js";
import { createModal } from "./modal/index.js";
import { createPositionController } from "../positioning/position-controller.js";
import {
  createAnnouncer,
  createFocusManager,
  createKeyboardController,
} from "../accessibility/index.js";
import { isAnchored } from "../configuration/normalize.js";
import { nextFrame } from "../utilities/dom.js";
import { resolveText } from "./content/index.js";

const ARROW_SIZE = { x: 10, y: 6 };

/**
 * @param {object} config normalized tour configuration
 */
export function createUiRenderer(config) {
  let liveConfig = config;
  let stack = null;
  /** Control callbacks supplied by the engine once the instance exists. */
  let controls = null;

  let root = null;
  let overlay = null;
  let spotlight = null;
  let surface = null;
  let positioner = null;
  let announcer = null;
  let focusManager = null;
  let currentTarget = null;
  let currentContext = null;

  // --------------------------------------------------------------- lifecycle

  function mount(payload, { stack: disposalStack }) {
    stack = disposalStack;

    root = createRootElement();
    document.body.append(root);
    stack.addNode(root);

    applyTheme(liveConfig);
    root.dataset.tatAnimation = liveConfig.animation;

    overlay = createOverlay({
      clickable: Boolean(liveConfig.closeOnOverlayClick),
      onClick: () => controls?.stop("overlay"),
    });
    root.append(overlay.element);

    spotlight = createSpotlight();
    root.append(spotlight.element);

    focusManager = createFocusManager({ document, container: root });
    focusManager.rememberOrigin();

    announcer = liveConfig.announce ? createAnnouncer({ root, stack }) : null;

    positioner = createPositionController({
      getTarget: () => currentTarget,
      onPosition: applyPosition,
      stack,
    });

    createKeyboardController({
      document,
      stack,
      focusManager,
      getSurface: () => surface,
      config: liveConfig,
      handlers: {
        onClose: () => controls?.stop("dismissed"),
        onGoToStart: () => controls?.previous(),
        onGoToEnd: () => controls?.next(),
      },
    });

    nextFrame(() => overlay?.show());
  }

  function createRootElement() {
    const element = document.createElement("div");
    element.className = [CLS.root, liveConfig.classes.root].filter(Boolean).join(" ");
    element.setAttribute("data-tat-tour", liveConfig.tourId);
    element.setAttribute("data-tat-state", "running");
    element.setAttribute("role", "presentation");
    element.style.setProperty("--tat-z", String(liveConfig.zIndex));
    return element;
  }

  function applyTheme(cfg) {
    const resolved = cfg.theme === "system" ? "light" : cfg.theme;
    root.dataset.tatTheme = resolved;
    root.classList.toggle(CLS.themeLight, resolved === "light");
    root.classList.toggle(CLS.themeDark, resolved === "dark");
  }

  // ---------------------------------------------------------------- present

  function present(context) {
    liveConfig = context.config;
    currentContext = context;
    currentTarget = context.target;

    teardownSurface();

    root.dataset.tatState = "running";
    root.dataset.tatTargetInteractive = String(Boolean(liveConfig.allowTargetInteraction));
    root.dataset.tatAnimation = liveConfig.animation;
    applyTheme(liveConfig);

    // With target interaction enabled the overlay must not swallow clicks aimed
    // at the highlighted element, so it becomes click-through.
    overlay.element.style.pointerEvents =
      liveConfig.closeOnOverlayClick && !liveConfig.allowTargetInteraction ? "auto" : "none";

    const anchored = Boolean(context.target) && isAnchored(context.step);

    surface = anchored
      ? createTooltip({
          context,
          config: liveConfig,
          handlers: uiHandlers(),
          steps: context.steps ?? [],
        })
      : createModal({
          dialog: {
            title: context.step.title,
            content: context.step.content,
            icon: context.step.icon,
            actions: context.step.actions,
            unsafeContent: context.step.unsafeContent,
          },
          context,
          config: liveConfig,
          handlers: uiHandlers(),
          navigation: context.navigation,
          steps: context.steps ?? [],
        });

    surface.element.classList.add("tat--entering");
    root.append(surface.element);

    if (liveConfig.spotlight && context.spotlight && context.target) {
      moveSpotlight();
      spotlight.show({ pulse: liveConfig.animation === "smooth" });
    } else {
      spotlight.hide();
    }

    if (liveConfig.scrollIntoView && context.target) {
      positioner.scrollIntoView();
      positioner.trackScrollContainers(context.target);
    }

    positioner.setRequest({
      placement: context.step.placement ?? liveConfig.placement,
      offset: context.step.offset ?? liveConfig.offset,
      tooltipElement: surface.element,
      tooltipSize: { width: liveConfig.tooltipWidth, height: 160 },
      arrowSize: ARROW_SIZE,
    });

    positioner.observeTarget(context.target);
    positioner.observeTooltip(surface.element);
    positioner.update();

    focusManager.focusInto(surface.focusables(), { modal: !anchored });
    if (!anchored) focusManager.trapIn(surface.element);

    if (liveConfig.announce && announcer) {
      announcer.announceStep({
        position: context.position,
        total: context.total,
        labels: liveConfig.labels,
        title: resolveText(context.step.title, context),
        content: resolveText(context.step.content, context),
      });
    }
  }

  function uiHandlers() {
    return {
      onNext: () => controls?.next(),
      onPrevious: () => controls?.previous(),
      onSkip: () => controls?.skip("user"),
      onClose: () => controls?.stop("dismissed"),
      onAction: () => {},
    };
  }

  function moveSpotlight() {
    if (!currentTarget) return;
    const step = currentContext?.step ?? {};
    spotlight.moveTo(currentTarget.getBoundingClientRect(), {
      padding: step.spotlightPadding ?? liveConfig.spotlightPadding,
      radius: step.spotlightRadius ?? liveConfig.spotlightRadius,
    });
  }

  function applyPosition(solution) {
    surface?.place?.(solution);
    if (solution.side !== "center" && currentTarget) moveSpotlight();
  }

  function teardownSurface() {
    surface?.destroy();
    surface = null;
    spotlight?.hide();
  }

  // ------------------------------------------------------------------ misc

  function refresh(context) {
    present(context);
  }

  function setTheme(theme) {
    liveConfig = { ...liveConfig, theme };
    if (root) applyTheme(liveConfig);
  }

  function setPaused(paused) {
    if (!root) return;
    root.dataset.tatState = paused ? "paused" : "running";
    if (paused) {
      spotlight?.hide();
      // Focus returns to the page rather than being trapped in a hidden tour.
      focusManager?.restore();
    }
  }

  function unmount() {
    teardownSurface();
    announcer?.destroy();
    announcer = null;
    focusManager?.restore();
    focusManager = null;
    positioner = null;
    overlay?.destroy();
    overlay = null;
    spotlight?.destroy();
    spotlight = null;
    root?.remove();
    root = null;
    currentTarget = null;
    currentContext = null;
    controls = null;
    stack = null;
  }

  return {
    mount,
    present,
    refresh,
    setTheme,
    setPaused,
    unmount,

    /** Injected by the engine so control buttons can drive navigation. */
    __bindControlHandlers(value) {
      controls = value;
    },

    /** Test seams used by the accessibility and cleanup suites. */
    __surface: () => surface,
    __root: () => root,
    __focusables: () => surface?.focusables() ?? [],
    __trapped: () => Boolean(focusManager?.trapped),
  };
}
