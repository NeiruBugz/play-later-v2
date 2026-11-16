import { GetParametersCommand, SSMClient } from "@aws-sdk/client-ssm";

const SECRET_NAMES = [
  "POSTGRES_PRISMA_URL",
  "IGDB_CLIENT_ID",
  "IGDB_CLIENT_SECRET",
  "STEAM_API_KEY",
] as const;

let loading: Promise<void> | undefined;

async function fetchSecretsIntoProcessEnv(): Promise<void> {
  const prefix = process.env.SSM_PARAM_PREFIX;
  if (!prefix) {
    throw new Error("SSM_PARAM_PREFIX is not set");
  }
  const { Parameters = [] } = await new SSMClient({}).send(
    new GetParametersCommand({
      Names: SECRET_NAMES.map((name) => `${prefix}/${name}`),
      WithDecryption: true,
    })
  );
  for (const name of SECRET_NAMES) {
    const value = Parameters.find(
      (parameter) => parameter.Name === `${prefix}/${name}`
    )?.Value;
    if (!value) {
      throw new Error(`SSM parameter ${name} is missing`);
    }
    process.env[name] = value;
  }
}

export function loadSsmEnv(): Promise<void> {
  loading ??= fetchSecretsIntoProcessEnv().catch((error: unknown) => {
    loading = undefined;
    throw error;
  });
  return loading;
}
