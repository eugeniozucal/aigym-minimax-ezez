import React from 'react'
import { Calendar, Plus, Target, Clock, Users } from 'lucide-react'

export function ProgramsRepository() {
  return (
    <div className="min-h-full flex bg-gray-50">
      {/* Content Panel */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center shadow-sm bg-purple-100">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PROGRAMS (Structured Training Programs)</h1>
                <p className="text-sm text-gray-600 mt-1">Create and manage comprehensive fitness programs</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-xs text-gray-500">0 PROGRAMS</span>
                  <span className="text-xs text-purple-600 font-medium">• Coming Soon</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                disabled
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gray-400 cursor-not-allowed transition-all"
              >
                <Plus className="-ml-1 mr-2 h-4 w-4" />
                Create PROGRAM
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="text-center py-20">
            <div className="bg-purple-100 mx-auto h-32 w-32 rounded-full flex items-center justify-center mb-6">
              <Calendar className="h-16 w-16 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">PROGRAMS Coming Soon</h3>
            <p className="text-lg text-gray-600 mt-2 max-w-2xl mx-auto leading-relaxed">
              Structured training programs will allow you to create comprehensive fitness journeys that combine multiple WODs and BLOCKS into coherent, progressive training paths.
            </p>
            
            {/* Feature Preview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="bg-purple-100 p-3 rounded-lg w-fit mx-auto mb-4">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Progressive Structure</h4>
                <p className="text-sm text-gray-600">
                  Design multi-week programs with progressive difficulty and skill development
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="bg-purple-100 p-3 rounded-lg w-fit mx-auto mb-4">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Scheduling</h4>
                <p className="text-sm text-gray-600">
                  Set up automated workout schedules and rest days for optimal training cycles
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="bg-purple-100 p-3 rounded-lg w-fit mx-auto mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Group Management</h4>
                <p className="text-sm text-gray-600">
                  Assign programs to communities and track group progress and achievements
                </p>
              </div>
            </div>

            {/* Development Status */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mt-12 max-w-2xl mx-auto">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-purple-700 font-medium">In Development</span>
              </div>
              <p className="text-purple-600 text-sm">
                The PROGRAMS module is currently under development. It will integrate seamlessly with your existing WODs and BLOCKS to create comprehensive training experiences.
              </p>
            </div>

            {/* Call to Action */}
            <div className="mt-12">
              <p className="text-gray-500 text-sm mb-4">
                In the meantime, continue building your WODs and BLOCKS library
              </p>
              <div className="flex justify-center space-x-4">
                <a
                  href="/training-zone/wods"
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 shadow-sm transition-all"
                >
                  Browse WODs
                </a>
                <a
                  href="/training-zone/blocks"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-all"
                >
                  Browse BLOCKS
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProgramsRepository