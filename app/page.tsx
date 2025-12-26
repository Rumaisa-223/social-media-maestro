'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { useEffect, useRef, useState } from "react"

export default function HomePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [particles, setParticles] = useState<Array<{ left: string; animationDelay: string; animationDuration: string }>>([])
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    // Generate particles only on client side to avoid hydration mismatch
    setParticles(
      Array.from({ length: 20 }).map(() => ({
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 20}s`,
        animationDuration: `${15 + Math.random() * 10}s`,
      }))
    )
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div 
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, hsl(var(--primary)) 0%, transparent 50%)`,
          transition: 'background 0.3s ease-out'
        }}
      />

      {/* Floating Particles */}
      {particles.map((particle, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: particle.left,
            animationDelay: particle.animationDelay,
            animationDuration: particle.animationDuration,
          }}
        />
      ))}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-sm z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <Logo size="sm" showText animated className="group-hover:scale-105 transition-transform duration-300" />
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/auth/login" className="text-slate-600 hover:text-blue-600 transition-colors font-medium relative group">
                Sign in
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300" />
              </Link>
              <Link href="/auth/signup">
                <Button className="rounded-full get-started-button relative bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 border-0">
                  <span className="relative z-10">Get Started</span>
                  <span className="sparkle" />
                  <span className="sparkle" />
                  <span className="sparkle" />
                  <span className="sparkle" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="w-full pt-32 pb-20 md:py-40 relative overflow-hidden"
        data-barba="container"
      >
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-cyan-900/70 to-teal-900/80"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/40 via-cyan-600/30 to-transparent"></div>
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <div className="mb-6 animate-float" style={{ animationDelay: '0.2s' }}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight drop-shadow-lg">
                Master Your Socials
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-white/95 mb-8 max-w-2xl mx-auto animate-slide-up leading-relaxed drop-shadow-md" style={{ animationDelay: '0.4s' }}>
              Effortlessly manage, schedule, and analyze your social media presence with our intelligent platform. Save
              time, boost engagement, and grow exponentially.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-scale-in" style={{ animationDelay: '0.6s' }}>
              <Link href="/auth/signup">
                <Button size="lg" className="rounded-full px-8 animated-button bg-white text-blue-700 hover:bg-blue-50 border-0 shadow-lg hover:shadow-xl transition-all">
                  <span className="relative z-10">Join Free Today</span>
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="rounded-full px-8 bg-transparent border-2 border-white/80 text-white hover:bg-white/20 backdrop-blur-sm animated-button">
                Watch Demo
              </Button>
            </div>
          </div>

        </div>
      </section>

      {/* Features Preview */}
      <section className="py-20 bg-white/60 backdrop-blur-sm border-y border-blue-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <span className="inline-block px-4 py-2 bg-cyan-100 rounded-full text-sm font-semibold text-cyan-700 mb-4">
              Features
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Everything you need to manage your social media presence in one place.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div
              className="p-6 rounded-2xl bg-white border border-blue-100 shadow-lg hover:shadow-2xl card-hover-effect group relative overflow-hidden"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">Schedule Posts</h3>
                <p className="text-slate-600 leading-relaxed">Plan your content calendar across all platforms seamlessly.</p>
              </div>
            </div>
            <div
              className="p-6 rounded-2xl bg-white border border-cyan-100 shadow-lg hover:shadow-2xl card-hover-effect group relative overflow-hidden"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-cyan-600 transition-colors">Real-time Analytics</h3>
                <p className="text-slate-600 leading-relaxed">Track performance with powerful insights and metrics.</p>
              </div>
            </div>
            <div
              className="p-6 rounded-2xl bg-white border border-teal-100 shadow-lg hover:shadow-2xl card-hover-effect group relative overflow-hidden"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-teal-600 transition-colors">AI-Powered Growth</h3>
                <p className="text-slate-600 leading-relaxed">Get intelligent suggestions to maximize your reach.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 relative overflow-hidden bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6bTAgMTJjMC0yLjIwOS0xLjc5MS00LTQtNHMtNCAxLjc5MS00IDQgMS43OTEgNCA0IDQgNC0xLjc5MSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10" />
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="max-w-3xl mx-auto animate-scale-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Strategy?
            </h2>
            <p className="text-xl mb-10 max-w-2xl mx-auto opacity-95 leading-relaxed animate-slide-up">
              Join thousands of creators and brands growing their presence with Social Maestro.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/auth/signup">
                <Button size="lg" className="rounded-full px-8 animated-button bg-white text-blue-600 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all border-0">
                  <span className="relative z-10">Start Your Free Trial</span>
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="rounded-full px-8 border-2 border-white text-white hover:bg-white/20 backdrop-blur-sm animated-button">
                Schedule a Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white pt-16 pb-8 relative">
        <div className="container mx-auto px-6 relative z-10">
          <div className="border-t border-slate-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <Link href="/" className="inline-block">
                  <Logo size="md" showText animated className="text-white" />
                </Link>
                <p className="text-slate-400 mt-2">&copy; 2025 Social Media Maestro. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}