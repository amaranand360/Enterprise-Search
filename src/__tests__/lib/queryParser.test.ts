import { parseQuery, generateSearchSuggestions, explainQuery } from '@/lib/queryParser'

describe('Query Parser', () => {
  describe('parseQuery', () => {
    it('should parse basic search queries', () => {
      const result = parseQuery('project alpha status')
      
      expect(result.originalQuery).toBe('project alpha status')
      expect(result.cleanQuery).toBe('project alpha status')
      expect(result.intent.type).toBe('search')
    })

    it('should detect action queries', () => {
      const result = parseQuery('send email to team about deployment')
      
      expect(result.intent.type).toBe('action')
      expect(result.intent.action).toBe('send')
      expect(result.intent.confidence).toBeGreaterThan(0.7)
    })

    it('should detect question queries', () => {
      const result = parseQuery('what is the status of project alpha?')
      
      expect(result.intent.type).toBe('question')
      expect(result.intent.confidence).toBe(0.9)
    })

    it('should extract content types', () => {
      const result = parseQuery('find emails about budget review')
      
      expect(result.filters.contentTypes).toContain('email')
      expect(result.entities.some(e => e.type === 'content_type' && e.value === 'email')).toBe(true)
    })

    it('should extract tool mentions', () => {
      const result = parseQuery('search in slack for team updates')
      
      expect(result.filters.tools).toContain('slack')
      expect(result.entities.some(e => e.type === 'tool' && e.value === 'Slack')).toBe(true)
    })

    it('should extract person mentions', () => {
      const result = parseQuery('emails from John Smith about project')
      
      expect(result.filters.author).toBe('John Smith')
      expect(result.entities.some(e => e.type === 'person' && e.value === 'John Smith')).toBe(true)
    })

    it('should extract date mentions', () => {
      const result = parseQuery('meetings from last week')
      
      expect(result.entities.some(e => e.type === 'date')).toBe(true)
    })

    it('should clean up the query', () => {
      const result = parseQuery('find emails from John in slack about the project')
      
      expect(result.cleanQuery).not.toContain('from')
      expect(result.cleanQuery).not.toContain('in')
      expect(result.cleanQuery).not.toContain('the')
    })
  })

  describe('generateSearchSuggestions', () => {
    it('should generate suggestions based on query', () => {
      const suggestions = generateSearchSuggestions('project alpha')
      
      expect(suggestions).toBeInstanceOf(Array)
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions.length).toBeLessThanOrEqual(5)
    })

    it('should include tool-specific suggestions', () => {
      const suggestions = generateSearchSuggestions('slack messages')
      
      expect(suggestions.some(s => s.includes('slack') || s.includes('Slack'))).toBe(true)
    })

    it('should include temporal suggestions', () => {
      const suggestions = generateSearchSuggestions('meeting')
      
      expect(suggestions.some(s => s.includes('last week') || s.includes('recent'))).toBe(true)
    })
  })

  describe('explainQuery', () => {
    it('should explain basic search queries', () => {
      const parsed = parseQuery('project alpha status')
      const explanation = explainQuery(parsed)
      
      expect(explanation).toContain('Searching for')
      expect(explanation).toContain('project alpha status')
    })

    it('should explain filtered queries', () => {
      const parsed = parseQuery('emails from John about budget')
      const explanation = explainQuery(parsed)
      
      expect(explanation).toContain('by John')
      expect(explanation).toContain('email')
    })

    it('should explain tool-specific queries', () => {
      const parsed = parseQuery('slack messages about deployment')
      const explanation = explainQuery(parsed)
      
      expect(explanation).toContain('in Slack')
    })

    it('should handle empty queries', () => {
      const parsed = parseQuery('')
      const explanation = explainQuery(parsed)
      
      expect(explanation).toBe('')
    })
  })

  describe('Edge cases', () => {
    it('should handle very long queries', () => {
      const longQuery = 'a'.repeat(1000)
      const result = parseQuery(longQuery)
      
      expect(result.originalQuery).toBe(longQuery)
      expect(result.intent.type).toBe('search')
    })

    it('should handle special characters', () => {
      const result = parseQuery('search for @user #tag $variable')
      
      expect(result.originalQuery).toContain('@user')
      expect(result.originalQuery).toContain('#tag')
      expect(result.originalQuery).toContain('$variable')
    })

    it('should handle mixed case', () => {
      const result = parseQuery('SEND EMAIL TO TEAM')
      
      expect(result.intent.type).toBe('action')
      expect(result.intent.action).toBe('send')
    })

    it('should handle multiple content types', () => {
      const result = parseQuery('find emails and documents about project')
      
      expect(result.filters.contentTypes).toContain('email')
      expect(result.filters.contentTypes).toContain('document')
    })
  })
})
