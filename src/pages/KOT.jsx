import { useEffect, useState } from 'react'
import { classifySupabaseError, supabase } from '../lib/supabase'

const columns = ['new', 'preparing', 'ready', 'served']
const labels = { new: 'NEW', preparing: 'PREPARING', ready: 'READY', served: 'SERVED' }
const nextStatus = { new: 'preparing', preparing: 'ready', ready: 'served' }

const formatTicket = (ticket) => ({
    id: ticket.id,
    orderId: ticket.orders?.id,
    number: ticket.kot_number,
    order: ticket.orders?.order_number || 'Order',
    table: ticket.orders?.restaurant_tables?.table_number ? `Table ${String(ticket.orders.restaurant_tables.table_number).padStart(2, '0')}` : 'Takeaway',
    items: ticket.orders?.order_items || [],
    note: ticket.notes || ticket.orders?.notes || '',
    status: ticket.status,
    time: new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    orderData: ticket.orders,
})

export default function KOT({ onBill }) {
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(Boolean(supabase))
    const [error, setError] = useState('')

    const loadTickets = async () => {
        if (!supabase) { setLoading(false); return }
        setLoading(true)
        const { data, error: queryError } = await supabase.from('kot_orders').select('id,kot_number,status,notes,created_at,orders(id,order_number,notes,subtotal,discount,cgst,sgst,total,restaurant_tables(table_number),order_items(quantity,notes,unit_price,total,menu_items(name)))').order('created_at', { ascending: false })
        if (queryError) setError(classifySupabaseError(queryError))
        else { setError(''); setTickets((data || []).map(formatTicket)) }
        setLoading(false)
    }

    useEffect(() => {
        const loadTimer = window.setTimeout(loadTickets, 0)
        if (!supabase) return undefined
        const channel = supabase.channel('kitchen-tickets').on('postgres_changes', { event: '*', schema: 'public', table: 'kot_orders' }, loadTickets).subscribe()
        return () => { window.clearTimeout(loadTimer); supabase.removeChannel(channel) }
    }, [])

    const advance = async (ticket) => {
        const status = nextStatus[ticket.status]
        if (!status || !supabase) return
        setTickets((current) => current.map((item) => item.id === ticket.id ? { ...item, status } : item))
        const { error: updateError } = await supabase.from('kot_orders').update({ status, updated_at: new Date().toISOString() }).eq('id', ticket.id)
        if (updateError) { setError(classifySupabaseError(updateError)); loadTickets() }
        else if (status === 'served' && onBill) onBill(ticket)
    }

    return <div className="page-grid"><div className="panel-head"><div><h2 className="section-title">Kitchen display</h2><p className="crumb">Live orders from Supabase, ready for the kitchen team</p></div><div className="header-actions"><span className="badge orange">{tickets.filter((ticket) => ticket.status !== 'served').length} active tickets</span><button className="secondary" onClick={loadTickets}>Refresh</button></div></div>{error && <div className="connection-message">{error}</div>}{loading ? <section className="panel empty-state"><h3>Loading kitchen tickets...</h3></section> : <div className="kanban">{columns.map((status) => <div className="kanban-col" key={status}><div className="kanban-title"><h4>{labels[status]}</h4><span>{tickets.filter((ticket) => ticket.status === status).length}</span></div>{tickets.filter((ticket) => ticket.status === status).map((ticket) => <article className="ticket" key={ticket.id}><div className="ticket-head"><b>{ticket.number}</b><span className="badge">{ticket.table}</span></div><div className="ticket-order">{ticket.order} · {ticket.time}</div><div className="ticket-items">{ticket.items.map((item, index) => <div key={`${ticket.id}-${index}`}><strong>{item.quantity} ×</strong> {item.menu_items?.name || 'Menu item'}{item.notes && <small>{item.notes}</small>}</div>)}</div>{ticket.note && <p className="ticket-note">Note: {ticket.note}</p>}{nextStatus[status] ? <button onClick={() => advance(ticket)}>{status === 'new' ? 'Accept order' : status === 'preparing' ? 'Mark ready' : 'Mark served'}</button> : <button className="secondary" onClick={() => onBill?.(ticket)}>Generate bill</button>}</article>)}</div>)}</div>}{!loading && !error && !tickets.length && <section className="panel empty-state"><h3>No kitchen tickets yet</h3><p className="muted">New orders will appear here after they are sent to the kitchen.</p></section>}</div>
}
