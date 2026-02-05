# Security Considerations

This document outlines the security model for the webhook dashboard and potential hardening options.

## Current RLS Policies

The following Row Level Security (RLS) policies are required for the webhook functionality:

### webhook_endpoints

```sql
-- Allows the webhook API to look up endpoints by webhook_id
create policy "Anyone can select endpoints" on webhook_endpoints
  for select using (true);

-- Allows authenticated users to create their own endpoints
create policy "Users can create own endpoints" on webhook_endpoints
  for insert with check (auth.uid() = user_id);

-- Allows authenticated users to delete their own endpoints
create policy "Users can delete own endpoints" on webhook_endpoints
  for delete using (auth.uid() = user_id);
```

### webhook_events

```sql
-- Allows the webhook API to store incoming events
create policy "Anyone can insert events" on webhook_events
  for insert with check (true);

-- Allows authenticated users to view their own events
create policy "Users can view own events" on webhook_events
  for select using (auth.uid() = user_id);
```

## Security Model

| Policy | Purpose | Risk Level | Notes |
|--------|---------|------------|-------|
| `Anyone can select endpoints` | Webhook API needs to look up endpoint by webhook_id | Low | webhook_id acts as a secret token (8 random chars) |
| `Anyone can insert events` | External services need to create events | Low | Can only insert if you know a valid webhook_id |
| `Users can create/delete own endpoints` | User management | None | Standard auth-protected policy |
| `Users can view own events` | Dashboard display | None | Standard auth-protected policy |

### Why This Is Acceptable

1. **webhook_id as a secret**: The 8-character random webhook_id acts like a bearer token. Only someone who knows the exact ID can interact with it.

2. **No sensitive data exposure**: Even if someone enumerated webhook_ids, they would only see their own events (SELECT on events is auth-protected).

3. **Intended functionality**: Webhooks are meant to receive unauthenticated requests from external services.

## Production Hardening (Optional)

For stricter security, use a Supabase service role key in the webhook API route. This bypasses RLS entirely, allowing you to keep restrictive policies.

### Implementation Steps

1. **Add service role key to environment**

   In `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

   Get this from: Supabase Dashboard → Settings → API → service_role key

   ⚠️ **Never expose this key client-side**

2. **Create admin client**

   Create `lib/supabase/admin.ts`:
   ```typescript
   import { createClient } from "@supabase/supabase-js";

   export const supabaseAdmin = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!
   );
   ```

3. **Update webhook API route**

   In `app/api/webhooks/[webhookId]/route.ts`:
   ```typescript
   import { supabaseAdmin } from "@/lib/supabase/admin";

   // Replace createClient() calls with supabaseAdmin
   const { data: endpoint } = await supabaseAdmin
     .from("webhook_endpoints")
     .select("id, user_id")
     .eq("webhook_id", webhookId)
     .single();
   ```

4. **Update RLS policies**

   You can now use stricter policies:
   ```sql
   -- Remove the public select policy
   drop policy "Anyone can select endpoints" on webhook_endpoints;

   -- Add back user-only select
   create policy "Users can view own endpoints" on webhook_endpoints
     for select using (auth.uid() = user_id);

   -- Remove public insert on events (service role bypasses RLS)
   drop policy "Anyone can insert events" on webhook_events;
   ```

5. **Update .env.example**

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```

### Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| **Current (public policies)** | Simple setup, no extra env vars | Slightly broader access |
| **Service role key** | Strictest RLS possible | Extra configuration, key management |

## Additional Recommendations

1. **Rate limiting**: Already implemented (60 req/min per webhook)

2. **Payload size limit**: Already implemented (1MB max)

3. **Webhook signatures** (future): For production integrations, consider adding optional HMAC signature verification for webhooks that support it (Stripe, GitHub, etc.)

4. **Audit logging** (future): Log webhook access attempts for security monitoring

5. **Webhook expiration** (future): Auto-expire unused webhooks after a period
