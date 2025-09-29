import React, { useState, useEffect } from 'react'
import { X, Plus, Check, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface Community {
  id: string;
  name: string;
  brand_color: string;
  logo_url?: string;
}

interface ProgramCommunity {
  community_id: string;
  community_name: string;
  assigned_at: string;
  brand_color: string;
  logo_url?: string;
}

interface Program {
  id: string;
  title: string;
  description?: string;
  status: string;
  communities?: ProgramCommunity[];
}

interface ProgramCommunityAssignmentPanelProps {
  program: Program | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProgramCommunityAssignmentPanel: React.FC<ProgramCommunityAssignmentPanelProps> = ({
  program,
  isOpen,
  onClose
}) => {
  const [assignableCommunities, setAssignableCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)

  useEffect(() => {
    if (isOpen && program) {
      setSelectedProgram(program)
      loadAvailableCommunities()
    }
  }, [isOpen, program])

  const loadAvailableCommunities = async () => {
    setLoading(true)
    try {
      const { data: allCommunities, error } = await supabase
        .from('communities')
        .select('id, name, brand_color, logo_url')
        .eq('status', 'active')
        .order('name')
        .limit(20)
      
      if (error) {
        console.error('Error loading communities:', error)
      } else {
        setAssignableCommunities(allCommunities || [])
      }
    } catch (error) {
      console.error('Error loading communities:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignToCommunity = async (communityId: string, communityName: string) => {
    if (!selectedProgram) return
    
    try {
      const { data, error } = await supabase.functions.invoke('program-community-manager', {
        body: {
          action: 'assign_program_to_community',
          program_id: selectedProgram.id,
          community_id: communityId
        }
      })

      if (error) throw error
      
      if (data?.data?.success) {
        await refreshSelectedProgramCommunities()
      }
    } catch (error) {
      console.error('Error assigning program to community:', error)
      alert(`Failed to assign program to ${communityName}. Please try again.`)
    }
  }

  const handleRemoveFromCommunity = async (communityId: string, communityName: string) => {
    if (!selectedProgram) return
    
    const programTitle = selectedProgram.title
    if (!confirm(`Are you sure you want to remove "${programTitle}" from ${communityName}?`)) {
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('program-community-manager', {
        body: {
          action: 'remove_program_from_community',
          program_id: selectedProgram.id,
          community_id: communityId
        }
      })

      if (error) throw error
      
      if (data?.data?.success) {
        await refreshSelectedProgramCommunities()
      }
    } catch (error) {
      console.error('Error removing program from community:', error)
      alert(`Failed to remove program from ${communityName}. Please try again.`)
    }
  }

  const refreshSelectedProgramCommunities = async () => {
    if (!selectedProgram) return
    
    try {
      const { data, error } = await supabase.functions.invoke('program-community-manager', {
        body: {
          action: 'get_program_communities',
          program_id: selectedProgram.id
        }
      })
      
      if (error) {
        console.error('Error refreshing program communities:', error)
        return
      }
      
      const communities = data?.data?.communities?.map((community: any) => ({
        community_id: community.community_id,
        community_name: community.community_name,
        assigned_at: community.assigned_at,
        brand_color: community.brand_color || '#6B7280',
        logo_url: community.logo_url
      })) || []
      
      setSelectedProgram(prev => prev ? { ...prev, communities } : null)
    } catch (error) {
      console.error('Error refreshing program communities:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!isOpen || !selectedProgram) return null

  return (
    <div className="fixed top-0 right-0 w-96 h-full bg-white shadow-xl border-l border-gray-200 z-40 overflow-y-auto">
      {/* Panel Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {selectedProgram.title.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Community Assignments</h2>
              <p className="text-sm text-gray-600">{selectedProgram.title}</p>
              <p className="text-xs text-gray-500">Status: {selectedProgram.status}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Panel Content */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <LoadingSpinner size="md" />
            <p className="mt-2 text-gray-600">Loading communities...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Assignments */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Current Assignments</h3>
              {selectedProgram.communities && selectedProgram.communities.length > 0 ? (
                <div className="space-y-2">
                  {selectedProgram.communities.map((assignment) => (
                    <div key={assignment.community_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {assignment.logo_url ? (
                          <img
                            src={assignment.logo_url}
                            alt={assignment.community_name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                            style={{ backgroundColor: assignment.brand_color }}
                          >
                            {assignment.community_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{assignment.community_name}</div>
                          <div className="text-xs text-gray-500">
                            Assigned {formatDate(assignment.assigned_at)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFromCommunity(assignment.community_id, assignment.community_name)}
                        className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                        title="Remove from community"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <Users size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No community assignments yet</p>
                </div>
              )}
            </div>

            {/* Add Communities */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Add to Communities</h3>
              <div className="space-y-2">
                {assignableCommunities.length > 0 ? (
                  assignableCommunities.map((community) => {
                    const isAssigned = selectedProgram.communities?.some(c => c.community_id === community.id) || false
                    
                    return (
                      <div key={community.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          {community.logo_url ? (
                            <img
                              src={community.logo_url}
                              alt={community.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                              style={{ backgroundColor: community.brand_color }}
                            >
                              {community.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-medium text-gray-900">{community.name}</span>
                            {isAssigned && (
                              <div className="flex items-center space-x-1 text-xs text-green-600">
                                <Check size={12} />
                                <span>Already assigned</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleAssignToCommunity(community.id, community.name)}
                          disabled={isAssigned}
                          className={`p-1 rounded transition-colors ${
                            isAssigned 
                              ? 'text-green-600 cursor-default' 
                              : 'text-blue-600 hover:text-blue-800'
                          }`}
                          title={isAssigned ? 'Already assigned' : 'Add to community'}
                        >
                          {isAssigned ? <Check size={16} /> : <Plus size={16} />}
                        </button>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <Users size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">No communities available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProgramCommunityAssignmentPanel