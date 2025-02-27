'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import Modal from '@/components/Modal'
import { toast } from 'react-hot-toast'
import { EyeIcon, CheckCircleIcon, ClockIcon, ChevronDownIcon, ChevronUpIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline'
import { PageContainer } from '@/components/PageContainer'
import { 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Box
} from '@mui/material'
import { ThemeProvider, createTheme } from '@mui/material/styles'

interface ReceiptDetails {
  seller_name: string
  date: string
  total_amount: number
  vat_amount: number
  items: Array<{
    name: string
    quantity: number
    unit_price: number
  }>
}

interface Document {
  id: number
  document_type: string
  file: string
  date: string
  amount: number
  vat_rate: number
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  created_at: string
  updated_at: string
  receipt_details?: ReceiptDetails
}

interface Client {
  id: number
  email: string
  first_name: string
  last_name: string
  phone: string
}

interface PaginatedResponse {
  count: number
  next: string | null
  previous: string | null
  results: Document[]
}

const documentTypes = [
  { value: 'invoice', label: 'Fatura' },
  { value: 'receipt', label: 'Fiş' },
  { value: 'expense', label: 'Gider Pusulası' },
  { value: 'contract', label: 'Sözleşme' },
  { value: 'other', label: 'Diğer' }
]

const statusTypes = [
  { value: 'pending', label: 'Beklemede' },
  { value: 'processing', label: 'İşleniyor' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'rejected', label: 'Reddedildi' }
]

interface DocumentModalProps {
  document: Document
  onClose: () => void
  onStatusChange?: (documentId: number, newStatus: 'pending' | 'processing' | 'completed' | 'rejected') => Promise<void>
  onUpdateDocument?: (documentId: number, payload: { amount: number, vat_rate: number }) => Promise<Document>
  isAccountant?: boolean
}

const DocumentModal = ({ document, onClose, onStatusChange, onUpdateDocument, isAccountant = false }: DocumentModalProps) => {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedValues, setEditedValues] = useState({
    amount: document.amount?.toString() || '',
    vat_rate: document.vat_rate?.toString() || ''
  })

  useEffect(() => {
    setEditedValues({
      amount: document.amount?.toString() || '',
      vat_rate: document.vat_rate?.toString() || ''
    })
  }, [document])

  const getStatusLabel = (status: string) => {
    return statusTypes.find(s => s.value === status)?.label || status
  }

  // PDF görüntüleyici URL'si oluştur
  const getPdfViewerUrl = (fileUrl: string) => {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`
  }

  // Dosya tipini kontrol et
  const getFileType = (fileUrl: string) => {
    const extension = fileUrl.split('.').pop()?.toLowerCase()
    if (!extension) return 'unknown'

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return 'image'
    }
    if (['pdf'].includes(extension)) {
      return 'pdf'
    }
    if (['doc', 'docx'].includes(extension)) {
      return 'word'
    }
    if (['xls', 'xlsx'].includes(extension)) {
      return 'excel'
    }
    return 'other'
  }

  const renderDocument = () => {
    const fileType = getFileType(document.file)

    switch (fileType) {
      case 'image':
        return (
          <img
            src={document.file}
            alt="Belge"
            className="w-full h-auto max-h-[70vh] object-contain"
          />
        )
      
      case 'pdf':
        return (
          <iframe
            src={getPdfViewerUrl(document.file)}
            className="w-full h-[70vh]"
            frameBorder="0"
            title="PDF Görüntüleyici"
          />
        )
      
      case 'word':
      case 'excel':
      case 'other':
        return (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              Bu dosya türü tarayıcıda görüntülenemiyor.
            </p>
            <a
              href={document.file}
              download
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Dosyayı İndir
            </a>
          </div>
        )
      
      default:
        return (
          <div className="text-center py-8 text-gray-500">
            Dosya görüntülenemiyor
          </div>
        )
    }
  }

  const handleStatusChange = async (newStatus: 'pending' | 'processing' | 'completed' | 'rejected') => {
    if (!onStatusChange) return
    setIsUpdating(true)
    try {
      await onStatusChange(document.id, newStatus)
      toast.success(`Belge başarıyla ${getStatusLabel(newStatus)} olarak işaretlendi`)
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Belge durumu güncellenirken bir hata oluştu'
      toast.error(errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleEditSubmit = async () => {
    if (!onUpdateDocument) return

    setIsUpdating(true)
    try {
      const payload = {
        amount: parseFloat(editedValues.amount),
        vat_rate: parseFloat(editedValues.vat_rate),
        receipt_details: document.document_type === 'receipt' ? {
          ...document.receipt_details,
          total_amount: parseFloat(editedValues.amount),
          vat_amount: parseFloat(editedValues.vat_rate)
        } : undefined
      }

      await onUpdateDocument(document.id, payload)
      setIsEditing(false)
    } catch (error) {
      console.error('Belge güncellenirken hata:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-4xl mx-auto p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {documentTypes.find(t => t.value === document.document_type)?.label}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Kapat</span>
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Belge Detayları */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {/* Fiş detayları */}
          {document.document_type === 'receipt' && document.receipt_details && (
            <>
              <div>
                <p className="text-gray-500">Satıcı</p>
                <p className="font-medium">{document.receipt_details.seller_name}</p>
              </div>
              <div>
                <p className="text-gray-500">Fiş Tarihi</p>
                <p className="font-medium">{document.receipt_details.date}</p>
              </div>
              <div>
                <p className="text-gray-500">Toplam Tutar</p>
                {isEditing ? (
                  <input
                    type="number"
                    value={editedValues.amount}
                    onChange={(e) => setEditedValues(prev => ({ ...prev, amount: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    step="0.01"
                  />
                ) : (
                  <p className="font-medium">{document.amount.toLocaleString('tr-TR')}₺</p>
                )}
              </div>
              <div>
                <p className="text-gray-500">KDV Oranı</p>
                {isEditing ? (
                  <input
                    type="number"
                    value={editedValues.vat_rate}
                    onChange={(e) => setEditedValues(prev => ({ ...prev, vat_rate: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    step="0.01"
                  />
                ) : (
                  <p className="font-medium">%{document.vat_rate}</p>
                )}
              </div>
            </>
          )}

          {/* Diğer belge tipleri için normal görünüm */}
          {document.document_type !== 'receipt' && (
            <>
              <div>
                <p className="text-gray-500">Tarih</p>
                <p className="font-medium">{new Date(document.date).toLocaleDateString('tr-TR')}</p>
              </div>
              <div>
                <p className="text-gray-500">Tutar</p>
                {isEditing ? (
                  <input
                    type="number"
                    value={editedValues.amount}
                    onChange={(e) => setEditedValues(prev => ({ ...prev, amount: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    step="0.01"
                  />
                ) : (
                  <p className="font-medium">{document?.amount?.toLocaleString('tr-TR')}₺</p>
                )}
              </div>
              <div>
                <p className="text-gray-500">KDV</p>
                {isEditing ? (
                  <input
                    type="number"
                    value={editedValues.vat_rate}
                    onChange={(e) => setEditedValues(prev => ({ ...prev, vat_rate: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    step="0.01"
                  />
                ) : (
                  <p className="font-medium">%{document?.vat_rate}</p>
                )}
              </div>
            </>
          )}

          {/* Durum seçici her belge tipi için gösterilecek */}
          <div>
            <FormControl size="small" sx={{ width: '100%', minWidth: { xs: '100%', sm: 200 } }}>
              <InputLabel>Durum</InputLabel>
              <Select
                value={document.status}
                label="Durum"
                onChange={(e) => handleStatusChange(e.target.value as 'pending' | 'processing' | 'completed' | 'rejected')}
                disabled={isUpdating}
              >
                {statusTypes.map(status => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          {/* Düzenleme Butonları - Tüm belge tipleri için göster */}
          {isAccountant && (
            <div className="col-span-2 flex justify-end space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    disabled={isUpdating}
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleEditSubmit}
                    className="px-3 py-1 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700"
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Düzenle
                </button>
              )}
            </div>
          )}
        </div>

        {/* Belge Görüntüleyici */}
        <div className="mt-4 bg-gray-100 rounded-lg overflow-hidden">
          {renderDocument()}
        </div>

        {/* İndirme butonu */}
        <div className="mt-4 flex justify-end">
          <a
            href={document.file}
            download
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Belgeyi İndir
          </a>
        </div>
      </div>
    </Modal>
  )
}

interface Filters {
  year: string
  month: string
  documentType: string
  status: string
}

// Material UI temasını özelleştir
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

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    year: new Date().getFullYear().toString(),
    month: '',
    documentType: '',
    status: ''
  })
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)

  const years = Array.from({ length: 5 }, (_, i) => 
    (new Date().getFullYear() - i).toString()
  )

  const months = [
    { value: '1', label: 'Ocak' },
    { value: '2', label: 'Şubat' },
    { value: '3', label: 'Mart' },
    { value: '4', label: 'Nisan' },
    { value: '5', label: 'Mayıs' },
    { value: '6', label: 'Haziran' },
    { value: '7', label: 'Temmuz' },
    { value: '8', label: 'Ağustos' },
    { value: '9', label: 'Eylül' },
    { value: '10', label: 'Ekim' },
    { value: '11', label: 'Kasım' },
    { value: '12', label: 'Aralık' }
  ]

  useEffect(() => {
    if (params?.id) {
      fetchClientDocuments()
    }
  }, [params?.id])

  const fetchClientDocuments = async () => {
    try {
      const response = await axios.get(`/api/v1/accountants/${params.id}/documents/`)
      setDocuments(response.data)
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDocuments = documents?.filter(doc => {
    if (!doc) return false
    
    const docDate = new Date(doc.date)
    const docYear = docDate.getFullYear().toString()
    const docMonth = (docDate.getMonth() + 1).toString()

    return (filters.year === '' || docYear === filters.year) &&
           (filters.month === '' || docMonth === filters.month) &&
           (filters.documentType === '' || doc.document_type === filters.documentType) &&
           (filters.status === '' || doc.status === filters.status)
  }) || []

  const totalAmount = filteredDocuments?.reduce((sum, doc) => sum + Number(doc.amount), 0) || 0
  const totalVat = filteredDocuments?.reduce((sum, doc) => {
    const amount = Number(doc.amount)
    const vatRate = Number(doc.vat_rate)
    return sum + (amount * vatRate / 100)
  }, 0) || 0

  const handleStatusChange = async (documentId: number, newStatus: string) => {
    try {
      await axios.post(`/api/v1/documents/process/${documentId}/`, {
        status: newStatus
      })
      await fetchClientDocuments()
    } catch (error) {
      console.error('Error changing document status:', error)
      throw error
    }
  }

  const handleDeleteClient = async () => {
    if (!confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      await axios.delete(`/api/v1/accountants/${params.id}/remove_client/`)
      router.push('/dashboard/clients')
      toast.success('Müşteri başarıyla silindi')
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error('Müşteri silinirken bir hata oluştu')
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    return statusTypes.find(s => s.value === status)?.label || status
  }

  const startChat = async () => {
    try {
      const response = await axios.post('/api/v1/chat/rooms/create/', {
        client_id: parseInt(params.id)
      })
      router.push(`/dashboard/messages?room=${response.data.id}`)
    } catch (error) {
      toast.error('Sohbet başlatılırken bir hata oluştu')
    }
  }

  // Belge güncelleme fonksiyonu
  const handleUpdateDocument = async (documentId: number, payload: { amount: number, vat_rate: number }) => {
    try {
      const response = await axios.patch(`/api/v1/accountants/${params.id}/documents/${documentId}/`, payload)
      
      // Belgeleri güncelle
      const updatedDoc = response.data
      setDocuments(documents.map(doc => 
        doc.id === documentId ? updatedDoc : doc
      ))
      
      // Seçili belgeyi de güncelle
      setSelectedDocument(updatedDoc)

      toast.success('Belge başarıyla güncellendi')
      return updatedDoc
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Belge güncellenirken bir hata oluştu'
      toast.error(errorMessage)
      throw error
    }
  }

  return (
    <PageContainer>
      {/* Müşteri Başlığı */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {client?.first_name} {client?.last_name}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{client?.email}</p>
        </div>
        <button
          onClick={startChat}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <ChatBubbleLeftIcon className="h-5 w-5 mr-2" />
          Mesaj Gönder
        </button>
      </div>

      {/* Filtreler ve Özet */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div 
          className="p-4 flex justify-between items-center cursor-pointer"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Filtreler ve Özet</h2>
              <button className="text-gray-500 hover:text-gray-700">
                {showFilters ? (
                  <ChevronUpIcon className="h-5 w-5" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            {/* Her zaman görünen özet bilgisi */}
            <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Toplam Tutar:</span>
                <span className="ml-2 font-medium">{totalAmount.toFixed(2)}₺</span>
              </div>
              <div>
                <span className="text-gray-500">Toplam KDV:</span>
                <span className="ml-2 font-medium">{totalVat.toFixed(2)}₺</span>
              </div>
            </div>
          </div>
        </div>

        {/* Açılır kapanır filtre bölümü */}
        {showFilters && (
          <div className="p-4 border-t">
            <ThemeProvider theme={theme}>
              <Box className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormControl fullWidth>
                  <InputLabel>Yıl</InputLabel>
                  <Select
                    value={filters.year}
                    label="Yıl"
                    onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                  >
                    <MenuItem value="">Tüm Yıllar</MenuItem>
                    {years.map(year => (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Ay</InputLabel>
                  <Select
                    value={filters.month}
                    label="Ay"
                    onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                  >
                    <MenuItem value="">Tüm Aylar</MenuItem>
                    {months.map(month => (
                      <MenuItem key={month.value} value={month.value}>
                        {month.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Belge Tipi</InputLabel>
                  <Select
                    value={filters.documentType}
                    label="Belge Tipi"
                    onChange={(e) => setFilters({ ...filters, documentType: e.target.value })}
                  >
                    <MenuItem value="">Tümü</MenuItem>
                    {documentTypes.map(type => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                <InputLabel>Durum</InputLabel>
                  <Select
                    value={filters.status}
                    label="Durum"
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  >
                    <MenuItem value="">Tümü</MenuItem>
                    {statusTypes.map(status => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </ThemeProvider>
          </div>
        )}
      </div>

      {/* Belgeler Listesi */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Desktop Tablo */}
        <div className="hidden md:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                  Belge Türü
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Tarih
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Tutar
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  KDV
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Durum
                </th>
                <th className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                  <span className="sr-only">İşlemler</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.map((document) => (
                <tr key={document.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                    {documentTypes.find(t => t.value === document.document_type)?.label || document.document_type}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {new Date(document.date).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {document?.amount?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    %{document?.vat_rate}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      getStatusBadgeClass(document.status)
                    }`}>
                      {getStatusLabel(document.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <button
                      onClick={() => {
                        setSelectedDocument(document)
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Görüntüle"
                    >
                      <EyeIcon className="h-5 w-5" />
                      <span className="sr-only">Görüntüle</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobil Kart Görünümü */}
        <div className="md:hidden">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Henüz belge yüklenmemiş
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {documentTypes.find(t => t.value === doc.document_type)?.label || doc.document_type}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        {new Date(doc.date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      getStatusBadgeClass(doc.status)
                    }`}>
                      {getStatusLabel(doc.status)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Tutar:</span>
                      <span className="ml-1 font-medium">{doc.amount}₺</span>
                    </div>
                    <div>
                      <span className="text-gray-500">KDV:</span>
                      <span className="ml-1 font-medium">%{doc.vat_rate}</span>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setSelectedDocument(doc)
                      }}
                      className="inline-flex items-center text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      <EyeIcon className="h-5 w-5" />
                      <span className="sr-only">Görüntüle</span>
                    </button>
                    {doc.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange(doc.id, 'processed')}
                        className="text-green-600 hover:text-green-900 text-sm font-medium"
                      >
                        İşle
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Belge Görüntüleme Modalı */}
      {selectedDocument && (
        <DocumentModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onStatusChange={handleStatusChange}
          onUpdateDocument={handleUpdateDocument}
          isAccountant={true}
        />
      )}
    </PageContainer>
  )
} 