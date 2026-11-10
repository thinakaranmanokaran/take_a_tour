/**
 * Human-readable status for a demo's live region, derived from library events.
 * Kept in one place so every demo describes the same state the same way.
 */
export function describeEvent(event, payload) {
  switch (event) {
    case "start":
      return "Tour started. The overlay and tooltip are the library's own components.";
    case "stepChange": {
      const total = payload?.total ?? 0;
      const index = (payload?.stepIndex ?? payload?.index ?? 0) + 1;
      const title = typeof payload?.step?.title === "string" ? ` — ${payload.step.title}` : "";
      return `Step ${index} of ${total}${title}`;
    }
    case "pause":
      return "Paused.";
    case "resume":
      return "Resumed.";
    case "complete":
      return "Tour complete. The overlay and every listener were removed.";
    case "skip":
      return "Tour skipped.";
    case "stop":
      return "Tour stopped and cleaned up.";
    default:
      return "Running…";
  }
}
