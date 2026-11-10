import { useEffect, useRef, useState } from "react";
import { useTour } from "../hooks/useTour.js";
import { describeEvent } from "../lib/tour-status.js";
import { DEFAULT_CSS, PRESETS, STARTER } from "./playground/playground-presets.js";

/**
 * Live playground.
 *
 * This island drives `@take-a-tour/core` — the actual workspace package — with
 * the JSON the visitor edits. There is no mock and no parallel implementation:
 * if the playground works, the library works.
 *
 * The DOM contract is load-bearing: `#config-input`, `#pg-start/next/prev/
 * restart/destroy`, `#pg-theme`, `#playground-status[data-variant]`,
 * `#preview .preview__nav`, the `play.*` tour ids and `window.playground` are
 * all asserted by `tests/browser/docs-playground.spec.js`.
 */
export default function Playground() {
  const tour = useTour();

  const [panel, setPanel] = useState("config");
  const [configText, setConfigText] = useState(STARTER);
  const [cssText, setCssText] = useState(DEFAULT_CSS);
  const [themeChoice, setThemeChoice] = useState("system");
  const [preset, setPreset] = useState("starter");
  const [status, setStatus] = useState({ text: "Ready.", variant: "ok" });

  // Fresh values for `window.playground`, which is read outside React. Kept in
  // refs so the imperative API never captures stale state.
  const stateRef = useRef("idle");
  const stepIndexRef = useRef(-1);
  const startRef = useRef(null);

  useEffect(() => {
    stateRef.current = tour.state;
    stepIndexRef.current = tour.stepIndex;
    startRef.current = startPlayground;
  });

  // Whatever is in the CSS tab is applied live to the document.
  useEffect(() => {
    let style = document.getElementById("playground-css");
    if (!style) {
      style = document.createElement("style");
      style.id = "playground-css";
      document.head.append(style);
    }
    style.textContent = cssText;
  }, [cssText]);

  // The browser test proves this is the real library through these values.
  useEffect(() => {
    window.playground = {
      start: (...args) => startRef.current(...args),
      getState: () => stateRef.current,
      getStepIndex: () => stepIndexRef.current,
      isLibrary: true,
    };
    return () => {
      if (window.playground?.isLibrary) delete window.playground;
    };
  }, []);

  const onEvent = (name, payload) => {
    if (name === "stepChange") {
      setStatus({ text: describeEvent(name, payload), variant: "ok" });
    } else if (name === "complete") {
      setStatus({ text: "Tour complete.", variant: "ok" });
    } else if (name === "skip") {
      setStatus({ text: "Tour skipped.", variant: "ok" });
    } else if (name === "stop") {
      setStatus({ text: "Tour stopped.", variant: "ok" });
    } else if (name === "error") {
      const message = payload?.error?.message ?? "unknown error";
      setStatus({ text: `Tour error: ${message}`, variant: "error" });
    }
  };

  async function startPlayground() {
    let parsed;
    try {
      parsed = JSON.parse(configText);
    } catch (error) {
      tour.clearError();
      setStatus({ text: `Invalid JSON: ${error.message}`, variant: "error" });
      return;
    }

    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      tour.clearError();
      setStatus({ text: "The configuration must be a JSON object.", variant: "error" });
      return;
    }

    const started = await tour.start(parsed, { onEvent });
    if (started) setStatus({ text: `Running “${parsed.tourId}”.`, variant: "ok" });
  }

  const restart = async () => {
    tour.destroy();
    await startPlayground();
  };

  const destroyTour = () => {
    tour.destroy();
    setStatus({ text: "Destroyed. The overlay and every listener are gone.", variant: "ok" });
  };

  const loadPreset = (id) => {
    setPreset(id);
    const chosen = PRESETS.find((entry) => entry.id === id);
    if (!chosen) return;
    setConfigText(chosen.config);
    setStatus({ text: `Loaded the “${chosen.label}” preset.`, variant: "ok" });
  };

  const resetConfig = () => {
    setPreset("starter");
    setConfigText(STARTER);
    setStatus({ text: "Reset to the starter configuration.", variant: "ok" });
  };

  const copyConfig = async () => {
    try {
      await navigator.clipboard.writeText(configText);
      setStatus({ text: "Configuration copied to the clipboard.", variant: "ok" });
    } catch {
      setStatus({ text: "Copying failed — select the editor and press Ctrl+C.", variant: "error" });
    }
  };

  const displayText = tour.error ? tour.error.message : status.text;
  const displayVariant = tour.error ? "error" : status.variant;

  return (
    <div className="playground" id="playground">
      <div className="playground__editor">
        <div className="playground__toolbar">
          <label htmlFor="pg-preset">Preset</label>
          <select
            id="pg-preset"
            value={preset}
            onChange={(event) => loadPreset(event.target.value)}
          >
            {PRESETS.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
            <option value="custom">Custom (edited)</option>
          </select>
          <button
            type="button"
            className="button button--ghost"
            id="pg-reset"
            onClick={resetConfig}
          >
            Reset
          </button>
          <button type="button" className="button button--ghost" id="pg-copy" onClick={copyConfig}>
            Copy config
          </button>
        </div>

        <div className="playground__tabs" role="tablist" aria-label="Configuration panels">
          <button
            type="button"
            role="tab"
            aria-selected={panel === "config"}
            data-panel="config"
            id="tab-config"
            aria-controls="panel-config"
            onClick={() => setPanel("config")}
          >
            Configuration
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={panel === "css"}
            data-panel="css"
            id="tab-css"
            aria-controls="panel-css"
            onClick={() => setPanel("css")}
          >
            CSS variables
          </button>
        </div>

        <div
          className="playground__panel"
          role="tabpanel"
          id="panel-config"
          aria-labelledby="tab-config"
          hidden={panel !== "config"}
        >
          <label className="visually-hidden" htmlFor="config-input">
            Tour configuration JSON
          </label>
          <textarea
            id="config-input"
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            rows={22}
            value={configText}
            onChange={(event) => {
              setConfigText(event.target.value);
              setPreset("custom");
            }}
          />
        </div>

        <div
          className="playground__panel"
          role="tabpanel"
          id="panel-css"
          aria-labelledby="tab-css"
          hidden={panel !== "css"}
        >
          <label className="visually-hidden" htmlFor="css-input">
            CSS variable overrides
          </label>
          <textarea
            id="css-input"
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            rows={22}
            value={cssText}
            onChange={(event) => setCssText(event.target.value)}
          />
        </div>

        <p
          className="playground__status"
          id="playground-status"
          role="status"
          aria-live="polite"
          data-variant={displayVariant}
        >
          {displayText}
        </p>

        <div className="playground__controls">
          <button
            type="button"
            className="button button--primary"
            id="pg-start"
            onClick={startPlayground}
            disabled={tour.active}
          >
            Start tour
          </button>
          <button
            type="button"
            className="button"
            id="pg-next"
            onClick={tour.next}
            disabled={!tour.active}
          >
            Next
          </button>
          <button
            type="button"
            className="button"
            id="pg-prev"
            onClick={tour.previous}
            disabled={!tour.active || tour.stepIndex === 0}
          >
            Previous
          </button>
          <button
            type="button"
            className="button"
            id="pg-restart"
            onClick={restart}
            disabled={!tour.hasTour}
          >
            Restart
          </button>
          <button
            type="button"
            className="button"
            id="pg-destroy"
            onClick={destroyTour}
            disabled={!tour.hasTour}
          >
            Destroy
          </button>
          <label className="playground__theme">
            <span>Theme</span>
            <select
              id="pg-theme"
              value={themeChoice}
              onChange={(event) => {
                setThemeChoice(event.target.value);
                if (tour.hasTour) tour.setTheme(event.target.value);
              }}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </div>
      </div>

      <div className="playground__preview">
        <div className="preview" id="preview">
          <div className="preview__chrome" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="preview__body">
            <aside className="preview__nav" data-tour-id="play.nav" aria-label="Preview navigation">
              <span className="preview__nav-item preview__nav-item--active">Overview</span>
              <span className="preview__nav-item">Reports</span>
              <span className="preview__nav-item">Audience</span>
            </aside>
            <div className="preview__main">
              <div className="preview__card" data-tour-id="play.card">
                <strong>Live preview</strong>
                <span>A real DOM surface, not a screenshot.</span>
              </div>
              <button
                type="button"
                className="preview__cta"
                data-tour-id="play.cta"
                onClick={startPlayground}
              >
                Create project
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
