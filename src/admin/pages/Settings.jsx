import { useState, useEffect } from 'react'
import { Save, Bell, Shield, Building, Users, Phone, ClipboardList, RefreshCw } from 'lucide-react'
import { useSettings, useActivityLogs, db } from '../../lib/useData'
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
            { id: 'logs',          label: 'Activity Log',   icon: ClipboardList },
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
                <h3 className={styles.subTitle}>Online Payments</h3>
                <div className={styles.grid}>
                  <Field label="Online Payment Link" value={form.payment_link || ''} onChange={v=>set('payment_link',v)}/>
                </div>
                <p style={{fontSize:'12px',color:'#94a3b8',margin:'4px 0 0'}}>
                  Enter a Stripe Payment Link (https://buy.stripe.com/…) or PayPal.Me URL. Leave blank to disable online payments.
                </p>
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

          {/* ── Activity Log ─────────────────────────────────────── */}
          {tab === 'logs' && <ActivityLogTab />}

        </div>
      </div>
    </div>
  )
}

const ENTITY_META = {
  trip:     { label: 'Trip',     color: '#1e6fa8', bg: '#dbeeff' },
  patient:  { label: 'Patient',  color: '#16a34a', bg: '#d1fae5' },
  driver:   { label: 'Driver',   color: '#7c3aed', bg: '#ede9fe' },
  vehicle:  { label: 'Vehicle',  color: '#d97706', bg: '#fef3c7' },
  invoice:  { label: 'Invoice',  color: '#0891b2', bg: '#cffafe' },
  settings: { label: 'Settings', color: '#64748b', bg: '#f1f5f9' },
}

const FILTER_TYPES = ['all', 'trip', 'patient', 'driver', 'vehicle', 'invoice', 'settings']

function relTime(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60)   return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60)   return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)   return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30)   return `${d}d ago`
  return new Date(ts).toLocaleDateString()
}

function absTime(ts) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function detailsSummary(details) {
  if (!details) return null
  const entries = Object.entries(details).filter(([, v]) => v != null && v !== '')
  if (!entries.length) return null
  return entries.map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(' · ')
}

function ActivityLogTab() {
  const { logs, loading, refresh } = useActivityLogs(200)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const visible = logs.filter(l => {
    const matchType = filter === 'all' || l.entity_type === filter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      l.action?.toLowerCase().includes(q) ||
      l.entity_label?.toLowerCase().includes(q) ||
      l.entity_id?.toLowerCase().includes(q)
    return matchType && matchSearch
  })

  return (
    <div className={styles.section}>
      <div className={styles.logHeader}>
        <h2 className={styles.sectionTitle} style={{marginBottom:0}}>Activity Log</h2>
        <button className={styles.refreshBtn} onClick={refresh} title="Refresh">
          <RefreshCw size={14}/>
        </button>
      </div>

      <div className={styles.logControls}>
        <input
          className={styles.logSearch}
          placeholder="Search logs…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className={styles.logFilters}>
          {FILTER_TYPES.map(t => (
            <button
              key={t}
              className={`${styles.logFilter} ${filter === t ? styles.logFilterActive : ''}`}
              onClick={() => setFilter(t)}
            >
              {t === 'all' ? 'All' : (ENTITY_META[t]?.label ?? t)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className={styles.logEmpty}>Loading…</div>
      ) : visible.length === 0 ? (
        <div className={styles.logEmpty}>No activity found.</div>
      ) : (
        <div className={styles.logList}>
          {visible.map(log => {
            const meta = ENTITY_META[log.entity_type] || { label: log.entity_type, color: '#64748b', bg: '#f1f5f9' }
            const summary = detailsSummary(log.details)
            return (
              <div key={log.id} className={styles.logEntry}>
                <div className={styles.logDot} style={{ background: meta.color }} />
                <div className={styles.logBody}>
                  <div className={styles.logTop}>
                    <span className={styles.logBadge} style={{ color: meta.color, background: meta.bg }}>
                      {meta.label}
                    </span>
                    <span className={styles.logAction}>{log.action}</span>
                    {log.entity_id && log.entity_label && log.entity_label !== log.entity_id && (
                      <span className={styles.logEntityLabel}>{log.entity_label}</span>
                    )}
                    {log.entity_id && (
                      <span className={styles.logEntityId}>{log.entity_id}</span>
                    )}
                  </div>
                  {summary && <p className={styles.logDetails}>{summary}</p>}
                </div>
                <div className={styles.logTime} title={absTime(log.created_at)}>
                  {relTime(log.created_at)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className={styles.logCount}>{visible.length} of {logs.length} entries</p>
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
