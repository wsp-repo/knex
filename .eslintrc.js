const jsEslintConfig = require('@zalib/linter/eslint/node-js');
const tsEslintConfig = require('@zalib/linter/eslint/node-ts');

module.exports = {
  overrides: [
    {
      ...jsEslintConfig,
      files: ['*.js'],
    },
    {
      ...tsEslintConfig,
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        include: ['./src/**/*.ts'],
        project: './tsconfig.json',
      },
    },
  ],
  root: true,
};
