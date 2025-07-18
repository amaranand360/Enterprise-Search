import { SlackDemoConnector } from '@/services/demo/SlackDemoConnector'
import { DEMO_TOOLS } from '@/lib/config'

describe('SlackDemoConnector', () => {
  let connector: SlackDemoConnector
  const mockTool = DEMO_TOOLS.find(t => t.id === 'slack')!

  beforeEach(() => {
    const config = {
      tool: mockTool,
      connectionDelay: [100, 200] as [number, number],
      searchDelay: [50, 100] as [number, number],
      failureRate: 0,
      dataSize: 'small' as const
    }
    connector = new SlackDemoConnector(config)
  })

  describe('Connection Management', () => {
    it('should connect successfully', async () => {
      const result = await connector.connect()
      expect(result).toBe(true)
      
      const status = connector.getConnectionStatus()
      expect(status.isConnected).toBe(true)
      expect(status.lastSync).toBeInstanceOf(Date)
    })

    it('should disconnect successfully', async () => {
      await connector.connect()
      await connector.disconnect()
      
      const status = connector.getConnectionStatus()
      expect(status.isConnected).toBe(false)
      expect(status.lastSync).toBeUndefined()
    })

    it('should handle connection failures', async () => {
      const failingConfig = {
        tool: mockTool,
        connectionDelay: [10, 20] as [number, number],
        searchDelay: [10, 20] as [number, number],
        failureRate: 1, // Always fail
        dataSize: 'small' as const
      }
      const failingConnector = new SlackDemoConnector(failingConfig)

      await expect(failingConnector.connect()).rejects.toThrow()
    })
  })

  describe('Search Functionality', () => {
    beforeEach(async () => {
      await connector.connect()
    })

    it('should return search results', async () => {
      const results = await connector.search({ query: 'test' })
      
      expect(results).toBeInstanceOf(Array)
      expect(results.length).toBeGreaterThan(0)
      
      results.forEach(result => {
        expect(result).toHaveProperty('id')
        expect(result).toHaveProperty('title')
        expect(result).toHaveProperty('content')
        expect(result).toHaveProperty('type', 'message')
        expect(result).toHaveProperty('tool', mockTool)
        expect(result).toHaveProperty('timestamp')
        expect(result).toHaveProperty('relevanceScore')
      })
    })

    it('should filter results by query', async () => {
      const allResults = await connector.search()
      const filteredResults = await connector.search({ query: 'meeting' })
      
      expect(filteredResults.length).toBeLessThanOrEqual(allResults.length)
      
      // Check that filtered results contain the query term
      filteredResults.forEach(result => {
        const containsQuery = 
          result.title.toLowerCase().includes('meeting') ||
          result.content.toLowerCase().includes('meeting') ||
          result.author?.toLowerCase().includes('meeting')
        expect(containsQuery).toBe(true)
      })
    })

    it('should limit results by maxResults', async () => {
      const results = await connector.search({ maxResults: 5 })
      expect(results.length).toBeLessThanOrEqual(5)
    })

    it('should filter by content types', async () => {
      const results = await connector.search({ contentTypes: ['message'] })
      
      results.forEach(result => {
        expect(result.type).toBe('message')
      })
    })

    it('should filter by date range', async () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      
      const results = await connector.search({
        dateRange: { start: yesterday, end: now }
      })
      
      results.forEach(result => {
        expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(yesterday.getTime())
        expect(result.timestamp.getTime()).toBeLessThanOrEqual(now.getTime())
      })
    })

    it('should throw error when not connected', async () => {
      await connector.disconnect()
      
      await expect(connector.search()).rejects.toThrow('Not connected to Slack')
    })
  })

  describe('Slack-specific Methods', () => {
    beforeEach(async () => {
      await connector.connect()
    })

    it('should return channels list', async () => {
      const channels = await connector.getChannels()
      
      expect(channels).toBeInstanceOf(Array)
      expect(channels.length).toBeGreaterThan(0)
      
      channels.forEach(channel => {
        expect(typeof channel).toBe('string')
        expect(channel.startsWith('#')).toBe(true)
      })
    })

    it('should return channel messages', async () => {
      const channels = await connector.getChannels()
      const messages = await connector.getChannelMessages(channels[0])
      
      expect(messages).toBeInstanceOf(Array)
      messages.forEach(message => {
        expect(message.metadata?.channel).toBe(channels[0])
      })
    })

    it('should return direct messages', async () => {
      const messages = await connector.getDirectMessages()
      
      expect(messages).toBeInstanceOf(Array)
      messages.forEach(message => {
        expect(message.metadata?.isDirect).toBe(true)
        expect(message.metadata?.channel).toBe('DM')
      })
    })

    it('should search in specific channel', async () => {
      const channels = await connector.getChannels()
      const results = await connector.searchInChannel(channels[0], 'test')
      
      results.forEach(result => {
        expect(result.metadata?.channel).toBe(channels[0])
      })
    })

    it('should return user activity', async () => {
      const results = await connector.getUserActivity('John')
      
      results.forEach(result => {
        expect(result.author?.toLowerCase()).toContain('john')
      })
    })
  })

  describe('Data Generation', () => {
    beforeEach(async () => {
      await connector.connect()
    })

    it('should generate realistic message data', async () => {
      const results = await connector.search({ maxResults: 10 })
      
      results.forEach(result => {
        // Check message structure
        expect(result.title).toMatch(/Message in #/)
        expect(result.content).toBeTruthy()
        expect(result.author).toBeTruthy()
        expect(result.metadata?.channel).toBeTruthy()
        expect(result.metadata?.reactions).toBeInstanceOf(Array)
        expect(typeof result.metadata?.replies).toBe('number')
        expect(typeof result.metadata?.isThread).toBe('boolean')
        expect(result.metadata?.mentions).toBeInstanceOf(Array)
        expect(result.metadata?.tags).toBeInstanceOf(Array)
      })
    })

    it('should generate varied reaction data', async () => {
      const results = await connector.search({ maxResults: 20 })
      
      const hasReactions = results.some(result => 
        result.metadata?.reactions && result.metadata.reactions.length > 0
      )
      expect(hasReactions).toBe(true)
      
      // Check reaction structure
      results.forEach(result => {
        if (result.metadata?.reactions) {
          result.metadata.reactions.forEach((reaction: any) => {
            expect(reaction).toHaveProperty('emoji')
            expect(reaction).toHaveProperty('count')
            expect(typeof reaction.count).toBe('number')
            expect(reaction.count).toBeGreaterThan(0)
          })
        }
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle sync errors gracefully', async () => {
      await connector.connect()
      
      // Sync should not throw even if there are internal errors
      await expect(connector.sync()).resolves.not.toThrow()
    })

    it('should handle search errors when disconnected', async () => {
      await expect(connector.search()).rejects.toThrow()
    })

    it('should handle invalid channel names', async () => {
      await connector.connect()
      
      const results = await connector.getChannelMessages('invalid-channel')
      expect(results).toBeInstanceOf(Array)
      expect(results.length).toBe(0)
    })
  })
})
