'use client'

import { useState } from 'react'
import { PageContainer } from '@/components/PageContainer'
import { useAuth } from '@/contexts/auth'
import axios from '@/lib/axios'
import { toast } from 'react-hot-toast'
import Modal from '@/components/Modal'
import { UserCircleIcon, PhoneIcon, EnvelopeIcon, KeyIcon } from '@heroicons/react/24/outline'

export default function ProfilePage() {
  const auth = useAuth()
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [profileData, setProfileData] = useState({
    first_name: auth.user?.first_name || '',
    last_name: auth.user?.last_name || '',
    email: auth.user?.email || '',
    phone: auth.user?.phone || ''
  })
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    new_password_confirmation: ''
  })

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await axios.patch('/api/v1/users/profile/', profileData)
      toast.success('Profil bilgileriniz başarıyla güncellendi')
      auth.setUser(response.data)
      setIsEditing(false)
    } catch (error: any) {
      console.error('Hata:', error)
      toast.error(error.response?.data?.error || 'Profil güncellenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      toast.error('Yeni şifreler eşleşmiyor')
      return
    }

    setLoading(true)
    try {
      await axios.post('/api/v1/users/change-password/', {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password
      })
      toast.success('Şifreniz başarıyla değiştirildi')
      setPasswordData({
        old_password: '',
        new_password: '',
        new_password_confirmation: ''
      })
      setShowPasswordModal(false)
    } catch (error: any) {
      const message = error.response?.data?.error || 'Şifre değiştirme işlemi başarısız'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        {/* Profil Başlığı */}
        <div className="mb-8 text-center">
          <div className="inline-block p-2 rounded-full bg-indigo-100 mb-4">
            <UserCircleIcon className="h-24 w-24 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {auth.user?.first_name} {auth.user?.last_name}
          </h1>
          <p className="text-gray-500 mt-1">{auth.user?.user_type === 'accountant' ? 'Mali Müşavir' : 'Mükellef'}</p>
        </div>

        {/* Ana Kart */}
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
          {/* Üst Bilgi Çubuğu */}
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-indigo-600">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-white">
                Profil Bilgileri
              </h3>
              <div className="space-x-3">
                {!isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-700 hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                      <KeyIcon className="h-4 w-4 mr-2" />
                      Şifre Değiştir
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* İletişim Bilgileri Kartı */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-4">İletişim Bilgileri</h4>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        <div className="flex items-center">
                          <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                          E-posta
                        </div>
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-white disabled:text-gray-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        <div className="flex items-center">
                          <PhoneIcon className="h-5 w-5 text-gray-400 mr-2" />
                          Telefon
                        </div>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-white disabled:text-gray-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Kişisel Bilgiler Kartı */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-4">Kişisel Bilgiler</h4>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                        <div className="flex items-center">
                          <UserCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
                          Ad
                        </div>
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        id="first_name"
                        value={profileData.first_name}
                        onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-white disabled:text-gray-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                        <div className="flex items-center">
                          <UserCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
                          Soyad
                        </div>
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        id="last_name"
                        value={profileData.last_name}
                        onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                        disabled={!isEditing}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-white disabled:text-gray-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false)
                      setProfileData({
                        first_name: auth.user?.first_name || '',
                        last_name: auth.user?.last_name || '',
                        email: auth.user?.email || '',
                        phone: auth.user?.phone || ''
                      })
                    }}
                    className="inline-flex justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Güncelleniyor...' : 'Kaydet'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Şifre Değiştirme Modal */}
      {showPasswordModal && (
        <Modal onClose={() => setShowPasswordModal(false)}>
          <div className="p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Şifre Değiştir
            </h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label htmlFor="old_password" className="block text-sm font-medium text-gray-700">
                  Mevcut Şifre
                </label>
                <input
                  type="password"
                  name="old_password"
                  id="old_password"
                  value={passwordData.old_password}
                  onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">
                  Yeni Şifre
                </label>
                <input
                  type="password"
                  name="new_password"
                  id="new_password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="new_password_confirmation" className="block text-sm font-medium text-gray-700">
                  Yeni Şifre (Tekrar)
                </label>
                <input
                  type="password"
                  name="new_password_confirmation"
                  id="new_password_confirmation"
                  value={passwordData.new_password_confirmation}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password_confirmation: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </PageContainer>
  )
}