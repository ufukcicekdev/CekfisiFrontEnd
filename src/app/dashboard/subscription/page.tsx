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
  features?: string[]
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
      setLoading(true)
      const response = await axios.get('/api/v1/subscription-plans/')
      setPlans(response.data.results)
    } catch (error) {
      console.error('Error fetching plans:', error)
      toast.error('Abonelik planları yüklenirken bir hata oluştu')
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

      {/* Plan Listesi */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4 sm:mb-6">Abonelik Planları</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : plans.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className="border rounded-lg p-4 sm:p-6 flex flex-col">
                {/* Plan Başlığı ve Fiyat */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-500">{plan.description}</p>
                  </div>
                  <div className="mt-2 sm:mt-0 text-right">
                    <p className="text-2xl font-bold text-gray-900">{Number(plan.base_price).toLocaleString('tr-TR')}₺</p>
                    <p className="text-sm text-gray-500">/ay</p>
                    <p className="text-xs text-gray-500">
                      {plan.base_client_limit} müşteri dahil
                      {plan.price_per_extra_client && (
                        <span className="block">
                          Ek müşteri: {Number(plan.price_per_extra_client)}₺/ay
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Özellikler Listesi */}
                {plan.features && plan.features.length > 0 && (
                  <ul className="space-y-3 flex-grow">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="h-5 w-5 text-green-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="ml-2 text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Plan Tipi ve Durum */}
                <div className="mt-4 mb-6">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${plan.plan_type === 'paid' ? 'bg-green-100 text-green-800' : 
                      plan.plan_type === 'trial' ? 'bg-blue-100 text-blue-800' : 
                      'bg-gray-100 text-gray-800'}`}
                  >
                    {plan.plan_type === 'paid' ? 'Ücretli' : 
                     plan.plan_type === 'trial' ? 'Deneme' : 'Ücretsiz'}
                    {plan.trial_days && ` - ${plan.trial_days} gün`}
                  </span>
                </div>

                {/* Satın Al Butonu */}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={!plan.is_active}
                  className={`mt-auto w-full py-2 px-4 rounded-md transition-colors
                    ${plan.is_active 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                      : 'bg-gray-100 text-gray-500 cursor-not-allowed'}`}
                >
                  {plan.is_active ? 'Satın Al' : 'Şu Anda Mevcut Değil'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12">
            Henüz abonelik planı bulunmuyor
          </div>
        )}
      </div>
    </PageContainer>
  )
} 