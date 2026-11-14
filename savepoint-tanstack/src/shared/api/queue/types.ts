export type SyncQueueName = "gather";

export interface SyncQueue {
  send(queue: SyncQueueName, body: unknown): Promise<void>;
}
