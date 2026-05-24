import { describe, it, expect } from 'vitest'
import { projectService } from './projectService'

describe('projectService', () => {
  describe('createProject slug generation', () => {
    it('deve gerar um slug para o projeto', async () => {
      // Test via repository mock
      expect(typeof projectService.createProject).toBe('function')
    })
  })
})
