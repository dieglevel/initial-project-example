import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import {
  ReadableSpan,
  SimpleSpanProcessor,
  SpanExporter,
} from "@opentelemetry/sdk-trace-base";
import { ExportResult, ExportResultCode } from "@opentelemetry/core";
import { SpanKind, SpanStatusCode } from "@opentelemetry/api";

/* ------------------------------ Config ------------------------------ */
const USE_JSON = process.env.OTEL_LOG_FORMAT === "json";
const USE_COLOR =
  !USE_JSON &&
  !process.env.NO_COLOR &&
  (process.stdout.isTTY || !!process.env.FORCE_COLOR);
const MAX_QUERY_LENGTH = Number(process.env.OTEL_MAX_QUERY_LENGTH ?? 200);
const SLOW_MS = Number(process.env.OTEL_SLOW_MS ?? 500);
const SHOW_OPTIONS = process.env.OTEL_SHOW_OPTIONS === "1";
const ORPHAN_FLUSH_MS = 500;

/* ------------------------------ Colors ------------------------------ */
const paint = (code: string) => (s: string | number) =>
  USE_COLOR ? `\x1b[${code}m${s}\x1b[0m` : String(s);
const c = {
  dim: paint("2"),
  bold: paint("1"),
  red: paint("31"),
  green: paint("32"),
  yellow: paint("33"),
  blue: paint("34"),
  magenta: paint("35"),
  cyan: paint("36"),
  gray: paint("90"),
  bgRed: paint("41;97"),
  bgBlue: paint("44;97"),
  bgMagenta: paint("45;97"),
  bgGray: paint("100;97"),
  bgCyan: paint("46;30"),
};

const TRACE_COLORS = [31, 32, 33, 34, 35, 36, 91, 92, 93, 94, 95, 96];
const traceColor = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return paint(String(TRACE_COLORS[h % TRACE_COLORS.length]));
};

/* ----------------------------- Helpers ------------------------------ */
const toMs = (t: [number, number]) => t[0] * 1000 + t[1] / 1e6;
const durationOf = (s: ReadableSpan) => Number(toMs(s.duration).toFixed(2));
const str = (v: unknown) =>
  typeof v === "string" && v
    ? v
    : typeof v === "number"
      ? String(v)
      : undefined;
const num = (v: unknown) =>
  typeof v === "number"
    ? v
    : typeof v === "string" && v !== "" && !isNaN(+v)
      ? +v
      : undefined;
const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();
const truncate = (s: string, max: number) =>
  s.length > max ? `${s.slice(0, max)}… (+${s.length - max})` : s;
// Rút gọn danh sách cột dài: SELECT "a"."id" AS ..., ... FROM  ->  SELECT … FROM
const compactSql = (q: string) =>
  truncate(
    oneLine(q).replace(/^SELECT .+? FROM /i, "SELECT … FROM "),
    MAX_QUERY_LENGTH,
  );

const parentIdOf = (s: ReadableSpan): string | undefined => {
  const x = s as any;
  return x.parentSpanContext?.spanId ?? x.parentSpanId ?? undefined; // SDK v2 / v1
};

const fmtDuration = (ms: number) => {
  const t = ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
  return ms >= SLOW_MS
    ? c.red(t)
    : ms >= SLOW_MS / 5
      ? c.yellow(t)
      : c.green(t);
};
const fmtMethod = (m: string) => {
  const p = m.toUpperCase().padEnd(7);
  switch (m.toUpperCase()) {
    case "GET":
      return c.green(p);
    case "POST":
      return c.yellow(p);
    case "PUT":
    case "PATCH":
      return c.blue(p);
    case "DELETE":
      return c.red(p);
    default:
      return c.magenta(p);
  }
};
const fmtStatus = (code?: number) =>
  code === undefined
    ? c.gray("---")
    : code >= 500
      ? c.bold(c.red(code))
      : code >= 400
        ? c.yellow(code)
        : code >= 300
          ? c.cyan(code)
          : c.green(code);

const tag = (label: string, bg: (s: string) => string) =>
  bg(` ${label.padEnd(4)} `);

/* --------------------------- Classification -------------------------- */
type SpanType = "HTTP_IN" | "HTTP_OUT" | "DB" | "SPAN";

const httpMethod = (s: ReadableSpan) =>
  str(s.attributes["http.request.method"]) ?? str(s.attributes["http.method"]);

const classify = (s: ReadableSpan): SpanType => {
  if (s.instrumentationScope.name.endsWith("instrumentation-pg")) return "DB";
  if (httpMethod(s)) {
    if (s.kind === SpanKind.SERVER) return "HTTP_IN";
    if (s.kind === SpanKind.CLIENT) return "HTTP_OUT";
  }
  return "SPAN";
};

const isNoise = (s: ReadableSpan): boolean => {
  const scope = s.instrumentationScope.name;
  const isError = s.status.code === SpanStatusCode.ERROR;
  if (scope.endsWith("instrumentation-express")) return true; // middleware/router/request handler
  if (s.name === "pg-pool.connect" && !isError) return true;
  if (
    scope.endsWith("instrumentation-nestjs-core") &&
    s.attributes["nestjs.type"] === "handler" &&
    false // đổi thành true nếu muốn ẩn cả span handler của Nest
  )
    return true;
  if (
    !SHOW_OPTIONS &&
    classify(s) === "HTTP_IN" &&
    httpMethod(s)?.toUpperCase() === "OPTIONS"
  )
    return true;
  return false;
};

/* ------------------------------ Errors ------------------------------- */
const collectErrors = (s: ReadableSpan) => {
  const list = s.events
    .filter((e) => e.name === "exception")
    .map((e) => ({
      type: str(e.attributes?.["exception.type"]),
      message: str(e.attributes?.["exception.message"]),
      stack: str(e.attributes?.["exception.stacktrace"]),
    }));
  if (
    s.status.code === SpanStatusCode.ERROR &&
    !list.length &&
    s.status.message
  ) {
    list.push({ type: undefined, message: s.status.message, stack: undefined });
  }
  return list;
};

/* ----------------------------- Formatting ---------------------------- */
function formatSpan(
  span: ReadableSpan,
  depth: number,
  baseMs: number,
): string[] {
  const a = span.attributes;
  const type = classify(span);
  const isError = span.status.code === SpanStatusCode.ERROR;
  const dur = durationOf(span);
  const startMs = toMs(span.startTime);
  const ctx = span.spanContext();

  const lead =
    depth === 0
      ? c.gray(new Date(startMs).toISOString().slice(11, 23))
      : c.gray(`+${(startMs - baseMs).toFixed(0)}ms`.padStart(12));
  const indent = depth > 0 ? c.gray("  ".repeat(depth - 1) + "└ ") : "";
  const errBadge = isError ? ` ${c.bgRed(" ERROR ")}` : "";
  const traceTag =
    depth === 0
      ? ` ${traceColor(ctx.traceId)(`trace=${ctx.traceId.slice(0, 8)}`)}`
      : "";
  const lines: string[] = [];
  const pad =
    " ".repeat(13) +
    "  ".repeat(Math.max(depth - 1, 0)) +
    (depth > 0 ? "  " : "");

  if (type === "DB") {
    const op = str(a["db.operation.name"]) ?? str(a["db.operation"]) ?? "QUERY";
    const table = str(a["db.collection.name"]) ?? str(a["db.sql.table"]);
    const db = str(a["db.namespace"]) ?? str(a["db.name"]);
    const host = str(a["server.address"]) ?? str(a["net.peer.name"]);
    const query = str(a["db.query.text"]) ?? str(a["db.statement"]);
    lines.push(
      `${lead} ${indent}${tag("DB", c.bgMagenta)} ${c.bold(c.magenta(op))}` +
        `${table ? ` ${c.cyan(table)}` : ""} ${fmtDuration(dur)}` +
        `${depth === 0 && db ? ` ${c.gray(`${db}@${host ?? "?"}`)}` : ""}${traceTag}${errBadge}`,
    );
    if (query) lines.push(`${pad}${c.dim("↳")} ${c.blue(compactSql(query))}`);
  } else if (type === "HTTP_IN" || type === "HTTP_OUT") {
    const isIn = type === "HTTP_IN";
    const status =
      num(a["http.response.status_code"]) ?? num(a["http.status_code"]);
    const route = isIn
      ? (str(a["http.route"]) ?? str(a["url.path"]) ?? str(a["http.target"]))
      : (str(a["url.full"]) ?? str(a["http.url"]));
    const path = str(a["url.path"]) ?? str(a["http.target"]);
    const ip =
      str(a["client.address"]) ??
      str(a["http.client_ip"]) ??
      str(a["net.peer.ip"]);
    const ua = str(a["user_agent.original"]) ?? str(a["http.user_agent"]);
    const size =
      num(a["http.response.body.size"]) ??
      num(a["http.response_content_length"]);
    const meta = [
      isIn && ip && `ip=${ip}`,
      isIn && path && route !== path && `path=${path}`,
      size !== undefined && `size=${size}B`,
    ]
      .filter(Boolean)
      .join(" ");
    lines.push(
      `${lead} ${indent}${tag(isIn ? "IN" : "OUT", isIn ? c.bgBlue : c.bgCyan)} ` +
        `${fmtMethod(httpMethod(span) ?? "?")}${c.bold(route ?? "-")} ` +
        `${fmtStatus(status)} ${fmtDuration(dur)}` +
        `${meta ? ` ${c.gray(meta)}` : ""}${traceTag}${errBadge}`,
    );
    if (isIn && ua) lines.push(`${pad}${c.dim(`ua: ${truncate(ua, 80)}`)}`);
  } else {
    const scope = span.instrumentationScope.name.replace(
      "@opentelemetry/instrumentation-",
      "",
    );
    lines.push(
      `${lead} ${indent}${tag("SPAN", c.bgGray)} ${c.bold(span.name)} ${fmtDuration(dur)} ` +
        `${c.gray(scope)}${traceTag}${errBadge}`,
    );
  }

  if (isError) {
    for (const err of collectErrors(span)) {
      lines.push(
        `${pad}${c.red(`✖ ${err.type ?? "Error"}${err.message ? `: ${err.message}` : ""}`)}`,
      );
      if (err.stack) {
        for (const l of err.stack.split("\n").slice(1, 5))
          lines.push(`${pad}  ${c.gray(l.trim())}`);
      }
    }
  }
  return lines;
}

/* ------------------------------ Exporter ----------------------------- */
class TreeConsoleSpanExporter implements SpanExporter {
  private buffers = new Map<
    string,
    { spans: ReadableSpan[]; timer?: NodeJS.Timeout }
  >();

  export(spans: ReadableSpan[], done: (r: ExportResult) => void): void {
    for (const span of spans) {
      try {
        if (USE_JSON) this.printJson(span);
        else this.buffer(span);
      } catch (e) {
        console.error("[OpenTelemetry] exporter error:", e);
      }
    }
    done({ code: ExportResultCode.SUCCESS });
  }

  private buffer(span: ReadableSpan) {
    const id = span.spanContext().traceId;
    const buf = this.buffers.get(id) ?? { spans: [] };
    buf.spans.push(span);
    this.buffers.set(id, buf);
    if (buf.timer) clearTimeout(buf.timer);

    // Request (SERVER) hoặc span gốc kết thúc -> in cả cây ngay
    if (span.kind === SpanKind.SERVER || !parentIdOf(span)) {
      this.flush(id);
    } else {
      // Trace không có root (job nền, khởi động...) -> in sau một khoảng ngắn
      buf.timer = setTimeout(() => this.flush(id), ORPHAN_FLUSH_MS);
      buf.timer.unref?.();
    }
  }

  private flush(traceId: string) {
    const buf = this.buffers.get(traceId);
    if (!buf) return;
    if (buf.timer) clearTimeout(buf.timer);
    this.buffers.delete(traceId);

    const byId = new Map(buf.spans.map((s) => [s.spanContext().spanId, s]));
    const children = new Map<string, ReadableSpan[]>();
    const roots: ReadableSpan[] = [];
    for (const s of buf.spans) {
      const p = parentIdOf(s);
      if (p && byId.has(p))
        (children.get(p) ?? children.set(p, []).get(p)!).push(s);
      else roots.push(s);
    }
    const byStart = (a: ReadableSpan, b: ReadableSpan) =>
      toMs(a.startTime) - toMs(b.startTime);
    roots.sort(byStart);

    const out: string[] = [];
    const walk = (s: ReadableSpan, depth: number, base: number) => {
      const kids = (children.get(s.spanContext().spanId) ?? []).sort(byStart);
      if (isNoise(s)) {
        // ẩn span này nhưng vẫn in con ở cùng cấp
        for (const k of kids) walk(k, depth, base);
        return;
      }
      out.push(...formatSpan(s, depth, base));
      for (const k of kids) walk(k, depth + 1, base);
    };
    for (const r of roots) walk(r, 0, toMs(r.startTime));
    if (out.length) console.log(out.join("\n"));
  }

  private printJson(span: ReadableSpan) {
    if (isNoise(span)) return;
    const ctx = span.spanContext();
    const a = span.attributes;
    console.log(
      JSON.stringify({
        type: classify(span),
        time: new Date(toMs(span.startTime)).toISOString(),
        traceId: ctx.traceId,
        spanId: ctx.spanId,
        parentSpanId: parentIdOf(span),
        name: span.name,
        scope: span.instrumentationScope.name,
        kind: SpanKind[span.kind],
        durationMs: durationOf(span),
        status: SpanStatusCode[span.status.code],
        method: httpMethod(span),
        route: str(a["http.route"]) ?? str(a["url.full"]),
        statusCode:
          num(a["http.response.status_code"]) ?? num(a["http.status_code"]),
        clientIp: str(a["client.address"]) ?? str(a["http.client_ip"]),
        userAgent: str(a["user_agent.original"]) ?? str(a["http.user_agent"]),
        query: str(a["db.query.text"]) ?? str(a["db.statement"]),
        db: str(a["db.namespace"]) ?? str(a["db.name"]),
        host: str(a["server.address"]),
        errors:
          span.status.code === SpanStatusCode.ERROR
            ? collectErrors(span)
            : undefined,
      }),
    );
  }

  async forceFlush() {
    for (const id of [...this.buffers.keys()]) this.flush(id);
  }
  async shutdown() {
    await this.forceFlush();
  }
}

/* -------------------------------- SDK -------------------------------- */
const sdk = new NodeSDK({
  // SimpleSpanProcessor: in ngay khi span kết thúc (mặc định NodeSDK gom lô 5s)
  spanProcessors: [new SimpleSpanProcessor(new TreeConsoleSpanExporter())],
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": { enabled: false },
      "@opentelemetry/instrumentation-dns": { enabled: false },
      "@opentelemetry/instrumentation-net": { enabled: false },
      "@opentelemetry/instrumentation-pg": { enhancedDatabaseReporting: false },
      "@opentelemetry/instrumentation-http": {
        ignoreIncomingRequestHook: (req) =>
          req.url === "/health" || req.url === "/favicon.ico",
      },
    }),
  ],
});

sdk.start();

const shutdown = () => sdk.shutdown().finally(() => process.exit(0));
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

console.log(
  `${c.cyan("[OpenTelemetry]")} ready ${c.gray(`(format=${USE_JSON ? "json" : "tree"}, slow>=${SLOW_MS}ms)`)}`,
);
