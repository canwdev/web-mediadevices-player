import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  typescript: true,
  ignores: [
    '**/src-tauri/**',
    '**/dist/**',
    '**/node_modules/**',
  ],
  rules: {
    'no-console': 'off',
    'vue/max-attributes-per-line': 'off',
    'vue/no-v-html': 'off',
    'ts/ban-ts-comment': 'off',
    'ts/no-use-before-define': 'off',
    'unused-imports/no-unused-vars': 'off',
    'no-async-promise-executor': 'off',
    'no-useless-catch': 'off',
    'eqeqeq': 'warn',
    'e18e/prefer-static-regex': 'off',
    'ts/no-unsafe-function-type': 'off',
  },
})
