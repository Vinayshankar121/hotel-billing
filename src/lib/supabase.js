import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim()
export const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

export const getSupabaseConfigError = () => {
	if (!supabaseUrl || !supabaseAnonKey) return 'Supabase configuration is missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.'
	try {
		const url = new URL(supabaseUrl)
		if (url.protocol !== 'https:' || !url.hostname.endsWith('.supabase.co')) return 'Supabase URL is invalid. Use https://PROJECT-ID.supabase.co.'
	} catch {
		return 'Supabase URL is invalid. Use https://PROJECT-ID.supabase.co.'
	}
	if (!supabaseAnonKey.startsWith('eyJ') && !supabaseAnonKey.startsWith('sb_publishable_')) return 'Supabase public key is invalid. Use the publishable/anon key, not a service_role or secret key.'
	if (supabaseAnonKey.startsWith('eyJ')) {
		try {
			const payload = supabaseAnonKey.split('.')[1].replaceAll('-', '+').replaceAll('_', '/')
			const decoded = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')))
			if (decoded.role === 'service_role') return 'Supabase service_role keys are not allowed in frontend code. Use the publishable/anon key.'
		} catch {
			return 'Supabase public key is invalid. Use the publishable/anon key, not a service_role or secret key.'
		}
	}
	return ''
}

export const supabaseConfigError = getSupabaseConfigError()
export const isSupabaseConfigured = !supabaseConfigError
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null

export const classifySupabaseError = (error) => {
	if (!error) return ''
	const message = `${error.message || ''} ${error.details || ''}`.toLowerCase()
	if (message.includes('row-level security') || message.includes('rls')) return 'Access denied by Supabase Row Level Security policy.'
	if (message.includes('jwt') || message.includes('api key') || message.includes('unauthorized') || error.status === 401) return 'Supabase authentication failed. Sign in again and verify the public key.'
	if (message.includes('permission') || error.status === 403) return 'Permission denied by Supabase policies.'
	if (message.includes('relation') && message.includes('does not exist')) { const table = message.match(/relation ["']?([\w.]+)["']? does not exist/)?.[1]; return `Database table '${table || 'requested table'}' does not exist.` }
	if (error.name === 'TypeError' || message.includes('fetch') || message.includes('network')) return 'Unable to reach Supabase. Check your network connection.'
	return error.message || 'Supabase returned an unexpected error.'
}

export async function testSupabaseConnection() {
	const configError = getSupabaseConfigError()
	if (configError) return { ok: false, category: 'configuration', message: configError }
	try {
		if (!supabase) return { ok: false, category: 'configuration', message: supabaseConfigError }
		const { error } = await supabase.from('categories').select('id').limit(1)
		if (!error) return { ok: true, category: 'connected', message: 'Supabase Connected' }
		return { ok: false, category: error.status === 401 ? 'authentication' : error.status === 403 ? 'permission' : 'database', message: classifySupabaseError(error) }
	} catch (error) {
		return { ok: false, category: 'network', message: classifySupabaseError(error) }
	}
}
