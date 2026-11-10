import CodeBlock from "../CodeBlock.jsx";
import Table from "../Table.jsx";
import Callout from "../Callout.jsx";

export default function Persistence() {
  return (
    <>
      <h1>Persistence</h1>
      <p className="lede">
        Off by default. When you turn it on, the library stores two numbers and nothing else.
      </p>

      <Callout title="What is stored">
        <p>
          The tour id, the current step index, and a completed flag — under the key
          <code>take-a-tour:&#123;tourId&#125;</code>. No form values, no tokens, no personal data,
          no analytics.
        </p>
      </Callout>

      <h2>Enabling it</h2>

      <CodeBlock
        lang="js"
        code={`createTour({
  tourId: "dashboard-onboarding",
  persistence: {
    enabled: true,
    adapter: "localStorage",  // "memory" | "localStorage" | custom
    resume: true,             // start where the user left off
  },
  steps: [/* … */],
});`}
      />

      <h2>Options</h2>

      <Table
        head={["Option", "Default", "Notes"]}
        rows={[
          [
            "<code>enabled</code>",
            "<code>false</code>",
            "Nothing is read or written while this is false.",
          ],
          [
            "<code>adapter</code>",
            '<code>"memory"</code>',
            '<code>"memory"</code>, <code>"localStorage"</code>, or an adapter object.',
          ],
          [
            "<code>key</code>",
            "<code>take-a-tour:&#123;tourId&#125;</code>",
            "Change it if you need a different namespace.",
          ],
          [
            "<code>resume</code>",
            "<code>false</code>",
            "Start at the stored step instead of the first.",
          ],
          [
            "<code>resetOnComplete</code>",
            "<code>false</code>",
            "Ignore stored progress once a tour is complete.",
          ],
        ]}
      />

      <h2>Adapters</h2>

      <p>An adapter is three methods:</p>

      <CodeBlock
        lang="js"
        code={`const adapter = {
  name: "my-backend",
  get(key) { /* return the stored value, or null */ },
  set(key, value) { /* store it; return false if it failed */ },
  remove(key) { /* delete it */ },
};

createTour({
  tourId: "x",
  persistence: { enabled: true, adapter },
  steps: [/* … */],
});`}
      />

      <p>A real example backed by your own API:</p>

      <CodeBlock
        lang="js"
        code={`const serverAdapter = {
  name: "server",
  get: (key) => cache.get(key) ?? null,
  set: (key, value) => {
    cache.set(key, value);
    // Fire and forget; a failed write must not break the tour.
    void api.saveProgress(key, value).catch(() => {});
    return true;
  },
  remove: (key) => cache.delete(key),
};`}
      />

      <h2>Resetting progress</h2>

      <CodeBlock lang="js" code={`tour.resetProgress();   // clears this tour's stored state`} />

      <p>A "Replay the tour" button in your help menu is usually just that:</p>

      <CodeBlock
        lang="js"
        code={`document.querySelector("#replay-tour").addEventListener("click", () => {
  tour.resetProgress();
  tour.start({ ignorePersistence: true });
});`}
      />

      <h2>Only showing a tour once</h2>

      <CodeBlock
        lang="js"
        code={`const KEY = "take-a-tour:dashboard-onboarding";
const seen = JSON.parse(localStorage.getItem(KEY) ?? "{}");

if (!seen.completed) {
  tour.start();
}`}
      />

      <p>Or let the tour itself decide, with a conditional first step:</p>

      <CodeBlock
        lang="js"
        code={`createTour({
  tourId: "x",
  steps: [
    { title: "Welcome", content: "Only for first-time users.", centered: true,
      when: () => !hasSeenTour("x") },
    { tourId: "app.cta", title: "…", onEnter: markTourSeen },
  ],
});`}
      />

      <h2>Blocked or unavailable storage</h2>

      <p>
        <code>localStorage</code> throws rather than returning <code>null</code> in private browsing
        modes, when cookies are blocked, and in some embedded webviews. The adapter probes for
        availability inside a <code>try</code>/<code>catch</code>, falls back to in-memory storage,
        and never surfaces a storage failure to the user.
      </p>

      <CodeBlock
        lang="js"
        code={`// If storage is unavailable this still works — it just forgets on reload.
tour.getState();   // "running"
tour.resetProgress(); // no throw`}
      />

      <h2>Server-side rendering</h2>

      <p>
        Nothing is read at import time. On the server, <code>localStorage</code> does not exist, so
        the probe simply finds nothing and uses memory. Create tours in the browser, or guard with
        <code>typeof window !== "undefined"</code>.
      </p>

      <h2>Privacy checklist</h2>

      <ul>
        <li>Disabled by default — no surprise writes.</li>
        <li>Stores a step index and a boolean. That is all.</li>
        <li>
          Namespaced under <code>take-a-tour:</code> so it cannot collide with your keys.
        </li>
        <li>
          Clear it with <code>resetProgress()</code>, or by removing the key.
        </li>
      </ul>
    </>
  );
}
