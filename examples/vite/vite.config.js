import { defineConfig } from "vite";

export default defineConfig({
  server: { port: 5173 },
  build: {
    // The library is plain ESM, so no special handling is needed. This is
    // visible proof that the published ESM entry tree-shakes cleanly.
    target: "es2022",
  },
});
