import { GROUPS, docsInGroup } from "../data/nav.js";
import { url } from "../config/site.js";
import { useRailCollapse } from "../hooks/useRailCollapse.js";
import ChevronIcon from "./ChevronIcon.jsx";

/**
 * Documentation sidebar: every group from `nav.js`, with the current page
 * marked. The links are rendered into the static HTML so navigation works
 * without JavaScript; hydration adds the fold control (`useRailCollapse`).
 */
export default function Sidebar({ current }) {
  const { collapsed, toggle, navRef, toggleRef, reopenRef } = useRailCollapse();

  return (
    <>
      <nav className="sidebar sidebar--docs" aria-label="Documentation" ref={navRef}>
        <div className="sidebar__head">
          <p className="sidebar__label">Documentation</p>
          <button
            type="button"
            className="sidebar__toggle"
            ref={toggleRef}
            aria-expanded={!collapsed}
            aria-controls="docs-nav-body"
            aria-label={
              collapsed ? "Expand documentation navigation" : "Collapse documentation navigation"
            }
            onClick={toggle}
          >
            <ChevronIcon direction={collapsed ? "down" : "left"} />
          </button>
        </div>
        <div className="sidebar__body" id="docs-nav-body">
          {GROUPS.map((group) => (
            <div className="sidebar__group" key={group.id}>
              <p className="sidebar__label">{group.label}</p>
              <ul>
                {docsInGroup(group.id).map((doc) => {
                  const href = url(doc.href);
                  const isCurrent = current === href;
                  return (
                    <li key={doc.href}>
                      <a href={href} aria-current={isCurrent ? "page" : undefined}>
                        {doc.title}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>
      {/* Sibling of the rail on purpose: a fixed control inside the sticky,
          `visibility: hidden` rail is painted below page content. */}
      <button
        type="button"
        className="rail-reopen"
        ref={reopenRef}
        aria-expanded="false"
        aria-controls="docs-nav-body"
        aria-label="Expand documentation navigation"
        onClick={toggle}
      >
        <ChevronIcon direction="right" />
      </button>
    </>
  );
}
