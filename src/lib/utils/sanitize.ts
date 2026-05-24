export const sanitize = {
  html: (dirty: string): string => {
    return dirty
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  },

  text: (input: string): string => {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  },

  sql: (input: string): string => {
    return input.replace(/['";\\]/g, '')
  },

  trim: (input: string, maxLength = 10000): string => {
    return input.trim().substring(0, maxLength)
  },

  slug: (input: string): string => {
    return input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 100)
  },
}
