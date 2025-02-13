'use client'

import { useAuth } from '@/contexts/auth'
import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { PageContainer } from '@/components/PageContainer'
import { UsersIcon, DocumentTextIcon, ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

interface DashboardStats {
  stats: {
    total: number
    pending_documents: number
    last_activity: string | null
  }
  recent_activities: {
    id: number
    document_type: string
    created_at: string
    status: string
    uploaded_by__first_name?: string
    uploaded_by__last_name?: string
    client__first_name?: string
    client__last_name?: string
  }[]
}

interface Activity {
  id: number
  document_type: string
  created_at: string
  status: string
  uploaded_by__first_name?: string
  uploaded_by__last_name?: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const isAccountant = user?.user_type === 'accountant'
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState('')

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('/dashboard/stats/')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      setError('İstatistikler yüklenirken bir hata oluştu')
    }
  }

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  if (error) {
    return <div>{error}</div>
  }

  return (
    <PageContainer>
      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100">
              <UsersIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {isAccountant ? 'Toplam Müşteri' : 'Toplam Belge'}
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {stats?.stats.total || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <DocumentTextIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">İşlenen Belge</p>
              <p className="text-lg font-semibold text-gray-900">
                {((stats?.stats?.total ?? 0) - (stats?.stats?.pending_documents ?? 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Bekleyen Belge</p>
              <p className="text-lg font-semibold text-gray-900">
                {stats?.stats.pending_documents || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Son İşlemler */}
      <div className="mt-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900">Son İşlemler</h2>
            
            {/* Mobil Görünüm */}
            <div className="block lg:hidden mt-4 space-y-4">
              {stats?.recent_activities.map((activity) => (
                <div key={activity.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {activity.document_type === 'invoice' && 'Fatura'}
                        {activity.document_type === 'receipt' && 'Fiş'}
                        {activity.document_type === 'expense' && 'Gider Pusulası'}
                        {activity.document_type === 'contract' && 'Sözleşme'}
                        {activity.document_type === 'other' && 'Diğer'}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {new Date(activity.created_at).toLocaleDateString('tr-TR')}
                      </div>
                      {isAccountant && (
                        <div className="text-sm text-gray-600 mt-1">
                          {activity.uploaded_by__first_name} {activity.uploaded_by__last_name}
                        </div>
                      )}
                    </div>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      activity.status === 'processed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {activity.status === 'processed' ? 'İşlendi' : 'Bekliyor'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Tablo Görünümü */}
            <div className="hidden lg:block mt-4 -mx-4 sm:-mx-6 lg:-mx-8">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Tarih
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        İşlem
                      </th>
                      {isAccountant && (
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Müşteri
                        </th>
                      )}
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Durum
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {stats?.recent_activities.map((activity) => (
                      <tr key={activity.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(activity.created_at).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {activity.document_type === 'invoice' && 'Fatura'}
                          {activity.document_type === 'receipt' && 'Fiş'}
                          {activity.document_type === 'expense' && 'Gider Pusulası'}
                          {activity.document_type === 'contract' && 'Sözleşme'}
                          {activity.document_type === 'other' && 'Diğer'}
                        </td>
                        {isAccountant && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {activity.uploaded_by__first_name} {activity.uploaded_by__last_name}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            activity.status === 'processed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {activity.status === 'processed' ? 'İşlendi' : 'Bekliyor'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
} 