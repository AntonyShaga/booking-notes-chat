import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "plugin:prettier/recommended"),
  {
    rules: {
      "prettier/prettier": [
        "error",
        {
          printWidth: 100,
          semi: true,
          singleQuote: false,
          trailingComma: "es5",
          tabWidth: 2,
          endOfLine: "auto",
        },
      ],
    },
  },
];

export default eslintConfig;
