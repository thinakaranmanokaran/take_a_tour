/**
 * Take a Tour — public type declarations.
 *
 * Hand-written rather than generated: the implementation is plain JavaScript,
 * but TypeScript consumers should still get autocomplete and typed events.
 *
 * Verified against the real API by `tests/types/consumer.ts`, which is compiled
 * with `tsc --noEmit` as part of the release check.
 */

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export type Theme = "light" | "dark" | "system";

export type Animation = "none" | "instant" | "smooth";

export type Placement =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end"
  | "right"
  | "right-start"
  | "right-end"
  | "center";

export type Align = "start" | "center" | "end";

/** What to do when a step's target cannot be found. */
export type MissingTargetStrategy = "error" | "skip" | "wait" | "fallback";

/** What happens when another tour is already active in the document. */
export type ConcurrencyPolicy = "pause-previous" | "stop-previous" | "reject";

export type TourState =
  "idle" | "running" | "paused" | "completed" | "skipped" | "stopped" | "destroyed";

export type LifecycleEvent =
  | "start"
  | "beforeStep"
  | "stepChange"
  | "afterStep"
  | "pause"
  | "resume"
  | "skip"
  | "complete"
  | "stop"
  | "error"
  | "destroy";

/** All thirteen placements, for runtime validation. */
export declare const PLACEMENTS: readonly Placement[];

export declare const THEMES: readonly Theme[];
export declare const ANIMATIONS: readonly Animation[];
export declare const MISSING_TARGET_STRATEGIES: readonly MissingTargetStrategy[];
export declare const CONCURRENCY_POLICIES: readonly ConcurrencyPolicy[];
export declare const STATES: Record<string, TourState>;
export declare const EVENTS: Record<string, LifecycleEvent>;

/** Fully-resolved configuration, as returned by `tour.getConfig()`. */
export interface ResolvedConfig {
  readonly tourId: string;
  readonly steps: readonly TourStep[];
  readonly theme: Theme;
  readonly animation: Animation;
  readonly spotlight: boolean;
  readonly spotlightPadding: number;
  readonly spotlightRadius: number;
  readonly showProgress: boolean;
  readonly showStepCounter: boolean;
  readonly showCloseButton: boolean;
  readonly keyboardNavigation: boolean;
  readonly closeOnEscape: boolean;
  readonly closeOnOverlayClick: boolean;
  readonly allowTargetInteraction: boolean;
  readonly scrollIntoView: boolean;
  readonly waitForTarget: boolean;
  readonly tooltipWidth: number;
  readonly zIndex: number;
  readonly placement: Placement;
  readonly offset: { readonly x: number; readonly y: number };
  readonly loop: boolean;
  readonly announce: boolean;
  readonly debug: boolean;
  readonly unsafeHTML: boolean;
  readonly concurrency: ConcurrencyPolicy;
  readonly target: {
    readonly missing: MissingTargetStrategy;
    readonly timeout: number;
    readonly occurrence: "error" | "first";
  };
  readonly persistence: {
    readonly enabled: boolean;
    readonly adapter: "memory" | "localStorage" | CustomPersistenceAdapter;
    readonly key: string;
    readonly resume: boolean;
    readonly resetOnComplete: boolean;
  };
  readonly labels: Readonly<Record<string, string>>;
  readonly classes: Readonly<Record<string, string>>;
}

/** A storage backend the host application supplies. */
export interface CustomPersistenceAdapter {
  name?: string;
  get(key: string): unknown;
  set(key: string, value: unknown): void | boolean;
  remove(key: string): void;
}

export interface CustomAction {
  label: string;
  onClick?: (event: Event) => unknown;
  primary?: boolean;
}

/** How a step finds its host element. */
export interface StepTarget {
  /**
   * Explicit CSS selector, used instead of a `data-tour-id` identifier.
   * Never interpolated from tour data.
   */
  selector?: string;
  /** A specific element, for targets inside a shadow root or a portal. */
  element?: Element;
  /**
   * How to resolve duplicate matches.
   * Omit (or use `"error"`) to have duplicates reported rather than guessed.
   */
  occurrence?: "error" | "first" | number;
  /** Overrides the tour-level missing-target strategy for this step. */
  missing?: MissingTargetStrategy;
}

export interface TourStep {
  /**
   * Target identifier, matched **exactly** against `data-tour-id`.
   * Dots are ordinary characters: `home.cta` is one identifier, not a path.
   */
  tourId?: string;
  title?: string | ((context: RenderContext) => string);
  content?: string | ((context: RenderContext) => string);
  placement?: Placement;
  align?: Align;
  offset?: { x: number; y: number };
  theme?: Theme;
  target?: StepTarget;
  /** Include this step only when the predicate resolves truthy. May be async. */
  when?: boolean | (() => boolean | Promise<boolean>);
  /** Allows `goTo()` to jump past this step. */
  optional?: boolean;
  spotlight?: boolean;
  spotlightPadding?: number;
  spotlightRadius?: number;
  scrollIntoView?: boolean;
  waitForTarget?: boolean;
  /** Milliseconds to wait for a dynamically rendered target. */
  timeout?: number;
  /** Marks a step with no host element. Implied by `placement: "center"`. */
  centered?: boolean;
  icon?: string;
  actions?: CustomAction[];
  /**
   * Author-authored markup. Rendered only when the tour sets
   * `unsafeHTML: true`. Never pass user input or remote data here.
   */
  unsafeContent?: string;
}

export interface DialogConfig {
  title?: string | ((context: RenderContext) => string);
  content?: string | ((context: RenderContext) => string);
  icon?: string;
  actions?: CustomAction[];
  unsafeContent?: string;
}

/** Context passed to function-valued step fields. */
export interface RenderContext {
  readonly tourId: string;
  readonly step: TourStep;
  readonly position: number;
  readonly index: number;
  readonly total: number;
  readonly target: Element | null;
}

export interface TourEventMap {
  start: { tour: Tour; step: TourStep; index: number; stepIndex: number; total: number };
  beforeStep: {
    tour: Tour;
    step: TourStep;
    index: number;
    stepIndex: number;
    previousIndex: number;
    initial: boolean;
  };
  stepChange: {
    tour: Tour;
    step: TourStep;
    index: number;
    stepIndex: number;
    previousIndex: number;
    total: number;
  };
  afterStep: { tour: Tour; step: TourStep; index: number; stepIndex: number; total: number };
  pause: { tour: Tour; reason: string };
  resume: { tour: Tour };
  skip: { tour: Tour; reason: string };
  complete: { tour: Tour };
  stop: { tour: Tour; reason: string };
  error: { tour: Tour; error: Error };
  destroy: { tour: Tour };
}

export interface LifecycleCallbacks {
  start?(payload: TourEventMap["start"]): void | Promise<void>;
  beforeStep?(payload: TourEventMap["beforeStep"]): void | Promise<void>;
  stepChange?(payload: TourEventMap["stepChange"]): void | Promise<void>;
  afterStep?(payload: TourEventMap["afterStep"]): void | Promise<void>;
  pause?(payload: TourEventMap["pause"]): void | Promise<void>;
  resume?(payload: TourEventMap["resume"]): void | Promise<void>;
  skip?(payload: TourEventMap["skip"]): void | Promise<void>;
  complete?(payload: TourEventMap["complete"]): void | Promise<void>;
  stop?(payload: TourEventMap["stop"]): void | Promise<void>;
  error?(payload: TourEventMap["error"]): void | Promise<void>;
  destroy?(payload: TourEventMap["destroy"]): void | Promise<void>;
}

export interface Labels {
  previous?: string;
  next?: string;
  done?: string;
  skip?: string;
  close?: string;
  /** Supports the `{current}` and `{total}` placeholders. */
  progress?: string;
  stepLabel?: string;
  [key: string]: string | undefined;
}

export interface TourConfig {
  /** Unique identity for this tour. Distinct from any step target identifier. */
  tourId: string;
  steps: TourStep[];
  startAt?: number | string;
  loop?: boolean;
  theme?: Theme;
  animation?: Animation;
  spotlight?: boolean;
  spotlightPadding?: number;
  spotlightRadius?: number;
  showProgress?: boolean;
  showStepCounter?: boolean;
  showCloseButton?: boolean;
  keyboardNavigation?: boolean;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  allowTargetInteraction?: boolean;
  scrollIntoView?: boolean;
  waitForTarget?: boolean;
  tooltipWidth?: number;
  zIndex?: number;
  placement?: Placement;
  offset?: { x: number; y: number };
  announce?: boolean;
  debug?: boolean;
  /**
   * Enables parsing of author-supplied `unsafeContent` markup.
   * Equivalent in risk to `innerHTML`. Defaults to `false`.
   */
  unsafeHTML?: boolean;
  concurrency?: ConcurrencyPolicy;
  target?: {
    missing?: MissingTargetStrategy;
    timeout?: number;
    occurrence?: "error" | "first";
  };
  persistence?: {
    enabled?: boolean;
    adapter?: "memory" | "localStorage" | CustomPersistenceAdapter;
    key?: string;
    resume?: boolean;
    resetOnComplete?: boolean;
  };
  labels?: Labels;
  /** Extra class names merged onto the library's own components. */
  classes?: Record<string, string | null>;
  intro?: DialogConfig | null;
  completion?: DialogConfig | null;
  on?: LifecycleCallbacks;
}

/** Configuration accepted by `update()`. `tourId` cannot change. */
export type TourConfigPatch = Partial<Omit<TourConfig, "tourId">>;

// ---------------------------------------------------------------------------
// Instance
// ---------------------------------------------------------------------------

export interface Tour {
  readonly tourId: string;
  readonly getState: () => TourState;
  readonly isActive: () => boolean;
  readonly isPaused: () => boolean;

  start(options?: { ignorePersistence?: boolean }): Promise<Tour>;
  pause(reason?: string): Tour;
  resume(): Tour;
  stop(reason?: string): Tour;
  skip(reason?: string): Tour;
  complete(): Tour;
  destroy(): Tour;

  next(): Promise<Tour>;
  previous(): Promise<Tour>;
  goTo(stepId: string): Promise<Tour>;

  getCurrentStep(): TourStep | null;
  getCurrentStepIndex(): number;
  getCurrentStepSourceIndex(): number;
  getSteps(): TourStep[];
  getConfig(): ResolvedConfig;

  update(patch: TourConfigPatch): Tour;
  setTheme(theme: Theme): Tour;
  resetProgress(): void;

  on<E extends LifecycleEvent>(event: E, handler: (payload: TourEventMap[E]) => void): () => void;
  once<E extends LifecycleEvent>(event: E, handler: (payload: TourEventMap[E]) => void): () => void;
  off<E extends LifecycleEvent>(event: E, handler: (payload: TourEventMap[E]) => void): void;
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

export declare const VERSION: string;

/**
 * Create a tour.
 *
 * @throws {TourConfigError} when the configuration is invalid.
 */
export declare function createTour(config: TourConfig): Tour;

/** Set library-wide defaults. Per-tour configuration always wins. */
export declare function configureTour(options: { defaults?: Partial<TourConfig> }): {
  defaults: Partial<TourConfig>;
};

export declare function getTour(tourId: string): Tour | undefined;
export declare function hasTour(tourId: string): boolean;
export declare function listTours(): Tour[];
export declare function destroyAllTours(): void;

export declare const DEFAULT_CONFIG: Readonly<Record<string, unknown>>;

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export declare class TakeATourError extends Error {
  code: string;
}

export declare class TourConfigError extends TakeATourError {
  path?: string;
  expected?: unknown;
  received?: unknown;
}

export declare class TargetError extends TakeATourError {
  reason:
    "missing" | "ambiguous" | "invalid-selector" | "detached" | "hidden" | "timeout" | "aborted";
  targetId?: string;
  matches?: Element[];
  timeout?: number;
}

export declare class TransitionError extends TakeATourError {
  from?: TourState;
  to?: TourState;
  method?: string;
}

export declare class StorageError extends TakeATourError {
  adapter?: string;
}
