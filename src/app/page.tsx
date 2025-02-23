'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth'
import Link from 'next/link'
import axios from '@/lib/axios'

interface Accountant {
  id: number
  first_name: string
  last_name: string
  title?: string
  experience_years?: number
  company_name?: string
  city?: string
  about?: string
  profile_image?: string
  specializations?: string[]
}

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [accountants, setAccountants] = useState<Accountant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const fetchAccountants = async () => {
      try {
        const response = await axios.get('/api/v1/accountants/')
        const accountantsList = response.data.results || response.data
        setAccountants(Array.isArray(accountantsList) ? accountantsList : [])
      } catch (error) {
        console.error('Mali müşavirler yüklenirken hata:', error)
        setAccountants([])
      } finally {
        setLoading(false)
      }
    }

    fetchAccountants()
  }, [])

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

      {/* Mali Müşavirler Listesi */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-8">
          Öne Çıkan Mali Müşavirler
        </h2>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : Array.isArray(accountants) && accountants.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {accountants.map((accountant) => (
              <div
                key={accountant.id}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200">
                      {accountant.profile_image ? (
                        <img
                          src={accountant.profile_image}
                          alt={`${accountant.first_name} ${accountant.last_name}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-600">
                          {accountant.first_name[0]}
                          {accountant.last_name[0]}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {accountant.first_name} {accountant.last_name}
                      </h3>
                      {accountant.title && (
                        <p className="text-sm text-gray-500">{accountant.title}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    {accountant.specializations && accountant.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {accountant.specializations.map((spec, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {accountant.about && (
                      <p className="text-sm text-gray-500 line-clamp-3">
                        {accountant.about}
                      </p>
                    )}

                    <div className="mt-4 flex items-center text-sm text-gray-500">
                      {accountant.experience_years && (
                        <span className="mr-4">{accountant.experience_years} Yıl Deneyim</span>
                      )}
                      {accountant.city && (
                        <span>{accountant.city}</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <Link
                      href={`/accountants/${accountant.id}`}
                      className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Profili İncele
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Henüz mali müşavir bulunmamaktadır.</p>
          </div>
        )}
      </div>
    </div>
  )
} 