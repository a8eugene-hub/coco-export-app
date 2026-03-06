import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Next.js Route Handlers は context.params が Promise になったりして型が揺れるため、
      // ルートハンドラ内の `any` を許可して運用を簡単にする（MVPのたたき台優先）。
      "@typescript-eslint/no-explicit-any": "off",
    },
    files: ["src/app/api/**/*.ts"],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
    files: ["src/lib/supabaseClient.ts"],
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
