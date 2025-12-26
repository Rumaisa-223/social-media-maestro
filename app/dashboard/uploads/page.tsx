"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Upload, RefreshCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ContentItem {
  id: string;
  metadata: Record<string, any>;
  createdAt: string;
  previewUrl?: string | null;
}

interface ScheduleItem {
  id: string;
  status: string;
  scheduledFor: string;
  socialAccount: { provider: string; label: string };
  contentItem: ContentItem;
  lastError?: string | null;
}

interface PostItem {
  id: string;
  status: string;
  createdAt: string;
  schedule: ScheduleItem;
}

export default function Uploads() {
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [contentRes, scheduleRes, postRes] = await Promise.all([
        fetch("/api/content?limit=20"),
        fetch("/api/schedules"),
        fetch("/api/posts"),
      ]);
      const contentJson = await contentRes.json();
      const scheduleJson = await scheduleRes.json();
      const postsJson = await postRes.json();
      setContentItems(contentJson.items ?? []);
      setSchedules(scheduleJson.schedules ?? []);
      setPosts(postsJson.posts ?? []);
    } catch (error) {
      console.error("Failed to refresh dashboard feed", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const source = new EventSource("/api/realtime");
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "content.created":
            setContentItems((prev) => [data.payload, ...prev].slice(0, 20));
            break;
          case "schedule.created":
          case "schedule.updated":
          case "schedule.failed":
          case "post.created":
          case "post.updated":
            fetchData();
            break;
          default:
            break;
        }
      } catch (error) {
        console.warn("Realtime parse error", error);
      }
    };
    source.onerror = () => {
      source.close();
      setTimeout(fetchData, 2000);
    };
    return () => source.close();
  }, [fetchData]);

  const handleUploadSelection = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploadsPayload = Array.from(files).map((file) => ({
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
      }));

      const createRes = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Manual upload: ${files[0].name}`,
          tone: "neutral",
          types: [],
          uploads: uploadsPayload,
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || "Failed to create upload intent");
      }

      const createJson = await createRes.json();
      const uploadIntents: { uploadUrl: string; fileId: string }[] = createJson.uploadIntents ?? [];

      await Promise.all(
        uploadIntents.map(async (intent, index) => {
          const file = files[index];
          if (!file) return;
          await fetch(intent.uploadUrl, {
            method: "PUT",
            headers: {
              "Content-Type": file.type || "application/octet-stream",
            },
            body: file,
          });
        }),
      );

      toast({
        title: "Upload started",
        description: "Files are uploading. They will appear in the feed shortly.",
      });
      fetchData();
    } catch (error: any) {
      console.error("Upload failed", error);
      toast({
        title: "Upload failed",
        description: error.message || "Unable to upload files.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleManualRefresh = () => fetchData();

  const pendingSchedules = useMemo(
    () => schedules.filter((schedule) => ["PENDING", "QUEUED", "POSTING"].includes(schedule.status)),
    [schedules],
  );
  const failedSchedules = useMemo(
    () => schedules.filter((schedule) => ["FAILED", "PAUSED"].includes(schedule.status)),
    [schedules],
  );
  const successfulPosts = useMemo(
    () => posts.filter((post) => post.status === "SUCCESS"),
    [posts],
  );

  const statusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
      case "QUEUED":
        return <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">{status}</Badge>;
      case "POSTING":
        return <Badge className="bg-blue-600 text-white">{status}</Badge>;
      case "FAILED":
      case "PAUSED":
        return <Badge variant="destructive">{status}</Badge>;
      case "SUCCESS":
        return <Badge className="bg-green-600 text-white">Published</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Uploads Dashboard</h1>
            <p className="text-muted-foreground">Live feed of generated content, schedules, and published posts.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled={loading} onClick={handleManualRefresh}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Uploading…" : "Upload Content"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => handleUploadSelection(event.target.files)}
              accept="image/*,video/*"
            />
          </div>
        </div>
      </div>

      

      <Card>
        <CardHeader>
          <CardTitle>Recent Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {contentItems.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground">Generate content to see it appear here in real time.</p>
          )}
          {contentItems.map((item) => (
            <div key={item.id} className="flex items-start gap-4 rounded-lg border p-3">
              {item.previewUrl && (
                <img src={item.previewUrl} alt="" className="h-16 w-16 rounded object-cover" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">{item.metadata?.caption || "Generated asset"}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Tabs defaultValue="scheduled">
        <TabsList>
          <TabsTrigger value="scheduled">Scheduled ({pendingSchedules.length})</TabsTrigger>
          <TabsTrigger value="published">Published ({successfulPosts.length})</TabsTrigger>
          <TabsTrigger value="failed">Failed ({failedSchedules.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="space-y-3">
          {pendingSchedules.map((schedule) => (
            <motion.div key={schedule.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{schedule.contentItem?.metadata?.caption || "Untitled asset"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(schedule.scheduledFor).toLocaleString()} · {schedule.socialAccount?.label}
                    </p>
                  </div>
                  {statusBadge(schedule.status)}
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {!pendingSchedules.length && <p className="text-sm text-muted-foreground">No upcoming schedules.</p>}
        </TabsContent>

        <TabsContent value="published" className="space-y-3">
          {successfulPosts.map((post) => (
            <Card key={post.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{post.schedule?.contentItem?.metadata?.caption || "Published asset"}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })} · {post.schedule?.socialAccount?.label}
                  </p>
                </div>
                {statusBadge(post.status)}
              </CardContent>
            </Card>
          ))}
          {!successfulPosts.length && <p className="text-sm text-muted-foreground">No published posts yet.</p>}
        </TabsContent>

        <TabsContent value="failed" className="space-y-3">
          {failedSchedules.map((schedule) => (
            <Card key={schedule.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{schedule.contentItem?.metadata?.caption || "Failed asset"}</p>
                  <p className="text-xs text-muted-foreground">
                    {schedule.lastError || "Unknown error"} · {schedule.socialAccount?.label}
                  </p>
                </div>
                {statusBadge(schedule.status)}
              </CardContent>
            </Card>
          ))}
          {!failedSchedules.length && <p className="text-sm text-muted-foreground">Great news—no failures.</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}