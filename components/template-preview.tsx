// components/template-preview.tsx
"use client"

import Image from "next/image"
import { colorSchemes, type Template } from "../lib/template-dataset"
import { Playfair_Display, Inter, Dancing_Script, Cinzel, Pacifico } from "next/font/google"

const playfair = Playfair_Display({ subsets: ["latin"] })
const inter = Inter({ subsets: ["latin"] })
const dancingScript = Dancing_Script({ weight: ["400", "700"], subsets: ["latin"] })
const cinzel = Cinzel({ weight: "400", subsets: ["latin"] })
const pacifico = Pacifico({ weight: "400", subsets: ["latin"] })

interface TemplatePreviewProps {
  template: Template
  className?: string
}

export default function TemplatePreview({ template, className = "" }: TemplatePreviewProps) {
  const { data } = template
  const currentColorScheme = colorSchemes[data.colorScheme as keyof typeof colorSchemes] || {
    from: "#ffffff",
    to: "#ffffff",
  }

  const getContainerClass = () => {
    switch (data.format) {
      case "square":
        return "aspect-square"
      case "vertical":
        return "aspect-[9/16]"
      case "horizontal":
        return "aspect-[16/9]"
      default:
        return "aspect-[4/3]"
    }
  }

  const renderLayout = () => {
    switch (data.layout) {
      case "modern":
        return (
          <div
            className={`flex ${
              data.format === "vertical" ? "flex-col" : data.format === "horizontal" ? "flex-row" : "flex-row"
            } items-center gap-4`}
          >
            <div className="flex-1 space-y-2">
              <h1
                className={`${
                  data.format === "vertical" ? "text-lg" : data.format === "horizontal" ? "text-2xl" : "text-xl"
                } font-black tracking-tight text-gray-900 leading-none`}
              >
                {data.name || data.title || "Modern Design"}
              </h1>
              <p
                className={`${
                  data.format === "horizontal" ? "text-sm" : "text-xs"
                } tracking-[0.2em] text-gray-700 font-medium`}
              >
                {data.profession || data.subtitle || "Professional"}
              </p>
              <div
                className={`${
                  data.format === "horizontal" ? "w-12 h-1" : "w-8 h-0.5"
                } bg-gray-900`}
              ></div>
              <blockquote
                className={`${
                  data.format === "horizontal" ? "text-sm" : "text-xs"
                } text-gray-600 font-light leading-relaxed`}
              >
                {(data.quote || data.subtext || "Excellence in every detail").split("\n").map((line, index) => (
                  <span key={index}>
                    {line}
                    {index < (data.quote || data.subtext || "").split("\n").length - 1 && <br />}
                  </span>
                ))}
              </blockquote>
            </div>
            <div
              className={`${
                data.format === "vertical"
                  ? "w-16 h-16"
                  : data.format === "horizontal"
                    ? "w-24 h-24"
                    : "w-20 h-20"
              } rounded-lg overflow-hidden shadow-lg flex-shrink-0`}
            >
              <Image
                src={data.imageUrl || "/placeholder.svg?height=100&width=100"}
                alt="Profile Photo"
                width={96}
                height={96}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
          </div>
        )

      case "minimal":
        return (
          <div className={`${data.format === "horizontal" ? "flex items-center gap-6" : "text-center"} space-y-3`}>
            <div
              className={`${
                data.format === "vertical"
                  ? "w-12 h-12"
                  : data.format === "horizontal"
                    ? "w-20 h-20"
                    : "w-16 h-16"
              } ${data.format === "horizontal" ? "" : "mx-auto"} rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0`}
            >
              <Image
                src={data.imageUrl || "/placeholder.svg?height=80&width=80"}
                alt="Profile Photo"
                width={80}
                height={80}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
            <div className={`${data.format === "horizontal" ? "flex-1" : ""} space-y-1`}>
              <h1
                className={`${
                  data.format === "vertical" ? "text-sm" : data.format === "horizontal" ? "text-xl" : "text-lg"
                } font-light tracking-[0.3em] text-gray-800`}
              >
                {data.name || data.title || "Minimal Design"}
              </h1>
              <p
                className={`${
                  data.format === "horizontal" ? "text-sm" : "text-xs"
                } tracking-[0.2em] text-gray-500 uppercase`}
              >
                {data.profession || data.subtitle || "Professional"}
              </p>
              <div
                className={`${
                  data.format === "horizontal" ? "w-8 h-px" : "w-6 h-px"
                } bg-gray-300 ${data.format === "horizontal" ? "" : "mx-auto"}`}
              ></div>
              <blockquote
                className={`${
                  data.format === "horizontal" ? "text-sm" : "text-xs"
                } text-gray-600 font-light leading-relaxed`}
              >
                {(data.quote || data.subtext || "Simple. Clean. Effective.").split("\n").map((line, index) => (
                  <span key={index}>
                    {line}
                    {index < (data.quote || data.subtext || "").split("\n").length - 1 && <br />}
                  </span>
                ))}
              </blockquote>
            </div>
          </div>
        )

      case "creative":
        return (
          <div className="relative">
            <div
              className={`grid ${
                data.format === "vertical"
                  ? "grid-cols-1 gap-2"
                  : data.format === "horizontal"
                    ? "grid-cols-4 gap-4"
                    : "grid-cols-3 gap-2"
              } items-center`}
            >
              <div
                className={`${
                  data.format === "vertical"
                    ? "col-span-1"
                    : data.format === "horizontal"
                      ? "col-span-3"
                      : "col-span-2"
                } space-y-1`}
              >
                <div className="transform -rotate-1">
                  <h1
                    className={`${
                      data.format === "vertical"
                        ? "text-sm"
                        : data.format === "horizontal"
                          ? "text-2xl"
                          : "text-lg"
                    } font-black text-gray-900 leading-none`}
                  >
                    {(data.name || data.title || "Creative Design").split(" ")[0]}
                  </h1>
                  <h1
                    className={`${
                      data.format === "vertical"
                        ? "text-sm"
                        : data.format === "horizontal"
                          ? "text-2xl"
                          : "text-lg"
                    } font-black text-gray-900 leading-none transform translate-x-2`}
                  >
                    {(data.name || data.title || "Creative Design").split(" ")[1] || ""}
                  </h1>
                </div>
                <div className="transform rotate-1 bg-white p-1 shadow-sm inline-block">
                  <p
                    className={`${
                      data.format === "horizontal" ? "text-sm" : "text-xs"
                    } tracking-[0.1em] text-gray-700 font-bold`}
                  >
                    {data.profession || data.subtitle || "Creative Professional"}
                  </p>
                </div>
                <div
                  className={`transform -rotate-1 bg-gray-900 text-white p-2 ${
                    data.format === "horizontal" ? "text-sm" : "text-xs"
                  }`}
                >
                  <blockquote className="font-light leading-relaxed">
                    {(data.quote || data.subtext || "Think outside the box").split("\n").map((line, index) => (
                      <span key={index}>
                        {line}
                        {index < (data.quote || data.subtext || "").split("\n").length - 1 && <br />}
                      </span>
                    ))}
                  </blockquote>
                </div>
              </div>
              <div className="transform rotate-2">
                <div
                  className={`${
                    data.format === "vertical"
                      ? "w-16 h-16"
                      : data.format === "horizontal"
                        ? "w-24 h-24"
                        : "w-20 h-20"
                  } rounded-xl overflow-hidden shadow-lg border-2 border-white flex-shrink-0`}
                >
                  <Image
                    src={data.imageUrl || "/placeholder.svg?height=96&width=96"}
                    alt="Profile Photo"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case "logo":
        return (
          <>
            {data.title?.toLowerCase().includes("ginger") ? (
              <div
                className="relative w-full h-full flex items-center justify-center"
                style={{ backgroundColor: "#DEDBD3" }}
              >
                <div className="cq-container w-full h-full flex items-center justify-center p-[clamp(8px,3cqi,24px)] text-[#1A1A1A]">
                  <div className="max-w-[92%] max-h-[92%] w-full flex flex-col items-center justify-center gap-2">
                    <h1
                      className={`${playfair.className} text-center whitespace-nowrap text-[clamp(2rem,12cqw,10rem)] leading-[0.9] font-bold tracking-tighter`}
                    >
                      {data.title}
                    </h1>
                    <div className="flex w-full items-center justify-center gap-2 px-[clamp(4px,1cqi,12px)]">
                      <div className="h-[1px] flex-1 bg-[#1A1A1A]/20" />
                      {data.subtitle && (
                        <p className={`${inter.className} text-[clamp(0.5rem,2.5cqw,1rem)] font-bold tracking-[0.6em] whitespace-nowrap uppercase`}> 
                          {data.subtitle}
                        </p>
                      )}
                      <div className="h-[1px] flex-1 bg-[#1A1A1A]/20" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (data.title || "").toLowerCase().includes("verde") ? (
              <div className="relative w-full h-full flex items-center justify-center" style={{ backgroundColor: "#5bc8a8" }}>
                <div className="cq-container relative z-10 w-full h-full flex items-center justify-center p-[clamp(12px,3cqi,36px)]">
                  <div className="max-w-[90%] max-h-[90%] w-full flex flex-col items-center justify-center text-center text-white select-none">
                    <h1 className={`${pacifico.className} text-[clamp(3rem,16cqw,10rem)] leading-[0.8] mb-2 drop-shadow-sm whitespace-nowrap`}>{data.title}</h1>
                    {data.subtitle && (
                      <p className={`${inter.className} text-[clamp(0.7rem,2cqw,1rem)] font-medium tracking-[0.4em] uppercase opacity-90 mt-[clamp(6px,2cqh,12px)]`}>{data.subtitle}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (data.title || "").toLowerCase().includes("olivia wilson") ? (
              <div className="relative w-full h-full flex items-center justify-center" style={{ backgroundColor: "#000000" }}>
                <div className="absolute inset-0 flex items-start justify-center pt-[clamp(6px,2cqh,16px)]">
                  <svg width="300" height="150" viewBox="0 0 300 150" className="w-[85%] h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="topGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#d4a5a5" />
                        <stop offset="50%" stopColor="#c89595" />
                        <stop offset="100%" stopColor="#000000" />
                      </linearGradient>
                    </defs>
                    <path d="M 30 120 Q 75 20, 150 10 T 270 120" stroke="url(#topGradient)" strokeWidth="2" strokeLinecap="round" fill="none" />
                  </svg>
                </div>
                <div className="cq-container relative z-10 w-full h-full flex items-center justify-center p-[clamp(12px,3cqi,36px)]">
                  <div className="max-w-[90%] max-h-[90%] w-full flex flex-col items-center justify-center text-center">
                    <h1 className={`${dancingScript.className} text-[clamp(2.5rem,12cqw,8rem)] leading-[0.95] text-[#d4a5a5] mb-2 whitespace-nowrap`}>{data.title}</h1>
                    {data.subtitle && (
                      <p className={`${cinzel.className} text-[#d4a5a5] text-[clamp(0.6rem,1.8cqw,0.9rem)] tracking-[0.25em] uppercase whitespace-nowrap`}>{data.subtitle}</p>
                    )}
                  </div>
                </div>
                <div className="absolute inset-0 flex items-end justify-center pb-[clamp(6px,2cqh,16px)]">
                  <svg width="300" height="150" viewBox="0 0 300 150" className="w-[85%] h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="bottomGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#000000" />
                        <stop offset="50%" stopColor="#c89595" />
                        <stop offset="100%" stopColor="#d4a5a5" />
                      </linearGradient>
                    </defs>
                    <path d="M 30 30 Q 75 130, 150 140 T 270 30" stroke="url(#bottomGradient)" strokeWidth="2" strokeLinecap="round" fill="none" />
                  </svg>
                </div>
              </div>
            ) : (data.title || "").toLowerCase().includes("arion") ? (
              <div className="relative w-full h-full flex items-center justify-center" style={{ backgroundColor: "#fde2e4" }}>
                <div className="cq-container relative z-10 w-full h-full flex items-center justify-center p-[clamp(12px,3cqi,36px)]">
                  <div className="max-w-[90%] max-h-[90%] w-full flex flex-col items-center justify-center text-center text-black select-none">
                    <div className="relative flex items-center justify-center mb-[clamp(12px,3cqh,24px)]">
                      <div className="relative w-[clamp(72px,22cqw,128px)] h-[clamp(72px,22cqw,128px)]">
                        <div className="absolute inset-0 rounded-full border border-black/80" />
                        <div className="absolute inset-[clamp(2px,0.8cqi,6px)] rounded-full border-[3px] border-black/90" />
                        <span className={`${playfair.className} absolute inset-0 flex items-center justify-center italic text-[clamp(2rem,9cqw,5rem)] leading-[1]`}>A</span>
                      </div>
                    </div>
                    <h1 className={`${playfair.className} text-[clamp(2rem,9cqw,6.5rem)] tracking-[0.03em] uppercase text-black mb-1 whitespace-nowrap`}>{data.title}</h1>
                    {data.subtitle && (
                      <p className={`${inter.className} text-black text-[clamp(0.6rem,1.8cqw,1rem)] font-light tracking-[0.35em] uppercase border-t border-black/20 pt-[clamp(8px,2cqh,16px)] w-full text-center whitespace-nowrap`}>{data.subtitle}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`relative w-full h-full flex items-${
                  data.alignment === "left" ? "start" : "center"
                } justify-${data.alignment === "left" ? "start" : "center"}`}
                style={{
                  backgroundColor: data.backgroundColor || currentColorScheme.from || "#FF1493",
                }}
              >
                {data.alignment !== "left" && ((data.title && /adorable|street/i.test(data.title)) || data.style === "vintage") && (
                  <>
                    <div className="absolute top-4 left-4 text-white text-xs">✦</div>
                    <div className="absolute top-4 right-4 text-white text-xs">✦</div>
                    <div className="absolute bottom-4 left-4 text-white text-xs">✦</div>
                    <div className="absolute bottom-4 right-4 text-white text-xs">✦</div>
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-12 -translate-y-2 text-white text-xs">
                      ✦
                    </div>
                    <div className="absolute left-1/2 top-1/2 transform translate-x-12 translate-y-2 text-white text-xs">
                      ✦
                    </div>
                  </>
                )}
                <div
                  className={`${
                    data.alignment === "left" ? "text-left pl-4" : "text-center"
                  } flex flex-col items-center`}
                >
                  <h1
                    className={`${
                      data.format === "vertical"
                        ? "text-6xl"
                        : data.format === "horizontal"
                          ? "text-8xl"
                          : "text-7xl"
                    } font-semibold`}
                    style={{
                      fontFamily:
                        data.titleFontFamily
                          ? data.titleFontFamily
                          : (data.fontFamily === "mixed" && data.title?.toLowerCase().includes("love."))
                            ? "Dancing Script, cursive"
                            : (data.fontFamily === "mixed" && data.title?.toLowerCase().includes("mush room"))
                              ? "Pacifico, cursive"
                              : (data.fontFamily === "mixed" && data.title?.toLowerCase().includes("street"))
                                ? "Brush Script MT, cursive"
                                : data.fontFamily === "sans-serif"
                                  ? "Helvetica, Arial, sans-serif"
                                  : data.fontFamily === "serif"
                                    ? "Times New Roman, serif"
                                    : "Arial Black, sans-serif",
                      color: data.textColor || "#FFFFFF",
                      fontWeight: data.fontWeight || "600",
                    }}
                  >
                    {data.title || "Adorable."}
                  </h1>
                  <div className="mt-8" style={{ lineHeight: 1.4 }}>
                    {data.subtitle && (
                      <p
                        className={`${
                          data.format === "vertical"
                            ? "text-sm"
                            : data.format === "horizontal"
                              ? "text-base"
                              : "text-base"
                        } uppercase tracking-[0.25em]`}
                        style={{
                          fontFamily:
                            data.subtitleFontFamily
                              ? data.subtitleFontFamily
                              : (data.fontFamily === "mixed"
                                  ? "Helvetica, Arial, sans-serif"
                                  : data.fontFamily === "serif"
                                    ? "Times New Roman, serif"
                                    : "Helvetica, Arial, sans-serif"),
                          color: data.textColor || "#FFFFFF",
                          fontWeight: "500",
                        }}
                      >
                        {data.subtitle || "FASHION & BEAUTY."}
                      </p>
                    )}
                    {data.subtext && (
                      <p
                        className={`${
                          data.format === "vertical" ? "text-[10px]" : "text-xs"
                        } uppercase tracking-[0.15em] mt-2`}
                        style={{
                          fontFamily:
                            data.subtitleFontFamily
                              ? data.subtitleFontFamily
                              : (data.fontFamily === "mixed"
                                  ? "Helvetica, Arial, sans-serif"
                                  : data.fontFamily === "serif"
                                    ? "Times New Roman, serif"
                                    : "Helvetica, Arial, sans-serif"),
                          color: data.textColor || "#FFFFFF",
                        }}
                      >
                        {data.subtext}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )

      case "poster":
      case "sale":
        return (
          <div className="relative w-full h-full">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${data.imageUrl})`,
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to right, ${currentColorScheme.from}CC, ${currentColorScheme.to}CC)`,
              }}
            />
            <div className="relative z-10 h-full flex items-center justify-center p-4">
              <div
                className="text-center p-3 rounded"
                style={{
                  backgroundColor: data.backgroundColor || "#F5F5DC",
                  color: data.textColor || "#000000",
                  boxShadow: data.shadow ? "0 4px 12px rgba(0,0,0,0.2)" : "none",
                  borderRadius: `${data.borderRadius || 8}px`,
                }}
              >
                {data.title && (
                  <h1
                    className="text-lg font-bold mb-1"
                    style={{ fontFamily: "Dancing Script, cursive" }}
                  >
                    {data.title}
                  </h1>
                )}
                {data.subtitle && (
                  <h2
                    className="text-xl font-black mb-2"
                    style={{
                      WebkitTextStroke: "1px white",
                      WebkitTextFillColor: "transparent",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {data.subtitle}
                  </h2>
                )}
                {data.subtext && <p className="text-sm font-bold mb-2">{data.subtext}</p>}
                {data.cta && (
                  <button className="px-3 py-1 bg-white text-black border border-black rounded text-xs font-bold">
                    {data.cta}
                  </button>
                )}
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div
            className={`grid ${
              data.format === "vertical"
                ? "grid-cols-1 gap-3"
                : data.format === "horizontal"
                  ? "grid-cols-3 gap-6"
                  : "grid-cols-2 gap-4"
            } items-center`}
          >
            <div className="flex justify-center">
              <div
                className={`${
                  data.format === "vertical"
                    ? "w-16 h-16"
                    : data.format === "horizontal"
                      ? "w-24 h-24"
                      : "w-20 h-20"
                } rounded-full overflow-hidden bg-white/20 backdrop-blur-sm flex-shrink-0`}
              >
                <Image
                  src={data.imageUrl || "/placeholder.svg?height=96&width=96"}
                  alt="Profile Photo"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
            </div>
            <div className={`${data.format === "horizontal" ? "col-span-2" : ""} space-y-2`}>
              <div className="space-y-1">
                <h1
                  className={`${
                    data.format === "vertical"
                      ? "text-sm"
                      : data.format === "horizontal"
                        ? "text-xl"
                        : "text-lg"
                  } font-light tracking-[0.2em] text-gray-800 leading-tight`}
                >
                  {data.name || data.title || "Classic Design"}
                </h1>
                <p
                  className={`${
                    data.format === "horizontal" ? "text-sm" : "text-xs"
                  } tracking-[0.1em] text-gray-600 font-light`}
                >
                  {data.profession || data.subtitle || "Professional"}
                </p>
              </div>
              <div
                className={`w-px ${
                  data.format === "vertical"
                    ? "h-4"
                    : data.format === "horizontal"
                      ? "h-8"
                      : "h-6"
                } bg-gray-400 mx-auto`}
              ></div>
              <blockquote
                className={`${
                  data.format === "horizontal" ? "text-sm" : "text-xs"
                } text-gray-600 font-light tracking-wide leading-relaxed`}
              >
                {(data.quote || data.subtext || "Timeless elegance and style").split("\n").map((line, index) => (
                  <span key={index}>
                    "{line}"
                    {index < (data.quote || data.subtext || "").split("\n").length - 1 && <br />}
                  </span>
                ))}
              </blockquote>
            </div>
          </div>
        )
    }
  }

  return (
    <div
      className={`relative rounded-lg overflow-hidden ${getContainerClass()} ${className}`}
      style={{
        background:
          data.layout === "logo"
            ? data.backgroundColor || currentColorScheme.from || "#FF1493"
            : `linear-gradient(to right, ${currentColorScheme.from}, ${currentColorScheme.to})`,
      }}
    >
      <div className="p-4 h-full flex items-center justify-center">{renderLayout()}</div>
    </div>
  )
}