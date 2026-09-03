-- Allow service staff to send completed orders to the kitchen.
create policy staff_create_kot on public.kot_orders
for insert to authenticated
with check (public.current_role() in ('admin', 'manager', 'cashier', 'waiter'));
