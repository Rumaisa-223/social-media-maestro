"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Shield, Settings, Bell, Lock, AlertTriangle, Check, X, Edit2, Trash2, Plus, Mail, Smartphone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
// removed profile session usage

type HashtagGroup = {
  id: number
  name: string
  hashtags: string[]
}

export default function SettingsPage() {
  const { success, error } = useToast()
  const [activeTab, setActiveTab] = useState("privacy")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [newHashtag, setNewHashtag] = useState("")
  const [hashtags, setHashtags] = useState(["marketing", "branding", "digital"])
  const [hashtagGroups, setHashtagGroups] = useState<HashtagGroup[]>([
    {
      id: 1,
      name: "Marketing",
      hashtags: ["marketing", "digital", "strategy"],
    },
    {
      id: 2,
      name: "Product",
      hashtags: ["product", "innovation", "design"],
    },
  ])

  const [autoSaveDrafts, setAutoSaveDrafts] = useState(true)
  const [addWatermark, setAddWatermark] = useState(false)
  const [imageOptimization, setImageOptimization] = useState(true)

  // Email Notifications
  const [emailPostPerformance, setEmailPostPerformance] = useState(true)
  const [emailWeeklyReports, setEmailWeeklyReports] = useState(true)
  const [emailMarketingTips, setEmailMarketingTips] = useState(false)
  
  // Push Notifications
  const [pushPostPublished, setPushPostPublished] = useState(true)
  const [pushEngagementAlerts, setPushEngagementAlerts] = useState(true)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<HashtagGroup | null>(null)
  const [groupName, setGroupName] = useState("")
  const [groupHashtags, setGroupHashtags] = useState<string[]>([])
  const [groupHashtagInput, setGroupHashtagInput] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/settings")
        if (!res.ok) return
        const json = await res.json()
        if (typeof json.auto_save_drafts === "boolean") setAutoSaveDrafts(json.auto_save_drafts)
        if (typeof json.add_watermark === "boolean") setAddWatermark(json.add_watermark)
        if (typeof json.image_optimization === "boolean") setImageOptimization(json.image_optimization)
        // Email Notifications
        if (typeof json.email_post_performance === "boolean") setEmailPostPerformance(json.email_post_performance)
        if (typeof json.email_weekly_reports === "boolean") setEmailWeeklyReports(json.email_weekly_reports)
        if (typeof json.email_marketing_tips === "boolean") setEmailMarketingTips(json.email_marketing_tips)
        // Push Notifications
        if (typeof json.push_post_published === "boolean") setPushPostPublished(json.push_post_published)
        if (typeof json.push_engagement_alerts === "boolean") setPushEngagementAlerts(json.push_engagement_alerts)
        if (Array.isArray(json.hashtags)) setHashtags(json.hashtags)
        if (Array.isArray(json.hashtag_groups)) {
          const groups = json.hashtag_groups.map((g: any, idx: number) => ({ id: idx + 1, name: g.name, hashtags: g.tags }))
          setHashtagGroups(groups)
        }
      } catch {}
    }
    load()
  }, [])

  // removed profile save functionality

  // removed profile fetch effect

  // removed photo upload handlers

  const addHashtag = () => {
    if (newHashtag.trim()) {
      const cleanHashtag = newHashtag.trim().replace(/^#/, "")
      if (!hashtags.includes(cleanHashtag)) {
        setHashtags([...hashtags, cleanHashtag])
        success(`#${cleanHashtag} has been added to your hashtags`)
      }
      setNewHashtag("")
    }
  }

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter((h) => h !== tag))
    success(`#${tag} has been removed`)
  }

  const removeHashtagGroup = (id: number) => {
    const group = hashtagGroups.find((g) => g.id === id)
    setHashtagGroups(hashtagGroups.filter((g) => g.id !== id))
    success(`${group?.name} hashtag group has been deleted`)
  }

  const openCreateGroupDialog = () => {
    setGroupName("")
    setGroupHashtags([])
    setGroupHashtagInput("")
    setIsCreateGroupOpen(true)
  }

  const openEditGroupDialog = (group: HashtagGroup) => {
    setEditingGroup(group)
    setGroupName(group.name)
    setGroupHashtags([...group.hashtags])
    setGroupHashtagInput("")
    setIsEditGroupOpen(true)
  }

  const addHashtagToGroup = () => {
    if (groupHashtagInput.trim()) {
      const cleanHashtag = groupHashtagInput.trim().replace(/^#/, "")
      if (!groupHashtags.includes(cleanHashtag)) {
        setGroupHashtags([...groupHashtags, cleanHashtag])
      }
      setGroupHashtagInput("")
    }
  }

  const removeHashtagFromGroup = (tag: string) => {
    setGroupHashtags(groupHashtags.filter((h) => h !== tag))
  }

  const createHashtagGroup = () => {
    if (!groupName.trim()) {
      error("Please enter a group name")
      return
    }
    if (groupHashtags.length === 0) {
      error("Please add at least one hashtag")
      return
    }

    const newGroup: HashtagGroup = {
      id: Math.max(...hashtagGroups.map((g) => g.id), 0) + 1,
      name: groupName,
      hashtags: groupHashtags,
    }
    setHashtagGroups([...hashtagGroups, newGroup])
    setIsCreateGroupOpen(false)
    success(`${groupName} hashtag group has been created`)
  }

  const saveEditedGroup = () => {
    if (!editingGroup) return

    if (!groupName.trim()) {
      error("Please enter a group name")
      return
    }
    if (groupHashtags.length === 0) {
      error("Please add at least one hashtag")
      return
    }

    setHashtagGroups(
      hashtagGroups.map((g) => (g.id === editingGroup.id ? { ...g, name: groupName, hashtags: groupHashtags } : g)),
    )
    setIsEditGroupOpen(false)
    success(`${groupName} hashtag group has been updated`)
  }

  const saveAllSettings = () => {
    // Password validation
    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword) {
        error("Please enter your current password")
        return
      }
      if (newPassword !== confirmPassword) {
        error("New passwords don't match")
        return
      }
      if (newPassword.length < 8) {
        error("Password must be at least 8 characters")
        return
      }
    }

    const payload = {
      auto_save_drafts: autoSaveDrafts,
      add_watermark: addWatermark,
      image_optimization: imageOptimization,
      // Email Notifications
      email_post_performance: emailPostPerformance,
      email_weekly_reports: emailWeeklyReports,
      email_marketing_tips: emailMarketingTips,
      // Push Notifications
      push_post_published: pushPostPublished,
      push_engagement_alerts: pushEngagementAlerts,
      hashtags,
      hashtag_groups: hashtagGroups.map((g) => ({ name: g.name, tags: g.hashtags })),
    }
    fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(() => {
        success("Your settings have been successfully updated")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      })
      .catch(() => {
        error("Failed to save settings")
      })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Elegant Header with Gradient Border */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-sm text-muted-foreground">Manage your account settings and preferences</p>
            </div>
            <Button onClick={saveAllSettings} className="gap-2 shadow-sm">
              <Check className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content with Better Spacing */}
      <main className="max-w-6xl mx-auto px-6 lg:px-8 py-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Modern Tab Navigation */}
          <TabsList className="inline-flex h-11 items-center justify-start gap-2 bg-muted/50 p-1.5 rounded-xl border border-border/50 shadow-sm">
            {/* removed Profile tab */}
            <TabsTrigger
              value="privacy"
              className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Shield className="h-4 w-4" />
              Privacy & Security
            </TabsTrigger>
            <TabsTrigger
              value="content"
              className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Settings className="h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* removed Profile Tab content */}

          {/* Privacy & Security Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <div className="p-8 space-y-8">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Privacy & Security</h2>
                  <p className="text-sm text-muted-foreground mt-1">Protect your account and control your data</p>
                </div>

                {/* Password Section */}
                <div className="space-y-6 pb-8 border-b border-border/50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Lock className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-base font-medium">Change Password</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Update your password regularly to keep your account secure
                        </p>
                      </div>
                      <div className="space-y-4 max-w-md">
                        <div className="space-y-2">
                          <Label htmlFor="cp" className="text-sm font-medium">
                            Current Password
                          </Label>
                          <Input
                            id="cp"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="np" className="text-sm font-medium">
                            New Password
                          </Label>
                          <Input
                            id="np"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cnp" className="text-sm font-medium">
                            Confirm New Password
                          </Label>
                          <Input
                            id="cnp"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="h-11"
                          />
                        </div>
                        <Button className="gap-2">
                          <Lock className="h-4 w-4" />
                          Update Password
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Removed 2FA and Privacy Controls sections */}

                {/* Danger Zone */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-destructive/10">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-base font-medium text-destructive">Danger Zone</h3>
                        <p className="text-sm text-muted-foreground mt-1">Irreversible and destructive actions</p>
                      </div>
                      <Button variant="destructive" className="gap-2" onClick={() => setIsDeleteOpen(true)}>
                        <AlertTriangle className="h-4 w-4" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Content Preferences Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <div className="p-8 space-y-8">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Manage your default hashtags to use across your content.
                  </p>
                </div>

                {/* Add New Hashtag Section */}
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Input
                      value={newHashtag}
                      onChange={(e) => setNewHashtag(e.target.value)}
                      placeholder="Add a new hashtag (without #)"
                      className="h-11 flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addHashtag()
                        }
                      }}
                    />
                    <Button onClick={addHashtag} className="h-11 gap-2 bg-primary hover:bg-primary/90">
                      Add Hashtag
                    </Button>
                  </div>
                </div>

                {/* Your Hashtags Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Your Hashtags</h3>
                  <div className="flex flex-wrap gap-2">
                    {hashtags.map((tag) => (
                      <div
                        key={tag}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted text-sm border border-border"
                      >
                        <span>#{tag}</span>
                        <button
                          onClick={() => removeHashtag(tag)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hashtag Groups Section */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold">Hashtag Groups</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create groups of hashtags for different types of content.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {hashtagGroups.map((group) => (
                      <Card key={group.id} className="p-5 border-border/50">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <h4 className="font-semibold text-base">{group.name}</h4>
                            <div className="flex flex-wrap gap-2">
                              {group.hashtags.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center px-2.5 py-1 rounded-md bg-primary/10 text-primary text-sm font-medium"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditGroupDialog(group)}
                              className="p-2 hover:bg-muted rounded-md transition-colors text-primary"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => removeHashtagGroup(group.id)}
                              className="p-2 hover:bg-muted rounded-md transition-colors text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Button
                    onClick={openCreateGroupDialog}
                    variant="outline"
                    className="w-full h-11 gap-2 border-dashed bg-transparent"
                  >
                    <Plus className="h-4 w-4" />
                    Create New Hashtag Group
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <div className="p-8 space-y-8">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Notifications</h2>
                  <p className="text-sm text-muted-foreground mt-1">Manage how you receive updates</p>
                </div>

                {/* Email Notifications */}
                <div className="space-y-6 pb-8 border-b border-border/50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-5">
                      <div>
                        <h3 className="text-base font-medium">Email Notifications</h3>
                        <p className="text-sm text-muted-foreground mt-1">Choose what emails you want to receive</p>
                      </div>
                      <div className="space-y-5">
                        <div className="flex items-center justify-between py-3">
                          <div className="space-y-0.5 flex-1">
                            <div className="text-sm font-medium">Post Performance</div>
                            <div className="text-sm text-muted-foreground">
                              Get notified when your posts reach milestones
                            </div>
                          </div>
                          <Switch checked={emailPostPerformance} onCheckedChange={setEmailPostPerformance} />
                        </div>
                        <div className="flex items-center justify-between py-3 border-t border-border/50">
                          <div className="space-y-0.5 flex-1">
                            <div className="text-sm font-medium">Weekly Reports</div>
                            <div className="text-sm text-muted-foreground">Receive weekly analytics summaries</div>
                          </div>
                          <Switch checked={emailWeeklyReports} onCheckedChange={setEmailWeeklyReports} />
                        </div>
                        <div className="flex items-center justify-between py-3 border-t border-border/50">
                          <div className="space-y-0.5 flex-1">
                            <div className="text-sm font-medium">Marketing Tips</div>
                            <div className="text-sm text-muted-foreground">
                              Tips and best practices for social media
                            </div>
                          </div>
                          <Switch checked={emailMarketingTips} onCheckedChange={setEmailMarketingTips} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Push Notifications */}
                <div className="space-y-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Smartphone className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-5">
                      <div>
                        <h3 className="text-base font-medium">Push Notifications</h3>
                        <p className="text-sm text-muted-foreground mt-1">Manage browser and mobile push notifications</p>
                      </div>
                      <div className="space-y-5">
                        <div className="flex items-center justify-between py-3">
                          <div className="space-y-0.5 flex-1">
                            <div className="text-sm font-medium">Post Published</div>
                            <div className="text-sm text-muted-foreground">
                              When your scheduled posts go live
                            </div>
                          </div>
                          <Switch checked={pushPostPublished} onCheckedChange={setPushPostPublished} />
                        </div>
                        <div className="flex items-center justify-between py-3 border-t border-border/50">
                          <div className="space-y-0.5 flex-1">
                            <div className="text-sm font-medium">Engagement Alerts</div>
                            <div className="text-sm text-muted-foreground">
                              High engagement on your content
                            </div>
                          </div>
                          <Switch checked={pushEngagementAlerts} onCheckedChange={setPushEngagementAlerts} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Hashtag Group</DialogTitle>
            <DialogDescription>Create a new group of hashtags for your content.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Marketing, Product, Events"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Hashtags</Label>
              <div className="flex gap-2">
                <Input
                  value={groupHashtagInput}
                  onChange={(e) => setGroupHashtagInput(e.target.value)}
                  placeholder="Add hashtag (without #)"
                  className="h-11"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addHashtagToGroup()
                    }
                  }}
                />
                <Button onClick={addHashtagToGroup} className="h-11">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {groupHashtags.map((tag) => (
                  <div
                    key={tag}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-sm font-medium"
                  >
                    <span>#{tag}</span>
                    <button
                      onClick={() => removeHashtagFromGroup(tag)}
                      className="hover:text-primary/70 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateGroupOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createHashtagGroup}>Create Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditGroupOpen} onOpenChange={setIsEditGroupOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Hashtag Group</DialogTitle>
            <DialogDescription>Update your hashtag group details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editGroupName">Group Name</Label>
              <Input
                id="editGroupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Marketing, Product, Events"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Hashtags</Label>
              <div className="flex gap-2">
                <Input
                  value={groupHashtagInput}
                  onChange={(e) => setGroupHashtagInput(e.target.value)}
                  placeholder="Add hashtag (without #)"
                  className="h-11"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addHashtagToGroup()
                    }
                  }}
                />
                <Button onClick={addHashtagToGroup} className="h-11">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {groupHashtags.map((tag) => (
                  <div
                    key={tag}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-sm font-medium"
                  >
                    <span>#{tag}</span>
                    <button
                      onClick={() => removeHashtagFromGroup(tag)}
                      className="hover:text-primary/70 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditGroupOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEditedGroup}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>This action is irreversible. All data will be permanently removed.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  const res = await fetch("/api/account/delete", { method: "POST" })
                  if (!res.ok) throw new Error("fail")
                  setIsDeleteOpen(false)
                  window.location.href = "/auth/login"
                } catch {
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}