import Bottleneck from "bottleneck";

function createIgdbLimiter(): Bottleneck {
  return new Bottleneck({
    minTime: 260,
    maxConcurrent: 4,
    reservoir: 4,
    reservoirRefreshInterval: 1000,
    reservoirRefreshAmount: 4,
  });
}

export let igdbLimiter = createIgdbLimiter();

export async function __resetLimiterForTests(): Promise<void> {
  await igdbLimiter.stop({ dropWaitingJobs: true });
  igdbLimiter = createIgdbLimiter();
}
