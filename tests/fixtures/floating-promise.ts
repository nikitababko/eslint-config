async function doWork(): Promise<void> {
  return;
}

// Floating promise — called inside sync function without await
function caller(): void {
  doWork();
}

caller();
