import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
  return (
    <Card className="shadow-mal-fancy-stroke border-[var(--mal-stroke-soft-200)] p-4 md:p-6">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-[var(--mal-purple-500)] flex items-center justify-center" aria-hidden="true">
            <span className="text-white text-xs font-bold">مال</span>
          </div>
          <span className="font-semibold text-[var(--mal-text-strong-950)]">Mal</span>
        </div>
        <CardTitle className="text-xl text-[var(--mal-text-strong-950)]">Sign in</CardTitle>
        <CardDescription className="text-[var(--mal-text-sub-600)]">
          Enter your credentials to access the approval engine
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  )
}
