import { useEffect, useState } from 'react'
import { classifySupabaseError, isSupabaseConfigured, supabase, supabaseConfigError, testSupabaseConnection } from './lib/supabase'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import PaymentModal from './components/PaymentModal'
import Invoice from './components/Invoice'
import AddModal from './components/AddModal'
import AuthModal from './components/AuthModal'
import Dashboard from './pages/Dashboard'
import NewOrder from './pages/NewOrder'
import Tables from './pages/Tables'
import Orders from './pages/Orders'
import KOT from './pages/KOT'
import Menu from './pages/Menu'
import Inventory from './pages/Inventory'
import Customers from './pages/Customers'
import Staff from './pages/Staff'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import './App.css'

const fallbackMenu = [
    { name: 'Chicken Biryani', category: 'Biryani', price: 280, veg: false },
    { name: 'Paneer Butter Masala', category: 'Main Course', price: 220, veg: true },
    { name: 'Masala Dosa', category: 'South Indian', price: 120, veg: true },
    { name: 'Chicken 65', category: 'Starters', price: 240, veg: false },
    { name: 'Veg Fried Rice', category: 'Chinese', price: 180, veg: true },
    { name: 'Butter Naan', category: 'Main Course', price: 45, veg: true },
    { name: 'Cold Coffee', category: 'Beverages', price: 120, veg: true },
    { name: 'Gulab Jamun', category: 'Desserts', price: 80, veg: true },
]
const initialCustomers = [['Rahul Mehta', '+91 98765 43210', '24', '₹18,640', '1,240 pts'], ['Ananya Rao', '+91 98110 22018', '18', '₹12,400', '890 pts'], ['Vikram Singh', '+91 98990 11221', '12', '₹8,200', '540 pts']]
const initialInventory = [['Basmati Rice', 'Grains', '25 KG', '10 KG', 'In Stock'], ['Paneer', 'Dairy', '4 KG', '5 KG', 'Low Stock'], ['Chicken', 'Meat', '0 KG', '10 KG', 'Out of Stock'], ['Cooking Oil', 'Pantry', '18 L', '8 L', 'In Stock']]
const initialStaff = [['Arjun Sharma', 'Admin', '+91 98765 10001', 'Active', 'Morning'], ['Neha Kapoor', 'Cashier', '+91 98765 10002', 'Active', 'Evening'], ['Rohan Das', 'Kitchen Staff', '+91 98765 10003', 'On break', 'Morning']]
const money = (value) => Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const createOrderNumber = () => `ORD-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`
const downloadCsv = (filename, headers, rows) => { const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n'); const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })); link.download = filename; link.click(); URL.revokeObjectURL(link.href) }

export default function App() {
    const [page, setPage] = useState('Dashboard')
    const [dark, setDark] = useState(false)
    const [query, setQuery] = useState('')
    const [category, setCategory] = useState('All')
    const [menu, setMenu] = useState(fallbackMenu)
    const [customers, setCustomers] = useState(initialCustomers)
    const [inventory, setInventory] = useState(initialInventory)
    const [staff, setStaff] = useState(initialStaff)
    const [tables, setTables] = useState([])
    const [orders, setOrders] = useState([])
    const [draftOrderNumber, setDraftOrderNumber] = useState(createOrderNumber)
    const [cart, setCart] = useState([{ ...fallbackMenu[0], quantity: 2 }, { ...fallbackMenu[5], quantity: 3 }])
    const [selectedTable, setSelectedTable] = useState('')
    const [paymentOpen, setPaymentOpen] = useState(false)
    const [billingOrder, setBillingOrder] = useState(null)
    const [receipt, setReceipt] = useState(null)
    const [addModal, setAddModal] = useState(null)
    const [authOpen, setAuthOpen] = useState(false)
    const [websiteSession, setWebsiteSession] = useState(!isSupabaseConfigured)
    const [toast, setToast] = useState('')
    const [authLoading, setAuthLoading] = useState(isSupabaseConfigured)
    const [profileError, setProfileError] = useState('')
    const [connection, setConnection] = useState(isSupabaseConfigured ? { kind: 'checking', label: 'Connecting...', message: 'Checking Supabase connection' } : { kind: 'offline', label: 'Supabase Offline', message: supabaseConfigError })

    useEffect(() => {
        if (!supabase) return
        let active = true
        const load = async () => {
            setAuthLoading(true)
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
            if (!active) return
            if (sessionError) { setAuthLoading(false); setConnection({ kind: 'error', label: 'Supabase Error', message: classifySupabaseError(sessionError) }); return }
            if (!sessionData.session) { setWebsiteSession(false); setAuthLoading(false); setConnection({ kind: 'offline', label: 'Supabase Offline', message: 'Sign in to load Supabase data' }); setAuthOpen(true); return }
            setWebsiteSession(true)
            const userId = sessionData.session.user.id
            setProfileError('')
            const { data: profile, error: profileQueryError } = await supabase.from('profiles').select('full_name,role,phone,is_active').eq('id', userId).maybeSingle()
            if (profileQueryError) setProfileError(classifySupabaseError(profileQueryError))
            else if (!profile) setProfileError('User profile has not been configured.')
            const results = await Promise.all([
                supabase.from('menu_items').select('id,name,price,food_type,category:categories(name)').eq('is_available', true).order('name'),
                supabase.from('restaurant_tables').select('id,table_number,capacity,status').order('table_number'),
                supabase.from('customers').select('name,phone,email,loyalty_points').order('name'),
                supabase.from('inventory_items').select('name,category,current_stock,unit,minimum_stock').eq('is_active', true).order('name'),
                supabase.from('profiles').select('full_name,role,phone,is_active').order('full_name'),
                supabase.from('orders').select('id,order_number,subtotal,discount,cgst,sgst,total,status,notes,created_at,restaurant_tables(table_number),customers(name),payments(id,amount,payment_method,payment_status,paid_at),order_items(quantity,unit_price,total,notes,menu_items(name))').order('created_at', { ascending: false }),
            ])
            if (!active) return
            const failed = results.find((result) => result.error)
            if (failed) { setConnection({ kind: 'error', label: 'Supabase Error', message: classifySupabaseError(failed.error) }); setAuthLoading(false); return }
            const [menuResult, tableResult, customersResult, inventoryResult, staffResult, ordersResult] = results
            setMenu(menuResult.data.map((item) => ({ id: item.id, name: item.name, price: Number(item.price), category: item.category?.name || 'Main Course', veg: item.food_type === 'veg' })))
            if (tableResult.data.length) { setTables(tableResult.data); setSelectedTable(`Table ${String(tableResult.data[0].table_number).padStart(2, '0')}`) }
            setCustomers(customersResult.data.map((item) => [item.name, item.phone || '-', '0', '₹0', `${item.loyalty_points || 0} pts`]))
            setInventory(inventoryResult.data.map((item) => [item.name, item.category || '-', `${item.current_stock || 0} ${item.unit || ''}`.trim(), `${item.minimum_stock || 0} ${item.unit || ''}`.trim(), Number(item.current_stock) >= Number(item.minimum_stock) ? 'In Stock' : 'Low Stock']))
            setStaff(staffResult.data.map((item) => [item.full_name || 'Staff member', item.role, item.phone || '-', item.is_active ? 'Active' : 'Inactive', '-']))
            setOrders(ordersResult.data.map((order) => ({ id: `#${order.order_number}`, orderId: order.id, orderNumber: order.order_number, table: order.restaurant_tables?.table_number ? `Table ${String(order.restaurant_tables.table_number).padStart(2, '0')}` : 'Takeaway', customer: order.customers?.name || 'Walk-in guest', amount: Number(order.total), subtotal: Number(order.subtotal), discount: Number(order.discount), cgst: Number(order.cgst), sgst: Number(order.sgst), items: order.order_items || [], paymentId: order.payments?.find((payment) => payment.payment_status === 'paid')?.id, payment: order.payments?.find((payment) => payment.payment_status === 'refunded') ? 'Refunded' : order.payments?.find((payment) => payment.payment_status === 'paid')?.payment_method?.toUpperCase() || 'Pending', status: order.status.charAt(0).toUpperCase() + order.status.slice(1), time: new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })))
            const connectionTest = await testSupabaseConnection()
            setConnection(connectionTest.ok ? { kind: 'connected', label: 'Supabase Connected', message: connectionTest.message } : { kind: 'error', label: 'Supabase Error', message: connectionTest.message })
            setAuthLoading(false)
        }
        load()
        const { data: authListener } = supabase.auth.onAuthStateChange((event) => { if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') window.setTimeout(load, 0) })
        return () => { active = false; authListener.subscription.unsubscribe() }
    }, [])

    const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 2400) }
    const signOut = async () => { if (supabase) await supabase.auth.signOut(); setWebsiteSession(false); setAuthOpen(true); setConnection({ kind: 'offline', label: 'Supabase Offline', message: 'Sign in to load Supabase data' }); setPaymentOpen(false); setAddModal(null); notify('Signed out from this website') }
    const requireSession = async () => { if (!websiteSession) { setAddModal(null); setAuthOpen(true); notify('Sign in to this website before saving data'); return false } if (!supabase) return true; const { data, error } = await supabase.auth.getSession(); if (error) { notify(classifySupabaseError(error)); return false } if (data.session) return true; setAddModal(null); setAuthOpen(true); notify('Sign in before saving data'); return false }
    const signIn = async (email, password) => { if (!supabase) return supabaseConfigError; const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) return classifySupabaseError(error).includes('authentication') ? 'Invalid email or password.' : classifySupabaseError(error); setWebsiteSession(true); setAuthOpen(false); notify('Signed in successfully; loading database'); return '' }
    const filteredMenu = menu.filter((item) => (category === 'All' || item.category === category) && item.name.toLowerCase().includes(query.toLowerCase()))
    const categories = ['All', ...new Set(menu.map((item) => item.category))]
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const discount = subtotal ? 50 : 0
    const cgst = (subtotal - discount) * 0.025
    const total = subtotal - discount + cgst * 2
    const addToCart = (item) => setCart((current) => { const found = current.find((entry) => entry.name === item.name); return found ? current.map((entry) => entry.name === item.name ? { ...entry, quantity: entry.quantity + 1 } : entry) : [...current, { ...item, quantity: 1 }] })
    const updateQuantity = (name, delta) => setCart((current) => current.map((item) => item.name === name ? { ...item, quantity: item.quantity + delta } : item).filter((item) => item.quantity > 0))
    const saveMenuItem = async (values) => { if (!await requireSession()) return; const price = Number(values.price); const foodType = values.foodType || 'veg'; let item = { name: values.name, category: values.category || 'Main Course', price, veg: foodType === 'veg' }; if (supabase) { const { data: categoryRow, error: categoryError } = await supabase.from('categories').upsert({ name: item.category }, { onConflict: 'name' }).select('id').single(); if (categoryError) { notify(classifySupabaseError(categoryError)); return } const { data, error } = await supabase.from('menu_items').insert({ name: item.name, price, category_id: categoryRow?.id, food_type: foodType }).select('id').single(); if (error) { notify(classifySupabaseError(error)); return } item = { ...item, id: data.id } } setMenu((current) => [...current, item]); setAddModal(null); notify(`${item.name} added to menu`) }
    const saveInventoryItem = async (values) => { if (!await requireSession()) return; const quantity = Number.parseFloat(values.currentStock); const minimum = Number.parseFloat(values.minimum) || 0; const unit = (values.unit || 'KG').trim().toUpperCase(); if (!Number.isFinite(quantity) || quantity < 0) { notify('Enter a valid current stock quantity'); return } const row = [values.name, 'Pantry', `${quantity} ${unit}`, `${minimum} ${unit}`, quantity >= minimum ? 'In Stock' : 'Low Stock']; if (supabase) { const { error } = await supabase.from('inventory_items').insert({ name: values.name, category: 'Pantry', current_stock: quantity, unit, minimum_stock: minimum }); if (error) { notify(classifySupabaseError(error)); return } } setInventory((current) => [...current, row]); setAddModal(null); notify(`${values.name} added with ${quantity} ${unit} in stock`) }
    const saveCustomer = async (values) => { if (!await requireSession()) return; const row = [values.name, values.phone || '-', '0', '₹0', '0 pts']; if (supabase) { const { error } = await supabase.from('customers').insert({ name: values.name, phone: values.phone, email: values.email, address: values.address }); if (error) { notify(error.message); return } } setCustomers((current) => [...current, row]); setAddModal(null); notify(`${values.name} added as a customer`) }
    const saveStaff = async (values) => { if (!await requireSession()) return; const role = (values.role || 'cashier').toLowerCase(); if (supabase && values.userId) { const { error } = await supabase.from('profiles').insert({ id: values.userId, full_name: values.name, email: values.email, phone: values.phone, role }); if (error) { notify(error.message); return } } const row = [values.name, role, values.phone || '-', 'Active', '-']; setStaff((current) => [...current, row]); setAddModal(null); notify(values.userId ? `${values.name} added to staff` : 'Staff added locally; link an Auth user ID to save it to Supabase') }
    const saveTable = async (values) => { if (!await requireSession()) return; const tableNumber = Number.parseInt(values.tableNumber, 10); const capacity = Number.parseInt(values.capacity, 10) || 4; if (!Number.isInteger(tableNumber) || tableNumber < 1) { notify('Enter a valid table number'); return } const table = { table_number: tableNumber, capacity, status: 'available' }; if (supabase) { const { data, error } = await supabase.from('restaurant_tables').insert(table).select('id,table_number,capacity,status').single(); if (error) { notify(classifySupabaseError(error)); return } setTables((current) => [...current, data].sort((first, second) => first.table_number - second.table_number)) } else setTables((current) => [...current, table].sort((first, second) => first.table_number - second.table_number)); setSelectedTable(`Table ${String(tableNumber).padStart(2, '0')}`); setAddModal(null); notify(`Table ${tableNumber} created`) }
    const saveOrder = async () => {
        if (!await requireSession()) return
        const orderNumber = createOrderNumber()
        if (supabase) {
            const { data: table } = await supabase.from('restaurant_tables').select('id').eq('table_number', Number(selectedTable.replace(/\D/g, ''))).maybeSingle()

            const { data: order, error: orderError } = await supabase.from('orders').insert({ order_number: orderNumber, table_id: table?.id, order_type: 'dine_in', subtotal, discount, cgst, sgst: cgst, total }).select('id').single()
            if (orderError) { notify(classifySupabaseError(orderError)); return }
            const { error: itemsError } = await supabase.from('order_items').insert(cart.map((item) => ({ order_id: order.id, menu_item_id: item.id || null, quantity: item.quantity, unit_price: item.price, total: item.price * item.quantity })))
            if (itemsError) { notify(classifySupabaseError(itemsError)); return }
            const { error: kotError } = await supabase.from('kot_orders').insert({ order_id: order.id, kot_number: `KOT-${orderNumber.replace('ORD-', '')}` })
            if (kotError) { notify(classifySupabaseError(kotError)); return }
        }
        setOrders((current) => [{ id: `#${orderNumber}`, table: selectedTable, customer: 'Walk-in guest', amount: Math.round(total), payment: 'Pending', status: 'Pending', time: 'Just now' }, ...current]); setDraftOrderNumber(createOrderNumber()); setPaymentOpen(false); notify('Order sent to kitchen'); setPage('KOT / Kitchen')
    }
    const openBill = (ticket) => { const order = ticket.orderData; if (!order) { notify('Order details are unavailable for billing'); return } setBillingOrder({ ...ticket, subtotal: Number(order.subtotal), discount: Number(order.discount), cgst: Number(order.cgst), sgst: Number(order.sgst), total: Number(order.total), items: order.order_items || [] }); setPaymentOpen(true) }
    const completePayment = async (method) => { if (!billingOrder || !await requireSession()) return; if (supabase) { const { error: paymentError } = await supabase.from('payments').insert({ order_id: billingOrder.orderId, amount: billingOrder.total, payment_method: method, payment_status: 'paid', paid_at: new Date().toISOString() }); if (paymentError) { notify(classifySupabaseError(paymentError)); return } const { error: orderError } = await supabase.from('orders').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', billingOrder.orderId); if (orderError) { notify(classifySupabaseError(orderError)); return } const tableNumber = Number(billingOrder.table.replace(/\D/g, '')); if (tableNumber) { const { error: tableError } = await supabase.from('restaurant_tables').update({ status: 'available' }).eq('table_number', tableNumber); if (tableError) { notify(classifySupabaseError(tableError)); return } } } setReceipt({ invoice: billingOrder.number.replace('KOT', 'INV'), date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), table: billingOrder.table, method, items: billingOrder.items.map((item) => ({ name: item.menu_items?.name || 'Menu item', quantity: item.quantity, total: money(item.total) })), subtotal: money(billingOrder.subtotal), discount: money(billingOrder.discount), tax: money(billingOrder.cgst + billingOrder.sgst), total: money(billingOrder.total) }); setOrders((current) => current.map((order) => order.id === `#${billingOrder.orderData.order_number}` ? { ...order, payment: method.toUpperCase(), status: 'Completed' } : order)); setBillingOrder(null); setPaymentOpen(false); setTables((current) => current.map((table) => table.table_number === Number(billingOrder.table.replace(/\D/g, '')) ? { ...table, status: 'available' } : table)); notify('Payment successful; table closed') }
    const showOrderBill = (order) => { if (!order.items?.length) { notify('No bill line items were found for this order'); return } setReceipt({ invoice: `INV-${order.orderNumber.replace('ORD-', '')}`, date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), table: order.table, method: order.payment === 'Pending' ? 'pending' : order.payment.toLowerCase(), items: order.items.map((item) => ({ name: item.menu_items?.name || 'Menu item', quantity: item.quantity, total: money(item.total) })), subtotal: money(order.subtotal), discount: money(order.discount), tax: money(order.cgst + order.sgst), total: money(order.amount) }) }
    const cancelOrder = async (order) => { if (!window.confirm(`Cancel ${order.id}?`)) return; if (!await requireSession()) return; if (supabase) { const { error } = await supabase.from('orders').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', order.orderId); if (error) { notify(classifySupabaseError(error)); return } } setOrders((current) => current.map((item) => item.orderId === order.orderId ? { ...item, status: 'Cancelled' } : item)); notify(`${order.id} cancelled`) }
    const refundOrder = async (order) => { if (!order.paymentId) { notify('No paid transaction found for this order'); return } if (!window.confirm(`Refund ${order.id}?`)) return; if (!await requireSession()) return; if (supabase) { const { error } = await supabase.from('payments').update({ payment_status: 'refunded' }).eq('id', order.paymentId); if (error) { notify(classifySupabaseError(error)); return } const { error: orderError } = await supabase.from('orders').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', order.orderId); if (orderError) { notify(classifySupabaseError(orderError)); return } } setOrders((current) => current.map((item) => item.orderId === order.orderId ? { ...item, payment: 'Refunded', status: 'Cancelled' } : item)); notify(`${order.id} refunded`) }
    const tableOptions = tables.map((table) => [`Table ${String(table.table_number).padStart(2, '0')}`, table.status, `${table.capacity} Seats`])
    const exportOrders = () => downloadCsv('orders.csv', ['Order ID', 'Table', 'Customer', 'Amount', 'Payment', 'Status', 'Time'], orders.map((order) => [order.id, order.table, order.customer, order.amount, order.payment, order.status, order.time]))
    const content = {
        Dashboard: <Dashboard onNew={() => setPage('New Order')} orders={orders} tables={tables} />,
        'New Order': <NewOrder categories={categories} category={category} setCategory={setCategory} items={filteredMenu} cart={cart} onAdd={addToCart} tables={tableOptions} orderNumber={draftOrderNumber} selectedTable={selectedTable} setSelectedTable={setSelectedTable} updateQuantity={updateQuantity} subtotal={money(subtotal)} discount={money(discount)} cgst={money(cgst)} total={money(total)} onPay={() => setPaymentOpen(true)} onSave={saveOrder} onClear={() => setCart([])} />,
        Tables: <Tables tables={tables} selected={selectedTable} setSelected={setSelectedTable} onAdd={() => setAddModal('table')} onOrder={() => setPage('New Order')} />,
        Orders: <Orders orders={orders} onExport={exportOrders} onShowBill={showOrderBill} onCancel={cancelOrder} onRefund={refundOrder} />,
        'KOT / Kitchen': <KOT onBill={openBill} />,
        Menu: <Menu items={menu} onAdd={() => setAddModal('menu')} />,
        Inventory: <Inventory rows={inventory} onAdd={() => setAddModal('inventory')} />,
        Customers: <Customers customers={customers} onAdd={() => setAddModal('customer')} />,
        Staff: <Staff staff={staff} onAdd={() => setAddModal('staff')} />,
        Reports: <Reports onExport={exportOrders} />,
        Settings: <Settings dark={dark} setDark={setDark} />,
    }
    const saveAddRecord = { menu: saveMenuItem, inventory: saveInventoryItem, customer: saveCustomer, staff: saveStaff, table: saveTable }
    if (!websiteSession) return <div className={dark ? 'app dark auth-app' : 'app auth-app'}><AuthModal fullPage onClose={() => setAuthOpen(false)} onSignIn={signIn} /></div>
    return <div className={dark ? 'app dark' : 'app'}><Sidebar page={page} onNavigate={setPage} onLogin={() => setAuthOpen(true)} onLogout={signOut} isLoggedIn={websiteSession} /><main className="main"><Header page={page} query={query} setQuery={setQuery} dark={dark} setDark={setDark} onMobileMenu={() => setPage(page === 'Dashboard' ? 'New Order' : 'Dashboard')} onNotify={notify} connection={connection} />{authLoading && <div className="connection-message">Checking authentication...</div>}{profileError && <div className="connection-message">{profileError}</div>}{content[page]}</main>{paymentOpen && <PaymentModal total={money(billingOrder ? billingOrder.total : total)} onClose={() => { setPaymentOpen(false); setBillingOrder(null) }} onConfirm={completePayment} />}{receipt && <Invoice receipt={receipt} onClose={() => setReceipt(null)} onNewOrder={() => { setReceipt(null); setCart([]); setPage('New Order') }} />}{addModal && <AddModal type={addModal} onClose={() => setAddModal(null)} onSave={saveAddRecord[addModal]} />}{authOpen && <AuthModal onClose={() => setAuthOpen(false)} onSignIn={signIn} />}{toast && <div className="toast">✓ &nbsp;{toast}</div>}</div>
}
