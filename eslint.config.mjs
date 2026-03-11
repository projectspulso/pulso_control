import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // During MVP stabilization we treat `any` as technical debt, not a hard blocker.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: ["lib/supabase/database.types.ts"],
    rules: {
      // Generated Supabase types contain shapes that trigger this rule noisily.
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
  {
    files: ["app/publicar/page.tsx"],
    rules: {
      // The page still carries legacy encoded copy; keep the MVP lint surface moving.
      "react/no-unescaped-entities": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Legacy scripts and support artifacts outside the MVP app surface.
    "content/**",
    "scripts/**",
    "database/**",
    "app/test/**",
    "app/teste/**",
    "app/organograma/**",
  ]),
]);

export default eslintConfig;
