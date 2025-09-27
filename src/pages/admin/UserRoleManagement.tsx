import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/BulletproofAuthContext'
import { roleManagementService } from '@/lib/role-management'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Users, Shield, Settings, Eye } from 'lucide-react'
import { formatTimestamp } from '@/lib/auth-utils'

interface UserRole {
  id: string
  user_id: string
  role: 'admin' | 'community_user'
  community_id?: string
  assigned_at: string
  assigned_by?: string
  is_active: boolean
  user_email?: string
}

interface AuditLogEntry {
  id: string
  user_id?: string
  event_type: string
  event_data?: any
  success: boolean
  created_at: string
}

/**
 * User Role Management Interface
 * Admin-only component for managing user roles and viewing audit logs
 */
export function UserRoleManagement() {
  const { user, hasPermission } = useAuth()
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users')
  const [isAdmin, setIsAdmin] = useState(false)

  // Check admin permissions
  useEffect(() => {
    async function checkPermissions() {
      const adminAccess = await hasPermission('role_management')
      setIsAdmin(adminAccess)
      if (!adminAccess) {
        setError('Access denied. Admin privileges required.')
        setLoading(false)
      }
    }
    checkPermissions()
  }, [hasPermission])

  // Load data
  useEffect(() => {
    async function loadData() {
      if (!isAdmin) return

      try {
        setLoading(true)
        setError('')

        // Load user roles
        const rolesResult = await roleManagementService.getAllUsersWithRoles()
        if (rolesResult.success && rolesResult.data) {
          setUserRoles(rolesResult.data)
        } else {
          setError(rolesResult.error || 'Failed to load user roles')
        }

        // Load audit log
        const auditResult = await roleManagementService.getAuditLog()
        if (auditResult.success && auditResult.data) {
          setAuditLog(auditResult.data)
        }
      } catch (error) {
        console.error('Error loading data:', error)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isAdmin])

  // Handle role assignment
  const handleAssignRole = async (userId: string, role: 'admin' | 'community_user', communityId?: string) => {
    try {
      const result = await roleManagementService.assignRole(userId, role, communityId)
      if (result.success) {
        // Reload data to reflect changes
        const rolesResult = await roleManagementService.getAllUsersWithRoles()
        if (rolesResult.success && rolesResult.data) {
          setUserRoles(rolesResult.data)
        }
      } else {
        setError(result.error || 'Failed to assign role')
      }
    } catch (error) {
      console.error('Error assigning role:', error)
      setError('Failed to assign role')
    }
  }

  if (!isAdmin && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-2 text-lg font-medium text-gray-900">Access Denied</h2>
          <p className="mt-1 text-sm text-gray-500">Admin privileges required</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-500 mt-3">Loading user management...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Role Management</h1>
          <p className="text-gray-600 mt-2">Manage user roles and view authentication audit logs</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="inline h-5 w-5 mr-2" />
              User Roles ({userRoles.length})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'audit'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Eye className="inline h-5 w-5 mr-2" />
              Audit Log ({auditLog.length})
            </button>
          </nav>
        </div>

        {/* User Roles Tab */}
        {activeTab === 'users' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">User Roles</h2>
              <p className="text-sm text-gray-500">Manage user role assignments and permissions</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Community
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userRoles.map((userRole) => (
                    <tr key={userRole.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {userRole.user_email || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {userRole.user_id.slice(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          userRole.role === 'admin'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {userRole.role === 'admin' ? 'Administrator' : 'Community User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {userRole.community_id ? userRole.community_id.slice(0, 8) + '...' : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimestamp(userRole.assigned_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          userRole.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {userRole.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {userRoles.length === 0 && (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No user roles found</h3>
                  <p className="mt-1 text-sm text-gray-500">User roles will appear here when assigned.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Audit Log Tab */}
        {activeTab === 'audit' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Authentication Audit Log</h2>
              <p className="text-sm text-gray-500">Recent authentication and authorization events</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditLog.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {entry.event_type.replace(/_/g, ' ').toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.user_id ? entry.user_id.slice(0, 8) + '...' : 'System'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          entry.success
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {entry.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTimestamp(entry.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.event_data ? JSON.stringify(entry.event_data).slice(0, 50) + '...' : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {auditLog.length === 0 && (
                <div className="text-center py-8">
                  <Eye className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No audit events found</h3>
                  <p className="mt-1 text-sm text-gray-500">Authentication events will appear here.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}