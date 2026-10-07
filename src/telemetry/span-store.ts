import { EventEmitter } from "events";

const g = globalThis as any;
const store = (g.__otelSpanStore ??= {
  bus: new EventEmitter(),
  buffer: [] as any[],
});
store.bus.setMaxListeners(50); // mỗi tab SSE là một listener

export const spanBus: EventEmitter = store.bus;
export const spanBuffer: any[] = store.buffer;
const MAX = 3000;

export function pushSpan(record: any) {
  spanBuffer.push(record);
  if (spanBuffer.length > MAX) spanBuffer.splice(0, spanBuffer.length - MAX);
  spanBus.emit("span", record);
}
