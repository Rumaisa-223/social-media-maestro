import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerAuthSession } from "@/lib/auth/session"

export async function GET() {
  const session = await getServerAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  }
  const userId = session.user.id
  try {
    let record = await (prisma as any).userSettings.findUnique({ where: { userId } })
    if (!record) {
      record = await (prisma as any).userSettings.create({ data: { userId } })
    }
    return NextResponse.json({
      email_account_updates: record.email_account_updates,
      email_marketing_news: record.email_marketing_news,
      email_product_updates: record.email_product_updates,
      push_messages: record.push_messages,
      push_engagement: record.push_engagement,
      push_scheduled_posts: record.push_scheduled_posts,
      auto_save_drafts: record.auto_save_drafts,
      add_watermark: record.add_watermark,
      image_optimization: record.image_optimization,
      hashtags: (record.hashtags as any) || [],
      hashtag_groups: (record.hashtag_groups as any) || [],
    })
  } catch {
    return NextResponse.json({
      email_account_updates: true,
      email_marketing_news: false,
      email_product_updates: true,
      push_messages: true,
      push_engagement: true,
      push_scheduled_posts: true,
      auto_save_drafts: true,
      add_watermark: false,
      image_optimization: true,
      hashtags: [],
      hashtag_groups: [],
    })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  const userId = session.user.id
  const data = {
    email_account_updates: Boolean(body.email_account_updates),
    email_marketing_news: Boolean(body.email_marketing_news),
    email_product_updates: Boolean(body.email_product_updates),
    push_messages: Boolean(body.push_messages),
    push_engagement: Boolean(body.push_engagement),
    push_scheduled_posts: Boolean(body.push_scheduled_posts),
    auto_save_drafts: Boolean(body.auto_save_drafts),
    add_watermark: Boolean(body.add_watermark),
    image_optimization: Boolean(body.image_optimization),
    hashtags: body.hashtags ?? [],
    hashtag_groups: body.hashtag_groups ?? [],
  }
  try {
    const updated = await (prisma as any).userSettings.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json(data)
  }
}