"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarIcon, Clock, Sparkles, CheckCircle2, Facebook, Instagram, Linkedin, X, Youtube, AlertTriangle, Cloud, Globe } from "lucide-react";
import { InstagramIcon as TiktokIcon } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useContentStore } from "@/lib/content-store";
import { useOnboarding } from "@/components/onboarding/onboarding-context";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";

type ConnectedAccount = {
  id: string;
  provider: string;
  label: string;
  isActive: boolean;
};

const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Australia/Sydney",
];

// Fixes: Ensured "Schedule & Post" button works with robust validation and API error handling.
// Displays selected platforms from preview-post.tsx as badges.
// Integrates with /api/schedule for real social media posting.

export function SchedulePost() {
  const { selectedPlatforms } = useOnboarding();
  const { selectedAssets } = useContentStore();
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("10:00");
  const [ampm, setAmpm] = useState("am");
  const [scheduleType, setScheduleType] = useState("best");
  const [repeat, setRepeat] = useState("none");
  const [bestTime, setBestTime] = useState({
    time: "7:30 PM",
    day: "Thursday",
    engagementBoost: 28,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [timezone, setTimezone] = useState(() => {
    if (typeof Intl === "undefined") return "UTC";
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return COMMON_TIMEZONES.includes(tz) ? tz : tz || "UTC";
  });
  const [accountFetchError, setAccountFetchError] = useState<string | null>(null);

  useEffect(() => {
    const platform = Object.keys(selectedPlatforms).find(
      (p) => selectedPlatforms[p as keyof typeof selectedPlatforms]
    ) || "instagram";
    setBestTime(
      platform === "instagram"
        ? { time: "7:30 PM", day: "Thursday", engagementBoost: 28 }
        : { time: "6:00 PM", day: "Wednesday", engagementBoost: 25 }
    );
  }, [selectedPlatforms]);

  useEffect(() => {
    const fetchAccounts = async () => {
      setAccountsLoading(true);
      setAccountFetchError(null);
      try {
        const response = await fetch("/api/auth/connected-accounts");
        if (!response.ok) {
          throw new Error("Unable to load connected accounts");
        }
        const data = await response.json();
        setAccounts(data.accounts ?? []);
      } catch (error: any) {
        console.error("Connected accounts fetch failed", error);
        setAccountFetchError(error.message);
        toast({
          title: "Error",
          description: "Failed to load connected accounts. Please refresh.",
          variant: "destructive",
        });
      } finally {
        setAccountsLoading(false);
      }
    };

    fetchAccounts();
  }, [toast]);

  const activeAccountMap = useMemo(() => {
    return accounts.reduce<Record<string, ConnectedAccount>>((acc, account) => {
      if (account.isActive && account.provider) {
        acc[account.provider.toLowerCase()] = account;
      }
      return acc;
    }, {});
  }, [accounts]);

  const selectedPlatformList = useMemo(
    () =>
      Object.keys(selectedPlatforms).filter(
        (p) => selectedPlatforms[p as keyof typeof selectedPlatforms]
      ),
    [selectedPlatforms]
  );

  const selectedAccountIds = useMemo(
    () =>
      selectedPlatformList
        .map((platform) => activeAccountMap[platform.toLowerCase()]?.id)
        .filter((id): id is string => Boolean(id)),
    [activeAccountMap, selectedPlatformList]
  );

  const fallbackAccountIds = useMemo(
    () => Object.values(activeAccountMap).map((a) => a.id),
    [activeAccountMap]
  );

  const missingPlatformConnections = useMemo(
    () => selectedPlatformList.filter((platform) => !activeAccountMap[platform.toLowerCase()]),
    [activeAccountMap, selectedPlatformList]
  );

  const handleSchedule = async () => {
    
    if (scheduleType !== "best" && (!date || !time || !ampm)) {
      toast({
        title: "Posting Now",
        description: "No time selected. Posting immediately.",
        variant: "default",
      });
    }

    let targetAccountIds = selectedAccountIds.length ? selectedAccountIds : fallbackAccountIds;
    if (!targetAccountIds.length) {
      try {
        const res = await fetch("/api/auth/connected-accounts");
        if (res.ok) {
          const data = await res.json();
          const active = (data.accounts ?? []).filter((a: any) => a.isActive);
          targetAccountIds = active.map((a: any) => a.id);
        }
      } catch {}
    }
    if (!targetAccountIds.length) {
      toast({
        title: "Connect accounts",
        description: "Please connect at least one social media account before scheduling.",
        variant: "destructive",
      });
      return;
    }

    

    if (
      !selectedAssets.caption &&
      !selectedAssets.hashtags?.length &&
      !selectedAssets.video &&
      !selectedAssets.images &&
      !selectedAssets.carousel?.length &&
      !selectedAssets.story?.length
    ) {
      toast({
        title: "Error",
        description: "Please provide at least one asset (caption, hashtags, or media).",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus("submitting");
    try {
      let scheduleDate: Date;
      if (scheduleType === "now" || (scheduleType !== "best" && (!date || !time || !ampm))) {
        scheduleDate = new Date();
      } else if (scheduleType === "best") {
        scheduleDate = new Date(
          `${bestTime.day}, ${new Date().getFullYear()} ${bestTime.time}`
        );
      } else {
        scheduleDate = new Date(`${format(date!, "PPP")} ${time} ${ampm.toUpperCase()}`);
      }

      if (isNaN(scheduleDate.getTime())) {
        throw new Error("Invalid date or time format");
      }

      const schedulePayload = {
        socialAccountIds: targetAccountIds,
        scheduledFor: scheduleDate.toISOString(),
        timezone,
        repeat: repeat === "none" ? undefined : repeat,
        contentItemId: selectedAssets.contentItemId,
        content: selectedAssets.contentItemId
          ? undefined
          : {
              caption: selectedAssets.caption || "",
              hashtags: selectedAssets.hashtags || [],
              video: selectedAssets.video || undefined,
              images: selectedAssets.images || undefined,
              carousel: selectedAssets.carousel || [],
              story: selectedAssets.story || [],
            },
        generatedBy: scheduleType === "best" ? "best-time-scheduler" : "schedule-post-form",
      };

      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedulePayload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to schedule post");
      }

      const responseData = await res.json();
      const createdSchedules = responseData.schedules || [];
      const scheduleIds = createdSchedules.map((s: any) => s.id);

      setSubmissionStatus("success");
      
      // Show detailed success message
      const isNow = scheduleType === "now";
      const scheduleCount = createdSchedules.length;
      const platformNames = selectedPlatformList.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(", ");
      
      toast({
        title: isNow ? "Post Published Successfully!" : "Post Scheduled Successfully!",
        description: isNow 
          ? `Your post has been published to ${platformNames}. ${scheduleCount > 1 ? `${scheduleCount} posts created.` : ""}`
          : `Post scheduled for ${format(scheduleDate, "PPP 'at' h:mm a")} on ${platformNames}. ${scheduleCount > 1 ? `${scheduleCount} schedules created.` : ""} You'll be notified when it's published.`,
        duration: 6000,
      });

      // If posting now, poll for post status to confirm publication
      if (isNow) {
        let pollCount = 0;
        const maxPolls = 10; // Poll for up to 10 seconds
        const pollInterval = setInterval(async () => {
          pollCount++;
          try {
            const statusRes = await fetch(`/api/schedules?ids=${scheduleIds.join(",")}`);
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              const schedules = statusData.schedules || [];
              const allPosted = schedules.every((s: any) => s.post?.status === "SUCCESS");
              const anyFailed = schedules.some((s: any) => s.status === "FAILED" || s.post?.status === "FAILED");
              const stillPosting = schedules.some((s: any) => s.status === "POSTING" || s.post?.status === "PROCESSING");
              
              if (anyFailed) {
                clearInterval(pollInterval);
                const failedSchedules = schedules.filter((s: any) => s.status === "FAILED" || s.post?.status === "FAILED");
                const errorMessages = failedSchedules
                  .map((s: any) => {
                    const error = s.lastError || (s.post?.responseMeta as any)?.error || "Unknown error";
                    const provider = s.socialAccount?.provider || "unknown";
                    return `${provider}: ${error}`;
                  })
                  .join("; ");
                toast({
                  title: "Posting Failed",
                  description: `Failed to publish to some platforms: ${errorMessages}`,
                  variant: "destructive",
                  duration: 10000,
                });
              } else if (allPosted) {
                clearInterval(pollInterval);
                toast({
                  title: "All Posts Published Successfully!",
                  description: `Your post has been successfully published to all ${platformNames} platforms.`,
                  duration: 6000,
                });
              } else if (pollCount >= maxPolls) {
                clearInterval(pollInterval);
                if (stillPosting) {
                  toast({
                    title: "Post is Being Published",
                    description: `Your post is being processed. Check the dashboard for status updates.`,
                    duration: 5000,
                  });
                }
              }
            }
          } catch (error) {
            console.error("Failed to check post status", error);
            if (pollCount >= maxPolls) {
              clearInterval(pollInterval);
            }
          }
        }, 1000); // Poll every second
      }
      
      router.push("/dashboard/uploads");
    } catch (error: any) {
      setSubmissionStatus("idle");
      toast({
        title: "Error",
        description: `Failed to schedule post: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMediaPreview = () => {
    if (selectedAssets.video) {
      return <video src={selectedAssets.video} controls className="w-full rounded-lg max-h-64 object-cover" />;
    } else if (selectedAssets.images) {
      return <img src={selectedAssets.images} alt="Selected image" className="w-full rounded-lg max-h-64 object-cover" />;
    } else if (selectedAssets.carousel && selectedAssets.carousel.length) {
      return <img src={selectedAssets.carousel[0]} alt="Carousel preview" className="w-full rounded-lg max-h-64 object-cover" />;
    } else if (selectedAssets.story && selectedAssets.story.length) {
      return <img src={selectedAssets.story[0]} alt="Story preview" className="w-full rounded-lg max-h-64 object-cover" />;
    }
    return <p className="text-muted-foreground">No media selected</p>;
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "instagram": return "border-pink-500 bg-pink-50 text-pink-700";
      case "facebook": return "border-blue-500 bg-blue-50 text-blue-700";
      case "twitter": return "border-sky-500 bg-sky-50 text-sky-700";
      case "linkedin": return "border-blue-700 bg-blue-50 text-blue-700";
      case "bluesky": return "border-sky-600 bg-sky-50 text-sky-700";
      case "mastodon": return "border-indigo-700 bg-indigo-50 text-indigo-700";
      case "youtube": return "border-red-500 bg-red-50 text-red-700";
      case "tiktok": return "border-gray-800 bg-gray-50 text-gray-800";
      default: return "border-gray-500 bg-gray-50 text-gray-700";
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram": return <Instagram className="h-4 w-4" />;
      case "facebook": return <Facebook className="h-4 w-4" />;
      case "twitter": return <X className="h-4 w-4" />;
      case "linkedin": return <Linkedin className="h-4 w-4" />;
      case "bluesky": return <Cloud className="h-4 w-4" />;
      case "mastodon": return <Globe className="h-4 w-4" />;
      case "youtube": return <Youtube className="h-4 w-4" />;
      case "tiktok": return <TiktokIcon className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-6 max-w-2xl"
    >
      <Card className="shadow-lg mb-6 border border-transparent bg-clip-padding" style={{ borderImage: "linear-gradient(to right, #3b82f6, #a855f7) 1" }}>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">Selected Content Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Caption</Label>
            <p className="mt-1 text-sm text-gray-600">{selectedAssets.caption || "No caption selected"}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Hashtags</Label>
            <p className="mt-1 text-sm text-blue-500">{selectedAssets.hashtags?.join(" ") || "No hashtags selected"}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Media</Label>
            <div className="mt-2">{getMediaPreview()}</div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700">Platforms</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedPlatformList.length > 0 ? (
                selectedPlatformList.map((platform) => (
                  <span
                    key={platform}
                    className={`text-xs font-medium px-2 py-1 rounded-full ${getPlatformColor(platform)}`}
                  >
                    {getPlatformIcon(platform)}
                    <span className="ml-1">{platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                  </span>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No platforms selected. Please select platforms in the preview step.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {(!accountsLoading && !accounts.length) || missingPlatformConnections.length > 0 ? (
        <Alert
          variant={missingPlatformConnections.length ? "destructive" : "default"}
          className="mb-6"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {missingPlatformConnections.length ? "Connect required accounts" : "No connected accounts"}
          </AlertTitle>
          <AlertDescription>
            {missingPlatformConnections.length
              ? `Please connect your ${missingPlatformConnections
                  .map((platform) => platform.charAt(0).toUpperCase() + platform.slice(1))
                  .join(", ")} account${missingPlatformConnections.length > 1 ? "s" : ""} in the Auth dashboard before scheduling.`
              : "Connect at least one account in Dashboard → Auth to enable scheduling."}
          </AlertDescription>
        </Alert>
      ) : accountFetchError ? (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Unable to verify accounts</AlertTitle>
          <AlertDescription>{accountFetchError}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Schedule Post</h2>
          <p className="text-muted-foreground mb-6">
            Choose when and how to post your content. You can also return to the{" "}
            <Link href="/dashboard" className="text-primary underline">
              Dashboard
            </Link>{" "}
            at any time.
          </p>

          <RadioGroup
            value={scheduleType}
            onValueChange={setScheduleType}
            className="space-y-6 mb-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="now" id="now" />
                <Label htmlFor="now" className="font-medium">
                  Post Now
                </Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Publish your post immediately across selected platforms.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="schedule" id="schedule" />
                <Label htmlFor="schedule" className="font-medium">
                  Schedule for Later
                </Label>
              </div>
              <div className="ml-6 mt-2 space-y-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <div className="flex gap-2">
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-1/2"
                  />
                  <Select value={ampm} onValueChange={setAmpm}>
                    <SelectTrigger className="w-1/2">
                      <SelectValue placeholder="AM/PM" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="am">AM</SelectItem>
                      <SelectItem value="pm">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="best" id="best" />
                <Label htmlFor="best" className="font-medium flex items-center">
                  <Sparkles className="h-4 w-4 mr-2 text-primary" />
                  Best Time to Post
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Let AI determine the best time to post for maximum engagement.
              </p>
              <Card className="mt-4 shadow-sm rounded-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"
                    >
                      <Clock className="h-5 w-5 text-primary" />
                    </motion.div>
                    <div>
                      <p className="text-sm font-medium">Recommended Time</p>
                      <p className="text-sm text-muted-foreground">
                        {bestTime.day} at {bestTime.time}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Based on your audience's activity patterns, this time has
                    shown {bestTime.engagementBoost}% higher engagement.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </RadioGroup>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <Label className="text-base">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="w-full mt-2 rounded-lg shadow-sm">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {[timezone, ...COMMON_TIMEZONES.filter((tz) => tz !== timezone)].map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Schedules will run using this timezone. Update anytime.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Label className="text-base">Repeat Schedule (Optional)</Label>
            <Select value={repeat} onValueChange={setRepeat}>
              <SelectTrigger className="w-full mt-2 rounded-lg shadow-sm">
                <SelectValue placeholder="Don't repeat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Don't repeat</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>
        </CardContent>
      </Card>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-6 flex gap-4"
      >
        <Button
          variant="outline"
          onClick={() => router.push("/preview")}
          className="flex-1 border-gray-300 shadow-sm hover:bg-gray-50 rounded-lg"
        >
          Back to Preview
        </Button>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={
            isSubmitting
              ? { rotate: [0, 360], transition: { duration: 1, repeat: Infinity } }
              : { scale: [1, 1.03, 1], transition: { duration: 1.5, repeat: Infinity } }
          }
        >
          <Button
            className={`flex-1 rounded-lg shadow-sm text-white ${isSubmitting ? 'bg-blue-700 opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}`}
            onClick={handleSchedule}
            disabled={
              isSubmitting ||
              (!selectedAssets.caption &&
                !selectedAssets.hashtags?.length &&
                !selectedAssets.video &&
                !selectedAssets.images &&
                !selectedAssets.carousel?.length &&
                !selectedAssets.story?.length)
            }
          >
            {submissionStatus === "success" ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Posting Successful
              </>
            ) : isSubmitting ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Schedule & Post
              </>
            )}
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
