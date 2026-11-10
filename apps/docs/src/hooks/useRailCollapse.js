import { useEffect, useRef, useState } from "react";

/**
 * Expand/collapse state for a navigation rail.
 *
 * The state is applied as `is-nav-collapsed` on the rail's `.layout` ancestor:
 * on wide screens that folds the column away (a reopen control stays pinned to
 * the page edge), and on small screens it folds the rail's disclosure body.
 * Focus follows the control, so keyboard users are never dropped.
 */
export function useRailCollapse() {
  const [collapsed, setCollapsed] = useState(false);
  const navRef = useRef(null);
  const toggleRef = useRef(null);
  const reopenRef = useRef(null);
  const refocus = useRef(false);

  useEffect(() => {
    const layout = navRef.current?.closest(".layout");
    if (layout) layout.classList.toggle("is-nav-collapsed", collapsed);

    if (refocus.current) {
      refocus.current = false;
      const preferred = collapsed ? reopenRef.current : toggleRef.current;
      const target = preferred?.getClientRects().length ? preferred : toggleRef.current;
      target?.focus();
    }
  }, [collapsed]);

  const toggle = () => {
    refocus.current = true;
    setCollapsed((value) => !value);
  };

  return { collapsed, toggle, navRef, toggleRef, reopenRef };
}
