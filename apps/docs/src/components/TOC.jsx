import { useState } from "react";
import { useSectionHeadings } from "../hooks/useSectionHeadings.js";
import ChevronIcon from "./ChevronIcon.jsx";

/**
 * "On this page" section navigation.
 *
 * `variant="rail"` (default) is the sticky right-hand rail shown on wide
 * screens, with a fold control on its label. `variant="inline"` is the
 * collapsible disclosure shown whenever the rail has no room — same list,
 * same scroll tracking, folded by default.
 *
 * A hydrated island (`client:idle`) because it needs to observe the rendered
 * headings and scroll position; the lists can never drift out of sync with
 * the article.
 */
export default function TOC({ variant = "rail" }) {
  const [open, setOpen] = useState(variant !== "inline");
  const { items, activeId } = useSectionHeadings();

  if (items.length === 0) return null;

  const listId = `toc-list-${variant}`;
  const list = (
    <ul id={listId}>
      {items.map((heading) => (
        <li
          key={heading.id}
          className={heading.level === 3 ? "toc__item toc__item--nested" : "toc__item"}
        >
          <a href={`#${heading.id}`} aria-current={activeId === heading.id ? "true" : undefined}>
            {heading.text}
          </a>
        </li>
      ))}
    </ul>
  );

  if (variant === "inline") {
    return (
      <div className="toc-disclosure">
        <button
          type="button"
          className="toc-disclosure__toggle"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((value) => !value)}
        >
          <span>On this page</span>
          <ChevronIcon direction={open ? "up" : "down"} />
        </button>
        {open ? list : null}
      </div>
    );
  }

  return (
    <nav className="toc" aria-label="On this page">
      <div className="toc__head">
        <p className="toc__label">On this page</p>
        <button
          type="button"
          className="toc__toggle"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={open ? "Collapse section navigation" : "Expand section navigation"}
          onClick={() => setOpen((value) => !value)}
        >
          <ChevronIcon direction={open ? "up" : "down"} />
        </button>
      </div>
      {open ? list : null}
    </nav>
  );
}
