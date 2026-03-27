import { useState } from 'react'
import { Search, Plus, Phone, Mail, Star, AlertTriangle, X, Trash2 } from 'lucide-react'
import { useDrivers, useVehicles, db } from '../../lib/useData'
import styles from './Drivers.module.css'

const STATUS_OPTS = ['all', 'on-duty', 'off-duty', 'suspended']

const statusColor = { 'on-duty': '#16a34a', 'off-duty': '#64748b', suspended: '#ef4444' }
const statusBg    = { 'on-duty': '#d1fae5', 'off-duty': '#f1f5f9', suspended: '#fee2e2' }

const today = new Date().toISOString().slice(0, 10)
const in60  = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10)

function licenseStatus(exp) {
  if (!exp) return null
  if (exp < today)  return { level: 'expired',  text: `License expired ${exp}` }
  if (exp <= in60)  return { level: 'expiring', text: `License expires ${exp}` }
  return null
}

const EMPTY = {
  name: '', phone: '', email: '', license: '', license_exp: '',
  background: '', training: '', vehicle: '', status: 'off-duty', rating: 5.0, photo: '',
}

export default function Drivers() {
  const { drivers, loading, refresh } = useDrivers()
  const { vehicles } = useVehicles()
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [modal, setModal]       = useState(null)   // null | 'create' | driver obj
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const filtered = drivers.filter(d => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      d.name.toLowerCase().includes(q) ||
      d.id?.toLowerCase().includes(q) ||
      d.vehicle?.toLowerCase().includes(q) ||
      d.phone?.includes(q)
    return matchSearch && (statusFilter === 'all' || d.status === statusFilter)
  })

  const selectedDriver = drivers.find(d => d.id === selected)

  async function saveDriver(form) {
    setSaving(true)
    setError('')
    const initials = form.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    const payload = {
      name:        form.name,
      phone:       form.phone   || null,
      email:       form.email   || null,
      license:     form.license || null,
      license_exp: form.license_exp || null,
      background:  form.background  || null,
      training:    form.training    || null,
      vehicle:     form.vehicle     || null,
      status:      form.status,
      rating:      parseFloat(form.rating) || 5.0,
      photo:       initials,
    }
    let result
    if (modal === 'create') {
      const nums = drivers.map(d => parseInt(d.id.replace('D-', ''))).filter(n => !isNaN(n))
      payload.id       = `D-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(2, '0')}`
      payload.trips    = 0
      payload.join_date = today
      result = await db.drivers.create(payload)
    } else {
      result = await db.drivers.update(modal.id, payload)
    }
    setSaving(false)
    if (result.error) { setError(result.error.message); return }
    setModal(null)
    refresh()
  }

  async function deleteDriver(driver) {
    if (!window.confirm(`Remove ${driver.name} from the system? This cannot be undone.`)) return
    await db.drivers.delete(driver.id)
    setSelected(null)
    refresh()
  }

  async function setStatus(driver, status) {
    await db.drivers.update(driver.id, { status })
    refresh()
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Drivers</h1>
          <p className={styles.sub}>
            {drivers.filter(d => d.status === 'on-duty').length} on duty ·{' '}
            {drivers.filter(d => d.status === 'off-duty').length} off duty ·{' '}
            {drivers.filter(d => d.status === 'suspended').length} suspended
          </p>
        </div>
        <button className={styles.addBtn} onClick={() => { setError(''); setModal('create') }}>
          <Plus size={16}/> Add Driver
        </button>
      </div>

      {/* Search + status filter */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon}/>
          <input
            className={styles.searchInput}
            placeholder="Search by name, ID, phone, or vehicle…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filterPills}>
          {STATUS_OPTS.map(s => {
            const count = s === 'all' ? drivers.length : drivers.filter(d => d.status === s).length
            return (
              <button
                key={s}
                className={`${styles.pill} ${statusFilter === s ? styles.pillActive : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === 'all' ? 'All' : s.replace('-', ' ')}
                <span className={styles.pillCount}>{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className={styles.layout}>
        <div>
          {loading && <p className={styles.empty}>Loading…</p>}

          {!loading && drivers.length === 0 && (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>No drivers yet</p>
              <p className={styles.emptySub}>Add your first driver to get started.</p>
              <button className={styles.addBtn} onClick={() => setModal('create')}>
                <Plus size={15}/> Add Driver
              </button>
            </div>
          )}

          {!loading && drivers.length > 0 && filtered.length === 0 && (
            <p className={styles.empty}>No drivers match your search or filter.</p>
          )}

          <div className={styles.grid}>
            {filtered.map(driver => {
              const lic = licenseStatus(driver.licenseExp)
              return (
                <div
                  key={driver.id}
                  className={`${styles.card} ${selected === driver.id ? styles.cardSelected : ''}`}
                  onClick={() => setSelected(selected === driver.id ? null : driver.id)}
                >
                  <div className={styles.cardTop}>
                    <div className={styles.avatar} style={{ background: statusColor[driver.status] }}>
                      {driver.photo || driver.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className={styles.info}>
                      <p className={styles.name}>{driver.name}</p>
                      <p className={styles.id}>{driver.id}</p>
                    </div>
                    <span className={styles.status} style={{ color: statusColor[driver.status], background: statusBg[driver.status] }}>
                      {driver.status}
                    </span>
                  </div>

                  <div className={styles.stats}>
                    <div className={styles.stat}>
                      <Star size={12} color="#f59e0b" fill="#f59e0b"/>
                      <span>{driver.rating ?? '—'}</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>{driver.trips ?? 0} trips</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>{driver.vehicle || 'No vehicle'}</span>
                    </div>
                  </div>

                  {lic && (
                    <div className={`${styles.warn} ${lic.level === 'expired' ? styles.warnDanger : ''}`}>
                      <AlertTriangle size={12}/> {lic.text}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Detail panel */}
        {selectedDriver && (
          <div className={styles.detail}>
            <div className={styles.detailHeader}>
              <div className={styles.detailAvatar} style={{ background: statusColor[selectedDriver.status] }}>
                {selectedDriver.photo || selectedDriver.name?.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <h2 className={styles.detailName}>{selectedDriver.name}</h2>
                <p className={styles.detailId}>{selectedDriver.id}</p>
                <span className={styles.status} style={{ color: statusColor[selectedDriver.status], background: statusBg[selectedDriver.status] }}>
                  {selectedDriver.status}
                </span>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelected(null)}><X size={16}/></button>
            </div>

            <div className={styles.detailSection}>
              <h3 className={styles.detailSectionTitle}>Contact</h3>
              {selectedDriver.phone && (
                <a href={`tel:${selectedDriver.phone}`} className={styles.detailContact}><Phone size={14}/>{selectedDriver.phone}</a>
              )}
              {selectedDriver.email && (
                <a href={`mailto:${selectedDriver.email}`} className={styles.detailContact}><Mail size={14}/>{selectedDriver.email}</a>
              )}
              {!selectedDriver.phone && !selectedDriver.email && (
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No contact info on file.</p>
              )}
            </div>

            <div className={styles.detailSection}>
              <h3 className={styles.detailSectionTitle}>Credentials</h3>
              <DetailRow label="License #"    value={selectedDriver.license    || '—'}/>
              <DetailRow label="License Exp"  value={selectedDriver.licenseExp || '—'} warn={licenseStatus(selectedDriver.licenseExp)?.level}/>
              <DetailRow label="Background"   value={selectedDriver.background ? `Cleared ${selectedDriver.background}` : '—'}/>
              <DetailRow label="Training"     value={selectedDriver.training   || '—'}/>
              <DetailRow label="Joined"       value={selectedDriver.joinDate   || '—'}/>
            </div>

            <div className={styles.detailSection}>
              <h3 className={styles.detailSectionTitle}>Performance</h3>
              <DetailRow label="Total Trips"  value={selectedDriver.trips ?? 0}/>
              <DetailRow label="Rating"       value={selectedDriver.rating ? `${selectedDriver.rating} / 5.0` : '—'}/>
              <DetailRow label="Vehicle"      value={selectedDriver.vehicle || 'Unassigned'}/>
            </div>

            <div className={styles.detailActions}>
              <button className={styles.detailBtn} onClick={() => { setError(''); setModal(toFormData(selectedDriver)) }}>
                Edit Driver
              </button>
              {selectedDriver.status === 'on-duty'
                ? <button className={styles.detailBtn} onClick={() => setStatus(selectedDriver, 'off-duty')}>Set Off Duty</button>
                : <button className={styles.detailBtn} onClick={() => setStatus(selectedDriver, 'on-duty')}>Set On Duty</button>
              }
              {selectedDriver.status === 'suspended'
                ? <button className={styles.detailBtnSuccess} onClick={() => setStatus(selectedDriver, 'off-duty')}>Reinstate</button>
                : <button className={styles.detailBtnDanger}  onClick={() => setStatus(selectedDriver, 'suspended')}>Suspend</button>
              }
              <button className={styles.detailBtnDelete} onClick={() => deleteDriver(selectedDriver)}>
                <Trash2 size={14}/> Remove Driver
              </button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <DriverModal
          driver={modal === 'create' ? EMPTY : modal}
          isNew={modal === 'create'}
          vehicles={vehicles}
          saving={saving}
          error={error}
          onSave={saveDriver}
          onClose={() => { setModal(null); setError('') }}
        />
      )}
    </div>
  )
}

// Normalise camelCase DB mapping back to snake_case for the edit form
function toFormData(d) {
  return {
    ...d,
    license_exp: d.licenseExp || d.license_exp || '',
  }
}

function DetailRow({ label, value, warn }) {
  const color = warn === 'expired' ? '#ef4444' : warn === 'expiring' ? '#d97706' : '#334155'
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue} style={{ color }}>{value}</span>
    </div>
  )
}

function DriverModal({ driver, isNew, vehicles, saving, error, onSave, onClose }) {
  const [form, setForm] = useState({ ...driver })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <div style={mHead}>
          <h2 style={mTitle}>{isNew ? 'Add Driver' : 'Edit Driver'}</h2>
          <button style={mClose} onClick={onClose}><X size={18}/></button>
        </div>
        <form style={mBody} onSubmit={e => { e.preventDefault(); onSave(form) }}>
          <Row2>
            <F label="Full Name *">
              <input style={inp} required value={form.name} onChange={e => set('name', e.target.value)}/>
            </F>
            <F label="Phone">
              <input style={inp} value={form.phone || ''} onChange={e => set('phone', e.target.value)}/>
            </F>
          </Row2>

          <F label="Email">
            <input style={inp} type="email" value={form.email || ''} onChange={e => set('email', e.target.value)}/>
          </F>

          <Row2>
            <F label="License #">
              <input style={inp} value={form.license || ''} onChange={e => set('license', e.target.value)}/>
            </F>
            <F label="License Expiry">
              <input style={inp} type="date" value={form.license_exp || ''} onChange={e => set('license_exp', e.target.value)}/>
            </F>
          </Row2>

          <Row2>
            <F label="Background Check Cleared">
              <input style={inp} type="date" value={form.background || ''} onChange={e => set('background', e.target.value)}/>
            </F>
            <F label="Status">
              <select style={inp} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="on-duty">On Duty</option>
                <option value="off-duty">Off Duty</option>
                <option value="suspended">Suspended</option>
              </select>
            </F>
          </Row2>

          <F label="Training / Certifications">
            <input style={inp} value={form.training || ''} onChange={e => set('training', e.target.value)} placeholder="NEMT, CPR, First Aid…"/>
          </F>

          <Row2>
            <F label="Assigned Vehicle">
              <select style={inp} value={form.vehicle || ''} onChange={e => set('vehicle', e.target.value)}>
                <option value="">— None —</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.id} — {v.make}</option>)}
              </select>
            </F>
            <F label="Rating (1–5)">
              <input style={inp} type="number" min="1" max="5" step="0.1" value={form.rating || 5} onChange={e => set('rating', e.target.value)}/>
            </F>
          </Row2>

          {error && <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>{error}</p>}

          <div style={mFoot}>
            <button type="button" style={btnSec} onClick={onClose}>Cancel</button>
            <button type="submit" style={btnPri} disabled={saving}>{saving ? 'Saving…' : 'Save Driver'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Shared modal styles ───────────────────────────────────────────────────────
const overlay = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }
const box     = { background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column' }
const mHead   = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }
const mTitle  = { fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }
const mClose  = { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: '4px' }
const mBody   = { padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }
const mFoot   = { display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px' }
const inp     = { width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', color: '#0f172a', background: '#fff', boxSizing: 'border-box' }
const btnPri  = { padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#1e6fa8', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', fontWeight: 500 }
const btnSec  = { padding: '9px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', color: '#334155' }

function F({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
function Row2({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>{children}</div>
}
