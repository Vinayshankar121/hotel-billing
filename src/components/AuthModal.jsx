import { useState } from 'react'

export default function AuthModal({ onClose, onSignIn, fullPage = false }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const submit = async (event) => {
        event.preventDefault()
        if (submitting) return
        setError('')
        setSubmitting(true)
        try {
            const message = await Promise.race([onSignIn(email, password), new Promise((resolve) => window.setTimeout(() => resolve('Unable to reach Supabase Auth after 10 seconds. The project Auth service did not respond.'), 10000))])
            if (message) setError(message)
        } catch (signInError) {
            setError(signInError.message || 'Unable to sign in. Check your Supabase configuration.')
        } finally {
            setSubmitting(false)
        }
    }

    return <div className={fullPage ? 'modal-backdrop auth-page' : 'modal-backdrop'} onClick={(event) => event.target === event.currentTarget && !submitting && !fullPage && onClose()}><div className={fullPage ? 'auth-layout' : ''}>{fullPage && <section className="auth-intro"><div className="auth-brand"><span className="brand-mark">◒</span><span><strong>TableMate</strong><small>HOTEL BILLING</small></span></div><div><p className="auth-eyebrow">Front desk operations</p><h1>Run every stay with confidence.</h1><p className="auth-description">A clear, dependable workspace for rooms, restaurant orders, payments and guest service.</p></div><p className="auth-footer">Secure access for hotel administrators and staff</p></section>}<form className="modal" onSubmit={submit}><div className="modal-head"><div><p className="auth-eyebrow">Welcome back</p><h2>Sign in to TableMate</h2></div>{!fullPage && <button type="button" className="close" onClick={onClose} disabled={submitting}>×</button>}</div><p className="muted">Use your hotel staff account to continue.</p><div className="form-grid"><div className="form-field"><label htmlFor="auth-email">Email address</label><input id="auth-email" type="email" required autoFocus value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@hotel.com" /></div><div className="form-field"><label htmlFor="auth-password">Password</label><input id="auth-password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /></div></div>{error && <p className="error-text">{error}</p>}<div className="modal-actions">{!fullPage && <button type="button" className="secondary" onClick={onClose} disabled={submitting}>Cancel</button>}<button type="submit" className="primary" disabled={submitting}>{submitting ? 'Signing in...' : 'Sign in'}</button></div></form></div></div>
}