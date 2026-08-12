import { defineConfig } from "eslint/config"
import nextCoreWebVitals from "eslint-config-next/core-web-vitals"

/**
 * `eslint-config-next/core-web-vitals` already registers the @typescript-eslint
 * plugin and its parser (as `next/typescript`), but enables none of its rules.
 *
 * So the recommended set is pulled off that same plugin instance rather than
 * from our own import: registering a second copy under the same name is what
 * ESLint rejects with "Cannot redefine plugin".
 */
const typescriptPlugin = nextCoreWebVitals.find(
  (config) => config.plugins?.["@typescript-eslint"],
)?.plugins["@typescript-eslint"]

if (!typescriptPlugin) {
  throw new Error(
    "eslint-config-next no longer registers @typescript-eslint; update this config.",
  )
}

export default defineConfig([
  {
    ignores: [
      ".next/**",
      "next-env.d.ts",
      "test-results/**",
      "playwright-report/**",
      "blob-report/**",
    ],
  },
  ...nextCoreWebVitals,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      ...typescriptPlugin.configs.recommended.rules,

      // The codebase already signals "deliberately unused" two ways: an
      // underscore prefix, and dropping a prop by destructuring it out
      // alongside a `...rest`.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
])
