import type { IconVariant } from './variants'

export function makeStatusIcons(): Record<string, (v: IconVariant) => string> {
  return {
    'status-ok': (v) => { const c=v==='professional'?'#3D9A6E':'var(--text-3)'; const o=v==='professional'?'0.15':'0.08'; return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="${c}" opacity="${o}"/><circle cx="12" cy="12" r="10" stroke="${c}" stroke-width="1.5"/><path d="M5 13l4 4L19 7" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
    'status-error': (v) => { const c=v==='professional'?'#C44A3A':'var(--text-3)'; const o=v==='professional'?'0.15':'0.08'; return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="${c}" opacity="${o}"/><circle cx="12" cy="12" r="10" stroke="${c}" stroke-width="1.5"/><path d="M9 9l6 6M15 9l-6 6" stroke="${c}" stroke-width="2" stroke-linecap="round"/></svg>` },
    'status-warn': (v) => { const c=v==='professional'?'#C4852A':'var(--text-3)'; const o=v==='professional'?'0.15':'0.08'; return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3L2 21h20L12 3z" fill="${c}" opacity="${o}" stroke="${c}" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 10v4M12 17h0" stroke="${c}" stroke-width="2" stroke-linecap="round"/></svg>` },
    'status-info': (v) => { const c=v==='professional'?'#3A7AC4':'var(--text-3)'; const o=v==='professional'?'0.12':'0.08'; return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="${c}" opacity="${o}"/><circle cx="12" cy="12" r="10" stroke="${c}" stroke-width="1.5"/><path d="M12 16v-4M12 8h0" stroke="${c}" stroke-width="2" stroke-linecap="round"/></svg>` },
    'status-done': (v) => { const c=v==='professional'?'#3D9A6E':'var(--text-3)'; const f=v==='professional'?'#fff':'var(--bg)'; return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="${c}" opacity="${v==='professional'?'1':'0.5'}"/><path d="M5 13l4 4L19 7" stroke="${f}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
  }
}
