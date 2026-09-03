import { useState } from 'react'

const modalFields = {
    menu: { title: 'Add food item', submit: 'Add item', fields: [['name', 'Food name', 'e.g. Paneer Tikka'], ['category', 'Category', 'e.g. Starters'], ['price', 'Price', '₹ Enter price'], ['foodType', 'Food type', 'Select food type', 'select', [['veg', 'Vegetarian'], ['non-veg', 'Non-vegetarian'], ['egg', 'Egg']]]] },
    inventory: { title: 'Add stock', submit: 'Add stock', fields: [['name', 'Ingredient', 'e.g. Basmati Rice'], ['currentStock', 'Current stock', 'e.g. 10', 'number'], ['unit', 'Unit', 'e.g. KG'], ['minimum', 'Minimum stock', 'e.g. 5', 'number']] },
    customer: { title: 'Add customer', submit: 'Add customer', fields: [['name', 'Customer name', 'Full name'], ['phone', 'Phone number', '+91 00000 00000'], ['email', 'Email (optional)', 'name@example.com'], ['address', 'Address (optional)', 'Street, city']] },
    staff: { title: 'Add staff', submit: 'Add staff', fields: [['name', 'Full name', 'Full name'], ['email', 'Email', 'name@example.com'], ['phone', 'Phone number', '+91 00000 00000'], ['role', 'Role', 'cashier'], ['userId', 'Auth user ID (optional)', 'Supabase auth user UUID']] },
    table: { title: 'Add restaurant table', submit: 'Create table', fields: [['tableNumber', 'Table number', 'e.g. 13'], ['capacity', 'Seats', 'e.g. 4']] },
}

export default function AddModal({ type, onClose, onSave }) {
    const config = modalFields[type]
    const [values, setValues] = useState({})
    const updateValue = (field, value) => setValues((current) => ({ ...current, [field]: value }))
    const submit = (event) => { event.preventDefault(); onSave(values) }

    return <div className="modal-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}><form className="modal add-modal" onSubmit={submit}><div className="modal-head"><h2>{config.title}</h2><button type="button" className="close" onClick={onClose}>×</button></div><div className="form-grid">{config.fields.map(([field, label, placeholder, type = 'text', options], index) => <div className="form-field" key={field}><label htmlFor={`add-${field}`}>{label}</label>{type === 'select' ? <select id={`add-${field}`} required value={values[field] || ''} onChange={(event) => updateValue(field, event.target.value)}><option value="">Choose one</option>{options.map(([value, text]) => <option value={value} key={value}>{text}</option>)}</select> : <input id={`add-${field}`} type={type} autoFocus={index === 0} required={field !== 'email'} placeholder={placeholder} value={values[field] || ''} onChange={(event) => updateValue(field, event.target.value)} />}</div>)}</div><div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button type="submit" className="primary">{config.submit}</button></div></form></div>
}