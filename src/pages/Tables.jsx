import TableCard from '../components/TableCard'

const tableRows = (tables) => tables.map((table) => [`Table ${String(table.table_number).padStart(2, '0')}`, table.status.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()), `${table.capacity} Seats`])

export default function Tables({ tables = [], selected, setSelected, onOrder, onAdd }) {
    const rows = tableRows(tables)
    const counts = rows.reduce((result, [, status]) => ({ ...result, [status]: (result[status] || 0) + 1 }), {})
    return <div className="page-grid"><div className="panel-head"><div><h2 className="section-title">Floor plan</h2><p className="crumb">Manage seating, reservations and active orders</p></div><div className="header-actions"><button className="secondary" onClick={onAdd}>＋ Add table</button><button className="primary" onClick={onOrder} disabled={!rows.length}>＋ Start order</button></div></div><div className="filters"><button className="active">All · {rows.length}</button><button>Available · {counts.Available || 0}</button><button>Occupied · {counts.Occupied || 0}</button><button>Reserved · {counts.Reserved || 0}</button></div>{rows.length ? <div className="table-grid">{rows.map((table) => <TableCard table={table} selected={selected} onSelect={setSelected} key={table[0]} />)}</div> : <section className="panel empty-state"><h3>No tables created yet</h3><p className="muted">Create your first table to build the floor plan.</p><button className="primary" onClick={onAdd}>＋ Create first table</button></section>}</div>
}
