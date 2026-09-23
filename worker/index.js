// Vercel形式の api/*.js を Cloudflare Workers で動かすための変換層
import submit from "../api/submit.js";

const routes = {
  "/api/submit": submit,
};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const handler = routes[url.pathname.replace(/\/$/, "")];
    if (!handler) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
    return runVercelHandler(handler, request, url);
  },
};

async function runVercelHandler(handler, request, url) {
  let body;
  const raw = ["GET", "HEAD"].includes(request.method) ? "" : await request.text();
  const type = request.headers.get("content-type") || "";
  if (raw && type.includes("application/json")) {
    try { body = JSON.parse(raw); } catch { body = raw; }
  } else if (raw && type.includes("application/x-www-form-urlencoded")) {
    body = Object.fromEntries(new URLSearchParams(raw));
  } else {
    body = raw || undefined;
  }

  const req = {
    method: request.method,
    url: url.pathname + url.search,
    query: Object.fromEntries(url.searchParams),
    headers: Object.fromEntries(request.headers),
    body,
  };

  let status = 200;
  let payload = null;
  const headers = new Headers();
  let done;
  const finished = new Promise((r) => (done = r));
  const res = {
    status(code) { status = code; return res; },
    setHeader(k, v) { headers.set(k, v); return res; },
    getHeader(k) { return headers.get(k); },
    json(obj) {
      if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json; charset=utf-8");
      payload = JSON.stringify(obj); done(); return res;
    },
    send(data) {
      if (typeof data === "object" && data !== null) return res.json(data);
      payload = data ?? null; done(); return res;
    },
    end(data) { payload = data ?? null; done(); return res; },
  };

  await Promise.race([Promise.resolve(handler(req, res)).then(() => done()), finished]);
  return new Response(payload, { status, headers });
}
