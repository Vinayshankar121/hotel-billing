export default function MenuItem({ item, onAdd }) {
    return <article className="menu-card"><div className="text-food"><span>{item.veg ? 'VEG' : 'NON-VEG'}</span><b>{item.category}</b></div><h4>{item.name}</h4><span className="muted">{item.veg ? 'Vegetarian' : 'Non-vegetarian'}</span><div className="food-meta"><span className="price">₹{item.price}</span><button className="add" onClick={() => onAdd(item)}>＋</button></div></article>
}
