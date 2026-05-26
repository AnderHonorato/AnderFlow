export const AI_CONFIG = {
  provider: (process.env.AI_PROVIDER as string) || 'deepseek',

  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
    modelPro: process.env.DEEPSEEK_MODEL_PRO || 'deepseek-v4-pro',
    betaUrl: process.env.DEEPSEEK_BETA_BASE_URL || 'https://api.deepseek.com/beta',
    anthropicUrl: process.env.DEEPSEEK_ANTHROPIC_BASE_URL || 'https://api.deepseek.com/anthropic',
  },

  defaults: {
    maxTokens: 4096,
    streamEnabled: true,
    thinkingEnabled: false,
    reasoningEffort: 'medium' as 'low' | 'medium' | 'high',
    cacheMonitoring: true,
    temperature: 0.7,
  },

  pricing: {
    flash: {
      input: 0.14,
      output: 0.28,
      cacheHit: 0.0028,
    },
    pro: {
      input: 0.435,
      output: 0.87,
      cacheHit: 0.003625,
    },
  },
} as const

export function getEffectiveModel(preferPro?: boolean): string {
  if (preferPro && AI_CONFIG.deepseek.modelPro) {
    return AI_CONFIG.deepseek.modelPro
  }
  return AI_CONFIG.deepseek.model
}

export function getApiKey(): string {
  return AI_CONFIG.deepseek.apiKey
}
