export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  user_type: string
  phone: string
  profile_image?: string  // Profil resmi URL'i ekleyelim
  // Accountant'a özel alanlar
  title?: string
  experience_years?: number
  company_name?: string
  website?: string
  address?: string
  city?: number
  district?: number
  about?: string
  specializations?: string[]
  tax_number?: string
  identity_number?: string
  company_type?: 'individual' | 'limited' | 'incorporated' | 'other'
  company_title?: string
  // Client'a özel alanlar
} 