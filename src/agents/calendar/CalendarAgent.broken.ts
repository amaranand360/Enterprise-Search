import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { BaseMessage } from "@langchain/core/messages";
import { GoogleCalendarService } from "./GoogleCalendarService";
import { CalendarToolkit } from "./CalendarToolkit";
import { CalendarStateManager } from "./CalendarStateManager";
import { 
  CalendarAgentState, 
  CalendarEvent, 
  EventSearchParams,
  CalendarAgentConfig 
} from "./types";

export class CalendarAgent {
  private model: ChatOpenAI;
  private calendarService: GoogleCalendarService;
  private toolkit: CalendarToolkit;
  private stateManager: CalendarStateManager;

  constructor(config: CalendarAgentConfig) {
    // Initialize OpenAI model
    this.model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.1,
      openAIApiKey: config.openaiApiKey,
      maxTokens: 1000,
    });

    // Initialize services
    this.calendarService = new GoogleCalendarService({ auth: config.googleAuth });
    this.toolkit = new CalendarToolkit(this.calendarService);
    this.stateManager = new CalendarStateManager();
  }

  private async analyzeRequest(state: CalendarAgentState): Promise<Partial<CalendarAgentState>> {
    try {
      const userMessage = state.userRequest || 
        (state.messages.length > 0 ? state.messages[state.messages.length - 1].content : "");

      const systemPrompt = `You are a Google Calendar automation agent. Analyze the user's request and determine the appropriate action.

Available actions:
- CREATE_EVENT: Create a new calendar event (e.g., "schedule a meeting", "book an appointment")
- UPDATE_EVENT: Modify an existing event (e.g., "move my meeting", "change the time")
- DELETE_EVENT: Remove an event (e.g., "cancel my appointment", "delete the meeting")
- SEARCH_EVENTS: Find events based on criteria (e.g., "find my meetings with John")
- LIST_EVENTS: Get events for a specific time period (e.g., "what's on my calendar today", "show my schedule")
- GET_FREE_BUSY: Check availability (e.g., "when am I free", "check my availability")

User request: "${userMessage}"

Examples:
- "Schedule a team meeting tomorrow at 2 PM" → CREATE_EVENT with parameters: {title: "team meeting", date: "tomorrow", time: "2 PM"}
- "What's on my calendar today?" → LIST_EVENTS with parameters: {timeframe: "today"}
- "Cancel my 3 PM appointment" → DELETE_EVENT with parameters: {time: "3 PM"}

Respond with a JSON object:
{
  "action": "ACTION_NAME",
  "parameters": {extracted parameters},
  "confidence": 0.9,
  "needsMoreInfo": false,
  "clarificationQuestions": []
}

Extract ALL relevant details including title, date, time, duration, location, attendees, etc.`;

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(userMessage as string)
      ];

      const response = await this.model.invoke(messages);
      const analysisResult = this.parseJsonResponse(response.content as string);

      return {
        currentAction: analysisResult.action,
        context: {
          ...state.context,
          analysisResult,
          parameters: analysisResult.parameters,
          needsMoreInfo: analysisResult.needsMoreInfo,
          clarificationQuestions: analysisResult.clarificationQuestions
        },
        messages: [...state.messages, new AIMessage(`Analysis complete: ${analysisResult.action}`)]
      };
    } catch (error) {
      return {
        error: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isComplete: true
      };
    }
  }

  private async executeAction(state: CalendarAgentState): Promise<Partial<CalendarAgentState>> {
    try {
      const { currentAction, context } = state;
      const { parameters } = context;

      let result: any;

      switch (currentAction) {
        case "CREATE_EVENT":
          result = await this.toolkit.createEvent(parameters);
          break;
        case "UPDATE_EVENT":
          result = await this.toolkit.updateEvent(parameters);
          break;
        case "DELETE_EVENT":
          result = await this.toolkit.deleteEvent(parameters);
          break;
        case "SEARCH_EVENTS":
          result = await this.toolkit.searchEvents(parameters);
          break;
        case "LIST_EVENTS":
          result = await this.toolkit.listEvents(parameters);
          break;
        case "GET_FREE_BUSY":
          result = await this.toolkit.getFreeBusy(parameters);
          break;
        case "CREATE_RECURRING":
          result = await this.toolkit.createRecurringEvent(parameters);
          break;
        case "MANAGE_ATTENDEES":
          result = await this.toolkit.manageAttendees(parameters);
          break;
        default:
          throw new Error(`Unknown action: ${currentAction}`);
      }

      return {
        calendarData: { ...state.calendarData, [currentAction]: result },
        context: { ...context, executionResult: result },
        isComplete: true,
        messages: [...state.messages, new AIMessage(`Action executed successfully: ${currentAction}`)]
      };
    } catch (error) {
      return {
        error: `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isComplete: true
      };
    }
  }

  private async generateResponse(state: CalendarAgentState): Promise<Partial<CalendarAgentState>> {
    try {
      const { currentAction, context, calendarData } = state;
      const { executionResult } = context;

      const systemPrompt = `Generate a helpful, conversational response about the calendar action that was performed.

Action: ${currentAction}
Parameters: ${JSON.stringify(context.parameters)}
Result: ${JSON.stringify(executionResult)}
  private async generateResponse(state: CalendarAgentState): Promise<Partial<CalendarAgentState>> {
    try {
      const { currentAction, context } = state;
      const { executionResult } = context;

      const systemPrompt = `Generate a helpful, conversational response about the calendar action that was performed.

Action: ${currentAction}
Result: ${JSON.stringify(executionResult)}

Provide a natural, friendly response that:
1. Confirms what was done
2. Includes relevant details (time, date, title)
3. Offers helpful next steps if appropriate
4. Uses emojis appropriately for a modern feel

Examples:
- For CREATE_EVENT: "✅ I've created your team meeting for tomorrow at 2 PM. You'll receive a calendar notification!"
- For LIST_EVENTS: "📅 Here's what you have coming up today: [list events with times]"
- For DELETE_EVENT: "🗑️ I've cancelled your 3 PM appointment. Your calendar has been updated."

Be concise but informative.`;

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage("Generate the response")
      ];

      const response = await this.model.invoke(messages);

      return {
        messages: [...state.messages, new AIMessage(response.content as string)],
        isComplete: true
      };
    } catch (error) {
      return {
        error: `Response generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isComplete: true
      };
    }
  }

  private async handleError(state: CalendarAgentState): Promise<Partial<CalendarAgentState>> {
    const errorMessage = state.error || "An unknown error occurred";
    
    return {
      messages: [...state.messages, new AIMessage(`I'm sorry, but I encountered an error: ${errorMessage}. Please try again or provide more specific information.`)],
      isComplete: true
    };
  }

  private parseJsonResponse(content: string): any {
    try {
      // Extract JSON from response if it's wrapped in text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(content);
    } catch (error) {
      // Fallback parsing
      return {
        action: "SEARCH_EVENTS",
        parameters: {},
        confidence: 0.5,
        needsMoreInfo: true,
        clarificationQuestions: ["Could you please provide more specific details about what you'd like to do with your calendar?"]
      };
    }
  }

  public async processRequest(userRequest: string): Promise<string> {
    try {
      let state: CalendarAgentState = {
        messages: [new HumanMessage(userRequest)],
        currentAction: "",
        calendarData: {},
        error: null,
        isComplete: false,
        userRequest,
        context: {}
      };

      // Step 1: Analyze the request
      const analysisUpdate = await this.analyzeRequest(state);
      state = { ...state, ...analysisUpdate };

      // Step 2: Check if we need more information
      if (state.context?.needsMoreInfo) {
        const clarificationQuestions = state.context.clarificationQuestions || [];
        const questionsText = clarificationQuestions.length > 0 
          ? clarificationQuestions.join(' ') 
          : "Could you please provide more details?";
        
        return `I need more information to help you. ${questionsText}`;
      }

      // Step 3: Execute the action if no error
      if (!state.error) {
        const executionUpdate = await this.executeAction(state);
        state = { ...state, ...executionUpdate };
      }

      // Step 4: Handle errors or generate response
      if (state.error) {
        const errorUpdate = await this.handleError(state);
        state = { ...state, ...errorUpdate };
      } else {
        const responseUpdate = await this.generateResponse(state);
        state = { ...state, ...responseUpdate };
      }

      // Save state for tracking
      this.stateManager.saveState(state);

      // Return the last AI message
      const lastMessage = state.messages[state.messages.length - 1];
      return lastMessage.content as string;
    } catch (error) {
      return `I apologize, but I encountered an error processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`;
    }
  }

  public async initialize(): Promise<void> {
    await this.calendarService.initialize();
  }

  public getStateManager(): CalendarStateManager {
    return this.stateManager;
  }

  public async getSessionHistory(): Promise<CalendarAgentState[]> {
    return this.stateManager.getSessionHistory();
  }

  public async analyzeUserPatterns(): Promise<any> {
    return this.stateManager.analyzeUserPattern();
  }
}
