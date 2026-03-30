module.exports = {
  extends: ['expo', 'prettier'],
  rules: {
    'no-console': 'warn',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
};
