"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, RefreshCw, Sparkles, User } from "lucide-react";
import { AssetSelector } from "@/components/AssetSelector";
import TemplateSectionEnhanced from "@/components/template-section-enhanced";
import { useContentStore } from "@/lib/content-store";

function toClassyTokens(prompt: string): string[] {
  const p = (prompt || "").toLowerCase();
  const out: string[] = [];
  if (/calm|peace|quiet|zen|serene|soft/i.test(p)) out.push("calm");
  if (/independent|solo|own|self|strong|bold/i.test(p)) out.push("independent");
  if (/elegant|classy|luxury|grace|chic|minimal/i.test(p)) out.push("elegant");
  if (/positive|bright|happy|glow|shine|light/i.test(p)) out.push("positive");
  return out;
}

function makeClassyCaption(prompt: string, original?: string): string {
  const base = (original || "").trim();
  const tokens = toClassyTokens(prompt);
  const bank = [
    "Calmness over chaos",
    "Always classy, never trashy",
    "Flawless",
    "Independent",
    "Quiet luxury",
    "Grace over noise",
    "Soft power",
    "Own your aura",
    "Simply iconic",
    "Elegance in motion",
  ];
  const themed = tokens.includes("calm")
    ? ["Calmness over chaos", "Unbothered", "Ease, always"]
    : tokens.includes("independent")
    ? ["Independent", "Built different", "On my terms"]
    : tokens.includes("elegant")
    ? ["Quiet luxury", "Grace over noise", "Always classy, never trashy"]
    : tokens.includes("positive")
    ? ["Glow on", "Good energy only", "Flawless"]
    : bank;
  const pick = themed[Math.floor(Math.random() * themed.length)] || bank[0];
  const cleaned = base.replace(/[#@][\w.-]+/g, "").replace(/[\p{Emoji}\p{Extended_Pictographic}]/gu, "").replace(/\s+/g, " ").trim();
  if (!cleaned || cleaned.split(/\s+/).length > 6) return pick;
  return cleaned;
}

const CaptionSection = ({ caption, onSelectAction, selected }: { caption?: string; onSelectAction: (caption: string) => void; selected?: string }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
    <div className="flex justify-between mb-2">
      <Label className="text-base font-semibold">Caption</Label>
      <Select defaultValue="friendly">
        <SelectTrigger className="w-[120px] border-gray-300 shadow-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="friendly">Friendly</SelectItem>
          <SelectItem value="professional">Professional</SelectItem>
          <SelectItem value="casual">Casual</SelectItem>
          <SelectItem value="persuasive">Persuasive</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <AssetSelector assets={[caption ?? "Nothing yet…"]} type="caption" onSelectAction={onSelectAction} selected={selected} />
  </motion.div>
);

const HashtagSection = ({ hashtags, onSelectAction, selected }: { hashtags?: string[]; onSelectAction: (hashtags: string[]) => void; selected?: string[] }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
    <Label className="text-base font-semibold mb-2">Hashtags</Label>
    <AssetSelector assets={[hashtags ?? []]} type="hashtags" onSelectAction={onSelectAction} selected={selected} />
  </motion.div>
);

const ImageSection = ({ images, onSelectAction, selected }: { images?: string[]; onSelectAction: (image: string) => void; selected?: string }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
    <Label className="text-base font-semibold mb-2">Generated Images</Label>
    <AssetSelector assets={images ?? []} type="image" onSelectAction={onSelectAction} selected={selected} />
  </motion.div>
);

const VideoSection = ({ video, onSelectAction, selected }: { video?: string[]; onSelectAction: (video: string) => void; selected?: string }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
    <Label className="text-base font-semibold mb-2">Videos</Label>
    <AssetSelector assets={video ?? []} type="video" onSelectAction={onSelectAction} selected={selected} />
  </motion.div>
);

const InspirationSection = ({ query }: { query: string }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchInspiration = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/inspiration?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setPosts(data.posts ?? []);
      setSummary(data.summary ?? "");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Label className="mb-2 block text-base font-semibold">Popular Posts in Your Niche</Label>
      {summary && <p className="text-sm italic text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg shadow-sm">{summary}</p>}
      <div className="space-y-4">
        {(loading ? Array(3).fill(0) : posts).map((p, i) =>
          loading ? (
            <Skeleton key={i} className="h-52 w-full rounded-lg" />
          ) : (
            <motion.div key={`${p.user}-${i}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.1 }}>
              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-0">
                  <img src={p.imageUrl || "/placeholder.svg"} alt={`${p.user}-thumb`} className="w-full h-52 object-cover rounded-t-lg" />
                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-700">{p.user}</p>
                    <p className="text-sm mt-1">{p.text}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{p.stats.likes} likes</span>
                      <span>{p.stats.comments} comments</span>
                      <span>{p.stats.time}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ),
        )}
      </div>
      <Button variant="outline" disabled={loading || !query.trim()} onClick={fetchInspiration} className="w-full mt-4 border-gray-300 shadow-sm hover:bg-gray-50 transition-colors bg-transparent">
        <Lightbulb className="mr-2 h-4 w-4" />
        {loading ? "Fetching…" : posts.length ? "Fetch Again" : "Get More Inspiration"}
      </Button>
    </motion.div>
  );
};

export default function GenerateContent() {
  const router = useRouter();
  const [result, setResult] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { selectedAssets, setSelectedAssets, prompt, setPrompt, tone, setTone, types, setTypes } = useContentStore();

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, types, tone }),
      });

      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

      const data = await res.json();
      const assets = data.assets ?? {};
      const refinedCaption = makeClassyCaption(prompt, assets.caption as string | undefined);
      setResult({ ...assets, contentItem: data.contentItem });
      setSelectedAssets({
        contentItemId: data.contentItem?.id,
        caption: refinedCaption,
        hashtags: assets.hashtags,
        images: Array.isArray(assets.images) ? assets.images[0] : assets.images,
        video: Array.isArray(assets.video) ? assets.video[0] : assets.video,
      });
    } catch (err: any) {
      setError(`Generation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => router.push("/preview");

  const hasSelectedAssets = Object.values(selectedAssets).some((value) => value !== undefined && (Array.isArray(value) ? value.length > 0 : !!value));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Generate Content</h1>

      <Label htmlFor="prompt" className="text-base font-semibold">Content Prompt</Label>
      <Textarea id="prompt" className="min-h-[120px] mt-1 border-gray-200 shadow-sm rounded-lg" placeholder="I'm a fashion photographer named Sarah..." value={prompt} onChange={(e) => setPrompt(e.target.value)} />

      <Label className="mt-4 block text-base font-semibold">Tone</Label>
      <Select value={tone} onValueChange={setTone}>
        <SelectTrigger className="w-[180px] border-gray-200 shadow-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="friendly">Friendly</SelectItem>
          <SelectItem value="professional">Professional</SelectItem>
          <SelectItem value="casual">Casual</SelectItem>
          <SelectItem value="persuasive">Persuasive</SelectItem>
        </SelectContent>
      </Select>

      <fieldset className="my-4">
        <legend className="mb-2 text-sm font-semibold">Assets to generate ✅</legend>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { label: "Caption", value: "caption" },
            { label: "Hashtags", value: "hashtags" },
            { label: "Image", value: "image" },
            { label: "Video", value: "video" },
            { label: "Inspiration", value: "inspiration" },
            { label: "Templates", value: "templates" },
          ].map(({ label, value }) => (
            <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={types.includes(value)} onChange={(e) => setTypes(e.target.checked ? [...types, value] : types.filter((x) => x !== value))} />
              <span className="capitalize">{label}</span>
              {value === "templates" && (
                <Badge className="ml-1 bg-purple-100 text-purple-700">
                  <User className="w-3 h-3 mr-1" />
                  Portfolio Generator
                </Badge>
              )}
            </label>
          ))}
        </div>
      </fieldset>

      <Button className="w-full bg-gray-800 text-white hover:bg-gray-700 transition-colors shadow-sm" onClick={handleGenerate} disabled={loading || !prompt.trim()}>
        {loading ? (<><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Generating…</>) : (<><Sparkles className="mr-2 h-4 w-4" /> Generate</>)}
      </Button>

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

      <AnimatePresence>
        {(Object.keys(result).length > 0 || types.includes("inspiration") || types.includes("templates")) && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-6">
            <Tabs defaultValue={types[0]} className="w-full">
              <TabsList className="grid gap-1 bg-gray-100 rounded-lg" style={{ gridTemplateColumns: `repeat(${types.length},1fr)` }}>
                {types.map((t) => (
                  <TabsTrigger key={t} value={t} className="capitalize text-sm">{t.replace(/([A-Z])/g, " $1").toLowerCase()}</TabsTrigger>
                ))}
              </TabsList>

              {types.map((type) => (
                <TabsContent key={type} value={type}>
                  {type === "caption" && <CaptionSection caption={result.caption} onSelectAction={(caption) => setSelectedAssets({ ...selectedAssets, caption })} selected={selectedAssets.caption} />}
                  {type === "hashtags" && <HashtagSection hashtags={result.hashtags} onSelectAction={(hashtags) => setSelectedAssets({ ...selectedAssets, hashtags })} selected={selectedAssets.hashtags} />}
                  {type === "image" && <ImageSection images={result.images} onSelectAction={(image) => setSelectedAssets({ ...selectedAssets, images: image })} selected={selectedAssets.images} />}
                  {type === "video" && <VideoSection video={result.video} onSelectAction={(video) => setSelectedAssets({ ...selectedAssets, video })} selected={selectedAssets.video} />}
                  {type === "inspiration" && <InspirationSection query={prompt} />}
                  {type === "templates" && <TemplateSectionEnhanced templates={result.templates} prompt={prompt} />}
                </TabsContent>
              ))}
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>

      {hasSelectedAssets && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-6">
          <Button className="w-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm" onClick={handlePreview}>
            Preview Selected Content
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
