import 'server-only';

export type UpdateEvent = {
  version: number;
  type: string;
  timestamp: string;
  resource?: string;
  action?: string;
};

type Listener = (event: UpdateEvent) => void;

type UpdateBusState = {
  listeners: Set<Listener>;
};

const globalState = globalThis as typeof globalThis & {
  __dreamscapeUpdateBus?: UpdateBusState;
};

function getState(): UpdateBusState {
  if (!globalState.__dreamscapeUpdateBus) {
    globalState.__dreamscapeUpdateBus = {
      listeners: new Set(),
    };
  }

  return globalState.__dreamscapeUpdateBus;
}

export function subscribeToUpdates(listener: Listener) {
  const state = getState();
  state.listeners.add(listener);

  return () => {
    state.listeners.delete(listener);
  };
}

export function publishUpdate(event: UpdateEvent) {
  const state = getState();
  for (const listener of state.listeners) {
    try {
      listener(event);
    } catch (error) {
      console.error('Update bus listener failed:', error);
    }
  }
}
