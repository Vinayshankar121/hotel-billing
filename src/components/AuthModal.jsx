import { useState } from 'react'

export default function AuthModal({ onClose, onSignIn }) {
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

    return <div className="modal-backdrop" onClick={(event) => event.target === event.currentTarget && !submitting && onClose()}><form className="modal" onSubmit={submit}><div className="modal-head"><h2>Admin sign in</h2><button type="button" className="close" onClick={onClose} disabled={submitting}>×</button></div><p className="muted">Use your Supabase Authentication admin account.</p><div className="form-grid"><div className="form-field"><label htmlFor="auth-email">Email</label><input id="auth-email" type="email" required autoFocus value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.com" /></div><div className="form-field"><label htmlFor="auth-password">Password</label><input id="auth-password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" /></div></div>{error && <p className="error-text">{error}</p>}<div className="modal-actions"><button type="button" className="secondary" onClick={onClose} disabled={submitting}>Cancel</button><button type="submit" className="primary" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button></div></form></div>
}