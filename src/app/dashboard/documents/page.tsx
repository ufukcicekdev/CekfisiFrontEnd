'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from '@/lib/axios'
import Modal from '@/components/Modal'
import { XMarkIcon, ChevronDownIcon, ChevronUpIcon, EyeIcon, ArrowDownTrayIcon, TrashIcon } from '@heroicons/react/24/outline'
import { PageContainer } from '@/components/PageContainer'
import { toast } from 'react-hot-toast'
import { 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Box,
  ThemeProvider,
  createTheme
} from '@mui/material'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

// DOCUMENT_TYPES için type tanımı
type DocumentType = 'invoice' | 'receipt' | 'contract' | 'other'

// DOCUMENT_TYPES objesini type ile tanımlayalım
const DOCUMENT_TYPES: Record<DocumentType, string> = {
  invoice: 'Fatura',
  receipt: 'Fiş',
  contract: 'Sözleşme',
  other: 'Diğer'
}

interface Document {
  id: number
  document_type: DocumentType
  file: string
  date: string
  amount: number
  vat_rate: number
  status: string
  created_at: string
}

interface FilterOptions {
  year: string
  month: string
  documentType: string
}

interface DocumentResponse {
  id: number
  document_type: string
  file: string
  date: string
  amount: number
  vat_rate: number
  status: string
  created_at: string
  updated_at: string
}

interface DocumentModalProps {
  document: Document
  onClose: () => void
  onStatusChange?: (documentId: number, newStatus: string) => Promise<void>
  onEdit?: (documentId: number, data: FormData) => Promise<DocumentResponse>
  isAccountant?: boolean
  formatAmount: (amount: string | number | null) => string
  onUpdate?: (updatedDocument: Document) => void
}

const statusTypes = [
  { value: 'pending', label: 'Beklemede' },
  { value: 'processing', label: 'İşleniyor' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'rejected', label: 'Reddedildi' }
]

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

// Belge tipine göre finansal alanları gösterme kontrolü
const showFinancialDetails = (documentType: Document['document_type']) => {
  return documentType === 'invoice' || documentType === 'receipt'
}

const DocumentModal = ({ document, onClose, onStatusChange, onEdit, isAccountant = false, formatAmount, onUpdate }: DocumentModalProps) => {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    date: document.date,
    amount: document.amount,
    vat_rate: document.vat_rate,
    document_type: document.document_type,
    file: null as File | null
  })
  const [previewUrl, setPreviewUrl] = useState(document.file)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setEditData({ ...editData, file })
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleEdit = async () => {
    if (document.status === 'completed' || document.status === 'rejected') {
      toast.error('Tamamlanmış veya reddedilmiş belgelerde düzenleme yapılamaz')
      return
    }

    if (!onEdit) return
    setIsUpdating(true)

    try {
      const formData = new FormData()
      formData.append('date', editData.date)
      formData.append('amount', editData.amount?.toString() || '')
      formData.append('vat_rate', editData.vat_rate?.toString() || '')
      formData.append('document_type', editData.document_type)
      
      if (editData.file) {
        formData.append('file', editData.file)
      }

      const response = await onEdit(document.id, formData)
      if (response?.file) {
        setPreviewUrl(response.file)
        const updatedDocument: Document = {
          id: response.id,
          document_type: response.document_type as DocumentType,
          file: response.file,
          date: response.date,
          amount: response.amount,
          vat_rate: response.vat_rate,
          status: response.status as string,
          created_at: response.created_at
        }
        onUpdate?.(updatedDocument)
      }
      setIsEditing(false)
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Belge güncellenirken bir hata oluştu'
      toast.error(errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }

  // PDF görüntüleyici URL'si oluştur
  const getPdfViewerUrl = (fileUrl: string) => {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`
  }

  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {DOCUMENT_TYPES[document.document_type]}
            </h2>
            <div className="mt-1 space-y-1">
              {!isEditing ? (
                // Görüntüleme modu
                <>
                  {showFinancialDetails(document.document_type) && (
                    <>
                      <p className="text-sm text-gray-500">
                        Tutar: {document.amount?.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </p>
                      <p className="text-sm text-gray-500">
                        KDV Oranı: %{document.vat_rate}
                      </p>
                      <p className="text-sm text-gray-500">
                        KDV Tutarı: {((document.amount || 0) * (document.vat_rate || 0) / 100).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </p>
                      <p className="text-sm font-medium text-gray-700">
                        Toplam: {((document.amount || 0) * (1 + (document.vat_rate || 0) / 100)).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      </p>
                    </>
                  )}
                  <p className="text-sm text-gray-500">
                    Tarih: {format(new Date(document.date), 'd MMMM yyyy', { locale: tr })}
                  </p>
                  <p className="text-xs text-gray-400">
                    Yüklenme: {format(new Date(document.created_at), 'd MMMM yyyy', { locale: tr })}
                  </p>
                </>
              ) : (
                // Düzenleme modu
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Belge Tipi</label>
                    <select
                      value={editData.document_type}
                      onChange={(e) => setEditData({ ...editData, document_type: e.target.value as DocumentType })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      {Object.entries(DOCUMENT_TYPES).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  {showFinancialDetails(editData.document_type) && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Tutar</label>
                        <input
                          type="number"
                          value={editData.amount || ''}
                          onChange={(e) => setEditData({ ...editData, amount: parseFloat(e.target.value) })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">KDV Oranı (%)</label>
                        <input
                          type="number"
                          value={editData.vat_rate || ''}
                          onChange={(e) => setEditData({ ...editData, vat_rate: parseFloat(e.target.value) })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tarih</label>
                    <input
                      type="date"
                      value={editData.date}
                      onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Belge</label>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Düzenle
                </button>
                <button
                  onClick={() => {
                    const link = document.file.match(/\.(jpg|jpeg|png|gif)$/i) ? document.file : getPdfViewerUrl(document.file)
                    window.open(link, '_blank')
                  }}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  Görüntüle
                </button>
                <button
                  onClick={() => {
                    const link = document.file.match(/\.(jpg|jpeg|png|gif)$/i) ? document.file : getPdfViewerUrl(document.file)
                    const a = window.document.createElement('a')
                    a.href = link
                    a.download = document.file.split('/').pop() || 'belge'
                    a.click()
                    a.remove()
                  }}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  İndir
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEdit}
                  disabled={isUpdating}
                  className="flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isUpdating ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  İptal
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-gray-100 rounded-lg overflow-hidden">
          {document.file.match(/\.(jpg|jpeg|png|gif)$/i) ? (
            <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={document.file}
                alt="Belge"
                className="object-contain w-full h-full"
              />
            </div>
          ) : (
            <div className="h-[60vh] relative rounded-lg overflow-hidden">
              <iframe
                src={getPdfViewerUrl(document.file)}
                className="w-full h-full"
                style={{ border: 'none' }}
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            </div>
          )}
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

// Material UI teması
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

export default function DocumentsPage() {
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
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean,
    documentId: number | null
  }>({
    isOpen: false,
    documentId: null
  })

  // Yıl seçenekleri (son 5 yıl)
  const years = Array.from({ length: 5 }, (_, i) => 
    (new Date().getFullYear() - i).toString()
  )

  // Ay seçenekleri
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
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/v1/documents/')
      setDocuments(response.data.results)
    } catch (error) {
      console.error('Error fetching documents:', error)
      toast.error('Belgeler yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const filteredDocuments = documents.filter(doc => {
    const docDate = new Date(doc.date)
    const docYear = docDate.getFullYear().toString()
    const docMonth = (docDate.getMonth() + 1).toString()

    return (filters.year === '' || docYear === filters.year) &&
           (filters.month === '' || docMonth === filters.month) &&
           (filters.documentType === '' || doc.document_type === filters.documentType) &&
           (filters.status === '' || doc.status === filters.status)
  })

  const totalAmount = filteredDocuments.reduce((sum, doc) => {
    const amount = doc.amount ?? 0
    return sum + amount
  }, 0)

  const totalVat = filteredDocuments.reduce((sum, doc) => {
    const amount = doc.amount ?? 0
    const vatRate = doc.vat_rate ?? 0
    
    if (isNaN(amount) || isNaN(vatRate)) {
      return sum
    }
    
    return sum + (amount * vatRate / 100)
  }, 0)

  // Belge kartı/satırı için tutar formatlaması
  const formatAmount = (amount: string | number | null) => {
    if (amount === null || amount === undefined) {
      return '0,00'
    }

    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

    // NaN kontrolü
    if (isNaN(numAmount)) {
      return '0,00'
    }

    return numAmount.toLocaleString('tr-TR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })
  }

  const handleEditDocument = async (documentId: number, data: FormData) => {
    try {
      const response = await axios.patch(`/api/v1/documents/${documentId}/`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      await fetchDocuments()
      toast.success('Belge başarıyla güncellendi')
      return response.data  // Güncellenmiş belge verisini döndür
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Belge güncellenirken bir hata oluştu'
      toast.error(errorMessage)
      throw error
    }
  }

  const handleUpdateDocument = (updatedDocument: Document) => {
    setSelectedDocument(updatedDocument)  // Modal içindeki belgeyi güncelle
  }

  // Silme fonksiyonunu ekleyelim
  const handleDelete = async (documentId: number) => {
    try {
      await axios.delete(`/api/v1/documents/${documentId}/`)
      toast.success('Belge başarıyla silindi')
      // Belge listesini güncelle
      const updatedDocuments = filteredDocuments.filter(doc => doc.id !== documentId)
      setDocuments(updatedDocuments)
    } catch (error) {
      console.error('Belge silinirken hata:', error)
      toast.error('Belge silinemedi')
    }
  }

  return (
    <PageContainer>
      {/* Başlık ve Yeni Belge Butonu */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Belgelerim</h1>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/dashboard/documents/upload"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Yeni Belge Yükle
          </Link>
        </div>
      </div>

      {/* Özet ve Filtreler Kartı */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div 
          className="p-4 cursor-pointer"
          onClick={() => setShowFilters(!showFilters)}
        >
          {/* Her zaman görünen özet bilgisi */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Özet ve Filtreler</h2>
            <button className="text-gray-500 hover:text-gray-700">
              {showFilters ? (
                <ChevronUpIcon className="h-5 w-5" />
              ) : (
                <ChevronDownIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-gray-500 text-sm">Toplam Tutar</span>
              <p className="text-lg font-semibold text-gray-900">{formatAmount(totalAmount)}₺</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Toplam KDV</span>
              <p className="text-lg font-semibold text-gray-900">{formatAmount(totalVat)}₺</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Toplam Belge</span>
              <p className="text-lg font-semibold text-gray-900">{filteredDocuments.length}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Bekleyen Belge</span>
              <p className="text-lg font-semibold text-gray-900">
                {filteredDocuments.filter(doc => doc.status === 'pending' || doc.status === 'processing').length}
              </p>
            </div>
          </div>
        </div>

        {/* Açılır/Kapanır Filtre Bölümü */}
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
                    {Object.keys(DOCUMENT_TYPES).map(type => (
                      <MenuItem key={type} value={type}>
                        {DOCUMENT_TYPES[type as DocumentType]}
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
      <div className="bg-white shadow rounded-lg">
        {/* Desktop Tablo */}
        <div className="hidden lg:block">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Belge Türü
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutar
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    KDV
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.map((document) => (
                  <tr key={document.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {DOCUMENT_TYPES[document.document_type]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(document.date), 'd MMMM yyyy', { locale: tr })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatAmount(document.amount)}₺
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      %{document.vat_rate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        getStatusBadgeClass(document.status)
                      }`}>
                        {getStatusLabel(document.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => {
                            setSelectedDocument(document)
                            setShowDocumentModal(true)
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Görüntüle
                        </button>
                        {document.status !== 'completed' && (
                          <button
                            onClick={() => setDeleteConfirm({ isOpen: true, documentId: document.id })}
                            className="text-red-600 hover:text-red-900"
                          >
                            Sil
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Tablet ve Mobil için Kart Görünümü */}
        <div className="block lg:hidden">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              {filters.documentType || filters.year || filters.month || filters.status
                ? 'Filtrelere uygun belge bulunamadı'
                : 'Henüz belge yüklenmemiş'}
            </div>
          ) : (
            <div className="space-y-4 px-4">
              {filteredDocuments.map((document) => (
                <div key={document.id} className="bg-white shadow rounded-lg p-4">
                  {/* Belge Başlığı ve Durum */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {DOCUMENT_TYPES[document.document_type]}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {format(new Date(document.date), 'd MMMM yyyy', { locale: tr })}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      getStatusBadgeClass(document.status)
                    }`}>
                      {getStatusLabel(document.status)}
                    </span>
                  </div>

                  {/* Belge Detayları */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Tutar:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {formatAmount(document.amount)}₺
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">KDV:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        %{document.vat_rate}
                      </span>
                    </div>
                  </div>

                  {/* İşlemler */}
                  <div className="flex justify-end pt-2">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={(e) => {
                          e.preventDefault() // Link davranışını engelle
                          setSelectedDocument(document)
                          setShowDocumentModal(true)
                        }}
                        className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Görüntüle
                      </button>
                      {document.status !== 'completed' && (
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, documentId: document.id })}
                          className="inline-flex items-center text-sm font-medium text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Sil
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showDocumentModal && selectedDocument && (
        <DocumentModal
          document={selectedDocument}
          onClose={() => setShowDocumentModal(false)}
          onEdit={handleEditDocument}
          isAccountant={false}
          formatAmount={formatAmount}
          onUpdate={handleUpdateDocument}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <DeleteConfirmModal
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, documentId: null })}
          onConfirm={() => {
            if (deleteConfirm.documentId) {
              handleDelete(deleteConfirm.documentId)
              setDeleteConfirm({ isOpen: false, documentId: null })
            }
          }}
        />
      )}
    </PageContainer>
  )
}

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm }: {
  isOpen: boolean,
  onClose: () => void,
  onConfirm: () => void
}) => {
  if (!isOpen) return null

  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900">Belgeyi Sil</h3>
        <p className="mt-2 text-sm text-gray-500">
          Bu belgeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
        </p>
        <div className="mt-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Sil
          </button>
        </div>
      </div>
    </Modal>
  )
} 