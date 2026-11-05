import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const workflowSource = readFileSync(
  new URL('../.github/workflows/publish.yml', import.meta.url),
  'utf8',
);
const workflow = parse(workflowSource);
const ci = parse(readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8'));
const documentedRegistries = [
  ...readme.matchAll(
    /^\|[^|\r\n]+\|[\t ]*`(?<url>https:\/\/[^`]+)`[\t ]*\|[\t ]*`(?<secret>[A-Z][A-Z0-9_]*)`[\t ]*\|$/gmu,
  ),
].map(({ groups }) => groups);

const publishJobs = ['publish-npm', 'publish-gh'];
const getPublishStep = (job) =>
  job.steps.find((step) => /^npm publish(?:\s|$)/u.test(step.run ?? ''));

describe('Release instructions and workflow', () => {
  it('documents every repository secret used by the workflow', () => {
    const workflowSecrets = [
      ...new Set(
        [...JSON.stringify(workflow).matchAll(/\bsecrets\.([A-Z][A-Z0-9_]*)\b/gu)]
          .map(([, name]) => name)
          .filter((name) => name !== 'GITHUB_TOKEN'),
      ),
    ].sort();

    expect(documentedRegistries).toHaveLength(publishJobs.length);
    expect(documentedRegistries.map(({ secret }) => secret).sort()).toEqual(workflowSecrets);
  });

  it.each(publishJobs)('%s uses the documented secret for its registry', (jobId) => {
    const job = workflow.jobs[jobId];
    const registry = job.steps.find((step) => step.with?.['registry-url'])?.with['registry-url'];
    const documentation = documentedRegistries.find(({ url }) => url === registry);

    expect(documentation, `README must document the registry used by ${jobId}`).toBeDefined();
    expect(getPublishStep(job).env.NODE_AUTH_TOKEN.replaceAll(/\s/gu, '')).toBe(
      `\${{secrets.${documentation.secret}}}`,
    );
  });

  it('runs the shared CI and documented validation before publishing a v* tag', () => {
    expect(workflow.on.push.tags).toEqual(['v*']);
    expect(readme).toContain('Tag pushes matching `v*`');
    expect(workflow.jobs.checks.uses).toBe('./.github/workflows/ci.yml');
    expect(ci.on).toHaveProperty('workflow_call');
    expect(ci.jobs.check.steps).toContainEqual({ run: 'pnpm test' });
    expect(manifest.scripts.test).toContain('pnpm test:unit');
    expect(manifest.scripts['test:unit']).toBe('vitest run');

    const validationCommand = manifest.scripts['release:check'];

    expect(readme).toContain(`\`${validationCommand}\``);
    expect(readme).toMatch(/`pnpm release:check v[^`]+`/u);
    expect(workflow.jobs['validate-release'].steps).toContainEqual(
      expect.objectContaining({ id: 'metadata', run: validationCommand }),
    );
    expect(workflow.jobs['publish-npm'].needs).toEqual(['checks', 'validate-release']);
  });

  it('publishes to npm, then GitHub Packages, then creates the release', () => {
    expect(readme).toContain('publishes to npm first, then GitHub Packages');
    expect(workflow.jobs['publish-gh'].needs).toEqual(['publish-npm', 'validate-release']);
    expect(workflow.jobs.release.needs).toEqual(['publish-gh', 'validate-release']);

    for (const jobId of [...publishJobs, 'release']) {
      expect(workflow.jobs[jobId].if).toBeUndefined();
    }
  });

  it('passes the validated publication channel to both registries and the GitHub Release', () => {
    expect(readme).toContain('stable versions use `latest`');
    expect(readme).toContain('use `next`');
    expect(workflow.jobs['validate-release'].outputs).toEqual({
      npm_tag: '${{ steps.metadata.outputs.npm_tag }}',
      is_prerelease: '${{ steps.metadata.outputs.is_prerelease }}',
    });

    for (const jobId of publishJobs) {
      const publishStep = getPublishStep(workflow.jobs[jobId]);

      expect(publishStep.run).toContain('--tag "$NPM_TAG"');
      expect(publishStep.env.NPM_TAG).toBe('${{ needs.validate-release.outputs.npm_tag }}');
    }

    const releaseStep = workflow.jobs.release.steps.find((step) =>
      step.uses?.startsWith('softprops/action-gh-release@'),
    );

    expect(releaseStep.with.prerelease).toBe(
      "${{ needs.validate-release.outputs.is_prerelease == 'true' }}",
    );
    expect(releaseStep.with.make_latest).toBe(
      "${{ needs.validate-release.outputs.is_prerelease == 'false' }}",
    );
  });

  it('attaches the documented changelog notes and npm tarball using the built-in token', () => {
    const { release } = workflow.jobs;
    const releaseStep = release.steps.find((step) =>
      step.uses?.startsWith('softprops/action-gh-release@'),
    );
    const [, notesCommand] = readme.match(/`(node scripts\/extract-release-notes\.js) v[^`]+`/u);

    expect(release.steps).toContainEqual(expect.objectContaining({ run: notesCommand }));
    expect(release.steps).toContainEqual(expect.objectContaining({ run: 'npm pack' }));
    expect(releaseStep.with.body_path).toBe('release-notes.md');
    expect(releaseStep.with.files).toBe('*.tgz');
    expect(readme).toContain('`release-notes.md`');
    expect(readme).toContain('automatically provided `GITHUB_TOKEN`');
    expect(release.permissions.contents).toBe('write');
  });
});
