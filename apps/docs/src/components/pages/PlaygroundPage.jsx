import Callout from "../Callout.jsx";
import CodeBlock from "../CodeBlock.jsx";
import { STARTER } from "../playground/playground-presets.js";

/**
 * `/playground` — static copy around the playground island, which is passed
 * in as a child from the route shell.
 */
export default function PlaygroundPage({ children }) {
  return (
    <div className="page-wide">
      <article className="content">
        <h1>Playground</h1>
        <p className="lede">
          This runs the actual <code>@take-a-tour/core</code> package — the same code shipped in the
          repository, imported by name. There is no mock and no parallel implementation.
        </p>
      </article>

      {children}

      <article className="content">
        <h2>What to try</h2>

        <ul>
          <li>
            Change <code>"placement"</code> to <code>"left"</code>, <code>"right"</code> or{" "}
            <code>"top"</code> and restart.
          </li>
          <li>
            Switch <code>"theme"</code> between <code>light</code>, <code>dark</code> and{" "}
            <code>system</code>.
          </li>
          <li>
            Remove a step's <code>tourId</code> and press Start to read the validation error the
            library actually throws.
          </li>
          <li>
            Add a second element with the same <code>data-tour-id</code> in the console to see the
            ambiguity report.
          </li>
          <li>
            Open the <strong>CSS variables</strong> tab and uncomment{" "}
            <code>--tat-tooltip-width</code>.
          </li>
        </ul>

        <h2>Starting code</h2>

        <CodeBlock lang="json" code={STARTER} />

        <Callout title="The preview surface is real DOM">
          <p>
            The three elements in the preview carry real <code>data-tour-id</code> attributes, so
            target resolution, spotlight geometry and repositioning all behave exactly as they would
            in your application.
          </p>
        </Callout>
      </article>
    </div>
  );
}
