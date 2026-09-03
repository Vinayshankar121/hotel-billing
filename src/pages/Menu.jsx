export default function Menu({ items, onAdd }) {
    return <div className="page-grid">
        <div className="panel-head">
            <div>
                <h2 className="section-title">
                    Menu management
                </h2>
                <p className="crumb">
                    Manage availability, pricing and categories
                </p>
            </div>
            <button className="primary" onClick={onAdd}>＋ Add food item
            </button>
        </div>
        <section className="panel">
            <table className="data-table">
                <thead><tr><th>ITEM</th>
                    <th>CATEGORY</th>
                    <th>PRICE</th>
                    <th>TYPE</th>
                    <th>STATUS</th>
                </tr>
                </thead>
                <tbody>{items.map((item) => <tr key={item.name}>
                    <td>
                        <b>{item.name}</b>
                    </td>
                    <td>{item.category}</td>
                    <td>₹{item.price}</td>
                    <td>{item.veg ? 'Veg' : 'Non-veg'}</td>
                    <td><span className="badge green">Available</span>
                    </td>
                </tr>)
                }
                </tbody>
            </table>
        </section>
    </div>
}
