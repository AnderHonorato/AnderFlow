const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

interface ApiOptions {
  method?: string
  body?: any
  headers?: Record<string, string>
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }

    if (body) {
      config.body = JSON.stringify(body)
    }

    const response = await fetch(`${this.baseUrl}/api${endpoint}`, config)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint)
  }

  async post<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body })
  }

  async patch<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  projects = {
    list: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : ''
      return this.get(`/projects${query}`)
    },
    get: (id: string) => this.get(`/projects/${id}`),
    create: (data: any) => this.post('/projects', data),
    update: (id: string, data: any) => this.patch(`/projects/${id}`, data),
    delete: (id: string) => this.delete(`/projects/${id}`),
  }

  tasks = {
    list: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : ''
      return this.get(`/tasks${query}`)
    },
    create: (data: any) => this.post('/tasks', data),
  }

  clients = {
    list: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : ''
      return this.get(`/clients${query}`)
    },
    create: (data: any) => this.post('/clients', data),
  }

  invoices = {
    list: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : ''
      return this.get(`/invoices${query}`)
    },
    create: (data: any) => this.post('/invoices', data),
  }

  tickets = {
    list: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : ''
      return this.get(`/tickets${query}`)
    },
    create: (data: any) => this.post('/tickets', data),
  }

  leads = {
    list: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : ''
      return this.get(`/leads${query}`)
    },
    create: (data: any) => this.post('/leads', data),
  }

  notifications = {
    list: (userId: string, unread?: boolean) => {
      const params = new URLSearchParams({ userId })
      if (unread) params.set('unread', 'true')
      return this.get(`/notifications?${params}`)
    },
    markRead: (ids: string[]) => this.patch('/notifications', { ids }),
    markAllRead: (userId: string) => this.patch('/notifications', { userId, markAll: true }),
  }
}

export const api = new ApiClient(BASE_URL)
