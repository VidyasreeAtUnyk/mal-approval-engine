import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { ProfileProvider } from '@/context/ProfileContext'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProfileProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-3 md:p-6 bg-[var(--mal-bg-weak-50)] min-w-0">
            {children}
          </main>
        </div>
      </div>
    </ProfileProvider>
  )
}
