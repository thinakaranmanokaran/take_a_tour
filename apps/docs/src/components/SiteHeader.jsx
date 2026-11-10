import { useEffect, useState } from "react";
import { SITE, url } from "../config/site.js";
import SearchDialog from "./SearchDialog.jsx";

/**
 * Site header — a hydrated React island (`client:load`).
 *
 * Contains the primary navigation, mobile menu, theme switch and the search
 * dialog. The stored theme is applied before first paint by the inline script
 * in `BaseLayout.astro`; this island only takes over afterwards.
 */

const THEME_KEY = "tat-docs-theme";

const THEME_CHOICES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Docs", href: "/docs/" },
  { label: "Playground", href: "/playground/" },
  { label: "Examples", href: "/examples/" },
];

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="m10.6 10.6 3.4 3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export default function SiteHeader({ pathname = "/" }) {
  const [theme, setTheme] = useState("system");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Pick up the persisted theme (the inline script already applied it).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(THEME_KEY);
      if (stored === "light" || stored === "dark" || stored === "system") setTheme(stored);
    } catch {
      /* storage unavailable — stay on the default */
    }
  }, []);

  // Ctrl/Cmd+K opens search from anywhere on the page.
  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Escape closes the mobile menu.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const chooseTheme = (value) => {
    setTheme(value);
    document.documentElement.dataset.theme = value;
    try {
      window.localStorage.setItem(THEME_KEY, value);
    } catch {
      /* storage unavailable — theme still applies for this page */
    }
  };

  const isCurrent = (href) => {
    const target = url(href);
    if (href === "/docs/") return pathname.startsWith(target);
    if (href === "/#features") return pathname === url("/");
    return pathname === target;
  };

  const themeSwitch = (
    <div className="theme-switch" role="group" aria-label="Colour theme">
      {THEME_CHOICES.map((choice) => (
        <button
          key={choice.value}
          type="button"
          data-theme-choice={choice.value}
          aria-pressed={theme === choice.value}
          onClick={() => chooseTheme(choice.value)}
        >
          {choice.label}
        </button>
      ))}
    </div>
  );

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="site-header__brand" href={url("/")}>
          <span className="brand-mark" aria-hidden="true">
            T
          </span>
          <span className="brand-word">Take a Tour</span>
        </a>

        <nav className="site-nav" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={url(link.href)}
              aria-current={isCurrent(link.href) ? "page" : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="site-header__actions">
          <button
            type="button"
            className="search-trigger"
            id="search-trigger"
            onClick={() => setSearchOpen(true)}
            aria-haspopup="dialog"
            aria-label="Search documentation"
          >
            <SearchIcon />
            <span className="search-trigger__label">Search</span>
            <kbd>Ctrl K</kbd>
          </button>

          <div className="site-header__desktop-only">{themeSwitch}</div>

          <a
            className="button button--ghost header-github"
            href={SITE.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitHubIcon />
            <span className="header-github__label">GitHub</span>
          </a>

          <a className="button button--primary header-cta" href={url("/docs/getting-started/")}>
            Get started
          </a>

          <button
            type="button"
            className="nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="nav-toggle__bars" aria-hidden="true" />
            Menu
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav className="mobile-nav" id="mobile-nav" aria-label="Site">
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={url(link.href)} onClick={() => setMenuOpen(false)}>
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a href={url("/docs/getting-started/")} onClick={() => setMenuOpen(false)}>
                Get started
              </a>
            </li>
            <li>
              <a href={url("/about/")} onClick={() => setMenuOpen(false)}>
                About
              </a>
            </li>
            <li>
              <a
                href={SITE.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
              >
                GitHub
              </a>
            </li>
          </ul>
          <div className="mobile-nav__theme">
            <p className="mobile-nav__label">Colour theme</p>
            {themeSwitch}
          </div>
        </nav>
      ) : null}

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
