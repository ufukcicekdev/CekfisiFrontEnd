'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from '@/lib/axios'
import Link from 'next/link'

export default function VerifyEmail({ params }: { params: { token: string } }) {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // POST ve body yerine, GET ve URL'de key parametresi
        const response = await axios.get(`/api/v1/auth/verify-email/${params.token}/`)
        
        setStatus('success')
        setMessage('E-posta adresiniz başarıyla doğrulandı.')
        setTimeout(() => {
          router.push('/auth/login/accountant')
        }, 3000)
      } catch (error: any) {
        setStatus('error')
        setMessage(error.response?.data?.detail || 'E-posta doğrulama işlemi başarısız oldu.')
      }
    }

    if (params.token) {
      verifyEmail()
    }
  }, [params.token, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                E-posta Doğrulanıyor...
              </h2>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                Doğrulama Başarılı
              </h2>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                Doğrulama Başarısız
              </h2>
            </>
          )}

          <p className="mt-2 text-sm text-gray-600">{message}</p>

          <div className="mt-6">
            <Link
              href="/auth/login/accountant"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 