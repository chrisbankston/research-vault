# Research Vault

AI Research Vault is a production-quality knowledge management application built with Next.js 15, React 19, and TypeScript. It helps users organize, manage, and analyze research across multiple areas of focus.

## Features

- **Dashboard**: Overview of research areas, recent items, and AI chat panel
- **Areas**: Organize research into distinct areas of focus
- **Research**: Manage and search research items with document upload
- **AI Chat**: Ask questions about your research with AI assistance
- **Settings**: Customize preferences and account settings
- **Dark Theme**: Modern, clean UI with dark theme optimized for reading
- **Responsive Design**: Fully responsive on desktop, tablet, and mobile

## Tech Stack

- **Next.js 15**: React framework with App Router
- **React 19**: Latest React features
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Supabase**: Backend and database
- **OpenAI API / GitHub Models**: AI-powered features
- **Lucide React**: Icon library

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Dashboard
│   ├── areas/             # Areas page
│   ├── research/          # Research page
│   ├── chat/              # AI Chat page
│   ├── settings/          # Settings page
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   ├── SearchBar.tsx
│   ├── AreaCard.tsx
│   ├── ResearchCard.tsx
│   ├── ChatPanel.tsx
│   └── UploadButton.tsx
├── lib/                   # Utilities
│   ├── supabase.ts       # Supabase client
│   └── utils.ts          # Helper functions
├── types/                # TypeScript types
│   └── index.ts
└── database/             # Database schema
    └── schema.sql
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Update the values with your Supabase credentials plus one AI provider:

   Required:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   Provider selection:
   - `AI_PROVIDER=openai` to force OpenAI
   - `AI_PROVIDER=github-models` to force GitHub Models
   - if `AI_PROVIDER` is unset, the app auto-selects `openai` when `OPENAI_API_KEY` exists, otherwise `github-models` when `GITHUB_TOKEN` exists

   OpenAI variables:
   - `OPENAI_API_KEY` (required for OpenAI)
   - `OPENAI_BASE_URL` (optional, default `https://api.openai.com/v1`)
   - `OPENAI_MODEL` (optional, default `gpt-4o-mini`)
   - `OPENAI_EMBEDDING_MODEL` (optional, default `text-embedding-3-small`)

   GitHub Models variables:
   - `GITHUB_TOKEN` (required for GitHub Models)
   - `GITHUB_MODELS_BASE_URL` (optional, default `https://models.inference.ai.azure.com`)
   - `GITHUB_MODELS_CHAT_MODEL` (optional, default `gpt-4.1-mini`)
   - `GITHUB_MODELS_EMBEDDING_MODEL` (optional, default `text-embedding-3-small`)

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Database Setup

Run the SQL schema from `src/database/schema.sql` in your Supabase dashboard to set up the required tables:
- users
- areas
- topics
- research_items
- attachments
- conversations
- messages

## Components

- **Sidebar**: Navigation with active route highlighting
- **Header**: Top navigation with user controls
- **SearchBar**: Reusable search input with clear functionality
- **AreaCard**: Card component for displaying research areas
- **ResearchCard**: Card component for displaying research items
- **ChatPanel**: Chat interface with message history
- **UploadButton**: Drag-and-drop file upload component

## Pages

- **Dashboard**: Main overview with stats and recent items
- **Areas**: Browse and manage research areas
- **Research**: Search and manage all research items
- **AI Chat**: Multi-conversation chat interface
- **Settings**: User preferences and account management

## Development

The application uses:
- Modern React patterns with hooks
- Server components in Next.js App Router
- Tailwind CSS for styling
- TypeScript for type safety
- ESLint for code quality
