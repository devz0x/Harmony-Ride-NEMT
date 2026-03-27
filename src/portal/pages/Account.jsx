import { useState, useEffect } from 'react'
import { Save, KeyRound, CheckCircle } from 'lucide-react'
import { useMyPatient, db } from '../../lib/useData'
import { supabase } from '../../lib/supabase'
import styles from './Account.module.css'

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

export default function Account() {
  const { patient, loading, refresh } = useMyPatient()

  // Profile fields
  const [name,       setName]       = useState('')
  const [dob,        setDob]        = useState('')
  const [phone,      setPhone]      = useState('')
  const [email,      setEmail]      = useState('')
  const [address,    setAddress]    = useState('')
  const [ecName,     setEcName]     = useState('')
  const [ecPhone,    setEcPhone]    = useState('')

  // Insurance & Transport
  const [insurance,   setInsurance]   = useState('Medicaid')
  const [memberId,    setMemberId]    = useState('')
  const [conditions,  setConditions]  = useState('')
  const [transport,   setTransport]   = useState('ambulatory')

  // Password change
  const [curPassword,  setCurPassword]  = useState('')
  const [newPassword,  setNewPassword]  = useState('')
  const [confPassword, setConfPassword] = useState('')

  // UI state
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved,  setProfileSaved]  = useState(false)
  const [profileError,  setProfileError]  = useState('')
  const [passLoading,   setPassLoading]   = useState(false)
  const [passError,     setPassError]     = useState('')
  const [passSaved,     setPassSaved]     = useState(false)

  // Pre-fill from patient record
  useEffect(() => {
    if (patient) {
      setName(patient.name || '')
      setDob(patient.dob || '')
      setPhone(patient.phone || '')
      setEmail(patient.email || '')
      setAddress(patient.address || '')
      setEcName(patient.emergency_contact_name || '')
      setEcPhone(patient.emergency_contact_phone || '')
      setInsurance(patient.insurance || 'Medicaid')
      setMemberId(patient.memberId || '')
      setConditions((patient.conditions || []).join(', '))
      setTransport(patient.transport || 'ambulatory')
    }
  }, [patient])

  async function handleProfileSave(e) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileError('')

    try {
      const { error: dbError } = await db.patients.update(patient.id, {
        name,
        phone,
        address,
        insurance,
        member_id:                   memberId || null,
        transport,
        conditions:                  conditions.split(',').map(s => s.trim()).filter(Boolean),
        emergency_contact_name:      ecName || null,
        emergency_contact_phone:     ecPhone || null,
      })

      if (dbError) { setProfileError(dbError.message); return }

      // Update auth user metadata
      await supabase.auth.updateUser({ data: { full_name: name } })

      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
      refresh()
    } catch (err) {
      setProfileError(err.message || 'Failed to save profile.')
    } finally {
      setProfileSaving(false)
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault()
    if (newPassword !== confPassword) {
      setPassError('New passwords do not match.')
      return
    }
    if (newPassword.length < 6) {
      setPassError('Password must be at least 6 characters.')
      return
    }
    setPassLoading(true)
    setPassError('')

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPassLoading(false)

    if (error) { setPassError(error.message); return }

    setPassSaved(true)
    setCurPassword('')
    setNewPassword('')
    setConfPassword('')
    setTimeout(() => setPassSaved(false), 3000)
  }

  if (loading) {
    return <div className={styles.loading}>Loading your account…</div>
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>My Account</h1>
        <p className={styles.sub}>Manage your profile, insurance, and password</p>
      </div>

      {/* Profile Form */}
      <form className={styles.section} onSubmit={handleProfileSave}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Profile Information</h2>
          {profileSaved && (
            <span className={styles.savedToast}>
              <CheckCircle size={14} /> Saved!
            </span>
          )}
        </div>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label}>Full Name</label>
            <input
              className={styles.input}
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Date of Birth</label>
            <input
              className={`${styles.input} ${styles.inputReadonly}`}
              type="date"
              value={dob}
              readOnly
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Phone</label>
            <input
              className={styles.input}
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Email <span className={styles.readonly}>(read-only)</span></label>
            <input
              className={`${styles.input} ${styles.inputReadonly}`}
              type="email"
              value={email}
              readOnly
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Home Address</label>
          <input
            className={styles.input}
            type="text"
            placeholder="123 Main St, Haverhill, MA"
            value={address}
            onChange={e => setAddress(e.target.value)}
          />
        </div>

        <div className={styles.subsectionTitle}>Emergency Contact</div>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label}>Emergency Contact Name</label>
            <input
              className={styles.input}
              type="text"
              placeholder="John Doe"
              value={ecName}
              onChange={e => setEcName(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Emergency Contact Phone</label>
            <input
              className={styles.input}
              type="tel"
              placeholder="(555) 000-0000"
              value={ecPhone}
              onChange={e => setEcPhone(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.subsectionTitle}>Insurance &amp; Transport</div>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label className={styles.label}>Insurance Provider</label>
            <select
              className={styles.input}
              value={insurance}
              onChange={e => setInsurance(e.target.value)}
            >
              {INSURANCE_OPTIONS.map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Member ID <span className={styles.optional}>(optional)</span></label>
            <input
              className={styles.input}
              type="text"
              value={memberId}
              onChange={e => setMemberId(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Transport Needs</label>
            <select
              className={styles.input}
              value={transport}
              onChange={e => setTransport(e.target.value)}
            >
              {TRANSPORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Medical Conditions <span className={styles.optional}>(comma-separated)</span></label>
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            rows={3}
            placeholder="Diabetes, Hypertension, COPD"
            value={conditions}
            onChange={e => setConditions(e.target.value)}
          />
        </div>

        {profileError && <p className={styles.error}>{profileError}</p>}

        <div className={styles.saveRow}>
          <button className={styles.saveBtn} type="submit" disabled={profileSaving}>
            <Save size={15} />
            {profileSaving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </form>

      {/* Change Password */}
      <form className={styles.section} onSubmit={handlePasswordChange}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Change Password</h2>
          {passSaved && (
            <span className={styles.savedToast}>
              <CheckCircle size={14} /> Password updated!
            </span>
          )}
        </div>

        <div className={styles.grid1}>
          <div className={styles.field}>
            <label className={styles.label}>New Password</label>
            <input
              className={styles.input}
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="••••••••"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Confirm New Password</label>
            <input
              className={styles.input}
              type="password"
              required
              autoComplete="new-password"
              placeholder="••••••••"
              value={confPassword}
              onChange={e => setConfPassword(e.target.value)}
            />
          </div>
        </div>

        {passError && <p className={styles.error}>{passError}</p>}

        <div className={styles.saveRow}>
          <button className={styles.saveBtn} type="submit" disabled={passLoading}>
            <KeyRound size={15} />
            {passLoading ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  )
}
