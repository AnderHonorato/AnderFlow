import type { IconVariant } from './variants'
export type { IconVariant } from './variants'

const $S = (s: string) => `<span style="display:inline-flex;vertical-align:middle;align-items:center;justify-content:center;flex-shrink:0">${s}</span>`

function pathIcon(d: string, colorKey: string = 'default'): (v: IconVariant) => string {
  const colors: Record<string, [string, string]> = {
    default: ['var(--text)', 'var(--text-3)'],
    accent: ['#E8622A', 'var(--text-3)'],
    success: ['#3D9A6E', 'var(--text-3)'],
    danger: ['#C44A3A', 'var(--text-3)'],
    warning: ['#C4852A', 'var(--text-3)'],
    info: ['#3A7AC4', 'var(--text-3)'],
    purple: ['#8B5CF6', 'var(--text-3)'],
    teal: ['#06B6D4', 'var(--text-3)'],
  }
  const [pro, mono] = colors[colorKey] || colors.default
  return (v) => {
    const c = v === 'professional' ? pro : mono
    return $S(`<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="${d}" stroke="${c}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`)
  }
}

type Factory = (v: IconVariant) => string

const R: Record<string, string> = {}

function register(name: string, factory: Factory) {
  R[`metrys-${name}`] = factory('professional')
  R[`metrys-${name}-mono`] = factory('minimal')
}

// STATUS
register('status-ok', (v) => { const c=v==='professional'?'#3D9A6E':'var(--text-3)'; return $S(`<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="${c}" opacity="${v==='professional'?'0.15':'0.08'}"/><circle cx="12" cy="12" r="10" stroke="${c}" stroke-width="1.5"/><path d="M5 13l4 4L19 7" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`) })
register('status-error', (v) => { const c=v==='professional'?'#C44A3A':'var(--text-3)'; return $S(`<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="${c}" opacity="${v==='professional'?'0.15':'0.08'}"/><circle cx="12" cy="12" r="10" stroke="${c}" stroke-width="1.5"/><path d="M9 9l6 6M15 9l-6 6" stroke="${c}" stroke-width="2" stroke-linecap="round"/></svg>`) })
register('status-warn', (v) => { const c=v==='professional'?'#C4852A':'var(--text-3)'; return $S(`<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3L2 21h20L12 3z" fill="${c}" opacity="${v==='professional'?'0.15':'0.08'}" stroke="${c}" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 10v4M12 17h0" stroke="${c}" stroke-width="2" stroke-linecap="round"/></svg>`) })
register('status-info', (v) => { const c=v==='professional'?'#3A7AC4':'var(--text-3)'; return $S(`<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="${c}" opacity="${v==='professional'?'0.12':'0.08'}"/><circle cx="12" cy="12" r="10" stroke="${c}" stroke-width="1.5"/><path d="M12 16v-4M12 8h0" stroke="${c}" stroke-width="2" stroke-linecap="round"/></svg>`) })
register('status-done', (v) => { const c=v==='professional'?'#3D9A6E':'var(--text-3)'; const f=v==='professional'?'#fff':'var(--bg)'; return $S(`<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="${c}" opacity="${v==='professional'?'1':'0.5'}"/><path d="M5 13l4 4L19 7" stroke="${f}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`) })

// CORE ACTIONS
register('action-search', pathIcon('M10 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8c0 2-.7 3.8-2 5.2l6 5.8-2.5 2.5-5.8-6c-1.4 1.3-3.2 2-5.2 2zM10 15c2.8 0 5-2.2 5-5s-2.2-5-5-5-5 2.2-5 5 2.2 5 5 5z'))
register('action-edit', pathIcon('M12 20h9M16.5 3.5c.8-.8 2.2-.8 3 0s.8 2.2 0 3L8 18l-4 1 1-4L16.5 3.5z', 'warning'))
register('action-plus', (v) => { const c=v==='professional'?'#3D9A6E':'var(--text-3)'; return $S(`<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="${c}" opacity="${v==='professional'?'0.15':'0.08'}"/><circle cx="12" cy="12" r="10" stroke="${c}" stroke-width="1.3"/><path d="M12 5v14M5 12h14" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/></svg>`) })
register('action-send', pathIcon('M3 12l18-9-7 18-3-6-8-3z', 'accent'))
register('action-download', pathIcon('M12 3v14M7 12l5 5 5-5M4 21h16', 'info'))
register('action-upload', pathIcon('M12 21V7M7 12l5-5 5 5M4 21h16', 'info'))
register('action-trash', pathIcon('M4 6h16M6 6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V6M9 6V4c0-.6.4-1 1-1h4c.6 0 1 .4 1 1v2', 'danger'))
register('action-copy', pathIcon('M8 7H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-3M19 3h-8c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z'))
register('action-filter', pathIcon('M3 6h18l-8 10v3l-2 1v-4L3 6z'))
register('action-save', pathIcon('M5 3h11l4 4v14c0 1-1 2-2 2H6c-1 0-2-1-2-2V5c0-1 1-2 2-2zM16 3v5H8V3M7 21h10', 'info'))
register('action-settings', pathIcon('M12 15c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3zM12 2l1.5 3.1c.3.7 1 1.2 1.8 1.2l3.4.3-.6 3.3c-.1.7.2 1.5.8 1.9l2.5 2.2-2.3 2.5c-.5.6-.6 1.4-.3 2.1l1.4 3-3.4.6c-.7.1-1.3.7-1.5 1.4L15 22l-3-1.5c-.6-.3-1.4-.3-2 0L7 22l-.5-3.5c-.2-.7-.8-1.3-1.5-1.4l-3.4-.6 1.4-3c.3-.7.2-1.5-.3-2.1L.4 9l2.5-2.2c.6-.5.9-1.2.8-1.9l-.6-3.3 3.4.3c.8.1 1.5-.5 1.8-1.2L12 2z'))
register('action-menu', pathIcon('M3 6h18M3 12h18M3 18h18'))
register('action-logout', pathIcon('M9 21H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h4M16 17l5-5-5-5M21 12H9', 'danger'))
register('action-login', pathIcon('M15 3h4c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2h-4M8 7l-5 5 5 5M3 12h13', 'success'))

// ARROWS
register('arrow-right', pathIcon('M5 12h14M14 7l5 5-5 5', 'accent'))
register('arrow-left', pathIcon('M19 12H5M10 17l-5-5 5-5', 'accent'))
register('arrow-up', pathIcon('M12 19V5M7 10l5-5 5 5', 'success'))
register('arrow-down', pathIcon('M12 5v14M7 14l5 5 5-5', 'danger'))
register('chevron-up', pathIcon('M6 15l6-6 6 6'))
register('chevron-down', pathIcon('M6 9l6 6 6-6'))
register('chevron-left', pathIcon('M15 18l-6-6 6-6'))
register('chevron-right', pathIcon('M9 18l6-6-6-6'))
register('arrow-cycle', pathIcon('M2 12C2 6.5 6.5 2 12 2c3.5 0 6.5 1.8 8.3 4.5M22 12c0 5.5-4.5 10-10 10-3.5 0-6.5-1.8-8.3-4.5M19 3v4h-4M5 21v-4h4'))
register('arrow-redo', pathIcon('M17 4l4 4-4 4M3 12v-1c0-3.3 2.7-6 6-6h12', 'info'))
register('arrow-undo', pathIcon('M7 4L3 8l4 4M21 12v1c0 3.3-2.7 6-6 6H3', 'info'))

// DOCUMENTS
register('doc-file', pathIcon('M12 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM12 2v6h6', 'info'))
register('doc-folder', pathIcon('M2 5h6l2 2h10c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2l.01-12c0-1.1.89-2 1.99-2z', 'warning'))
register('doc-image', pathIcon('M3 3h18v18H3V3zM8.5 8.5c.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5S7 10.8 7 10s.7-1.5 1.5-1.5zM21 15l-5-5L5 21', 'purple'))
register('doc-clipboard', pathIcon('M8 4H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3M8 2h8v4H8V2zM9 12h6M9 15h6', 'info'))
register('doc-tag', pathIcon('M2 12L12 2h8v8l-10 10zM17 7h0', 'accent'))
register('doc-archive', pathIcon('M3 3h18v4H3V3zM4 7h16v12c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V7zM10 11h4'))
register('doc-book', pathIcon('M4 4h10l2 3h3v13H4V4zM4 22V8M4 22c1.7 0 3-1.3 3-3s-1.3-3-3-3', 'purple'))
register('doc-list', pathIcon('M3 6h18M3 12h18M3 18h12'))

// COMMUNICATION
register('comm-mail', pathIcon('M2 6l10 7L22 6M3 5h18c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2z', 'info'))
register('comm-phone', pathIcon('M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z', 'success'))
register('comm-bell', pathIcon('M14 20c0 1.1-.9 2-2 2s-2-.9-2-2M5 17h14v-2c-1.5 0-2.5-3-2.5-5 0-2.8-2.2-5-5-5h-1c-2.8 0-5 2.2-5 5 0 2-1 5-2.5 5v2z', 'warning'))
register('comm-inbox', pathIcon('M2 12h6l2 3h4l2-3h6M3 5h18v14H3V5z', 'info'))
register('comm-reply', pathIcon('M10 17l-5-5 5-5M14 22c2.8 0 5-2.2 5-5V7', 'info'))
register('comm-threads', pathIcon('M3 8h18v2H3V8zM3 14h12v2H3v-2z', 'info'))
register('comm-video', pathIcon('M17 10.5l6-6v15l-6-6M2 5h15v14H2V5z', 'purple'))

// USERS
register('user-single', pathIcon('M12 12c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4zM12 10c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4z', 'info'))
register('user-group', pathIcon('M9 12c-2 0-6 1-6 3v2h12v-2c0-2-4-3-6-3zM9 10c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3zM17 12c-1.5 0-4.5.8-4.5 2.3v1.5h9v-1.5c0-1.5-3-2.3-4.5-2.3zM17 10.5c1.4 0 2.5-1.1 2.5-2.5s-1.1-2.5-2.5-2.5-2.5 1.1-2.5 2.5 1.1 2.5 2.5 2.5z', 'info'))
register('user-plus', pathIcon('M9 12c-2 0-6 1-6 3v2h12v-2c0-2-4-3-6-3zM9 10c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3zM17 10v3M18.5 8.5V13.5M19 17v4M16 19h6', 'success'))
register('user-check', pathIcon('M9 12c-2 0-6 1-6 3v2h12v-2c0-2-4-3-6-3zM9 10c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3zM16 11l2 2 4-4', 'success'))
register('user-x', pathIcon('M9 12c-2 0-6 1-6 3v2h12v-2c0-2-4-3-6-3zM9 10c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3zM17 8l4 4M21 8l-4 4', 'danger'))
register('user-star', pathIcon('M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z', 'warning'))
register('user-briefcase', pathIcon('M4 7h16v14c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V7zM16 7V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2', 'info'))
register('user-graduation', pathIcon('M3 10l9-5 9 5-9 5-9-5zM5.5 12.5v4L12 20l6.5-3.5v-4', 'info'))

// FINANCE
register('fin-dollar', pathIcon('M12 2v20M17 5H9.5C7 5 5 7 5 9.5S7 14 9.5 14h5c2.5 0 4.5 2 4.5 4.5S17 23 14.5 23H7', 'success'))
register('fin-credit-card', pathIcon('M2 6h20v12H2V6zM2 11h20', 'info'))
register('fin-wallet', pathIcon('M3 7v12c0 1.1.9 2 2 2h14M19 3H6c-1.7 0-3 1.3-3 3v1M21 9h-4c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-2c0-1.1-.9-2-2-2z', 'warning'))
register('fin-cart', pathIcon('M1 2h2l1.5 10h11l3.5-7H6M7 22c.6 0 1-.4 1-1s-.4-1-1-1-1 .4-1 1 .4 1 1 1zM18 22c.6 0 1-.4 1-1s-.4-1-1-1-1 .4-1 1 .4 1 1 1z', 'accent'))
register('fin-chart-up', pathIcon('M2 18l6-8 5 4 9-10M20 4v6h-6', 'success'))
register('fin-chart-down', pathIcon('M2 6l6 8 5-4 9 10M20 20v-6h-6', 'danger'))
register('fin-trending', pathIcon('M2 18l6-8 5 4 9-10M20 4v6h-6', 'accent'))
register('fin-percent', pathIcon('M19 5L5 19M7 9c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zM21 15c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z', 'accent'))

// TIME
register('time-calendar', pathIcon('M6 3v3M18 3v3M3 9h18M5 4h14c1.1 0 2 .9 2 2v15c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z', 'accent'))
register('time-clock', pathIcon('M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10zM12 6v6l4 2', 'warning'))
register('time-history', pathIcon('M12 2v2M12 20v2M4.9 4.9l1.4 1.4M2 12h2M20 12h2M12 6v6l4 2', 'info'))
register('time-calendar-check', pathIcon('M6 3v3M18 3v3M3 9h18M5 4h14v17H5V4zM9 15l2 2 4-4', 'success'))
register('time-infinity', pathIcon('M6 12c0-1.7 1.3-3 3-3s3 1.3 3 3c0 3 3 6 6 6s6-3 6-6-3-6-6-6c-3 0-6 3-6 6 0 1.7-1.3 3-3 3s-3-1.3-3-3z', 'purple'))
register('time-stopwatch', pathIcon('M12 4V2M12 8v5l3 3M18 16c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6 6 2.7 6 6zM8 2h8', 'accent'))

// SECURITY
register('sec-lock', pathIcon('M6 10V7c0-3.3 2.7-6 6-6s6 2.7 6 6v3h-1c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-8c0-1.1.9-2 2-2h1zM10 10h4V7c0-1.1-.9-2-2-2s-2 .9-2 2v3z'))
register('sec-shield', pathIcon('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', 'success'))
register('sec-key', pathIcon('M21 2l-2 2m-7.61 7.61c-3.8.7-6.9 3.3-7.39 7M3 16c0 1.7 1.3 3 3 3 .9 0 1.7-.4 2.2-1m4.8-8c2.1-2.1 5.5-2.1 7.6 0M9 15c0 .6-.4 1-1 1s-1-.4-1-1 .4-1 1-1 1 .4 1 1z', 'warning'))
register('sec-badge', pathIcon('M12 2l5 5v5c0 4.5-5 8-5 8s-5-3.5-5-8V7l5-5zM9 12l2 2 4-4', 'success'))
register('sec-scan', pathIcon('M3 7V5c0-1.1.9-2 2-2h2M17 3h2c1.1 0 2 .9 2 2v2M21 17v2c0 1.1-.9 2-2 2h-2M7 21H5c-1.1 0-2-.9-2-2v-2', 'info'))

// ANALYTICS
register('ana-bar', pathIcon('M3 20h18M3 16l4-6 5 4 6-8 4 3', 'info'))
register('ana-pie', pathIcon('M21.21 15.89C21.7 14.69 22 13.37 22 12c0-5.52-4.48-10-10-10S2 6.48 2 12s4.48 10 10 10c1.37 0 2.69-.3 3.89-.79L12 12l9.21 3.89z', 'accent'))
register('ana-activity', pathIcon('M3 12h4l2-9 6 18 4-9h4', 'danger'))
register('ana-gauge', pathIcon('M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10zM12 14v-2M12 6v2M7 7l1.5 1.5M15.5 15.5L17 17', 'warning'))
register('ana-crosshair', pathIcon('M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10zM12 6v12M6 12h12', 'danger'))
register('ana-table', pathIcon('M3 3h18v18H3V3zM3 9h18M3 15h18M9 3v18M15 3v18'))
register('ana-presentation', pathIcon('M2 3h20M10 15v6M14 15v6M8 21h8M4 3v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V3', 'purple'))

// DEV
register('dev-code', pathIcon('M8 6l-6 6 6 6M16 6l6 6-6 6M14 4l-4 16', 'purple'))
register('dev-terminal', pathIcon('M5 8l5 4-5 4M13 16h6', 'purple'))
register('dev-git-branch', pathIcon('M6 3v12M18 9c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3c0 1.2.7 2.2 1.7 2.7-2 2.3-5.7 3-8 1.7M6 15c1.7 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.3-3 3-3z', 'accent'))
register('dev-database', pathIcon('M4 6c0 2.2 3.6 4 8 4s8-1.8 8-4-3.6-4-8-4-8 1.8-8 4zM4 6v6c0 2.2 3.6 4 8 4s8-1.8 8-4V6M4 12v6c0 2.2 3.6 4 8 4s8-1.8 8-4v-6', 'info'))
register('dev-cloud', pathIcon('M18 17c2.2 0 4-1.8 4-4 0-2.2-1.8-4-4-4-.4-3.3-3.3-6-6.5-5.8-3-.2-5.6 2.1-6.2 5C2.7 8.8 1 10.8 1 13c0 2.8 2.2 5 5 5h12z', 'info'))
register('dev-bug', pathIcon('M12 8v4M12 16h0M10 4h4M8 6c-1.7 0-3 1.3-3 3v5c0 1.7 1.3 3 3 3h8c1.7 0 3-1.3 3-3V9c0-1.7-1.3-3-3-3M4 9L2 7M20 9l2-2M2 15l2 2M20 15l-2 2', 'danger'))
register('dev-brackets', pathIcon('M10 4L4 12l6 8M14 4l6 8-6 8', 'purple'))
register('dev-api', pathIcon('M8 4l-6 6 6 6M16 4l6 6-6 6M10 4l-4 16', 'purple'))

// BUSINESS
register('biz-briefcase', pathIcon('M4 7h16v14c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V7zM16 7V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2', 'info'))
register('biz-building', pathIcon('M3 21h18M5 3h14c1.1 0 2 .9 2 2v16M9 6v2M15 6v2M9 11v2M15 11v2M9 16v2M15 16v2'))
register('biz-home', pathIcon('M2 10l10-8 10 8v12H2V10zM8 22V12h8v10', 'info'))
register('biz-globe', pathIcon('M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10zM2 12h20M12 2c2.5 2.5 4 6 4 10s-1.5 7.5-4 10c-2.5-2.5-4-6-4-10s1.5-7.5 4-10z', 'info'))
register('biz-map-pin', pathIcon('M12 22s-8-4.5-8-11.8C4 5.8 7.6 2 12 2s8 3.8 8 8.2C20 17.5 12 22 12 22zM12 13c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3z', 'danger'))
register('biz-target', pathIcon('M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10zM12 18c3.3 0 6-2.7 6-6s-2.7-6-6-6-6 2.7-6 6 2.7 6 6 6zM12 14c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z', 'danger'))
register('biz-rocket', pathIcon('M16 2l-4 8H6l4 6-1 6 7-4 7 4-1-6 4-6h-6l-4-8zM12 14c.6 0 1-.4 1-1s-.4-1-1-1-1 .4-1 1 .4 1 1 1z', 'accent'))
register('biz-compass', pathIcon('M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10zM9 9l6 2-2 6-6-2 2-6z', 'accent'))
register('biz-funnel', pathIcon('M3 4h18L14 14v4l-4 2v-6L3 4z', 'info'))

// DEVICES
register('device-laptop', pathIcon('M6 5h12v10H6V5zM2 19h20M6 15v4M18 15v4', 'info'))
register('device-smartphone', pathIcon('M6 2h12v20H6V2zM10 18h4M11 4h2', 'info'))
register('device-wifi', pathIcon('M5 12c3.9-3.9 10.2-3.9 14.1 0M9 16c2.3-2.3 6-2.3 8.3 0M12 20h0', 'info'))
register('device-camera', pathIcon('M2 7h3l2-3h10l2 3h3v13H2V7zM12 18c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4z', 'purple'))
register('device-battery', pathIcon('M7 6h13v12H7V6zM23 9v6M3 9v6', 'success'))
register('device-hard-drive', pathIcon('M2 4h20v16H2V4zM6 12h4M14 12h4M6 16h4M14 16h4'))
register('device-headphones', pathIcon('M3 14v-2c0-5 4-9 9-9s9 4 9 9v2M21 14c0 1.1-.9 2-2 2h-1c-.6 0-1-.4-1-1v-3c0-.6.4-1 1-1h1M3 14c0 1.1.9 2 2 2h1c.6 0 1-.4 1-1v-3c0-.6-.4-1-1-1H5', 'success'))

// NATURE
register('nat-sun', pathIcon('M12 18c3.3 0 6-2.7 6-6s-2.7-6-6-6-6 2.7-6 6 2.7 6 6 6zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4', 'warning'))
register('nat-moon', pathIcon('M21 12.79C20.84 14.56 20.16 16.23 19.04 17.6 17.21 19.83 14.56 21 12 21c-5 0-9-4-9-9 0-3.88 2.62-7.18 6.26-8.12-2.17 1.56-3.26 3.94-3.26 6.62 0 4.97 4.03 9 9 9 2.68 0 5.06-1.09 6.62-3.26.1-.34.18-.69.24-1.04.14-.47.14-.47 0-.41z', 'purple'))
register('nat-cloud', pathIcon('M18 17c2.2 0 4-1.8 4-4 0-2.2-1.8-4-4-4-.4-3.3-3.3-6-6.5-5.8-3-.2-5.6 2.1-6.2 5C2.7 8.8 1 10.8 1 13c0 2.8 2.2 5 5 5h12z', 'info'))
register('nat-leaf', pathIcon('M6 26C10 16 16 8 26 6c-4 8-4 16 0 20-8-2-14-2-20 0z', 'success'))
register('nat-droplet', pathIcon('M12 2.69l5.66 5.66c3.12 3.12 3.12 8.19 0 11.31C14.53 22.88 9.47 22.88 6.34 19.69 3.22 16.56 3.22 11.49 6.34 8.35L12 2.69z', 'info'))
register('nat-wind', pathIcon('M3 8h12c1.7 0 3-1.3 3-3s-1.3-3-3-3M3 16h10c1.7 0 3 1.3 3 3s-1.3 3-3 3M3 12h16', 'info'))
register('nat-zap', pathIcon('M13 2L3 14h9l-1 8 10-12h-9l1-8z', 'warning'))

// HEALTH
register('med-heart', pathIcon('M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z', 'danger'))
register('med-brain', pathIcon('M12 2C9 2 7 4 7 7s2 5 5 5 5-2 5-5-2-5-5-5zM12 12c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zM7 7C4 7 2 9 2 12s2 5 5 5M17 7c3 0 5 2 5 5s-2 5-5 5', 'purple'))
register('med-heart-pulse', pathIcon('M20 2c-2.5 0-4.5 2-5 4.5C14.5 4 12.5 2 10 2 6.7 2 4 4.7 4 8c0 4 4 8 8 12 4-4 8-8 8-12 0-3.3-2.7-6-6-6zM3 13h4l2-5 6 12 4-7h4', 'danger'))

// TRANSPORT
register('trans-car', pathIcon('M3 10h18l-2 8H5l-2-8zM3 10l1-4h16l1 4M7 18v3M17 18v3M7 14h0M17 14h0', 'info'))
register('trans-truck', pathIcon('M1 4h14v10H1V4zM15 9h6l3 4v5h-3M17 18c0 1.1-.9 2-2 2s-2-.9-2-2M5 18c0 1.1-.9 2-2 2s-2-.9-2-2', 'info'))
register('trans-plane', pathIcon('M3 19l18-7-9-8M16 6l5 5M6 12l-3 4 7 2 5-5', 'accent'))
register('trans-package', pathIcon('M12 2l9 5v10l-9 5-9-5V7l9-5zM12 2v10M12 22V12M12 12l9-5M12 12L3 7', 'accent'))
register('trans-rocket', pathIcon('M16 2l-4 8H6l4 6-1 6 7-4 7 4-1-6 4-6h-6l-4-8zM12 14c.6 0 1-.4 1-1s-.4-1-1-1-1 .4-1 1 .4 1 1 1z', 'accent'))

// FOOD
register('food-coffee', pathIcon('M6 7h12v10c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2V7zM18 7h2c1.1 0 2 .9 2 2v1c0 1.1-.9 2-2 2h-2M3 3h2M9 3h2M15 3h2', 'warning'))
register('food-shopping-bag', pathIcon('M4 7h16v15H4V7zM8 7V5c0-2.2 1.8-4 4-4s4 1.8 4 4v2', 'info'))

// MEDIA
register('media-play', pathIcon('M6 4l15 8-15 8V4z', 'accent'))
register('media-pause', pathIcon('M6 4h4v16H6V4zM14 4h4v16h-4V4z'))
register('media-stop', pathIcon('M4 4h16v16H4z', 'danger'))

// EDUCATION
register('edu-book', pathIcon('M4 4h10l2 3h3v13H4V4zM4 22V8M4 22c1.7 0 3-1.3 3-3s-1.3-3-3-3', 'purple'))
register('edu-graduation', pathIcon('M3 10l9-5 9 5-9 5-9-5zM5.5 12.5v4L12 20l6.5-3.5v-4', 'info'))
register('edu-pencil', pathIcon('M12 20h9M16.5 3.5c.8-.8 2.2-.8 3 0s.8 2.2 0 3L8 18l-4 1 1-4L16.5 3.5z', 'warning'))
register('edu-languages', pathIcon('M5 7h14M12 3v18M5 17h14M7 3h10M2 21h20', 'info'))

export function buildIconMap(): Record<string, string> {
  return R
}

export function getIconCount(): number {
  return Object.keys(R).length
}
