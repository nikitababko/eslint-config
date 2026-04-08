/**
 * @typedef {'off' | 'warn' | 'error'} RuleStatus
 */

/**
 * @type {{ OFF: RuleStatus; WARN: RuleStatus; ERROR: RuleStatus }}
 */
export const RULE_STATUSES = {
  OFF: 'off',
  WARN: 'warn',
  ERROR: 'error',
};

export const BOOLEAN_PREFIXES = [
  'is',
  'has',
  'can',
  'should',
  'will',
  'did',
  'was',
  'were',
  'allow',
  'enable',
  'supports',
  'needs',
  'requires',
];

export const DEFAULT_IGNORES = [
  'node_modules',
  '**/node_modules',
  'dist',
  '**/dist',
  'build',
  '**/build',
  '.idea',
  '.output',
  '**/.output',
  '.cache',
  '**/.cache',
];

export const MAX_STRING_LENGTH = 100;

/**
 * @typedef {'always' | 'never'} BinaryOption
 */

/**
 * @type {{ ALWAYS: BinaryOption; NEVER: BinaryOption }}
 */
export const OPTIONS = {
  ALWAYS: 'always',
  NEVER: 'never',
};

/**
 * @type {{ WARN: 'warn'; ERROR: 'error' }}
 */
export const CONSOLE_METHODS = {
  WARN: 'warn',
  ERROR: 'error',
};
