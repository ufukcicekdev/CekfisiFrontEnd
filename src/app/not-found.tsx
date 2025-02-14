'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-indigo-600">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-gray-900">Sayfa Bulunamadı</h2>
        <p className="mt-2 text-gray-600">Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  )
} 