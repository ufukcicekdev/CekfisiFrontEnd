import Link from 'next/link'

<Link
  href="/dashboard/messages"
  className={`text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium ${
    pathname.startsWith('/dashboard/messages') ? 'bg-gray-100' : ''
  }`}
>
  Mesajlar
</Link> 