import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-config-prettier/flat';

// no-undef は TypeScript の型チェックに任せる (flat/recommended で .ts に対して無効化される) ため globals は指定しない
export default [
  {
    ignores: ['**/dist/**', '**/node_modules/**', 'packages/bot/public/**', 'packages/bot/views/**'],
  },
  js.configs.recommended,
  ...tsPlugin.configs['flat/recommended'],
  prettier,
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      // ハンドラはインターフェースのシグネチャ (message, command, args 等) に合わせるため、未使用の引数は許容する
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
    },
  },
];
