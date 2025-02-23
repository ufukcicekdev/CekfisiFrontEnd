'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth'
import Image from 'next/image'
import { 
  HomeIcon, 
  UsersIcon, 
  DocumentTextIcon, 
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowLeftOnRectangleIcon,
  CreditCardIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import { useState } from 'react'

const Sidebar = () => {
  const pathname = usePathname() ?? ''
  const { user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isAccountant = user?.user_type === 'accountant'

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    ...(isAccountant ? [
      { name: 'Müşterilerim', href: '/dashboard/clients', icon: UsersIcon },
      { name: 'Mesajlar', href: '/dashboard/messages', icon: ChatBubbleLeftRightIcon },
      { name: 'Abonelik', href: '/dashboard/subscription', icon: CreditCardIcon },
    ] : [
      { name: 'Belgelerim', href: '/dashboard/documents', icon: DocumentTextIcon },
      { name: 'Dökümanlarım', href: '/dashboard/client/documents', icon: DocumentTextIcon },
      { name: 'Mesajlar', href: '/dashboard/client/messages', icon: ChatBubbleLeftRightIcon },
    ]),
    { name: 'Profilim', href: '/dashboard/profile', icon: UserCircleIcon },
  ]

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 z-40 w-full bg-white border-b px-4 py-2">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-gray-500 hover:text-gray-600"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white transform transition-transform duration-300 ease-in-out border-r
        h-[100vh] flex flex-col lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo Bölümü - Sabit */}
        <div className="flex-shrink-0 px-6 py-4 border-b">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="text-lg font-semibold text-gray-900">
              Çek Fişi
            </span>
          </Link>
        </div>

        {/* Navigation - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <nav className="px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname?.startsWith(item.href) ?? false
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center px-4 py-2 text-sm font-medium rounded-lg
                    transition-colors duration-150 ease-in-out
                    ${isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                >
                  <item.icon 
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* User Info ve Logout - Sabit */}
        <div className="flex-shrink-0 border-t px-4 py-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-indigo-600 font-medium text-sm">
                  {user?.first_name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50"
          >
            <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5" />
            Çıkış Yap
          </button>
        </div>
      </div>
    </>
  )
}

export default Sidebar 