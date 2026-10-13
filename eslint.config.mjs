import eslint from '@eslint/js'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'out/**',
      'release/**',
      '.cache/**',
      'coverage/**',
      'test-results/**',
      'playwright-report/**',
      'design/**',
      'binaries/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  jsxA11y.flatConfigs.recommended,
  reactHooks.configs.flat.recommended,
  {
    files: ['**/*.{ts,tsx,js,mjs}'],
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      complexity: ['error', 12],
      'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
      'no-console': 'error',
      'no-undef': 'off',
      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['src/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^#/i]',
          message: 'Use a semantic color token from styles/index.css.',
        },
        {
          selector: 'Literal[value=/rgba?\\(/i]',
          message: 'Use a semantic color token from styles/index.css.',
        },
        {
          selector: 'TemplateElement[value.raw=/#[0-9a-f]{3,8}/i]',
          message: 'Use a semantic color token from styles/index.css.',
        },
      ],
    },
  },
)
