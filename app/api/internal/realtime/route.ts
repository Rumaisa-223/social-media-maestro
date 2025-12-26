import { NextRequest, NextResponse } from "next/server";
import { emitRealtime } from "@/lib/realtime";

export async function POST(request: NextRequest) {
  const token = process.env.INTERNAL_API_TOKEN;
  const authHeader = request.headers.get("authorization");
  if (token && authHeader !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  if (!body?.userId || !body?.type) {
    return NextResponse.json({ error: "Missing userId or type" }, { status: 400 });
  }

  emitRealtime({
    type: body.type,
    userId: body.userId,
    payload: body.payload ?? {},
  });

  return NextResponse.json({ success: true });
}


