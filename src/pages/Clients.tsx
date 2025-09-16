import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Archive, MoreHorizontal, Users, Calendar, CheckCircle, Eye, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ClientModal from '../components/modals/ClientModal';
import { useNavigate } from 'react-router-dom';

interface Client {
  id: string;
  name: string;
  project_name: string | null;
  logo_url: string | null;
  brand_color: string;
  status: string;
  forum_enabled: boolean;
  is_template: boolean;
  created_at: string;
}

const Clients: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [actionDropdown, setActionDropdown] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
  }, [statusFilter, showArchived]);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply status filtering
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Handle archived filter
      if (!showArchived) {
        query = query.neq('status', 'archived');
      }

      const { data, error } = await query;

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClient = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleManageClient = (clientId: string) => {
    navigate(`/clients/${clientId}`);
  };

  const handleArchiveClient = async (client: Client) => {
    const newStatus = client.status === 'archived' ? 'active' : 'archived';
    
    try {
      const { error } = await supabase
        .from('clients')
        .update({ status: newStatus })
        .eq('id', client.id);

      if (error) throw error;
      
      loadClients(); // Refresh the list
    } catch (error) {
      console.error('Error updating client status:', error);
    }
  };

  const handleDeleteClient = async (client: Client) => {
    if (!confirm(`Are you sure you want to permanently delete "${client.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', client.id);

      if (error) throw error;
      
      loadClients(); // Refresh the list
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const handlePreviewClient = (client: Client) => {
    // Open client's preview in a new tab
    window.open(`/client-preview/${client.id}`, '_blank');
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (client.project_name && client.project_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      archived: { bg: 'bg-gray-100', text: 'text-gray-800', icon: Archive },
      inactive: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: null }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {Icon && <Icon size={12} className="mr-1" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
          <p className="text-gray-600 mt-1">
            Manage your clients and their platform configurations
          </p>
        </div>
        <button 
          onClick={handleCreateClient}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
        >
          <Plus size={20} />
          <span>Create New Client</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients or projects..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show Archived</span>
            </label>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {clients.filter(c => c.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Active Clients</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {clients.length}
              </div>
              <div className="text-sm text-gray-600">Total Clients</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {clients.filter(c => c.forum_enabled).length}
              </div>
              <div className="text-sm text-gray-600">Forum Enabled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {clients.filter(c => c.is_template).length}
              </div>
              <div className="text-sm text-gray-600">Templates</div>
            </div>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading clients...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-8 text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'Try adjusting your search criteria.' : 'Get started by creating your first client.'}
            </p>
            {!searchQuery && (
              <button 
                onClick={handleCreateClient}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Client
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {client.logo_url ? (
                          <img
                            src={client.logo_url}
                            alt={`${client.name} logo`}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shadow-sm"
                            style={{ backgroundColor: client.brand_color || '#3B82F6' }}
                          >
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{client.name}</div>
                          {client.is_template && (
                            <span className="inline-block px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full mt-1">
                              Template
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {client.project_name || <span className="text-gray-400">-</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users size={16} className="text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">-</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar size={16} className="text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">{formatDate(client.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(client.status)}
                      {client.forum_enabled && (
                        <span className="ml-2 inline-block w-2 h-2 bg-green-400 rounded-full" title="Forum Enabled" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleManageClient(client.id)}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                          Manage
                        </button>
                        
                        <div className="relative">
                          <button
                            onClick={() => setActionDropdown(actionDropdown === client.id ? null : client.id)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          
                          {actionDropdown === client.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    handlePreviewClient(client);
                                    setActionDropdown(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Eye size={16} className="mr-2" />
                                  Preview
                                </button>
                                <button
                                  onClick={() => {
                                    handleEditClient(client);
                                    setActionDropdown(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Edit size={16} className="mr-2" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    handleArchiveClient(client);
                                    setActionDropdown(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Archive size={16} className="mr-2" />
                                  {client.status === 'archived' ? 'Restore' : 'Archive'}
                                </button>
                                {client.status === 'archived' && (
                                  <button
                                    onClick={() => {
                                      handleDeleteClient(client);
                                      setActionDropdown(null);
                                    }}
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 size={16} className="mr-2" />
                                    Delete Permanently
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Client Modal */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onClientCreated={loadClients}
        editingClient={editingClient}
      />
    </div>
  );
};

export { Clients };