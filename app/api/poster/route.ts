import { NextRequest, NextResponse } from "next/server";

type WikiSearchResult = { title: string };
type WikiSummary = { thumbnail?: { source?: string }; originalimage?: { source?: string } };

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get("title")?.trim();
  const year = request.nextUrl.searchParams.get("year")?.trim();

  if (!title || title.length > 140) {
    return NextResponse.json({ posterUrl: null }, { status: 400 });
  }

  const query = new URLSearchParams({
    action: "query",
    format: "json",
    list: "search",
    srsearch: `${title} ${year || ""} film`.trim(),
    srnamespace: "0",
    srlimit: "5",
  });

  try {
    const response = await fetch(`https://en.wikipedia.org/w/api.php?${query}`, {
      next: { revalidate: 60 * 60 * 24 * 30 },
      headers: { "User-Agent": "FlickPick movie discovery app" },
    });
    if (!response.ok) throw new Error(`Wikipedia request failed (${response.status})`);

    const data = await response.json() as { query?: { search?: WikiSearchResult[] } };
    const normalized = title.toLowerCase();
    const pages = data.query?.search || [];
    const orderedPages = [...pages].sort((a, b) => Number(b.title.toLowerCase().startsWith(normalized)) - Number(a.title.toLowerCase().startsWith(normalized)));

    for (const page of orderedPages) {
      const summaryResponse = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.title.replaceAll(" ", "_"))}`, {
        next: { revalidate: 60 * 60 * 24 * 30 },
        headers: { "User-Agent": "FlickPick movie discovery app" },
      });
      if (!summaryResponse.ok) continue;
      const summary = await summaryResponse.json() as WikiSummary;
      const posterUrl = summary.thumbnail?.source || summary.originalimage?.source;
      if (posterUrl) {
        return NextResponse.json(
          { posterUrl },
          { headers: { "Cache-Control": "public, s-maxage=2592000, stale-while-revalidate=86400" } },
        );
      }
    }

    return NextResponse.json(
      { posterUrl: null },
      { headers: { "Cache-Control": "public, s-maxage=2592000, stale-while-revalidate=86400" } },
    );
  } catch {
    return NextResponse.json({ posterUrl: null }, { headers: { "Cache-Control": "public, s-maxage=3600" } });
  }
}
