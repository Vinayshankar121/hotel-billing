const navigation = [
    ['Dashboard', '⌂'], ['New Order', '＋'], ['Tables', '▦'], ['Orders', '☷'], ['KOT / Kitchen', '♨'],
    ['Menu', '◈'], ['Inventory', '▤'], ['Customers', '♙'], ['Staff', '♧'], ['Reports', '⌁'], ['Settings', '⚙'],
]

export default function Sidebar({ page, onNavigate, onLogin, onLogout, isLoggedIn }) {
    return <aside className="sidebar"><div className="brand"><div className="brand-mark">◒</div><div><strong>TableMate</strong><small>RESTAURANT POS</small></div></div><nav className="nav">{navigation.map(([label, icon]) => <button key={label} className={page === label ? 'active' : ''} onClick={() => onNavigate(label)}><span className="nav-icon">{icon}</span>{label}</button>)}</nav><div className="sidebar-bottom"><div className="profile"><div className="avatar">AS</div><div><b>Arjun Sharma</b><span>Administrator</span></div></div>{isLoggedIn ? <button className="logout" onClick={onLogout}>↪ &nbsp;Log out</button> : <button className="logout" onClick={onLogin}>↪ &nbsp;Log in</button>}</div></aside>
}

