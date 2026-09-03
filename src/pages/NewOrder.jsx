import MenuItem from '../components/MenuItem'
import Cart from '../components/Cart'

export default function NewOrder({ categories, category, setCategory, items, cart, onAdd, ...cartProps }) { return <div className="pos-layout"><section><div className="panel" style={{paddingBottom:5,marginBottom:15}}><div className="panel-head"><h3>Menu</h3><span className="muted">{items.length} items available</span></div><div className="category-row">{categories.map((item)=><button className={category === item ? 'active' : ''} onClick={()=>setCategory(item)} key={item}>{item}</button>)}</div></div><div className="menu-grid">{items.map((item)=><MenuItem key={item.name} item={item} onAdd={onAdd}/>)}</div></section><Cart {...cartProps} cart={cart}/></div> }
