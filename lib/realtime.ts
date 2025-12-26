import { EventEmitter } from "events";

export type RealtimeEvent =
  | {
      type: "content.created" | "content.updated";
      userId: string;
      payload: Record<string, unknown>;
    }
  | {
      type: "schedule.created" | "schedule.updated" | "schedule.failed";
      userId: string;
      payload: Record<string, unknown>;
    }
  | {
      type: "post.created" | "post.updated";
      userId: string;
      payload: Record<string, unknown>;
    };

const emitter = new EventEmitter();
emitter.setMaxListeners(0);

type Listener = (event: RealtimeEvent) => void;

export function emitRealtime(event: RealtimeEvent) {
  emitter.emit(event.userId, event);
  emitter.emit("*", event);
}

export function subscribeToRealtime(userId: string, listener: Listener) {
  const handler = (event: RealtimeEvent) => {
    if (event.userId === userId) {
      listener(event);
    }
  };

  emitter.on(userId, handler);

  return () => {
    emitter.off(userId, handler);
  };
}

export function subscribeToAll(listener: Listener) {
  emitter.on("*", listener);
  return () => emitter.off("*", listener);
}

