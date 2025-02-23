'use client'

import { useState, useEffect } from 'react'
import { PageContainer } from '@/components/PageContainer'
import axios from '@/lib/axios'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { DocumentIcon, DocumentArrowUpIcon, TrashIcon, EyeIcon, ArrowDownTrayIcon, XMarkIcon, ShareIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/Modal'
import { 
  validateFileSize, 
  formatFileSize, 
  MAX_FILE_SIZE,
  validateFileType,
  ACCEPTED_FILE_TYPES_STRING,
  getAcceptedFileTypesMessage 
} from '@/utils/fileUtils'

interface ClientDocument {
  id: number
  title: string
  description?: string
  document_type: 'identity' | 'signature' | 'tax' | 'statement' | 'other'
  file: string
  expiry_date?: string
  created_at: string
}

const DOCUMENT_TYPES = {
  identity: 'Kimlik Fotokopisi',
  signature: 'İmza Sirküleri',
  tax: 'Vergi Levhası',
  statement: 'Beyanname',
  other: 'Diğer'
}

interface DocumentViewerProps {
  document: ClientDocument
  onClose: () => void
}

const DocumentViewer = ({ document, onClose }: DocumentViewerProps) => {
  // PDF görüntüleyici URL'si oluştur
  const getPdfViewerUrl = (fileUrl: string) => {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`
  }

  // Dosya uzantısını kontrol et - webp formatını ekleyelim
  const isImage = document.file.match(/\.(jpg|jpeg|png|gif|webp)$/i)

  // Dosya tipini kontrol et
  const isPdf = document.file.toLowerCase().endsWith('.pdf')

  const handleDownload = async () => {
    try {
      // Doğru endpoint'e istek at
      const response = await axios.get(`/api/v1/client-documents/${document.id}/download/`, {
        responseType: 'blob'
      })

      // Dosya adını al
      const fileName = document.file.split('/').pop() || document.title

      // Blob'u indir
      const blob = new Blob([response.data])
      const downloadUrl = window.URL.createObjectURL(blob)
      
      // window.document kullanarak DOM işlemlerini yap
      const link = window.document.createElement('a')
      link.href = downloadUrl
      link.download = fileName
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      toast.success('Dosya indiriliyor...')
    } catch (error) {
      console.error('Dosya indirilirken hata:', error)
      toast.error('Dosya indirilemedi')
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{document.title}</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              İndir
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Kapat</span>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="bg-gray-100 rounded-lg overflow-hidden">
          {isImage ? (
            <img
              src={document.file}
              alt={document.title}
              className="w-full h-auto max-h-[70vh] object-contain"
            />
          ) : isPdf ? (
            <iframe
              src={getPdfViewerUrl(document.file)}
              className="w-full h-[70vh]"
              frameBorder="0"
            />
          ) : (
            <div className="flex items-center justify-center h-[70vh]">
              <p className="text-gray-500">
                Bu dosya türü önizleme için desteklenmiyor. Lütfen indirin.
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
}

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title }: DeleteConfirmModalProps) => {
  if (!isOpen) return null

  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">Belgeyi Sil</h3>
          <p className="mt-2 text-sm text-gray-500">
            &quot;{title}&quot; belgesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </p>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
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

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  documentUrl: string
  title: string
}

const ShareModal = ({ isOpen, onClose, documentUrl, title }: ShareModalProps) => {
  if (!isOpen) return null

  // Web Share API desteğini kontrol et
  const isShareSupported = typeof navigator !== 'undefined' && 'share' in navigator

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(documentUrl)
      toast.success('Bağlantı kopyalandı')
    } catch (error) {
      toast.error('Bağlantı kopyalanamadı')
    }
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: title,
        text: `${title} belgesi`,
        url: documentUrl
      })
    } catch (error) {
      console.error('Paylaşım hatası:', error)
      toast.error('Paylaşım yapılamadı')
    }
  }

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`${title} belgesi`)
    const body = encodeURIComponent(`${title} belgesi: ${documentUrl}`)
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`${title} belgesi: ${documentUrl}`)
    window.open(`https://wa.me/?text=${text}`)
  }

  return (
    <Modal onClose={onClose}>
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">Belgeyi Paylaş</h3>
          <p className="mt-2 text-sm text-gray-500">
            &quot;{title}&quot; belgesini paylaşmak için bir yöntem seçin
          </p>
        </div>

        <div className="space-y-4">
          {/* Native Paylaşım Butonu - düzeltilmiş kontrol */}
          {isShareSupported && (
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              <ShareIcon className="h-5 w-5 mr-2" />
              Paylaş
            </button>
          )}

          {/* WhatsApp Paylaşım */}
          <button
            onClick={handleWhatsAppShare}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            WhatsApp ile Paylaş
          </button>

          {/* Email Paylaşım */}
          <button
            onClick={handleEmailShare}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            E-posta ile Paylaş
          </button>

          {/* Bağlantı Kopyalama */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Veya bağlantıyı kopyalayın
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={documentUrl}
                readOnly
                className="flex-1 p-2 text-sm border rounded-md bg-gray-50"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Kopyala
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<ClientDocument[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<ClientDocument | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    documentId: number | null
    title: string
  }>({
    isOpen: false,
    documentId: null,
    title: ''
  })
  const [shareModal, setShareModal] = useState<{
    isOpen: boolean
    documentUrl: string
    title: string
  }>({
    isOpen: false,
    documentUrl: '',
    title: ''
  })
  const [editData, setEditData] = useState<{
    document_type?: string
    title?: string
    file?: File | null
    expiry_date?: string
    description?: string
  }>({})
  const [previewUrl, setPreviewUrl] = useState<string>('')

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await axios.get('/api/v1/client-documents/')
      if (response.data.status === 'success') {
        setDocuments(response.data.data)
      } else {
        setDocuments([])
      }
    } catch (error) {
      console.error('Belgeler yüklenirken hata:', error)
      toast.error('Belgeler yüklenemedi')
      setDocuments([])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!validateFileSize(file)) {
        toast.error(`Dosya boyutu çok büyük. Maksimum dosya boyutu: ${formatFileSize(MAX_FILE_SIZE)}`)
        e.target.value = ''
        return
      }

      if (!validateFileType(file)) {
        toast.error(getAcceptedFileTypesMessage())
        e.target.value = ''
        return
      }

      setEditData(prev => ({ ...prev, file }))
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const form = e.target as HTMLFormElement
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement
    const file = fileInput?.files?.[0]

    if (file) {
      if (!validateFileSize(file)) {
        toast.error(`Dosya boyutu çok büyük. Maksimum dosya boyutu: ${formatFileSize(MAX_FILE_SIZE)}`)
        return
      }

      if (!validateFileType(file)) {
        toast.error(getAcceptedFileTypesMessage())
        return
      }
    }

    if (documents.length >= 10) {
      toast.error('Maksimum 10 belge yükleyebilirsiniz')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      
      // Form elemanlarının değerlerini doğru şekilde al
      const documentType = (form.querySelector('[name="document_type"]') as HTMLSelectElement).value
      const title = (form.querySelector('[name="title"]') as HTMLInputElement).value
      const expiryDate = (form.querySelector('[name="expiry_date"]') as HTMLInputElement).value
      const description = (form.querySelector('[name="description"]') as HTMLTextAreaElement).value

      // FormData'ya değerleri ekle
      formData.append('document_type', documentType)
      formData.append('title', title)
      if (file) {
        formData.append('file', file)
      }
      if (expiryDate) {
        formData.append('expiry_date', expiryDate)
      }
      if (description) {
        formData.append('description', description)
      }

      await axios.post('/api/v1/client-documents/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      await fetchDocuments()
      toast.success('Belge başarıyla yüklendi')
      form.reset()
      setShowUploadForm(false)
    } catch (error: any) {
      console.error('Belge yüklenirken hata:', error)
      const errorMessage = error.response?.data?.error || 'Belge yüklenemedi'
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (documentId: number) => {
    setIsDeleting(true)
    try {
      await axios.delete(`/api/v1/client-documents/${documentId}/`)
      await fetchDocuments()
      toast.success('Belge başarıyla silindi')
      setDeleteConfirm({ isOpen: false, documentId: null, title: '' })
    } catch (error) {
      console.error('Belge silinirken hata:', error)
      toast.error('Belge silinemedi')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Dökümanlarım</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Toplam {documents.length}/10 belge
                </p>
              </div>
              {!showUploadForm && documents.length < 10 && (
                <button
                  onClick={() => setShowUploadForm(true)}
                  className="w-full sm:w-auto flex justify-center items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                  Yeni Belge Yükle
                </button>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {showUploadForm && (
              <form onSubmit={handleSubmit} className="mb-6 space-y-4 bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Belge Tipi</label>
                    <select
                      name="document_type"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      {Object.entries(DOCUMENT_TYPES).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Başlık</label>
                    <input
                      type="text"
                      name="title"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dosya</label>
                    <input
                      type="file"
                      name="file"
                      required
                      onChange={handleFileChange}
                      accept={ACCEPTED_FILE_TYPES_STRING}
                      className="mt-1 block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-indigo-50 file:text-indigo-700
                        hover:file:bg-indigo-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Geçerlilik Tarihi</label>
                    <input
                      type="date"
                      name="expiry_date"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Açıklama</label>
                  <textarea
                    name="description"
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowUploadForm(false)}
                    className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isUploading ? 'Yükleniyor...' : 'Yükle'}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start space-x-3 mb-4 sm:mb-0">
                      <DocumentIcon className="h-6 w-6 flex-shrink-0 text-gray-400" />
                      <div>
                        <h3 className="font-medium text-gray-900">{doc.title}</h3>
                        <p className="text-sm text-gray-500">{DOCUMENT_TYPES[doc.document_type]}</p>
                        {doc.expiry_date && (
                          <p className="text-sm text-gray-500">
                            Son Geçerlilik: {format(new Date(doc.expiry_date), 'd MMMM yyyy', { locale: tr })}
                          </p>
                        )}
                        {doc.description && (
                          <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                      <button
                        onClick={() => setSelectedDocument(doc)}
                        className="flex items-center px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Görüntüle
                      </button>
                      <button
                        onClick={() => setShareModal({
                          isOpen: true,
                          documentUrl: doc.file,
                          title: doc.title
                        })}
                        className="flex items-center px-3 py-1.5 text-sm text-green-600 hover:text-green-800"
                      >
                        <ShareIcon className="h-4 w-4 mr-1" />
                        Paylaş
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({
                          isOpen: true,
                          documentId: doc.id,
                          title: doc.title
                        })}
                        disabled={isDeleting}
                        className="flex items-center px-3 py-1.5 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Sil
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Belge Yok</h3>
                  <p className="mt-1 text-sm text-gray-500">Henüz hiç belge yüklenmemiş.</p>
                  {!showUploadForm && (
                    <div className="mt-6">
                      <button
                        onClick={() => setShowUploadForm(true)}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                      >
                        <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                        Yeni Belge Yükle
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}

      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, documentId: null, title: '' })}
        onConfirm={() => deleteConfirm.documentId && handleDelete(deleteConfirm.documentId)}
        title={deleteConfirm.title}
      />

      <ShareModal
        isOpen={shareModal.isOpen}
        onClose={() => setShareModal({ isOpen: false, documentUrl: '', title: '' })}
        documentUrl={shareModal.documentUrl}
        title={shareModal.title}
      />
    </PageContainer>
  )
} 