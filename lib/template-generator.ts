import { professionTemplates, type Template } from "./template-dataset"

export class TemplateGenerator {
  static generateFromText(description: string): Template {
    const words = description.toLowerCase().split(" ")

    // Extract profession
    let detectedProfession = "designer"
    let detectedSpecialty = ""

    for (const [profession, specialties] of Object.entries(professionTemplates)) {
      if (words.some((word) => word.includes(profession))) {
        detectedProfession = profession
        detectedSpecialty = specialties.find((s) => words.some((w) => w.includes(s))) || specialties[0]
        break
      }

      for (const specialty of specialties) {
        if (words.some((word) => word.includes(specialty))) {
          detectedProfession = profession
          detectedSpecialty = specialty
          break
        }
      }
    }

    // Extract format preferences
    let format: "classic" | "square" | "vertical" | "horizontal" = "classic"
    if (words.some((w) => ["square", "post", "instagram post", "feed"].includes(w))) {
      format = "square"
    } else if (words.some((w) => ["vertical", "story", "instagram story", "stories"].includes(w))) {
      format = "vertical"
    } else if (words.some((w) => ["horizontal", "banner", "header", "website", "cover"].includes(w))) {
      format = "horizontal"
    }

    // Extract style preferences
    let colorScheme = "beige"
    let layout: "classic" | "modern" | "minimal" | "creative" | "poster" | "sale" = "classic"

    if (words.some((w) => ["modern", "contemporary", "sleek"].includes(w))) {
      layout = "modern"
      colorScheme = "blue"
    } else if (words.some((w) => ["minimal", "clean", "simple"].includes(w))) {
      layout = "minimal"
      colorScheme = "green"
    } else if (words.some((w) => ["creative", "artistic", "vibrant", "colorful"].includes(w))) {
      layout = "creative"
      colorScheme = "purple"
    } else if (words.some((w) => ["warm", "cozy", "friendly"].includes(w))) {
      colorScheme = "beige"
    } else if (words.some((w) => ["professional", "corporate", "business"].includes(w))) {
      colorScheme = "blue"
    } else if (words.some((w) => ["sale", "marketing", "poster", "promotion"].includes(w))) {
      layout = "poster"
      colorScheme = "orange"
    }

    // Extract name if provided
    const nameMatch = description.match(/(?:name|called|i'm|i am)\s+([A-Za-z\s]+)/i)
    const extractedName = nameMatch ? nameMatch[1].trim().toUpperCase() : this.generateRandomName()

    // Generate profession title
    const professionTitle = `${detectedSpecialty.toUpperCase()} ${detectedProfession.toUpperCase()}`

    // Generate appropriate quote
    const quote = this.generateQuote(detectedProfession)

    // Generate AI image based on profession and style
    const imagePrompt = `professional ${detectedProfession} ${detectedSpecialty} workspace ${layout} style`
    const seed = Date.now()
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=400&height=400&seed=${seed}`

    return {
      id: `generated-${Date.now()}`,
      name: "Generated Template",
      category: detectedProfession,
      description: `Auto-generated ${detectedProfession} template - ${format} format`,
      data: {
        name: extractedName,
        profession: professionTitle,
        quote: quote,
        imageUrl: imageUrl,
        colorScheme: colorScheme,
        layout: layout,
        format: format,
        style: layout === "poster" ? "bold" : "modern",
      },
      tags: [detectedProfession, detectedSpecialty, layout, colorScheme, format],
    }
  }

  static generateRandom(): Template {
    const professions = Object.keys(professionTemplates)
    const randomProfession = professions[Math.floor(Math.random() * professions.length)]
    const specialties = professionTemplates[randomProfession as keyof typeof professionTemplates]
    const randomSpecialty = specialties[Math.floor(Math.random() * specialties.length)]

    const layouts: Array<"classic" | "modern" | "minimal" | "creative" | "poster" | "sale"> = [
      "classic",
      "modern",
      "minimal",
      "creative",
      "poster",
      "sale",
    ]
    const colors = ["beige", "blue", "green", "purple", "pink", "orange", "teal"]
    const formats: Array<"classic" | "square" | "vertical" | "horizontal"> = [
      "classic",
      "square",
      "vertical",
      "horizontal",
    ]

    const randomLayout = layouts[Math.floor(Math.random() * layouts.length)]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    const randomFormat = formats[Math.floor(Math.random() * formats.length)]

    // Generate AI image for random template
    const imagePrompt = `professional ${randomProfession} ${randomSpecialty} workspace ${randomLayout} style`
    const seed = Date.now() + Math.random() * 1000
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=400&height=400&seed=${Math.floor(seed)}`

    return {
      id: `random-${Date.now()}`,
      name: "Random Generated",
      category: randomProfession,
      description: `Randomly generated ${randomProfession} template - ${randomFormat} format`,
      data: {
        name: this.generateRandomName(),
        profession: `${randomSpecialty.toUpperCase()} ${randomProfession.toUpperCase()}`,
        quote: this.generateQuote(randomProfession),
        imageUrl: imageUrl,
        colorScheme: randomColor,
        layout: randomLayout,
        format: randomFormat,
        style: randomLayout === "poster" || randomLayout === "sale" ? "bold" : "modern",
      },
      tags: [randomProfession, randomSpecialty, randomLayout, randomColor, randomFormat],
    }
  }

  private static generateRandomName(): string {
    const firstNames = ["ALEX", "JORDAN", "TAYLOR", "CASEY", "MORGAN", "RILEY", "AVERY", "SAGE", "QUINN", "ROWAN"]
    const lastNames = [
      "SMITH",
      "JOHNSON",
      "WILLIAMS",
      "BROWN",
      "JONES",
      "GARCIA",
      "MILLER",
      "DAVIS",
      "RODRIGUEZ",
      "MARTINEZ",
    ]

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]

    return `${firstName} ${lastName}`
  }

  private static generateQuote(profession: string): string {
    const quotes = {
      photographer: [
        "A PICTURE IS A SECRET ABOUT A SECRET.\nTHE MORE IT TELLS YOU THE LESS YOU KNOW.",
        "PHOTOGRAPHY IS THE STORY I FAIL TO PUT INTO WORDS.\nEVERY PICTURE TELLS A STORY.",
        "IN PHOTOGRAPHY THERE IS A REALITY SO SUBTLE\nTHAT IT BECOMES MORE REAL THAN REALITY.",
      ],
      designer: [
        "DESIGN IS NOT JUST WHAT IT LOOKS LIKE.\nDESIGN IS HOW IT WORKS.",
        "GOOD DESIGN IS OBVIOUS.\nGREAT DESIGN IS TRANSPARENT.",
        "DESIGN IS THINKING MADE VISUAL.\nSIMPLICITY IS THE ULTIMATE SOPHISTICATION.",
      ],
      artist: [
        "CREATIVITY TAKES COURAGE.\nART IS THE LIE THAT ENABLES US TO REALIZE THE TRUTH.",
        "ART ENABLES US TO FIND OURSELVES\nAND LOSE OURSELVES AT THE SAME TIME.",
        "EVERY ARTIST WAS FIRST AN AMATEUR.\nART IS NOT WHAT YOU SEE, BUT WHAT YOU MAKE OTHERS SEE.",
      ],
      writer: [
        "THE FIRST DRAFT OF ANYTHING IS SHIT.\nWRITING IS REWRITING.",
        "WORDS HAVE NO SINGLE FIXED MEANING.\nWRITING IS THE PAINTING OF THE VOICE.",
        "THERE IS NOTHING TO WRITING.\nALL YOU DO IS SIT DOWN AND BLEED.",
      ],
      musician: [
        "MUSIC IS THE UNIVERSAL LANGUAGE.\nIT SPEAKS TO THE SOUL WHEN WORDS FAIL.",
        "WITHOUT MUSIC, LIFE WOULD BE A MISTAKE.\nMUSIC IS THE WINE WHICH INSPIRES NEW PROCESSES.",
        "MUSIC CAN CHANGE THE WORLD\nBECAUSE IT CAN CHANGE PEOPLE.",
      ],
      chef: [
        "COOKING IS LIKE LOVE.\nIT SHOULD BE ENTERED INTO WITH ABANDON OR NOT AT ALL.",
        "THE SECRET OF COOKING IS TO HAVE A LOVE OF IT.\nGOOD FOOD IS GOOD MOOD.",
        "COOKING IS NOT ABOUT CONVENIENCE.\nIT'S ABOUT LOVE, CULTURE, AND CREATIVITY.",
      ],
      marketer: [
        "MARKETING IS NO LONGER ABOUT THE STUFF YOU MAKE.\nBUT THE STORIES YOU TELL.",
        "CONTENT IS FIRE. SOCIAL MEDIA IS GASOLINE.\nTOGETHER THEY CREATE AN EXPLOSION.",
        "THE BEST MARKETING DOESN'T FEEL LIKE MARKETING.\nIT FEELS LIKE A CONVERSATION.",
      ],
    }

    const professionQuotes = quotes[profession as keyof typeof quotes] || quotes.designer
    return professionQuotes[Math.floor(Math.random() * professionQuotes.length)]
  }
}
