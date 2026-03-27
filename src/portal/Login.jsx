import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import styles from './Login.module.css'

const INSURANCE_OPTIONS = [
  'Medicaid', 'Medicare', 'BlueCross', 'Humana',
  'Aetna', 'UnitedHealth', 'Cigna', 'Self-Pay',
]

const TRANSPORT_OPTIONS = [
  { value: 'ambulatory', label: 'Ambulatory (Walking)' },
  { value: 'wheelchair', label: 'Wheelchair' },
  { value: 'stretcher',  label: 'Stretcher' },
  { value: 'bariatric',  label: 'Bariatric' },
]

export default function PortalLogin() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('signin')

  // Sign-in state
  const [signInEmail,    setSignInEmail]    = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [signInError,    setSignInError]    = useState('')
  const [signInLoading,  setSignInLoading]  = useState(false)

  // Register state
  const [regName,      setRegName]      = useState('')
  const [regDob,       setRegDob]       = useState('')
  const [regPhone,     setRegPhone]     = useState('')
  const [regEmail,     setRegEmail]     = useState('')
  const [regPassword,  setRegPassword]  = useState('')
  const [regTransport, setRegTransport] = useState('ambulatory')
  const [regInsurance, setRegInsurance] = useState('Medicaid')
  const [regMemberId,  setRegMemberId]  = useState('')
  const [regError,     setRegError]     = useState('')
  const [regLoading,   setRegLoading]   = useState(false)

  async function handleSignIn(e) {
    e.preventDefault()
    setSignInLoading(true)
    setSignInError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: signInEmail,
      password: signInPassword,
    })
    setSignInLoading(false)
    if (error) { setSignInError(error.message); return }
    navigate('/portal', { replace: true })
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters.')
      return
    }
    setRegLoading(true)
    setRegError('')

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
      })
      if (authError) { setRegError(authError.message); setRegLoading(false); return }

      const userId = authData.user?.id
      if (!userId) {
        setRegError('Account created — please check your email to confirm, then sign in.')
        setRegLoading(false)
        setTab('signin')
        return
      }

      // 2. Check if patient with this email already exists
      const { data: existing } = await supabase
        .from('patients')
        .select('id')
        .eq('email', regEmail)
        .maybeSingle()

      if (existing) {
        // 3. Link existing patient record to new auth user
        await supabase
          .from('patients')
          .update({ portal_user_id: userId })
          .eq('email', regEmail)
      } else {
        // 4. Create new patient record
        await supabase.from('patients').insert({
          name:           regName,
          email:          regEmail,
          phone:          regPhone,
          dob:            regDob,
          transport:      regTransport,
          insurance:      regInsurance,
          member_id:      regMemberId || null,
          portal_user_id: userId,
          status:         'active',
          total_trips:    0,
          conditions:     [],
        })
      }

      navigate('/portal', { replace: true })
    } catch (err) {
      setRegError(err.message || 'An unexpected error occurred.')
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <rect width="44" height="44" rx="10" fill="#0d9488"/>
            <ellipse cx="16" cy="22" rx="7" ry="4.5" stroke="white" strokeWidth="2.2" fill="none"/>
            <ellipse cx="28" cy="22" rx="7" ry="4.5" stroke="white" strokeWidth="2.2" fill="none"/>
          </svg>
        </div>
        <h1 className={styles.title}>Harmony Rides</h1>
        <p className={styles.sub}>Patient Portal</p>

        <div className={styles.tabs}>
          <button
            className={`${styles.tabBtn} ${tab === 'signin' ? styles.tabBtnActive : ''}`}
            onClick={() => setTab('signin')}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`${styles.tabBtn} ${tab === 'register' ? styles.tabBtnActive : ''}`}
            onClick={() => setTab('register')}
            type="button"
          >
            Create Account
          </button>
        </div>

        {tab === 'signin' && (
          <form className={styles.form} onSubmit={handleSignIn}>
            <label className={styles.label}>Email Address</label>
            <input
              className={styles.input}
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={signInEmail}
              onChange={e => setSignInEmail(e.target.value)}
            />

            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={signInPassword}
              onChange={e => setSignInPassword(e.target.value)}
            />

            {signInError && <p className={styles.error}>{signInError}</p>}

            <button className={styles.btn} type="submit" disabled={signInLoading}>
              {signInLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        )}

        {tab === 'register' && (
          <form className={styles.form} onSubmit={handleRegister}>
            <label className={styles.label}>Full Name</label>
            <input
              className={styles.input}
              type="text"
              required
              autoComplete="name"
              placeholder="Jane Doe"
              value={regName}
              onChange={e => setRegName(e.target.value)}
            />

            <label className={styles.label}>Date of Birth</label>
            <input
              className={styles.input}
              type="date"
              required
              value={regDob}
              onChange={e => setRegDob(e.target.value)}
            />

            <label className={styles.label}>Phone Number</label>
            <input
              className={styles.input}
              type="tel"
              required
              autoComplete="tel"
              placeholder="(555) 000-0000"
              value={regPhone}
              onChange={e => setRegPhone(e.target.value)}
            />

            <label className={styles.label}>Email Address</label>
            <input
              className={styles.input}
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={regEmail}
              onChange={e => setRegEmail(e.target.value)}
            />

            <label className={styles.label}>Password (min 6 characters)</label>
            <input
              className={styles.input}
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="••••••••"
              value={regPassword}
              onChange={e => setRegPassword(e.target.value)}
            />

            <label className={styles.label}>Transport Needs</label>
            <select
              className={styles.input}
              value={regTransport}
              onChange={e => setRegTransport(e.target.value)}
              required
            >
              {TRANSPORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <label className={styles.label}>Insurance</label>
            <select
              className={styles.input}
              value={regInsurance}
              onChange={e => setRegInsurance(e.target.value)}
              required
            >
              {INSURANCE_OPTIONS.map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>

            <label className={styles.label}>Member ID <span className={styles.optional}>(optional)</span></label>
            <input
              className={styles.input}
              type="text"
              placeholder="Leave blank if unknown"
              value={regMemberId}
              onChange={e => setRegMemberId(e.target.value)}
            />

            {regError && <p className={styles.error}>{regError}</p>}

            <button className={styles.btn} type="submit" disabled={regLoading}>
              {regLoading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        )}

        <div className={styles.backLink}>
          <Link to="/" className={styles.backAnchor}>← Back to Harmony Rides</Link>
        </div>
      </div>
    </div>
  )
}
