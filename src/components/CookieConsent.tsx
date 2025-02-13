'use client'

import { useState, useEffect } from 'react'
import Cookies from 'js-cookie'

export default function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Sayfa yüklendiğinde bir kere kontrol et
    const consent = Cookies.get('cookie-consent')
    if (!consent) {
      setShow(true)
    }
  }, [])

  const acceptCookies = () => {
    Cookies.set('cookie-consent', 'true', { expires: 365 }) // 1 yıl geçerli
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm">
          Bu web sitesi, size en iyi deneyimi sunmak için çerezleri kullanmaktadır.
        </div>
        <button
          onClick={acceptCookies}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 whitespace-nowrap"
        >
          Kabul Et
        </button>
      </div>
    </div>
  )
} 