'use client'

import { Toaster as Sonner } from 'sonner'

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      toastOptions={{
        className: '!bg-[hsl(222,47%,11%)] !border !border-[hsl(222,25%,14%)] !text-[#EAF2FF] !shadow-none !rounded-[14px]',
      }}
    />
  )
}
