import { useCallback } from 'react'

export function useNotificationSound() {
  const play = useCallback((type: 'message' | 'alert' | 'success' = 'message') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      if (type === 'message') { osc.frequency.setValueAtTime(880, ctx.currentTime); osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1) }
      if (type === 'alert') { osc.frequency.setValueAtTime(440, ctx.currentTime); osc.frequency.setValueAtTime(330, ctx.currentTime + 0.15) }
      if (type === 'success') { osc.frequency.setValueAtTime(660, ctx.currentTime); osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.2) }

      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.3)
    } catch {}
  }, [])
  return { play }
}
