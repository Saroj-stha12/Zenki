export function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

export function error(message: string, status = 400, extra?: Record<string, unknown>) {
  return json({ error: message, ...extra }, { status });
}

