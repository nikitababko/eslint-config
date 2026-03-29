import { beforeEach, describe, expect, it } from 'vitest';
import { Linter } from 'eslint';

import stylistic from '@stylistic/eslint-plugin';
import unicorn from 'eslint-plugin-unicorn';
import importX from 'eslint-plugin-import-x';
import * as tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

import { commonTsRules } from '../configs/typescript.js';
import { MAX_STRING_LENGTH } from '../configs/constants.js';

let linter;

beforeEach(() => {
  linter = new Linter({ configType: 'flat' });
});

function lint(code, rules, plugins = {}) {
  return linter.verify(code, [{ rules, plugins }]);
}

function lintTS(code, rules, extraPlugins = {}) {
  return linter.verify(code, [
    {
      languageOptions: { parser: tsParser },
      plugins: { '@typescript-eslint': tsPlugin, ...extraPlugins },
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

// ─── no-console ───────────────────────────────────────────────────────────────

describe('no-console', () => {
  const rule = { 'no-console': commonTsRules['no-console'] };

  it('warns on console.log', () => {
    const msgs = lint("console.log('x');", rule);
    expect(hasRule(msgs, 'no-console')).toBe(true);
    expect(severityOf(msgs, 'no-console')).toBe(1);
  });

  it('allows console.warn', () => {
    expect(hasRule(lint("console.warn('x');", rule), 'no-console')).toBe(false);
  });

  it('allows console.error', () => {
    expect(hasRule(lint("console.error('x');", rule), 'no-console')).toBe(false);
  });
});

// ─── no-multiple-empty-lines ──────────────────────────────────────────────────

describe('no-multiple-empty-lines', () => {
  const rule = { 'no-multiple-empty-lines': commonTsRules['no-multiple-empty-lines'] };

  it('errors on two consecutive empty lines', () => {
    expect(hasRule(lint('const x = 1;\n\n\nconst y = 2;', rule), 'no-multiple-empty-lines')).toBe(
      true,
    );
  });

  it('allows a single empty line', () => {
    expect(hasRule(lint('const x = 1;\n\nconst y = 2;', rule), 'no-multiple-empty-lines')).toBe(
      false,
    );
  });
});

// ─── import-x/order ──────────────────────────────────────────────────────────

describe('import-x/order', () => {
  const rule = { 'import-x/order': commonTsRules['import-x/order'] };
  const plugins = { 'import-x': importX };

  it('errors when no blank line between builtin and external group', () => {
    const code = "import fs from 'fs';\nimport react from 'react';";
    expect(hasRule(lint(code, rule, plugins), 'import-x/order')).toBe(true);
  });

  it('allows blank line between groups', () => {
    const code = "import fs from 'fs';\n\nimport react from 'react';";
    expect(hasRule(lint(code, rule, plugins), 'import-x/order')).toBe(false);
  });

  it('allows same-group imports without blank line', () => {
    const code = "import fs from 'fs';\nimport path from 'path';";
    expect(hasRule(lint(code, rule, plugins), 'import-x/order')).toBe(false);
  });
});

// ─── @stylistic/semi ──────────────────────────────────────────────────────────

describe('@stylistic/semi', () => {
  const rule = { '@stylistic/semi': commonTsRules['@stylistic/semi'] };
  const plugins = { '@stylistic': stylistic };

  it('errors on missing semicolon', () => {
    expect(hasRule(lint('const x = 1', rule, plugins), '@stylistic/semi')).toBe(true);
  });

  it('allows semicolon', () => {
    expect(hasRule(lint('const x = 1;', rule, plugins), '@stylistic/semi')).toBe(false);
  });
});

// ─── @stylistic/quotes ────────────────────────────────────────────────────────

describe('@stylistic/quotes', () => {
  const rule = { '@stylistic/quotes': commonTsRules['@stylistic/quotes'] };
  const plugins = { '@stylistic': stylistic };

  it('errors on double quotes', () => {
    expect(hasRule(lint('const x = "hello";', rule, plugins), '@stylistic/quotes')).toBe(true);
  });

  it('allows single quotes', () => {
    expect(hasRule(lint("const x = 'hello';", rule, plugins), '@stylistic/quotes')).toBe(false);
  });
});

// ─── @stylistic/arrow-parens ──────────────────────────────────────────────────

describe('@stylistic/arrow-parens', () => {
  const rule = { '@stylistic/arrow-parens': commonTsRules['@stylistic/arrow-parens'] };
  const plugins = { '@stylistic': stylistic };

  it('errors on arrow function without parens', () => {
    expect(hasRule(lint('const fn = x => x;', rule, plugins), '@stylistic/arrow-parens')).toBe(
      true,
    );
  });

  it('allows arrow function with parens', () => {
    expect(hasRule(lint('const fn = (x) => x;', rule, plugins), '@stylistic/arrow-parens')).toBe(
      false,
    );
  });
});

// ─── @stylistic/brace-style ───────────────────────────────────────────────────

describe('@stylistic/brace-style', () => {
  const rule = { '@stylistic/brace-style': commonTsRules['@stylistic/brace-style'] };
  const plugins = { '@stylistic': stylistic };

  it('errors on Allman style (brace on new line)', () => {
    const code = 'function foo()\n{\n  return 1;\n}';
    expect(hasRule(lint(code, rule, plugins), '@stylistic/brace-style')).toBe(true);
  });

  it('allows 1tbs style (brace on same line)', () => {
    const code = 'function foo() {\n  return 1;\n}';
    expect(hasRule(lint(code, rule, plugins), '@stylistic/brace-style')).toBe(false);
  });
});

// ─── @stylistic/block-spacing ─────────────────────────────────────────────────

describe('@stylistic/block-spacing', () => {
  const rule = { '@stylistic/block-spacing': commonTsRules['@stylistic/block-spacing'] };
  const plugins = { '@stylistic': stylistic };

  it('errors on spaces inside single-line block', () => {
    expect(
      hasRule(lint('function foo() { return 1; }', rule, plugins), '@stylistic/block-spacing'),
    ).toBe(true);
  });

  it('allows no spaces inside single-line block', () => {
    expect(
      hasRule(lint('function foo() {return 1;}', rule, plugins), '@stylistic/block-spacing'),
    ).toBe(false);
  });
});

// ─── @stylistic/max-len ───────────────────────────────────────────────────────

describe('@stylistic/max-len', () => {
  const rule = { '@stylistic/max-len': commonTsRules['@stylistic/max-len'] };
  const plugins = { '@stylistic': stylistic };

  it(`errors on line exceeding ${MAX_STRING_LENGTH} characters`, () => {
    // Intentionally exceeds MAX_STRING_LENGTH and is not ignored by config
    const code =
      'const aVeryLongVariableNameThatDefinitelyExceedsOneHundredCharactersLimitForThisProjectConfiguration = 1;';
    expect(hasRule(lint(code, rule, plugins), '@stylistic/max-len')).toBe(true);
  });

  it('ignores long string literals (ignoreStrings option)', () => {
    // exceeds MAX_STRING_LENGTH but is a string literal — should be ignored
    const code =
      "const x = 'this is an intentionally very long string literal that exceeds the configured maximum line length';";
    expect(hasRule(lint(code, rule, plugins), '@stylistic/max-len')).toBe(false);
  });

  it(`allows lines within ${MAX_STRING_LENGTH} characters`, () => {
    expect(hasRule(lint('const x = 1;', rule, plugins), '@stylistic/max-len')).toBe(false);
  });
});

// ─── @stylistic/object-curly-spacing ─────────────────────────────────────────

describe('@stylistic/object-curly-spacing', () => {
  const rule = {
    '@stylistic/object-curly-spacing': commonTsRules['@stylistic/object-curly-spacing'],
  };
  const plugins = { '@stylistic': stylistic };

  it('errors on no space inside braces', () => {
    expect(
      hasRule(lint('const x = {a: 1};', rule, plugins), '@stylistic/object-curly-spacing'),
    ).toBe(true);
  });

  it('allows spaces inside braces', () => {
    expect(
      hasRule(lint('const x = { a: 1 };', rule, plugins), '@stylistic/object-curly-spacing'),
    ).toBe(false);
  });
});

// ─── @stylistic/comma-dangle ──────────────────────────────────────────────────

describe('@stylistic/comma-dangle', () => {
  const rule = { '@stylistic/comma-dangle': commonTsRules['@stylistic/comma-dangle'] };
  const plugins = { '@stylistic': stylistic };

  it('errors on missing trailing comma in multiline object', () => {
    const code = 'const x = {\n  a: 1\n};';
    expect(hasRule(lint(code, rule, plugins), '@stylistic/comma-dangle')).toBe(true);
  });

  it('allows trailing comma in multiline object', () => {
    const code = 'const x = {\n  a: 1,\n};';
    expect(hasRule(lint(code, rule, plugins), '@stylistic/comma-dangle')).toBe(false);
  });
});

// ─── @stylistic/indent ────────────────────────────────────────────────────────

describe('@stylistic/indent', () => {
  const rule = { '@stylistic/indent': commonTsRules['@stylistic/indent'] };
  const plugins = { '@stylistic': stylistic };

  it('errors on 4-space indentation', () => {
    const code = 'if (true) {\n    const x = 1;\n}';
    expect(hasRule(lint(code, rule, plugins), '@stylistic/indent')).toBe(true);
  });

  it('allows 2-space indentation', () => {
    const code = 'if (true) {\n  const x = 1;\n}';
    expect(hasRule(lint(code, rule, plugins), '@stylistic/indent')).toBe(false);
  });
});

// ─── unicorn/filename-case ───────────────────────────────────────────────────

describe('unicorn/filename-case', () => {
  const rule = { 'unicorn/filename-case': commonTsRules['unicorn/filename-case'] };
  const plugins = { unicorn };
  const code = 'const x = 1;';

  it('errors on PascalCase filename', () => {
    const msgs = linter.verify(code, [{ rules: rule, plugins }], 'MyComponent.js');
    expect(hasRule(msgs, 'unicorn/filename-case')).toBe(true);
  });

  it('errors on camelCase filename', () => {
    const msgs = linter.verify(code, [{ rules: rule, plugins }], 'myComponent.js');
    expect(hasRule(msgs, 'unicorn/filename-case')).toBe(true);
  });

  it('allows kebab-case filename', () => {
    const msgs = linter.verify(code, [{ rules: rule, plugins }], 'my-component.js');
    expect(hasRule(msgs, 'unicorn/filename-case')).toBe(false);
  });
});

// ─── unicorn/prevent-abbreviations ───────────────────────────────────────────

describe('unicorn/prevent-abbreviations', () => {
  const rule = {
    'unicorn/prevent-abbreviations': commonTsRules['unicorn/prevent-abbreviations'],
  };
  const plugins = { unicorn };

  it('errors on abbreviated variable name', () => {
    expect(
      hasRule(
        lint("const btn = document.querySelector('button');", rule, plugins),
        'unicorn/prevent-abbreviations',
      ),
    ).toBe(true);
  });

  it('allows full variable name', () => {
    expect(
      hasRule(
        lint("const button = document.querySelector('button');", rule, plugins),
        'unicorn/prevent-abbreviations',
      ),
    ).toBe(false);
  });

  it('allows ignored abbreviation: Props', () => {
    expect(hasRule(lint('const Props = {};', rule, plugins), 'unicorn/prevent-abbreviations')).toBe(
      false,
    );
  });

  it('allows ignored abbreviation: props', () => {
    expect(hasRule(lint('const props = {};', rule, plugins), 'unicorn/prevent-abbreviations')).toBe(
      false,
    );
  });

  it('allows ignored abbreviation: tsconfigRootDir', () => {
    expect(
      hasRule(lint("const tsconfigRootDir = '.';", rule, plugins), 'unicorn/prevent-abbreviations'),
    ).toBe(false);
  });
});

// ─── @typescript-eslint/no-unused-vars ───────────────────────────────────────

describe('@typescript-eslint/no-unused-vars', () => {
  const rule = {
    '@typescript-eslint/no-unused-vars': commonTsRules['@typescript-eslint/no-unused-vars'],
  };

  it('errors on declared but unused variable', () => {
    expect(hasRule(lintTS('const unused = 1;', rule), '@typescript-eslint/no-unused-vars')).toBe(
      true,
    );
  });

  it('allows variable starting with underscore', () => {
    expect(hasRule(lintTS('const _ignored = 1;', rule), '@typescript-eslint/no-unused-vars')).toBe(
      false,
    );
  });

  it('allows used variable', () => {
    expect(
      hasRule(
        lintTS('const used = 1; console.log(used);', rule),
        '@typescript-eslint/no-unused-vars',
      ),
    ).toBe(false);
  });
});

// ─── @typescript-eslint/no-explicit-any ──────────────────────────────────────

describe('@typescript-eslint/no-explicit-any', () => {
  const rule = {
    '@typescript-eslint/no-explicit-any': commonTsRules['@typescript-eslint/no-explicit-any'],
  };

  it('warns on explicit any type annotation', () => {
    const msgs = lintTS('const x: any = 1;', rule);
    expect(hasRule(msgs, '@typescript-eslint/no-explicit-any')).toBe(true);
    expect(severityOf(msgs, '@typescript-eslint/no-explicit-any')).toBe(1);
  });

  it('allows specific type annotation', () => {
    expect(
      hasRule(lintTS("const x: string = 'hello';", rule), '@typescript-eslint/no-explicit-any'),
    ).toBe(false);
  });
});

// ─── @typescript-eslint/consistent-type-definitions ──────────────────────────

describe('@typescript-eslint/consistent-type-definitions', () => {
  const rule = {
    '@typescript-eslint/consistent-type-definitions':
      commonTsRules['@typescript-eslint/consistent-type-definitions'],
  };

  it('errors on type alias for object shape (prefer interface)', () => {
    expect(
      hasRule(
        lintTS('type Foo = { a: string };', rule),
        '@typescript-eslint/consistent-type-definitions',
      ),
    ).toBe(true);
  });

  it('allows interface declaration', () => {
    expect(
      hasRule(
        lintTS('interface Foo { a: string }', rule),
        '@typescript-eslint/consistent-type-definitions',
      ),
    ).toBe(false);
  });
});

// ─── @typescript-eslint/consistent-type-imports ──────────────────────────────

describe('@typescript-eslint/consistent-type-imports', () => {
  const rule = {
    '@typescript-eslint/consistent-type-imports':
      commonTsRules['@typescript-eslint/consistent-type-imports'],
  };

  it('errors when type-only import is not using import type', () => {
    const code = "import { MyInterface } from './module';\nconst x: MyInterface = {};";
    expect(hasRule(lintTS(code, rule), '@typescript-eslint/consistent-type-imports')).toBe(true);
  });

  it('allows import type syntax', () => {
    const code = "import type { MyInterface } from './module';\nconst x: MyInterface = {};";
    expect(hasRule(lintTS(code, rule), '@typescript-eslint/consistent-type-imports')).toBe(false);
  });
});
