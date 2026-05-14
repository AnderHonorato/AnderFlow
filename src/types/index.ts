export type Role = 'ADMIN' | 'MANAGER' | 'DEVELOPER' | 'CLIENT'
export type ProjectStatus = 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'REVIEW' | 'APPROVED' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED' | 'OVERDUE'
export type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'TRANSFER' | 'PAYPAL' | 'SUBSCRIPTION'
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
export type ContractStatus = 'DRAFT' | 'PENDING_SIGNATURE' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'RENEWED'
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_CLIENT' | 'WAITING_TEAM' | 'RESOLVED' | 'CLOSED'
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST'
export type PlanType = 'BASIC' | 'PRO' | 'ENTERPRISE'

export interface User {
  id: string
  name: string
  email: string
  image?: string
  role: Role
  company?: string
  phone?: string
  plan: PlanType
  isOnline: boolean
}

export interface Project {
  id: string
  name: string
  slug: string
  description?: string
  type: string
  status: ProjectStatus
  priority: Priority
  progress: number
  budget?: number
  startDate?: string
  endDate?: string
  deadline?: string
  client: User
  tasks: Task[]
  tags: string[]
}

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: Priority
  assignee?: User
  dueDate?: string
  subtasks: Task[]
  order: number
}

export interface Invoice {
  id: string
  number: string
  client: User
  status: InvoiceStatus
  total: number
  dueDate: string
  paidAt?: string
  items: InvoiceItem[]
}

export interface InvoiceItem {
  description: string
  quantity: number
  price: number
  total: number
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  link?: string
  isRead: boolean
  createdAt: string
}

export interface Lead {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  status: LeadStatus
  score: number
  value?: number
  source?: string
}

export interface Message {
  id: string
  content: string
  senderId: string
  type: string
  isRead: boolean
  createdAt: string
}
