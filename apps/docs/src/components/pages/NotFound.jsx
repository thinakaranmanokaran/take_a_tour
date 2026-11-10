import { url } from "../../config/site.js";

/**
 * `/404` — designed not-found page with routes back into the site. Marked
 * `noindex` in the shell so it can never appear in search results.
 */
export default function NotFound() {
  return (
    <div className="notfound">
      <p className="notfound__code">404</p>
      <h1>This page is not on the tour</h1>
      <p>
        The page you asked for does not exist — it may have moved, or the link that brought you here
        may be out of date.
      </p>
      <div className="notfound__actions">
        <a className="button button--primary button--lg" href={url("/")}>
          Back to home
        </a>
        <a className="button button--lg" href={url("/docs/")}>
          Documentation
        </a>
        <a className="button button--ghost button--lg" href={url("/docs/getting-started/")}>
          Getting started
        </a>
      </div>
      <p>
        Looking for something specific? Press <kbd>Ctrl</kbd> <kbd>K</kbd> to search the site.
      </p>
    </div>
  );
}
