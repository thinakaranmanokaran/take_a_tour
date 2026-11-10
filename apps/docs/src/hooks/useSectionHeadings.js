import { useEffect, useState } from "react";
import { slugify } from "../lib/slugify.js";

/**
 * Reads the current page's section headings from the DOM (`#content`), not
 * from props, because every page renders its article with different
 * components. Text is whitespace-normalised exactly like the build step, which
 * writes the same list into the site rail's HTML — so the island's first
 * render matches what the server sent and hydration changes nothing.
 *
 * IDs are written into the built HTML by the search-index integration; in dev
 * they are generated here with the same shared slug so fragments resolve.
 *
 * `prerendered` gates only the first render: when the build step wrote the
 * list (its selector is in the DOM), the items are adopted immediately so
 * hydration finds exactly the server's markup; when it did not (dev, or a
 * page the build step leaves alone), the list fills in after mount.
 */
function readHeadings({ selector, minCount, prerendered }) {
  if (typeof document === "undefined") return [];
  if (prerendered && !document.querySelector(prerendered)) return [];
  const content = document.getElementById("content");
  if (!content) return [];

  const nodes = [...content.querySelectorAll(selector)];
  if (nodes.length < minCount) return [];

  return nodes.map((node) => {
    if (!node.id) node.id = slugify(node.textContent ?? "");
    return {
      id: node.id,
      text: (node.textContent ?? "").replace(/\s+/g, " ").trim(),
      level: node.tagName === "H3" ? 3 : 2,
    };
  });
}

/**
 * Collects the section headings of the current page's main content and tracks
 * which one the reader is on, with the same scroll-spy used by the table of
 * contents. The public site rail and both "On this page" variants share this
 * hook so their lists can never disagree with the rendered article.
 */
export function useSectionHeadings({ selector = "h2, h3", minCount = 3, prerendered } = {}) {
  const [items, setItems] = useState(() => readHeadings({ selector, minCount, prerendered }));
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    const collected = readHeadings({ selector, minCount });
    setItems(collected);
    if (collected.length === 0) return undefined;

    let frame = 0;
    const update = () => {
      frame = 0;
      let current = collected[0]?.id ?? null;
      for (const item of collected) {
        const element = document.getElementById(item.id);
        if (element && element.getBoundingClientRect().top <= 120) current = item.id;
      }
      setActiveId(current);
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [selector, minCount]);

  return { items, activeId };
}
