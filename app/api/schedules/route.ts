import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createSchedulesForAccounts } from "@/lib/services/schedule-service";
import { getServerAuthSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const url = new URL(request.url);
  const idsParam = url.searchParams.get("ids");
  const dateParam = url.searchParams.get("date");
  
  const whereClause: any = { userId: session.user.id };
  
  // If IDs are provided, filter by them
  if (idsParam) {
    const ids = idsParam.split(",").filter(Boolean);
    whereClause.id = { in: ids };
  }

  if (dateParam) {
    const start = new Date(`${dateParam}T00:00:00.000Z`);
    const end = new Date(`${dateParam}T23:59:59.999Z`);
    whereClause.scheduledFor = { gte: start, lte: end };
  }

  const schedules = await prisma.schedule.findMany({
    where: whereClause,
    include: {
      socialAccount: {
        select: {
          provider: true,
        },
      },
      contentItem: {
        select: {
          id: true,
          metadata: true,
        },
      },
      post: {
        select: {
          id: true,
          status: true,
          platformPostId: true,
          responseMeta: true,
          createdAt: true,
        },
      },
    },
    orderBy: { scheduledFor: "desc" },
    take: idsParam ? undefined : 100, // No limit if querying specific IDs
  });

  return NextResponse.json({ schedules });
}

export async function POST(request: NextRequest) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { socialAccountIds, scheduledFor, timezone, repeat, contentItemId, content } = body;

  if (!socialAccountIds?.length) {
    return NextResponse.json({ error: "At least one social account is required" }, { status: 400 });
  }
  if (!scheduledFor || !timezone) {
    return NextResponse.json({ error: "Schedule time and timezone are required" }, { status: 400 });
  }

  try {
    const schedules = await createSchedulesForAccounts({
      userId: session.user.id,
      socialAccountIds,
      scheduledFor: new Date(scheduledFor),
      timezone,
      repeat,
      contentItemId,
      content,
      generatedBy: "schedule-post-form",
    });

    // Return schedules with full details for confirmation
    const schedulesWithDetails = await prisma.schedule.findMany({
      where: {
        id: { in: schedules.map(s => s.id) },
      },
      include: {
        socialAccount: {
          select: {
            provider: true,
          },
        },
        contentItem: {
          select: {
            id: true,
            metadata: true,
          },
        },
      },
    });

    return NextResponse.json({ 
      schedules: schedulesWithDetails,
      message: schedules.length > 1 
        ? `Successfully created ${schedules.length} schedules`
        : "Schedule created successfully"
    });
  } catch (error) {
    console.error("Failed to create schedule", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ 
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    }, { status: 400 });
  }
}


