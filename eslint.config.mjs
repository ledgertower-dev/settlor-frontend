import nextConfig from 'eslint-config-next'
import eslintConfigPrettier from 'eslint-config-prettier'

const eslintConfig = [
  ...nextConfig,
  eslintConfigPrettier,
  {
    rules: {
      'no-console': 'warn',
    },
  },
  {
    // Encapsulation guardrail: features must not reach into each other's
    // internal files. Import from the feature barrel (@/features/<name>) or a
    // segment barrel (@/features/<name>/model), never @/features/<name>/model/<file>.
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/api/**', '@/features/*/model/**', '@/features/*/components/**'],
              message:
                'Do not deep-import another feature’s internals. Import from its barrel (@/features/<name>) or segment barrel (@/features/<name>/model).',
            },
          ],
        },
      ],
    },
  },
]

export default eslintConfig
