"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Facebook, Twitter, Instagram, ExternalLink, CheckCircle, AlertTriangle, Cloud, Globe } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";

const PLATFORM_CONFIGS = {
  facebook: {
    name: "Facebook",
    icon: Facebook,
    color: "bg-blue-600",
    defaultScopes: ["pages_manage_posts", "pages_read_engagement", "pages_show_list", "business_management"],
    docs: "https://developers.facebook.com/docs/facebook-login",
  },
  twitter: {
    name: "Twitter (X)",
    icon: Twitter,
    color: "bg-black",
    defaultScopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
    docs: "https://developer.twitter.com/en/docs/authentication/oauth-2-0",
  },
  instagram: {
    name: "Instagram",
    icon: Instagram,
    color: "bg-pink-600",
    defaultScopes: [
      "instagram_basic",
      "pages_show_list",
      "pages_read_engagement",
      "instagram_content_publish",
      "business_management",
    ],
    docs: "https://developers.facebook.com/docs/instagram-api/guides/content-publishing",
  },
  bluesky: {
    name: "Bluesky",
    icon: Cloud,
    color: "bg-sky-600",
    defaultScopes: ["atproto", "transition:generic", "transition:email"],
    docs: "https://docs.bsky.app/docs/advanced-guides/oauth-client",
  },
  mastodon: {
    name: "Mastodon",
    icon: Globe,
    color: "bg-indigo-700",
    defaultScopes: ["read", "write", "follow", "push"],
    docs: "https://docs.joinmastodon.org/client/authorization/",
  },
} as const;

type PlatformKey = keyof typeof PLATFORM_CONFIGS;

type Account = {
  id: string;
  provider: PlatformKey;
  label: string;
  avatar?: string;
  isActive: boolean;
  tokenExpiresAt?: string | null;
  lastConnectedAt?: string | null;
  scope?: string | null;
};

export default function SocialAuth() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [workingPlatform, setWorkingPlatform] = useState<PlatformKey | null>(null);
  const [bsConnected, setBsConnected] = useState<boolean>(false);
  const router = useRouter();

  // ✅ Hydration-safe origin
  const origin = useMemo(() => {
    if (typeof window === "undefined") {
      return "http://localhost:3000"; // server pe hard-coded
    }
    return window.location.origin;
  }, []);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/connected-accounts");
      const data = await res.json();
      setAccounts(data.accounts ?? []);
      const bs = (data.accounts ?? []).some((a: any) => a.provider === "bluesky" && a.isActive);
      setBsConnected(bs);
    } catch (error) {
      console.error("Failed to load connected accounts", error);
      toast({ title: "Error", description: "Unable to load connected accounts", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const launchOAuth = async (platform: PlatformKey, action: "connect" | "reconnect" = "connect") => {
    setWorkingPlatform(platform);
    try {
      const res = await fetch(`/api/social/${platform}?action=${action}`);
      if (!res.ok) throw new Error("Failed to start OAuth flow");
      const data = await res.json();
      window.location.assign(data.authUrl);
    } catch (error) {
      console.error("OAuth start failed", error);
      toast({ title: "OAuth Error", description: "Unable to start OAuth flow. Please try again.", variant: "destructive" });
      setWorkingPlatform(null);
    }
  };

  const connectBluesky = () => {
    setWorkingPlatform("bluesky");
    router.push("/dashboard/auth/bluesky");
    setWorkingPlatform(null);
  };

  const disconnect = async (platform: PlatformKey) => {
    setWorkingPlatform(platform);
    try {
      const res = await fetch(`/api/social/${platform}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to disconnect");
      toast({ title: "Disconnected", description: `Disconnected from ${PLATFORM_CONFIGS[platform].name}` });
      fetchAccounts();
    } catch (error) {
      console.error("Disconnect failed", error);
      toast({ title: "Error", description: "Unable to disconnect account", variant: "destructive" });
    } finally {
      setWorkingPlatform(null);
    }
  };

  const getAccount = (platform: PlatformKey) => accounts.find((a: Account) => a.provider === platform);

  const getStatusBadge = (account?: Account) => {
    if (account?.isActive) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Connected
        </Badge>
      );
    }
    return <Badge variant="outline">Disconnected</Badge>;
  };

  const connectedCount = accounts.filter((a: Account) => a.isActive).length + (bsConnected ? 1 : 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Social Media Authentication</h2>
        <p className="text-muted-foreground">Link Facebook, Twitter (X), Instagram, Bluesky, and Mastodon to enable scheduling & auto-posting.</p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Setup Required:</strong> Manage connections from{" "}
          <Link href="/dashboard/auth" className="underline">
            Dashboard → Auth
          </Link>
          . Add <code>{origin}/api/social/callback/&lt;provider&gt;</code> as the redirect URL in your developer apps. Connected accounts: {connectedCount}/{Object.keys(PLATFORM_CONFIGS).length}.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {(Object.keys(PLATFORM_CONFIGS) as PlatformKey[]).map((platformKey) => {
          const config = PLATFORM_CONFIGS[platformKey];
          const Icon = config.icon;
          const account = getAccount(platformKey);
          const isConnected = platformKey === "bluesky" ? bsConnected : !!account?.isActive;

          return (
            <Card key={platformKey} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${config.color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{config.name}</CardTitle>
                      <CardDescription>{platformKey === "bluesky" ? "Direct Login" : "OAuth 2.0 Integration"}</CardDescription>
                    </div>
                  </div>
                  {platformKey === "bluesky" ? (
                    bsConnected ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline">Disconnected</Badge>
                    )
                  ) : (
                    getStatusBadge(account)
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Required Scopes</h4>
                  <div className="flex flex-wrap gap-1">
                    {config.defaultScopes.map((scope) => (
                      <Badge key={scope} variant="outline" className="text-xs">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                </div>

                {account?.lastConnectedAt && (
                  <div className="text-sm text-muted-foreground">
                    Last connected: {new Date(account.lastConnectedAt).toLocaleString()}
                    {account.tokenExpiresAt && (
                      <span className="block">Token expires: {new Date(account.tokenExpiresAt).toLocaleString()}</span>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  {isConnected ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => (platformKey === "bluesky" ? connectBluesky() : launchOAuth(platformKey, "reconnect"))}
                        disabled={workingPlatform === platformKey}
                      >
                        Reconnect
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => (platformKey === "bluesky" ? disconnect("bluesky") : disconnect(platformKey))}
                        disabled={workingPlatform === platformKey}
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    platformKey === "bluesky" ? (
                      <Button
                        onClick={connectBluesky}
                        disabled={workingPlatform === platformKey || isLoading}
                        className="w-full"
                      >
                        {workingPlatform === platformKey ? "Opening…" : "Connect"}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => launchOAuth(platformKey)}
                        disabled={workingPlatform === platformKey || isLoading}
                        className="w-full"
                      >
                        {workingPlatform === platformKey ? "Redirecting…" : "Connect"}
                      </Button>
                    )
                  )}
                </div>

                <Button variant="ghost" size="sm" className="w-full" onClick={() => window.open(config.docs, "_blank")}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Documentation
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">1. Create Developer Applications</h4>
            <p className="text-sm text-muted-foreground">Visit each platform&apos;s developer portal and create a new application:</p>
            <ul className="text-sm text-muted-foreground ml-4 space-y-1">
              <li>
                • Facebook:{" "}
                <a href="https://developers.facebook.com" className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">
                  developers.facebook.com
                </a>
              </li>
              <li>
                • Twitter:{" "}
                <a href="https://developer.twitter.com" className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">
                  developer.twitter.com
                </a>
              </li>
              <li>
                • Instagram (via Meta Graph API):{" "}
                <a href="https://developers.facebook.com/docs/instagram-api" className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">
                  developers.facebook.com/docs/instagram-api
                </a>
              </li>
              <li>
                • Bluesky:{" "}
                <a href="https://docs.bsky.app" className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">
                  docs.bsky.app
                </a>
              </li>
              <li>
                • Mastodon:{" "}
                <a href="https://docs.joinmastodon.org" className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">
                  docs.joinmastodon.org
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">2. Configure OAuth Settings</h4>
            <p className="text-sm text-muted-foreground">Add the following redirect URI to your applications:</p>
            <code className="block p-2 bg-muted rounded text-sm">
              {origin}/api/social/callback/&lt;provider&gt;
            </code>
            <p className="text-sm text-muted-foreground">Instagram uses Meta Graph API. Ensure a Professional IG account linked to a Facebook Page and approved permissions: instagram_basic, pages_show_list, pages_read_engagement, instagram_content_publish, business_management.</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">3. Environment Variables</h4>
            <p className="text-sm text-muted-foreground">Add your client credentials to your environment variables:</p>
            <div className="space-y-1 text-sm font-mono bg-muted p-2 rounded">
              <div>FACEBOOK_CLIENT_ID=your_facebook_client_id</div>
              <div>FACEBOOK_CLIENT_SECRET=your_facebook_client_secret</div>
              <div>TWITTER_CLIENT_ID=your_twitter_client_id</div>
              <div>TWITTER_CLIENT_SECRET=your_twitter_client_secret</div>
              <div>BLUESKY_SERVICE_URL=https://bsky.social</div>
              <div>BLUESKY_IDENTIFIER=your_handle.bsky.social</div>
              <div>BLUESKY_PASSWORD=your_password</div>
              <div>MASTODON_CLIENT_ID=your_mastodon_client_id</div>
              <div>MASTODON_CLIENT_SECRET=your_mastodon_client_secret</div>
              <div>MASTODON_INSTANCE_URL=https://your.instance.url</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
