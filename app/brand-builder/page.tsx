import Image from "next/image"

export default function BrandBuilderPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#e0f2d8]">
      <div className="relative w-full aspect-[4/5] sm:aspect-auto sm:flex-1 overflow-hidden">
        <Image src="/hero-bg.jpg" alt="Vintasia Delights Can" fill className="object-cover object-top" priority />
      </div>
      <div className="bg-[#e0f2d8] p-8 md:p-12 flex flex-col items-center justify-between">
        <h1 className="font-bebas text-7xl md:text-9xl lg:text-[12rem] text-black leading-none tracking-tight text-center uppercase">Brand Builder</h1>
        <div className="w-full mt-12 md:mt-24 flex flex-col md:flex-row items-center justify-between gap-8 px-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="font-script text-4xl md:text-5xl text-black">Kittl</span>
            <div className="flex flex-col">
              <span className="text-xs tracking-[0.3em] font-medium border-b border-black pb-0.5">FLOWS</span>
              <div className="h-1 flex items-center">
                <div className="w-full h-[1px] bg-black relative">
                  <div className="absolute right-0 -top-[2px] w-1 h-1 rounded-full bg-black" />
                </div>
              </div>
            </div>
          </div>
          <div className="text-black text-lg md:text-xl font-medium">Nano Banana Pro</div>
        </div>
      </div>
    </main>
  )
}