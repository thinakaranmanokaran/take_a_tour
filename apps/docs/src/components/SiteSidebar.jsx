import { PUBLIC_PAGES } from "../data/nav.js";
import { url } from "../config/site.js";
import { useRailCollapse } from "../hooks/useRailCollapse.js";
import { useSectionHeadings } from "../hooks/useSectionHeadings.js";
import ChevronIcon from "./ChevronIcon.jsx";

/**
 * Public-site navigation rail: the site's pages, with the current page's
 * sections nested underneath it. Rendered into the static HTML so every link
 * works without JavaScript; hydration adds the scroll-spy and the fold
 * control (`useRailCollapse`).
 */
export default function SiteSidebar({ current }) {
  const { collapsed, toggle, navRef, toggleRef, reopenRef } = useRailCollapse();
  const { items, activeId } = useSectionHeadings({
    selector: "h2",
    minCount: 2,
    prerendered: ".sidebar__sections",
  });

  return (
    <>
      <nav className="sidebar sidebar--site" aria-label="Site" ref={navRef}>
        <div className="sidebar__head">
          <p className="sidebar__label">Site</p>
          <button
            type="button"
            className="sidebar__toggle"
            ref={toggleRef}
            aria-expanded={!collapsed}
            aria-controls="site-nav-body"
            aria-label={collapsed ? "Expand site navigation" : "Collapse site navigation"}
            onClick={toggle}
          >
            <ChevronIcon direction={collapsed ? "down" : "left"} />
          </button>
        </div>
        <div className="sidebar__body" id="site-nav-body">
          <ul>
            {PUBLIC_PAGES.map((page) => {
              const href = url(page.href);
              const isCurrent = current === href;

              return (
                <li key={page.href}>
                  <a href={href} aria-current={isCurrent ? "page" : undefined}>
                    {page.title}
                  </a>
                  {isCurrent && items.length > 0 ? (
                    <ul className="sidebar__sections">
                      {items.map((item) => (
                        <li key={item.id}>
                          <a
                            href={`#${item.id}`}
                            aria-current={activeId === item.id ? "true" : undefined}
                          >
                            {item.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
      {/* Sibling of the rail on purpose: a fixed control inside the sticky,
          `visibility: hidden` rail is painted below page content. */}
      <button
        type="button"
        className="rail-reopen"
        ref={reopenRef}
        aria-expanded="false"
        aria-controls="site-nav-body"
        aria-label="Expand site navigation"
        onClick={toggle}
      >
        <ChevronIcon direction="right" />
      </button>
    </>
  );
}
