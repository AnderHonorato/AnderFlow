declare module 'canvas-confetti' {
  interface ConfettiOptions {
    particleCount?: number
    spread?: number
    colors?: string[]
    origin?: { x?: number; y?: number }
    angle?: number
    startVelocity?: number
    decay?: number
    gravity?: number
    drift?: number
    ticks?: number
    shapes?: string[]
    zIndex?: number
    disableForReducedMotion?: boolean
    scalar?: number
  }
  function confetti(options?: ConfettiOptions): Promise<null>
  export default confetti
}
