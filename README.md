# Webhook Dashboard

A real-time webhook testing tool built with Next.js 16 and Supabase. Create unique webhook URLs, receive HTTP requests, and inspect payloads instantly.

## Features

- **Unique Webhook URLs** - Generate dedicated endpoints for each integration you're testing
- **Real-time Updates** - See incoming requests instantly as they arrive via Supabase real-time subscriptions
- **Payload Inspection** - View headers, body content, and metadata for every request
- **Rate Limiting** - Built-in protection with 60 requests/minute per webhook
- **User Authentication** - Secure endpoints with Supabase Auth

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) with [class-variance-authority](https://cva.style/)

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)

2. Run the following SQL in the Supabase SQL Editor to create the required tables:

```sql
-- Webhook endpoints table
create table webhook_endpoints (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  webhook_id text unique not null,
  created_at timestamp with time zone default now()
);

-- Webhook events table
create table webhook_events (
  id uuid default gen_random_uuid() primary key,
  endpoint_id uuid references webhook_endpoints(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  method text not null,
  headers jsonb,
  body jsonb,
  status_code integer not null,
  error_message text,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table webhook_endpoints enable row level security;
alter table webhook_events enable row level security;

-- Policies for webhook_endpoints
create policy "Users can view own endpoints" on webhook_endpoints
  for select using (auth.uid() = user_id);

create policy "Users can create own endpoints" on webhook_endpoints
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own endpoints" on webhook_endpoints
  for delete using (auth.uid() = user_id);

-- Policies for webhook_events
create policy "Users can view own events" on webhook_events
  for select using (auth.uid() = user_id);

create policy "Anyone can insert events" on webhook_events
  for insert with check (true);

-- Enable real-time for webhook_events
alter publication supabase_realtime add table webhook_events;
```

3. Enable Email Auth in Authentication > Providers

### Installation

1. Clone the repository:
```bash
git clone https://github.com/robKasper/webhook-dashboard.git
cd webhook-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment file and add your Supabase credentials:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Usage

1. **Sign up** for an account at `/auth/signup`
2. **Create a webhook endpoint** from the dashboard
3. **Copy the webhook URL** (e.g., `https://yourapp.com/api/webhooks/abc123`)
4. **Send POST requests** to your webhook URL from any service
5. **View events** in real-time on the endpoint detail page

### Testing with cURL

```bash
curl -X POST https://localhost:3000/api/webhooks/YOUR_WEBHOOK_ID \
  -H "Content-Type: application/json" \
  -d '{"event": "test", "data": {"message": "Hello!"}}'
```

## Project Structure

```
├── app/
│   ├── api/webhooks/[webhookId]/  # Webhook receiver endpoint
│   ├── auth/                       # Login, signup, callback pages
│   ├── dashboard/                  # Main dashboard & endpoint details
│   │   ├── actions.ts              # Server Actions for mutations
│   │   ├── loading.tsx             # Loading skeleton
│   │   └── endpoints/[id]/         # Endpoint detail page
│   └── page.tsx                    # Landing page
├── components/
│   ├── ui/                         # Reusable UI components
│   └── providers.tsx               # Client-side providers
├── lib/
│   ├── supabase/                   # Supabase client utilities
│   └── utils.ts                    # Utility functions
└── proxy.ts                        # Route protection
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in the Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js 16. Make sure to:
- Set the environment variables
- Configure the build command: `npm run build`
- Configure the start command: `npm run start`

## License

MIT
