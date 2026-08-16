/** Read a public URL as plain text (Jina Reader — no API key). */
export async function fetchWebPage(url: string): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http(s) URLs are supported");
  }

  const readerUrl = `https://r.jina.ai/${parsed.toString()}`;
  const res = await fetch(readerUrl, {
    headers: { Accept: "text/plain" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    throw new Error(`Could not read page (${res.status})`);
  }
  const text = await res.text();
  const max = 6000;
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
