// Outbound notification dispatch. Webhook only for now (native fetch).
export async function notifyChannel(
  channel: { type: string; url: string },
  payload: unknown,
): Promise<void> {
  if (channel.type !== "webhook") return;
  try {
    await fetch(channel.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // best-effort; a dead webhook must not break the scheduler
  }
}
