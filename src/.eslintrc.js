/* eslint-env node */
module.exports = {
  extends: [
    '../node_modules/@anjianshi/presets/eslint-base',
    '../node_modules/@anjianshi/presets/eslint-node',
    '../node_modules/@anjianshi/presets/eslint-typescript',
  ],
  rules: {
    '@typescript-eslint/strict-boolean-expressions': 'off',
  },
}
