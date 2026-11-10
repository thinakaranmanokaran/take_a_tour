/**
 * Decorative chevron used by the navigation rails, their fold controls and
 * the "On this page" table of contents. Rotation is applied with classes so
 * the stylesheet can re-interpret it per breakpoint; the control itself
 * carries the accessible label.
 */
export default function ChevronIcon({ direction = "down" }) {
  return (
    <svg
      className={`chevron chevron--${direction}`}
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3.5 6.25 8 10.5l4.5-4.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
