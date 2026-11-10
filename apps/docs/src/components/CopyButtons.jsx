import { useEffect } from "react";

/**
 * One hydrated island gives every code block its copy button — and the hero's
 * install command too. `client:idle` so it never competes with first paint.
 *
 * The button markup itself is static: a page with a hundred code blocks still
 * ships exactly one island for copying, not a hundred.
 */
export default function CopyButtons() {
  useEffect(() => {
    const onClick = async (event) => {
      const button = event.target.closest("[data-copy]");
      if (!button) return;

      const block = button.closest(".code-block");
      const code =
        button.dataset.copyText ?? (block ? (block.querySelector("code")?.textContent ?? "") : "");
      if (!code) return;

      try {
        await navigator.clipboard.writeText(code);
        button.textContent = "Copied";
      } catch {
        button.textContent = "Press Ctrl+C";
      }

      window.setTimeout(() => {
        button.textContent = "Copy";
      }, 1600);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
