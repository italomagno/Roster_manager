import AuthGate from '@/components/AuthGate'
import { Navigation } from '../../components/Navigation'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
        <Navigation />
        <div className="flex-1 md:ml-64 min-w-0">
          <main className="p-4 md:p-8 max-w-7xl mx-auto">{children}</main>
        </div>
      </div>
    </AuthGate>
  )
}
