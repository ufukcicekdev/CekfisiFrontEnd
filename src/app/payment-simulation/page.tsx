'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'

export default function PaymentSimulation() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const amount = searchParams?.get('amount') ?? '0'
  const [loading, setLoading] = useState(false)

  const handlePayment = async (success: boolean) => {
    setLoading(true)
    
    if (success) {
      toast.success('Ödeme başarılı!')
      router.push('/dashboard')
    } else {
      toast.error('Ödeme başarısız')
      router.push('/dashboard/subscription')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">Ödeme Simülasyonu</h1>
        
        <div className="mb-8">
          <p className="text-gray-600">Ödenecek Tutar:</p>
          <p className="text-3xl font-bold text-indigo-600">{amount}₺</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handlePayment(true)}
            disabled={loading}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Ödemeyi Başarılı Simüle Et
          </button>

          <button
            onClick={() => handlePayment(false)}
            disabled={loading}
            className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Ödemeyi Başarısız Simüle Et
          </button>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>Test Kartı: 9792030394440796</p>
          <p>Son Kullanma: 12/26</p>
          <p>CVV: 000</p>
        </div>
      </div>
    </div>
  )
} 