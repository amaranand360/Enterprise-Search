import { CalendarAgentState, CalendarEvent, AgentAnalysisResult } from './types';

export class CalendarStateManager {
  private sessionHistory: Map<string, CalendarAgentState[]> = new Map();
  private currentSession: string = '';

  constructor() {
    this.currentSession = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `calendar_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public startNewSession(): string {
    this.currentSession = this.generateSessionId();
    this.sessionHistory.set(this.currentSession, []);
    return this.currentSession;
  }

  public saveState(state: CalendarAgentState): void {
    if (!this.sessionHistory.has(this.currentSession)) {
      this.sessionHistory.set(this.currentSession, []);
    }
    
    const history = this.sessionHistory.get(this.currentSession)!;
    history.push(this.deepClone(state));
    
    // Keep only last 50 states to prevent memory issues
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
  }

  public getSessionHistory(sessionId?: string): CalendarAgentState[] {
    const session = sessionId || this.currentSession;
    return this.sessionHistory.get(session) || [];
  }

  public getCurrentSession(): string {
    return this.currentSession;
  }

  public getLastState(sessionId?: string): CalendarAgentState | null {
    const history = this.getSessionHistory(sessionId);
    return history.length > 0 ? history[history.length - 1] : null;
  }

  public clearSession(sessionId?: string): void {
    const session = sessionId || this.currentSession;
    this.sessionHistory.delete(session);
  }

  public getAllSessions(): string[] {
    return Array.from(this.sessionHistory.keys());
  }

  public getSessionStats(sessionId?: string): {
    totalStates: number;
    totalMessages: number;
    actionsPerformed: string[];
    errorsEncountered: number;
    sessionDuration: number;
  } {
    const history = this.getSessionHistory(sessionId);
    
    if (history.length === 0) {
      return {
        totalStates: 0,
        totalMessages: 0,
        actionsPerformed: [],
        errorsEncountered: 0,
        sessionDuration: 0
      };
    }

    const actionsPerformed = history
      .map(state => state.currentAction)
      .filter(action => action && action.trim() !== '');

    const errorsEncountered = history
      .filter(state => state.error !== null).length;

    const totalMessages = history.reduce((sum, state) => sum + state.messages.length, 0);

    // Calculate session duration (assuming states are saved chronologically)
    const firstState = history[0];
    const lastState = history[history.length - 1];
    
    // Try to extract timestamps from messages or use current time as fallback
    const sessionDuration = Date.now() - (this.extractTimestamp(firstState) || Date.now());

    return {
      totalStates: history.length,
      totalMessages,
      actionsPerformed: [...new Set(actionsPerformed)], // Remove duplicates
      errorsEncountered,
      sessionDuration
    };
  }

  private extractTimestamp(state: CalendarAgentState): number | null {
    // Try to extract timestamp from the first message
    if (state.messages.length > 0) {
      const firstMessage = state.messages[0];
      // This is a simplified extraction - in a real implementation,
      // you might want to store timestamps explicitly
      return Date.now(); // Fallback to current time
    }
    return null;
  }

  public exportSession(sessionId?: string): string {
    const session = sessionId || this.currentSession;
    const history = this.getSessionHistory(session);
    const stats = this.getSessionStats(session);

    const exportData = {
      sessionId: session,
      exportedAt: new Date().toISOString(),
      stats,
      history: history.map(state => ({
        userRequest: state.userRequest,
        currentAction: state.currentAction,
        calendarData: state.calendarData,
        error: state.error,
        isComplete: state.isComplete,
        context: state.context,
        messageCount: state.messages.length
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  public importSession(sessionData: string): string {
    try {
      const data = JSON.parse(sessionData);
      const newSessionId = this.generateSessionId();
      
      // Note: This is a simplified import - full message history would need more complex handling
      this.sessionHistory.set(newSessionId, []);
      
      return newSessionId;
    } catch (error) {
      throw new Error(`Failed to import session: ${error instanceof Error ? error.message : 'Invalid data'}`);
    }
  }

  public analyzeUserPattern(sessionId?: string): {
    mostCommonActions: Array<{ action: string; count: number }>;
    averageSessionLength: number;
    errorRate: number;
    preferredTimeRanges: string[];
    suggestions: string[];
  } {
    const history = this.getSessionHistory(sessionId);
    
    if (history.length === 0) {
      return {
        mostCommonActions: [],
        averageSessionLength: 0,
        errorRate: 0,
        preferredTimeRanges: [],
        suggestions: ['Start by asking me to create an event or search your calendar!']
      };
    }

    // Analyze action patterns
    const actionCounts = new Map<string, number>();
    let totalErrors = 0;

    history.forEach(state => {
      if (state.currentAction) {
        actionCounts.set(state.currentAction, (actionCounts.get(state.currentAction) || 0) + 1);
      }
      if (state.error) {
        totalErrors++;
      }
    });

    const mostCommonActions = Array.from(actionCounts.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const errorRate = history.length > 0 ? (totalErrors / history.length) * 100 : 0;

    // Generate suggestions based on patterns
    const suggestions = this.generateSuggestions(mostCommonActions, errorRate);

    return {
      mostCommonActions,
      averageSessionLength: history.length,
      errorRate,
      preferredTimeRanges: [], // Would need more sophisticated analysis
      suggestions
    };
  }

  private generateSuggestions(
    commonActions: Array<{ action: string; count: number }>,
    errorRate: number
  ): string[] {
    const suggestions: string[] = [];

    if (errorRate > 20) {
      suggestions.push("Try being more specific with dates and times (e.g., 'tomorrow at 2 PM' instead of 'later')");
    }

    if (commonActions.some(a => a.action === 'CREATE_EVENT')) {
      suggestions.push("You can create recurring events by saying 'every week' or 'daily'");
    }

    if (commonActions.some(a => a.action === 'SEARCH_EVENTS')) {
      suggestions.push("You can search for events by attendee, location, or keywords");
    }

    if (suggestions.length === 0) {
      suggestions.push("Try asking me to 'schedule a meeting', 'find my next appointment', or 'check my availability'");
    }

    return suggestions;
  }

  private deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item)) as unknown as T;
    }

    if (typeof obj === 'object') {
      const cloned = {} as T;
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }

    return obj;
  }

  public cleanup(): void {
    // Remove sessions older than 24 hours
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    for (const sessionId of this.sessionHistory.keys()) {
      // Extract timestamp from session ID
      const timestamp = parseInt(sessionId.split('_')[2]);
      if (timestamp < oneDayAgo) {
        this.sessionHistory.delete(sessionId);
      }
    }
  }
}
