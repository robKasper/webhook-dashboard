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

**Supabase clients** (`lib/supabase/`):
- `client.ts` - Browser client for client components (`createBrowserClient`)
- `server.ts` - Server client for API routes and Server Actions (`createServerClient` with cookie handling)

**Server Actions** (`app/dashboard/actions.ts`):
- Use for mutations (create, delete) instead of direct client-side Supabase calls
- Always verify authentication and ownership before mutations
- Call `revalidatePath()` after successful mutations

**Route Protection** (`proxy.ts`):
- Next.js 16 uses `proxy.ts` (not `middleware.ts`) for route protection
- Protects `/dashboard/*` routes, redirects unauthenticated users to `/auth/login`
- Redirects authenticated users away from `/auth/*` to `/dashboard`

**Next.js 16 Async Params**:
- Dynamic route params are Promises in Next.js 16
- Client components: Use `use()` hook to unwrap params
  ```tsx
  const { id } = use(params);
  ```
- API routes: Use `await params` in async handlers
  ```tsx
  const { webhookId } = await params;
  ```

**Toast Notifications** (`components/ui/toast.tsx`):
- Use `useToast()` hook for user feedback
- `showToast(message)` for success, `showToast(message, "error")` for errors
- Provider wrapped in `components/providers.tsx`

**Loading States**:
- Add `loading.tsx` files for Suspense boundaries
- Use skeleton UI with `animate-pulse` for loading states

**UI Components** (`components/ui/`):
- Radix UI primitives with `class-variance-authority` for variants
- Use `cn()` utility from `lib/utils.ts` for class merging

### Database Schema (Supabase)

- `webhook_endpoints` - User-created webhook URLs (id, user_id, name, webhook_id)
- `webhook_events` - Captured webhook requests (endpoint_id, user_id, method, headers, body, status_code)

### Data Flow

1. User creates endpoint via Server Action → generates unique `webhook_id`
2. External services POST to `/api/webhooks/[webhookId]`
3. API route validates (rate limit, size limit), stores event in `webhook_events`
4. Dashboard uses Supabase real-time subscriptions to show events instantly

### API Validation (`app/api/webhooks/[webhookId]/route.ts`)

- Rate limiting: 60 requests/minute per webhook ID
- Payload size: 1MB max
- Non-JSON payloads stored as `{ _raw: "..." }`

## Environment Variables

Required in `.env.local` (see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
