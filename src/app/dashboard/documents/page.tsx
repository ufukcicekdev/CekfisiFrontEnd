'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from '@/lib/axios'
import Modal from '@/components/Modal'
import { XMarkIcon, ChevronDownIcon, ChevronUpIcon, EyeIcon } from '@heroicons/react/24/outline'
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

interface Document {
  id: number
  document_type: string
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
  formatAmount: (amount: string | number) => string
  onUpdate?: (updatedDocument: Document) => void
}

const documentTypes = [
  { value: 'invoice', label: 'Fatura' },
  { value: 'receipt', label: 'Fiş' },
  { value: 'expense', label: 'Gider Pusulası' },
  { value: 'contract', label: 'Sözleşme' },
  { value: 'other', label: 'Diğer' }
]

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
    if (document.status === 'processed') {
      toast.error('İşlenmiş belgelerde düzenleme yapılamaz')
      return
    }

    if (!onEdit) return
    setIsUpdating(true)

    try {
      const formData = new FormData()
      formData.append('date', editData.date)
      formData.append('amount', editData.amount.toString())
      formData.append('vat_rate', editData.vat_rate.toString())
      formData.append('document_type', editData.document_type)
      
      if (editData.file) {
        formData.append('file', editData.file)
      }

      const response = await onEdit(document.id, formData)
      if (response?.file) {
        setPreviewUrl(response.file)
        const updatedDocument: Document = {
          id: response.id,
          document_type: response.document_type,
          file: response.file,
          date: response.date,
          amount: response.amount,
          vat_rate: response.vat_rate,
          status: response.status,
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
        <div className="mb-4">
          {isEditing ? (
            // Düzenleme Formu
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Belge Türü</label>
                <select
                  value={editData.document_type}
                  onChange={(e) => setEditData({ ...editData, document_type: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  disabled={document.status === 'processed'}
                >
                  {documentTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tarih</label>
                <input
                  type="date"
                  value={editData.date}
                  onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  disabled={document.status === 'processed'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tutar</label>
                <input
                  type="number"
                  value={editData.amount}
                  onChange={(e) => setEditData({ ...editData, amount: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  disabled={document.status === 'processed'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">KDV Oranı (%)</label>
                <input
                  type="number"
                  value={editData.vat_rate}
                  onChange={(e) => setEditData({ ...editData, vat_rate: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  disabled={document.status === 'processed'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Belge</label>
                <div className="mt-1 flex items-center">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    className="sr-only"
                    id="file-upload"
                    disabled={document.status === 'processed'}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Dosya Seç
                  </label>
                  <span className="ml-3 text-sm text-gray-500">
                    {editData.file?.name || 'Mevcut dosya kullanılacak'}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Dosya Önizleme</label>
                <div className="mt-4">
                  {previewUrl && (
                    previewUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                      <img
                        src={previewUrl}
                        alt="Belge önizleme"
                        className="max-h-48 rounded-lg"
                      />
                    ) : (
                      <div className="p-4 bg-gray-100 rounded-lg">
                        <p className="text-sm text-gray-600">PDF dosyası seçildi</p>
                      </div>
                    )
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  onClick={handleEdit}
                  disabled={isUpdating || document.status === 'processed'}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          ) : (
            // Görüntüleme Modu
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Tarih</p>
                <p className="font-medium">{new Date(document.date).toLocaleDateString('tr-TR')}</p>
              </div>
              <div>
                <p className="text-gray-500">Tutar</p>
                <p className="font-medium">{formatAmount(document.amount)}₺</p>
              </div>
              <div>
                <p className="text-gray-500">KDV</p>
                <p className="font-medium">%{document.vat_rate}</p>
              </div>
              <div>
                <p className="text-gray-500">Durum</p>
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                  document.status === 'processed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {document.status === 'processed' ? 'İşlendi' : 'Bekliyor'}
                </span>
              </div>
              {document.status !== 'processed' && (
                <div className="col-span-2 flex justify-end">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    Düzenle
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Belge Görüntüleyici */}
        <div className="mt-6">
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
      setDocuments(response.data)
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
    const amount = typeof doc.amount === 'string' ? parseFloat(doc.amount) : doc.amount
    return sum + amount
  }, 0)

  const totalVat = filteredDocuments.reduce((sum, doc) => {
    const amount = typeof doc.amount === 'string' ? parseFloat(doc.amount) : doc.amount
    const vatRate = typeof doc.vat_rate === 'string' ? parseFloat(doc.vat_rate) : doc.vat_rate
    return sum + (amount * vatRate / 100)
  }, 0)

  // Belge kartı/satırı için tutar formatlaması
  const formatAmount = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
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
                {filteredDocuments.filter(doc => doc.status === 'pending').length}
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
                    <MenuItem value="pending">Bekliyor</MenuItem>
                    <MenuItem value="processed">İşlendi</MenuItem>
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
                      {documentTypes.find(t => t.value === document.document_type)?.label}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(document.date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatAmount(document.amount)}₺
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      %{document.vat_rate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        document.status === 'processed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {document.status === 'processed' ? 'İşlendi' : 'Bekliyor'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedDocument(document)
                          setShowDocumentModal(true)
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Görüntüle
                      </button>
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
                        {documentTypes.find(t => t.value === document.document_type)?.label}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(document.date).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      document.status === 'processed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {document.status === 'processed' ? 'İşlendi' : 'Bekliyor'}
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
    </PageContainer>
  )
} 