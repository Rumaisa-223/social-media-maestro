// components/create-post/AssetSelector.tsx
"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

interface AssetSelectorProps {
  assets: any[];
  type: string;
  onSelectAction: (selected: any) => void;
  selected?: any;
}

export function AssetSelector({ assets, type, onSelectAction, selected }: AssetSelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {assets.map((asset, index) => (
        <Card
          key={index}
          className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
            selected === asset ? "border-2 border-blue-500" : "border-gray-200"
          }`}
          onClick={() => onSelectAction(asset)}
        >
          <CardContent className="p-4">
            {type === "image" || type === "carousel" || type === "story" ? (
              <img
                src={asset}
                alt={`${type}-${index}`}
                className="w-full h-40 object-cover rounded-lg mb-2"
              />
            ) : type === "video" ? (
              <video src={asset} controls className="w-full h-40 rounded-lg mb-2" />
            ) : type === "hashtags" ? (
              <div className="flex flex-wrap gap-2">
                {asset.map((h: string) => (
                  <span key={h} className="text-sm bg-gray-100 p-1 rounded">
                    {h}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm">{asset}</p>
            )}
            {selected === asset && (
              <CheckCircle2 className="absolute top-2 right-2 h-6 w-6 text-blue-500" />
            )}
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}