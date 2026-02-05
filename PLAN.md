# Codebase Improvement Plan

## Critical Issues

### 1. Missing Auth Pages
The dashboard redirects to `/auth/login` but no auth pages exist. Users cannot sign in.

**Fix**: Create `app/auth/login/page.tsx` and `app/auth/signup/page.tsx` with Supabase Auth UI or custom forms.

### 2. No Route Protection (Middleware)
Auth is only checked client-side in useEffect. Users see a flash of dashboard before redirect, and API routes aren't protected.

**Fix**: Add `middleware.ts` to protect `/dashboard/*` routes server-side:
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Check session, redirect to /auth/login if unauthenticated
}

export const config = {
  matcher: ['/dashboard/:path*']
}
```

### 3. Homepage Not Customized
`app/page.tsx` is still the Next.js boilerplate template.

**Fix**: Replace with a landing page or redirect to `/dashboard`.

---

## Security Improvements

### 4. Webhook Endpoint Has No Validation
The API at `/api/webhooks/[webhookId]` accepts any POST request. Consider:
- Rate limiting per webhook ID
- Optional signature verification for production use
- Request size limits

### 5. Add .env.example
No example environment file exists for new developers.

**Fix**: Create `.env.example`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Code Quality

### 6. TypeScript `any` Types
Several places use `any` instead of proper types:
- `app/dashboard/page.tsx:22` - `user` state is `any`
- `app/dashboard/endpoints/[id]/page.tsx:30-31` - `headers` and `body` are `any`

**Fix**: Define proper interfaces:
```typescript
interface User {
  id: string;
  email?: string;
}
```

### 7. Next.js 16 Params Pattern
Dynamic route params should use `use()` hook in Next.js 16:
```typescript
// Current (deprecated)
export default function Page({ params }: { params: { id: string } }) {

// Recommended
import { use } from 'react'
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
```

Affected files:
- `app/dashboard/endpoints/[id]/page.tsx`
- `app/api/webhooks/[webhookId]/route.ts`

### 8. Native Alerts/Prompts
Using `alert()` and `prompt()` for user feedback is poor UX:
- `app/dashboard/page.tsx:86` - prompt for endpoint name
- `app/dashboard/page.tsx:101,113` - alert for errors/success

**Fix**: Use the existing Dialog component for input, and toast notifications for feedback.

### 9. Missing useEffect Dependencies
`app/dashboard/page.tsx:42` - useEffect missing `router` and `supabase` in dependency array. This works but triggers ESLint warnings.

---

## Architecture Improvements

### 10. Real-time Subscription Error Handling
`app/dashboard/endpoints/[id]/page.tsx:61-75` - The Supabase channel subscription has no error handling.

**Fix**: Add error callback:
```typescript
.subscribe((status) => {
  if (status === 'CHANNEL_ERROR') {
    console.error('Realtime subscription failed')
  }
})
```

### 11. Consider Server Actions for Mutations
Creating/deleting endpoints is done client-side with direct Supabase calls. Server Actions would provide:
- Better error handling
- Revalidation of cached data
- Type-safe mutations

### 12. Loading States
No Suspense boundaries or loading.tsx files. Consider adding:
- `app/dashboard/loading.tsx`
- `app/dashboard/endpoints/[id]/loading.tsx`

---

## Summary by Priority

| Priority | Issue | Effort |
|----------|-------|--------|
| Critical | Missing auth pages | Medium |
| Critical | Add middleware for route protection | Low |
| High | Fix homepage | Low |
| High | Add .env.example | Low |
| Medium | Fix TypeScript any types | Low |
| Medium | Update to Next.js 16 params pattern | Low |
| Medium | Replace alert/prompt with proper UI | Medium |
| Low | Add real-time error handling | Low |
| Low | Add loading.tsx files | Low |
