import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import styles from './Login.module.css'

export default function Login() {
  const navigate = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    navigate('/admin', { replace: true })
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <rect width="44" height="44" rx="10" fill="#0d9488"/>
            <ellipse cx="16" cy="22" rx="7" ry="4.5" stroke="white" strokeWidth="2.2" fill="none"/>
            <ellipse cx="28" cy="22" rx="7" ry="4.5" stroke="white" strokeWidth="2.2" fill="none"/>
            <rect x="20.5" y="18.5" width="3" height="7" rx="1" fill="white"/>
            <rect x="18.5" y="20.5" width="7" height="3" rx="1" fill="white"/>
          </svg>
        </div>
        <h1 className={styles.title}>Harmony Rides</h1>
        <p className={styles.sub}>Admin Portal — Sign in to continue</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>Email</label>
          <input
            className={styles.input}
            type="email"
            required
            autoComplete="email"
            placeholder="admin@harmonyrides.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <label className={styles.label}>Password</label>
          <input
            className={styles.input}
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className={styles.hint}>
          Access is restricted to authorised staff only.
        </p>
      </div>
    </div>
  )
}
