import CodeBlock from "../CodeBlock.jsx";
import Table from "../Table.jsx";
import Callout from "../Callout.jsx";
import { url } from "../../config/site.js";

export default function CoreConcepts() {
  return (
    <>
      <h1>Core concepts</h1>
      <p className="lede">Four decisions explain most of how the library behaves.</p>

      <h2>1 · One engine, JSON configuration, one design system</h2>

      <p>
        Every tour is the same thing: a validated configuration object, a state machine driving it,
        and a set of components rendering it. There is no per-tour customisation path that bypasses
        the design system, so a tour can never look like it came from somewhere else.
      </p>

      <h2>2 · The UI does not own the logic</h2>

      <p>The engine drives the renderer through a narrow contract:</p>

      <CodeBlock
        lang="js"
        code={`// The entire contract between engine and UI.
{
  mount(payload, { stack }),
  present(context, { stack }),
  refresh(context, { stack }),
  setTheme(theme, { stack }),
  unmount(),
}`}
      />

      <p>
        The engine never imports a component, and a component never calls <code>next()</code>{" "}
        directly — it calls back through handlers. That separation is why the whole engine is
        unit-testable without a DOM, and why the UI could be replaced without forking anything.
      </p>

      <h2>3 · Tour identity is separate from target identity</h2>

      <p>
        A tour is identified by <code>tourId</code> in the registry. A step is anchored to an
        element by a <em>target identifier</em>, which happens to also be named <code>tourId</code>{" "}
        because it is the value of the step's <code>data-tour-id</code>.
      </p>

      <Table
        head={["", "Tour identity", "Target identity"]}
        rows={[
          ["Example", '<code>"home-onboarding"</code>', '<code>"home.cta"</code>'],
          ["Uniqueness", "Global, per document", "Per document for <code>data-tour-id</code>"],
          ["Used for", "Registry, lookup, persistence key", "DOM lookup"],
          ["Matched by", "Exact string equality", "Exact attribute value equality"],
        ]}
      />

      <h2>4 · Nothing happens implicitly behind your back</h2>

      <ul>
        <li>
          <strong>No network.</strong> There is no <code>fetch</code> in the source. Icons are local
          SVG path data.
        </li>
        <li>
          <strong>No storage writes.</strong> Persistence is off by default and writes only a step
          index and a completed flag.
        </li>
        <li>
          <strong>No markup injection.</strong> Configuration text is inserted with{" "}
          <code>textContent</code>. There is exactly one opt-in for authored HTML, in its own file.
        </li>
        <li>
          <strong>No global mutation.</strong> No prototype patching, no globals, no unrequested{" "}
          <code>window</code> properties.
        </li>
      </ul>

      <Callout title="Configuration precedence">
        <p>
          Built-in defaults → <code>configureTour(&#123; defaults &#125;)</code> → tour
          configuration → step configuration → <code>tour.update()</code>. Later sources win, and
          the result is re-validated and frozen.{" "}
          <a href={url("/docs/configuration/")}>Full reference</a>.
        </p>
      </Callout>

      <h2>Vocabulary</h2>

      <Table
        head={["Term", "Meaning"]}
        rows={[
          ["Tour", "One configured sequence of steps, with its own id"],
          ["Step", "One entry in <code>steps</code>; may or may not be anchored to an element"],
          ["Target", "The DOM element a step points at"],
          ["Surface", "The tooltip or modal currently on screen"],
          ["Spotlight", "The cut-out highlight around the target"],
          ["Root", "The single container element the tour owns"],
        ]}
      />
    </>
  );
}
