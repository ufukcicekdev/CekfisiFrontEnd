import { Inter } from 'next/font/google'
import { Providers } from '@/providers'
import '@/styles/globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/auth'
import CookieConsent from '@/components/CookieConsent'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <AuthProvider>
          <Providers>
            {children}
          </Providers>
          <CookieConsent />
        </AuthProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  )
} 