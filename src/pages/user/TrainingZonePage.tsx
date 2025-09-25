import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { WODCard } from '../../components/user/WODCard'
import { BLOCKCard } from '../../components/user/BLOCKCard'
import { ProgramCard } from '../../components/user/ProgramCard'
import { Dumbbell, Package, GraduationCap, Filter } from 'lucide-react'
import { toast } from 'sonner'

export interface Program {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  price: number | null
  program_type: string
  status: string
  client_id: string
  created_at: string
  difficulty_level?: string | null
  estimated_duration_hours?: number | null
  category?: string | null
}

interface WOD {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  status: 'draft' | 'published' | 'archived'
  estimated_duration_minutes: number | null
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null
  tags: string[]
  created_at: string
  updated_at: string
}

interface WorkoutBlock {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  status: 'draft' | 'published' | 'archived'
  estimated_duration_minutes: number | null
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null
  tags: string[]
  block_category: 'warm-up' | 'cardio' | 'strength' | 'flexibility' | 'cool-down' | 'general' | null
  equipment_needed: string[]
  instructions: string | null
  created_at: string
  updated_at: string
}

type ContentFilter = 'all' | 'programs' | 'wods' | 'blocks'

export function TrainingZonePage() {
  const { user } = useAuth()
  const [programs, setPrograms] = useState<Program[]>([])
  const [wods, setWods] = useState<WOD[]>([])
  const [blocks, setBlocks] = useState<WorkoutBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [communityId, setCommunityId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<ContentFilter>('all')

  // Get user's community ID
  useEffect(() => {
    async function getUserCommunity() {
      if (!user) return
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('community_id')
          .eq('id', user.id)
          .maybeSingle()
        
        if (error) {
          console.error('Error fetching user community:', error)
          return
        }
        
        if (data) {
          setCommunityId(data.community_id)
        }
      } catch (error) {
        console.error('Error:', error)
      }
    }
    
    getUserCommunity()
  }, [user])

  // Load all content
  useEffect(() => {
    if (communityId) {
      loadAllContent()
    }
  }, [communityId])

  const loadAllContent = async () => {
    if (!communityId) return
    
    setLoading(true)
    try {
      // Load programs (existing functionality)
      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select('*')
        .eq('client_id', communityId) // Assuming client_id maps to community_id
        .eq('status', 'published')
        .order('created_at', { ascending: false })
      
      if (programsError) {
        console.error('Error loading programs:', programsError)
      } else {
        setPrograms(programsData || [])
      }

      // Load WODs
      const { data: wodsData, error: wodsError } = await supabase
        .from('wods')
        .select('*')
        .eq('status', 'published')
        .order('updated_at', { ascending: false })
        .limit(12)
      
      if (wodsError) {
        console.error('Error loading WODs:', wodsError)
      } else {
        setWods(wodsData || [])
      }

      // Load Blocks
      const { data: blocksData, error: blocksError } = await supabase
        .from('workout_blocks')
        .select('*')
        .eq('status', 'published')
        .order('updated_at', { ascending: false })
        .limit(12)
      
      if (blocksError) {
        console.error('Error loading blocks:', blocksError)
      } else {
        setBlocks(blocksData || [])
      }
    } catch (error) {
      console.error('Error loading content:', error)
      toast.error('Failed to load training content')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading training content...</span>
      </div>
    )
  }

  const totalItems = programs.length + wods.length + blocks.length

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Training Zone</h1>
        <p className="text-gray-600">Access WODs, workout blocks, and comprehensive training programs</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeFilter === 'all'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Content ({totalItems})
            </button>
            <button
              onClick={() => setActiveFilter('programs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                activeFilter === 'programs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              <span>Programs ({programs.length})</span>
            </button>
            <button
              onClick={() => setActiveFilter('wods')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                activeFilter === 'wods'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Dumbbell className="h-4 w-4" />
              <span>WODs ({wods.length})</span>
            </button>
            <button
              onClick={() => setActiveFilter('blocks')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                activeFilter === 'blocks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Blocks ({blocks.length})</span>
            </button>
          </nav>
        </div>
      </div>

      {totalItems === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No content available</h3>
          <p className="text-gray-500">Check back later for new training content.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Programs Section */}
          {(activeFilter === 'all' || activeFilter === 'programs') && programs.length > 0 && (
            <section>
              {activeFilter === 'all' && (
                <div className="flex items-center space-x-3 mb-6">
                  <GraduationCap className="h-6 w-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Training Programs</h2>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">{programs.length}</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {programs.map((program) => (
                  <ProgramCard key={program.id} program={program} />
                ))}
              </div>
            </section>
          )}

          {/* WODs Section */}
          {(activeFilter === 'all' || activeFilter === 'wods') && wods.length > 0 && (
            <section>
              {activeFilter === 'all' && (
                <div className="flex items-center space-x-3 mb-6">
                  <Dumbbell className="h-6 w-6 text-orange-600" />
                  <h2 className="text-2xl font-bold text-gray-900">WODs (Workouts of the Day)</h2>
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">{wods.length}</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wods.map((wod) => (
                  <WODCard key={wod.id} wod={wod} />
                ))}
              </div>
            </section>
          )}

          {/* Blocks Section */}
          {(activeFilter === 'all' || activeFilter === 'blocks') && blocks.length > 0 && (
            <section>
              {activeFilter === 'all' && (
                <div className="flex items-center space-x-3 mb-6">
                  <Package className="h-6 w-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Workout Blocks</h2>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">{blocks.length}</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blocks.map((block) => (
                  <BLOCKCard key={block.id} block={block} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}