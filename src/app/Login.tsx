'use client'

import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-180px)]">
      <div className="w-full max-w-md space-y-8 p-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Giriş Yap
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Hesap tipinizi seçin
          </p>
        </div>

        <div className="mt-10 space-y-4">
          <Link
            href="/auth/login/accountant"
            className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-6 py-4 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Mali Müşavir Girişi
          </Link>
          <Link
            href="/auth/login/client"
            className="group relative flex w-full justify-center rounded-md bg-white px-6 py-4 text-sm font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-200 hover:ring-indigo-300 hover:bg-gray-50"
          >
            Mükellef Girişi
          </Link>
        </div>
      </div>
    </div>
  )
} 