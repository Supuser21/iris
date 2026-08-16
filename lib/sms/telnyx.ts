export function hasTelnyxConfig() {
  return Boolean(
    process.env.TELNYX_API_KEY && process.env.TELNYX_PHONE_NUMBER
  );
}

export function getTelnyxFrom() {
  return process.env.TELNYX_PHONE_NUMBER!;
}

export async function sendViaTelnyx(to: string, body: string) {
  const truncated = body.length > 320 ? body.slice(0, 317) + "..." : body;
  const res = await fetch("https://api.telnyx.com/v2/messages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getTelnyxFrom(),
      to,
      text: truncated,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Telnyx SMS failed (${res.status}): ${err}`);
  }
  return res.json();
}
