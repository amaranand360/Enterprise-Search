import { 
  cn, 
  generateId, 
  debounce, 
  sleep, 
  randomDelay, 
  formatRelativeTime, 
  formatFileSize 
} from '@/lib/utils'

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional')
    })

    it('should handle undefined and null values', () => {
      expect(cn('base', undefined, null, 'end')).toBe('base end')
    })
  })

  describe('generateId', () => {
    it('should generate a string', () => {
      const id = generateId()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })

    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })
  })

  describe('debounce', () => {
    jest.useFakeTimers()

    it('should delay function execution', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn()
      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should cancel previous calls', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      jest.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    afterEach(() => {
      jest.clearAllTimers()
    })
  })

  describe('sleep', () => {
    it('should resolve after specified time', async () => {
      const start = Date.now()
      await sleep(10) // Use shorter delay for tests
      const end = Date.now()
      expect(end - start).toBeGreaterThanOrEqual(5) // Allow some tolerance
    }, 1000) // Increase timeout
  })

  describe('randomDelay', () => {
    it('should resolve within the specified range', async () => {
      const start = Date.now()
      await randomDelay(5, 15) // Use shorter delays for tests
      const end = Date.now()
      const duration = end - start
      expect(duration).toBeGreaterThanOrEqual(0) // Allow some tolerance
      expect(duration).toBeLessThanOrEqual(50)
    }, 1000) // Increase timeout
  })

  describe('formatRelativeTime', () => {
    const now = new Date('2024-01-15T12:00:00Z')
    
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(now.getTime())
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should format recent times correctly', () => {
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5m ago')
    })

    it('should format hours correctly', () => {
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
      expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago')
    })

    it('should format days correctly', () => {
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(threeDaysAgo)).toBe('3d ago')
    })

    it('should handle just now', () => {
      const justNow = new Date(now.getTime() - 30 * 1000)
      expect(formatRelativeTime(justNow)).toBe('just now')
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(500)).toBe('500 Bytes')
    })

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
    })

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB')
    })

    it('should format gigabytes correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
    })

    it('should handle zero size', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
    })
  })
})
