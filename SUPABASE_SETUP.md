# TableMate POS Supabase setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. For the SQL editor, run `supabase/schema.sql`.
4. For Supabase CLI migrations, authenticate with `supabase login`, run `supabase link --project-ref YOUR_PROJECT_REF`, then run `supabase db push`. The self-contained migration is `supabase/migrations/20260828000000_initial_schema.sql`.
5. Create a user in Supabase Authentication.
6. Insert the matching user id into `profiles` with one of: `admin`, `manager`, `cashier`, `waiter`, or `kitchen`.
7. Open the website's Tables page and use Add table to create restaurant tables. The page reads and writes `restaurant_tables` through the authenticated Supabase client; no table demo rows are used.
8. If table creation is denied, confirm the signed-in user's `profiles.role` is `admin` or `manager` and that `restaurant_tables` exists from step 3.
9. Run `npm run dev`.

The app uses demo data when the environment variables are empty. With valid keys, it checks the current auth session and loads available menu items and tables from Supabase. Creating an order writes the order, line items, and KOT record through the authenticated Supabase client.

Only the publishable anon key belongs in the Vite frontend. Never expose the Supabase `service_role` key in `.env`, browser code, source control, or chat. The service-role key bypasses RLS and should only be used in a secured server-side environment when absolutely necessary. The CLI uses its own login/project-link flow for migrations.
