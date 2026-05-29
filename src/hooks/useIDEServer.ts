import { useState, useEffect, useCallback } from 'react'

const IDE_SERVER_URL = process.env.NEXT_PUBLIC_IDE_SERVER_URL || 'http://localhost:3002'

interface IDEServerHealth {
  status: string
  version: string
  rootPath: string
  uptime: number
}

export function useIDEServer() {
  const [isConnected, setIsConnected] = useState(false)
  const [serverVersion, setServerVersion] = useState<string | null>(null)

  const checkNow = useCallback(async () => {
    try {
      const res = await fetch(`${IDE_SERVER_URL}/health`, {
        signal: AbortSignal.timeout(3000)
      })
      if (res.ok) {
        const data: IDEServerHealth = await res.json()
        setServerVersion(data.version || null)
        setIsConnected(true)
        return
      }
    } catch { /* offline */ }
    setIsConnected(false)
  }, [])

  useEffect(() => {
    checkNow()
    const interval = setInterval(checkNow, 10000)
    return () => clearInterval(interval)
  }, [checkNow])

  return { isConnected, serverVersion, checkNow }
}
