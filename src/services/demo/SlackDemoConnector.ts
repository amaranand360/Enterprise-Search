import { SearchResult } from '@/types';
import { BaseDemoConnector, DemoSearchOptions } from './BaseDemoConnector';

export class SlackDemoConnector extends BaseDemoConnector {
  private channels = [
    '#general', '#development', '#marketing', '#design', '#random',
    '#announcements', '#help', '#project-alpha', '#client-updates', '#standup'
  ];

  private messageTemplates = [
    'Hey team, just pushed the latest changes to the repo. Please review when you get a chance!',
    'Great job on the presentation today! The client was really impressed.',
    'Can someone help me with the deployment process? Having some issues.',
    'Lunch meeting moved to 1 PM in the main conference room.',
    'New design mockups are ready for review. Check them out!',
    'Server maintenance scheduled for this weekend. Plan accordingly.',
    'Congratulations to {author} on the promotion! Well deserved! 🎉',
    'Quick reminder: All-hands meeting tomorrow at 10 AM.',
    'Coffee machine is broken again. IT has been notified.',
    'Great article about our industry trends. Worth a read!',
    'Sprint planning meeting starts in 15 minutes in Conference Room A',
    'Code review session scheduled for 3 PM today',
    'Client feedback on the latest prototype is very positive',
    'Please update your project status in the shared document',
    'New team member starting Monday - let\'s give them a warm welcome!',
    'Quarterly goals have been updated. Please review and provide feedback.',
    'Security training is mandatory for all team members this month',
    'Great work on hitting our milestone! Team celebration Friday at 5 PM',
    'Please remember to submit your timesheets by end of day',
    'New feature request from the client - let\'s discuss in tomorrow\'s standup'
  ];

  private reactions = ['👍', '❤️', '😄', '🎉', '👏', '🔥', '💯', '✅'];

  protected async generateSearchResults(options: DemoSearchOptions): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const dataSize = this.getDataSize();

    for (let i = 0; i < dataSize; i++) {
      const channel = this.getRandomChannel();
      const author = this.getRandomAuthor();
      const template = this.getRandomMessageTemplate();
      const message = template.replace('{author}', author);
      const timestamp = this.getRandomTimestamp();
      const reactionCount = Math.floor(Math.random() * 10);
      const replyCount = Math.floor(Math.random() * 5);

      const result = this.createSearchResult({
        title: `Message in ${channel}`,
        content: message,
        type: 'message',
        author,
        timestamp,
        metadata: {
          channel,
          reactions: this.getRandomReactions(reactionCount),
          replies: replyCount,
          isThread: Math.random() > 0.7,
          mentions: this.getRandomMentions(),
          tags: this.getRandomTags(),
          department: this.getRandomDepartment()
        }
      });

      results.push(result);
    }

    return results;
  }

  private getRandomChannel(): string {
    return this.channels[Math.floor(Math.random() * this.channels.length)];
  }

  private getRandomMessageTemplate(): string {
    return this.messageTemplates[Math.floor(Math.random() * this.messageTemplates.length)];
  }

  private getRandomReactions(count: number): Array<{ emoji: string; count: number }> {
    const reactions: Array<{ emoji: string; count: number }> = [];
    const selectedEmojis = new Set<string>();

    for (let i = 0; i < Math.min(count, this.reactions.length); i++) {
      let emoji;
      do {
        emoji = this.reactions[Math.floor(Math.random() * this.reactions.length)];
      } while (selectedEmojis.has(emoji));
      
      selectedEmojis.add(emoji);
      reactions.push({
        emoji,
        count: Math.floor(Math.random() * 5) + 1
      });
    }

    return reactions;
  }

  private getRandomMentions(): string[] {
    const mentions: string[] = [];
    const mentionCount = Math.floor(Math.random() * 3); // 0-2 mentions

    for (let i = 0; i < mentionCount; i++) {
      const author = this.getRandomAuthor();
      if (!mentions.includes(`@${author}`)) {
        mentions.push(`@${author}`);
      }
    }

    return mentions;
  }

  // Slack-specific methods
  async getChannels(): Promise<string[]> {
    if (!this.isConnected) {
      throw new Error('Not connected to Slack');
    }

    await this.randomDelay(500, 1000);
    return [...this.channels];
  }

  async getChannelMessages(channel: string, limit: number = 50): Promise<SearchResult[]> {
    if (!this.isConnected) {
      throw new Error('Not connected to Slack');
    }

    const allResults = await this.generateSearchResults({ maxResults: 200 });
    return allResults
      .filter(result => result.metadata?.channel === channel)
      .slice(0, limit);
  }

  async getDirectMessages(limit: number = 50): Promise<SearchResult[]> {
    if (!this.isConnected) {
      throw new Error('Not connected to Slack');
    }

    const results: SearchResult[] = [];
    
    for (let i = 0; i < Math.min(limit, 20); i++) {
      const author = this.getRandomAuthor();
      const messages = [
        'Hey, can you review the document I shared?',
        'Thanks for the help with the project!',
        'Are you available for a quick call?',
        'I sent you the updated files',
        'Let\'s schedule a meeting to discuss this',
        'Great work on the presentation!',
        'Can you help me with this issue?',
        'The client loved the proposal',
        'Meeting room is booked for 2 PM',
        'Please check your email for the details'
      ];

      const result = this.createSearchResult({
        title: `Direct message from ${author}`,
        content: messages[Math.floor(Math.random() * messages.length)],
        type: 'message',
        author,
        timestamp: this.getRandomTimestamp(),
        metadata: {
          channel: 'DM',
          isDirect: true,
          tags: this.getRandomTags(),
          department: this.getRandomDepartment()
        }
      });

      results.push(result);
    }

    return results;
  }

  async searchInChannel(channel: string, query: string): Promise<SearchResult[]> {
    const channelMessages = await this.getChannelMessages(channel, 100);
    return this.filterResults(channelMessages, { query });
  }

  async getUserActivity(username: string): Promise<SearchResult[]> {
    const allResults = await this.generateSearchResults({ maxResults: 200 });
    return allResults.filter(result => 
      result.author?.toLowerCase().includes(username.toLowerCase())
    );
  }

  private async randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.random() * (max - min) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}
