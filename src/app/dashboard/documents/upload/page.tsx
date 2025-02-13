'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'
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

const documentTypes = [
  { value: 'invoice', label: 'Fatura' },
  { value: 'receipt', label: 'Fiş' },
  { value: 'expense', label: 'Gider Pusulası' },
  { value: 'contract', label: 'Sözleşme' },
  { value: 'other', label: 'Diğer' }
]

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

export default function UploadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    document_type: '',
    file: null as File | null,
    date: '',
    amount: '',
    vat_rate: ''
  })

  // Fatura veya fiş ise true döner
  const showFinancialFields = ['invoice', 'receipt'].includes(formData.document_type)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.file || !formData.document_type) {
      toast.error('Lütfen gerekli alanları doldurun')
      return
    }

    setLoading(true)
    const submitData = new FormData()
    submitData.append('document_type', formData.document_type)
    submitData.append('file', formData.file)
    submitData.append('date', formData.date || new Date().toISOString().split('T')[0])

    // Sadece fatura veya fiş ise tutar ve KDV bilgilerini ekle
    if (showFinancialFields) {
      submitData.append('amount', formData.amount)
      submitData.append('vat_rate', formData.vat_rate)
    }

    try {
      await axios.post('/api/v1/documents/', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      toast.success('Belge başarıyla yüklendi')
      router.push('/dashboard/documents')
    } catch (error: any) {
      const message = error.response?.data?.error || 'Belge yüklenirken bir hata oluştu'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Yeni Belge Yükle</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <ThemeProvider theme={theme}>
              <FormControl fullWidth>
                <InputLabel>Belge Türü</InputLabel>
                <Select
                  value={formData.document_type}
                  label="Belge Türü"
                  onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                  required
                >
                  {documentTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </ThemeProvider>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tarih</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {/* Tutar ve KDV alanları sadece fatura veya fiş seçiliyse gösterilir */}
            {showFinancialFields && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tutar</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">KDV Oranı (%)</label>
                  <input
                    type="number"
                    value={formData.vat_rate}
                    onChange={(e) => setFormData({ ...formData, vat_rate: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Belge</label>
              <input
                type="file"
                onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                accept="image/*,.pdf"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Yükleniyor...' : 'Yükle'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageContainer>
  )
} 