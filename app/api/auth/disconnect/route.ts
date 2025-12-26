// app/api/auth/disconnect/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { platform } = await req.json();
  const userId = session.user.id as string;

  try {
    await db.socialToken.delete({
      where: {
        userId_platform: { userId, platform },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DISCONNECT] error:", err);
    return NextResponse.json(
      { error: "Failed to disconnect" },
      { status: 500 }
    );
  }
}