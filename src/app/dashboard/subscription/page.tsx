'use client'

import { useState, useEffect } from 'react'
import axios from '@/lib/axios'
import { PageContainer } from '@/components/PageContainer'
import { CheckIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface Plan {
  id: number
  name: string
  plan_type: 'free' | 'trial' | 'paid'
  base_price: number
  base_client_limit: number
  price_per_extra_client: number
  description: string
  trial_days?: number
  is_active: boolean
}

interface Subscription {
  id: number
  plan: {
    name: string
    price: number
  }
  status: string
  client_limit: number
  current_client_count: number
  remaining_client_limit: number
  days_left: number | null
  start_date: string
  end_date: string | null
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClients, setSelectedClients] = useState<{ [key: number]: number }>({})

  const fetchSubscription = async () => {
    try {
      const response = await axios.get('/api/v1/subscriptions/')
      setSubscription(response.data)
    } catch (error) {
      console.error('Error fetching subscription:', error)
      toast.error('Abonelik bilgileri yüklenirken bir hata oluştu')
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await axios.get('/api/v1/subscription-plans/')
      setPlans(response.data)
    } catch (error) {
      console.error('Error fetching plans:', error)
      toast.error('Plan bilgileri yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscription()
    fetchPlans()
  }, [])

  const calculatePrice = (plan: Plan, clientCount: number) => {
    const baseFee = plan.base_price; // 800
    const extraClients = Math.max(0, clientCount - plan.base_client_limit);
    const extraClientsFee = extraClients * plan.price_per_extra_client; // örn: 6 × 40 = 240
    
    return baseFee + extraClientsFee; // örn: 800 + 240 = 1040
  }

  const formatPrice = (price: number) => {
    return `${price}₺/ay`;
  }

  const handleSelectPlan = async (planId: number) => {
    try {
      const response = await axios.post('/api/v1/subscriptions/', {
        plan_id: planId,
        client_count: selectedClients[planId] || plans.find(p => p.id === planId)?.base_client_limit
      })
      
      if (response.data.iframe_url) {
        window.location.href = response.data.iframe_url
      }
      
      await fetchSubscription()
      toast.success('Plan başarıyla seçildi')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Bir hata oluştu')
    }
  }

  return (
    <PageContainer>
      {/* Mevcut Abonelik - Responsive Grid */}
      {subscription && (
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Mevcut Abonelik</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <p className="text-sm text-gray-500">Plan</p>
              <p className="font-medium">{subscription.plan.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Müşteri Kullanımı</p>
              <p className="font-medium">
                {subscription.current_client_count} / {subscription.client_limit}
              </p>
            </div>
            {subscription.days_left !== null && (
              <div>
                <p className="text-sm text-gray-500">Kalan Süre</p>
                <p className="font-medium">{subscription.days_left} gün</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Plan Listesi - Responsive Grid */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4 sm:mb-6">Abonelik Planları</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="border rounded-lg p-4 sm:p-6 flex flex-col">
              {/* Plan Başlığı ve Fiyat */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <div className="mb-2 sm:mb-0">
                  <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                </div>
                <div className="w-full sm:w-auto text-left sm:text-right">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {formatPrice(calculatePrice(plan, selectedClients[plan.id] || plan.base_client_limit))}
                  </p>
                </div>
              </div>

              {/* Müşteri Bilgileri */}

              {/* Plan Seçme Butonu */}
              <button
                onClick={() => handleSelectPlan(plan.id)}
                className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Bu Planı Seç
              </button>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  )
} 