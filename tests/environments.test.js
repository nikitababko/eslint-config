import { beforeEach, describe, expect, it } from 'vitest';
import { Linter } from 'eslint';

import { baseConfig } from '../configs/base.js';
import { reactConfig } from '../configs/react.js';
import { solidConfig } from '../configs/solid.js';
import { vanillaConfig } from '../configs/vanilla.js';

let linter;

beforeEach(() => {
  linter = new Linter({ configType: 'flat' });
});

function lintWithConfig(code, config, filename = 'file.js') {
  return linter.verify(code, config, filename);
}

function noUndefMessages(messages) {
  return messages.filter((message) => message.ruleId === 'no-undef');
}

describe('Environment globals', () => {
  const code = 'window.location.href; process.cwd();';

  it('baseConfig() is neutral by default', () => {
    const messages = noUndefMessages(lintWithConfig(code, baseConfig()));

    expect(messages).toHaveLength(2);
  });

  it('baseConfig({ environment: browser }) allows browser globals only', () => {
    const messages = noUndefMessages(lintWithConfig(code, baseConfig({ environment: 'browser' })));

    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("'process' is not defined");
  });

  it('baseConfig({ environment: node }) allows node globals only', () => {
    const messages = noUndefMessages(lintWithConfig(code, baseConfig({ environment: 'node' })));

    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("'window' is not defined");
  });

  it('baseConfig({ environment: universal }) allows both browser and node globals', () => {
    const messages = noUndefMessages(
      lintWithConfig(code, baseConfig({ environment: 'universal' })),
    );

    expect(messages).toHaveLength(0);
  });

  it('globalsPreset overrides the environment preset', () => {
    const messages = noUndefMessages(
      lintWithConfig(
        code,
        baseConfig({
          environment: 'browser',
          globalsPreset: {
            process: false,
          },
        }),
      ),
    );

    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("'window' is not defined");
  });
});

describe('Higher-level preset defaults', () => {
  const code = 'window.location.href; process.cwd();';

  it('vanillaConfig() defaults to browser globals', () => {
    const messages = noUndefMessages(lintWithConfig(code, vanillaConfig()));

    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("'process' is not defined");
  });

  it('reactConfig({ environment: node }) passes environment to the base layer', () => {
    const messages = noUndefMessages(lintWithConfig(code, reactConfig({ environment: 'node' })));

    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("'window' is not defined");
  });

  it('solidConfig({ environment: node }) passes environment to the base layer', () => {
    const messages = noUndefMessages(lintWithConfig(code, solidConfig({ environment: 'node' })));

    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("'window' is not defined");
  });
});
