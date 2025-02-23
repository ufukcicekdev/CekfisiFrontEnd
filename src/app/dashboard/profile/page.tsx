'use client'

import { useState, useEffect } from 'react'
import { PageContainer } from '@/components/PageContainer'
import { useAuth } from '@/contexts/auth'
import axios from '@/lib/axios'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import Modal from '@/components/Modal'
import { UserCircleIcon, PhoneIcon, EnvelopeIcon, KeyIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Box,
  ThemeProvider,
  createTheme
} from '@mui/material'
import { SelectChangeEvent } from '@mui/material'
import { validateFileSize, formatFileSize, MAX_FILE_SIZE } from '@/utils/fileUtils'

// Yeni interface'ler
interface ClientDocument {
  id: number
  title: string
  description?: string
  document_type: 'identity' | 'signature' | 'tax' | 'statement' | 'other'
  file: string
  expiry_date?: string
  created_at: string
}

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  user_type: string
  phone: string
  tax_number?: string
  identity_number?: string
  company_type?: 'individual' | 'limited' | 'incorporated' | 'other'
  company_title?: string
  company_name?: string
  city?: number
  district?: string
  address?: string
  website?: string
  specializations?: string[]
  about?: string
  profile_image?: string
  title?: string
  experience_years?: number
  created_at?: string
  updated_at?: string
}

// COMPANY_TYPES objesini de type-safe yapalım
const COMPANY_TYPES: Record<NonNullable<User['company_type']>, string> = {
  individual: 'Şahıs',
  limited: 'Limited Şirket',
  incorporated: 'Anonim Şirket',
  other: 'Diğer'
}

const DOCUMENT_TYPES = {
  identity: 'Kimlik Fotokopisi',
  signature: 'İmza Sirküleri',
  tax: 'Vergi Levhası',
  statement: 'Beyanname',
  other: 'Diğer'
}

// Tema tanımlayalım
const theme = createTheme({
  palette: {
    primary: {
      main: '#4F46E5', // Indigo-600
    },
  },
  components: {
    MuiSelect: {
      styleOverrides: {
        root: {
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#4F46E5',
          },
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          '&.Mui-focused': {
            color: '#4F46E5',
          },
        },
      },
    },
  },
})

// Profil resmi için sadece resim dosyalarını kabul et
const ACCEPTED_IMAGE_TYPES = {
  'image/jpeg': '.jpg,.jpeg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp'
}

const ACCEPTED_IMAGE_TYPES_STRING = Object.values(ACCEPTED_IMAGE_TYPES).join(',')

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  })
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    new_password_confirmation: ''
  })
  const [cities, setCities] = useState<Array<{id: number, name: string}>>([])
  const [districts, setDistricts] = useState<Array<{id: number, name: string}>>([])
  const [selectedCity, setSelectedCity] = useState<number | null>(user?.city || null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [openSection, setOpenSection] = useState<string | null>('basic')
  const [formData, setFormData] = useState({
    district: user?.district || '',
    company_type: user?.company_type || ''
  })

  // Şehirleri yükle
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await axios.get('/api/v1/cities/')
        setCities(response.data)
      } catch (error) {
        console.error('Şehirler yüklenirken hata:', error)
      }
    }

    fetchCities()
  }, [])

  // Sayfa yüklendiğinde kullanıcının şehri varsa ilçeleri yükle
  useEffect(() => {
    const fetchInitialDistricts = async () => {
      if (user?.city) {
        try {
          const response = await axios.get(`/api/v1/cities/${user.city}/districts/`)
          setDistricts(response.data)
        } catch (error) {
          console.error('İlçeler yüklenirken hata:', error)
        }
      }
    }

    fetchInitialDistricts()
  }, [user?.city]) // user.city değiştiğinde tekrar çalışsın

  // Şehir seçildiğinde ilçeleri güncelle
  const handleCityChange = async (e: SelectChangeEvent<unknown>) => {
    const cityId = e.target.value as number
    setSelectedCity(cityId)
    
    // Şehir seçimi temizlendiyse ilçeleri temizle
    if (!cityId) {
      setDistricts([])
      return
    }

    // Yeni şehir için ilçeleri yükle
    try {
      const response = await axios.get(`/api/v1/cities/${cityId}/districts/`)
      setDistricts(response.data)
    } catch (error) {
      console.error('İlçeler yüklenirken hata:', error)
      toast.error('İlçeler yüklenemedi')
    }
  }

  // Profil resmi yükleme kontrolü
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Dosya boyutu kontrolü
      if (!validateFileSize(file)) {
        toast.error(`Dosya boyutu çok büyük. Maksimum dosya boyutu: ${formatFileSize(MAX_FILE_SIZE)}`)
        e.target.value = ''
        return
      }

      // Resim tipi kontrolü
      if (!Object.keys(ACCEPTED_IMAGE_TYPES).includes(file.type)) {
        toast.error('Lütfen geçerli bir resim dosyası seçin (JPG, PNG, GIF, WEBP)')
        e.target.value = ''
        return
      }

      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
    }
  }

  // Form gönderme işlemini güncelle
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Form verilerini al
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    
    // Profil resmi seçilmişse ekle, seçilmemişse formData'dan kaldır
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement
    if (!fileInput?.files?.length) {
      formData.delete('profile_image')
    }

    // Specializations array olarak gönder
    const specializations = formData.get('specializations')
    if (specializations) {
      formData.delete('specializations')
      formData.append('specializations', JSON.stringify(specializations.toString().split(',').map(s => s.trim())))
    }

    try {
      await axios.patch('/api/v1/users/profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      await refreshUser()
      toast.success('Profil başarıyla güncellendi')
      setIsEditing(false)
    } catch (error) {
      console.error('Profil güncellenirken hata:', error)
      toast.error('Profil güncellenemedi')
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      toast.error('Yeni şifreler eşleşmiyor')
      return
    }

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
    }
  }

  // İlçe seçimi için handler ekleyelim
  const handleDistrictChange = (e: SelectChangeEvent<unknown>) => {
    setFormData(prev => ({
      ...prev,
      district: e.target.value as string
    }))
  }

  // Firma türü seçimi için handler ekleyelim
  const handleCompanyTypeChange = (e: SelectChangeEvent<unknown>) => {
    setFormData(prev => ({
      ...prev,
      company_type: e.target.value as string
    }))
  }

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profil Formu */}
        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Profil Başlığı ve Resim */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col items-center">
              {/* Profil resmi sadece accountant için gösterilsin */}
              {user?.user_type === 'accountant' && (
                <div className="relative mb-4">
                  <img
                    src={imagePreview || user?.profile_image || '/default-avatar.png'}
                    alt="Profil resmi"
                    className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-2 cursor-pointer hover:bg-indigo-700">
                      <input
                        type="file"
                        name="profile_image"
                        onChange={handleImageChange}
                        className="sr-only"
                        accept={ACCEPTED_IMAGE_TYPES_STRING}
                      />
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </label>
                  )}
                </div>
              )}
              <h1 className="text-2xl font-semibold text-gray-900">
                {user?.first_name} {user?.last_name}
              </h1>
              <p className="text-gray-500">{user?.email}</p>
            </div>
            <div className="flex justify-end mt-4">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Düzenle
                </button>
              ) : null}
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Temel Bilgiler */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Ad</label>
                <input
                  type="text"
                  name="first_name"
                  defaultValue={user?.first_name}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Soyad</label>
                <input
                  type="text"
                  name="last_name"
                  defaultValue={user?.last_name}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Telefon</label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={user?.phone}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Müşteriye Özel Alanlar */}
            {user?.user_type === 'client' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">VKN</label>
                    <input
                      type="text"
                      name="tax_number"
                      maxLength={11}
                      defaultValue={user?.tax_number}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">TCKN</label>
                    <input
                      type="text"
                      name="identity_number"
                      maxLength={11}
                      defaultValue={user?.identity_number}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <ThemeProvider theme={theme}>
                      <FormControl fullWidth>
                        <InputLabel>Firma Türü</InputLabel>
                        <Select
                          name="company_type"
                          value={formData.company_type}
                          label="Firma Türü"
                          onChange={handleCompanyTypeChange}
                          disabled={!isEditing}
                        >
                          {Object.entries(COMPANY_TYPES).map(([value, label]) => (
                            <MenuItem key={value} value={value}>{label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </ThemeProvider>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Firma Ünvanı</label>
                    <input
                      type="text"
                      name="company_title"
                      defaultValue={user?.company_title}
                      disabled={!isEditing}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Mali Müşavire Özel Alanlar */}
            {user?.user_type === 'accountant' && (
              <div className="space-y-4">
                {/* Temel Bilgiler Accordion */}
                <div className="border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenSection(openSection === 'basic' ? null : 'basic')}
                    className="w-full px-4 py-3 bg-gray-50 flex justify-between items-center hover:bg-gray-100"
                  >
                    <span className="font-medium text-gray-800">Temel Bilgiler</span>
                    <ChevronDownIcon 
                      className={`w-5 h-5 transition-transform ${openSection === 'basic' ? 'transform rotate-180' : ''}`}
                    />
                  </button>
                  {openSection === 'basic' && (
                    <div className="p-4 bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Ünvan</label>
                          <input
                            type="text"
                            name="title"
                            defaultValue={user?.title}
                            disabled={!isEditing}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Deneyim (Yıl)</label>
                          <input
                            type="number"
                            name="experience_years"
                            defaultValue={user?.experience_years}
                            disabled={!isEditing}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Firma Bilgileri Accordion */}
                <div className="border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenSection(openSection === 'company' ? null : 'company')}
                    className="w-full px-4 py-3 bg-gray-50 flex justify-between items-center hover:bg-gray-100"
                  >
                    <span className="font-medium text-gray-800">Firma Bilgileri</span>
                    <ChevronDownIcon 
                      className={`w-5 h-5 transition-transform ${openSection === 'company' ? 'transform rotate-180' : ''}`}
                    />
                  </button>
                  {openSection === 'company' && (
                    <div className="p-4 bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Firma Adı</label>
                          <input
                            type="text"
                            name="company_name"
                            defaultValue={user?.company_name}
                            disabled={!isEditing}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Website</label>
                          <input
                            type="url"
                            name="website"
                            defaultValue={user?.website}
                            disabled={!isEditing}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Adres Bilgileri Accordion */}
                <div className="border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenSection(openSection === 'address' ? null : 'address')}
                    className="w-full px-4 py-3 bg-gray-50 flex justify-between items-center hover:bg-gray-100"
                  >
                    <span className="font-medium text-gray-800">Adres Bilgileri</span>
                    <ChevronDownIcon 
                      className={`w-5 h-5 transition-transform ${openSection === 'address' ? 'transform rotate-180' : ''}`}
                    />
                  </button>
                  {openSection === 'address' && (
                    <div className="p-4 bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ThemeProvider theme={theme}>
                          <FormControl fullWidth>
                            <InputLabel>Şehir</InputLabel>
                            <Select
                              name="city"
                              value={selectedCity || ''}
                              label="Şehir"
                              onChange={(e) => handleCityChange(e)}
                              disabled={!isEditing}
                            >
                              <MenuItem value="">Şehir Seçin</MenuItem>
                              {cities.map(city => (
                                <MenuItem key={city.id} value={city.id}>
                                  {city.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          <FormControl fullWidth>
                            <InputLabel>İlçe</InputLabel>
                            <Select
                              name="district"
                              value={formData.district}
                              label="İlçe"
                              onChange={handleDistrictChange}
                              disabled={!isEditing || !selectedCity}
                            >
                              <MenuItem value="">İlçe Seçin</MenuItem>
                              {districts.map(district => (
                                <MenuItem key={district.id} value={district.id}>
                                  {district.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </ThemeProvider>

                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Açık Adres</label>
                          <textarea
                            name="address"
                            rows={3}
                            defaultValue={user?.address}
                            disabled={!isEditing}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Uzmanlık ve Hakkımda Accordion */}
                <div className="border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenSection(openSection === 'expertise' ? null : 'expertise')}
                    className="w-full px-4 py-3 bg-gray-50 flex justify-between items-center hover:bg-gray-100"
                  >
                    <span className="font-medium text-gray-800">Uzmanlık ve Hakkımda</span>
                    <ChevronDownIcon 
                      className={`w-5 h-5 transition-transform ${openSection === 'expertise' ? 'transform rotate-180' : ''}`}
                    />
                  </button>
                  {openSection === 'expertise' && (
                    <div className="p-4 bg-white space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Uzmanlık Alanları</label>
                        <input
                          type="text"
                          name="specializations"
                          defaultValue={user?.specializations?.join(', ')}
                          disabled={!isEditing}
                          placeholder="Örn: Vergi Danışmanlığı, Muhasebe, Finansal Planlama"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Hakkımda</label>
                        <textarea
                          name="about"
                          rows={4}
                          defaultValue={user?.about}
                          disabled={!isEditing}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Kaydet/İptal Butonları */}
            {isEditing && (
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Kaydet
                </button>
              </div>
            )}
          </div>
        </form>
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
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Şifreyi Değiştir
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </PageContainer>
  )
}