import { SITE, url } from "../../config/site.js";

/**
 * `/examples` — static intro and outro around the eight example islands,
 * which are passed in as children from the route shell.
 */
export default function Examples({ children }) {
  return (
    <>
      <section className="examples-intro">
        <div className="section__inner">
          <p className="eyebrow">Examples</p>
          <h1 className="page-title">Every example runs the real library</h1>
          <p className="section-lede">
            Eight configurations you can copy, each running against the same sample application
            panel. Press a start button and the tour you are reading about is the tour on screen —
            there is no mock layer.
          </p>
          <p className="section-lede">
            The snippet beside each demo is generated from exactly the configuration that demo runs,
            so the two cannot drift apart.
          </p>
        </div>
      </section>

      <section className="section" aria-label="Examples">
        <div className="section__inner examples-list">{children}</div>
      </section>

      <section className="section">
        <div className="section__inner">
          <div className="cta-band">
            <h2>Need a case that is not here?</h2>
            <p>
              The playground edits a full configuration live against the same sample panel, and the
              configuration reference covers every option and default.
            </p>
            <div className="cta-band__actions">
              <a className="button button--primary button--lg" href={url("/playground/")}>
                Open the playground
              </a>
              <a className="button button--lg" href={url("/docs/configuration/")}>
                Configuration reference
              </a>
              <a
                className="button button--ghost button--lg"
                href={SITE.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open the repository
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
