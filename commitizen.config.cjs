module.exports = {
  types: [
    {
      value: 'feat',
      name: 'feat:     New preset or rule',
    },
    {
      value: 'fix',
      name: 'fix:      Bug fix',
    },
    {
      value: 'docs',
      name: 'docs:     Documentation changes',
    },
    {
      value: 'refactor',
      name: 'refactor: Code improvements without behavior change',
    },
    {
      value: 'chore',
      name: 'chore:    Tooling / config changes',
    },
    {
      value: 'ci',
      name: 'ci:       CI / workflow changes',
    },
  ],
  allowCustomScopes: true,
  allowBreakingChanges: ['feat', 'fix'],
};
