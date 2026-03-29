import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';

import tsParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

import { reactLayer } from '../configs/react-layer.js';

const [{ rules: reactRules }] = reactLayer();

function createESLint(rules) {
  return new ESLint({
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['**/*.jsx'],
        languageOptions: {
          parser: tsParser,
          parserOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            ecmaFeatures: { jsx: true },
          },
        },
        settings: { react: { version: '19' } },
        plugins: { react, 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
        rules,
      },
    ],
  });
}

async function lintJSX(code, rules) {
  const eslint = createESLint(rules);
  const results = await eslint.lintText(code, { filePath: 'Component.jsx' });
  return results[0].messages;
}

function hasRule(messages, ruleId) {
  return messages.some((m) => m.ruleId === ruleId);
}

function severityOf(messages, ruleId) {
  return messages.find((m) => m.ruleId === ruleId)?.severity;
}

// ─── react/jsx-no-useless-fragment ───────────────────────────────────────────

describe('react/jsx-no-useless-fragment', () => {
  const rule = {
    'react/jsx-no-useless-fragment': reactRules['react/jsx-no-useless-fragment'],
  };

  it('errors on fragment wrapping a single element', async () => {
    expect(
      hasRule(
        await lintJSX('const App = () => <><div /></>;', rule),
        'react/jsx-no-useless-fragment',
      ),
    ).toBe(true);
  });

  it('allows element without unnecessary fragment', async () => {
    expect(
      hasRule(await lintJSX('const App = () => <div />;', rule), 'react/jsx-no-useless-fragment'),
    ).toBe(false);
  });
});

// ─── react/no-multi-comp ─────────────────────────────────────────────────────

describe('react/no-multi-comp', () => {
  const rule = { 'react/no-multi-comp': reactRules['react/no-multi-comp'] };

  it('errors on multiple components in one file', async () => {
    const code = 'const A = () => <div />;\nconst B = () => <div />;';
    expect(hasRule(await lintJSX(code, rule), 'react/no-multi-comp')).toBe(true);
  });

  it('allows a single component', async () => {
    expect(hasRule(await lintJSX('const A = () => <div />;', rule), 'react/no-multi-comp')).toBe(
      false,
    );
  });
});

// ─── react/self-closing-comp ──────────────────────────────────────────────────

describe('react/self-closing-comp', () => {
  const rule = { 'react/self-closing-comp': reactRules['react/self-closing-comp'] };

  it('errors on element with no children using explicit closing tag', async () => {
    expect(
      hasRule(await lintJSX('const App = () => <div></div>;', rule), 'react/self-closing-comp'),
    ).toBe(true);
  });

  it('allows self-closing element', async () => {
    expect(
      hasRule(await lintJSX('const App = () => <div />;', rule), 'react/self-closing-comp'),
    ).toBe(false);
  });
});

// ─── react/no-array-index-key ────────────────────────────────────────────────

describe('react/no-array-index-key', () => {
  const rule = { 'react/no-array-index-key': reactRules['react/no-array-index-key'] };

  it('errors on array index used as key', async () => {
    const code = 'const App = () => items.map((item, index) => <li key={index}>{item}</li>);';
    expect(hasRule(await lintJSX(code, rule), 'react/no-array-index-key')).toBe(true);
  });

  it('allows stable key prop', async () => {
    const code = 'const App = () => items.map((item) => <li key={item.id}>{item.name}</li>);';
    expect(hasRule(await lintJSX(code, rule), 'react/no-array-index-key')).toBe(false);
  });
});

// ─── react/jsx-boolean-value ─────────────────────────────────────────────────

describe('react/jsx-boolean-value', () => {
  const rule = { 'react/jsx-boolean-value': reactRules['react/jsx-boolean-value'] };

  it('errors on explicit true value in JSX attribute', async () => {
    expect(
      hasRule(
        await lintJSX('const App = () => <input disabled={true} />;', rule),
        'react/jsx-boolean-value',
      ),
    ).toBe(true);
  });

  it('allows implicit true in JSX attribute', async () => {
    expect(
      hasRule(
        await lintJSX('const App = () => <input disabled />;', rule),
        'react/jsx-boolean-value',
      ),
    ).toBe(false);
  });
});

// ─── react/jsx-key ────────────────────────────────────────────────────────────

describe('react/jsx-key', () => {
  const rule = { 'react/jsx-key': reactRules['react/jsx-key'] };

  it('errors on JSX element in array without key', async () => {
    expect(
      hasRule(await lintJSX('const App = () => [<li />, <li />];', rule), 'react/jsx-key'),
    ).toBe(true);
  });

  it('allows JSX elements with key in array', async () => {
    expect(
      hasRule(
        await lintJSX('const App = () => [<li key="a" />, <li key="b" />];', rule),
        'react/jsx-key',
      ),
    ).toBe(false);
  });
});

// ─── react/react-in-jsx-scope ────────────────────────────────────────────────

describe('react/react-in-jsx-scope', () => {
  const rule = { 'react/react-in-jsx-scope': reactRules['react/react-in-jsx-scope'] };

  it('does not require React to be in scope (rule is OFF)', async () => {
    expect(
      hasRule(await lintJSX('const App = () => <div />;', rule), 'react/react-in-jsx-scope'),
    ).toBe(false);
  });
});

// ─── react-refresh/only-export-components ────────────────────────────────────

describe('react-refresh/only-export-components', () => {
  const rule = {
    'react-refresh/only-export-components': reactRules['react-refresh/only-export-components'],
  };

  it('warns when non-component function is exported alongside a component', async () => {
    const code = 'export function helper() { return 42; }\nexport const App = () => <div />;';
    const msgs = await lintJSX(code, rule);
    expect(hasRule(msgs, 'react-refresh/only-export-components')).toBe(true);
    expect(severityOf(msgs, 'react-refresh/only-export-components')).toBe(1);
  });

  it('allows exporting only components', async () => {
    expect(
      hasRule(
        await lintJSX('export const App = () => <div />;', rule),
        'react-refresh/only-export-components',
      ),
    ).toBe(false);
  });
});
