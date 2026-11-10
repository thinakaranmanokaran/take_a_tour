/**
 * Responsive table wrapper.
 *
 * A string cell is treated as trusted editor-authored markup (it may contain
 * `<code>`): it has to render as HTML, exactly as the previous Astro
 * component did. Object cells (`{ html }`) render as plain text.
 */
export default function Table({ head, rows }) {
  return (
    // The wrapper scrolls horizontally on narrow screens; `tabIndex` gives it
    // keyboard access, which axe requires of any scrollable region.
    <div className="table-wrap" tabIndex={0}>
      <table>
        <thead>
          <tr>
            {head.map((cell) => (
              <th key={cell}>{cell}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) =>
                typeof cell === "string" ? (
                  <td key={cellIndex} dangerouslySetInnerHTML={{ __html: cell }} />
                ) : (
                  <td key={cellIndex}>{cell.html}</td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
