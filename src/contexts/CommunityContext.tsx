import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './BulletproofAuthContext'

interface Community {
  id: string
  name: string
  brand_color: string
  logo_url?: string
}

interface UserCommunity extends Community {
  role: string
  joined_at: string
}

interface CommunityContextType {
  currentCommunity: Community | null
  userCommunities: UserCommunity[]
  loading: boolean
  switchCommunity: (communityId: string) => void
  refreshCommunities: () => Promise<void>
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined)

export function useCommunity() {
  const context = useContext(CommunityContext)
  if (context === undefined) {
    throw new Error('useCommunity must be used within a CommunityProvider')
  }
  return context
}

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [currentCommunity, setCurrentCommunity] = useState<Community | null>(null)
  const [userCommunities, setUserCommunities] = useState<UserCommunity[]>([])
  const [loading, setLoading] = useState(false)

  // Load user's communities
  const loadUserCommunities = useCallback(async () => {
    if (!user?.id) {
      setUserCommunities([])
      setCurrentCommunity(null)
      return
    }

    setLoading(true)
    try {
      const { data: userCommunitiesData, error } = await supabase
        .from('user_communities')
        .select(`
          community_id,
          role,
          joined_at,
          communities (
            id,
            name,
            brand_color,
            logo_url
          )
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false })

      if (error) {
        console.error('Error loading user communities:', error)
        return
      }

      const communities = userCommunitiesData?.map(uc => {
        const community = Array.isArray(uc.communities) ? uc.communities[0] : uc.communities
        return {
          id: community?.id || '',
          name: community?.name || 'Unknown Community',
          brand_color: community?.brand_color || '#6B7280',
          logo_url: community?.logo_url,
          role: uc.role,
          joined_at: uc.joined_at
        }
      }) || []

      setUserCommunities(communities)

      // Set current community if not already set
      if (!currentCommunity && communities.length > 0) {
        // Get saved community from localStorage or use first community
        const savedCommunityId = localStorage.getItem(`currentCommunity_${user.id}`)
        const savedCommunity = communities.find(c => c.id === savedCommunityId)
        
        setCurrentCommunity(savedCommunity || communities[0])
      }
    } catch (error) {
      console.error('Error loading user communities:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id, currentCommunity])

  // Switch to a different community
  const switchCommunity = useCallback((communityId: string) => {
    const community = userCommunities.find(c => c.id === communityId)
    if (community && user?.id) {
      setCurrentCommunity(community)
      localStorage.setItem(`currentCommunity_${user.id}`, communityId)
    }
  }, [userCommunities, user?.id])

  // Refresh communities data
  const refreshCommunities = useCallback(async () => {
    await loadUserCommunities()
  }, [loadUserCommunities])

  // Load communities when user changes
  useEffect(() => {
    if (user) {
      loadUserCommunities()
    } else {
      setUserCommunities([])
      setCurrentCommunity(null)
    }
  }, [user, loadUserCommunities])

  const contextValue = {
    currentCommunity,
    userCommunities,
    loading,
    switchCommunity,
    refreshCommunities
  }

  return (
    <CommunityContext.Provider value={contextValue}>
      {children}
    </CommunityContext.Provider>
  )
}
