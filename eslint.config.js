// @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'
import unusedImports from 'eslint-plugin-unused-imports'

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  ...tanstackConfig,
  prettierConfig,
  {
    plugins: {
      prettier: prettierPlugin,
      'unused-imports': unusedImports,
    },
    rules: {
      'prettier/prettier': 'error',

      // 🔥 Remove unused imports
      'unused-imports/no-unused-imports': 'error',

      // Optional: warn unused vars
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
]
