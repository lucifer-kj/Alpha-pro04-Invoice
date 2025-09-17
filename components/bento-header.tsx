"use client"

import { DatabaseStatus } from "@/components/database-status"

export function BentoHeader() {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        {/* App Title & Description - Takes 3 columns */}
        <div className="lg:col-span-3">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Alpha Invoice
                </h1>
                <p className="text-gray-600 mt-1">
                  Streamline your invoicing workflow with intelligent automation
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Real-time Processing</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Secure Storage</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Smart Analytics</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Database Status Box - Takes 1 column */}
        <div className="lg:col-span-1">
          <DatabaseStatus />
        </div>
      </div>
    </div>
  )
}
