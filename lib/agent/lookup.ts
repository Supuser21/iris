/** User wants a link, search result, or explicit SMS delivery. */
export function needsWebLookup(message: string): boolean {
  const m = message.toLowerCase();
  return (
    /\b(send|text|sms)\b.*\b(link|url|site|website)\b/.test(m) ||
    /\b(link|url)\b.*\b(send|text)\b/.test(m) ||
    /\b(send me|text me|shoot me)\b/.test(m) ||
    /\b(look up|lookup|search|find)\b/.test(m) ||
    /\b(coinmarketcap|flight|flights|price of)\b/.test(m) ||
    /\bhttps?:\/\//.test(m)
  );
}

/** On SMS, "send link" means deliver via text message. */
export function wantsSmsDelivery(message: string, channel: "web" | "sms"): boolean {
  if (channel === "sms") {
    return (
      needsWebLookup(message) ||
      /\b(send|text|shoot)\b/i.test(message)
    );
  }
  const m = message.toLowerCase();
  return (
    /\b(text|sms)\b.*\b(me|my phone|link)\b/.test(m) ||
    /\bsend\b.*\bto my phone\b/.test(m)
  );
}

export function getLookupAck(channel: "web" | "sms"): string {
  return channel === "sms"
    ? "On it — looking that up. I'll text you the link in a sec."
    : "On it — searching for that now.";
}

export function isBriefSendConfirmation(text: string): boolean {
  const t = text.trim().toLowerCase();
  return (
    t.length < 60 &&
    (/^(sent|sent!|sent ✓|done|here you go|on it)\.?$/i.test(t) ||
      /^sent[.!—\s-]/i.test(t) ||
      /^link sent/i.test(t))
  );
}
