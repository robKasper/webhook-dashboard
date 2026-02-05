# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Build for production
npm run lint     # Run ESLint
```

## Architecture

This is a webhook testing dashboard built with Next.js 16 (App Router) and Supabase. Users can create webhook endpoints, receive POST requests, and view the captured events in real-time.

### Key Patterns

- **Supabase clients**: Two client patterns in `lib/supabase/`:
  - `client.ts` - Browser client for client components (`createBrowserClient`)
  - `server.ts` - Server client for API routes (`createServerClient` with cookie handling)
- **UI components**: Located in `components/ui/`, using Radix UI primitives with `class-variance-authority` for variants
- **Styling**: Tailwind CSS v4 with `cn()` utility from `lib/utils.ts` for class merging

### Database Schema (Supabase)

- `webhook_endpoints` - User-created webhook URLs (id, user_id, name, webhook_id)
- `webhook_events` - Captured webhook requests (endpoint_id, user_id, method, headers, body, status_code)

### Data Flow

1. User creates endpoint → generates unique `webhook_id`
2. External services POST to `/api/webhooks/[webhookId]`
3. API route stores event in `webhook_events` table
4. Dashboard uses Supabase real-time subscriptions to show events instantly

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
