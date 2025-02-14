'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // İsteğe bağlı: Hatayı bir hata izleme servisine gönder
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600">500</h1>
        <h2 className="mt-4 text-2xl font-semibold text-gray-900">Bir Hata Oluştu</h2>
        <p className="mt-2 text-gray-600">
          Üzgünüz, bir şeyler yanlış gitti. Lütfen daha sonra tekrar deneyin.
        </p>
        <div className="mt-6 space-x-4">
          <button
            onClick={() => reset()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Tekrar Dene
          </button>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 ring-1 ring-inset ring-indigo-200"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  )
} 