import { url } from "../config/site.js";

/**
 * Breadcrumb trail. The last item is the current page and is not a link.
 * Mirrors the BreadcrumbList structured data emitted for the page.
 */
export default function Breadcrumbs({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.href ?? item.label}>
              {!isLast && item.href ? (
                <a href={url(item.href)}>{item.label}</a>
              ) : (
                <span aria-current="page">{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
