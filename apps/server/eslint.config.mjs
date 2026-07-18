import { defineConfig, globalIgnores } from "eslint/config";
import simpleImportSort from "eslint-plugin-simple-import-sort";

const eslintConfig = defineConfig([
  {
    plugins: { "simple-import-sort": simpleImportSort },
    rules: {
      // Grouped, ordered imports. Groups (separated by blank lines):
      //   1. side-effect imports
      //   2. external packages
      //   3. internal (@/lib, @/db, @/server, @/generated)
      //   4. relative imports (./ , ../)
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^\\u0000"],
            ["^@?\\w"],
            ["^@/lib", "^@/db", "^@/server", "^@/generated", "^@/"],
            ["^\\.\\./", "^\\./"],
          ],
        },
      ],
      "simple-import-sort/exports": "error",
    },
  },
  globalIgnores(["src/generated/**", "node_modules/**", "dist/**"]),
]);

export default eslintConfig;
