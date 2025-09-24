import React from 'react'
import { ModernHeader } from './ModernHeader'

interface ModernLayoutProps {
  children: React.ReactNode
}

export function ModernLayout({ children }: ModernLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <ModernHeader />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}