export default function TableCard({ table, selected, onSelect }) {
    const [name, status, detail] = table
    return <button className={`table-card ${status.toLowerCase().replace(' ', '-')} ${selected === name ? 'selected' : ''}`} onClick={() => onSelect(name)}><div className="table-number">{name}<span>⋮</span></div><p>{status === 'Available' ? detail : status}</p><div className={status === 'Available' || status === 'Reserved' ? 'muted' : 'amount'}>{detail}</div></button>
}
