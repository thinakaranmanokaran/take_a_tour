import CodeBlock from "../CodeBlock.jsx";
import Callout from "../Callout.jsx";
import { url } from "../../config/site.js";

export default function GettingStarted() {
  return (
    <>
      <h1>Getting started</h1>
      <p className="lede">Install, mark a target, start a tour. Three steps, about five minutes.</p>

      <h2>1. Install</h2>

      <CodeBlock lang="bash" code={`npm install @take-a-tour/core`} />

      <p>
        The package has zero runtime dependencies. Nothing else is required — not a CSS framework,
        not an icon package, not a positioning engine.
      </p>

      <h2>2. Mark what the tour points at</h2>

      <p>
        Add <code>data-tour-id</code> to the elements you want to highlight. The value is a plain
        identifier; dots are ordinary characters.
      </p>

      <CodeBlock
        lang="html"
        code={`<button data-tour-id="home.cta">Create project</button>
<nav data-tour-id="home.sidebar">
  <a href="/">Overview</a>
  <a href="/reports">Reports</a>
</nav>
<span data-tour-id="home.stats">48,219 visitors</span>`}
      />

      <Callout title="Keep identifiers unique">
        <p>
          If two elements share a <code>data-tour-id</code>, the library reports an error rather
          than guessing. Fix the duplicate, or opt in explicitly with <code>target.occurrence</code>
          .
        </p>
      </Callout>

      <h2>3. Describe and start the tour</h2>

      <CodeBlock
        lang="js"
        code={`import { createTour } from "@take-a-tour/core";
import "@take-a-tour/core/styles.css";

const tour = createTour({
  // Identifies the tour itself. Must be unique in the document.
  tourId: "home-onboarding",

  steps: [
    {
      // Identifies the DOM target, matched exactly against data-tour-id.
      tourId: "home.cta",
      title: "Create your first project",
      content: "Every workspace starts with a project.",
      placement: "bottom",
    },
    {
      tourId: "home.sidebar",
      title: "Everything lives here",
      content: "Switch between modules without leaving the page.",
      placement: "right",
    },
  ],

  theme: "system",
  showProgress: true,
});

tour.start();`}
      />

      <h2>Driving it from a button</h2>

      <CodeBlock
        lang="js"
        code={`document.querySelector("#start-tour").addEventListener("click", () => {
  tour.start();
});`}
      />

      <p>
        Calling <code>start()</code> twice is harmless: the second call resolves to the first rather
        than starting a duplicate tour.
      </p>

      <h2>What you get</h2>

      <ul>
        <li>An overlay with a spotlight cut-out around the current target.</li>
        <li>A tooltip with Previous, Next and Skip controls.</li>
        <li>A progress bar, keyboard navigation and focus restoration.</li>
        <li>Automatic repositioning when the page scrolls or resizes.</li>
      </ul>

      <h2>Next steps</h2>

      <ul>
        <li>
          <a href={url("/playground/")}>Open the playground</a> and edit a tour live.
        </li>
        <li>
          <a href={url("/docs/configuration/")}>Read the configuration reference</a>.
        </li>
        <li>
          <a href={url("/docs/frameworks/")}>Integrate with React or Vue</a>.
        </li>
      </ul>
    </>
  );
}
