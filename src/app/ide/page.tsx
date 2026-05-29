"use client"

import { useRouter } from 'next/navigation'
import { IDELayout } from '@/components/ide/IDELayout'

export default function IDEPage() {
  const router = useRouter()
  return (
    <div className="fixed inset-0 z-[100] bg-[#0d1117]">
      <IDELayout onClose={() => router.push('/dashboard/ai')} />
    </div>
  )
}
