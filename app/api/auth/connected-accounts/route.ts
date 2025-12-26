import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth/session";
import prisma from "@/lib/prisma";
import { ensureFreshToken, listSanitizedAccounts } from "@/lib/services/social-accounts";

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ accounts: [] }, { status: 200 });
  }

  const accounts = await prisma.socialAccount.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  await Promise.all(
    accounts.map((account) =>
      ensureFreshToken(account).catch((error) => {
        console.warn("Token refresh failed for account", account.id, error);
        return account;
      }),
    ),
  );

  const sanitized = await listSanitizedAccounts(session.user.id);
  return NextResponse.json({ accounts: sanitized });
}


