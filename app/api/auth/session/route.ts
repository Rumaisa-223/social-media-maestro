import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

const noCacheHeaders = {
  "Cache-Control": "private, no-cache, no-store",
  Pragma: "no-cache",
  Expires: "0",
};

/**
 * Mirrors the behavior of NextAuth's built-in session route while
 * letting us enrich the session via `auth()`. When no session exists
 * we must return an empty object instead of `null`, otherwise the
 * NextAuth client throws `CLIENT_FETCH_ERROR` while parsing the result.
 */
export async function GET() {
  try {
    const session = await auth();

    return NextResponse.json(session ?? {}, {
      status: 200,
      headers: noCacheHeaders,
    });
  } catch (error) {
    console.error("[Session API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: noCacheHeaders,
      },
    );
  }
}

