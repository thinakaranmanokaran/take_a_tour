/**
 * Transport controls shared by every interactive tour demo.
 *
 * Renders the full control set the product demonstrates — start/restart,
 * next (which becomes Finish on the last step), previous, skip and stop — plus
 * a live-region status line. The parent owns the tour; this is presentation.
 */
export default function DemoControls({
  running = false,
  paused = false,
  stepIndex = -1,
  totalSteps = 0,
  onStart,
  onNext,
  onPrevious,
  onSkip,
  onStop,
  status,
  statusVariant,
  startLabel = "Start the tour",
}) {
  const active = running || paused;
  const isLast = totalSteps > 0 && stepIndex >= totalSteps - 1;

  return (
    <>
      <div className="demo-controls">
        <button type="button" className="button button--primary" onClick={onStart}>
          {active ? "Restart" : startLabel}
        </button>
        <button type="button" className="button" onClick={onNext} disabled={!running}>
          {isLast ? "Finish" : "Next"}
        </button>
        <button
          type="button"
          className="button"
          onClick={onPrevious}
          disabled={!active || stepIndex <= 0}
        >
          Previous
        </button>
        <button type="button" className="button" onClick={onSkip} disabled={!running}>
          Skip
        </button>
        <button type="button" className="button" onClick={onStop} disabled={!active}>
          Stop
        </button>
        {active && totalSteps > 0 ? (
          <span className="pill demo-controls__step">
            Step {stepIndex + 1} of {totalSteps}
          </span>
        ) : null}
      </div>
      <p className="demo-status" role="status" data-variant={statusVariant ?? undefined}>
        {status}
      </p>
    </>
  );
}
