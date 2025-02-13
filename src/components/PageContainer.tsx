import Sidebar from '@/components/Sidebar'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export const PageContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="lg:pl-64 pt-14 lg:pt-4">
        <div className="p-2 sm:p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
} 