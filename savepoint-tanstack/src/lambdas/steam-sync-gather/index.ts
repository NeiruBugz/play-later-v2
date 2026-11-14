import type { SQSBatchResponse, SQSEvent } from "aws-lambda";

import { loadSsmEnv } from "../shared/load-ssm-env";

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  if (process.env.SSM_PARAM_PREFIX) {
    await loadSsmEnv();
  }
  const { handler: run } = await import("./handler");
  return run(event);
};
