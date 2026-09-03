-- Cashiers and waiters can release a table after a paid order is completed.
create policy staff_close_tables on public.restaurant_tables
for update to authenticated
using (public.current_role() in ('admin', 'manager', 'cashier', 'waiter'))
with check (status = 'available');
