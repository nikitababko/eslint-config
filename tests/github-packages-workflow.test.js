import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const source = readFileSync(
  new URL('../.github/workflows/publish-github.yml', import.meta.url),
  'utf8',
);
const workflow = parse(source);
const ci = parse(readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8'));
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const selectedTag = 'refs/tags/${{ inputs.tag }}';

describe('Manual GitHub Packages publication', () => {
  it('requires an explicit release tag and documents how to run it', () => {
    expect(Object.keys(workflow.on)).toEqual(['workflow_dispatch']);
    expect(workflow.on.workflow_dispatch.inputs.tag).toMatchObject({
      required: true,
      type: 'string',
    });
    expect(readme).toContain(`**${workflow.name}**`);
    expect(readme).toContain('`publish-github.yml`');
  });

  it('checks the selected tag in every shared CI job', () => {
    expect(workflow.jobs.checks.uses).toBe('./.github/workflows/ci.yml');
    expect(workflow.jobs.checks.with.ref).toBe(selectedTag);
    expect(ci.on.workflow_call.inputs.ref).toMatchObject({ required: false, type: 'string' });

    for (const job of Object.values(ci.jobs)) {
      const checkout = job.steps.find((step) => step.uses?.startsWith('actions/checkout@'));

      expect(checkout.with.ref).toBe('${{ inputs.ref || github.ref }}');
    }
  });

  it('validates the selected tag and requires successful checks before publishing', () => {
    const validation = workflow.jobs['validate-release'];
    const metadata = validation.steps.find((step) => step.id === 'metadata');

    expect(metadata.run).toBe('node scripts/validate-release.js "$RELEASE_TAG"');
    expect(metadata.env.RELEASE_TAG).toBe('${{ inputs.tag }}');
    expect(workflow.jobs.publish.needs).toEqual(['checks', 'validate-release']);
    expect(workflow.jobs.publish.if).toBeUndefined();

    for (const job of [validation, workflow.jobs.publish]) {
      const checkout = job.steps.find((step) => step.uses?.startsWith('actions/checkout@'));

      expect(checkout.with.ref).toBe(selectedTag);
    }
  });

  it('publishes only to GitHub Packages using the validated publication channel', () => {
    const { publish } = workflow.jobs;
    const setupNode = publish.steps.find((step) => step.with?.['registry-url']);
    const publishStep = publish.steps.find((step) => step.run?.startsWith('npm publish '));

    expect(setupNode.with['registry-url']).toBe('https://npm.pkg.github.com/');
    expect(publishStep.run).toContain('--tag "$NPM_TAG"');
    expect(publishStep.env).toEqual({
      NPM_TAG: '${{ needs.validate-release.outputs.npm_tag }}',
      NODE_AUTH_TOKEN: '${{ secrets.AUTH_TOKEN_GITHUB }}',
    });
    expect(workflow.jobs['validate-release'].outputs.npm_tag).toBe(
      '${{ steps.metadata.outputs.npm_tag }}',
    );
    expect(publish.permissions.packages).toBe('write');
    expect(source).not.toContain('registry.npmjs.org');
    expect(source).not.toContain('AUTH_TOKEN_NPM');
    expect(workflow.jobs).not.toHaveProperty('publish-npm');
  });
});
