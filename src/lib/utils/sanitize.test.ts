import { describe, it, expect } from 'vitest'
import { sanitize } from './sanitize'

describe('sanitize', () => {
  describe('html', () => {
    it('deve escapar tags HTML', () => {
      expect(sanitize.html('<script>alert("xss")</script>'))
        .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;')
    })
  })

  describe('text', () => {
    it('deve escapar < e >', () => {
      expect(sanitize.text('<b>texto</b>')).toBe('&lt;b&gt;texto&lt;/b&gt;')
    })
  })

  describe('trim', () => {
    it('deve limitar ao tamanho máximo', () => {
      expect(sanitize.trim('abc', 2)).toBe('ab')
    })
  })

  describe('slug', () => {
    it('deve gerar slug limpo', () => {
      expect(sanitize.slug('Meu Projeto #1')).toBe('meu-projeto-1')
    })
  })
})
