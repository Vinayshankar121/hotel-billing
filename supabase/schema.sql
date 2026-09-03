create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, email text, phone text,
  role text not null default 'cashier' check (role in ('admin','manager','cashier','waiter','kitchen')),
  is_active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists restaurant_settings (
  id uuid primary key default gen_random_uuid(), restaurant_name text not null default 'TableMate Restaurant',
  address text, phone text, gstin text, cgst_percent numeric(5,2) not null default 2.5,
  sgst_percent numeric(5,2) not null default 2.5, service_charge_percent numeric(5,2) not null default 0,
  currency text not null default 'INR', invoice_prefix text not null default 'INV', footer_message text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists categories (
  id uuid primary key default gen_random_uuid(), name text not null unique, description text,
  is_active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(), category_id uuid references categories(id), name text not null,
  description text, price numeric(10,2) not null check (price >= 0), gst_percent numeric(5,2) not null default 0,
  food_type text not null default 'veg' check (food_type in ('veg','non-veg','egg')),
  preparation_time integer not null default 10, image_url text, is_available boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists restaurant_tables (
  id uuid primary key default gen_random_uuid(), table_number integer not null unique, capacity integer not null default 4,
  status text not null default 'available' check (status in ('available','occupied','reserved','payment_pending')),
  created_at timestamptz not null default now()
);
create table if not exists customers (
  id uuid primary key default gen_random_uuid(), name text not null, phone text, email text, address text,
  loyalty_points integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists orders (
  id uuid primary key default gen_random_uuid(), order_number text not null unique, table_id uuid references restaurant_tables(id),
  customer_id uuid references customers(id), created_by uuid references profiles(id), order_type text not null default 'dine_in' check (order_type in ('dine_in','takeaway','delivery')),
  status text not null default 'pending' check (status in ('pending','preparing','ready','served','completed','cancelled')),
  subtotal numeric(10,2) not null default 0, discount numeric(10,2) not null default 0, cgst numeric(10,2) not null default 0,
  sgst numeric(10,2) not null default 0, service_charge numeric(10,2) not null default 0, total numeric(10,2) not null default 0,
  notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id), quantity integer not null default 1 check (quantity > 0), unit_price numeric(10,2) not null,
  discount numeric(10,2) not null default 0, total numeric(10,2) not null, notes text, created_at timestamptz not null default now()
);
create table if not exists payments (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references orders(id) on delete cascade,
  amount numeric(10,2) not null, payment_method text not null check (payment_method in ('cash','upi','card')),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  transaction_reference text, paid_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists kot_orders (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references orders(id) on delete cascade,
  kot_number text not null unique, status text not null default 'new' check (status in ('new','preparing','ready','served')),
  notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(), name text not null, category text, current_stock numeric(10,2) not null default 0,
  unit text, minimum_stock numeric(10,2) not null default 0, cost_per_unit numeric(10,2) not null default 0,
  is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists inventory_transactions (
  id uuid primary key default gen_random_uuid(), inventory_item_id uuid references inventory_items(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('stock_in','stock_out','adjustment')), quantity numeric(10,2) not null,
  notes text, created_by uuid references profiles(id), created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on orders(created_at desc);
create index if not exists orders_status_idx on orders(status);
create index if not exists order_items_order_id_idx on order_items(order_id);
create index if not exists payments_order_id_idx on payments(order_id);
create index if not exists menu_items_category_id_idx on menu_items(category_id);
create index if not exists customers_phone_idx on customers(phone);

-- Authenticated staff can read operational data. Writes are intentionally scoped by role.
DO $$ declare table_name text; begin
  foreach table_name in array array['profiles','restaurant_settings','categories','menu_items','restaurant_tables','customers','orders','order_items','payments','kot_orders','inventory_items','inventory_transactions'] loop
    execute format('alter table %I enable row level security', table_name);
    execute format('drop policy if exists authenticated_read on %I', table_name);
    execute format('create policy authenticated_read on %I for select to authenticated using (true)', table_name);
  end loop;
end $$;
create or replace function public.current_role() returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;
create policy profile_self on profiles for select to authenticated using (id = auth.uid());
create policy cashier_create_orders on orders for insert to authenticated with check (public.current_role() in ('admin','manager','cashier','waiter'));
create policy cashier_update_orders on orders for update to authenticated using (public.current_role() in ('admin','manager','cashier','waiter')) with check (public.current_role() in ('admin','manager','cashier','waiter'));
create policy staff_create_order_items on order_items for insert to authenticated with check (public.current_role() in ('admin','manager','cashier','waiter'));
create policy cashier_create_payments on payments for insert to authenticated with check (public.current_role() in ('admin','manager','cashier'));
create policy staff_refund_payments on payments for update to authenticated using (public.current_role() in ('admin','manager','cashier')) with check (payment_status = 'refunded');
create policy kitchen_update_kot on kot_orders for update to authenticated using (public.current_role() in ('admin','manager','kitchen')) with check (public.current_role() in ('admin','manager','kitchen'));
create policy staff_create_kot on kot_orders for insert to authenticated with check (public.current_role() in ('admin','manager','cashier','waiter'));
create policy staff_update_kot on kot_orders for update to authenticated using (public.current_role() in ('admin','manager','cashier','waiter','kitchen')) with check (status in ('new','preparing','ready','served'));
create policy managers_write_master_data on menu_items for all to authenticated using (public.current_role() in ('admin','manager')) with check (public.current_role() in ('admin','manager'));
create policy managers_write_categories on categories for all to authenticated using (public.current_role() in ('admin','manager')) with check (public.current_role() in ('admin','manager'));
create policy managers_write_tables on restaurant_tables for all to authenticated using (public.current_role() in ('admin','manager')) with check (public.current_role() in ('admin','manager'));
create policy staff_close_tables on restaurant_tables for update to authenticated using (public.current_role() in ('admin','manager','cashier','waiter')) with check (status = 'available');
create policy managers_write_inventory on inventory_items for all to authenticated using (public.current_role() in ('admin','manager')) with check (public.current_role() in ('admin','manager'));
create policy managers_write_settings on restaurant_settings for all to authenticated using (public.current_role() in ('admin','manager')) with check (public.current_role() in ('admin','manager'));
create policy managers_write_customers on customers for all to authenticated using (public.current_role() in ('admin','manager','cashier','waiter')) with check (public.current_role() in ('admin','manager','cashier','waiter'));
