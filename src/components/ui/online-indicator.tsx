'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity } from 'lucide-react'

interface OnlineUser {
  id: string
  name: string
  image?: string
  role: string
  currentPage?: string
}

export function OnlineIndicator() {
  const [users, setUsers] = useState<OnlineUser[]>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const fetchOnline = () => {
      fetch('/api/analytics/online-users')
        .then(r => r.json())
        .then(json => setUsers((json.data || []).filter((u: OnlineUser) => u.role === 'CLIENT')))
        .catch(() => {})
    }
    fetchOnline()
    const interval = setInterval(fetchOnline, 30000)
    return () => clearInterval(interval)
  }, [])

  const clientUsers = users.filter(u => u.role === 'CLIENT')
  const count = clientUsers.length

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs text-[var(--text-2)] hover:bg-[var(--surface-hover)] transition-colors"
        title={`${count} cliente(s) online`}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--success)]" />
        </span>
        <span>{count} online</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            className="absolute right-0 top-full mt-1 w-64 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg p-3 z-50"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">Clientes Online</span>
              <button onClick={() => setExpanded(false)} className="text-[var(--text-3)] hover:text-[var(--text)] text-xs">X</button>
            </div>
            {count === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">Nenhum cliente online</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {clientUsers.map(user => (
                  <div key={user.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--surface-hover)]">
                    <div className="relative">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-2xs">{user.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[var(--success)] border border-[var(--bg)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs truncate">{user.name}</p>
                      {user.currentPage && (
                        <p className="text-2xs text-muted-foreground truncate">{user.currentPage}</p>
                      )}
                    </div>
                    <Activity className="h-3 w-3 text-success animate-pulse" />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
