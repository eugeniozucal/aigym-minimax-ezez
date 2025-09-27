import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, UserMinus, Users, Mail, Clock, Crown, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
}

interface CommunityMember {
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'member' | 'moderator' | 'admin';
  joined_at: string;
}

interface Community {
  id: string;
  name: string;
  brand_color: string;
  logo_url?: string;
}

interface CommunityMembershipModalProps {
  community: Community | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CommunityMembershipModal: React.FC<CommunityMembershipModalProps> = ({
  community,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'add-users'>('members');
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && community) {
      loadCommunityMembers();
      loadAllUsers();
    }
  }, [isOpen, community]);

  const loadCommunityMembers = async () => {
    if (!community) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('community-membership-manager', {
        body: {
          action: 'get_community_members',
          community_id: community.id
        }
      });

      if (error) throw error;
      
      if (data?.data?.members) {
        setMembers(data.data.members);
      }
    } catch (error) {
      console.error('Error loading community members:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleAddUsers = async () => {
    if (!community || selectedUsers.length === 0) return;
    
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('community-membership-manager', {
        body: {
          action: 'bulk_add_users_to_community',
          user_ids: selectedUsers,
          community_id: community.id,
          role: 'member'
        }
      });

      if (error) throw error;
      
      if (data?.data) {
        alert(`Successfully added ${data.data.successful} users to ${community.name}`);
        setSelectedUsers([]);
        loadCommunityMembers(); // Refresh members list
        setActiveTab('members'); // Switch to members tab
      }
    } catch (error) {
      console.error('Error adding users:', error);
      alert('Failed to add users. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveUser = async (userId: string, userName: string) => {
    if (!community) return;
    
    if (!confirm(`Are you sure you want to remove ${userName} from ${community.name}?`)) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('community-membership-manager', {
        body: {
          action: 'remove_user_from_community',
          user_id: userId,
          community_id: community.id
        }
      });

      if (error) throw error;
      
      if (data?.data?.success) {
        alert(`${userName} has been removed from ${community.name}`);
        loadCommunityMembers(); // Refresh members list
      }
    } catch (error) {
      console.error('Error removing user:', error);
      alert('Failed to remove user. Please try again.');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string, userName: string) => {
    if (!community) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('community-membership-manager', {
        body: {
          action: 'update_member_role',
          user_id: userId,
          community_id: community.id,
          role: newRole
        }
      });

      if (error) throw error;
      
      if (data?.data?.success) {
        alert(`${userName}'s role has been updated to ${newRole}`);
        loadCommunityMembers(); // Refresh members list
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role. Please try again.');
    }
  };

  const getFullName = (user: CommunityMember | User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.first_name || user.last_name || 'Unnamed User';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown size={14} className="text-yellow-600" />;
      case 'moderator':
        return <Shield size={14} className="text-blue-600" />;
      default:
        return <Users size={14} className="text-gray-600" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const config = {
      admin: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      moderator: { bg: 'bg-blue-100', text: 'text-blue-800' },
      member: { bg: 'bg-gray-100', text: 'text-gray-800' }
    };
    
    const { bg, text } = config[role as keyof typeof config] || config.member;
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
        {getRoleIcon(role)}
        <span className="ml-1">{role.charAt(0).toUpperCase() + role.slice(1)}</span>
      </span>
    );
  };

  const filteredMembers = members.filter(member => {
    const fullName = getFullName(member);
    return fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           member.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const availableUsers = allUsers.filter(user => {
    const isMember = members.some(member => member.user_id === user.id);
    const matchesSearch = getFullName(user).toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return !isMember && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isOpen || !community) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {community.logo_url ? (
                <img
                  src={community.logo_url}
                  alt={community.name}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: community.brand_color }}
                >
                  {community.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Manage Members</h2>
                <p className="text-gray-600">{community.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex space-x-1">
            <button
              onClick={() => setActiveTab('members')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'members'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Members ({members.length})
            </button>
            <button
              onClick={() => setActiveTab('add-users')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'add-users'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Add Users
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Search */}
          <div className="relative mb-6">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'members' ? 'Search members...' : 'Search users to add...'}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {activeTab === 'members' && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading members...</p>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
                  <p className="text-gray-600">
                    {searchQuery ? 'Try adjusting your search criteria.' : 'This community has no members yet.'}
                  </p>
                </div>
              ) : (
                filteredMembers.map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {getFullName(member).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{getFullName(member)}</h4>
                          {getRoleBadge(member.role)}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Mail size={14} />
                            <span>{member.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock size={14} />
                            <span>Joined {formatDate(member.joined_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.user_id, e.target.value, getFullName(member))}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="member">Member</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                      
                      <button
                        onClick={() => handleRemoveUser(member.user_id, getFullName(member))}
                        className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                        title="Remove from community"
                      >
                        <UserMinus size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'add-users' && (
            <div>
              {selectedUsers.length > 0 && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-blue-800">
                      {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                    </p>
                    <div className="space-x-2">
                      <button
                        onClick={() => setSelectedUsers([])}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Clear
                      </button>
                      <button
                        onClick={handleAddUsers}
                        disabled={submitting}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:bg-gray-400 flex items-center space-x-1"
                      >
                        {submitting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <UserPlus size={16} />
                        )}
                        <span>{submitting ? 'Adding...' : 'Add to Community'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {availableUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No users available</h3>
                    <p className="text-gray-600">
                      {searchQuery 
                        ? 'No users match your search criteria.' 
                        : 'All users are already members of this community.'}
                    </p>
                  </div>
                ) : (
                  availableUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(prev => [...prev, user.id]);
                            } else {
                              setSelectedUsers(prev => prev.filter(id => id !== user.id));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {getFullName(user).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{getFullName(user)}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Mail size={14} />
                              <span>{user.email}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock size={14} />
                              <span>Created {formatDate(user.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityMembershipModal;