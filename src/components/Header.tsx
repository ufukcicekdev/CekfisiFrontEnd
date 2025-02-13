'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/auth'

export default function Header() {
  const { user } = useAuth()

  return (
    <header className="bg-white shadow">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
          
             
            </div>
          </div>

          {/* Sadece giriş yapmamış kullanıcılara giriş butonlarını göster */}
          {!user && (
            <>
              {/* Desktop Navigation */}
              <div className="hidden sm:flex sm:items-center sm:space-x-8">
                <Link
                  href="/auth/login/accountant"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
                >
                  Mali Müşavir Girişi
                </Link>
                <Link
                  href="/auth/login/client"
                  className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Mükellef Girişi
                </Link>
              </div>

              {/* Mobile Navigation */}
              <div className="flex items-center sm:hidden">
                <Link
                  href="/auth/login"
                  className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap"
                >
                  Giriş Yap
                </Link>
              </div>
            </>
          )}
        </div>
      </nav>
    </header>
  )
} 