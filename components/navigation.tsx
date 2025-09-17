"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Home, FileText } from "lucide-react"

interface NavigationProps {
  currentPage: 'home' | 'storage'
  onPageChange: (page: 'home' | 'storage') => void
}

export function Navigation({ currentPage, onPageChange }: NavigationProps) {
  return (
    <div className="flex items-center space-x-1 mb-6">
      <Button
        variant={currentPage === 'home' ? 'default' : 'ghost'}
        onClick={() => onPageChange('home')}
        className="flex items-center space-x-2"
      >
        <Home className="h-4 w-4" />
        <span>Home</span>
      </Button>
      <Button
        variant={currentPage === 'storage' ? 'default' : 'ghost'}
        onClick={() => onPageChange('storage')}
        className="flex items-center space-x-2"
      >
        <FileText className="h-4 w-4" />
        <span>Storage</span>
      </Button>
    </div>
  )
}
