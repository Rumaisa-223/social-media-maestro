import { NextRequest, NextResponse } from 'next/server';
import { OAUTH } from '@/lib/oauth-providers';
import { randomBytes } from 'crypto';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  if (!OAUTH[platform as keyof typeof OAUTH])
    return NextResponse.json({ error: 'Bad platform' }, { status: 400 });

  const cfg = OAUTH[platform as keyof typeof OAUTH];
  const state = randomBytes(16).toString('hex');
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback/${platform}`;
  const scope = encodeURIComponent(cfg.scopes.join(' '));
  const qs = `client_id=${encodeURIComponent(cfg.clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&state=${encodeURIComponent(state)}`;
  const res = NextResponse.redirect(`${cfg.authorizeUrl}?${qs}`);
  res.cookies.set(`oauth_state_${platform}`, state, { httpOnly: true, sameSite: 'lax', maxAge: 600 });
  return res;
}