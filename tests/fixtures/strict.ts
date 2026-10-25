export function readText(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  throw new TypeError('Expected text');
}

export function describeState(state: 'loading' | 'ready'): string {
  switch (state) {
    case 'loading':
      return 'Loading';
    case 'ready':
      return 'Ready';
  }
}

export async function loadText(): Promise<string> {
  return readText(await Promise.resolve('text'));
}
