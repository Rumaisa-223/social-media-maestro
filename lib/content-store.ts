import { create } from "zustand";

export interface SelectedAssets {
  contentItemId?: string;
  caption?: string;
  hashtags?: string[];
  images?: string;
  carousel?: string[];
  story?: string[];
  video?: string;
  [key: string]: string | string[] | undefined; // Index signature for type safety
}

interface ContentState {
  selectedAssets: SelectedAssets;
  setSelectedAssets: (assets: SelectedAssets) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  tone: string;
  setTone: (tone: string) => void;
  types: string[];
  setTypes: (types: string[]) => void;
}

export const useContentStore = create<ContentState>((set) => ({
  selectedAssets: {
    contentItemId: undefined,
    caption: undefined,
    hashtags: undefined,
    images: undefined,
    carousel: undefined,
    story: undefined,
    video: undefined,
  },
  setSelectedAssets: (assets) => set({ selectedAssets: assets }),
  prompt: "",
  setPrompt: (prompt) => set({ prompt }),
  tone: "friendly",
  setTone: (tone) => set({ tone }),
  types: ["caption", "hashtags", "templates"],
  setTypes: (types) => set({ types }),
}));