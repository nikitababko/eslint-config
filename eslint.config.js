import { typescriptConfig } from './configs/typescript.js';
import { baseConfig } from './configs/base.js';

export default [
  ...baseConfig({ environment: 'node' }),
  ...typescriptConfig({
    tsconfigPath: './tsconfig.json',
    files: ['configs/**/*.js', 'eslint.config.js'],
  }),
];
