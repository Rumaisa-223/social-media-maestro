"use client";

import { createContext, useContext, useState } from "react";

// 1️⃣  extended interfaces
export interface BrandVoice {
  tone: string;
  style: string;
  keywords: string[];
  includeHashtags: boolean;
}

export interface BrandAssets {
  logo: string | null;
  fontFamily: string;
  fontSize: string;
  primaryColor: string;
  secondaryColor: string;
  logoVariants: string[];
}

export interface SelectedPlatforms {
  facebook: boolean;
  twitter: boolean;
  instagram: boolean;
  linkedin: boolean;
  bluesky: boolean;
  mastodon: boolean;
}

interface OnboardingContextType {
  step: number;
  setStep: (step: number) => void;
  selectedPlatforms: SelectedPlatforms;
  setSelectedPlatforms: (platforms: SelectedPlatforms) => void;
  accountDetails: Record<string, { accessToken: string; username: string }>;
  updateAccountDetail: (platform: string, key: string, value: string) => void;
  features: {
    contentGeneration: boolean;
    analytics: boolean;
    scheduling: boolean;
    engagementMonitoring: boolean;
  };
  setFeatures: (features: {
    contentGeneration: boolean;
    analytics: boolean;
    scheduling: boolean;
    engagementMonitoring: boolean;
  }) => void;
  brandVoice: BrandVoice;
  updateBrandVoice: (key: string, value: any) => void;
  brandAssets: BrandAssets;
  updateBrandAsset: (key: string, value: any) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState(1);

  // 2️⃣  default now includes linkedin
  const [selectedPlatforms, setSelectedPlatforms] = useState<SelectedPlatforms>({
    facebook: false,
    twitter: false,
    instagram: false,
    linkedin: false,
    bluesky: false,
    mastodon: false,
  });

  const [accountDetails, setAccountDetails] = useState<
    Record<string, { accessToken: string; username: string }>
  >({});

  const [features, setFeatures] = useState({
    contentGeneration: false,
    analytics: false,
    scheduling: false,
    engagementMonitoring: false,
  });

  const [brandVoice, setBrandVoice] = useState<BrandVoice>({
    tone: "",
    style: "",
    keywords: [],
    includeHashtags: true,
  });

  const [brandAssets, setBrandAssets] = useState<BrandAssets>({
    logo: null,
    fontFamily: "Inter",
    fontSize: "medium",
    primaryColor: "#3B82F6",
    secondaryColor: "#10B981",
    logoVariants: ["full"],
  });

  const updateAccountDetail = (
    platform: string,
    key: string,
    value: string
  ) => {
    setAccountDetails((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], [key]: value },
    }));
  };

  const updateBrandVoice = (key: string, value: any) => {
    setBrandVoice((prev) => ({ ...prev, [key]: value }));
  };

  const updateBrandAsset = (key: string, value: any) => {
    setBrandAssets((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <OnboardingContext.Provider
      value={{
        step,
        setStep,
        selectedPlatforms,
        setSelectedPlatforms,
        accountDetails,
        updateAccountDetail,
        features,
        setFeatures,
        brandVoice,
        updateBrandVoice,
        brandAssets,
        updateBrandAsset,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context)
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  return context;
}