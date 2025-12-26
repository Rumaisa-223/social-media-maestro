import { NextRequest, NextResponse } from "next/server"; 

type InspPost = {
  source: string;
  user: string;
  text: string;
  imageUrl?: string;
  stats: { likes: number; comments: number; time: string };
};

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function extractFirstImg(html: string): string | undefined {
  const m = html.match(/<img[^>]*src=["']([^"']+)["']/i);
  return m?.[1];
}

async function fetchRss(url: string): Promise<InspPost[]> {
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const xml = await res.text();

    const items =
      xml.split(/<item[\s>][\s\S]*?<\/item>/gi).length > 1
        ? xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || []
        : xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];

    return items
      .map((item) => {
        const titleMatch = item.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const imgMatch =
          item.match(/<enclosure[^>]*url="([^"]+)"/i) ||
          item.match(/<media:content[^>]*url="([^"]+)"/i);

        const text = stripHtml(String(titleMatch?.[1] || ""));
        const imageUrl = imgMatch?.[1];

        return {
          source: "rss",
          user: "",
          text,
          imageUrl,
          stats: {
            likes: 0,
            comments: 0,
            time: new Date().toISOString(),
          },
        } as InspPost;
      })
      .filter((p) => p.text);
  } catch {
    return [];
  }
}

async function fetchPinterestBoard(): Promise<InspPost[]> {
  // ⭐ WORKING Pinterest RSS feed
  const url =
    "https://www.pinterest.com/pinboost/social-media-content-ideas/rss";

  try {
    const res = await fetch(url, { next: { revalidate: 180 } });
    if (!res.ok) return [];
    const xml = await res.text();

    const items = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];

    return items
      .map((item) => {
        const titleMatch = item.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const descMatch = item.match(
          /<description[^>]*>([\s\S]*?)<\/description>/i
        );
        const enclosureMatch =
          item.match(/<enclosure[^>]*url="([^"]+)"/i) ||
          item.match(/<media:content[^>]*url="([^"]+)"/i);
        const dateMatch = item.match(
          /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i
        );

        const title = stripHtml(String(titleMatch?.[1] || ""));
        const desc = stripHtml(String(descMatch?.[1] || ""));
        const text = desc || title;

        const imgFromDesc = extractFirstImg(
          String(descMatch?.[1] || "")
        );
        const imageUrl = enclosureMatch?.[1] || imgFromDesc;

        const time =
          String(dateMatch?.[1] || new Date().toISOString());

        return {
          source: "pinterest",
          user: "Pinterest SMM Board",
          text,
          imageUrl,
          stats: { likes: 0, comments: 0, time },
        } as InspPost;
      })
      .filter((p) => p.text);
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const posts = (await fetchPinterestBoard()).slice(0, 24);

  const summary = posts.length
    ? `Inspiration pulled from Pinterest Board RSS: Pinterest SMM Feed.`
    : `No items found.`;

  return NextResponse.json({ posts, summary });
}
