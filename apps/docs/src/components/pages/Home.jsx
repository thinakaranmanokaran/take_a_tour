import { SITE, url } from "../../config/site.js";
import CodeBlock from "../CodeBlock.jsx";
import { SHOWCASE_CONFIG_JSON } from "../home/showcase-config.js";

/**
 * Marketing home page.
 *
 * Static and fully server-rendered; the two interactive pieces — the hero
 * demo and the feature showcase — are passed in as hydrated islands from the
 * route shell, so this component costs no JavaScript of its own.
 */

const WHY = [
  {
    title: "Simple integration",
    text: "One marker attribute, one JSON object, one start() call. Nothing else changes.",
    href: "/docs/getting-started/",
    link: "Get started",
  },
  {
    title: "Explicit element targeting",
    text: "data-tour-id values are matched exactly. Duplicates are reported, never guessed.",
    href: "/docs/target-identifiers/",
    link: "How targeting works",
  },
  {
    title: "Customizable presentation",
    text: "Every colour, radius and shadow is a CSS variable, with class hooks for the rest.",
    href: "/docs/customization/",
    link: "Customization",
  },
  {
    title: "Keyboard accessible",
    text: "Focus management, Escape handling, live-region announcements and reduced motion.",
    href: "/docs/accessibility/",
    link: "Accessibility",
  },
  {
    title: "Theme support",
    text: "Light, dark and system themes — per tour or per step, following your tokens.",
    href: "/docs/themes/",
    link: "Themes",
  },
  {
    title: "Predictable configuration",
    text: "Validated at creation, with typed errors that name the exact property path.",
    href: "/docs/troubleshooting/",
    link: "Error reference",
  },
];

const FEATURES = [
  {
    title: "Zero runtime dependencies",
    text: "Nothing to audit, dedupe or patch. The package is the source and a stylesheet.",
  },
  {
    title: "JSON-first configuration",
    text: "Tours are data. Store them, generate them, or ship them as JSON files.",
  },
  {
    title: "Stable element targeting",
    text: "data-tour-id is a literal value matched exactly — dots are characters, not paths.",
  },
  {
    title: "Light and dark themes",
    text: "A complete token set for both, plus a system-following mode.",
  },
  {
    title: "Custom styling",
    text: "Restyle the tooltip, overlay and spotlight without fighting specificity.",
  },
  {
    title: "Keyboard and screen-reader support",
    text: "Arrow keys and Escape work; step changes are announced through a live region.",
  },
  {
    title: "Framework-independent",
    text: "Vanilla, React, Vue or Angular: it binds to the DOM you already rendered.",
  },
  {
    title: "TypeScript declarations",
    text: "The package ships hand-written types covering the entire public API.",
  },
];

const USE_CASES = [
  "SaaS onboarding",
  "Admin dashboards",
  "ERP interfaces",
  "Analytics products",
  "Feature announcements",
  "Internal business applications",
];

const DOCS_CARDS = [
  {
    title: "Installation",
    text: "npm, pnpm, yarn, bundlers, stylesheets and types.",
    href: "/docs/installation/",
  },
  {
    title: "Your first tour",
    text: "Mark a target and start a tour in about five minutes.",
    href: "/docs/getting-started/",
  },
  {
    title: "Configuration",
    text: "Every option, its default and its validation rule.",
    href: "/docs/configuration/",
  },
  {
    title: "Themes",
    text: "Design tokens, dark mode and custom styling.",
    href: "/docs/themes/",
  },
  {
    title: "API reference",
    text: "Signatures, return values, events and errors.",
    href: "/docs/api/",
  },
];

const MARKUP_SAMPLE = `<aside class="app-sidebar">
  <a href="/reports" data-tour-id="app.nav">Reports</a>
</aside>

<button data-tour-id="app.create">Create project</button>`;

const TOUR_SAMPLE = `import { createTour } from "@take-a-tour/core";
import "@take-a-tour/core/styles.css";

const tour = createTour({
  tourId: "welcome",
  showProgress: true,
  steps: [
    {
      tourId: "app.search",
      title: "Find anything",
      content: "Search across every workspace from here."
    },
    {
      tourId: "app.create",
      title: "Create a project",
      content: "Start blank or from a template."
    }
  ]
});

tour.on("complete", () => console.log("Onboarding finished"));

await tour.start();`;

export default function Home({ heroDemo, showcase }) {
  return (
    <>
      <section className="hero">
        <div className="hero__inner">
          <div className="hero__top">
            <p className="hero__eyebrow">Zero dependencies · MIT licensed</p>
            <h1 className="hero__title">Beautiful product tours. Zero unnecessary dependencies.</h1>
          </div>

          <div className="hero__grid">
            <div className="hero__copy">
              <p className="hero__lede">
                Take a Tour is a plain-JavaScript library for interactive onboarding. Mark real
                elements with <code>data-tour-id</code>, describe the steps as JSON, and call{" "}
                <code>start()</code>.
              </p>

              <div className="hero__actions">
                <a className="button button--dark button--lg" href={url("/docs/getting-started/")}>
                  Get started
                </a>
                <a className="button button--light button--lg" href={url("/playground/")}>
                  Explore the playground
                </a>
              </div>

              <div className="hero__install">
                <code>npm install @take-a-tour/core</code>
                <button
                  type="button"
                  className="copy-inline"
                  data-copy
                  data-copy-text="npm install @take-a-tour/core"
                  aria-label="Copy the install command"
                >
                  Copy
                </button>
              </div>
              <p className="hero__meta">
                v{SITE.version} pre-release — not on npm yet; the source lives in the{" "}
                <a href={SITE.repoUrl} target="_blank" rel="noopener noreferrer">
                  repository
                </a>
                .
              </p>
            </div>

            <div className="hero__demo">{heroDemo}</div>
          </div>
        </div>
      </section>

      <section className="section section--tight section--subtle" aria-label="Product principles">
        <div className="section__inner">
          <ul className="trust__list">
            <li>Zero runtime dependencies</li>
            <li>Plain JavaScript, browser-native</li>
            <li>JSON-first configuration</li>
            <li>Framework-agnostic</li>
            <li>Light and dark themes</li>
            <li>MIT licensed</li>
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="why-title">
        <div className="section__inner">
          <div className="section-head">
            <p className="eyebrow">Why Take a Tour</p>
            <h2 className="section-title" id="why-title">
              Built around the boring parts
            </h2>
            <p className="section-lede">
              Positioning, highlighting, focus handling and teardown are the parts every tour
              library gets wrong. Take a Tour owns those, and stays out of the way for the rest.
            </p>
          </div>

          <div className="feature-grid">
            {WHY.map((item) => (
              <article className="feature-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <a className="feature-card__link" href={url(item.href)}>
                  {item.link} →
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--subtle" aria-labelledby="showcase-title">
        <div className="section__inner">
          <div className="showcase-grid">
            <div>
              <p className="eyebrow">Live demonstration</p>
              <h2 className="section-title" id="showcase-title">
                See it running, not just described
              </h2>
              <p className="section-lede">
                This is the real package over a sample application — the same code you would
                install, driving real DOM elements.
              </p>
              <ul className="showcase-list">
                <li>A real overlay and spotlight measured from the target</li>
                <li>Next, Previous, Skip, Finish and Restart</li>
                <li>Progress, keyboard navigation and Escape handling</li>
                <li>Light and dark themes that follow this site</li>
              </ul>
            </div>
            <div>{showcase}</div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="config-title">
        <div className="section__inner">
          <div className="config-grid">
            <div>
              <CodeBlock
                lang="json"
                title="home.showcase — the demo above"
                code={SHOWCASE_CONFIG_JSON}
              />
            </div>
            <div>
              <p className="eyebrow">Configuration</p>
              <h2 className="section-title" id="config-title">
                Data in, tour out
              </h2>
              <p className="section-lede">
                That JSON is the exact configuration the demo above runs — its theme follows this
                site's light/dark toggle.
              </p>
              <ul className="showcase-list">
                <li>
                  <code>tourId</code> names the tour; <code>steps</code> is an ordered list
                </li>
                <li>
                  Each step's <code>tourId</code> matches one <code>data-tour-id</code> exactly
                </li>
                <li>
                  <code>placement</code>, <code>showProgress</code> and <code>theme</code> are
                  optional, with documented defaults
                </li>
                <li>Invalid configuration is rejected at creation, naming the exact path</li>
              </ul>
              <p>
                <a className="feature-card__link" href={url("/docs/configuration/")}>
                  Every option and default →
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--dark" aria-labelledby="how-title">
        <div className="section__inner">
          <div className="section-head">
            <p className="eyebrow">How it works</p>
            <h2 className="section-title" id="how-title">
              Four steps, all of them small
            </h2>
          </div>

          <ol className="how-steps">
            <li className="how-step">
              <span className="how-step__num">1</span>
              <h3>Install</h3>
              <p>
                Add the package and import the stylesheet. There is no build plugin and no runtime
                peer dependency.
              </p>
            </li>
            <li className="how-step">
              <span className="how-step__num">2</span>
              <h3>Mark your targets</h3>
              <p>
                Add <code>data-tour-id</code> to the elements a tour should point at. They stay
                ordinary elements.
              </p>
            </li>
            <li className="how-step">
              <span className="how-step__num">3</span>
              <h3>Describe the steps</h3>
              <p>A JSON object: an id, an ordered list, and whatever options you want to change.</p>
            </li>
            <li className="how-step">
              <span className="how-step__num">4</span>
              <h3>Start it</h3>
              <p>
                <code>tour.start()</code> returns a promise. Destroy, or let it complete — it cleans
                up either way.
              </p>
            </li>
          </ol>

          <div className="config-grid config-grid--spaced">
            <div>
              <CodeBlock lang="html" title="index.html" code={MARKUP_SAMPLE} />
            </div>
            <div>
              <CodeBlock lang="js" title="app.js" code={TOUR_SAMPLE} />
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="features" aria-labelledby="features-title">
        <div className="section__inner">
          <div className="section-head">
            <p className="eyebrow">Features</p>
            <h2 className="section-title" id="features-title">
              Everything a tour needs, nothing else
            </h2>
          </div>

          <div className="feature-grid">
            {FEATURES.map((item) => (
              <article className="feature-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--subtle" aria-labelledby="use-cases-title">
        <div className="section__inner">
          <div className="section-head section-head--center">
            <p className="eyebrow">Use cases</p>
            <h2 className="section-title" id="use-cases-title">
              Where tours earn their keep
            </h2>
            <p className="section-lede">
              Anywhere a first-time user could get lost: dense dashboards, multi-step workflows, and
              features that shipped last week.
            </p>
          </div>
          <ul className="chips chips--center">
            {USE_CASES.map((useCase) => (
              <li className="chip" key={useCase}>
                {useCase}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="philosophy-title">
        <div className="section__inner">
          <div className="section-head">
            <p className="eyebrow">Design philosophy</p>
            <h2 className="section-title" id="philosophy-title">
              Small on purpose
            </h2>
            <p className="section-lede">
              A minimal library is a trade-off, not a shortcoming. It owns the hard parts —
              positioning, spotlight math, focus, cleanup — and leaves product orchestration to your
              application, where it belongs.
            </p>
          </div>

          <div className="philosophy">
            <div>
              <h3>What it is</h3>
              <ul>
                <li>A zero-dependency core with one active tour per document</li>
                <li>JSON configuration validated before anything renders</li>
                <li>
                  <code>data-tour-id</code> as literal element identity
                </li>
                <li>Keyboard-first interactions with announced step changes</li>
                <li>CSS-variable theming shared with your own tokens</li>
                <li>A small, documented public API — no plugin system</li>
              </ul>
            </div>
            <div>
              <h3>What it deliberately is not</h3>
              <ul>
                <li>Not a hosted service — it makes no network requests</li>
                <li>Not an analytics or A/B testing product</li>
                <li>Not a drag-and-drop tour builder (tours are data you own)</li>
                <li>Not a React-only component library</li>
                <li>Not a fix for application CSS conflicts</li>
                <li>Not trying to cover every edge case with configuration flags</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--subtle" aria-labelledby="docs-title">
        <div className="section__inner">
          <div className="section-head section-head--center">
            <p className="eyebrow">Documentation</p>
            <h2 className="section-title" id="docs-title">
              The docs are short by design
            </h2>
          </div>
          <div className="docs-cards">
            {DOCS_CARDS.map((card) => (
              <a className="docs-card" href={url(card.href)} key={card.href}>
                <strong>{card.title}</strong>
                <span>{card.text}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="cta-title">
        <div className="section__inner">
          <div className="cta-band">
            <h2 id="cta-title">Start building in five minutes</h2>
            <p>
              Install the package, mark one element, start a tour. If it takes longer than your
              coffee break, the documentation is at fault.
            </p>
            <div className="cta-band__actions">
              <a className="button button--primary button--lg" href={url("/docs/getting-started/")}>
                Get started
              </a>
              <a className="button button--lg" href={url("/docs/api/")}>
                Read the API reference
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
