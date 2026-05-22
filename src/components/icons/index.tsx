import React from 'react'

const Svg = ({ children, className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>{children}</svg>
)

export const IconProject = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M10 2v3h3"/><path d="M5 8h6M5 11h4"/></Svg>
)
export const IconClient = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><circle cx="8" cy="5" r="2.5"/><path d="M2.5 14c0-3.5 2.5-5.5 5.5-5.5s5.5 2 5.5 5.5"/></Svg>
)
export const IconDashboard = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></Svg>
)
export const IconFinancial = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><circle cx="8" cy="8" r="6"/><path d="M8 4.5v7M6 6.5c0-.8.9-1.5 2-1.5s2 .7 2 1.5c0 1.8-4 1.8-4 3.5 0 .8.9 1.5 2 1.5s2-.7 2-1.5"/></Svg>
)
export const IconChat = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M14 5a2 2 0 00-2-2H4a2 2 0 00-2 2v5a2 2 0 002 2h5l3 2v-2h0a2 2 0 002-2V5z"/></Svg>
)
export const IconCRM = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M2 3h12l-4.5 5v4l-3-1.5V8L2 3z"/></Svg>
)
export const IconAnalytics = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M2 12l3.5-4 3 2.5 3.5-5.5L15 3"/><path d="M2 14h12"/></Svg>
)
export const IconSettings = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><circle cx="8" cy="8" r="2"/><path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.5 3.5l1 1M11.5 11.5l1 1M12.5 3.5l-1 1M4.5 11.5l-1 1"/></Svg>
)
export const IconNotification = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M13 11V7a5 5 0 00-10 0v4l-1.5 2h13L13 11z"/><path d="M6 14a2 2 0 004 0"/></Svg>
)
export const IconFile = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M10 2v3h3"/></Svg>
)
export const IconTicket = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M2 5a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 000-4V5z"/><path d="M6 4v8M10 4v8"/></Svg>
)
export const IconCalendar = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><rect x="2" y="3" width="12" height="11" rx="1"/><path d="M4 3V2M12 3V2M2 7h12"/></Svg>
)
export const IconAutomation = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M5 2h6v3l2 2v6l-2 2H5l-2-2V7l2-2V2z"/><path d="M5 2v1M11 2v1M5 7h6"/></Svg>
)
export const IconAI = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M4 12l2-6h1l3 8h-1l-1-2.5H5L4 12H3z"/><path d="M5.5 8.5h3"/><circle cx="12" cy="5" r="2"/><path d="M13 10l-1.5 4h2l-1.5-4"/></Svg>
)
export const IconKnowledge = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M2 3h6l1 1h5v10H2V3z"/><path d="M2 8h12"/></Svg>
)
export const IconPlan = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M8 2v12M4 6l4-4 4 4M4 10l4 4 4-4"/></Svg>
)
export const IconProfile = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 3-5 6-5s6 2 6 5"/></Svg>
)
export const IconArrowRight = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M3 8h10M9 4l4 4-4 4"/></Svg>
)
export const IconArrowLeft = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M13 8H3M7 4l-4 4 4 4"/></Svg>
)
export const IconCheck = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M2 8l4 4 8-8"/></Svg>
)
export const IconPlus = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M8 3v10M3 8h10"/></Svg>
)
export const IconSearch = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></Svg>
)
export const IconFilter = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M2 4h12l-4 4.5v3l-2 1v-4L2 4z"/></Svg>
)
export const IconClose = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M3 3l10 10M13 3L3 13"/></Svg>
)
export const IconMenu = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M2 4h12M2 8h12M2 12h12"/></Svg>
)
export const IconLogout = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M6 3h7v10H6M10 8H2M4 6l-2 2 2 2"/></Svg>
)
export const IconEdit = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M2 11.5V14h2.5L13 5.5 10.5 3 2 11.5z"/><path d="M9 4.5l2.5 2.5"/></Svg>
)
export const IconTrash = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M3 4v9a1 1 0 001 1h8a1 1 0 001-1V4"/><path d="M6 7v4M10 7v4"/></Svg>
)
export const IconEye = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z"/><circle cx="8" cy="8" r="1.5"/></Svg>
)
export const IconSend = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M3 2l12 6L3 14l3-6-3-6z"/></Svg>
)
export const IconChevronLeft = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M10 3L5 8l5 5"/></Svg>
)
export const IconChevronRight = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M6 3l5 5-5 5"/></Svg>
)
export const IconChevronDown = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M3 6l5 5 5-5"/></Svg>
)
export const IconMoreHorizontal = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><circle cx="3" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="8" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="13" cy="8" r="1" fill="currentColor" stroke="none"/></Svg>
)
export const IconLayoutGrid = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><rect x="2" y="2" width="5" height="5" rx="0.5"/><rect x="9" y="2" width="5" height="5" rx="0.5"/><rect x="2" y="9" width="5" height="5" rx="0.5"/><rect x="9" y="9" width="5" height="5" rx="0.5"/></Svg>
)
export const IconList = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M2 4h12M2 8h12M2 12h12"/></Svg>
)
export const IconLoader = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props} className={`animate-spin ${props.className || ''}`}><path d="M8 2a6 6 0 016 6"/></Svg>
)
export const IconThumbsUp = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M3 14h2V7H3a1 1 0 00-1 1v5a1 1 0 001 1z"/><path d="M5 7h5.5a1.5 1.5 0 011.4.9L13 10.5V12a1 1 0 01-1 1H9l-1 2.5c-.3.6-1 .8-1.5.4L5 14.5"/></Svg>
)
export const IconThumbsDown = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M13 2h-2v7h2a1 1 0 001-1V3a1 1 0 00-1-1z"/><path d="M11 9H5.5A1.5 1.5 0 004.1 8.1L3 5.5V4a1 1 0 011-1h3l1-2.5c.3-.6 1-.8 1.5-.4L11 1.5"/></Svg>
)
export const IconImage = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><rect x="2" y="2" width="12" height="12" rx="1"/><circle cx="5.5" cy="6" r="1" fill="currentColor" stroke="none"/><path d="M2 12l3-3 2 2 3-4 4 5"/></Svg>
)
export const IconPaperclip = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M9.5 3l-5 5a3 3 0 005 5l5-5a1.5 1.5 0 00-2-2l-5 5a.5.5 0 00.7.7l4-4"/></Svg>
)
export const IconPlay = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M4 2l10 6-10 6V2z"/></Svg>
)
export const IconPause = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props} fill="currentColor" stroke="none"><rect x="3" y="2" width="3" height="12" rx="0.5"/><rect x="10" y="2" width="3" height="12" rx="0.5"/></Svg>
)
export const IconClock = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></Svg>
)
export const IconSparkles = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M12 2l1.5 3.5L17 7l-3.5 1.5L12 12l-1.5-3.5L7 7l3.5-1.5zM5 12l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/></Svg>
)
export const IconBot = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><rect x="3" y="4" width="10" height="8" rx="1.5"/><path d="M6 4V2h4v2M5 8h6M5 10h6"/><circle cx="7" cy="7.5" r="0.5" fill="currentColor"/><circle cx="9" cy="7.5" r="0.5" fill="currentColor"/><path d="M8 12v2M3 12h10"/></Svg>
)
export const IconArrowUpRight = (props: React.SVGProps<SVGSVGElement>) => (
  <Svg {...props}><path d="M4 12l8-8M12 4H5m7 0v7"/></Svg>
)
