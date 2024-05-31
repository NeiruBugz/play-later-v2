export const processPlaythroughPayload = (payload: FormData) => {
  return {
    createdAt: new Date(),
    finishedAt: payload.get("finishedAt")
      ? new Date(payload.get("finishedAt") as string)
      : undefined,
    label: payload.get("label"),
    platform: payload.get("platform"),
    startedAt: payload.get("startedAt")
      ? new Date(payload.get("startedAt") as string)
      : new Date(),
  };
};
