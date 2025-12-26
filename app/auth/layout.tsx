'use client'

import { BarbaProvider } from '@/components/barba-provider'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <BarbaProvider>
      <div className="barba-wrapper" data-barba="wrapper">
        <div className="barba-container" data-barba="container">
          {children}
        </div>
      </div>
    </BarbaProvider>
  )
}

