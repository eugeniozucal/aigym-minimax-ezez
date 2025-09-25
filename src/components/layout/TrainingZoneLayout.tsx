import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Layout } from './Layout'
import { 
  LayoutDashboard, 
  Dumbbell, 
  Package, 
  Calendar,
  ChevronRight 
} from 'lucide-react'

export function TrainingZoneLayout() {
  const location = useLocation()
  
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/training-zone/dashboard',
      icon: LayoutDashboard,
      description: 'Overview and statistics'
    },
    {
      name: 'WODs',
      href: '/training-zone/wods',
      icon: Dumbbell,
      description: 'Workouts of the Day'
    },
    {
      name: 'BLOCKS',
      href: '/training-zone/blocks',
      icon: Package,
      description: 'Modular workout blocks'
    },
    {
      name: 'PROGRAMS',
      href: '/training-zone/programs',
      icon: Calendar,
      description: 'Structured training programs'
    }
  ]

  const isActiveRoute = (href: string) => {
    if (href === '/training-zone/dashboard') {
      return location.pathname === '/training-zone' || location.pathname === href
    }
    return location.pathname.startsWith(href)
  }

  return (
    <Layout>
      <div className="flex min-h-screen bg-gray-50">
        {/* Left Navigation Menu */}
        <div className="w-80 bg-white border-r border-gray-200 shadow-sm">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-orange-600 rounded-xl flex items-center justify-center shadow-sm">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Training Zone</h1>
                <p className="text-sm text-gray-600">Administrative Hub</p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = isActiveRoute(item.href)
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center justify-between p-4 rounded-lg transition-all group
                    ${
                      isActive
                        ? 'bg-orange-50 text-orange-700 border border-orange-200'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-5 w-5 ${
                      isActive ? 'text-orange-600' : 'text-gray-500 group-hover:text-gray-700'
                    }`} />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className={`text-xs ${
                        isActive ? 'text-orange-600' : 'text-gray-500'
                      }`}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 ${
                    isActive ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-600'
                  }`} />
                </Link>
              )
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </Layout>
  )
}

export default TrainingZoneLayout