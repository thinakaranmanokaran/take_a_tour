import { useEffect, useRef, useState } from "react";
import { url } from "../config/site.js";

/**
 * Documentation search.
 *
 * The index is a static JSON file generated at build time
 * (`src/integrations/search-index.mjs`) — no remote API, no search library. It
 * is fetched once, on first open, so search never delays the page.
 *
 * Implements the ARIA combobox pattern: the input owns focus, `aria-activedescendant`
 * marks the highlighted option, ArrowUp/ArrowDown move through results, Enter
 * opens the active one, and Escape closes the dialog (native `<dialog>`
 * behaviour, which also returns focus to the trigger).
 */

const MAX_RESULTS = 8;

function searchIndex(index, query) {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const results = [];
  const seen = new Set();

  for (const page of index.pages) {
    for (const section of page.sections) {
      const title = page.title.toLowerCase();
      const heading = (section.heading ?? "").toLowerCase();
      const text = (section.text ?? "").toLowerCase();
      const haystack = `${title} ${heading} ${text}`;

      if (!tokens.every((token) => haystack.includes(token))) continue;

      const href = section.id ? `${page.href}#${section.id}` : page.href;
      if (seen.has(href)) continue;
      seen.add(href);

      let score = 1;
      if (tokens.every((token) => title.includes(token))) score += 5;
      if (tokens.every((token) => heading.includes(token))) score += 3;

      results.push({
        href,
        title: page.title,
        heading: section.heading || page.title,
        score,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, MAX_RESULTS);
}

export default function SearchDialog({ open, onClose }) {
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  // Guards the one-time fetch: without it, `setIndex("loading")` would re-run
  // this effect, whose cleanup would cancel the request in flight.
  const loadedRef = useRef(false);

  // null = not loaded yet, "loading", "error", or the parsed index.
  const [index, setIndex] = useState(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      window.requestAnimationFrame(() => inputRef.current?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Fetch the index on first open; the page itself never waits for it.
  useEffect(() => {
    if (!open || loadedRef.current) return undefined;
    loadedRef.current = true;
    setIndex("loading");

    fetch(url("search-index.json"))
      .then((response) => {
        if (!response.ok) throw new Error(`search index: ${response.status}`);
        return response.json();
      })
      .then((data) => setIndex(data))
      .catch(() => {
        loadedRef.current = false; // a later open retries
        setIndex("error");
      });

    return undefined;
  }, [open]);

  const loaded = index && index !== "loading" && index !== "error";
  const results = loaded && query.trim() ? searchIndex(index, query) : [];
  const active = Math.min(activeIndex, Math.max(results.length - 1, 0));

  const onInputKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex(results.length === 0 ? 0 : (active + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (results.length > 0) setActiveIndex((active - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      const target = results[active];
      if (target) {
        event.preventDefault();
        window.location.assign(url(target.href));
      }
    }
  };

  let body;
  if (index === "loading" || index === null) {
    body = <p className="search-dialog__note">Loading the index…</p>;
  } else if (index === "error") {
    body = (
      <p className="search-dialog__note">
        Search is unavailable right now. The full documentation is linked from the sidebar.
      </p>
    );
  } else if (!query.trim()) {
    body = (
      <p className="search-dialog__note">
        Search {index.pages.length} pages. Try “themes”, “spotlight” or “data-tour-id”.
      </p>
    );
  } else if (results.length === 0) {
    body = (
      <p className="search-dialog__note">
        No matches for “{query.trim()}”. Try fewer or different words.
      </p>
    );
  } else {
    body = (
      <ul className="search-results" id="search-results" role="listbox" aria-label="Search results">
        {results.map((result, position) => (
          <li key={result.href} role="presentation">
            <a
              id={`search-result-${position}`}
              className="search-result"
              href={url(result.href)}
              role="option"
              aria-selected={position === active}
              onMouseMove={() => setActiveIndex(position)}
            >
              <span className="search-result__heading">{result.heading}</span>
              <span className="search-result__page">{result.title}</span>
            </a>
          </li>
        ))}
      </ul>
    );
  }

  const status = !loaded
    ? ""
    : !query.trim()
      ? ""
      : `${results.length} ${results.length === 1 ? "result" : "results"} for ${query.trim()}`;

  return (
    <dialog
      ref={dialogRef}
      className="search-dialog"
      id="search-dialog"
      aria-label="Search documentation"
      onClose={() => {
        setQuery("");
        setActiveIndex(0);
        onClose();
      }}
    >
      <div className="search-dialog__bar">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="4.75" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="m10.6 10.6 3.4 3.4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <input
          ref={inputRef}
          id="search-input"
          type="search"
          placeholder="Search documentation"
          aria-label="Search documentation"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls="search-results"
          aria-activedescendant={results.length > 0 ? `search-result-${active}` : undefined}
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={onInputKeyDown}
        />
        <button
          type="button"
          className="search-dialog__close"
          onClick={() => onClose()}
          aria-label="Close search"
        >
          Esc
        </button>
      </div>
      <div className="search-dialog__body">{body}</div>
      <p className="visually-hidden" role="status">
        {status}
      </p>
    </dialog>
  );
}
