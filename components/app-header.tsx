"use client"

import { Card, CardContent } from "@/components/ui/card"

export function AppHeader() {
  return (
    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 shadow-lg">
      <CardContent className="p-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Alpha Invoice
            </h1>
          </div>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Streamline your invoicing workflow with intelligent automation. 
            Create, manage, and track invoices effortlessly with our modern platform.
          </p>
          
          <div className="flex items-center justify-center space-x-6 mt-8">
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
      </CardContent>
    </Card>
  )
}
