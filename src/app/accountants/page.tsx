'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from '@/lib/axios'
import Modal from '@/components/Modal'
import { 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  ThemeProvider,
  createTheme,
  SelectChangeEvent
} from '@mui/material'

// Theme tanımı
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

// Interface'i güncelleyelim
interface Accountant {
  id: number
  email: string
  first_name: string
  last_name: string
  address: string | null
  city: string | null
  district: string | null
  about: string | null
  experience_years: number
  title: string | null
  company_name: string | null
  phone: string
  website: string | null
  profile_image: string | null
  specializations: string[]
  rating: number
  review_count: number
}

interface City {
  id: number
  name: string
}

interface District {
  id: number
  name: string
}

export default function AccountantsPage() {
  const [accountants, setAccountants] = useState<Accountant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [cities, setCities] = useState<City[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [selectedAccountant, setSelectedAccountant] = useState<Accountant | null>(null)

  useEffect(() => {
    const fetchAccountants = async () => {
      try {
        const response = await axios.get('/api/v1/accountants/')
        // API yanıtı düzeltildi
        setAccountants(response.data.data || [])
      } catch (error) {
        console.error('Mali müşavirler yüklenirken hata:', error)
        setAccountants([])
      } finally {
        setLoading(false)
      }
    }

    fetchAccountants()
  }, [])

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

  // handleCityChange fonksiyonunu güncelleyelim
  const handleCityChange = async (event: SelectChangeEvent) => {
    const cityId = event.target.value
    setSelectedCity(cityId)
    
    if (cityId) {
      try {
        const response = await axios.get(`/api/v1/cities/${cityId}/districts/`)
        setDistricts(response.data)
      } catch (error) {
        console.error('İlçeler yüklenirken hata:', error)
      }
    } else {
      setDistricts([])
    }
  }

  // Profil popup'ı
  const AccountantProfileModal = ({ accountant, onClose }: { accountant: Accountant, onClose: () => void }) => {
    const [cityName, setCityName] = useState<string>('')
    const [districtName, setDistrictName] = useState<string>('')

    useEffect(() => {
      const fetchLocationDetails = async () => {
        if (accountant.city) {
          try {
            // Şehir bilgisini al
            const cityResponse = await axios.get(`/api/v1/cities/`)
            const cities = cityResponse.data
            const city = cities.find((c: City) => c.id.toString() === accountant.city)
            if (city) {
              setCityName(city.name)
              
              // İlçe bilgisini al
              if (accountant.district) {
                const districtResponse = await axios.get(`/api/v1/cities/${accountant.city}/districts/`)
                const districts = districtResponse.data
                const district = districts.find((d: District) => d.id.toString() === accountant.district)
                if (district) {
                  setDistrictName(district.name)
                }
              }
            }
          } catch (error) {
            console.error('Lokasyon bilgileri alınamadı:', error)
          }
        }
      }

      fetchLocationDetails()
    }, [accountant])

    return (
      <Modal onClose={onClose}>
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-200">
              {accountant.profile_image ? (
                <img
                  src={accountant.profile_image}
                  alt={`${accountant.first_name} ${accountant.last_name}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-600 text-xl">
                  {accountant.first_name[0]}
                  {accountant.last_name[0]}
                </div>
              )}
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {accountant.first_name} {accountant.last_name}
              </h2>
              {accountant.title && (
                <p className="text-gray-600">{accountant.title}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {accountant.about && (
              <div>
                <h3 className="text-sm font-medium text-gray-900">Hakkında</h3>
                <p className="mt-1 text-sm text-gray-500">{accountant.about}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Deneyim</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {accountant.experience_years} Yıl
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900">İletişim</h3>
                <p className="mt-1 text-sm text-gray-500">{accountant.phone}</p>
                {accountant.email && (
                  <p className="text-sm text-gray-500">{accountant.email}</p>
                )}
                {accountant.website && (
                  <a href={accountant.website} target="_blank" rel="noopener noreferrer" 
                     className="text-sm text-indigo-600 hover:text-indigo-800">
                    Website
                  </a>
                )}
              </div>

              {accountant.company_name && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Firma</h3>
                  <p className="mt-1 text-sm text-gray-500">{accountant.company_name}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-900">Konum</h3>
                <div className="mt-1 text-sm text-gray-500">
                  {cityName && <p>{cityName}</p>}
                  {districtName && <p>{districtName}</p>}
                  {accountant.address && <p className="mt-1">{accountant.address}</p>}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900">Değerlendirme</h3>
              <div className="mt-1 flex items-center">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`h-5 w-5 ${i < Math.round(accountant.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="ml-2 text-sm text-gray-500">
                    ({accountant.review_count} değerlendirme)
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </Modal>
    )
  }

  // Kart içindeki şehir gösterimi
  const AccountantCard = ({ accountant }: { accountant: Accountant }) => {
    const [cityName, setCityName] = useState<string>('')

    useEffect(() => {
      const fetchCityName = async () => {
        if (accountant.city) {
          try {
            const city = cities.find(c => c.id.toString() === accountant.city)
            if (city) {
              setCityName(city.name)
            }
          } catch (error) {
            console.error('Şehir bilgisi alınamadı:', error)
          }
        }
      }

      fetchCityName()
    }, [accountant.city])

    return (
      <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
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
            <div className="flex items-center text-sm text-gray-500">
              {accountant.experience_years > 0 && (
                <span className="mr-4">{accountant.experience_years} Yıl Deneyim</span>
              )}
              {cityName && (
                <span>{cityName}</span>
              )}
            </div>
            
            {accountant.about && (
              <p className="mt-2 text-sm text-gray-500 line-clamp-3">
                {accountant.about}
              </p>
            )}

            <div className="mt-2 flex items-center">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`h-4 w-4 ${i < Math.round(accountant.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="ml-2 text-sm text-gray-500">
                  ({accountant.review_count} değerlendirme)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={() => setSelectedAccountant(accountant)}
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Profili İncele
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Filtreleme fonksiyonunu güncelleyelim
  const filteredAccountants = accountants.filter(accountant => {
    const matchesSearch = searchTerm === '' || 
      `${accountant.first_name} ${accountant.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      accountant.specializations?.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // Şehir filtrelemesi
    const matchesCity = selectedCity === '' || accountant.city === selectedCity

    return matchesSearch && matchesCity
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="font-bold text-xl text-indigo-600">
              Çek Fişi
            </Link>
            <div className="flex items-center space-x-4">
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
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mali Müşavirler</h1>
            <p className="mt-2 text-sm text-gray-600">
              Uzman mali müşavirlerle tanışın ve işletmenizi büyütün
            </p>
          </div>
        </div>

        {/* Arama ve Filtreleme */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <input
              type="text"
              placeholder="İsim veya uzmanlık alanı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <ThemeProvider theme={theme}>
            <FormControl fullWidth size="small">
              <InputLabel id="city-select-label">Şehir</InputLabel>
              <Select
                labelId="city-select-label"
                id="city-select"
                value={selectedCity}
                label="Şehir"
                onChange={handleCityChange}
              >
                <MenuItem value="">
                  <em>Tüm Şehirler</em>
                </MenuItem>
                {cities.map(city => (
                  <MenuItem key={city.id} value={city.id.toString()}>
                    {city.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </ThemeProvider>
        </div>

        {/* Mali Müşavirler Listesi */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredAccountants.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAccountants.map((accountant) => (
              <AccountantCard key={accountant.id} accountant={accountant} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {selectedCity 
                ? 'Seçilen şehirde mali müşavir bulunamadı.' 
                : 'Henüz mali müşavir bulunmamaktadır.'}
            </p>
          </div>
        )}
      </main>

      {/* Modal'ı render et */}
      {selectedAccountant && (
        <AccountantProfileModal
          accountant={selectedAccountant}
          onClose={() => setSelectedAccountant(null)}
        />
      )}
    </div>
  )
} 