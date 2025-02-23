// Maksimum dosya boyutu (15MB)
export const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB in bytes

export const validateFileSize = (file: File): boolean => {
  if (file.size > MAX_FILE_SIZE) {
    return false
  }
  return true
}

// Boyutu formatla (MB cinsinden göster)
export const formatFileSize = (bytes: number): string => {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// Kabul edilen dosya tipleri
export const ACCEPTED_FILE_TYPES = {
  // PDF
  'application/pdf': '.pdf',
  // Word
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  // Images
  'image/jpeg': '.jpg,.jpeg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp'
} as const

// Profil resmi için kabul edilen tipler
export const ACCEPTED_IMAGE_TYPES = {
  'image/jpeg': '.jpg,.jpeg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp'
} as const

// Accept attribute için stringler
export const ACCEPTED_FILE_TYPES_STRING = Object.values(ACCEPTED_FILE_TYPES).join(',')
export const ACCEPTED_IMAGE_TYPES_STRING = Object.values(ACCEPTED_IMAGE_TYPES).join(',')

// Dosya tipi kontrolü
export const validateFileType = (file: File, acceptedTypes = ACCEPTED_FILE_TYPES): boolean => {
  return Object.keys(acceptedTypes).includes(file.type)
}

// Hata mesajları
export const getAcceptedFileTypesMessage = (): string => {
  return 'Kabul edilen dosya tipleri: PDF, Word (.doc, .docx), Resim (.jpg, .jpeg, .png, .gif, .webp)'
}

export const getAcceptedImageTypesMessage = (): string => {
  return 'Lütfen geçerli bir resim dosyası seçin (JPG, PNG, GIF, WEBP)'
} 