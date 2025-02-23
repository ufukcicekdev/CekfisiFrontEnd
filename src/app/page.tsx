'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth'
import Link from 'next/link'
import axios from '@/lib/axios'


export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard')
    }
  }, [user, isLoading, router])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      
      <header className="bg-white shadow-sm">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="relative h-16 flex items-center justify-between">
      {/* Logo */}
      <div className="flex-shrink-0">
        <Link href="/" className="font-bold text-xl text-indigo-600">
          Çek Fişi
        </Link>
      </div>
      
      {/* Desktop Navigation */}
      <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-8">
        <Link
          href="/accountants"
          className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
        >
          Mali Müşavirler
        </Link>
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
      <div className="flex items-center sm:hidden space-x-2">
        <Link
          href="/accountants"
          className="text-gray-500 hover:text-gray-700 px-3 py-2 text-sm font-medium"
        >
          Mali Müşavirler
        </Link>
        <Link
          href="/auth/login"
          className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap"
        >
          Giriş Yap
        </Link>
      </div>
    </div>
  </div>
</header>
      
      
      
      
      
      

      {/* Hero Section */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Modern Muhasebe</span>
              <span className="block text-indigo-600">Dijital Çözümler</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Fatura ve fiş yüklemeden, belge takibine kadar tüm muhasebe işlemlerinizi
              tek platformda yönetin.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <a
                  href="/auth/login/accountant"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                >
                  Mali Müşavir Girişi
                </a>
              </div>
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                <a
                  href="/auth/login/client"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                >
                  Mükellef Girişi
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">
              Özellikler
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Neden Çek Fişi?
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              {/* Feature 1 */}
              <div className="relative">
                <div className="mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Kolay Belge Yükleme
                  </h3>
                  <p className="mt-2 text-base text-gray-500">
                    Telefonunuzdan veya bilgisayarınızdan hızlıca belge yükleyin.
                    Faturalarınızı ve fişlerinizi anında dijitalleştirin.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="relative">
                <div className="mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Gerçek Zamanlı Takip
                  </h3>
                  <p className="mt-2 text-base text-gray-500">
                    Belgelerinizin işlenme durumunu anlık olarak takip edin.
                    Mali müşavirinizle sürekli iletişimde kalın.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="relative">
                <div className="mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Güvenli Depolama
                  </h3>
                  <p className="mt-2 text-base text-gray-500">
                    Tüm belgeleriniz güvenli bir şekilde saklanır ve yedeklenir.
                    İstediğiniz zaman erişim sağlayın.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            <span className="block">Hemen Başlayın</span>
            <span className="block text-indigo-600">
              Dijital muhasebe deneyimini keşfedin.
            </span>
          </h2>
        
       
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="mt-8 md:mt-0">
            <p className="text-center text-base text-gray-400">
              &copy; 2024 Çek Fişi. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
} 