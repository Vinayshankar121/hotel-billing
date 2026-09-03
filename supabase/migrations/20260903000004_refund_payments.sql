-- Allow authorized cashiers and managers to refund a paid payment from Order history.
drop policy if exists staff_refund_payments on public.payments;
create policy staff_refund_payments on public.payments
for update to authenticated
using (public.current_role() in ('admin', 'manager', 'cashier'))
with check (payment_status = 'refunded');
