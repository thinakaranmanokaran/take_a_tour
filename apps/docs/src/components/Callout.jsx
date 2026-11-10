/**
 * Highlighted aside for notes, warnings and safety-critical information.
 */
export default function Callout({ title, variant = "info", children }) {
  return (
    <aside className={`callout${variant !== "info" ? ` callout--${variant}` : ""}`}>
      {title ? (
        <p>
          <strong>{title}</strong>
        </p>
      ) : null}
      {children}
    </aside>
  );
}
