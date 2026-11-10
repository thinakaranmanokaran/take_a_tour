import CodeBlock from "../CodeBlock.jsx";
import Callout from "../Callout.jsx";
import { url } from "../../config/site.js";

export default function TargetIdentifiers() {
  return (
    <>
      <h1>Target identifiers</h1>
      <p className="lede">
        A step's <code>tourId</code> is the value of an element's <code>data-tour-id</code>{" "}
        attribute. It is compared as an exact string. It is never interpolated into a CSS selector.
      </p>

      <h2>The rule</h2>

      <CodeBlock lang="html" code={`<button data-tour-id="home.cta">Create project</button>`} />

      <CodeBlock
        lang="js"
        code={`// This step points at that button.
{ tourId: "home.cta", title: "Create a project", content: "Use this to create one." }`}
      />

      <h2>Why it is not a selector</h2>

      <p>
        The obvious implementation escapes the identifier and builds
        <code>[data-tour-id="home.cta"]</code>. That mixes two different escape grammars — CSS
        identifier escaping and CSS string escaping — and getting it wrong turns a lookup into a
        syntax error or, worse, a subtly wrong match.
      </p>

      <p>This library sidesteps the problem entirely:</p>

      <CodeBlock
        lang="js"
        code={`// The selector is a constant, so nothing from your config reaches the CSS parser.
const candidates = root.querySelectorAll("[data-tour-id]");

const matches = [];
for (const element of candidates) {
  if (element.getAttribute("data-tour-id") === id) matches.push(element);
}`}
      />

      <h2>What that buys you</h2>

      <p>Every one of these resolves correctly, with nothing to escape:</p>

      <CodeBlock
        lang="js"
        code={`"home.cta"           // dots are ordinary characters
"settings.profile"
"nav/primary"
'a"b'                  // quotes
"a\\\\b"                // backslashes
"100%"                 // percentages
"[data-x]"             // brackets
"a:b"                  // pseudo-class syntax
"*"                    // wildcards`}
      />

      <h2>Dots are not paths</h2>

      <CodeBlock
        lang="js"
        code={`find("home")      // [] — no element has data-tour-id="home"
find("cta")      // [] — "home.cta" is one identifier, not two
find("home.cta") // [the button]`}
      />

      <Callout title="A mental model that works">
        <p>
          Think of <code>data-tour-id</code> as a database primary key, not a selector. You are
          looking up a row by an exact value; you are not writing a query.
        </p>
      </Callout>

      <h2>Duplicates are an error, not a coin flip</h2>

      <p>Two elements with the same identifier produce an actionable error:</p>

      <CodeBlock
        lang="text"
        code={`Target identifier "home.cta" matches 2 elements:
  <button id="a" class="cta">, <button id="b" class="cta">.
Target identifiers must be unique. Fix the duplicate attribute, or set
\`target.occurrence\` to 'first' or an index on each step that shares it.`}
      />

      <p>Two ways to resolve it:</p>

      <ul>
        <li>
          <strong>Fix the markup.</strong> Usually the right answer.
        </li>
        <li>
          <strong>Declare the intent.</strong> Set <code>target.occurrence</code> on every step that
          shares the identifier:
        </li>
      </ul>

      <CodeBlock
        lang="js"
        code={`// Explicitly take the first match.
{ tourId: "home.cta", title: "…", target: { occurrence: "first" } }

// Or pick a specific one, by zero-based index among the matches.
{ tourId: "home.cta", title: "…", target: { occurrence: 1 } }`}
      />

      <Callout title="Declared in configuration too" variant="warn">
        <p>
          Two steps in the <em>same tour</em> using the same identifier is rejected at
          <code>createTour()</code> time, unless every one of them opts in. That catches copy-paste
          errors before a user ever sees them.
        </p>
      </Callout>

      <h2>Selector and element targets</h2>

      <p>
        When an identifier genuinely will not do — a shadow-root target, a generated element — use
        an explicit alternative. These are separate from identifiers by design.
      </p>

      <CodeBlock
        lang="js"
        code={`// A selector you wrote. Validated, and a bad one reports clearly.
{ title: "…", target: { selector: "[data-panel='usage'] .cta" } }

// An element reference. Bypasses querying entirely — the only option that
// reaches into a shadow root.
{ title: "…", target: { element: shadowRoot.querySelector(".cta") } }

// Never both.
{ title: "…", target: { selector: "#a", element: el } } // throws`}
      />

      <h2>Hidden and detached targets</h2>

      <ul>
        <li>
          An element with <code>display: none</code> anywhere up its ancestor chain counts as
          hidden, not missing. The step still resolves; whether that is usable depends on
          <code>target.missing</code>.
        </li>
        <li>An element removed from the document counts as missing.</li>
        <li>
          If a target appears late — after a route change, say — the default
          <code>target.missing: "wait"</code> strategy waits for it.
          <a href={url("/docs/dynamic-dom/")}>Dynamic DOM integration</a>
        </li>
      </ul>

      <h2>Shadow DOM and iframes</h2>

      <p>
        <code>querySelectorAll</code> does not cross a shadow boundary, and neither can this
        library. Pass <code>target.element</code> instead. Cross-origin iframes are not supported at
        all.
      </p>
    </>
  );
}
