import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase, ContentItem, Client, UserTag, User } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Layout } from '@/components/layout/Layout'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { 
  ChevronRight, 
  ChevronDown, 
  Save, 
  Trash2, 
  ArrowLeft, 
  Users, 
  Tag as TagIcon, 
  Settings,
  Eye,
  EyeOff,
  X
} from 'lucide-react'
import { useAuth } from '@/contexts/BulletproofAuthContext'

interface ContentEditorProps {
  contentType: string
  isEdit?: boolean
  children: React.ReactNode
  onSaveContent?: (contentItemId: string) => Promise<void>
  title: string
  description: string
  color: string
  icon: React.ComponentType<any>
}

interface AssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  client: Client
  contentItemId: string
  onSave: () => void
}

function AssignmentModal({ isOpen, onClose, client, contentItemId, onSave }: AssignmentModalProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [tags, setTags] = useState<UserTag[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchAssignmentData()
    }
  }, [isOpen, client.id])

  const fetchAssignmentData = async () => {
    try {
      setLoading(true)
      
      // Fetch tags for this client
      const { data: tagsData, error: tagsError } = await supabase
        .from('user_tags')
        .select('*')
        .eq('client_id', client.id)
        .order('name')
      
      if (tagsError) {
        console.error('Error fetching tags:', tagsError)
      } else if (tagsData) {
        setTags(tagsData)
      }

      // Fetch users for this client
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('client_id', client.id)
        .order('first_name')
      
      if (usersError) {
        console.error('Error fetching users:', usersError)
      } else if (usersData) {
        setUsers(usersData)
      }

      // Fetch current assignments
      const [tagAssignments, userAssignments] = await Promise.all([
        supabase.from('content_tag_assignments').select('tag_id').eq('content_item_id', contentItemId),
        supabase.from('content_user_assignments').select('user_id').eq('content_item_id', contentItemId)
      ])

      if (tagAssignments.data) {
        setSelectedTags(tagAssignments.data.map(a => a.tag_id))
      }
      if (userAssignments.data) {
        setSelectedUsers(userAssignments.data.map(a => a.user_id))
      }
    } catch (error) {
      console.error('Error fetching assignment data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Delete existing assignments for this client's content
      const deletePromises = []
      
      if (tags.length > 0) {
        deletePromises.push(
          supabase
            .from('content_tag_assignments')
            .delete()
            .eq('content_item_id', contentItemId)
            .in('tag_id', tags.map(t => t.id))
        )
      }
      
      if (users.length > 0) {
        deletePromises.push(
          supabase
            .from('content_user_assignments')
            .delete()
            .eq('content_item_id', contentItemId)
            .in('user_id', users.map(u => u.id))
        )
      }

      await Promise.all(deletePromises)

      // Insert new assignments
      const insertPromises = []
      
      if (selectedTags.length > 0) {
        const tagAssignments = selectedTags.map(tagId => ({
          content_item_id: contentItemId,
          tag_id: tagId,
          assigned_by: user.id
        }))
        insertPromises.push(
          supabase.from('content_tag_assignments').insert(tagAssignments)
        )
      }

      if (selectedUsers.length > 0) {
        const userAssignments = selectedUsers.map(userId => ({
          content_item_id: contentItemId,
          user_id: userId,
          assigned_by: user.id
        }))
        insertPromises.push(
          supabase.from('content_user_assignments').insert(userAssignments)
        )
      }

      await Promise.all(insertPromises)

      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving assignments:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div 
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: client.brand_color + '20' }}
            >
              <div 
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: client.brand_color }}
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Assign to {client.name}</h2>
              <p className="text-sm text-gray-500">Configure content visibility and access</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <LoadingSpinner size="md" />
            <p className="text-sm text-gray-500 mt-2">Loading assignment options...</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {tags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <TagIcon className="h-4 w-4 inline mr-2" />
                  Assign to User Tags ({selectedTags.length} selected)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {tags.map((tag) => (
                    <label key={tag.id} className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded-md">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTags([...selectedTags, tag.id])
                          } else {
                            setSelectedTags(selectedTags.filter(id => id !== tag.id))
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="text-sm text-gray-900">{tag.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Content will be visible to all users with the selected tags
                </p>
              </div>
            )}

            {users.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Users className="h-4 w-4 inline mr-2" />
                  Assign to Specific Users ({selectedUsers.length} selected)
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {users.map((user) => (
                    <label key={user.id} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-50 rounded-md">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id])
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Content will be visible to the specifically selected users
                </p>
              </div>
            )}

            {tags.length === 0 && users.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-900">No assignment options</h3>
                <p className="text-xs text-gray-500 mt-1">
                  This client has no users or tags configured. Set up users and tags first.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (tags.length === 0 && users.length === 0)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {saving ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : null}
            Save Assignments
          </button>
        </div>
      </div>
    </div>
  )
}

export function ContentEditor({ 
  contentType, 
  isEdit = false, 
  children, 
  onSaveContent,
  title,
  description,
  color,
  icon: Icon
}: ContentEditorProps) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { admin } = useAuth()
  
  const [contentItem, setContentItem] = useState<ContentItem | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [assignedClients, setAssignedClients] = useState<string[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeAssignmentModal, setActiveAssignmentModal] = useState<string | null>(null)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Basic form state
  const [itemTitle, setItemTitle] = useState('')
  const [itemDescription, setItemDescription] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  
  // Track initial values to detect changes
  const initialValuesRef = useRef<{
    title: string;
    description: string;
    status: 'draft' | 'published';
    thumbnailUrl: string;
    assignedClients: string[];
  } | null>(null)

  // Memoized function to detect changes
  const detectChanges = useCallback(() => {
    if (!initialValuesRef.current) return false;
    
    const initial = initialValuesRef.current;
    return (
      itemTitle !== initial.title ||
      itemDescription !== initial.description ||
      status !== initial.status ||
      thumbnailUrl !== initial.thumbnailUrl ||
      JSON.stringify(assignedClients.slice().sort()) !== JSON.stringify(initial.assignedClients.slice().sort())
    );
  }, [itemTitle, itemDescription, status, thumbnailUrl, assignedClients]);

  // Update hasChanges when form values change (with debouncing to prevent infinite loops)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const newHasChanges = detectChanges();
      if (newHasChanges !== hasChanges) {
        setHasChanges(newHasChanges);
      }
    }, 50); // 50ms debounce

    return () => clearTimeout(timeoutId);
  }, [itemTitle, itemDescription, status, thumbnailUrl, assignedClients, hasChanges, detectChanges]);

  useEffect(() => {
    let isMounted = true;
    
    const initializeComponent = async () => {
      try {
        setError(null);
        
        if (isEdit && id) {
          await fetchContentItem();
        }
        
        if (isMounted) {
          await fetchClients();
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error initializing ContentEditor:', err);
          setError(err instanceof Error ? err.message : 'Failed to load content');
        }
      }
    };

    initializeComponent();
    
    return () => {
      isMounted = false;
    };
  }, [isEdit, id])

  const fetchContentItem = useCallback(async () => {
    if (!id) return;
    
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('content_items')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) {
        console.warn('Content item not found, redirecting to content list');
        navigate('/content', { replace: true });
        return;
      }

      // Set content item data
      setContentItem(data);
      
      // Set form values
      const title = data.title || '';
      const description = data.description || '';
      const itemStatus = data.status || 'draft';
      const thumbnail = data.thumbnail_url || '';
      
      setItemTitle(title);
      setItemDescription(description);
      setStatus(itemStatus as 'draft' | 'published');
      setThumbnailUrl(thumbnail);

      // Fetch assigned clients
      const { data: assignments, error: assignmentsError } = await supabase
        .from('content_client_assignments')
        .select('client_id')
        .eq('content_item_id', data.id);
      
      if (assignmentsError) {
        console.error('Error fetching client assignments:', assignmentsError);
      }
      
      const clientIds = assignments ? assignments.map(a => a.client_id) : [];
      setAssignedClients(clientIds);
      
      // Set initial values for change detection
      initialValuesRef.current = {
        title,
        description,
        status: itemStatus as 'draft' | 'published',
        thumbnailUrl: thumbnail,
        assignedClients: clientIds
      };
      
      setHasChanges(false); // Reset changes flag after loading
      
    } catch (error) {
      console.error('Error fetching content item:', error);
      setError(error instanceof Error ? error.message : 'Failed to load content item');
      
      // Don't navigate away on error - let user retry
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const fetchClients = useCallback(async () => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      
      setClients(data || []);
      
      // Set initial values for new items
      if (!isEdit && !initialValuesRef.current) {
        initialValuesRef.current = {
          title: '',
          description: '',
          status: 'draft',
          thumbnailUrl: '',
          assignedClients: []
        };
      }
      
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError(error instanceof Error ? error.message : 'Failed to load clients');
    }
  }, [isEdit]);

  const getRoutePrefix = useCallback(() => {
    const routeMap: Record<string, string> = {
      'ai_agent': 'ai-agents',
      'video': 'videos', 
      'document': 'documents',
      'image': 'images',
      'pdf': 'pdfs',
      'prompt': 'prompts',
      'automation': 'automations'
    };
    return routeMap[contentType] || contentType;
  }, [contentType]);

  const saveClientAssignments = useCallback(async (contentItemId: string) => {
    if (!admin) {
      throw new Error('Admin authentication required');
    }

    try {
      // Delete existing client assignments
      const { error: deleteError } = await supabase
        .from('content_client_assignments')
        .delete()
        .eq('content_item_id', contentItemId);
        
      if (deleteError) throw deleteError;

      // Insert new client assignments
      if (assignedClients.length > 0) {
        const assignments = assignedClients.map(clientId => ({
          content_item_id: contentItemId,
          client_id: clientId,
          assigned_by: admin.id
        }));
        
        const { error: insertError } = await supabase
          .from('content_client_assignments')
          .insert(assignments);
          
        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error saving client assignments:', error);
      throw new Error('Failed to save client assignments');
    }
  }, [admin, assignedClients]);

  const handleDelete = useCallback(async () => {
    if (!contentItem || !admin) {
      setError('Unable to delete: missing content item or admin authentication');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      // Delete the content item (cascading deletes will handle related records)
      const { error } = await supabase
        .from('content_items')
        .delete()
        .eq('id', contentItem.id);
      
      if (error) throw error;
      
      // Navigate back to content list
      const routePrefix = getRoutePrefix();
      navigate(`/content/${routePrefix}`, { replace: true });
      
    } catch (error) {
      console.error('Error deleting content:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error deleting content. Please try again.';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  }, [contentItem, admin, navigate]);

  const handleSave = useCallback(async () => {
    if (!admin) {
      setError('Admin authentication required');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      let contentItemId = id;
      
      const contentData = {
        title: itemTitle.trim(),
        description: itemDescription.trim() || null,
        content_type: contentType,
        status,
        thumbnail_url: thumbnailUrl.trim() || null,
        created_by: admin.id,
        updated_at: new Date().toISOString()
      };

      if (isEdit && contentItemId) {
        // Update existing content item
        const { error } = await supabase
          .from('content_items')
          .update(contentData)
          .eq('id', contentItemId);
        
        if (error) throw error;
      } else {
        // Create new content item
        const { data, error } = await supabase
          .from('content_items')
          .insert([{ ...contentData, created_at: new Date().toISOString() }])
          .select()
          .single();
        
        if (error) throw error;
        if (data) {
          contentItemId = data.id;
          setContentItem(data);
        }
      }

      // Save content-specific data
      if (onSaveContent && contentItemId) {
        await onSaveContent(contentItemId);
      }

      // Save client assignments
      await saveClientAssignments(contentItemId!);

      // Update initial values for change detection
      initialValuesRef.current = {
        title: itemTitle.trim(),
        description: itemDescription.trim(),
        status,
        thumbnailUrl: thumbnailUrl.trim(),
        assignedClients: [...assignedClients]
      };
      
      setHasChanges(false);
      
      // Navigate to edit mode if this was a create
      if (!isEdit && contentItemId) {
        const routePrefix = getRoutePrefix();
        navigate(`/content/${routePrefix}/${contentItemId}/edit`, { replace: true });
      }
      
    } catch (error) {
      console.error('Error saving content:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error saving content. Please try again.';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  }, [admin, id, itemTitle, itemDescription, contentType, status, thumbnailUrl, onSaveContent, assignedClients, isEdit, navigate]);

  const handleSaveAndReturn = useCallback(async () => {
    if (!admin) {
      setError('Admin authentication required');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      let contentItemId = id;
      
      const contentData = {
        title: itemTitle.trim(),
        description: itemDescription.trim() || null,
        content_type: contentType,
        status,
        thumbnail_url: thumbnailUrl.trim() || null,
        created_by: admin.id,
        updated_at: new Date().toISOString()
      };

      if (isEdit && contentItemId) {
        // Update existing content item
        const { error } = await supabase
          .from('content_items')
          .update(contentData)
          .eq('id', contentItemId);
        
        if (error) throw error;
      } else {
        // Create new content item
        const { data, error } = await supabase
          .from('content_items')
          .insert([{ ...contentData, created_at: new Date().toISOString() }])
          .select()
          .single();
        
        if (error) throw error;
        if (data) {
          contentItemId = data.id;
          setContentItem(data);
        }
      }

      // Save content-specific data
      if (onSaveContent && contentItemId) {
        await onSaveContent(contentItemId);
      }

      // Save client assignments
      await saveClientAssignments(contentItemId!);

      setHasChanges(false);
      
      // Return to repository list
      const routePrefix = getRoutePrefix();
      navigate(`/content/${routePrefix}`, { replace: true });
      
    } catch (error) {
      console.error('Error saving content:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error saving content. Please try again.';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  }, [admin, id, itemTitle, itemDescription, contentType, status, thumbnailUrl, onSaveContent, assignedClients, navigate]);

  const toggleClientAssignment = useCallback((clientId: string) => {
    setAssignedClients(prev => {
      const newAssignments = prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId];
      return newAssignments;
    });
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-500 mt-3">Loading content...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show error state with retry option
  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="text-red-800 mb-4">
                <h3 className="text-lg font-semibold mb-2">Error Loading Content</h3>
                <p className="text-sm">{error}</p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setError(null);
                    if (isEdit && id) {
                      fetchContentItem();
                    }
                    fetchClients();
                  }}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Try Again
                </button>
                <Link
                  to="/content"
                  className="block w-full px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 text-center"
                >
                  Back to Content
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('ContentEditor Error Boundary:', error, errorInfo);
        setError(`Component Error: ${error.message}`);
      }}
    >
      <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <Link 
                  to={`/content/${getRoutePrefix()}`}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <div 
                  className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: color + '20' }}
                >
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {isEdit ? 'Edit' : 'Create'} {title.slice(0, -1)}
                  </h1>
                  <p className="text-sm text-gray-500">{description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {isEdit && (
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                )}
                {!isEdit && (
                  <button
                    onClick={handleSaveAndReturn}
                    disabled={saving || !itemTitle.trim()}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {saving ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <ArrowLeft className="h-4 w-4 mr-2" />
                    )}
                    {saving ? 'Saving...' : 'Save & Return to List'}
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving || !itemTitle.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
                  style={{ backgroundColor: color }}
                >
                  {saving ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {saving ? 'Saving...' : (isEdit ? 'Update' : 'Save & Continue Editing')}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={itemTitle}
                      onChange={(e) => setItemTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Enter ${title.slice(0, -1).toLowerCase()} title...`}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      value={itemDescription}
                      onChange={(e) => setItemDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Brief description of this ${title.slice(0, -1).toLowerCase()}...`}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 mb-2">
                      Thumbnail URL
                    </label>
                    <input
                      type="url"
                      id="thumbnail"
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>
              </div>

              {/* Content-specific editor */}
              {children}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status & Visibility */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Status & Visibility</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Publication Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="draft">📝 Draft</option>
                      <option value="published">👁️ Published</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {status === 'draft' 
                        ? 'Only visible to admin users' 
                        : 'Visible to assigned clients and users'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Client Assignment */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Client Assignment</h3>
                  <span className="text-sm text-gray-500">
                    {assignedClients.length} of {clients.length}
                  </span>
                </div>
                
                {clients.length > 0 ? (
                  <div className="space-y-3">
                    {clients.map((client) => {
                      const isAssigned = assignedClients.includes(client.id)
                      return (
                        <div key={client.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={isAssigned}
                              onChange={() => toggleClientAssignment(client.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: client.brand_color }}
                              />
                              <span className="text-sm font-medium text-gray-900">{client.name}</span>
                            </div>
                          </div>
                          {isAssigned && (
                            <button
                              onClick={() => setActiveAssignmentModal(client.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Configure
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No clients available</p>
                  </div>
                )}
              </div>

              {/* Advanced Settings */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <button
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <div className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Advanced Settings</h3>
                  </div>
                  {showAdvancedSettings ? (
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  )}
                </button>
                
                {showAdvancedSettings && (
                  <div className="px-6 pb-6 border-t border-gray-200">
                    <div className="pt-4 space-y-4">
                      <div className="text-sm text-gray-600">
                        <p>Content ID: <code className="text-xs bg-gray-100 px-2 py-1 rounded">{contentItem?.id || 'Not created yet'}</code></p>
                        <p>Content Type: <code className="text-xs bg-gray-100 px-2 py-1 rounded">{contentType}</code></p>
                        {contentItem && (
                          <>
                            <p>Created: {new Date(contentItem.created_at).toLocaleString()}</p>
                            <p>Updated: {new Date(contentItem.updated_at).toLocaleString()}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Assignment Modals */}
        {activeAssignmentModal && (
          <ErrorBoundary>
            <AssignmentModal
              isOpen={true}
              onClose={() => setActiveAssignmentModal(null)}
              client={clients.find(c => c.id === activeAssignmentModal)!}
              contentItemId={contentItem?.id || id!}
              onSave={() => {
                // Refresh assignment data if needed
              }}
            />
          </ErrorBoundary>
        )}
      </div>
      </Layout>
    </ErrorBoundary>
  );
}

export default ContentEditor