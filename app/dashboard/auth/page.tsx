"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import SocialAuth from"@/components/token-management/social-auth";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"success" | "error" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const msg = searchParams.get("message");

    if (success) {
      setStatus("success");
      setMessage(`✅ Successfully connected to ${success}`);
    } else if (error) {
      setStatus("error");
      setMessage(`❌ Authentication failed: ${msg || error}`);
    }
  }, [searchParams]);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Authentication Setup</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Connect or reconnect your social accounts here. You can always return by opening <span className="font-medium">Dashboard → Auth</span>.
      </p>

      {status && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            status === "success"
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-red-100 text-red-800 border border-red-300"
          }`}
        >
          {message}
        </div>
      )}

      <SocialAuth />
    </div>
  );
}