export type SyncQueueName = "gather" | "enrich";

export interface SyncQueue {
  send(queue: SyncQueueName, body: unknown): Promise<void>;
}
