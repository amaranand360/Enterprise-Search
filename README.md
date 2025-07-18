# Enterprise Search - Unified Intelligence Terminal

A modern, AI-powered enterprise search platform that unifies search across all your business tools and data sources. Built with Next.js 15, TypeScript, and Tailwind CSS.

![Enterprise Search Demo](https://via.placeholder.com/800x400/1f2937/ffffff?text=Enterprise+Search+Dashboard)

## 🚀 Features

### Core Functionality
- **Unified Search**: Search across multiple enterprise tools from a single interface
- **AI-Powered Query Processing**: Natural language query parsing and intent detection
- **Real-time Results**: Fast, relevant search results with intelligent ranking
- **Advanced Filtering**: Filter by content type, date range, author, and more

### Supported Integrations
- **Google Workspace**: Gmail, Google Drive, Google Calendar, Google Sheets, Google Meet
- **Communication**: Slack, Microsoft Teams
- **Project Management**: Jira, Asana, Trello
- **Development**: GitHub, GitLab, Bitbucket
- **Documentation**: Notion, Confluence, SharePoint
- **CRM**: Salesforce, HubSpot
- **File Storage**: Dropbox, OneDrive, Box

### Advanced Features
- **Connection Management**: Monitor and manage tool connections with health checks
- **Auto-retry Mechanisms**: Automatic reconnection for failed connections
- **Search History**: Track and reuse previous searches
- **AI Actions**: Execute actions based on natural language commands
- **Demo Mode**: Fully functional demo with realistic data

## 🛠 Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Headless UI
- **State Management**: React Hooks, Context API
- **Authentication**: OAuth 2.0 (Google), JWT tokens
- **APIs**: RESTful APIs, Google APIs
- **Icons**: Lucide React
- **Development**: ESLint, Prettier, Turbopack

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Google Cloud Console project (for Google integrations)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/enterprise-search.git
   cd enterprise-search
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**
   Create a `.env.local` file in the root directory:
   ```env
   # Google OAuth Configuration
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret

   # API Keys (Optional - for production integrations)
   SLACK_CLIENT_ID=your_slack_client_id
   SLACK_CLIENT_SECRET=your_slack_client_secret
   JIRA_CLIENT_ID=your_jira_client_id
   GITHUB_CLIENT_ID=your_github_client_id

   # Application Settings
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret
   ```

4. **Google Cloud Setup**
   - Create a project in [Google Cloud Console](https://console.cloud.google.com)
   - Enable the following APIs:
     - Gmail API
     - Google Calendar API
     - Google Drive API
     - Google Sheets API
   - Create OAuth 2.0 credentials
   - Add `http://localhost:3000` to authorized origins

5. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

### Getting Started

1. **Connect Your Tools**
   - Click on the sidebar to view available tools
   - Connect to Google services using OAuth
   - Demo tools are available for testing without real connections

2. **Search Across Tools**
   - Use the main search bar to query across all connected tools
   - Try natural language queries like "emails from John about project alpha"
   - Use filters to narrow down results by tool, content type, or date

3. **AI Actions**
   - Try action queries like "schedule a meeting with the team"
   - The AI will detect your intent and guide you through the action

4. **Manage Connections**
   - Click the connection status indicator in the header
   - Monitor connection health and sync status
   - Configure retry settings and health checks

### Search Examples

```
# Basic search
project alpha status

# Filtered search
emails from sarah about budget review

# Date-specific search
meeting notes from last week

# Action queries
send email to team about deployment
schedule standup meeting tomorrow at 9am
create document for project requirements
```

## 🏗 Architecture

### Project Structure
```
src/
├── app/                    # Next.js app directory
├── components/            # React components
│   ├── ai/               # AI-powered components
│   ├── connections/      # Connection management
│   ├── knowledge/        # Knowledge management
│   ├── layout/          # Layout components
│   ├── search/          # Search interface
│   └── ui/              # Reusable UI components
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions and config
├── services/            # API services and connectors
│   ├── demo/           # Demo data connectors
│   └── ...             # Real service integrations
├── types/              # TypeScript type definitions
└── data/               # Static data and generators
```

### Key Components

- **SearchInterface**: Main search component with query processing
- **ConnectionModal**: Tool connection flow management
- **DemoConnectorManager**: Handles demo tool connections
- **ConnectionStatusService**: Monitors connection health
- **AIActionHandler**: Processes natural language actions

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Test Structure
- **Unit Tests**: Component and utility function tests
- **Integration Tests**: API and service integration tests
- **E2E Tests**: Full user workflow tests
- **Demo Tests**: Validate demo data and connectors

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables for Production
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=production_client_id
GOOGLE_CLIENT_SECRET=production_client_secret
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=secure_production_secret
```

### Deployment Platforms
- **Vercel**: Recommended for Next.js applications
- **Netlify**: Alternative with good Next.js support
- **AWS**: Using Amplify or custom EC2 setup
- **Docker**: Container-based deployment

## 🔧 Configuration

### Tool Configuration
Tools are configured in `src/lib/config.ts`:
```typescript
export const ALL_TOOLS: Tool[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    icon: '📧',
    color: '#EA4335',
    category: 'communication',
    isDemo: false,
    // ... other properties
  }
];
```

### Connection Settings
- Auto-retry intervals
- Health check frequency
- Connection timeouts
- Maximum concurrent connections

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Write tests for new features
- Update documentation for API changes
- Follow the existing code structure

## 📝 API Documentation

### Search API
```typescript
// Search across all connected tools
const results = await searchAllConnectedTools({
  query: 'project alpha',
  maxResults: 20,
  contentTypes: ['email', 'document'],
  dateRange: { start: new Date('2024-01-01'), end: new Date() }
});
```

### Connection API
```typescript
// Connect to a tool
await connectionStatusService.connectTool('gmail');

// Get connection status
const status = connectionStatusService.getConnectionStatus('gmail');

// Sync tool data
await connectionStatusService.syncTool('gmail');
```

## 🐛 Troubleshooting

### Common Issues

1. **Google OAuth Issues**
   - Verify client ID and secret
   - Check authorized origins in Google Console
   - Ensure APIs are enabled

2. **Connection Failures**
   - Check network connectivity
   - Verify API credentials
   - Review connection settings

3. **Search Not Working**
   - Ensure tools are connected
   - Check search query syntax
   - Verify demo data is loading

### Debug Mode
Enable debug logging by setting:
```env
DEBUG=true
LOG_LEVEL=debug
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Lucide](https://lucide.dev/) for beautiful icons
- [Headless UI](https://headlessui.com/) for accessible components

## 📞 Support

- **Documentation**: [docs.enterprise-search.com](https://docs.enterprise-search.com)
- **Issues**: [GitHub Issues](https://github.com/your-org/enterprise-search/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/enterprise-search/discussions)
- **Email**: support@enterprise-search.com

---

Built with ❤️ by the Enterprise Search Team
