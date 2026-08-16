export type InboundSms = { from: string; body: string };

function pack(from: string, body: string): InboundSms | null {
  const f = from.trim();
  const b = body.trim();
  return f && b ? { from: f, body: b } : null;
}

export async function parseInboundSms(req: Request): Promise<InboundSms | null> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData();
    return pack(String(form.get("From") ?? ""), String(form.get("Body") ?? ""));
  }

  const json = await req.json();

  if (json.eventType === "SMS_INBOUND") {
    return pack(json.from ?? "", json.text ?? "");
  }

  if (json.data?.event_type === "message.received") {
    const payload = json.data.payload;
    return pack(
      payload?.from?.phone_number ?? "",
      payload?.text ?? ""
    );
  }

  return pack(
    json.From ??
      json.from ??
      json.data?.payload?.from?.phone_number ??
      "",
    json.Body ?? json.body ?? json.data?.payload?.text ?? ""
  );
}
