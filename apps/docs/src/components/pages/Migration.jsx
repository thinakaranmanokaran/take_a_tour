import CodeBlock from "../CodeBlock.jsx";
import Table from "../Table.jsx";
import Callout from "../Callout.jsx";

export default function Migration() {
  return (
    <>
      <h1>Migration and versioning</h1>
      <p className="lede">
        What counts as breaking, what gets deprecated, and how to upgrade between milestones.
      </p>

      <h2>Semantic versioning</h2>

      <p>
        Take a Tour follows <a href="https://semver.org">SemVer</a> strictly.
      </p>

      <Table
        head={["Change", "Release"]}
        rows={[
          ["Bug fix, no API change", "Patch — <code>0.1.4</code>"],
          ["New option, new event, new component", "Minor — <code>0.2.0</code>"],
          [
            "Option removed or retyped, event renamed, default changed",
            "Major — <code>1.0.0</code>",
          ],
        ]}
      />

      <Callout title="Before 1.0.0">
        <p>
          While the version is <code>0.x</code>, minor releases may adjust the API for consistency.
          Every such change is listed in the changelog. Treat <code>0.x</code> as a preview and pin
          exactly if that matters to you.
        </p>
      </Callout>

      <h2>Stability promises</h2>

      <p>These will not change without a major release:</p>

      <ul>
        <li>The method names on the tour instance.</li>
        <li>Configuration option names and their types.</li>
        <li>Event names and the fields in their payloads.</li>
        <li>
          Error class names and their <code>code</code> values.
        </li>
        <li>The CSS custom property names, so your overrides keep working.</li>
        <li>
          The <code>data-tour-id</code> contract — an identifier is matched as an exact string, and
          duplicates raise an error rather than being resolved silently.
        </li>
        <li>Zero runtime dependencies. Adding one will not happen in a minor release.</li>
      </ul>

      <h2>Deprecation practice</h2>

      <p>
        Nothing is removed in a minor release. A deprecated option keeps working for at least one
        minor cycle, logs a warning when <code>debug</code> is enabled, and is listed in the
        changelog with its replacement.
      </p>

      <h2>Upgrading</h2>

      <h3>0.1.x</h3>

      <p>Nothing to do. Patch releases contain only fixes.</p>

      <h3>Checking before an upgrade</h3>

      <CodeBlock
        lang="bash"
        code={`npm outdated @take-a-tour/core
npm ls @take-a-tour/core`}
      />

      <p>
        Version 0.1.0 is the current release. These two commands show the installed version and
        whether a newer one is available; the changelog always lists what changed.
      </p>

      <h3>Verifying the runtime dependency count yourself</h3>

      <CodeBlock
        lang="bash"
        code={`npm ls --omit=dev --all | grep take-a-tour
# @take-a-tour/core@0.1.0
# └── (no dependencies)`}
      />

      <h2>Forward compatibility</h2>

      <p>
        Unknown options are <strong>rejected</strong>, not ignored. That is deliberate: a misspelled
        option that is silently ignored is worse than one that throws, because the tour would run
        with the wrong configuration and you would never find out.
      </p>

      <CodeBlock
        lang="js"
        code={`createTour({ tourId: "x", placement: "bottom", steps: [/* … */] });  // fine
createTour({ tourId: "x", placment: "bottom", steps: [/* … */] });      // throws`}
      />

      <h2>Versioning the configuration separately</h2>

      <p>
        If you store tours as JSON — in a CMS, a database or a JSON file — you control that format
        yourself. The library validates it on load, so a stale or hand-edited configuration fails
        immediately with a precise message rather than at the point the target cannot be found.
      </p>

      <CodeBlock
        lang="js"
        code={`import tours from "./tours.json";

for (const config of tours) {
  createTour(config); // throws TourConfigError with the exact path
}`}
      />

      <h2>Browser support</h2>

      <p>
        Targets ES2022 and modern browsers. Dropping an old browser is a major release, and it would
        come with a documented polyfill or a transpiled build path.
      </p>
    </>
  );
}
