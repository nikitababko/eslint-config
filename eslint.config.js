import { typescriptConfig } from './configs/typescript.js';
import base from './configs/base.js';

export default [
  ...base,
  ...typescriptConfig({
    tsconfigPath: './tsconfig.json',
    files: ['configs/**/*.js', 'eslint.config.js'],
  }),
];
