import React, { useState, useEffect } from 'react'
import { ModernLayout } from '@/components/layout/ModernLayout'
import { Link } from 'react-router-dom'
import {
  supabase,
  Client,
  createClientFromTemplate,
  ApiKey,
  PLATFORM_FEATURES
} from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  Plus,
  Settings,
  Users,
  Archive,
  Eye,
  Calendar,
  Building,
  Palette,
  Key,
  Copy,
  CheckCircle
} from 'lucide-react'
import ClientModal from '@/components/modals/ClientModal'

interface ExtendedClient extends Client {
  active_users?: number
}

export function EnhancedClientsPage() {
  const [clients, setClients] = useState<ExtendedClient[]>([])
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'active_users'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    fetchData()
  }, [showArchived])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch clients
      const clientQuery = supabase
        .from('clients')
        .select('*')
        .order('name')
      
      if (!showArchived) {
        clientQuery.eq('status', 'active')
      }
      
      const { data: clientsData, error: clientsError } = await clientQuery
      if (clientsError) throw clientsError
      
      // Fetch user counts for each client
      const clientsWithCounts = await Promise.all(
        (clientsData || []).map(async (client) => {
          const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact' })
            .eq('client_id', client.id)
          
          return {
            ...client,
            active_users: count || 0
          }
        })
      )
      
      setClients(clientsWithCounts)
      
      // Fetch API keys
      const { data: keysData, error: keysError } = await supabase
        .from('api_keys')
        .select('*')
        .order('name')
      
      if (keysError) throw keysError
      setApiKeys(keysData || [])
      
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleArchiveClient = async (clientId: string, archive: boolean) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ status: archive ? 'archived' : 'active' })
        .eq('id', clientId)
      
      if (error) throw error
      
      await fetchData()
    } catch (error) {
      console.error('Error updating client status:', error)
      alert('Failed to update client status. Please try again.')
    }
  }

  const getSortedClients = () => {
    return [...clients].sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'active_users':
          aValue = a.active_users || 0
          bValue = b.active_users || 0
          break
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
  }

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const getApiKeyName = (apiKeyId?: string) => {
    if (!apiKeyId) return 'None'
    return apiKeys.find(key => key.id === apiKeyId)?.name || 'Unknown'
  }

  return (
    <ModernLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
            <p className="text-gray-600 mt-1">
              Manage your client ecosystem, configurations, and user access
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show Archived Clients</span>
            </label>
            
            <button
              onClick={() => {
                setEditingClient(null)
                setModalOpen(true)
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Client
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-4 items-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-3">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Client Name</span>
                    {sortBy === 'name' && (
                      <span className="text-blue-500">↑↓</span>
                    )}
                  </button>
                </div>
                <div className="col-span-2">Project Name</div>
                <div className="col-span-1">
                  <button
                    onClick={() => handleSort('active_users')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Users</span>
                    {sortBy === 'active_users' && (
                      <span className="text-blue-500">↑↓</span>
                    )}
                  </button>
                </div>
                <div className="col-span-2">API Key</div>
                <div className="col-span-2">
                  <button
                    onClick={() => handleSort('created_at')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Created Date</span>
                    {sortBy === 'created_at' && (
                      <span className="text-blue-500">↑↓</span>
                    )}
                  </button>
                </div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1">Actions</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {getSortedClients().map((client) => (
                <div key={client.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Client Name with Logo */}
                    <div className="col-span-3 flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {client.logo_url ? (
                          <img
                            src={client.logo_url}
                            alt={client.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div 
                            className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
                            style={{ backgroundColor: client.brand_color }}
                          >
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{client.name}</p>
                        {client.template_source_id && (
                          <p className="text-xs text-blue-600 flex items-center mt-1">
                            <Copy className="h-3 w-3 mr-1" />
                            From Template
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Project Name */}
                    <div className="col-span-2">
                      <p className="text-sm text-gray-900">{client.project_name}</p>
                    </div>

                    {/* Active Users */}
                    <div className="col-span-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Users className="h-3 w-3 mr-1" />
                        {client.active_users}
                      </span>
                    </div>

                    {/* API Key */}
                    <div className="col-span-2">
                      <div className="flex items-center space-x-1">
                        <Key className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {getApiKeyName(client.api_key_id)}
                        </span>
                      </div>
                    </div>

                    {/* Created Date */}
                    <div className="col-span-2">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {new Date(client.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        client.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {client.status === 'active' ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <Archive className="h-3 w-3 mr-1" />
                        )}
                        {client.status === 'active' ? 'Active' : 'Archived'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/clients/${client.id}/config`}
                          className="text-blue-600 hover:text-blue-800"
                          title="Configure Client"
                        >
                          <Settings className="h-4 w-4" />
                        </Link>
                        
                        <Link
                          to={`/clients/${client.id}/preview`}
                          className="text-green-600 hover:text-green-800"
                          title="Preview Client Experience"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        
                        <button
                          onClick={() => handleArchiveClient(client.id, client.status === 'active')}
                          className={`${
                            client.status === 'active'
                              ? 'text-orange-600 hover:text-orange-800'
                              : 'text-green-600 hover:text-green-800'
                          }`}
                          title={client.status === 'active' ? 'Archive Client' : 'Reactivate Client'}
                        >
                          {client.status === 'active' ? (
                            <Archive className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {clients.length === 0 && (
              <div className="text-center py-12">
                <Building className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {showArchived ? 'No archived clients' : 'No clients yet'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {showArchived 
                    ? 'Archived clients will appear here when you archive them.'
                    : 'Create your first client to get started with the platform.'}
                </p>
                {!showArchived && (
                  <button
                    onClick={() => setModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Client
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Client Modal */}
        {modalOpen && (
          <ClientModal
            isOpen={modalOpen}
            editingClient={editingClient}
            onClose={() => {
              setModalOpen(false)
              setEditingClient(null)
            }}
            onClientCreated={async () => {
              setModalOpen(false)
              setEditingClient(null)
              await fetchData()
            }}
          />
        )}
      </div>
    </ModernLayout>
  )
}