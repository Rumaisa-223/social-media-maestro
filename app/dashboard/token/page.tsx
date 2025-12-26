import SocialAuth from "@/components/token-management/social-auth";

export default function TokensPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Token Manager</h1>
      <SocialAuth />
    </div>
  );
}
