import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jestDom from "eslint-plugin-jest-dom";
import testingLibrary from "eslint-plugin-testing-library";
import boundaries from "eslint-plugin-boundaries";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      ".output/**",
      "build/**",
      "coverage/**",
      ".tanstack/**",
      "src/routeTree.gen.ts",
      "eslint.config.mjs",
      "prettier.config.mjs",
      "vite.config.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["test/**/*.{ts,tsx,mjs,cjs,js}", "**/*.config.{ts,mjs,cjs,js}"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
      },
    },
  },
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  // Component sidecar convention enforcement.
  //
  // `.tsx` files export components only; component-unique value exports
  // (helpers, constants, objects) live in a `<name>.utility.ts` sidecar and
  // types in `<name>.type.ts`. `allowConstantExport: false` makes the rule
  // flag every non-component value export, not just functions — that is the
  // mechanical half of the convention. The other half (non-exported internals
  // + types, which react-refresh cannot see) is prescribed in
  // .claude/rules/tanstack/components.md.
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      "react-refresh": reactRefresh,
    },
    rules: {
      "react-refresh/only-export-components": [
        "error",
        { allowConstantExport: false, allowExportNames: [] },
      ],
    },
  },
  // TanStack file-based routes are framework-canonical: each route file
  // exports `const Route = createFileRoute(...)({ component: LocalComponent })`
  // and defines its thin route component locally. react-refresh cannot fast-
  // refresh that shape (the file's only export is the non-component `Route`),
  // and the shape is mandated by the router's file-based codegen + the thin-
  // route convention (routes.md) — so it is exempt, like shadcn primitives.
  {
    files: ["src/routes/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  // `src/shared/ui/**` is shadcn-derived primitives only (see shared.md). Those
  // primitives canonically export a `Component + variants` pair
  // (`Button`/`buttonVariants`, …); flagging that would force divergence from
  // the shadcn registry / CLI re-add workflow. Exempt the layer.
  {
    files: ["src/shared/ui/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    plugins: {
      "testing-library": testingLibrary,
      "jest-dom": jestDom,
    },
    rules: {
      "testing-library/await-async-queries": "error",
      "testing-library/no-await-sync-queries": "error",
      "testing-library/no-debugging-utils": "warn",
      "testing-library/prefer-screen-queries": "error",
      "testing-library/no-container": "error",
      "testing-library/no-node-access": "error",
      "jest-dom/prefer-checked": "error",
      "jest-dom/prefer-enabled-disabled": "error",
      "jest-dom/prefer-required": "error",
      "jest-dom/prefer-to-have-attribute": "error",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Tests that assert `<Link>` rendering by walking from the rendered text
  // up to its closest ancestor anchor are an idiomatic pattern when the
  // router is mocked to plain `<a>` (precedent: `command-palette.test.tsx`,
  // `library-card-menu.test.tsx`). `.closest()` is the cleanest assertion
  // shape — `no-node-access` is intentionally relaxed for these files.
  {
    files: [
      "src/features/command-palette/ui/command-palette/command-palette.test.tsx",
      "src/features/command-palette/ui/game-result-item/game-result-item.test.tsx",
      "src/features/command-palette/ui/palette-navigation-group/palette-navigation-group.test.tsx",
      // RunStatusBadge test queries the Lucide SVG icon via document.querySelector —
      // there is no accessible role/name on a bare <svg aria-hidden>; direct access
      // is the only viable approach here.
      "src/entities/playthrough/ui/run-status-badge/run-status-badge.test.tsx",
      // Slice-5 (016) tests detect italic body text via closest("em") — bare <em>
      // has no accessible role, so direct DOM traversal is the only viable approach.
      "src/widgets/game-detail/ui/playthrough-timeline/nested-journal.test.tsx",
      "src/widgets/game-detail/ui/journal-feed/journal-feed.test.tsx",
    ],
    rules: {
      "testing-library/no-node-access": "off",
    },
  },
  // FSD layer boundary enforcement — applies only to src/**
  //
  // Design (Slice 23 remediation):
  //
  // 1. LAYER DIRECTION: app > routes > widgets > features > entities > shared.
  //    Lower never imports upper.
  //
  // 2. ROUTES → APP: `routes/__root.tsx` legitimately wires the app shell
  //    (ErrorBoundary, SavepointThemeProvider, CSS side-effect). Allowing
  //    routes→app is cleaner than relocating root-shell providers into a
  //    different layer. The rule allows it.
  //
  // 3. SAME-LAYER BARREL RE-EXPORTS: `app/index.ts` and `widgets/index.ts`
  //    re-export their own slices — these are same-layer barrel imports, NOT
  //    cross-slice violations.
  //
  // 4. FEATURES: cross-slice feature→feature imports are forbidden. Same-slice
  //    intra-feature imports (barrel re-exports, ui→model, etc.) are allowed
  //    by using the per-slice capture group and requiring the `slice` capture
  //    value to match (via Handlebars `{{from.captured.slice}}`).
  //
  // 5. ENTITIES: same as features — cross-slice forbidden, same-slice allowed.
  //
  // 6. WIDGETS → WIDGETS: composition IS allowed per documented policy
  //    (widgets.md). The linter does not forbid it; carve-outs are tracked in
  //    DIVERGENCES.md (human + code-review discipline, not linter-enforced).
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    plugins: {
      boundaries,
    },
    settings: {
      // Without an explicit resolver, eslint-plugin-boundaries falls back to
      // the bundled node resolver, which cannot resolve the `@/`, `#/`, and
      // `@env` TypeScript path aliases. The target of every aliased import
      // then resolves to nothing, so boundaries/dependencies silently allows
      // it. The TS resolver reads tsconfig `paths`, making aliased imports
      // visible to the rule. Regression-guarded by test/eslint/.
      "import/resolver": {
        typescript: {
          project: new URL("./tsconfig.json", import.meta.url).pathname,
        },
        node: true,
      },
      "boundaries/ignore": [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.spec.ts",
        "**/*.spec.tsx",
      ],
      // Enable legacy Handlebars template syntax (`${from.slice}`) in
      // captured-value matchers. Required for same-slice allow rules where the
      // `to` captured value must match the `from` captured value.
      "boundaries/legacy-templates": true,
      "boundaries/elements": [
        // app and widgets: no per-slice capture — all internal re-exports allowed.
        { type: "app", pattern: "src/app/**/*", mode: "file" },
        { type: "routes", pattern: "src/routes/**/*", mode: "file" },
        { type: "widgets", pattern: "src/widgets/**/*", mode: "file" },
        // features and entities: per-slice capture so cross-slice can be
        // distinguished from same-slice (barrel re-exports, intra-slice) imports.
        {
          type: "feature",
          pattern: "src/features/([^/]+)/**/*",
          capture: ["slice"],
          mode: "file",
        },
        {
          type: "entity",
          pattern: "src/entities/([^/]+)/**/*",
          capture: ["slice"],
          mode: "file",
        },
        { type: "shared", pattern: "src/shared/**/*", mode: "file" },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          rules: [
            // ── app ────────────────────────────────────────────────────────
            // app/index.ts re-exports its own slices (same-type). app may
            // also import down from all layers.
            {
              from: "app",
              allow: ["app", "routes", "widgets", "feature", "entity", "shared"],
            },
            // ── routes ─────────────────────────────────────────────────────
            // routes/__root.tsx imports @/app (ErrorBoundary, theme provider,
            // CSS side-effect). Allow routes→app for the root-shell seam.
            {
              from: "routes",
              allow: ["app", "widgets", "feature", "entity", "shared"],
            },
            // ── widgets ────────────────────────────────────────────────────
            // Widget→widget composition is ALLOWED by policy (widgets.md).
            // Carve-outs must be documented in DIVERGENCES.md.
            {
              from: "widgets",
              allow: ["widgets", "feature", "entity", "shared"],
            },
            // ── features ───────────────────────────────────────────────────
            // Cross-slice feature→feature imports are FORBIDDEN.
            // Same-slice imports are allowed (barrel re-exports, intra-slice
            // model/ui/api cross-references within the same feature).
            {
              from: "feature",
              allow: [
                // Same-slice only: captured "slice" value must match.
                // `${from.slice}` is the legacy template form; legacyTemplates
                // setting is enabled so this resolves to the `from` element's
                // captured `slice` value at evaluation time.
                ["feature", { slice: "${from.slice}" }],
                "entity",
                "shared",
              ],
            },
            // ── entities ───────────────────────────────────────────────────
            // Cross-slice entity→entity imports are FORBIDDEN.
            {
              from: "entity",
              allow: [
                // Same-slice only: captured "slice" value must match.
                ["entity", { slice: "${from.slice}" }],
                "shared",
              ],
            },
            // ── shared ─────────────────────────────────────────────────────
            {
              from: "shared",
              allow: ["shared"],
            },
          ],
        },
      ],
      "boundaries/no-unknown": "off",
      "boundaries/no-unknown-files": "off",
    },
  },
  prettier,
);
