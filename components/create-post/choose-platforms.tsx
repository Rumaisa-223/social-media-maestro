"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Facebook, Instagram, PlusCircle, Twitter, Globe, Radio } from "lucide-react";
import { useOnboarding } from "@/components/onboarding/onboarding-context";

interface PlatformRecommendation {
  platform: string;
  reason: string;
  engagementScore: number;
  competitorActivity: string;
}

export function ChoosePlatforms() {
  const { selectedPlatforms, setSelectedPlatforms } = useOnboarding();
  const [recommendations, setRecommendations] = useState<PlatformRecommendation[]>([]);

  useEffect(() => {
    // Mock AI-driven platform recommendations
    const fetchRecommendations = async () => {
      const mockRecommendations: PlatformRecommendation[] = [
        { platform: "instagram", reason: "Best for visuals (30% more clicks)", engagementScore: 0.85, competitorActivity: "70% of skincare brands active" },
        { platform: "facebook", reason: "High ROI for ads", engagementScore: 0.75, competitorActivity: "50% of competitors post daily" },
        { platform: "twitter", reason: "Real-time engagement", engagementScore: 0.65, competitorActivity: "Trending for skincare hashtags" },
        { platform: "mastodon", reason: "Decentralized community", engagementScore: 0.60, competitorActivity: "Growing tech-savvy audience" },
        { platform: "bluesky", reason: "Open social network", engagementScore: 0.70, competitorActivity: "Early adopter engagement" },
      ];
      setRecommendations(mockRecommendations);
    };
    fetchRecommendations();
  }, []);

  const togglePlatform = (platform: keyof typeof selectedPlatforms) => {
    setSelectedPlatforms({
      ...selectedPlatforms,
      [platform]: !selectedPlatforms[platform],
    });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Choose Platforms</h2>
      <p className="text-muted-foreground mb-6">
        Select the social media platforms where you want to publish your content. AI recommendations based on engagement and competitor activity.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {recommendations.map(({ platform, reason, engagementScore, competitorActivity }) => {
          const isSelected = selectedPlatforms[platform as keyof typeof selectedPlatforms];
          
          return (
            <Button
              key={platform}
              variant="outline"
              className={`h-auto flex-col py-6 relative transition-all duration-300 ${
                isSelected 
                  ? "border-sky-400 ring-2 ring-sky-300 ring-offset-2 animate-outline-glow border-2" 
                  : "border-glow-hover hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700 hover:border-2 dark:hover:bg-sky-950/20 dark:hover:border-sky-500 dark:hover:text-sky-300"
              }`}
              onClick={() => togglePlatform(platform as keyof typeof selectedPlatforms)}
            >
              <Badge className="absolute top-2 right-2">{reason}</Badge>
              {platform === "instagram" && (
                <Instagram className={`h-8 w-8 mb-2 ${isSelected ? "text-pink-500" : "text-pink-600"}`} />
              )}
              {platform === "facebook" && (
                <Facebook className={`h-8 w-8 mb-2 ${isSelected ? "text-blue-500" : "text-blue-600"}`} />
              )}
              {platform === "twitter" && (
                <Twitter className={`h-8 w-8 mb-2 ${isSelected ? "text-blue-400" : "text-blue-400"}`} />
              )}
              {platform === "mastodon" && (
                <Radio className={`h-8 w-8 mb-2 ${isSelected ? "text-purple-500" : "text-purple-600"}`} />
              )}
              {platform === "bluesky" && (
                <Globe className={`h-8 w-8 mb-2 ${isSelected ? "text-sky-500" : "text-sky-600"}`} />
              )}
              <span className={isSelected ? "text-sky-700 font-medium" : ""}>
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </span>
              <span className="text-xs text-muted-foreground mt-1">Engagement: {(engagementScore * 100).toFixed(0)}%</span>
              <span className="text-xs text-muted-foreground">{competitorActivity}</span>
            </Button>
          );
        })}
        <Button variant="outline" className="h-auto flex-col py-6 border-dashed">
          <PlusCircle className="h-8 w-8 mb-2 text-muted-foreground" />
          <span>Add More</span>
          <span className="text-xs text-muted-foreground">Try Threads for text-based updates</span>
        </Button>
      </div>
    </div>
  );
}