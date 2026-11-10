import { SITE, url } from "../config/site.js";

/**
 * Site footer. Static markup — no JavaScript needed for navigation.
 */

const YEAR = new Date().getFullYear();

const COLUMNS = [
  {
    label: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Playground", href: "/playground/" },
      { label: "Examples", href: "/examples/" },
      { label: "Changelog", href: "/changelog/" },
    ],
  },
  {
    label: "Documentation",
    links: [
      { label: "Getting started", href: "/docs/getting-started/" },
      { label: "Installation", href: "/docs/installation/" },
      { label: "JSON configuration", href: "/docs/configuration/" },
      { label: "API reference", href: "/docs/api/" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <a className="site-header__brand" href={url("/")}>
            <span className="brand-mark" aria-hidden="true">
              T
            </span>
            <span>Take a Tour</span>
          </a>
          <p className="site-footer__tagline">{SITE.tagline}</p>
          <p className="site-footer__meta">
            {SITE.packageName} · MIT License · Zero runtime dependencies
          </p>
        </div>

        {COLUMNS.map((column) => (
          <nav className="site-footer__column" aria-label={column.label} key={column.label}>
            <p className="site-footer__label">{column.label}</p>
            <ul>
              {column.links.map((link) => (
                <li key={link.href + link.label}>
                  <a href={url(link.href)}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <nav className="site-footer__column" aria-label="Project">
          <p className="site-footer__label">Project</p>
          <ul>
            <li>
              <a href={SITE.repoUrl} target="_blank" rel="noopener noreferrer">
                GitHub repository
              </a>
            </li>
            <li>
              <a href={url("/about/")}>About</a>
            </li>
            <li>
              <a href={`${SITE.repoUrl}/issues`} target="_blank" rel="noopener noreferrer">
                Report an issue
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div className="site-footer__legal">
        <p>© {YEAR} Take a Tour</p>
        <p>Zero-dependency library. Every demo on this site runs the real package.</p>
      </div>
    </footer>
  );
}
