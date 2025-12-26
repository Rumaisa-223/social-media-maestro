'use client'

import { useEffect, useRef } from 'react'

export function BarbaProvider({ children }: { children: React.ReactNode }) {
  const initializedRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined' || initializedRef.current) return

    ;(async () => {
      const barba = (await import('@barba/core')).default
      barba.init({
        transitions: [
          {
            name: 'fade-transition',
            once() {
              // Initial page load - fade in
              const container = document.querySelector('[data-barba="container"]') as HTMLElement
              if (container) {
                container.style.opacity = '0'
                container.style.transition = 'opacity 0.4s ease-in'
                requestAnimationFrame(() => {
                  container.style.opacity = '1'
                })
              }
            },
            leave(data: any) {
              // Fade out current page
              return new Promise<void>((resolve) => {
                const container = data.current.container as HTMLElement
                if (container) {
                  container.style.transition = 'opacity 0.3s ease-out'
                  container.style.opacity = '0'
                  setTimeout(resolve, 300)
                } else {
                  resolve()
                }
              })
            },
            enter(data: any) {
              // Fade in next page
              const container = data.next.container as HTMLElement
              if (container) {
                container.style.opacity = '0'
                container.style.transition = 'opacity 0.4s ease-in'
                
                // Trigger reflow
                void container.offsetWidth
                
                requestAnimationFrame(() => {
                  container.style.opacity = '1'
                })
              }
              
              // Scroll to top
              window.scrollTo({ top: 0, behavior: 'smooth' })
            },
          },
        ],
        prevent: ({ el }: { el?: { href?: string } | HTMLAnchorElement }) => {
          // Only handle internal links within auth namespace
          if (el?.href && typeof window !== 'undefined') {
            try {
              const url = new URL(el.href, window.location.href)
              const currentUrl = new URL(window.location.href)
              
              // Only use Barba for auth routes
              const isAuthRoute = url.pathname.startsWith('/auth/')
              const isCurrentAuthRoute = currentUrl.pathname.startsWith('/auth/')
              
              return !(isAuthRoute && isCurrentAuthRoute)
            } catch {
              return false
            }
          }
          return false
        },
        requestError: (trigger: any, action: any, url: string) => {
          // Fallback to normal navigation on error
          window.location.href = url
        },
      })
      initializedRef.current = true
    })()
  }, [])

  return <>{children}</>
}

