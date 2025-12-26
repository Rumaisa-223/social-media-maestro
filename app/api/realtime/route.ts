import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth/session";
import { subscribeToRealtime } from "@/lib/realtime";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      const unsubscribe = subscribeToRealtime(session.user.id, send);
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(":ping\n\n"));
      }, 15000);

      controller.enqueue(encoder.encode(`event: ready\ndata: {}\n\n`));

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      });
    },
    cancel() {
      // noop
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}


