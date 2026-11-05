import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      // lintText reuses fixture paths with different source, including in CI.
      // Immutable single-run TypeScript programs cannot track those changes.
      TSESTREE_SINGLE_RUN: 'false',
    },
  },
});
