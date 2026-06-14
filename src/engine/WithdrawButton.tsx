'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface WithdrawButtonProps {
  requestId: string
}

export function WithdrawButton({ requestId }: WithdrawButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function handleWithdraw() {
    if (!confirming) {
      setConfirming(true)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/requests/${requestId}/withdraw`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const json = await res.json()
        toast.error(json.error?.message ?? 'Failed to withdraw request.')
        return
      }

      toast.success('Request withdrawn.')
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={handleWithdraw}
        disabled={loading}
        className={
          confirming
            ? 'border-destructive text-destructive hover:bg-red-50'
            : 'border-[var(--mal-stroke-soft-200)] text-[var(--mal-text-sub-600)] hover:text-destructive hover:border-destructive'
        }
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
        ) : (
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
        )}
        {confirming ? 'Confirm withdrawal' : 'Withdraw request'}
      </Button>
      {confirming && !loading && (
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-[var(--mal-text-soft-400)] hover:text-[var(--mal-text-sub-600)]"
        >
          Cancel
        </button>
      )}
    </div>
  )
}
