import { url } from "../config/site.js";

/**
 * Previous / next documentation navigation, derived from `nav.js` order.
 */
export default function Pager({ previous, next }) {
  if (!previous && !next) return null;

  return (
    <nav className="pager" aria-label="Page navigation">
      {previous ? (
        <a className="pager__link pager__link--previous" href={url(previous.href)}>
          <span className="pager__direction">Previous</span>
          <span className="pager__title">{previous.title}</span>
        </a>
      ) : (
        <span />
      )}
      {next ? (
        <a className="pager__link pager__link--next" href={url(next.href)}>
          <span className="pager__direction">Next</span>
          <span className="pager__title">{next.title}</span>
        </a>
      ) : (
        <span />
      )}
    </nav>
  );
}
