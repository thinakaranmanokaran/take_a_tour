import { useCallback, useEffect, useRef, useState } from "react";
import { createTour } from "@take-a-tour/core";

const STEPS = [
  {
    tourId: "react.invite",
    title: "Invite your team",
    content: "Only people with an invitation can see this workspace.",
    placement: "bottom",
  },
  {
    tourId: "react.settings",
    title: "Settings live here",
    content: "Notifications, billing and danger zone — all in one place.",
    placement: "left",
  },
];

/**
 * The integration rule that matters in React: a tour outlives the component
 * that created it only if you deliberately say so.
 *
 * The effect below creates the tour once and destroys it on unmount. Under
 * StrictMode's double-invoked effects in development, the cleanup runs and then
 * the effect runs again — so the tour must be created *inside* the effect, never
 * stored in module scope or a `useMemo`.
 */
function useTour(config) {
  const tourRef = useRef(null);

  useEffect(() => {
    const tour = createTour(config);
    tourRef.current = tour;

    return () => {
      // Destroys the DOM, the listeners, the observers and frees the tourId.
      tour.destroy();
      tourRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    tourRef.current?.start();
  }, []);

  return { start, getTour: () => tourRef.current };
}

export function App() {
  const [showPanel, setShowPanel] = useState(false);

  const { start } = useTour({
    tourId: "react-workspace",
    steps: STEPS,
    theme: "system",
    showProgress: true,
    // This target only exists once the panel is open, so the tour waits for it
    // instead of failing. That is the whole point of `waitForTarget`.
    target: { missing: "wait", timeout: 5000 },
  });

  return (
    <main className="page">
      <header className="page__header">
        <h1>Workspace</h1>
        <div className="page__actions">
          <button className="btn" onClick={() => setShowPanel((value) => !value)}>
            {showPanel ? "Hide panel" : "Show panel"}
          </button>
          <button className="btn btn--primary" onClick={start} data-tour-id="react.help">
            Start tour
          </button>
        </div>
      </header>

      <section className="card">
        <h2>Members</h2>
        <p className="muted">Three people have access to this workspace.</p>
        <button className="btn btn--primary" data-tour-id="react.invite">
          Invite member
        </button>
      </section>

      {showPanel && (
        <section className="card" data-tour-id="react.settings">
          <h2>Settings</h2>
          <p className="muted">Mounted on demand — the tour waits for this element.</p>
        </section>
      )}
    </main>
  );
}
