'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const Navbar = () => {
  const pathname = usePathname()

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <div className="hidden md:flex md:items-center md:space-x-4">
                <Link
                  href="/dashboard/messages"
                  className={`text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium ${
                    pathname?.startsWith('/dashboard/messages') ? 'bg-gray-100' : ''
                  }`}
                >
                  Mesajlar
                </Link>
                {/* Diğer linkler... */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
} 