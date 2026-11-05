import { createStart } from "@tanstack/react-start";

import { appErrorSerializationAdapter } from "./shared/lib/app-error-serialization";

export const startInstance = createStart(() => ({
  serializationAdapters: [appErrorSerializationAdapter],
}));
