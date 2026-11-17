const casPostsUrl = "https://cas.ifmt.edu.br/wp-json/wp/v2/posts?per_page=8&orderby=date&order=desc&_fields=id,date,link,title";
const casHost = "cas.ifmt.edu.br";

export type CasNewsItem = {
  id: number;
  title: string;
  publishedOn: string;
  url: string;
};

export type CasNewsResult = {
  status: "ready" | "partial" | "unavailable";
  items: CasNewsItem[];
  skipped: number;
};

function plainTitle(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const title = value
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&#0*8217;/g, "’")
    .replace(/&#0*8211;/g, "–")
    .replace(/&#0*8212;/g, "—")
    .replace(/&hellip;/g, "…")
    .replace(/&nbsp;/g, " ")
    .trim();
  return title.length > 0 && title.length <= 300 ? title : null;
}

function normalizePost(value: unknown): CasNewsItem | null {
  if (!value || typeof value !== "object") return null;
  const post = value as Record<string, unknown>;
  const titleObject = post.title;
  const title = titleObject && typeof titleObject === "object"
    ? plainTitle((titleObject as Record<string, unknown>).rendered)
    : null;
  if (!Number.isSafeInteger(post.id) || (post.id as number) < 1 || !title || typeof post.date !== "string") return null;

  const publishedOn = post.date.slice(0, 10);
  const parsedDate = new Date(`${publishedOn}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedOn)
    || !Number.isFinite(Date.parse(post.date))
    || !Number.isFinite(parsedDate.getTime())
    || parsedDate.toISOString().slice(0, 10) !== publishedOn) return null;

  if (typeof post.link !== "string") return null;
  try {
    const url = new URL(post.link);
    if (url.protocol !== "https:" || url.hostname !== casHost || url.port || url.username || url.password || url.search || url.hash || url.pathname === "/") return null;
    return { id: post.id as number, title, publishedOn, url: url.href };
  } catch {
    return null;
  }
}

export function parseCasNewsPayload(payload: unknown): CasNewsResult {
  if (!Array.isArray(payload)) return { status: "unavailable", items: [], skipped: 0 };
  const items = payload.flatMap((post) => {
    const normalized = normalizePost(post);
    return normalized ? [normalized] : [];
  });
  const skipped = payload.length - items.length;
  return { status: skipped ? "partial" : "ready", items, skipped };
}

export async function getCasNews(fetcher: typeof fetch = fetch): Promise<CasNewsResult> {
  let response: Response;
  try {
    response = await fetcher(casPostsUrl, {
      headers: { accept: "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 900 },
    });
  } catch (error) {
    if (!(error instanceof TypeError) && !(error instanceof DOMException)) throw error;
    console.error("[SIFCAS CAS feed] Public news request failed", error.message);
    return { status: "unavailable", items: [], skipped: 0 };
  }
  if (!response.ok) {
    console.error("[SIFCAS CAS feed] Public news request returned", response.status);
    return { status: "unavailable", items: [], skipped: 0 };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    console.error("[SIFCAS CAS feed] Public news response was not valid JSON");
    return { status: "unavailable", items: [], skipped: 0 };
  }
  return parseCasNewsPayload(payload);
}
