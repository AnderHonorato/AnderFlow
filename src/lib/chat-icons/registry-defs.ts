import type { IconVariant } from './variants'
import { PATHS } from './paths'

function $S(svg: string): string {
  return `<span style="display:inline-flex;vertical-align:middle;align-items:center;justify-content:center;flex-shrink:0">${svg}</span>`
}

type Factory = (v: IconVariant) => string

function iconSvg(w: number, h: number, vbox: string, body: string): Factory {
  return (v) => $S(`<svg width="${w}" height="${h}" viewBox="${vbox}" fill="none">${body}</svg>`)
}

function pathIcon(d: string, colorKey: string = 'default', size: number = 18): Factory {
  const colors: Record<string, [string, string]> = {
    default: ['var(--text)', 'var(--text-3)'],
    success: ['#3D9A6E', 'var(--text-3)'],
    danger: ['#C44A3A', 'var(--text-3)'],
    warning: ['#C4852A', 'var(--text-3)'],
    info: ['#3A7AC4', 'var(--text-3)'],
    accent: ['#E8622A', 'var(--text-3)'],
    purple: ['#8B5CF6', 'var(--text-3)'],
    teal: ['#06B6D4', 'var(--text-3)'],
  }
  const [pro, mono] = colors[colorKey] || colors.default
  return (v) => {
    const c = v === 'professional' ? pro : mono
    return $S(`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"><path d="${d}" stroke="${c}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`)
  }
}

interface IconDef {
  name: string
  d?: string
  colorKey?: string
  size?: number
  svg?: Factory
}

// All shortcodes — organized by category prefix
export const ICON_DEFS: IconDef[] = [
  // STATUS (prefix: status) — 12
  ...([
    ['status-ok','status-error','status-warn','status-info','status-done','status-pending','status-locked','status-star','status-fire','status-pin','status-eye','status-heart'],
  ].flatMap((names: string[]) => names.map((name: string): IconDef => {
    const map: Record<string, [string, string]> = {
      'status-pending': ['M12 6v6l4 2M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z', 'warning'],
      'status-locked': [PATHS.lock, 'default'],
      'status-star': [PATHS.star, 'warning'],
      'status-pin': ['M12 22V14M8 4h8', 'accent'],
      'status-eye': [PATHS.eye, 'info'],
      'status-heart': [PATHS.heart, 'danger'],
    }
    const [d, ck] = map[name] || ['', 'default']
    return { name, d, colorKey: ck, size: 18 }
  }))),

  // ACTIONS (prefix: action) — 28
  ...([
    'action-search','action-edit','action-plus','action-minus','action-send','action-download','action-upload',
    'action-save','action-filter','action-share','action-link','action-copy','action-trash','action-print',
    'action-refresh','action-rotate','action-zoom-in','action-zoom-out','action-move','action-maximize',
    'action-minimize','action-settings','action-menu','action-more-h','action-more-v','action-sliders',
    'action-logout','action-login',
  ].map((name): IconDef => {
    const map: Record<string, [string, string]> = {
      'action-search': [PATHS.search, 'default'],
      'action-edit': [PATHS.edit, 'warning'],
      'action-send': ['M3 12l18-9-7 18-3-6-8-3z', 'accent'],
      'action-download': [PATHS.download, 'info'],
      'action-upload': [PATHS.upload, 'info'],
      'action-save': ['M5 3h11l4 4v14c0 1-1 2-2 2H6c-1 0-2-1-2-2V5c0-1 1-2 2-2zM16 3v5H8V3M7 21h10', 'info'],
      'action-filter': ['M3 6h18l-8 10v3l-2 1v-4L3 6z', 'default'],
      'action-link': [PATHS.link, 'info'],
      'action-copy': [PATHS.copy, 'default'],
      'action-trash': [PATHS.trash, 'danger'],
      'action-print': ['M6 9V2h12v7M6 18H4c-1.1 0-2-.9-2-2v-5c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v5c0 1.1-.9 2-2 2h-2M6 14h12v8H6v-8z', 'default'],
      'action-refresh': ['M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.6 5.6M3.5 18.4A9 9 0 0012 21', 'info'],
      'action-move': ['M8 9l4-4 4 4M16 15l-4 4-4-4M12 5v14M5 12h14', 'default'],
      'action-settings': [PATHS.settings, 'default'],
      'action-menu': ['M3 6h18M3 12h18M3 18h18', 'default'],
      'action-logout': ['M9 21H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h4M16 17l5-5-5-5M21 12H9', 'danger'],
      'action-login': ['M15 3h4c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2h-4M8 7l-5 5 5 5M3 12h13', 'success'],
    }
    const [d, ck] = map[name] || ['', 'default']
    return { name, d: d || `M12 7v10M7 12h10`, colorKey: ck, size: 18 }
  })),

  // ARROWS (prefix: arrow) — 22
  ...([
    'arrow-right','arrow-left','arrow-up','arrow-down','chevron-up','chevron-down','chevron-left','chevron-right',
    'arrow-up-right','arrow-down-left','arrow-cycle','arrow-redo','arrow-undo','arrow-navigate','arrow-compass',
    'arrow-external','arrow-corner-up-right','arrow-corner-down-right','arrow-swap','arrow-sort-up','arrow-sort-down',
    'arrow-enter',
  ].map((name): IconDef => {
    const map: Record<string, [string, string]> = {
      'arrow-right': [PATHS.arrowRight, 'accent'],
      'arrow-left': [PATHS.arrowLeft, 'accent'],
      'arrow-up': [PATHS.arrowUp, 'success'],
      'arrow-down': [PATHS.arrowDown, 'danger'],
      'chevron-up': [PATHS.chevronUp, 'default'],
      'chevron-down': [PATHS.chevronDown, 'default'],
      'chevron-left': [PATHS.chevronLeft, 'default'],
      'chevron-right': [PATHS.chevronRight, 'default'],
      'arrow-up-right': ['M7 17L17 7M7 7h10v10', 'default'],
      'arrow-down-left': ['M17 7L7 17M17 17H7V7', 'default'],
      'arrow-cycle': ['M2 12C2 6.5 6.5 2 12 2c3.5 0 6.5 1.8 8.3 4.5M22 12c0 5.5-4.5 10-10 10-3.5 0-6.5-1.8-8.3-4.5M19 3v4h-4M5 21v-4h4', 'default'],
      'arrow-redo': ['M17 4l4 4-4 4M3 12v-1c0-3.3 2.7-6 6-6h12', 'info'],
      'arrow-undo': ['M7 4L3 8l4 4M21 12v1c0 3.3-2.7 6-6 6H3', 'info'],
      'arrow-navigate': ['M12 2v20M17 7l-5-5-5 5', 'accent'],
      'arrow-compass': ['M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10zM9 9l2 5 4 1-1-4-2-5-3 3z', 'purple'],
      'arrow-external': ['M18 13v6c0 .6-.4 1-1 1H5c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h6M15 3h6v6M10 14L21 3', 'info'],
      'arrow-swap': ['M17 7l-5 5-5-5M17 17l-5-5-5 5', 'info'],
      'arrow-sort-up': ['M8 15l4-4 4 4', 'default'],
      'arrow-sort-down': ['M8 9l4 4 4-4', 'default'],
      'arrow-enter': ['M9 10l-5 5 5 5M12 19v-4c0-3.3 2.7-6 6-6h4', 'default'],
    }
    const [d, ck] = map[name] || ['', 'default']
    return { name, d: d || '', colorKey: ck, size: 18 }
  })),

  // DOCUMENTS/FILES (prefix: doc) — 26
  ...([
    'doc-file','doc-folder','doc-folder-open','doc-pdf','doc-csv','doc-image','doc-text','doc-clipboard',
    'doc-clipboard-check','doc-archive','doc-book','doc-book-open','doc-paperclip','doc-tag','doc-receipt',
    'doc-template','doc-newspaper','doc-sticky-note','doc-map','doc-table','doc-grid','doc-list',
    'doc-list-check','doc-binary','doc-merge','doc-split',
  ].map((name): IconDef => {
    const map: Record<string, [string, string]> = {
      'doc-file': [PATHS.file, 'info'],
      'doc-folder': [PATHS.folder, 'warning'],
      'doc-image': [PATHS.image, 'purple'],
      'doc-text': ['M6 2h9l5 5v14c0 1-1 2-2 2H6c-1 0-2-1-2-2V4c0-1 1-2 2-2zM15 2v5h5M8 12h8M8 15h8M8 18h5', 'info'],
      'doc-clipboard': ['M8 4H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3M8 2h8v4H8V2zM9 12h6M9 15h6', 'info'],
      'doc-clipboard-check': ['M8 4H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3M8 2h8v4H8V2zM9 14l2 2 4-4', 'success'],
      'doc-book': ['M4 4h10l2 3h3v13H4V4zM4 22V8M4 22c1.7 0 3-1.3 3-3s-1.3-3-3-3', 'purple'],
      'doc-tag': [PATHS.tag, 'accent'],
      'doc-receipt': ['M4 2h16v20l-4-2-4 2-4-2-4 2V2zM8 8h8M8 12h8M8 16h5', 'success'],
      'doc-map': ['M1 6v16l7-5 8 5 7-5V2l-7 5-8-5-7 5zM8 3v16M16 5v16', 'info'],
      'doc-table': ['M3 3h18v18H3V3zM3 9h18M3 15h18M9 3v18M15 3v18', 'default'],
      'doc-grid': [PATHS.layout, 'default'],
      'doc-list': ['M3 6h18M3 12h18M3 18h12', 'default'],
      'doc-list-check': ['M3 5h12M3 10h18M3 15h12M3 20h8', 'success'],
    }
    const [d, ck] = map[name] || ['', 'default']
    return { name, d: d || '', colorKey: ck, size: 18 }
  })),

  // COMMUNICATION (prefix: comm) — 22
  ...([
    'comm-chat','comm-mail','comm-phone','comm-bell','comm-bell-off','comm-message-square','comm-message-circle',
    'comm-at-sign','comm-hash','comm-rss','comm-video','comm-mic','comm-phone-call','comm-inbox',
    'comm-send-h','comm-forward','comm-reply','comm-reply-all','comm-quote','comm-threads','comm-mention','comm-broadcast',
  ].map((name): IconDef => {
    const map: Record<string, [string, string]> = {
      'comm-mail': [PATHS.mail, 'info'],
      'comm-phone': [PATHS.phone, 'success'],
      'comm-bell': [PATHS.bell, 'warning'],
      'comm-video': [PATHS.video, 'purple'],
      'comm-mic': [PATHS.microphone, 'danger'],
      'comm-inbox': ['M2 12h6l2 3h4l2-3h6M3 5h18v14H3V5z', 'info'],
      'comm-send-h': ['M5 12h14M12 5l7 7-7 7', 'accent'],
      'comm-forward': ['M13 17l5-5-5-5M6 17l5-5-5-5', 'default'],
      'comm-reply': ['M10 17l-5-5 5-5M14 22c2.8 0 5-2.2 5-5V7', 'info'],
      'comm-reply-all': ['M7 17l-5-5 5-5M13 17l-5-5 5-5M17 22c2.8 0 5-2.2 5-5V7', 'info'],
    }
    const [d, ck] = map[name] || ['', 'default']
    return { name, d: d || '', colorKey: ck, size: 18 }
  })),

  // USERS/PEOPLE (prefix: user) — 20
  ...([
    'user-single','user-group','user-plus','user-minus','user-check','user-x','user-profile',
    'user-contact','user-shield','user-crown','user-star','user-clock','user-building','user-briefcase',
    'user-graduation','user-actor','user-robot','user-ghost','user-skull','user-alien',
  ].map((name): IconDef => {
    const map: Record<string, [string, string]> = {
      'user-single': [PATHS.user, 'info'],
      'user-group': [PATHS.users, 'info'],
      'user-plus': ['M9 12c-2 0-6 1-6 3v2h12v-2c0-2-4-3-6-3zM9 10c1.7 0 3-1.3 3-3S10.7 4 9 4 6 5.3 6 7s1.3 3 3 3zM17 10v3M18.5 8.5V13.5M19 17v4M16 19h6', 'success'],
      'user-check': ['M9 12c-2 0-6 1-6 3v2h12v-2c0-2-4-3-6-3zM9 10c1.7 0 3-1.3 3-3S10.7 4 9 4 6 5.3 6 7s1.3 3 3 3zM16 11l2 2 4-4', 'success'],
      'user-x': ['M9 12c-2 0-6 1-6 3v2h12v-2c0-2-4-3-6-3zM9 10c1.7 0 3-1.3 3-3S10.7 4 9 4 6 5.3 6 7s1.3 3 3 3zM17 8l4 4M21 8l-4 4', 'danger'],
      'user-crown': ['M6 10l3 5 3-7 3 7 3-5', 'warning'],
      'user-star': [PATHS.star, 'warning'],
      'user-building': [PATHS.building, 'default'],
      'user-briefcase': [PATHS.briefcase, 'info'],
      'user-graduation': ['M3 10l9-5 9 5-9 5-9-5zM5.5 12.5v4L12 20l6.5-3.5v-4', 'info'],
    }
    const [d, ck] = map[name] || ['', 'default']
    return { name, d: d || '', colorKey: ck, size: 18 }
  })),

  // FINANCE (prefix: fin) — 22
  ...([
    'fin-dollar','fin-credit-card','fin-wallet','fin-cart','fin-chart-up','fin-chart-down','fin-piggy',
    'fin-bank','fin-landmark','fin-percent','fin-calculator','fin-barcode','fin-qrcode','fin-ticket',
    'fin-gift','fin-receipt','fin-coins','fin-trending','fin-hand-coins','fin-invoice','fin-safe','fin-scale',
  ].map((name): IconDef => {
    const map: Record<string, [string, string]> = {
      'fin-dollar': [PATHS.dollar, 'success'],
      'fin-credit-card': [PATHS.creditCard, 'info'],
      'fin-wallet': [PATHS.wallet, 'warning'],
      'fin-cart': [PATHS.shoppingCart, 'accent'],
      'fin-chart-up': [PATHS.trendingUp, 'success'],
      'fin-chart-down': [PATHS.trendingDown, 'danger'],
      'fin-percent': ['M19 5L5 19M7 9c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zM21 15c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z', 'accent'],
      'fin-ticket': ['M2 9c1.7 0 3-1.3 3-3s-1.3-3-3-3v0M2 9v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9M22 6c-1.7 0-3 1.3-3 3s1.3 3 3 3v0M6 13h12', 'accent'],
      'fin-coins': ['M8 6c0 2.2 1.8 4 4 4s4-1.8 4-4-1.8-4-4-4-4 1.8-4 4zM8 12c0 2.2 1.8 4 4 4s4-1.8 4-4M4 15c0 2.2 3.6 4 8 4s8-1.8 8-4', 'warning'],
      'fin-receipt': ['M4 2h16v20l-4-2-4 2-4-2-4 2V2zM8 8h8M8 12h8M8 16h5', 'default'],
      'fin-invoice': ['M4 2h16v20l-4-2-4 2-4-2-4 2V2zM8 7h8M8 11h8M8 15h5', 'info'],
      'fin-safe': ['M3 5h18v14H3V5zM10 12c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2zM12 9v1M12 14v1M7 21h10M7 3h10', 'info'],
      'fin-scale': ['M3 4h18l-2 16H5L3 4zM12 4v16M6 10h4M14 10h4', 'default'],
    }
    const [d, ck] = map[name] || ['', 'default']
    return { name, d: d || '', colorKey: ck, size: 18 }
  })),

  // TIME/CALENDAR (prefix: time) — 18
  ...([
    'time-calendar','time-clock','time-alarm','time-hourglass','time-timer','time-watch',
    'time-calendar-check','time-calendar-x','time-calendar-plus','time-history','time-calendar-days',
    'time-sunrise','time-sunset','time-calendar-heart','time-infinity','time-calendar-range','time-stopwatch','time-gantt',
  ].map((name): IconDef => {
    const map: Record<string, [string, string]> = {
      'time-calendar': [PATHS.calendar, 'accent'],
      'time-clock': [PATHS.clock, 'warning'],
      'time-alarm': ['M12 22c-1.1 0-2-.9-2-2h4c0 1.1-.9 2-2 2zM12 4V2M12 8v5l3 3M18 16c0 3.3-2.7 6-6 6s-6-2.7-6-6c0-3.3 2.7-6 6-6s6 2.7 6 6zM8 2h8', 'warning'],
      'time-history': ['M12 2v2M12 20v2M4.9 4.9l1.4 1.4M2 12h2M20 12h2M12 6v6l4 2', 'info'],
      'time-infinity': ['M6 12c0-1.7 1.3-3 3-3s3 1.3 3 3c0 3 3 6 6 6s6-3 6-6-3-6-6-6c-3 0-6 3-6 6 0 1.7-1.3 3-3 3s-3-1.3-3-3z', 'purple'],
      'time-stopwatch': ['M12 4V2M12 8v5l3 3M18 16c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6 6 2.7 6 6zM8 2h8', 'accent'],
    }
    const [d, ck] = map[name] || ['', 'default']
    return { name, d: d || '', colorKey: ck, size: 18 }
  })),

  // SECURITY (prefix: sec) — 16
  ...([
    'sec-lock','sec-shield','sec-key','sec-fingerprint','sec-scan','sec-badge','sec-alert-triangle',
    'sec-unlock','sec-check-shield','sec-aperture','sec-spy','sec-vault','sec-radar','sec-shield-off','sec-siren','sec-circuit',
  ].map((name): IconDef => {
    const map: Record<string, [string, string]> = {
      'sec-lock': [PATHS.lock, 'default'],
      'sec-shield': [PATHS.shield, 'success'],
      'sec-key': [PATHS.key, 'warning'],
      'sec-unlock': ['M6 10V7c0-3.3 2.7-6 6-6s6 2.7 6 6M5 11h14c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-8c0-1.1.9-2 2-2z', 'danger'],
      'sec-check-shield': ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4', 'success'],
      'sec-shield-off': ['M12 22s8-4 8-10V5M4 5v7c0 2.5 1.4 5 4.2 7M1 1l22 22', 'danger'],
    }
    const [d, ck] = map[name] || ['', 'default']
    return { name, d: d || '', colorKey: ck, size: 18 }
  })),

  // ANALYTICS (prefix: ana) — 18
  ...([
    'ana-bar','ana-pie','ana-line','ana-area','ana-scatter','ana-radar','ana-donut','ana-candlestick',
    'ana-gauge','ana-activity','ana-table','ana-list','ana-filter','ana-search','ana-sliders',
    'ana-mouse-pointer','ana-crosshair','ana-presentation',
  ].map((name): IconDef => {
    const map: Record<string, [string, string]> = {
      'ana-bar': [PATHS.barChart, 'info'],
      'ana-pie': [PATHS.pieChart, 'accent'],
      'ana-line': ['M3 20h18M3 16l4-6 5 4 6-8 4 3', 'purple'],
      'ana-activity': ['M3 12h4l2-9 6 18 4-9h4', 'danger'],
      'ana-table': ['M3 3h18v18H3V3zM3 9h18M3 15h18M9 3v18M15 3v18', 'default'],
      'ana-search': [PATHS.search, 'info'],
      'ana-crosshair': ['M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10zM12 6v12M6 12h12', 'danger'],
      'ana-presentation': ['M2 3h20M10 15v6M14 15v6M8 21h8M4 3v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V3', 'purple'],
    }
    const [d, ck] = map[name] || ['', 'default']
    return { name, d: d || '', colorKey: ck, size: 18 }
  })),

  // DEV (prefix: dev) — 20
  ...([
    'dev-code','dev-terminal','dev-git-branch','dev-database','dev-server','dev-container','dev-cloud',
    'dev-package','dev-cpu','dev-chip','dev-brackets','dev-braces','dev-git-fork','dev-git-merge',
    'dev-git-pull-request','dev-bug','dev-puzzle','dev-webhook','dev-api','dev-json',
  ].map((name): IconDef => {
    const map: Record<string, [string, string]> = {
      'dev-code': [PATHS.code, 'purple'],
      'dev-terminal': [PATHS.terminal, 'default'],
      'dev-git-branch': [PATHS.gitBranch, 'accent'],
      'dev-database': [PATHS.database, 'info'],
      'dev-cloud': [PATHS.cloud, 'info'],
      'dev-package': ['M12 2l9 5v10l-9 5-9-5V7l9-5zM12 2v10M12 22V12M12 12l9-5M12 12L3 7', 'accent'],
      'dev-cpu': ['M9 3h6v2H9V3zM9 19h6v2H9v-2zM3 9h2v6H3V9zM19 9h2v6h-2V9zM5 5h14v14H5V5zM9 9h6v6H9V9z', 'info'],
      'dev-bug': ['M12 8v4M12 16h0M10 4h4M8 6c-1.7 0-3 1.3-3 3v5c0 1.7 1.3 3 3 3h8c1.7 0 3-1.3 3-3V9c0-1.7-1.3-3-3-3M4 9L2 7M20 9l2-2M2 15l2 2M20 15l-2 2', 'danger'],
      'dev-webhook': ['M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8M12 12l4-4M12 12l-4-4', 'purple'],
      'dev-api': ['M8 4l-6 6 6 6M16 4l6 6-6 6M10 4l-4 16', 'purple'],
    }
    const [d, ck] = map[name] || ['', 'default']
    return { name, d: d || '', colorKey: ck, size: 18 }
  })),

  // BUSINESS/CRM (prefix: biz) — 24
  ...([
    'biz-briefcase','biz-building','biz-home','biz-globe','biz-map-pin','biz-megaphone','biz-presentation',
    'biz-award','biz-trophy','biz-handshake','biz-target','biz-rocket','biz-badge-percent','biz-stamp',
    'biz-clipboard-list','biz-factory','biz-anchor','biz-compass','biz-funnel','biz-workflow','biz-organization',
    'biz-network','biz-umbrella','biz-flame',
  ].map((name): IconDef => {
    const map: Record<string, [string, string]> = {
      'biz-briefcase': [PATHS.briefcase, 'info'],
      'biz-building': [PATHS.building, 'default'],
      'biz-home': [PATHS.home, 'info'],
      'biz-globe': [PATHS.globe, 'info'],
      'biz-map-pin': [PATHS.mapPin, 'danger'],
      'biz-target': [PATHS.target, 'danger'],
      'biz-rocket': [PATHS.rocket, 'accent'],
      'biz-handshake': ['M2 22l5-5M22 2l-5 5M16 8h2c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2h-2M8 16H6c-1.1 0-2-.9-2-2v-4c0-1.1.9-2 2-2h2', 'success'],
      'biz-stamp': ['M4 2h16v4H4V2zM4 6h16v14c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V6zM9 10h6', 'info'],
      'biz-compass': ['M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10zM9 9l6 2-2 6-6-2 2-6z', 'accent'],
      'biz-funnel': ['M3 4h18L14 14v4l-4 2v-6L3 4z', 'info'],
    }
    const [d, ck] = map[name] || ['', 'default']
    return { name, d: d || '', colorKey: ck, size: 18 }
  })),

  // DEVICES (prefix: device) — 16
  ...([
    'device-monitor','device-laptop','device-smartphone','device-tablet','device-hard-drive','device-printer',
    'device-keyboard','device-mouse','device-headphones','device-speaker','device-camera','device-router',
    'device-wifi','device-bluetooth','device-battery','device-plug',
  ].map((name): IconDef => {
    const map: Record<string, [string, string]> = {
      'device-monitor': [PATHS.monitor, 'info'],
      'device-laptop': ['M6 5h12v10H6V5zM2 19h20M6 15v4M18 15v4', 'info'],
      'device-smartphone': ['M6 2h12v20H6V2zM10 18h4M11 4h2', 'info'],
      'device-tablet': ['M5 2h14v20H5V2zM10 18h4M11 5h2', 'info'],
      'device-headphones': ['M3 14v-2c0-5 4-9 9-9s9 4 9 9v2M21 14c0 1.1-.9 2-2 2h-1c-.6 0-1-.4-1-1v-3c0-.6.4-1 1-1h1M3 14c0 1.1.9 2 2 2h1c.6 0 1-.4 1-1v-3c0-.6-.4-1-1-1H5', 'success'],
      'device-camera': ['M2 7h3l2-3h10l2 3h3v13H2V7zM12 18c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4z', 'purple'],
      'device-wifi': ['M5 12c3.9-3.9 10.2-3.9 14.1 0M9 16c2.3-2.3 6-2.3 8.3 0M12 20h0', 'info'],
      'device-battery': ['M7 6h13v12H7V6zM23 9v6M3 9v6', 'success'],
    }
    const [d, ck] = map[name] || ['', 'default']
    return { name, d: d || '', colorKey: ck, size: 18 }
  })),

  // NATURE (prefix: nat) — 14
  ...([
    'nat-sun','nat-moon','nat-cloud','nat-cloud-rain','nat-cloud-snow','nat-leaf','nat-flower',
    'nat-mountain','nat-tree','nat-droplet','nat-wind','nat-zap','nat-snowflake','nat-wave',
  ].map((name): IconDef => {
    const map: Record<string, [string, string]> = {
      'nat-sun': [PATHS.sun, 'warning'],
      'nat-moon': [PATHS.moon, 'purple'],
      'nat-cloud': [PATHS.cloud, 'info'],
      'nat-leaf': ['M6 26C10 16 16 8 26 6c-4 8-4 16 0 20-8-2-14-2-20 0z', 'success'],
      'nat-droplet': ['M12 2.69l5.66 5.66c3.12 3.12 3.12 8.19 0 11.31C14.53 22.88 9.47 22.88 6.34 19.69 3.22 16.56 3.22 11.49 6.34 8.35L12 2.69z', 'info'],
      'nat-wind': ['M3 8h12c1.7 0 3-1.3 3-3s-1.3-3-3-3M3 16h10c1.7 0 3 1.3 3 3s-1.3 3-3 3M3 12h16', 'info'],
      'nat-zap': [PATHS.zap, 'warning'],
    }
    const [d, ck] = map[name] || ['', 'default']
    return { name, d: d || '', colorKey: ck, size: 18 }
  })),

  // FOOD (prefix: food) — 12
  ...([
    'food-coffee','food-utensils','food-pizza','food-apple','food-cake','food-wine','food-shopping-bag',
    'food-egg','food-beef','food-bell','food-croissant','food-icecream',
  ].map((name): IconDef => {
    const map: Record<string, [string, string]> = {
      'food-shopping-bag': ['M4 7h16v15H4V7zM8 7V5c0-2.2 1.8-4 4-4s4 1.8 4 4v2', 'info'],
      'food-egg': ['M12 22c4.4 0 8-4 8-8.5C20 8 16 2 12 2S4 8 4 13.5C4 18 7.6 22 12 22z', 'warning'],
    }
    const [d, ck] = map[name] || ['', 'default']
    return { name, d: d || '', colorKey: ck, size: 18 }
  })),

  // TRANSPORT (prefix: trans) — 12
  ...([
    'trans-car','trans-truck','trans-plane','trans-ship','trans-bike','trans-bus','trans-train',
    'trans-rocket','trans-package','trans-box','trans-fuel','trans-dolly',
  ].map((name): IconDef => {
    const map: Record<string, [string, string]> = {
      'trans-rocket': [PATHS.rocket, 'accent'],
      'trans-package': ['M12 2l9 5v10l-9 5-9-5V7l9-5zM12 2v10M12 22V12M12 12l9-5M12 12L3 7', 'accent'],
    }
    const [d, ck] = map[name] || ['', 'default']
    return { name, d: d || '', colorKey: ck, size: 18 }
  })),

  // HEALTH (prefix: med) — 12
  ...([
    'med-heart','med-activity','med-pill','med-stethoscope','med-cross','med-brain','med-bone',
    'med-eyedropper','med-syringe','med-bandage','med-heart-pulse','med-thermometer',
  ].map((name): IconDef => {
    const map: Record<string, [string, string]> = {
      'med-heart': [PATHS.heart, 'danger'],
      'med-activity': ['M3 12h4l2-9 6 18 4-9h4', 'danger'],
      'med-brain': ['M12 2C9 2 7 4 7 7s2 5 5 5 5-2 5-5-2-5-5-5zM12 12c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5zM7 7C4 7 2 9 2 12s2 5 5 5M17 7c3 0 5 2 5 5s-2 5-5 5', 'purple'],
      'med-heart-pulse': ['M20 2c-2.5 0-4.5 2-5 4.5C14.5 4 12.5 2 10 2 6.7 2 4 4.7 4 8c0 4 4 8 8 12 4-4 8-8 8-12 0-3.3-2.7-6-6-6zM3 13h4l2-5 6 12 4-7h4', 'danger'],
    }
    const [d, ck] = map[name] || ['', 'default']
    return { name, d: d || '', colorKey: ck, size: 18 }
  })),

  // EDUCATION (prefix: edu) — 12
  ...([
    'edu-book','edu-graduation','edu-pencil-ruler','edu-languages','edu-library','edu-scroll',
    'edu-telescope','edu-microscope','edu-blackboard','edu-pencil','edu-highlighter','edu-backpack',
  ].map((name): IconDef => {
    const map: Record<string, [string, string]> = {
      'edu-book': ['M4 4h10l2 3h3v13H4V4zM4 22V8M4 22c1.7 0 3-1.3 3-3s-1.3-3-3-3', 'purple'],
      'edu-graduation': ['M3 10l9-5 9 5-9 5-9-5zM5.5 12.5v4L12 20l6.5-3.5v-4', 'info'],
      'edu-pencil': [PATHS.edit, 'warning'],
      'edu-languages': ['M5 7h14M12 3v18M5 17h14M7 3h10M2 21h20', 'info'],
    }
    const [d, ck] = map[name] || ['', 'default']
    return { name, d: d || '', colorKey: ck, size: 18 }
  })),

  // MEDIA (prefix: media) — 14
  ...([
    'media-play','media-pause','media-stop','media-video','media-mic','media-camera','media-image',
    'media-music','media-headphones','media-speaker','media-film','media-clapperboard','media-tv','media-radio',
  ].map((name): IconDef => {
    const map: Record<string, [string, string]> = {
      'media-play': [PATHS.play, 'accent'],
      'media-pause': [PATHS.pause, 'default'],
      'media-stop': [PATHS.stop, 'danger'],
      'media-video': [PATHS.video, 'purple'],
      'media-mic': [PATHS.microphone, 'danger'],
      'media-camera': ['M2 7h3l2-3h10l2 3h3v13H2V7zM12 18c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4z', 'purple'],
      'media-image': [PATHS.image, 'purple'],
    }
    const [d, ck] = map[name] || ['', 'default']
    return { name, d: d || '', colorKey: ck, size: 18 }
  })),

  // EMOJI/SENTIMENTS (prefix: emoji) — 16
  ...([
    'emoji-happy','emoji-love','emoji-think','emoji-wow','emoji-cool','emoji-sad','emoji-idea',
    'emoji-rocket','emoji-party','emoji-magic','emoji-target','emoji-bulb','emoji-shield',
    'emoji-crown','emoji-star-eyes','emoji-laugh',
  ].map((name): IconDef => ({
    name, d: '', colorKey: 'warning', size: 22
  }))),

  // BADGES (prefix: mini) — 10
  ...([
    'mini-new','mini-beta','mini-pro','mini-hot','mini-free','mini-vip','mini-alert','mini-check','mini-sale','mini-soon',
  ].map((name): IconDef => ({
    name, d: '', colorKey: 'accent', size: 16
  }))),

  // FLOW ANDERFLOW (prefix: flow) — 12
  ...([
    'flow-briefing','flow-proposta','flow-contrato','flow-design','flow-dev','flow-teste',
    'flow-homolog','flow-deploy','flow-entrega','flow-garantia','flow-progress','flow-financeiro',
  ].map((name): IconDef => ({
    name, d: '', colorKey: 'info', size: 22
  }))),

  // ANIMATED FIGURINES (prefix: fig) — 20
  ...([
    'fig-star-dance','fig-heart-beat','fig-sparkle','fig-bubble','fig-loading-dots','fig-gear-spin',
    'fig-wave','fig-pulse-ring','fig-confetti','fig-rainbow','fig-typing','fig-rocket-launch',
    'fig-sun-moon','fig-check-anim','fig-ring-spin','fig-firework','fig-ping','fig-floating',
    'fig-rotate','fig-beat',
  ].map((name): IconDef => ({
    name, d: '', colorKey: 'accent', size: 28
  }))),

  // ILLUSTRATIONS (prefix: illu) — 12
  ...([
    'illu-project','illu-chat-bubble','illu-laptop','illu-trophy','illu-phone','illu-calendar-page',
    'illu-envelope','illu-clock-page','illu-rocket','illu-target','illu-star','illu-shield',
  ].map((name): IconDef => ({
    name, d: '', colorKey: 'info', size: 48
  }))),

  // ORNAMENTS (prefix: deco) — 12
  ...([
    'deco-flower','deco-diamond','deco-circle-dots','deco-zigzag','deco-wave-line','deco-leaf',
    'deco-drops','deco-crown-line','deco-grid','deco-stars','deco-frame','deco-divider',
  ].map((name): IconDef => ({
    name, d: '', colorKey: 'default', size: 22
  }))),
]

export const TOTAL_ICONS = ICON_DEFS.length
