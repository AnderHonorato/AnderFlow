// Style variant definitions for icons

export type IconVariant = 'professional' | 'minimal'

interface IconStyleConfig {
  stroke: string
  fill: string
  fillOpacity: number
  strokeWidth: number
}

const PROFESSIONAL_COLORS: Record<string, IconStyleConfig> = {
  default: { stroke: 'var(--text)', fill: 'var(--accent)', fillOpacity: 0.15, strokeWidth: 1.4 },
  accent: { stroke: '#E8622A', fill: '#E8622A', fillOpacity: 0.2, strokeWidth: 1.3 },
  success: { stroke: '#3D9A6E', fill: '#3D9A6E', fillOpacity: 0.2, strokeWidth: 1.3 },
  danger: { stroke: '#C44A3A', fill: '#C44A3A', fillOpacity: 0.2, strokeWidth: 1.3 },
  warning: { stroke: '#C4852A', fill: '#C4852A', fillOpacity: 0.2, strokeWidth: 1.3 },
  info: { stroke: '#3A7AC4', fill: '#3A7AC4', fillOpacity: 0.2, strokeWidth: 1.3 },
  purple: { stroke: '#8B5CF6', fill: '#8B5CF6', fillOpacity: 0.2, strokeWidth: 1.3 },
  teal: { stroke: '#06B6D4', fill: '#06B6D4', fillOpacity: 0.2, strokeWidth: 1.3 },
  mono: { stroke: 'var(--text-2)', fill: 'var(--text-3)', fillOpacity: 0.12, strokeWidth: 1.3 },
}

const MINIMAL_COLORS: IconStyleConfig = {
  stroke: 'var(--text-3)',
  fill: 'var(--text-3)',
  fillOpacity: 0.08,
  strokeWidth: 1.2,
}

export function getStyle(variant: IconVariant, colorKey: string = 'default'): IconStyleConfig {
  if (variant === 'minimal') return MINIMAL_COLORS
  return PROFESSIONAL_COLORS[colorKey] || PROFESSIONAL_COLORS.default
}

export function renderSvg(
  viewBox: string,
  content: string,
  variant: IconVariant,
  colorKey: string = 'default',
  size?: number,
): string {
  const style = getStyle(variant, colorKey)
  const w = size || 18
  const h = size || 18
  const svg = `<svg width="${w}" height="${h}" viewBox="${viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg">${content}</svg>`
  return `<span style="display:inline-flex;vertical-align:middle;align-items:center;justify-content:center;flex-shrink:0">${svg}</span>`
}

export function renderCircle(
  filled: boolean,
  variant: IconVariant,
  colorKey: string = 'default',
  size: number = 18,
  extra?: string,
): string {
  const style = getStyle(variant, colorKey)
  const r = 9
  const parts: string[] = []
  if (filled || variant === 'professional') {
    parts.push(`<circle cx="12" cy="12" r="${r}" fill="${style.fill}" opacity="${style.fillOpacity}"/>`)
  }
  parts.push(`<circle cx="12" cy="12" r="${r}" stroke="${style.stroke}" stroke-width="${style.strokeWidth}" ${filled ? '' : 'fill="none"'}/>`)
  if (extra) parts.push(extra)
  return renderSvg('0 0 24 24', parts.join(''), variant, colorKey, size)
}

export function renderPath(
  pathData: string,
  variant: IconVariant,
  colorKey: string = 'default',
  size: number = 18,
  filled: boolean = false,
): string {
  const style = getStyle(variant, colorKey)
  const attrs = filled
    ? `fill="${style.fill}" opacity="${style.fillOpacity}" stroke="${style.stroke}" stroke-width="${style.strokeWidth}"`
    : `stroke="${style.stroke}" stroke-width="${style.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" fill="none"`
  const svg = `<path d="${pathData}" ${attrs}/>`
  return renderSvg('0 0 24 24', svg, variant, colorKey, size)
}

export function S(svg: string): string {
  return `<span style="display:inline-flex;vertical-align:middle;align-items:center;justify-content:center;flex-shrink:0">${svg}</span>`
}
