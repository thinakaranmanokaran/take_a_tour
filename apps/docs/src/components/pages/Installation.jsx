import CodeBlock from "../CodeBlock.jsx";
import Table from "../Table.jsx";
import Callout from "../Callout.jsx";

export default function Installation() {
  return (
    <>
      <h1>Installation</h1>
      <p className="lede">One package. One stylesheet import. No other setup.</p>

      <h2>npm</h2>

      <CodeBlock lang="bash" code={`npm install @take-a-tour/core`} />

      <Callout title="Not published yet" variant="warn">
        <p>
          <code>@take-a-tour/core</code> is not on the npm registry yet, so the command above
          returns a 404 until the first release. Until then, work from the repository: it is an npm
          workspace, the package lives in <code>packages/core</code>, and the docs app imports it
          directly with no aliasing.
        </p>
      </Callout>

      <CodeBlock
        lang="js"
        code={`import { createTour } from "@take-a-tour/core";
import "@take-a-tour/core/styles.css";`}
      />

      <h2>Entry points</h2>

      <Table
        head={["Specifier", "Resolves to", "Use for"]}
        rows={[
          [
            "<code>@take-a-tour/core</code>",
            "<code>src/index.js</code> (ESM)",
            "The normal entry. Tree-shakeable, no build step required.",
          ],
          [
            "<code>@take-a-tour/core</code> via <code>require()</code>",
            "<code>dist/index.cjs</code>",
            "CommonJS toolchains.",
          ],
          [
            "<code>@take-a-tour/core/styles.css</code>",
            "<code>styles/index.css</code>",
            "The design system. Import once, anywhere.",
          ],
        ]}
      />

      <Callout title="Import the CSS once">
        <p>
          The stylesheet is side-effect free of your application styles because every rule is scoped
          under <code>.tat-root</code> and every variable is prefixed <code>--tat-</code>. Import it
          wherever is convenient — it does not matter whether that is before or after your own CSS.
        </p>
      </Callout>

      <h2>Without a bundler</h2>

      <p>
        The package ships browser-compatible ESM, so an import map is enough. The paths below assume
        you have copied <code>src/</code> and <code>styles/</code> into your project, or are serving
        them from a package directory.
      </p>

      <CodeBlock
        lang="html"
        code={`<script type="importmap">
{
  "imports": {
    "@take-a-tour/core": "/vendor/take-a-tour/src/index.js"
  }
}
</script>

<link rel="stylesheet" href="/vendor/take-a-tour/styles/index.css" />
<script type="module">
  import { createTour } from "@take-a-tour/core";
  createTour({
    tourId: "demo",
    steps: [{ tourId: "cta", title: "Hello", content: "World" }],
  }).start();
</script>`}
      />

      <h2>Supported environments</h2>

      <Table
        head={["Environment", "Status"]}
        rows={[
          ["Modern browsers (ES2022)", "Supported"],
          ["Vite / webpack / Rollup / Parcel", "Supported"],
          ["React, Vue, Angular, Svelte", "Supported"],
          ["Node 18.18+ (for tooling)", "Supported"],
          ["Server-side rendering", "Safe — never touches <code>document</code> at import time"],
          ["Internet Explorer", "Not supported"],
        ]}
      />

      <h2>Verifying the install</h2>

      <CodeBlock
        lang="js"
        code={`import { VERSION, PLACEMENTS } from "@take-a-tour/core";

console.log(VERSION);     // "0.1.0"
console.log(PLACEMENTS.length); // 13`}
      />

      <h2>Nothing else is needed</h2>

      <p>
        There is no runtime dependency to install, and nothing is fetched at runtime. If you find a
        network request from this library, it is not this library — please report it.
      </p>
    </>
  );
}
