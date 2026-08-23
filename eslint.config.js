// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');
const noRawDesignValues = require('./eslint-rules/no-raw-design-values');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    plugins: {
      local: {
        rules: {
          'no-raw-design-values': noRawDesignValues,
        },
      },
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'warn',
    },
  },
  {
    // Every screaming color / font hardcode must route through design tokens.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/theme/**'],
    rules: {
      'local/no-raw-design-values': 'error',
    },
  },
  prettierConfig,
]);
