// eslint-config-next 16 ships flat configs directly, so the FlatCompat
// bridge this file used to need is gone — importing them through
// `@eslint/eslintrc` now throws a circular-structure error rather than
// working. See node_modules/next/dist/docs/01-app/03-api-reference/05-config/03-eslint.md.
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTypescript,
  // Override eslint-config-next's default ignores, which these replace.
  globalIgnores([
    // `**/` so build output inside a nested checkout is skipped too.
    "**/.next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Git worktrees created under .claude/ are separate checkouts of this
    // same repo. Linting them re-reports every problem against generated
    // files nobody edits by hand.
    ".claude/worktrees/**",
  ]),
]);

export default eslintConfig;
