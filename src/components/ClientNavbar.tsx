import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function ClientNavbar() {
  const pathname = usePathname()

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-8 w-auto">
              {/* Logo */}
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  href="/dashboard/client/messages"
                  className={`text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium ${
                    pathname.startsWith('/dashboard/client/messages') ? 'bg-gray-100' : ''
                  }`}
                >
                  Mesajlar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 