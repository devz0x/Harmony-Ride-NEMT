import { useState, useEffect } from 'react'
import { Save, Bell, Shield, Building, Users, Phone } from 'lucide-react'
import { useSettings, db } from '../../lib/useData'
import styles from './Settings.module.css'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

const NOTIF_ITEMS = [
  { key: 'new_trip',           label: 'New trip booking created',          sub: 'Alert dispatchers when a new trip is booked' },
  { key: 'unassigned_warning', label: 'Unassigned trip (2hr warning)',      sub: 'Alert if trip has no driver 2 hours before pickup' },
  { key: 'driver_late',        label: 'Driver late alert',                  sub: 'Alert if driver is 10+ minutes past estimated arrival' },
  { key: 'no_show',            label: 'No-show notification',               sub: 'Alert when patient no-show is marked' },
  { key: 'denial',             label: 'Insurance denial received',          sub: 'Alert billing team on denied claims' },
  { key: 'maintenance',        label: 'Vehicle maintenance due',            sub: 'Alert fleet manager 7 days before service' },
  { key: 'license_expiry',     label: 'Driver license expiring',            sub: 'Alert HR 30 days before license expiration' },
  { key: 'daily_summary',      label: 'Daily trip summary',                 sub: 'Send daily report at 11:00 PM' },
]

const RULE_TOGGLES = [
  { key: 'auto_assign_proximity',  label: 'Auto-assign driver by proximity',          sub: 'Match nearest available driver to pickup location' },
  { key: 'strict_transport_match', label: 'Match transport level strictly',            sub: 'Only assign wheelchair drivers to wheelchair trips' },
  { key: 'prefer_usual_driver',    label: "Prefer recurring patient's usual driver",   sub: 'Keep consistency for recurring trips when possible' },
  { key: 'allow_overtime',         label: 'Allow overtime assignments',                sub: 'Assign trips that would exceed 8-hour driver shifts' },
]

const STATIC_USERS = [
  { name: 'Admin User',     email: 'admin@harmonyrides.com',   role: 'Dispatch Manager',      status: 'active' },
  { name: 'Sarah Kim',      email: 'sarah@harmonyrides.com',   role: 'Billing Coordinator',   status: 'active' },
  { name: 'Tom Reyes',      email: 'tom@harmonyrides.com',     role: 'Fleet Manager',         status: 'active' },
  { name: 'Jessica Brown',  email: 'jessica@harmonyrides.com', role: 'Dispatcher',            status: 'inactive' },
]

const COMPLIANCE = [
  { label: 'Florida NEMT License',               number: 'FL-NEMT-88221',  exp: '2026-01-15', status: 'active' },
  { label: 'Georgia NEMT Certificate',           number: 'GA-NEMT-44013',  exp: '2025-09-01', status: 'active' },
  { label: 'Texas NEMT Authorization',           number: 'TX-NEMT-71290',  exp: '2025-06-30', status: 'expiring' },
  { label: 'Liability Insurance Policy',         number: 'LBT-2024-99210', exp: '2025-12-01', status: 'active' },
  { label: 'HIPAA Business Associate Agreement', number: 'BAA-2024-CPS',   exp: '2027-01-01', status: 'active' },
  { label: 'DOT Registration',                   number: 'USDOT-3928817',  exp: '2026-06-01', status: 'active' },
]

export default function Settings() {
  const { settings, loading } = useSettings()
  const [tab, setTab]       = useState('company')
  const [form, setForm]     = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  useEffect(() => {
    if (settings && !form) setForm(settings)
  }, [settings])

  if (loading || !form) {
    return <div style={{padding:'48px',color:'#64748b',fontSize:'14px'}}>Loading settings…</div>
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setHours = (day, field, val) =>
    setForm(f => ({ ...f, business_hours: { ...f.business_hours, [day]: { ...f.business_hours[day], [field]: val } } }))
  const setNotif = (k, v) =>
    setForm(f => ({ ...f, notifications: { ...f.notifications, [k]: v } }))
  const setRule = (k, v) =>
    setForm(f => ({ ...f, dispatch_rules: { ...f.dispatch_rules, [k]: v } }))

  async function handleSave() {
    setSaving(true)
    await db.settings.upsert(form)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.sub}>Manage company info, notifications, and system preferences</p>
        </div>
        <button
          className={`${styles.saveBtn} ${saved ? styles.saveBtnSaved : ''}`}
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={15}/>
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className={styles.layout}>
        <div className={styles.tabs}>
          {[
            { id: 'company',       label: 'Company',        icon: Building },
            { id: 'notifications', label: 'Notifications',  icon: Bell },
            { id: 'dispatch',      label: 'Dispatch Rules', icon: Phone },
            { id: 'users',         label: 'Admin Users',    icon: Users },
            { id: 'compliance',    label: 'Compliance',     icon: Shield },
          ].map(t => (
            <button
              key={t.id}
              className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
              onClick={() => setTab(t.id)}
            >
              <t.icon size={16}/>
              {t.label}
            </button>
          ))}
        </div>

        <div className={styles.panel}>

          {/* ── Company ─────────────────────────────────────────── */}
          {tab === 'company' && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Company Information</h2>
              <div className={styles.grid}>
                <Field label="Company Name"       value={form.company_name}     onChange={v=>set('company_name',v)}/>
                <Field label="Operating States"   value={form.operating_states} onChange={v=>set('operating_states',v)}/>
                <Field label="Primary Phone"      value={form.primary_phone}    onChange={v=>set('primary_phone',v)}/>
                <Field label="Dispatch Phone"     value={form.dispatch_phone}   onChange={v=>set('dispatch_phone',v)}/>
                <Field label="Support Email"      value={form.support_email}    onChange={v=>set('support_email',v)}/>
                <Field label="Billing Email"      value={form.billing_email}    onChange={v=>set('billing_email',v)}/>
                <Field label="Physical Address"   value={form.address}          onChange={v=>set('address',v)}/>
                <Field label="NPI Number"         value={form.npi}              onChange={v=>set('npi',v)}/>
                <Field label="Medicaid Provider ID" value={form.medicaid_id}   onChange={v=>set('medicaid_id',v)}/>
                <Field label="Medicare Provider ID" value={form.medicare_id}   onChange={v=>set('medicare_id',v)}/>
              </div>

              <div className={styles.subSection}>
                <h3 className={styles.subTitle}>Business Hours</h3>
                <div className={styles.hours}>
                  {DAYS.map(day => {
                    const h = form.business_hours?.[day] || { open: true, start: '06:00', end: '22:00' }
                    return (
                      <div key={day} className={styles.hourRow}>
                        <span className={styles.day}>{day}</span>
                        <input className={styles.timeInput} type="time" value={h.start} onChange={e=>setHours(day,'start',e.target.value)}/>
                        <span className={styles.to}>to</span>
                        <input className={styles.timeInput} type="time" value={h.end}   onChange={e=>setHours(day,'end',e.target.value)}/>
                        <label className={styles.checkLabel}>
                          <input type="checkbox" checked={h.open} onChange={e=>setHours(day,'open',e.target.checked)}/> Open
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Notifications ────────────────────────────────────── */}
          {tab === 'notifications' && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Notification Preferences</h2>
              <div className={styles.toggleList}>
                {NOTIF_ITEMS.map(n => (
                  <div key={n.key} className={styles.toggleRow}>
                    <div>
                      <p className={styles.toggleLabel}>{n.label}</p>
                      <p className={styles.toggleSub}>{n.sub}</p>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={!!form.notifications?.[n.key]}
                        onChange={e=>setNotif(n.key, e.target.checked)}
                      />
                      <span className={styles.toggleSlider}/>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Dispatch Rules ───────────────────────────────────── */}
          {tab === 'dispatch' && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Dispatch Rules</h2>
              <div className={styles.grid}>
                <Field label="Default Pickup Buffer (mins)"   value={form.dispatch_rules?.pickup_buffer ?? 15}        type="number" onChange={v=>setRule('pickup_buffer',Number(v))}/>
                <Field label="Same-Day Booking Cutoff"        value={form.dispatch_rules?.same_day_cutoff ?? '18:00'} type="time"   onChange={v=>setRule('same_day_cutoff',v)}/>
                <Field label="Max Trips Per Driver/Day"       value={form.dispatch_rules?.max_trips_per_driver ?? 10} type="number" onChange={v=>setRule('max_trips_per_driver',Number(v))}/>
                <Field label="Auto-Confirm Threshold (hrs)"   value={form.dispatch_rules?.auto_confirm_hours ?? 24}   type="number" onChange={v=>setRule('auto_confirm_hours',Number(v))}/>
              </div>
              <div className={styles.subSection}>
                <h3 className={styles.subTitle}>Auto-Assignment Rules</h3>
                <div className={styles.toggleList}>
                  {RULE_TOGGLES.map(r => (
                    <div key={r.key} className={styles.toggleRow}>
                      <div>
                        <p className={styles.toggleLabel}>{r.label}</p>
                        <p className={styles.toggleSub}>{r.sub}</p>
                      </div>
                      <label className={styles.toggle}>
                        <input
                          type="checkbox"
                          checked={!!form.dispatch_rules?.[r.key]}
                          onChange={e=>setRule(r.key, e.target.checked)}
                        />
                        <span className={styles.toggleSlider}/>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Admin Users (static display) ─────────────────────── */}
          {tab === 'users' && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Admin Users</h2>
              <div className={styles.userList}>
                {STATIC_USERS.map((u, i) => (
                  <div key={i} className={styles.userRow}>
                    <div className={styles.userAvatar}>{u.name.split(' ').map(n=>n[0]).join('')}</div>
                    <div className={styles.userInfo}>
                      <p className={styles.userName}>{u.name}</p>
                      <p className={styles.userEmail}>{u.email}</p>
                    </div>
                    <span className={styles.userRole}>{u.role}</span>
                    <span className={`${styles.userStatus} ${u.status==='active'?styles.userStatusActive:styles.userStatusInactive}`}>{u.status}</span>
                    <button className={styles.userEdit}>Edit</button>
                  </div>
                ))}
              </div>
              <button className={styles.addUserBtn}>+ Invite New Admin User</button>
            </div>
          )}

          {/* ── Compliance (static display) ──────────────────────── */}
          {tab === 'compliance' && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Compliance & Certifications</h2>
              <div className={styles.complianceList}>
                {COMPLIANCE.map((c, i) => (
                  <div key={i} className={styles.complianceRow}>
                    <div>
                      <p className={styles.complianceName}>{c.label}</p>
                      <p className={styles.complianceNumber}>{c.number}</p>
                    </div>
                    <div className={styles.complianceMeta}>
                      <span className={styles.complianceExp}>Expires {c.exp}</span>
                      <span className={`${styles.complianceStatus} ${c.status==='active'?styles.compActive:styles.compExpiring}`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      <input
        className={styles.fieldInput}
        type={type}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}
