'use client'

import { useEffect } from 'react'

export default function GlobalError({
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
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-red-600">Kritik Hata</h1>
            <h2 className="mt-4 text-2xl font-semibold text-gray-900">
              Uygulama Hatası
            </h2>
            <p className="mt-2 text-gray-600">
              Üzgünüz, uygulamada kritik bir hata oluştu.
            </p>
            <div className="mt-6">
              <button
                onClick={() => reset()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Tekrar Dene
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
} 