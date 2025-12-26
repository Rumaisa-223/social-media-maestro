"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileImage, FileText, FileVideo, Images, MessageSquare } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PostTypeInfo {
  type: string;
  aiTip: string;
}

export function PostType() {
  const [selectedGoal, setSelectedGoal] = useState("brand-awareness");
  const [selectedPostType, setSelectedPostType] = useState<string | null>(null);

  const postTypes: PostTypeInfo[] = [
    { type: "story", aiTip: "Stories with polls boost engagement by 25%." },
    { type: "text", aiTip: "Text posts spark discussions on Twitter." },
    { type: "image", aiTip: "Images drive 20% more clicks on Instagram." },
    { type: "video", aiTip: "Videos get 2x more shares on Facebook." },
    { type: "carousel", aiTip: "Carousels increase storytelling engagement by 15%." },
  ];

  const recommendedTypes = selectedGoal === "brand-awareness" ? ["carousel", "story"] : ["image", "video"];

  const handlePostTypeSelect = (type: string) => {
    setSelectedPostType(selectedPostType === type ? null : type);
  };

  return (
    <TooltipProvider>
      <div>
        <h2 className="text-xl font-semibold mb-4">Choose Post Type</h2>
        <p className="text-muted-foreground mb-6">Select the type of content you want to create.</p>
        <div className="mb-6">
          <label className="text-sm font-medium">Goal:</label>
          <select
            value={selectedGoal}
            onChange={(e) => setSelectedGoal(e.target.value)}
            className="ml-2 border rounded-md p-1"
          >
            <option value="brand-awareness">Brand Awareness</option>
            <option value="engagement">Engagement</option>
            <option value="sales">Sales</option>
          </select>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {postTypes.map(({ type, aiTip }) => {
            const isSelected = selectedPostType === type;
            const isRecommended = recommendedTypes.includes(type);
            
            return (
              <Tooltip key={type}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className={`h-auto flex-col py-6 px-4 transition-all duration-300 ${
                      isSelected 
                        ? "border-sky-400 ring-2 ring-sky-300 ring-offset-2 animate-outline-glow border-2" 
                        : "border-glow-hover hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700 hover:border-2 dark:hover:bg-sky-950/20 dark:hover:border-sky-500 dark:hover:text-sky-300"
                    } ${isRecommended && !isSelected ? "border-primary/50" : ""}`}
                    onClick={() => handlePostTypeSelect(type)}
                  >
                    {type === "image" && (
                      <FileImage className={`h-10 w-10 mb-3 ${isSelected ? "text-sky-600" : "text-primary"}`} />
                    )}
                    {type === "video" && (
                      <FileVideo className={`h-10 w-10 mb-3 ${isSelected ? "text-sky-600" : "text-primary"}`} />
                    )}
                    {type === "text" && (
                      <FileText className={`h-10 w-10 mb-3 ${isSelected ? "text-sky-600" : "text-primary"}`} />
                    )}
                    {type === "carousel" && (
                      <Images className={`h-10 w-10 mb-3 ${isSelected ? "text-sky-600" : "text-primary"}`} />
                    )}
                    {type === "story" && (
                      <MessageSquare className={`h-10 w-10 mb-3 ${isSelected ? "text-sky-600" : "text-primary"}`} />
                    )}
                    <span className={`font-medium text-base ${isSelected ? "text-sky-700" : ""}`}>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                    {isRecommended && (
                      <span className="text-xs mt-1 text-muted-foreground">Recommended</span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{aiTip}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}