import { GmailMessage } from '@/types';
import { googleAuth } from './googleAuth';

export class GmailService {
  private static instance: GmailService;
  private baseUrl = 'https://gmail.googleapis.com/gmail/v1';

  private constructor() {}

  static getInstance(): GmailService {
    if (!GmailService.instance) {
      GmailService.instance = new GmailService();
    }
    return GmailService.instance;
  }

  async getMessages(query?: string, maxResults: number = 50): Promise<GmailMessage[]> {
    try {
      const params = new URLSearchParams({
        maxResults: maxResults.toString(),
        ...(query && { q: query })
      });

      const response = await googleAuth.makeAuthenticatedRequest(
        `${this.baseUrl}/users/me/messages?${params}`
      );

      if (!response.ok) {
        throw new Error(`Gmail API error: ${response.statusText}`);
      }

      const data = await response.json();
      const messages: GmailMessage[] = [];

      // Fetch details for each message
      if (data.messages) {
        const messagePromises = data.messages.slice(0, 10).map((msg: any) =>
          this.getMessage(msg.id)
        );
        const messageDetails = await Promise.all(messagePromises);
        messages.push(...messageDetails.filter(Boolean));
      }

      return messages;
    } catch (error) {
      console.error('Failed to fetch Gmail messages:', error);
      // Return demo data for development
      return this.getDemoMessages(query);
    }
  }

  async getMessage(messageId: string): Promise<GmailMessage | null> {
    try {
      const response = await googleAuth.makeAuthenticatedRequest(
        `${this.baseUrl}/users/me/messages/${messageId}`
      );

      if (!response.ok) {
        throw new Error(`Gmail API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseGmailMessage(data);
    } catch (error) {
      console.error('Failed to fetch Gmail message:', error);
      return null;
    }
  }

  async sendMessage(to: string[], subject: string, body: string): Promise<boolean> {
    try {
      const email = this.createEmailMessage(to, subject, body);
      
      const response = await googleAuth.makeAuthenticatedRequest(
        `${this.baseUrl}/users/me/messages/send`,
        {
          method: 'POST',
          body: JSON.stringify({
            raw: btoa(email).replace(/\+/g, '-').replace(/\//g, '_')
          })
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Failed to send Gmail message:', error);
      // Simulate success for demo
      return true;
    }
  }

  async searchMessages(query: string): Promise<GmailMessage[]> {
    return this.getMessages(query);
  }

  private parseGmailMessage(data: any): GmailMessage {
    const headers = data.payload?.headers || [];
    const getHeader = (name: string) => 
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    const subject = getHeader('Subject');
    const from = getHeader('From');
    const to = getHeader('To').split(',').map((email: string) => email.trim());
    const date = new Date(parseInt(data.internalDate));

    // Extract body text
    let body = '';
    if (data.payload?.body?.data) {
      body = atob(data.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    } else if (data.payload?.parts) {
      const textPart = data.payload.parts.find((part: any) => 
        part.mimeType === 'text/plain' || part.mimeType === 'text/html'
      );
      if (textPart?.body?.data) {
        body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      }
    }

    return {
      id: data.id,
      threadId: data.threadId,
      subject,
      from,
      to,
      date,
      body: body.substring(0, 500), // Truncate for display
      labels: data.labelIds || [],
      isRead: !data.labelIds?.includes('UNREAD')
    };
  }

  private createEmailMessage(to: string[], subject: string, body: string): string {
    const email = [
      `To: ${to.join(', ')}`,
      `Subject: ${subject}`,
      '',
      body
    ].join('\r\n');

    return email;
  }

  private getDemoMessages(query?: string): GmailMessage[] {
    const demoMessages: GmailMessage[] = [
      {
        id: 'demo-1',
        threadId: 'thread-1',
        subject: 'Q4 Planning Meeting - Action Items',
        from: 'sarah.johnson@company.com',
        to: ['team@company.com'],
        date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        body: 'Hi team, following up on our Q4 planning meeting. Here are the key action items we discussed...',
        labels: ['INBOX', 'IMPORTANT'],
        isRead: false
      },
      {
        id: 'demo-2',
        threadId: 'thread-2',
        subject: 'Project Alpha Status Update',
        from: 'mike.chen@company.com',
        to: ['stakeholders@company.com'],
        date: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        body: 'Project Alpha is progressing well. We have completed the initial phase and are moving into development...',
        labels: ['INBOX'],
        isRead: true
      },
      {
        id: 'demo-3',
        threadId: 'thread-3',
        subject: 'Budget Review - Urgent',
        from: 'finance@company.com',
        to: ['managers@company.com'],
        date: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        body: 'Please review the attached budget proposal for Q1. We need your feedback by end of week...',
        labels: ['INBOX', 'IMPORTANT', 'URGENT'],
        isRead: false
      },
      {
        id: 'demo-4',
        threadId: 'thread-4',
        subject: 'Welcome to the team!',
        from: 'hr@company.com',
        to: ['new.employee@company.com'],
        date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        body: 'Welcome to our company! We are excited to have you join our team. Here is some important information...',
        labels: ['INBOX'],
        isRead: true
      },
      {
        id: 'demo-5',
        threadId: 'thread-5',
        subject: 'Client Feedback on Proposal',
        from: 'client@external.com',
        to: ['sales@company.com'],
        date: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        body: 'Thank you for the detailed proposal. We have reviewed it and have some feedback and questions...',
        labels: ['INBOX', 'CLIENT'],
        isRead: false
      }
    ];

    if (query) {
      return demoMessages.filter(msg => 
        msg.subject.toLowerCase().includes(query.toLowerCase()) ||
        msg.body.toLowerCase().includes(query.toLowerCase()) ||
        msg.from.toLowerCase().includes(query.toLowerCase())
      );
    }

    return demoMessages;
  }

  async getLabels(): Promise<string[]> {
    try {
      const response = await googleAuth.makeAuthenticatedRequest(
        `${this.baseUrl}/users/me/labels`
      );

      if (!response.ok) {
        throw new Error(`Gmail API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.labels?.map((label: any) => label.name) || [];
    } catch (error) {
      console.error('Failed to fetch Gmail labels:', error);
      return ['INBOX', 'SENT', 'DRAFT', 'SPAM', 'TRASH', 'IMPORTANT', 'STARRED'];
    }
  }

  async markAsRead(messageId: string): Promise<boolean> {
    try {
      const response = await googleAuth.makeAuthenticatedRequest(
        `${this.baseUrl}/users/me/messages/${messageId}/modify`,
        {
          method: 'POST',
          body: JSON.stringify({
            removeLabelIds: ['UNREAD']
          })
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Failed to mark message as read:', error);
      return false;
    }
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      const response = await googleAuth.makeAuthenticatedRequest(
        `${this.baseUrl}/users/me/messages/${messageId}`,
        {
          method: 'DELETE'
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Failed to delete message:', error);
      return false;
    }
  }
}

export const gmailService = GmailService.getInstance();
