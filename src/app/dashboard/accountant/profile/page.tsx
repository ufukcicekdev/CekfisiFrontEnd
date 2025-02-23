'use client'

import { useState, useEffect } from 'react'
import { PageContainer } from '@/components/PageContainer'
import axios from '@/lib/axios'
import { useAuth } from '@/contexts/auth'
import { toast } from 'react-hot-toast'

interface AccountantProfile {
  id: number
  email: string
  first_name: string
  last_name: string
  user_type: string
  phone: string
  // Yeni eklenen alanlar
  address: string
  city: string
  district: string
  about: string
  experience_years: number
  title: string
  company_name: string
  website: string
  profile_image: string | null
  specializations: string[]
  is_featured: boolean
  rating: number
  review_count: number
}

export default function AccountantProfilePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<AccountantProfile | null>(null)

  // Profil bilgilerini yükle
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const response = await axios.get('/api/v1/accountant/profile/')
        setProfile(response.data)
      } catch (error) {
        console.error('Profil yüklenirken hata:', error)
        toast.error('Profil bilgileri yüklenemedi')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  // Form gönderme
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      const response = await axios.patch('/api/v1/accountant/profile/', formData)
      setProfile(response.data)
      toast.success('Profil başarıyla güncellendi')
    } catch (error) {
      console.error('Profil güncellenirken hata:', error)
      toast.error('Profil güncellenemedi')
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-6">Profil Bilgilerim</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* İletişim Bilgileri */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">İletişim Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">E-posta</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={profile?.email}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefon</label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={profile?.phone}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Kişisel Bilgiler */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Kişisel Bilgiler</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Ad</label>
                <input
                  type="text"
                  name="first_name"
                  defaultValue={profile?.first_name}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Soyad</label>
                <input
                  type="text"
                  name="last_name"
                  defaultValue={profile?.last_name}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Adres Bilgileri */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Adres Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Şehir</label>
                <input
                  type="text"
                  name="city"
                  defaultValue={profile?.city}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">İlçe</label>
                <input
                  type="text"
                  name="district"
                  defaultValue={profile?.district}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Açık Adres</label>
                <textarea
                  name="address"
                  rows={3}
                  defaultValue={profile?.address}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Mesleki Bilgiler */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Mesleki Bilgiler</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Ünvan</label>
                <input
                  type="text"
                  name="title"
                  defaultValue={profile?.title}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Deneyim (Yıl)</label>
                <input
                  type="number"
                  name="experience_years"
                  defaultValue={profile?.experience_years}
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Şirket Adı</label>
                <input
                  type="text"
                  name="company_name"
                  defaultValue={profile?.company_name}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Website</label>
                <input
                  type="url"
                  name="website"
                  defaultValue={profile?.website}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Uzmanlık ve Hakkında */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Uzmanlık ve Hakkında</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Uzmanlık Alanları</label>
                <input
                  type="text"
                  name="specializations"
                  defaultValue={profile?.specializations.join(', ')}
                  placeholder="Örn: Vergi Danışmanlığı, Muhasebe, Finansal Planlama"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Hakkımda</label>
                <textarea
                  name="about"
                  rows={4}
                  defaultValue={profile?.about}
                  placeholder="Kendinizi ve hizmetlerinizi tanıtın..."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Profili Güncelle
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  )
} 