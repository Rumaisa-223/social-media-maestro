"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Facebook,
  Instagram,
  X,
  RefreshCw,
  AlertTriangle,
  Save,
  Globe,
  Radio,
} from "lucide-react";
import { useContentStore } from "@/lib/content-store";
import { useOnboarding } from "@/components/onboarding/onboarding-context";
import { toast } from "@/components/ui/use-toast";

// Allows platform selection and content editing, syncing with onboarding-context and content-store.
// Ensures selected platforms are passed to schedule-post.tsx for display and posting.

export default function PreviewPost() {
  const { selectedPlatforms, setSelectedPlatforms, setStep } = useOnboarding();
  const { selectedAssets, setSelectedAssets } = useContentStore();
  const [warnings] = useState([
    {
      platform: "instagram",
      issue: "Image ratio (16:9) not optimal for Instagram (use 4:5).",
    },
  ]);
  const [predictions] = useState({
    instagram: { likes: 1400, shares: 92 },
    facebook: { likes: 1000, shares: 50 },
    twitter: { likes: 800, retweets: 120, replies: 50 },
    mastodon: { boosts: 80, favorites: 200 },
    bluesky: { likes: 300, reposts: 40 },
  });
  const [tempCaption, setTempCaption] = useState(selectedAssets.caption || "");
  const [tempHashtags, setTempHashtags] = useState(selectedAssets.hashtags?.join(" ") || "");
  const [mediaUrl, setMediaUrl] = useState<string | null>(
    selectedAssets.video || selectedAssets.images || selectedAssets.carousel?.[0] || selectedAssets.story?.[0] || null
  );
  const [mediaType, setMediaType] = useState<"video" | "image" | "carousel" | "story" | null>(
    selectedAssets.video ? "video" : selectedAssets.images ? "image" : selectedAssets.carousel?.length ? "carousel" : selectedAssets.story?.length ? "story" : null
  );

  const handlePlatformChange = (platform: keyof typeof selectedPlatforms) => {
    setSelectedPlatforms({
      ...selectedPlatforms,
      [platform]: !selectedPlatforms[platform],
    });
  };

  const handleSave = () => {
    const hashtagArray = tempHashtags
      .trim()
      .split(/\s+/)
      .map((tag) => tag.replace(/^#/, ""));
    const selectedCount = Object.values(selectedPlatforms).filter(Boolean).length;

    if (selectedCount === 0) {
      toast({
        title: "Error",
        description: "Please select at least one platform.",
        variant: "destructive",
      });
      return;
    }

    if (!tempCaption && !hashtagArray.length && !mediaUrl) {
      toast({
        title: "Error",
        description: "Please provide a caption, hashtags, or media.",
        variant: "destructive",
      });
      return;
    }

    setSelectedAssets({
      caption: tempCaption.trim() || "",
      hashtags: hashtagArray.length > 0 ? hashtagArray : [],
      video: mediaType === "video" ? mediaUrl ?? undefined : undefined,
      images: mediaType === "image" ? mediaUrl ?? undefined : undefined,
      carousel: mediaType === "carousel" ? (mediaUrl ? [mediaUrl] : []) : [],
      story: mediaType === "story" ? (mediaUrl ? [mediaUrl] : []) : [],
    });

    toast({ title: "Success", description: "Content saved! Proceeding to scheduling." });
    setStep(5);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram": return <Instagram className="h-5 w-5" />;
      case "facebook": return <Facebook className="h-5 w-5" />;
      case "twitter": return <X className="h-5 w-5" />;
      case "mastodon": return <Radio className="h-5 w-5" />;
      case "bluesky": return <Globe className="h-5 w-5" />;
      default: return null;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl rounded-xl shadow-lg border-2 border-purple-300">
      <h2 className="text-3xl font-bold mb-4 text-gray-800">Create and Preview Post</h2>
      <p className="text-muted-foreground mb-6 text-gray-600">
        Select platforms, edit content, and preview how your post will look.
      </p>

      <Card className="mb-6 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">Select Platforms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {["facebook", "twitter", "instagram", "mastodon", "bluesky"].map((platform) => (
              <motion.div
                key={platform}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  id={platform}
                  checked={selectedPlatforms[platform as keyof typeof selectedPlatforms]}
                  onCheckedChange={() => handlePlatformChange(platform as keyof typeof selectedPlatforms)}
                />
                <Label htmlFor={platform} className="flex items-center text-sm font-medium text-gray-700">
                  {getPlatformIcon(platform)}
                  <span className="ml-2">{platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                </Label>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {warnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Card className="bg-yellow-50 border-yellow-200 shadow-sm relative z-10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  {warnings.map((w, i) => (
                    <span key={i}>
                      {w.platform.charAt(0).toUpperCase() + w.platform.slice(1)}: {w.issue}
                      {i < warnings.length - 1 && <br />}
                    </span>
                  ))}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Card className="mb-6 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">Edit Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Caption</Label>
            <Textarea
              value={tempCaption}
              onChange={(e) => setTempCaption(e.target.value)}
              placeholder="Write your caption..."
              className="mt-2 w-full rounded-lg"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Hashtags</Label>
            <Input
              value={tempHashtags}
              onChange={(e) => setTempHashtags(e.target.value)}
              placeholder="#hashtag1 #hashtag2"
              className="mt-2 w-full rounded-lg"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Media</Label>
            <Input
              type="text"
              value={mediaUrl || ""}
              onChange={(e) => setMediaUrl(e.target.value || null)}
              placeholder="Enter media URL (image or video)"
              className="mt-2 w-full rounded-lg"
            />
            <Tabs defaultValue={mediaType || "image"} className="mt-2">
              <TabsList>
                <TabsTrigger value="image">Image</TabsTrigger>
                <TabsTrigger value="video">Video</TabsTrigger>
                <TabsTrigger value="carousel">Carousel</TabsTrigger>
                <TabsTrigger value="story">Story</TabsTrigger>
              </TabsList>
              <TabsContent value={mediaType || "image"} />
            </Tabs>
            {mediaUrl && (
              <div className="mt-4">
                {mediaType === "video" ? (
                  <video src={mediaUrl} controls className="w-full rounded-lg max-h-64 object-cover" />
                ) : (
                  <img src={mediaUrl} alt="Preview" className="w-full rounded-lg max-h-64 object-cover" />
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="instagram" className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-5 mb-6 bg-gray-200 rounded-lg p-1">
          {(["instagram", "facebook", "twitter", "mastodon", "bluesky"] as const).map((platform) => (
            <TabsTrigger
              key={platform}
              value={platform}
              className="flex items-center gap-2 text-sm font-medium"
              disabled={!selectedPlatforms[platform as keyof typeof selectedPlatforms]}
            >
              {getPlatformIcon(platform)}
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
        {(["instagram", "facebook", "twitter", "mastodon", "bluesky"] as const).map((platform) => (
          <TabsContent key={platform} value={platform}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-md">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <p className="text-gray-800 font-medium">{tempCaption || "No caption"}</p>
                    <p className="text-blue-500 text-sm">{tempHashtags || "No hashtags"}</p>
                    {mediaUrl ? (
                      mediaType === "video" ? (
                        <video src={mediaUrl} controls className="w-full object-cover rounded-lg max-h-96" />
                      ) : (
                        <img src={mediaUrl} alt="Post preview" className="w-full object-cover rounded-lg max-h-96" />
                      )
                    ) : (
                      <img
                        src="/placeholder.svg?height=300&width=500"
                        alt="Post preview"
                        className="w-full object-cover rounded-lg max-h-96"
                      />
                    )}
                    <div className="flex justify-between text-sm text-gray-500 mt-4">
                      {platform === "twitter" && (
                        <>
                          <span>{predictions.twitter.likes} Likes</span>
                          <span>{predictions.twitter.retweets} Retweets</span>
                          <span>{predictions.twitter.replies} Replies</span>
                        </>
                      )}
                      {platform === "instagram" && (
                        <>
                          <span>{predictions.instagram.likes} Likes</span>
                          <span>{predictions.instagram.shares} Shares</span>
                        </>
                      )}
                      {platform === "facebook" && (
                        <>
                          <span>{predictions.facebook.likes} Likes</span>
                          <span>{predictions.facebook.shares} Shares</span>
                        </>
                      )}
                      {platform === "mastodon" && (
                        <>
                          <span>{predictions.mastodon.boosts} Boosts</span>
                          <span>{predictions.mastodon.favorites} Favorites</span>
                        </>
                      )}
                      {platform === "bluesky" && (
                        <>
                          <span>{predictions.bluesky.likes} Likes</span>
                          <span>{predictions.bluesky.reposts} Reposts</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-center gap-4"
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            onClick={() => setStep(3)}
            className="border-gray-300 shadow-sm hover:bg-gray-50 rounded-lg px-6 py-2"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Back to Generate
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            className="bg-green-600 text-white hover:bg-green-700 rounded-lg px-6 py-2"
            onClick={handleSave}
          >
            <Save className="mr-2 h-4 w-4" />
            Save and Schedule
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}