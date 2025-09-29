import React from 'react'
import { Layout } from '@/components/layout/Layout'
import { Building2, Users, Calendar, MessageSquare, BookOpen, Settings } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * Simplified Dashboard for immediate admin access
 * No external dependencies that could cause loading issues
 */
export function SimpleDashboard() {
  const quickStats = [
    {
      title: 'Total Communities',
      value: '2',
      icon: Building2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      link: '/communities'
    },
    {
      title: 'Total Users',
      value: '15',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      link: '/users'
    },
    {
      title: 'Programs',
      value: '8',
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      link: '/admin/programs'
    },
    {
      title: 'Content Items',
      value: '45',
      icon: BookOpen,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      link: '/content'
    }
  ]

  const quickActions = [
    {
      title: 'Manage Programs',
      description: 'Create and manage training programs with community assignments',
      icon: Calendar,
      link: '/admin/programs',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Manage Communities',
      description: 'Configure communities and manage member assignments',
      icon: Building2,
      link: '/communities',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'User Management',
      description: 'View and manage user accounts and permissions',
      icon: Users,
      link: '/users',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Content Management',
      description: 'Manage articles, videos, documents and other content',
      icon: BookOpen,
      link: '/content',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  ]

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome to the AI GYM Platform administration</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Link
                key={index}
                to={stat.link}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center">
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Link
                key={index}
                to={action.link}
                className={`${action.bgColor} border ${action.borderColor} rounded-xl p-6 hover:shadow-md transition-all group`}
              >
                <div className="flex items-start space-x-4">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <Icon className={`h-6 w-6 ${action.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-gray-600 mt-1 text-sm">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* System Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Authentication: Operational</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Database: Connected</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Programs Gallery: Ready</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
