-- Replace the KOT policies for existing projects so the full order flow works for service staff.
drop policy if exists staff_create_kot on public.kot_orders;
drop policy if exists staff_update_kot on public.kot_orders;
drop policy if exists kitchen_update_kot on public.kot_orders;

create policy staff_create_kot on public.kot_orders
for insert to authenticated
with check (public.current_role() in ('admin', 'manager', 'cashier', 'waiter'));

create policy staff_update_kot on public.kot_orders
for update to authenticated
using (public.current_role() in ('admin', 'manager', 'cashier', 'waiter', 'kitchen'))
with check (status in ('new', 'preparing', 'ready', 'served'));
