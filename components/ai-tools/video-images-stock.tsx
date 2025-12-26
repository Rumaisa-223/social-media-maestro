"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Download, Heart, Eye, Shuffle, Grid3X3, Grid2X2, LayoutGrid, Video, Image, Play } from 'lucide-react'

interface StockItem {
  id: string
  type: 'image' | 'video'
  url: string
  downloadUrl: string
  author: string
  width: number
  height: number
  category: string
  tags: string[]
  duration?: number
}

export function VideoImagesStock() {
  const [items, setItems] = useState<StockItem[]>([])
  const [filteredItems, setFilteredItems] = useState<StockItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [viewMode, setViewMode] = useState("grid")
  const [loading, setLoading] = useState(true)

  // Generate 50 stock items (25 images + 25 videos) using Picsum
  useEffect(() => {
    const generateStockItems = () => {
      const categories = [
        'business', 'technology', 'nature', 'people', 'food', 'travel', 
        'architecture', 'abstract', 'animals', 'sports', 'fashion', 'art'
      ]
      
      const authors = [
        'John Smith', 'Sarah Johnson', 'Mike Chen', 'Emma Wilson', 'David Brown',
        'Lisa Garcia', 'Tom Anderson', 'Anna Martinez', 'Chris Taylor', 'Maya Patel'
      ]

      const stockItems: StockItem[] = []

      // Generate 25 images
      for (let i = 0; i < 25; i++) {
        const category = categories[i % categories.length]
        const author = authors[i % authors.length]
        const width = 800 + (i % 3) * 200
        const height = 600 + (i % 2) * 200
        const seed = `stock-image-${category}-${i + 1}`
        
        stockItems.push({
          id: `image-${i + 1}`,
          type: 'image',
          url: `https://picsum.photos/seed/${seed}/${width}/${height}`,
          downloadUrl: `https://picsum.photos/seed/${seed}/${width * 2}/${height * 2}`,
          author,
          width,
          height,
          category,
          tags: [category, 'professional', 'high-quality', i % 2 === 0 ? 'trending' : 'popular']
        })
      }

      // Generate 25 videos (using placeholder video URLs)
      for (let i = 0; i < 25; i++) {
        const category = categories[i % categories.length]
        const author = authors[i % authors.length]
        const width = 1920
        const height = 1080
        const duration = 10 + (i % 5) * 5
        
        stockItems.push({
          id: `video-${i + 1}`,
          type: 'video',
          url: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`,
          downloadUrl: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`,
          author,
          width,
          height,
          category,
          duration,
          tags: [category, 'professional', 'high-quality', i % 2 === 0 ? 'trending' : 'popular']
        })
      }

      setItems(stockItems)
      setFilteredItems(stockItems)
      setLoading(false)
    }

    generateStockItems()
  }, [])

  // Filter items based on search, category, and type
  useEffect(() => {
    let filtered = items

    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.type === selectedType)
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.author.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredItems(filtered)
  }, [items, searchTerm, selectedCategory, selectedType])

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'business', label: 'Business' },
    { value: 'technology', label: 'Technology' },
    { value: 'nature', label: 'Nature' },
    { value: 'people', label: 'People' },
    { value: 'food', label: 'Food' },
    { value: 'travel', label: 'Travel' },
    { value: 'architecture', label: 'Architecture' },
    { value: 'abstract', label: 'Abstract' },
    { value: 'animals', label: 'Animals' },
    { value: 'sports', label: 'Sports' },
    { value: 'fashion', label: 'Fashion' },
    { value: 'art', label: 'Art' }
  ]

  const shuffleItems = () => {
    const shuffled = [...filteredItems].sort(() => Math.random() - 0.5)
    setFilteredItems(shuffled)
  }

  const getGridClass = () => {
    switch (viewMode) {
      case 'large': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      case 'medium': return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
      case 'small': return 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
      default: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading video and image stock...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Video and Images Stock</h2>
          <p className="text-muted-foreground">High-quality videos and images for your projects</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700">
            25 Videos Available
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            25 Images Available
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search videos and images by category, tags, or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Tabs value={selectedType} onValueChange={setSelectedType} className="w-full md:w-auto">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="image">Images</TabsTrigger>
            <TabsTrigger value="video">Videos</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={shuffleItems}
            className="flex items-center gap-2"
          >
            <Shuffle className="h-4 w-4" />
            Shuffle
          </Button>
          
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'large' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('large')}
              className="rounded-r-none"
            >
              <Grid2X2 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'medium' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('medium')}
              className="rounded-none border-x"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'small' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('small')}
              className="rounded-l-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredItems.length} of {items.length} items
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Free to use</Badge>
          <Badge variant="outline">High resolution</Badge>
          <Badge variant="outline">Commercial license</Badge>
        </div>
      </div>

      {/* Items Grid */}
      <div className={`grid ${getGridClass()} gap-4`}>
        {filteredItems.map((item) => (
          <Card key={item.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-0 relative">
              {item.type === 'image' ? (
                <img
                  src={item.url || "/placeholder.svg"}
                  alt={`Stock ${item.type} by ${item.author}`}
                  className="w-full aspect-square object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="relative">
                  <video
                    src={item.url}
                    className="w-full aspect-square object-cover"
                    muted
                    loop
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => e.currentTarget.pause()}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/50 rounded-full p-3">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="sm" variant="secondary">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="secondary">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="secondary">
                  <Download className="h-4 w-4" />
                </Button>
              </div>

              {/* Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium">{item.author}</p>
                    <p className="text-xs opacity-75">
                      {item.width} × {item.height}
                      {item.duration && ` • ${item.duration}s`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {item.category}
                    </Badge>
                    {item.type === 'video' && (
                      <Video className="h-3 w-3 text-white" />
                    )}
                    {item.type === 'image' && (
                      <Image className="h-3 w-3 text-white" />
                    )}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="absolute top-2 left-2">
                {item.tags.includes('trending') && (
                  <Badge variant="default" className="text-xs bg-red-500">
                    Trending
                  </Badge>
                )}
                {item.tags.includes('popular') && (
                  <Badge variant="default" className="text-xs bg-blue-500">
                    Popular
                  </Badge>
                )}
              </div>

              {/* Type Indicator */}
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className="text-xs bg-white/90">
                  {item.type === 'video' ? 'Video' : 'Image'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No items found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search terms or filters
          </p>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Showing all {filteredItems.length} available items
          </p>
          <Button variant="outline">
            <Shuffle className="h-4 w-4 mr-2" />
            Shuffle for More Variety
          </Button>
        </div>
      )}
    </div>
  )
}
