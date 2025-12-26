// lib/template-dataset.ts
export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  data: {
    name?: string;
    profession?: string;
    quote?: string;
    title?: string;
    subtitle?: string;
    cta?: string;
    subtext?: string;
    imageUrl: string;
    colorScheme: string;
    layout: "classic" | "modern" | "minimal" | "creative" | "poster" | "sale" | "logo" | "product_launch" | "brand_builder";
    format: "classic" | "square" | "vertical" | "horizontal";
    style?: "modern" | "vintage" | "playful" | "elegant" | "bold" | "minimal";
    textColor?: string;
    backgroundColor?: string;
    overlayOpacity?: number;
    borderRadius?: number;
    shadow?: boolean;
    fontFamily?: string;
    titleFontFamily?: string;
    subtitleFontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    alignment?: "left" | "center" | "right";
    spacing?: number;
    footer?: string;
  };
  tags: string[];
}

export const colorSchemes = {
  beige: { from: "#c4a484", to: "#e8ddd4", name: "Warm Beige" },
  blue: { from: "#7c9cbf", to: "#b8d4f0", name: "Ocean Blue" },
  green: { from: "#8fbc8f", to: "#c8e6c9", name: "Sage Green" },
  purple: { from: "#b19cd9", to: "#e1bee7", name: "Lavender" },
  pink: { from: "#f8bbd9", to: "#fce4ec", name: "Rose Pink" },
  orange: { from: "#ffb366", to: "#ffd4a3", name: "Sunset Orange" },
  teal: { from: "#4fd1c7", to: "#81e6d9", name: "Ocean Teal" },
  red: { from: "#e63946", to: "#f1a1a8", name: "Vibrant Red" },
  yellow: { from: "#ffd60a", to: "#ffea00", name: "Bright Yellow" },
};

export const templateDataset: Template[] = [
  {
    id: "photographer-classic",
    name: "Classic Photographer",
    category: "Photography",
    description: "Elegant and professional photography portfolio",
    data: {
      name: "RAJ SINGH",
      profession: "FASHION PHOTOGRAPHER",
      quote: "A PICTURE IS A SECRET ABOUT A SECRET.\nTHE MORE IT TELLS YOU THE LESS YOU KNOW.",
      imageUrl:
        "https://image.pollinations.ai/prompt/professional%20fashion%20photographer%20portrait%20studio%20lighting?width=400&height=400&seed=1",
      colorScheme: "beige",
      layout: "classic",
      format: "classic",
      style: "elegant",
    },
    tags: ["photography", "fashion", "elegant", "professional"],
  },
  {
    id: "verde-online-market-logo",
    name: "Verde Online Market Logo",
    category: "Retail",
    description: "Teal script wordmark with uppercase sans subtitle for an online market",
    data: {
      title: "Verde",
      subtitle: "ONLINE MARKET",
      imageUrl:
        "https://image.pollinations.ai/prompt/teal%20background%20script%20Verde%20logo%20white%20text%20uppercase%20sans%20subtitle%20online%20market?width=400&height=400&seed=verde",
      colorScheme: "teal",
      layout: "logo",
      format: "square",
      style: "playful",
      textColor: "#FFFFFF",
      backgroundColor: "#5bc8a8",
      overlayOpacity: 1,
      borderRadius: 0,
      shadow: false,
      fontFamily: "mixed",
      titleFontFamily: "'Pacifico', cursive",
      subtitleFontFamily: "Inter, Helvetica, Arial, sans-serif",
      fontSize: "large",
      fontWeight: "700",
      alignment: "center",
      spacing: 12,
    },
    tags: ["retail", "market", "teal", "script", "sans", "logo"],
  },
  {
    id: "summer-sale-poster",
    name: "Summer Sale Poster",
    category: "Marketing",
    description: "Beach-themed summer sale promotional poster with ocean background",
    data: {
      title: "Summer",
      subtitle: "SALE",
      subtext: "UP TO 50% OFF!",
      cta: "SHOP NOW",
      imageUrl:
        "https://image.pollinations.ai/prompt/beautiful%20summer%20beach%20ocean%20waves%20sunset%20tropical%20paradise?width=800&height=1200&seed=2",
      colorScheme: "beige",
      layout: "poster",
      format: "vertical",
      style: "bold",
      textColor: "#000000",
      backgroundColor: "#F5F5DC",
      overlayOpacity: 0.9,
      borderRadius: 8,
      shadow: true,
      fontFamily: "mixed",
      fontSize: "large",
      fontWeight: "bold",
      alignment: "center",
      spacing: 16,
    },
    tags: ["sale", "summer", "marketing", "poster", "beach", "promotional"],
  },
  {
    id: "designer-modern-square",
    name: "Modern Designer Square",
    category: "Design",
    description: "Contemporary design portfolio optimized for Instagram posts",
    data: {
      name: "ALEX CHEN",
      profession: "UI/UX DESIGNER",
      quote: "DESIGN IS NOT JUST WHAT IT LOOKS LIKE.\nDESIGN IS HOW IT WORKS.",
      imageUrl:
        "https://image.pollinations.ai/prompt/modern%20ui%20ux%20designer%20workspace%20clean%20minimal%20setup?width=400&height=400&seed=3",
      colorScheme: "blue",
      layout: "modern",
      format: "square",
      style: "modern",
    },
    tags: ["design", "ui", "ux", "modern", "tech", "square", "instagram"],
  },
  
  {
    id: "writer-minimal-horizontal",
    name: "Minimal Writer Horizontal",
    category: "Writing",
    description: "Clean horizontal template for website banners and headers",
    data: {
      name: "JAMES WRIGHT",
      profession: "CONTENT WRITER",
      quote: "THE FIRST DRAFT OF ANYTHING IS SHIT.\nWRITING IS REWRITING.",
      imageUrl:
        "https://image.pollinations.ai/prompt/minimalist%20writer%20desk%20typewriter%20books%20clean%20workspace?width=800&height=400&seed=5",
      colorScheme: "green",
      layout: "minimal",
      format: "horizontal",
      style: "elegant",
    },
    tags: ["writing", "content", "minimal", "clean", "author", "horizontal", "banner"],
  },
  {
    id: "musician-vibrant-square",
    name: "Vibrant Musician Square",
    category: "Music",
    description: "Dynamic square template for music posts",
    data: {
      name: "SOFIA RODRIGUEZ",
      profession: "MUSIC PRODUCER",
      quote: "MUSIC IS THE UNIVERSAL LANGUAGE.\nIT SPEAKS TO THE SOUL WHEN WORDS FAIL.",
      imageUrl:
        "https://image.pollinations.ai/prompt/music%20producer%20studio%20mixing%20board%20headphones%20vibrant%20lights?width=400&height=400&seed=6",
      colorScheme: "pink",
      layout: "creative",
      format: "square",
      style: "bold",
    },
    tags: ["music", "producer", "vibrant", "dynamic", "performer", "square"],
  },
  {
    id: "chef-warm-horizontal",
    name: "Warm Chef Horizontal",
    category: "Culinary",
    description: "Warm horizontal template for food website headers",
    data: {
      name: "MARCO ROSSI",
      profession: "EXECUTIVE CHEF",
      quote: "COOKING IS LIKE LOVE.\nIT SHOULD BE ENTERED INTO WITH ABANDON OR NOT AT ALL.",
      imageUrl:
        "https://image.pollinations.ai/prompt/professional%20chef%20kitchen%20cooking%20warm%20lighting%20food%20preparation?width=800&height=400&seed=7",
      colorScheme: "beige",
      layout: "classic",
      format: "horizontal",
      style: "vintage",
    },
    tags: ["chef", "culinary", "food", "warm", "cooking", "horizontal", "website"],
  },
  {
    id: "adorable-fashion-beauty-logo",
    name: "Adorable Fashion & Beauty Logo",
    category: "Fashion & Beauty",
    description: "Pink white minimalist aesthetic logo with four-pointed stars for fashion and beauty brands",
    data: {
      title: "Adorable.",
      subtitle: "FASHION & BEAUTY.",
      imageUrl:
        "https://image.pollinations.ai/prompt/pink%20white%20minimalist%20aesthetic%20adorable%20fashion%20beauty%20logo%20four%20pointed%20stars?width=400&height=400&seed=adorable123",
      colorScheme: "pink",
      layout: "logo",
      format: "square",
      style: "minimal",
      textColor: "#FFFFFF",
      backgroundColor: "#FF1493",
      overlayOpacity: 1,
      borderRadius: 0,
      shadow: false,
      fontFamily: "mixed",
      fontSize: "large",
      fontWeight: "bold",
      alignment: "center",
      spacing: 8,
    },
    tags: ["fashion", "beauty", "pink", "white", "minimalist", "adorable", "logo", "stars"],
  },
  {
    id: "love-fashion-store-logo",
    name: "Love Fashion Store Logo",
    category: "Fashion & Beauty",
    description: "Minimal red and white calligraphy logo for a fashion store, blending elegance and modernity",
    data: {
      title: "love.",
      subtitle: "FASHION STORE",
      subtext: "EST.2024",
      imageUrl:
        "https://image.pollinations.ai/prompt/red%20white%20minimal%20calligraphy%20fashion%20store%20logo%20elegant%20modern?width=400&height=400&seed=love2024",
      colorScheme: "red",
      layout: "logo",
      format: "square",
      style: "elegant",
      textColor: "#e63946",
      backgroundColor: "#FFFFFF",
      overlayOpacity: 1,
      borderRadius: 0,
      shadow: false,
      fontFamily: "mixed",
      fontSize: "large",
      fontWeight: "bold",
      alignment: "center",
      spacing: 8,
    },
    tags: ["fashion", "minimal", "calligraphy", "red", "white", "elegant", "logo"],
  },
  
  
  
  
  {
    id: "ginger-cosmetics-logo",
    name: "Ginger Cosmetics Logo",
    category: "Beauty",
    description: "Editorial cosmetic wordmark with Playfair serif and wide-tracked sans subtitle",
    data: {
      title: "Ginger.",
      subtitle: "COSMETICS",
      imageUrl:
        "https://image.pollinations.ai/prompt/minimal%20editorial%20cosmetics%20logo%20cream%20background%20black%20serif%20wordmark%20with%20subtitle?width=400&height=400&seed=gingercosmetics",
      colorScheme: "beige",
      layout: "logo",
      format: "square",
      style: "elegant",
      textColor: "#1A1A1A",
      backgroundColor: "#DEDBD3",
      overlayOpacity: 1,
      borderRadius: 0,
      shadow: false,
      fontFamily: "serif",
      titleFontFamily: "Playfair Display, serif",
      subtitleFontFamily: "Inter, Helvetica, Arial, sans-serif",
      fontSize: "large",
      fontWeight: "700",
      alignment: "center",
      spacing: 12,
    },
    tags: ["cosmetics", "beauty", "editorial", "serif", "playfair", "logo"],
  },
  
  {
    id: "olivia-wilson-beauty-logo",
    name: "Olivia Wilson Beauty Logo",
    category: "Beauty",
    description: "Luxury black logo with script name, serif BEA UTY, rose-gold gradient arcs",
    data: {
      title: "Olivia Wilson",
      subtitle: "BEAUTY",
      imageUrl:
        "https://image.pollinations.ai/prompt/luxury%20beauty%20brand%20logo%20black%20background%20rose%20gold%20gradient%20arcs%20elegant%20script%20Olivia%20Wilson%20serif%20BEAUTY?width=400&height=400&seed=oliviawilson",
      colorScheme: "beige",
      layout: "logo",
      format: "square",
      style: "elegant",
      textColor: "#d4a5a5",
      backgroundColor: "#000000",
      overlayOpacity: 1,
      borderRadius: 0,
      shadow: false,
      fontFamily: "serif",
      titleFontFamily: "'Dancing Script', cursive",
      subtitleFontFamily: "Cinzel, serif",
      fontSize: "large",
      fontWeight: "700",
      alignment: "center",
      spacing: 12,
    },
    tags: ["beauty", "luxury", "rose-gold", "script", "serif", "logo"],
  },
  {
    id: "arion-boutique-logo",
    name: "Arion Boutique Logo",
    category: "Fashion & Beauty",
    description: "Pale pink serif wordmark with concentric circle A icon and wide-tracked sans subtitle",
    data: {
      title: "Arion",
      subtitle: "Boutique",
      imageUrl:
        "https://image.pollinations.ai/prompt/pale%20pink%20background%20serif%20Arion%20logo%20concentric%20circle%20A%20icon%20wide%20tracked%20Boutique%20subtitle?width=400&height=400&seed=arionboutique",
      colorScheme: "pink",
      layout: "logo",
      format: "square",
      style: "elegant",
      textColor: "#000000",
      backgroundColor: "#fde2e4",
      overlayOpacity: 1,
      borderRadius: 0,
      shadow: false,
      fontFamily: "serif",
      titleFontFamily: "Playfair Display, serif",
      subtitleFontFamily: "Inter, Helvetica, Arial, sans-serif",
      fontSize: "large",
      fontWeight: "700",
      alignment: "center",
      spacing: 12,
    },
    tags: ["boutique", "fashion", "serif", "playfair", "pink", "logo"],
  },
  {
    id: "coffee-shop-brand-builder",
    name: "Coffee Shop Brand Builder",
    category: "Retail",
    description: "Dark gradient top/bottom over coffee machine photo with large serif title and bold subtitle",
    data: {
      title: "Coffee Shop",
      subtitle: "Brand Builder",
      cta: "Kittl FLOWS",
      subtext: "Nano Banana Pro",
      imageUrl:
        "https://image.pollinations.ai/prompt/close-up%20espresso%20pouring%20into%20paper%20cup%20coffee%20machine%20barista%20hands%20moody%20lighting?width=800&height=800&seed=coffee_brand",
      colorScheme: "beige",
      layout: "brand_builder",
      format: "square",
      style: "elegant",
      textColor: "#ffffff",
      backgroundColor: "#000000",
      overlayOpacity: 0.8,
      borderRadius: 0,
      shadow: false,
      fontFamily: "serif",
      titleFontFamily: "Playfair Display, serif",
      subtitleFontFamily: "Inter, Helvetica, Arial, sans-serif",
      fontSize: "large",
      fontWeight: "700",
      alignment: "center",
      spacing: 12,
    },
    tags: ["square", "instagram", "coffee", "brand", "builder", "poster"],
  },
  {
    
  },
  
];

export const professionTemplates = {
  photographer: ["photography", "fashion", "portrait", "wedding", "commercial"],
  designer: ["ui", "ux", "graphic", "web", "brand"],
  artist: ["digital", "traditional", "illustration", "fine art", "concept"],
  writer: ["content", "copywriter", "author", "journalist", "blogger"],
  musician: ["producer", "composer", "performer", "dj", "sound engineer"],
  chef: ["executive", "pastry", "sous", "private", "restaurant"],
  developer: ["frontend", "backend", "fullstack", "mobile", "devops"],
  consultant: ["business", "marketing", "strategy", "finance", "hr"],
  marketer: ["digital", "content", "social media", "brand", "growth"],
};