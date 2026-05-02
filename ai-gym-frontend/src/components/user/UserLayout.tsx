import React from 'react'
import { UserHeader } from './UserHeader'
import { UserTabs } from './UserTabs'

interface UserLayoutProps {
  children: React.ReactNode
}

export function UserLayout({ children }: UserLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <UserHeader />
      <UserTabs />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}