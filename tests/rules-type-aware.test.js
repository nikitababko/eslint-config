import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';
import path from 'path';
import { fileURLToPath } from 'url';

import { typescriptConfig } from '../configs/typescript.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

function createESLint() {
  return new ESLint({
    overrideConfigFile: true,
    overrideConfig: typescriptConfig({
      tsconfigPath: path.join(fixturesDir, 'tsconfig.json'),
      tsconfigRootDir: fixturesDir,
    }),
  });
}

async function lintFile(filename) {
  const eslint = createESLint();
  const results = await eslint.lintFiles([path.join(fixturesDir, filename)]);
  return results[0].messages;
}

function hasRule(messages, ruleId) {
  return messages.some((m) => m.ruleId === ruleId);
}

// ─── @typescript-eslint/no-floating-promises ─────────────────────────────────

describe('@typescript-eslint/no-floating-promises', () => {
  it('errors on unhandled floating promise inside sync function', async () => {
    const msgs = await lintFile('floating-promise.ts');
    expect(hasRule(msgs, '@typescript-eslint/no-floating-promises')).toBe(true);
  });
});

// ─── @typescript-eslint/no-misused-promises ──────────────────────────────────

describe('@typescript-eslint/no-misused-promises', () => {
  it('errors on async callback where sync callback is expected', async () => {
    const msgs = await lintFile('misused-promise.ts');
    expect(hasRule(msgs, '@typescript-eslint/no-misused-promises')).toBe(true);
  });
});

// ─── @typescript-eslint/naming-convention (boolean prefix) ───────────────────

describe('@typescript-eslint/naming-convention', () => {
  it('errors on boolean variable without required prefix', async () => {
    const msgs = await lintFile('naming-bool-bad.ts');
    expect(hasRule(msgs, '@typescript-eslint/naming-convention')).toBe(true);
  });

  it('allows boolean variable with is/has/should/can prefix', async () => {
    const msgs = await lintFile('naming-bool-good.ts');
    expect(hasRule(msgs, '@typescript-eslint/naming-convention')).toBe(false);
  });

  it('allows boolean object properties used as rule options', async () => {
    const msgs = await lintFile('naming-bool-property-good.ts');
    expect(hasRule(msgs, '@typescript-eslint/naming-convention')).toBe(false);
  });
});
