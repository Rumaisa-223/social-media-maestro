'use client'

import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showText?: boolean
  animated?: boolean
  variant?:
    | 'maestro'
    | 'creative-minds'
    | 'creative-minds-minimal'
    | 'creative-minds-bold'
    | 'creative-minds-luxury'
}

export function Logo({ size = 'md', className, showText = false, animated = true, variant = 'maestro' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
    xl: 'w-24 h-24 text-5xl',
  }

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl',
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {variant === 'maestro' ? (
        <div
          className={cn(
            'relative logo-3d flex items-center justify-center rounded-xl overflow-hidden',
            sizeClasses[size],
            animated && 'logo-animated'
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 opacity-90" />
          {animated && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-500 opacity-50 animate-pulse" />
          )}
          {animated && (
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent animate-shimmer" />
          )}
          <div className="absolute inset-0 logo-glow rounded-xl blur-xl opacity-60" />
          <span className="relative z-10 font-black text-white tracking-tighter drop-shadow-2xl logo-text">SM</span>
          {animated && (
            <>
              <div className="absolute top-1 left-1 w-1 h-1 bg-white rounded-full animate-sparkle opacity-80" style={{ animationDelay: '0s' }} />
              <div className="absolute top-2 right-2 w-1 h-1 bg-cyan-300 rounded-full animate-sparkle opacity-80" style={{ animationDelay: '0.5s' }} />
              <div className="absolute bottom-2 left-2 w-1 h-1 bg-blue-300 rounded-full animate-sparkle opacity-80" style={{ animationDelay: '1s' }} />
            </>
          )}
        </div>
      ) : variant === 'creative-minds' ? (
        <div
          className={cn('relative flex items-center justify-center rounded-full overflow-hidden', sizeClasses[size])}
          style={{ backgroundColor: '#f5a3b7' }}
        >
          <div className="flex flex-col items-center justify-center px-2">
            <div className="text-black font-semibold italic tracking-tight" style={{ fontFamily: 'cursive' }}>
              creative
            </div>
            <div className="text-black font-extrabold leading-none -mt-1">
              MINDS
            </div>
            <div className="text-gray-800 text-[10px] tracking-widest mt-1">
              DESIGN AGENCY
            </div>
          </div>
        </div>
      ) : variant === 'creative-minds-minimal' ? (
        <div
          className={cn('relative flex items-center justify-center rounded-xl overflow-hidden border', sizeClasses[size])}
          style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}
        >
          <div className="flex flex-col items-center justify-center px-2">
            <div className="text-black font-medium tracking-tight" style={{ letterSpacing: '-0.02em' }}>
              creative
            </div>
            <div className="text-black font-semibold leading-none -mt-0.5" style={{ letterSpacing: '-0.01em' }}>
              MINDS
            </div>
            <div className="text-gray-600 text-[10px] tracking-[0.25em] mt-1">
              DESIGN AGENCY
            </div>
          </div>
        </div>
      ) : variant === 'creative-minds-bold' ? (
        <div
          className={cn('relative flex items-center justify-center rounded-full overflow-hidden', sizeClasses[size])}
          style={{ backgroundColor: '#f59ab2' }}
        >
          <div className="flex flex-col items-center justify-center px-2">
            <div className="text-black font-semibold italic" style={{ fontFamily: 'cursive', letterSpacing: '-0.02em' }}>
              creative
            </div>
            <div className="text-black font-black leading-none -mt-1">
              MINDS
            </div>
            <div className="text-black text-[10px] tracking-[0.28em] mt-1">
              DESIGN AGENCY
            </div>
          </div>
        </div>
      ) : (
        <div
          className={cn('relative flex items-center justify-center rounded-full overflow-hidden', sizeClasses[size])}
          style={{ backgroundColor: '#0b0b0b', border: '2px solid #D4AF37' }}
        >
          <div className="flex flex-col items-center justify-center px-2">
            <div className="font-serif italic" style={{ color: '#D4AF37', letterSpacing: '-0.01em' }}>
              creative
            </div>
            <div className="font-extrabold leading-none -mt-1" style={{ color: '#D4AF37' }}>
              MINDS
            </div>
            <div className="text-[10px] tracking-[0.3em] mt-1" style={{ color: '#D4AF37' }}>
              DESIGN AGENCY
            </div>
          </div>
        </div>
      )}

      {showText && (
        <span
          className={cn(
            variant === 'maestro'
              ? 'font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent'
              : 'font-semibold text-gray-900',
            textSizeClasses[size]
          )}
        >
          {variant === 'maestro' ? 'Social Media Maestro' : 'Creative Minds'}
        </span>
      )}
    </div>
  )
}

