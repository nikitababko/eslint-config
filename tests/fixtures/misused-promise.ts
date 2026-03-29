function execute(callback: () => void): void {
  callback();
}

// Misused promise — async function passed where () => void is expected
execute(async () => {
  await Promise.resolve('done');
});
