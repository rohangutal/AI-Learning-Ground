# AI Study Platform (StudyOS)

A production-grade AI-powered study platform integrating Next.js, Supabase, Drizzle ORM, and OpenRouter with Vercel AI SDK.

## Prerequisites

Before running this project, make sure you have the following:

- **Node.js**: v18 or higher installed on your machine.
- **Supabase Account**: A free account at [supabase.com](https://supabase.com).
- **OpenRouter Account**: A free account at [openrouter.ai](https://openrouter.ai).

---

## Step 1: Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` and fill in the values described below.

---

## Step 2: Supabase Setup

### 1. Create a Supabase Project
- Log in to your Supabase account and click **New Project**.
- Give your project a name, set a secure database password, choose a region close to you, and click **Create new project**.

### 2. Retrieve Connection Details
- In the Supabase Dashboard, navigate to **Project Settings** (gear icon) -> **API**:
  - **Project URL**: Copy this and paste it as `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`.
  - **anon public key**: Copy this and paste it as `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
  - **service_role key**: Copy this and paste it as `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (keep this key secret!).
- Navigate to **Project Settings** -> **Database**:
  - Scroll down to the **Connection string** section.
  - Choose the **URI** tab.
  - Select **Transaction** (for pooling, recommended for production) or **Session** / **Direct connection** (recommended for running migrations).
  - Copy the URI, replace `[YOUR-PASSWORD]` with your actual database password, and set it as `DATABASE_URL` in `.env.local`.
    *Note: When running Drizzle migrations locally, if you experience issues with the Transaction pooler (port 6543), use the **Session** connection string or **Direct** connection (port 5432).*

### 3. Database Initialization (SQL Editor)
Before applying migrations, we must enable the `pgvector` extension and set up automatic syncing between Supabase Auth and our public `users` table.

1. In the Supabase sidebar, click on **SQL Editor**.
2. Click **New query** and paste the following SQL script:
   ```sql
   -- 1. Enable pgvector (required for study notes and flashcard embeddings)
   create extension if not exists vector;

   -- 2. Create a trigger function that inserts a user profile into public.users automatically when they register
   create or replace function public.handle_new_user()
   returns trigger as $$
   begin
     insert into public.users (id, email, full_name, avatar_url)
     values (
       new.id,
       new.email,
       coalesce(new.raw_user_meta_data->>'full_name', ''),
       new.raw_user_meta_data->>'avatar_url'
     );
     return new;
   end;
   $$ language plpgsql security definer;

   -- 3. Create the trigger to execute public.handle_new_user on user signup
   create or replace trigger on_auth_user_created
     after insert on auth.users
     for each row execute procedure public.handle_new_user();
   ```
3. Click **Run** to execute the script.

### 4. Run Schema Migrations
Now apply the project's database tables to Supabase.
In your local terminal, run:
```bash
npm run db:migrate
```
This will apply the migrations located in `./supabase/migrations` using Drizzle Kit.

---

## Step 3: OpenRouter Setup

1. Log in to [openrouter.ai](https://openrouter.ai).
2. Go to **Settings** -> **Keys** and click **Create Key**. Give it a name and copy it.
3. Paste the key as `OPENROUTER_API_KEY` in `.env.local`.
4. Configure the default model values in `.env.local` if desired:
   - `OPENROUTER_DEFAULT_MODEL`: Default model (e.g. `deepseek/deepseek-chat-v3-0324`)
   - `OPENROUTER_FAST_MODEL`: Fast model (e.g. `google/gemini-2.5-flash`)
   - `OPENROUTER_FALLBACK_MODEL`: Fallback model if the primary model fails (e.g. `anthropic/claude-sonnet-4.5`)

---

## Step 4: Running the App Locally

1. Install project dependencies:
   ```bash
   npm install
   ```
2. Start the Next.js development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Scripts Reference

- `npm run dev` - Starts the Next.js development server.
- `npm run build` - Builds the application for production.
- `npm run start` - Starts the production server.
- `npm run db:generate` - Generates migrations if you change `schema.ts`.
- `npm run db:migrate` - Applies migrations to the remote database.
- `npm run db:studio` - Launches Drizzle Studio to inspect database data.
