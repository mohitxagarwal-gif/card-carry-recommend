export interface QueuedAction {
  id: string;
  type: 'status_update' | 'note_update' | 'shortlist_add' | 'reminder_dismiss';
  payload: any;
  timestamp: number;
  retries: number;
}

const QUEUE_KEY = 'offline_queue';
const MAX_RETRIES = 3;

export function addToQueue(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries'>): void {
  const queue = getQueue();
  const newAction: QueuedAction = {
    ...action,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    retries: 0,
  };
  queue.push(newAction);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function getQueue(): QueuedAction[] {
  const queueData = localStorage.getItem(QUEUE_KEY);
  if (!queueData) return [];
  try {
    return JSON.parse(queueData);
  } catch {
    return [];
  }
}

export function removeFromQueue(actionId: string): void {
  const queue = getQueue();
  const filtered = queue.filter((action) => action.id !== actionId);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
}

export function incrementRetry(actionId: string): void {
  const queue = getQueue();
  const updated = queue.map((action) =>
    action.id === actionId ? { ...action, retries: action.retries + 1 } : action
  );
  localStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
}

export function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}

export function getFailedActions(): QueuedAction[] {
  return getQueue().filter((action) => action.retries >= MAX_RETRIES);
}

export function hasFailedActions(): boolean {
  return getFailedActions().length > 0;
}

export async function processQueue(
  handlers: {
    status_update: (payload: any) => Promise<void>;
    note_update: (payload: any) => Promise<void>;
    shortlist_add: (payload: any) => Promise<void>;
    reminder_dismiss: (payload: any) => Promise<void>;
  }
): Promise<{ processed: number; failed: number }> {
  const queue = getQueue();
  let processed = 0;
  let failed = 0;

  for (const action of queue) {
    if (action.retries >= MAX_RETRIES) {
      failed++;
      continue;
    }

    try {
      const handler = handlers[action.type];
      if (handler) {
        await handler(action.payload);
        removeFromQueue(action.id);
        processed++;
      }
    } catch (error) {
      console.error(`Failed to process queued action ${action.id}:`, error);
      incrementRetry(action.id);
      if (action.retries + 1 >= MAX_RETRIES) {
        failed++;
      }
    }
  }

  return { processed, failed };
}
