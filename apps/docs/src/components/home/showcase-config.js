/**
 * The interactive showcase tour — one definition, two consumers.
 *
 * `FeatureShowcase` (an island) runs this configuration; the home page prints
 * `SHOWCASE_CONFIG_JSON` in the configuration section, so the code a reader
 * sees is exactly the code the demo above it executes.
 */

export const SHOWCASE_CONFIG = {
  tourId: "home.showcase",
  theme: "system",
  showProgress: true,
  steps: [
    {
      tourId: "showcase.nav",
      title: "Navigation, highlighted",
      content:
        "The spotlight tracks the sidebar in real time. It is measured from the element, not drawn on a screenshot.",
      placement: "right",
    },
    {
      tourId: "showcase.search",
      title: "Any element can be a target",
      content: "A toolbar control, a metric card, a table — anything with a data-tour-id.",
      placement: "bottom",
    },
    {
      tourId: "showcase.create",
      title: "Guidance tied to actions",
      content: "Point at the primary action when it is the next thing a new user should do.",
      placement: "bottom-end",
    },
    {
      tourId: "showcase.table",
      title: "Dense interfaces welcome",
      content:
        "Placement adapts to the target, and the tooltip repositions if the viewport changes.",
      placement: "top",
    },
    {
      tourId: "showcase.metrics",
      title: "Then it gets out of the way",
      content:
        "Finish here, or skip at any time — either way the overlay and listeners are removed.",
      placement: "top-start",
    },
  ],
};

export const SHOWCASE_CONFIG_JSON = JSON.stringify(SHOWCASE_CONFIG, null, 2);
