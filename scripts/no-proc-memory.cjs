// Some restricted build sandboxes do not mount /proc. Node then throws from
// process.memoryUsage(), which Next.js uses only for telemetry/progress data.
try {
  process.memoryUsage();
} catch {
  const memoryUsage = () => ({ rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 });
  memoryUsage.rss = () => 0;
  process.memoryUsage = memoryUsage;
  process.resourceUsage = () => ({
    userCPUTime: 0, systemCPUTime: 0, maxRSS: 0, sharedMemorySize: 0,
    unsharedDataSize: 0, unsharedStackSize: 0, minorPageFault: 0,
    majorPageFault: 0, swappedOut: 0, fsRead: 0, fsWrite: 0,
    ipcSent: 0, ipcReceived: 0, signalsCount: 0,
    voluntaryContextSwitches: 0, involuntaryContextSwitches: 0,
  });
}
