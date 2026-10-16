import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-config-prettier";

/**
 * ESLint 9 flat configuration.
 *
 * Environment separation matters here: the published library source must only
 * ever see browser globals, so an accidental `process.env` or `require` in
 * `packages/core/src` is a lint error rather than a runtime surprise.
 */
export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.output/**",
      "**/.astro/**",
      "**/coverage/**",
      "**/playwright-report/**",
      "**/test-results/**",
      "referance/**",
      // ESLint has no parser for these without extra plugins.
      "**/*.jsx",
      "**/*.tsx",
      "**/*.vue",
      "**/*.astro",
      "**/*.d.ts",
    ],
  },

  js.configs.recommended,

  // --- Published library source: browser only ---------------------------
  {
    files: ["packages/core/src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-console": ["error", { allow: ["warn", "error"] }],
      curly: ["error", "multi-line"],
      "object-shorthand": ["error", "properties"],
      "no-implicit-coercion": "off",

      // Plain text must always go through textContent. `innerHTML` and
      // `outerHTML` are banned everywhere in src except the single, explicitly
      // named trusted-HTML module, which is opted into per tour and documented
      // in SECURITY.md.
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[property.name=/^(innerHTML|outerHTML)$/]",
          message:
            "Raw HTML injection is forbidden. Use textContent; trusted markup belongs in components/content/unsafe-html.js.",
        },
      ],
      "no-restricted-globals": [
        "error",
        {
          name: "eval",
          message: "eval is forbidden. Build DOM with createElement + textContent.",
        },
        {
          name: "Function",
          message: "Function constructor is forbidden.",
        },
        {
          name: "XMLHttpRequest",
          message: "The core package must not perform network requests.",
        },
        {
          name: "fetch",
          message: "The core package must not perform network requests.",
        },
      ],
    },
  },

  // The one sanctioned innerHTML site, isolated in its own module so the ban
  // above has exactly one, auditable exception.
  {
    files: ["packages/core/src/components/content/unsafe-html.js"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },

  // The logger is the single sanctioned `console.log` site: it is gated behind
  // the opt-in `debug` flag and never prints application content.
  {
    files: ["packages/core/src/utilities/logger.js"],
    rules: {
      "no-console": "off",
    },
  },

  // --- Build scripts, config files, test suites --------------------------
  // Plain JavaScript only. JSX, Vue SFCs and Astro files need their own
  // parsers/plugins, which are not installed — they are excluded rather than
  // half-configured, because a parse error on every file is worse than no lint.
  {
    files: [
      "**/*.js",
      "**/*.mjs",
      "**/*.cjs",
      "packages/core/tests/**/*.js",
      "packages/core/scripts/**/*.mjs",
    ],
    ignores: ["**/node_modules/**", "**/dist/**", "**/.astro/**"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-console": "off",
      // Tests deliberately poke at global APIs and hold long-lived state.
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", caughtErrors: "none" }],
    },
  },

  // --- Files ESLint has no parser for ------------------------------------
  // Covered by type-checking and the build instead.
  {
    ignores: ["apps/docs/src/**/*.ts"],
  },

  prettier,
];
