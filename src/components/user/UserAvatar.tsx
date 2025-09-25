import React from 'react'
import { User } from '@supabase/supabase-js'

interface UserAvatarProps {
  user: User | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function UserAvatar({ user, size = 'md', className = '' }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  }
  
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  // Get initials from email or use default
  const getInitials = (email: string | undefined) => {
    if (!email) return 'U'
    return email.charAt(0).toUpperCase()
  }

  return (
    <div className={`${sizeClasses[size]} bg-blue-600 rounded-full flex items-center justify-center ${className}`}>
      <span className={`font-bold text-white ${textSizeClasses[size]}`}>
        {getInitials(user?.email)}
      </span>
    </div>
  )
}