'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import { PageContainer } from '@/components/PageContainer'
import { toast } from 'react-hot-toast'
import dynamic from 'next/dynamic'
import { createTheme } from '@mui/material/styles'
import { SelectChangeEvent } from '@mui/material/Select'
import { 
  validateFileSize, 
  formatFileSize, 
  MAX_FILE_SIZE,
  validateFileType,
  ACCEPTED_FILE_TYPES_STRING,
  getAcceptedFileTypesMessage 
} from '@/utils/fileUtils'

// Sadece bileşenleri dinamik olarak import et
const Select = dynamic(() => import('@mui/material/Select'), { ssr: false })
const MenuItem = dynamic(() => import('@mui/material/MenuItem'), { ssr: false })
const FormControl = dynamic(() => import('@mui/material/FormControl'), { ssr: false })
const InputLabel = dynamic(() => import('@mui/material/InputLabel'), { ssr: false })
const Box = dynamic(() => import('@mui/material/Box'), { ssr: false })
const ThemeProvider = dynamic(() => import('@mui/material/styles').then(mod => mod.ThemeProvider), { ssr: false })

// Önce DOCUMENT_TYPES objesini tanımlayalım
const DOCUMENT_TYPES = {
  invoice: 'Fatura',
  receipt: 'Fiş',
  contract: 'Sözleşme',
  other: 'Diğer'
} as const

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

// Form state için interface
interface FormData {
  document_type: keyof typeof DOCUMENT_TYPES | ''
  file: File | null
  date: string
  amount: string
  vat_rate: string
}

export default function UploadPage() {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    document_type: '',
    file: null,
    date: '',
    amount: '',
    vat_rate: ''
  })

  // Belge tipi değiştiğinde
  const handleDocumentTypeChange = (event: SelectChangeEvent<unknown>) => {
    const newType = event.target.value as keyof typeof DOCUMENT_TYPES
    setFormData({ ...formData, document_type: newType })
  }

  // Fatura veya fiş ise true döner
  const showFinancialFields = formData.document_type === 'invoice' || formData.document_type === 'receipt'

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

    setIsUploading(true)

    try {
      const formData = new FormData(form)
      
      // Content-Type header'ı otomatik olarak multipart/form-data olarak ayarlanacak
      await axios.post('/api/v1/documents/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      })
      
      toast.success('Belge başarıyla yüklendi')
      router.push('/dashboard/documents')
    } catch (error: any) {
      console.error('Belge yüklenirken hata:', error)
      const errorMessage = error.response?.data?.error || 'Belge yüklenemedi'
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Dosya boyutu kontrolü
      if (!validateFileSize(file)) {
        toast.error(`Dosya boyutu çok büyük. Maksimum dosya boyutu: ${formatFileSize(MAX_FILE_SIZE)}`)
        e.target.value = ''
        return
      }
      
      // Dosya tipi kontrolü
      if (!validateFileType(file)) {
        toast.error(getAcceptedFileTypesMessage())
        e.target.value = ''
        return
      }
    }
  }

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Yeni Belge Yükle</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <ThemeProvider theme={theme}>
              <FormControl fullWidth>
                <InputLabel>Belge Tipi</InputLabel>
                <Select
                  name="document_type"
                  value={formData.document_type}
                  label="Belge Tipi"
                  onChange={handleDocumentTypeChange}
                  required
                >
                  <MenuItem value="">Belge Tipi Seçin</MenuItem>
                  {Object.entries(DOCUMENT_TYPES).map(([value, label]) => (
                    <MenuItem key={value} value={value}>{label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </ThemeProvider>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tarih</label>
              <input
                type="date"
                name="date"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            {/* Tutar ve KDV alanları sadece fatura veya fiş seçiliyse gösterilir */}
            {showFinancialFields && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tutar</label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">KDV Oranı (%)</label>
                  <input
                    type="number"
                    name="vat_rate"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Belge</label>
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

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard/documents')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isUploading ? 'Yükleniyor...' : 'Yükle'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageContainer>
  )
} 