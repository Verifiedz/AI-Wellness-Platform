/**
 * ESLint config — gradient enforcement.
 *
 * Strict guards apply ONLY to new redesign code under src/ui/v2/ and src/screens/v2/.
 * Existing files keep current rules during the migration. Each existing file becomes
 * subject to the strict rules once it has been rewritten on the redesign branch.
 */
module.exports = {
  extends: ['expo', 'prettier'],
  rules: {
    'no-console': 'warn',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      files: ['src/ui/v2/**/*.{js,jsx,ts,tsx}', 'src/screens/v2/**/*.{js,jsx,ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'react-native',
                importNames: [
                  'SafeAreaView',
                  'KeyboardAvoidingView',
                  'TouchableOpacity',
                  'TouchableHighlight',
                  'TouchableWithoutFeedback',
                  'TouchableNativeFeedback',
                  'Animated',
                ],
                message:
                  'Use the v2 design system primitive instead. ' +
                  'See docs/redesign/05-component-spec.md.',
              },
            ],
          },
        ],
        'react-hooks/exhaustive-deps': 'error',
      },
    },
  ],
};
