"use client"

import { Home, FileText } from "lucide-react"

interface NavigationProps {
  currentPage: 'home' | 'storage'
  onPageChange: (page: 'home' | 'storage') => void
}

export function Navigation({ currentPage, onPageChange }: NavigationProps) {
  return (
    <nav className="mb-6">
      <ul className="flex items-center space-x-6 text-sm font-medium text-gray-600">
        <li>
          <button
            onClick={() => onPageChange('home')}
            className={`inline-flex items-center gap-2 transition-all duration-200 hover:text-gray-900 ${currentPage === 'home' ? 'text-gray-900' : ''}`}
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </button>
          <div className={`h-0.5 rounded-full transition-all duration-300 ${currentPage === 'home' ? 'w-full bg-gradient-to-r from-purple-500 to-blue-500' : 'w-0 bg-transparent'}`}></div>
        </li>
        <li>
          <button
            onClick={() => onPageChange('storage')}
            className={`inline-flex items-center gap-2 transition-all duration-200 hover:text-gray-900 ${currentPage === 'storage' ? 'text-gray-900' : ''}`}
          >
            <FileText className="h-4 w-4" />
            <span>Storage</span>
          </button>
          <div className={`h-0.5 rounded-full transition-all duration-300 ${currentPage === 'storage' ? 'w-full bg-gradient-to-r from-purple-500 to-blue-500' : 'w-0 bg-transparent'}`}></div>
        </li>
      </ul>
    </nav>
  )
}
