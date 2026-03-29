import { describe, it, expect, beforeEach } from 'vitest';
import { Linter } from 'eslint';

import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';
import unicorn from 'eslint-plugin-unicorn';
import importX from 'eslint-plugin-import-x';
import solid from 'eslint-plugin-solid';

import { solidLayer } from '../configs/solid-layer.js';

const [{ rules: solidRules }] = solidLayer();

let linter;

beforeEach(() => {
  linter = new Linter({ configType: 'flat' });
});

const plugins = {
  '@typescript-eslint': tsPlugin,
  '@stylistic': stylistic,
  unicorn,
  'import-x': importX,
  solid,
};

function lintJSX(code, rules) {
  return linter.verify(code, [
    {
      languageOptions: {
        parser: tsParser,
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
          ecmaFeatures: { jsx: true },
        },
      },
      plugins,
      rules,
    },
  ]);
}

function hasRule(messages, ruleId) {
  return messages.some((m) => m.ruleId === ruleId);
}

function severityOf(messages, ruleId) {
  return messages.find((m) => m.ruleId === ruleId)?.severity;
}

// ─── solid/jsx-no-duplicate-props ────────────────────────────────────────────

describe('solid/jsx-no-duplicate-props', () => {
  const rule = {
    'solid/jsx-no-duplicate-props': solidRules['solid/jsx-no-duplicate-props'],
  };

  it('errors on duplicate JSX prop', () => {
    const code = 'const App = () => <div class="a" class="b" />;';
    expect(hasRule(lintJSX(code, rule), 'solid/jsx-no-duplicate-props')).toBe(true);
  });

  it('allows unique JSX props', () => {
    const code = 'const App = () => <div class="a" id="b" />;';
    expect(hasRule(lintJSX(code, rule), 'solid/jsx-no-duplicate-props')).toBe(false);
  });
});

// ─── solid/no-destructure ────────────────────────────────────────────────────

describe('solid/no-destructure', () => {
  const rule = { 'solid/no-destructure': solidRules['solid/no-destructure'] };

  it('warns on destructuring props in function parameters', () => {
    const code = 'const Counter = ({ count }) => <div>{count}</div>;';
    const msgs = lintJSX(code, rule);
    expect(hasRule(msgs, 'solid/no-destructure')).toBe(true);
    expect(severityOf(msgs, 'solid/no-destructure')).toBe(1);
  });

  it('allows accessing props without destructuring', () => {
    const code = 'const Counter = (props) => <div>{props.count}</div>;';
    expect(hasRule(lintJSX(code, rule), 'solid/no-destructure')).toBe(false);
  });
});

// ─── solid/components-return-once ────────────────────────────────────────────

describe('solid/components-return-once', () => {
  const rule = {
    'solid/components-return-once': solidRules['solid/components-return-once'],
  };

  it('errors on early return in a component', () => {
    const code = `
      function Comp(props) {
        if (!props.value) return null;
        return <div>{props.value}</div>;
      }
    `;
    expect(hasRule(lintJSX(code, rule), 'solid/components-return-once')).toBe(true);
  });

  it('allows a single return in a component', () => {
    const code = 'const Comp = (props) => <div>{props.value}</div>;';
    expect(hasRule(lintJSX(code, rule), 'solid/components-return-once')).toBe(false);
  });
});

// ─── solid/no-unknown-namespaces ─────────────────────────────────────────────

describe('solid/no-unknown-namespaces', () => {
  const rule = {
    'solid/no-unknown-namespaces': solidRules['solid/no-unknown-namespaces'],
  };

  it('errors on unknown JSX namespace', () => {
    const code = 'const App = () => <div foo:bar="baz" />;';
    expect(hasRule(lintJSX(code, rule), 'solid/no-unknown-namespaces')).toBe(true);
  });

  it('allows known solid namespace', () => {
    const code = 'const App = () => <div on:click={() => {}} />;';
    expect(hasRule(lintJSX(code, rule), 'solid/no-unknown-namespaces')).toBe(false);
  });
});
