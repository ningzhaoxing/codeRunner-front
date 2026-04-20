export interface SSEEvent {
  type: string;
  [key: string]: unknown;
}

export async function fetchSSE(
  url: string,
  body: Record<string, unknown>,
  onEvent: (event: SSEEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();

      // Handle "event: xxx" lines
      if (trimmed.startsWith("event: ")) {
        currentEvent = trimmed.slice(7);
        continue;
      }

      // Handle "data: xxx" lines
      if (trimmed.startsWith("data: ")) {
        try {
          const data = JSON.parse(trimmed.slice(6));

          // If there was an "event:" line, use it as type (overrides data.type if present)
          if (currentEvent) {
            onEvent({ type: currentEvent, ...data } as SSEEvent);
            currentEvent = "";
          } else {
            // Otherwise use data.type from payload
            onEvent(data as SSEEvent);
          }
        } catch {
          // skip malformed JSON
        }
      }
    }
  }
}
