'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from '@/lib/axios'
import { PageContainer } from '@/components/PageContainer'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import ConfirmModal from '@/components/ConfirmModal'
import { toast } from 'react-hot-toast'
import { Dialog } from '@headlessui/react'
import { UserPlusIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { PlusIcon } from '@heroicons/react/24/outline'
import AddClientModal from '@/components/AddClientModal'
import { 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel 
} from '@mui/material';
import { useAuth } from '@/contexts/auth'

interface Client {
  id: number
  email: string
  first_name: string
  last_name: string
  phone: string
  pending_documents_count: number // Backend'den gelecek
  total_documents_count: number // Backend'den gelecek
  last_activity: string | null
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: ''
  })
  const router = useRouter()
  const { user } = useAuth();

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await axios.get('/accountants/clients/')
      setClients(response.data)
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast.error('Müşteriler yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // Filtreleme fonksiyonu
  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase()
    return (
      client.first_name.toLowerCase().includes(searchLower) ||
      client.last_name.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower) ||
      client.phone.includes(searchTerm)
    )
  })

  // Sayfalama
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage)
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleDeleteClick = (clientId: number) => {
    setSelectedClientId(clientId)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedClientId) return

    try {
      await axios.delete(`/api/v1/accountants/${selectedClientId}/remove_client/`)
      toast.success('Müşteri başarıyla silindi')
      // Listeyi yenile
      fetchClients()
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error('Müşteri silinirken bir hata oluştu')
    } finally {
      setDeleteModalOpen(false)
      setSelectedClientId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await axios.post('/api/v1/accountants/add_client/', formData)
      toast.success('Müşteri başarıyla eklendi')
      setShowAddModal(false)
      fetchClients() // Listeyi yenile
      setFormData({ email: '', first_name: '', last_name: '', phone: '' }) // Formu temizle
    } catch (error: any) {
      if (error.response?.data?.redirect_to_subscription) {
        toast.error(error.response.data.error)
        router.push('/dashboard/subscription')
      } else {
        toast.error(error.response?.data?.error || 'Bir hata oluştu')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (documentId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/documents/${documentId}/update-status/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Durumu güncelle ve kullanıcıya bildir
        toast.success('Belge durumu güncellendi');
        // Client listesini yenile
        fetchClients();
      }
    } catch (error) {
      toast.error('Belge durumu güncellenirken bir hata oluştu');
    }
  };

  return (
    <PageContainer>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Müşterilerim</h1>
          <p className="mt-2 text-sm text-gray-700">
            Tüm müşterilerinizi buradan yönetebilirsiniz
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Yeni Müşteri Ekle
        </button>
      </div>

      {/* Tek Arama Bölümü */}
      <div className="mt-4">
        <div className="relative rounded-md shadow-sm max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Müşteri ara..."
          />
        </div>
      </div>

      {/* Tablo - Sadece Desktop */}
      <div className="hidden md:block mt-8 overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    Ad Soyad
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Email
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Telefon
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Bekleyen Belgeler
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Son İşlem
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">İşlemler</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : paginatedClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-gray-500">
                      {searchTerm ? 'Aranan kriterlere uygun müşteri bulunamadı' : 'Henüz müşteri bulunmuyor'}
                    </td>
                  </tr>
                ) : (
                  paginatedClients.map((client) => (
                    <tr key={client.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {client.first_name} {client.last_name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {client.email}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {client.phone || '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {client.pending_documents_count || 0}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {client.last_activity ? new Date(client.last_activity).toLocaleDateString('tr-TR') : '-'}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Link
                          href={`/dashboard/clients/${client.id}`}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Detay
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(client.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Kart Görünümü - Sadece Mobil */}
      <div className="md:hidden mt-4 space-y-4">
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : paginatedClients.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            {searchTerm ? 'Aranan kriterlere uygun müşteri bulunamadı' : 'Henüz müşteri bulunmuyor'}
          </div>
        ) : (
          paginatedClients.map((client) => (
            <div key={client.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-4">
                {/* Müşteri Başlığı */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 font-medium text-sm">
                        {client.first_name[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        {client.first_name} {client.last_name}
                      </h3>
                      <p className="text-sm text-gray-500">{client.email}</p>
                    </div>
                  </div>
                </div>

                {/* Müşteri Detayları */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-500">Telefon</p>
                    <p className="font-medium">{client.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Bekleyen Belgeler</p>
                    <p className="font-medium">{client.pending_documents_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Son İşlem</p>
                    <p className="font-medium">
                      {client.last_activity ? 
                        new Date(client.last_activity).toLocaleDateString('tr-TR') 
                        : '-'}
                    </p>
                  </div>
                </div>

                {/* Butonlar */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Link
                    href={`/dashboard/clients/${client.id}`}
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    Detay
                  </Link>
                  <button
                    onClick={() => handleDeleteClick(client.id)}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    Sil
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modalları düzelt */}
      <div className="relative z-50">
        <AddClientModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchClients()
          }}
        />

        <ConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Müşteriyi Sil"
          message="Bu müşteriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        />
      </div>
    </PageContainer>
  )
} 