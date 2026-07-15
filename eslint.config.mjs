import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import simpleImportSort from "eslint-plugin-simple-import-sort";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { "simple-import-sort": simpleImportSort },
    rules: {
      // Enforce grouped, ordered imports. Groups (separated by blank lines):
      //   1. side-effect imports (e.g. CSS)
      //   2. react / next / external packages
      //   3. internal non-UI (@/lib, @/db, @/server, @/generated)
      //   4. shadcn UI primitives (@/components/ui)
      //   5. app components (@/components/*)
      //   6. relative imports (./ , ../)
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^\\u0000"],
            ["^react", "^next", "^@?\\w"],
            ["^@/lib", "^@/db", "^@/server", "^@/generated"],
            ["^@/components/ui"],
            ["^@/components"],
            ["^@/"],
            ["^\\.\\./", "^\\./"],
          ],
        },
      ],
      "simple-import-sort/exports": "error",
      // Fetch-on-mount + shadcn's use-mobile legitimately setState in effects.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/generated/**",
  ]),
]);

export default eslintConfig;
