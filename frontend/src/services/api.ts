const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export async function runAgent(
  thesis: string,
  onEvent: (event: string, data: Record<string, unknown>) => void,
): Promise<void> {
  const response = await fetch(`${API_BASE}/api/agent/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ thesis }),
  });

  if (!response.ok) {
    throw new Error(`Agent run failed: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    let currentEvent = "";
    for (const line of lines) {
      if (line.startsWith("event: ")) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith("data: ") && currentEvent) {
        try {
          const data = JSON.parse(line.slice(6));
          onEvent(currentEvent, data);
        } catch {
          // skip malformed JSON
        }
        currentEvent = "";
      }
    }
  }
}

export async function getStrategy(id: string) {
  const res = await fetch(`${API_BASE}/api/strategy/${id}`);
  if (!res.ok) throw new Error("Strategy not found");
  return res.json();
}

export async function approveStrategy(id: string) {
  const res = await fetch(`${API_BASE}/api/strategy/${id}/approve`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to approve");
  return res.json();
}

export async function listStrategies() {
  const res = await fetch(`${API_BASE}/api/strategies`);
  if (!res.ok) throw new Error("Failed to list strategies");
  return res.json();
}
