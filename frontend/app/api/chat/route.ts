const backend = () => (process.env.BACKEND_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

function visitorContext(request: Request) {
  const existing = request.headers.get("cookie")?.match(/(?:^|;\s*)flightai-visitor=([a-f0-9-]{36})(?:;|$)/)?.[1];
  const visitor = existing || crypto.randomUUID();
  const headers = { "Content-Type": "application/json", "x-chat-visitor": visitor };
  function reply(data: unknown, init: ResponseInit = {}) {
    const response = Response.json(data, init);
    response.headers.set("Cache-Control", "no-store");
    if (!existing) response.headers.set("Set-Cookie", `flightai-visitor=${visitor}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
    return response;
  }
  return { headers, reply };
}

export async function GET(request: Request) {
  const { headers, reply } = visitorContext(request);
  try {
    const response = await fetch(`${backend()}/chat/usage`, { headers, cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (!response.ok) return reply({ error: "Usage is temporarily unavailable." }, { status: 503 });
    return reply(await response.json());
  } catch { return reply({ error: "Usage is temporarily unavailable." }, { status: 503 }); }
}

export async function POST(request: Request) {
  const { headers, reply } = visitorContext(request);
  let body;
  try { body = await request.json(); }
  catch { return reply({ error: "Please send a valid message." }, { status: 400 }); }
  if (typeof body?.message !== "string" || !body.message.trim() || body.message.length > 8000 || !Array.isArray(body.history) || body.history.length > 100 || body.history.some((m: { role?: string; content?: string }) => !m || !["user", "assistant"].includes(m.role || "") || typeof m.content !== "string" || !m.content.length || m.content.length > 16000)) {
    return reply({ error: "Please send a valid travel question." }, { status: 400 });
  }
  try {
    const response = await fetch(`${backend()}/chat`, {
      method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(90000),
    });
    if (!response.ok) {
      const failure = await response.json().catch(() => null);
      const error = typeof failure?.detail === "string" ? failure.detail : "The travel assistant couldn’t answer right now. Please try again.";
      return reply({ error }, { status: response.status });
    }
    const data = await response.json();
    if (typeof data?.response !== "string" || !data.response.trim()) {
      return reply({ error: "The assistant returned an empty answer. Please try again." }, { status: 502 });
    }
    return reply({ response: data.response });
  } catch {
    return reply({ error: "We couldn’t reach the travel assistant. Make sure the backend is running and try again." }, { status: 503 });
  }
}
