# Codemods

Dev-only scripts (spec 027). Not part of the Vitest projects' runtime or CI. They run on Node's built-in TypeScript support (Node >= 22.18) and use the `typescript` compiler API already in the repo.

## tailwind-semantic

Rewrites the retired semantic spacing, type and shadow classes to stock Tailwind in string literals of `className`, `cn()` and `cva()`. The mapping is derived from `src/styles.css` and `node_modules/tailwindcss/theme.css` on every run; `--mapping` prints it.

```bash
cd savepoint-tanstack
node scripts/codemods/tailwind-semantic.ts --mapping src/shared          # dry run, prints the diff
node scripts/codemods/tailwind-semantic.ts --write src/shared src/entities
pnpm exec prettier --write <changed files>                                # re-sorts classes
node scripts/codemods/tailwind-semantic.ts --usage src/shared             # which retired names remain where
node scripts/codemods/tailwind-semantic.ts --cross-file-report            # component variant vs call-site spacing
```

Two classes for the same property inside one literal (or the unconditional string arguments of one `cn()`) are reduced to the one Release 1 rendered; the run prints each removal. Template literals with substitutions are skipped and listed. The conflict rules need the Release 1 history (`b6056d73^`) to be available to git.
