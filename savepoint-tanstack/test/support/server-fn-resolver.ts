type ServerFnAction = ((payload: unknown) => Promise<unknown>) & {
  method?: string;
};

const registry = new Map<string, ServerFnAction>();

export function registerServerFn(id: string, action: ServerFnAction): void {
  registry.set(id, action);
}

export async function getServerFnById(id: string): Promise<ServerFnAction> {
  const action = registry.get(id);
  if (!action) throw new Error(`No server fn registered for ${id}`);
  return action;
}
