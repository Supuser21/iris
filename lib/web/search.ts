export type WebSearchResult = {
  title: string;
  url: string;
  snippet: string;
};

export function hasWebSearch() {
  return Boolean(process.env.TAVILY_API_KEY || process.env.SERPER_API_KEY);
}

export async function searchWeb(
  query: string,
  maxResults = 5
): Promise<WebSearchResult[]> {
  if (process.env.TAVILY_API_KEY) {
    return searchTavily(query, maxResults);
  }
  if (process.env.SERPER_API_KEY) {
    return searchSerper(query, maxResults);
  }
  throw new Error(
    "Web search is not configured. Add TAVILY_API_KEY or SERPER_API_KEY."
  );
}

async function searchTavily(
  query: string,
  maxResults: number
): Promise<WebSearchResult[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      max_results: maxResults,
      include_answer: true,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Tavily search failed (${res.status}): ${err}`);
  }
  const data = await res.json();
  const results: WebSearchResult[] = (data.results ?? []).map(
    (r: { title?: string; url?: string; content?: string }) => ({
      title: r.title ?? "",
      url: r.url ?? "",
      snippet: r.content ?? "",
    })
  );
  if (data.answer && results.length > 0) {
    results[0] = {
      ...results[0],
      snippet: `${data.answer}\n\n${results[0].snippet}`.trim(),
    };
  }
  return results;
}

async function searchSerper(
  query: string,
  maxResults: number
): Promise<WebSearchResult[]> {
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": process.env.SERPER_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num: maxResults }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Serper search failed (${res.status}): ${err}`);
  }
  const data = await res.json();
  return (data.organic ?? []).slice(0, maxResults).map(
    (r: { title?: string; link?: string; snippet?: string }) => ({
      title: r.title ?? "",
      url: r.link ?? "",
      snippet: r.snippet ?? "",
    })
  );
}
