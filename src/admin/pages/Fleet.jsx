import { useState } from 'react'
import { Truck, AlertTriangle, CheckCircle, Wrench, Plus, X, Search, Trash2 } from 'lucide-react'
import { useVehicles, useDrivers, db } from '../../lib/useData'
import styles from './Fleet.module.css'

const STATUS_OPTS = ['all', 'available', 'in-use', 'maintenance', 'reserved']
const TYPES = ['Wheelchair Van', 'Stretcher Van', 'Sedan', 'SUV', 'Minivan']

const statusColor = { available: '#16a34a', 'in-use': '#1e6fa8', maintenance: '#ef4444', reserved: '#d97706' }
const statusBg    = { available: '#d1fae5', 'in-use': '#dbeeff',  maintenance: '#fee2e2', reserved: '#fef3c7' }

const today = new Date().toISOString().slice(0, 10)
const in30  = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)

const isServiceDue      = v => v.nextService && v.nextService <= today
const isServiceSoon     = v => v.nextService && v.nextService > today && v.nextService <= in30
const isInspectionDue   = v => v.inspection  && v.inspection  <= today
const isInspectionSoon  = v => v.inspection  && v.inspection  > today  && v.inspection  <= in30

const EMPTY = {
  id: '', type: 'Wheelchair Van', make: '', year: new Date().getFullYear(),
  plate: '', vin: '', capacity: '', mileage: 0,
  last_service: '', next_service: '', inspection: '',
  status: 'available', driver: '', features: '',
}

export default function Fleet() {
  const { vehicles, loading, refresh } = useVehicles()
  const { drivers } = useDrivers()
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected]   = useState(null)
  const [modal, setModal]         = useState(null)   // null | 'create' | vehicle obj
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  const filtered = vehicles.filter(v => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      v.id?.toLowerCase().includes(q) ||
      v.make?.toLowerCase().includes(q) ||
      v.plate?.toLowerCase().includes(q) ||
      v.driver?.toLowerCase().includes(q) ||
      v.type?.toLowerCase().includes(q)
    return matchSearch && (statusFilter === 'all' || v.status === statusFilter)
  })

  const sel = vehicles.find(v => v.id === selected)

  async function saveVehicle(form) {
    setSaving(true)
    setError('')
    const payload = {
      type:         form.type,
      make:         form.make,
      year:         parseInt(form.year) || new Date().getFullYear(),
      plate:        form.plate        || null,
      vin:          form.vin          || null,
      capacity:     form.capacity     || null,
      mileage:      parseInt(form.mileage) || 0,
      last_service: form.last_service || null,
      next_service: form.next_service || null,
      inspection:   form.inspection   || null,
      status:       form.status,
      driver:       form.driver       || null,
      features:     form.features ? form.features.split(',').map(s => s.trim()).filter(Boolean) : [],
    }
    let result
    if (modal === 'create') {
      if (!form.id) { setSaving(false); setError('Vehicle ID is required.'); return }
      payload.id = form.id.toUpperCase()
      result = await db.vehicles.create(payload)
    } else {
      result = await db.vehicles.update(modal.id, payload)
    }
    setSaving(false)
    if (result.error) { setError(result.error.message); return }
    setModal(null)
    refresh()
  }

  async function deleteVehicle(v) {
    if (!window.confirm(`Remove ${v.id} (${v.make}) from the fleet? This cannot be undone.`)) return
    await db.vehicles.delete(v.id)
    setSelected(null)
    refresh()
  }

  async function setStatus(v, status) {
    await db.vehicles.update(v.id, { status })
    refresh()
  }

  function toFormData(v) {
    return { ...v, features: (v.features || []).join(', ') }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Fleet</h1>
          <p className={styles.sub}>
            {vehicles.filter(v => v.status === 'available').length} available ·{' '}
            {vehicles.filter(v => v.status === 'in-use').length} in use ·{' '}
            {vehicles.filter(v => v.status === 'maintenance').length} in maintenance
          </p>
        </div>
        <button className={styles.addBtn} onClick={() => { setError(''); setModal('create') }}>
          <Plus size={16}/> Add Vehicle
        </button>
      </div>

      {/* Summary cards */}
      <div className={styles.summary}>
        {[
          { label: 'Total Fleet',    value: vehicles.length,                                 icon: <Truck size={20}/>,        color: '#1e6fa8', bg: '#dbeeff' },
          { label: 'Available',      value: vehicles.filter(v => v.status === 'available').length, icon: <CheckCircle size={20}/>, color: '#16a34a', bg: '#d1fae5' },
          { label: 'In Use',         value: vehicles.filter(v => v.status === 'in-use').length,    icon: <Truck size={20}/>,       color: '#1e6fa8', bg: '#dbeeff' },
          { label: 'Service Due',    value: vehicles.filter(isServiceDue).length,            icon: <Wrench size={20}/>,       color: '#ef4444', bg: '#fee2e2' },
        ].map((s, i) => (
          <div key={i} className={styles.summaryCard}>
            <div className={styles.summaryIcon} style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div><p className={styles.summaryValue}>{s.value}</p><p className={styles.summaryLabel}>{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* Search + status filter */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon}/>
          <input
            className={styles.searchInput}
            placeholder="Search by ID, make, plate, or driver…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filterPills}>
          {STATUS_OPTS.map(s => {
            const count = s === 'all' ? vehicles.length : vehicles.filter(v => v.status === s).length
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
          {loading && <p className={styles.emptyMsg}>Loading…</p>}

          {!loading && vehicles.length === 0 && (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>No vehicles yet</p>
              <p className={styles.emptySub}>Add your first vehicle to get started.</p>
              <button className={styles.addBtn} onClick={() => setModal('create')}>
                <Plus size={15}/> Add Vehicle
              </button>
            </div>
          )}

          {!loading && vehicles.length > 0 && filtered.length === 0 && (
            <p className={styles.emptyMsg}>No vehicles match your search or filter.</p>
          )}

          <div className={styles.grid}>
            {filtered.map(v => (
              <div
                key={v.id}
                className={`${styles.card} ${selected === v.id ? styles.cardSelected : ''}`}
                onClick={() => setSelected(selected === v.id ? null : v.id)}
              >
                <div className={styles.cardTop}>
                  <div className={styles.vehicleIcon} style={{ background: statusBg[v.status], color: statusColor[v.status] }}>
                    <Truck size={22}/>
                  </div>
                  <div className={styles.vehicleInfo}>
                    <p className={styles.vehicleId}>{v.id}</p>
                    <p className={styles.vehicleName}>{v.make} {v.year}</p>
                    <p className={styles.vehicleType}>{v.type}</p>
                  </div>
                  <span className={styles.status} style={{ color: statusColor[v.status], background: statusBg[v.status] }}>
                    {v.status}
                  </span>
                </div>

                <div className={styles.cardMeta}>
                  {v.mileage != null && <span className={styles.meta}>{v.mileage.toLocaleString()} mi</span>}
                  {v.capacity && <span className={styles.meta}>{v.capacity}</span>}
                  {v.plate    && <span className={styles.meta}>{v.plate}</span>}
                </div>

                {v.driver && <p className={styles.driver}>Driver: {v.driver}</p>}

                <div className={styles.alerts}>
                  {isServiceDue(v)     && <div className={styles.alert}><AlertTriangle size={11}/> Service overdue</div>}
                  {isServiceSoon(v)    && <div className={styles.alertWarn}>Service due {v.nextService}</div>}
                  {isInspectionDue(v)  && <div className={styles.alert}><AlertTriangle size={11}/> Inspection overdue</div>}
                  {isInspectionSoon(v) && !isInspectionDue(v) && <div className={styles.alertInfo}>Inspection due {v.inspection}</div>}
                </div>

                <div className={styles.features}>
                  {(v.features || []).map((f, i) => <span key={i} className={styles.feature}>{f}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {sel && (
          <div className={styles.detail}>
            <div className={styles.detailTop}>
              <div className={styles.detailIcon} style={{ background: statusBg[sel.status], color: statusColor[sel.status] }}>
                <Truck size={28}/>
              </div>
              <div style={{ flex: 1 }}>
                <h2 className={styles.detailId}>{sel.id}</h2>
                <p className={styles.detailName}>{sel.make} {sel.year}</p>
                <span className={styles.status} style={{ color: statusColor[sel.status], background: statusBg[sel.status] }}>
                  {sel.status}
                </span>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelected(null)}><X size={16}/></button>
            </div>

            <Row label="Type"            value={sel.type}/>
            <Row label="License Plate"   value={sel.plate   || '—'}/>
            <Row label="VIN"             value={sel.vin     || '—'}/>
            <Row label="Capacity"        value={sel.capacity || '—'}/>
            <Row label="Mileage"         value={sel.mileage != null ? `${sel.mileage.toLocaleString()} mi` : '—'}/>
            <Row label="Assigned Driver" value={sel.driver  || 'Unassigned'}/>

            <div className={styles.separator}/>

            <Row label="Last Service"   value={sel.lastService || '—'}/>
            <Row label="Next Service"   value={sel.nextService || '—'} warn={isServiceDue(sel) ? 'danger' : isServiceSoon(sel) ? 'warn' : null}/>
            <Row label="Inspection Due" value={sel.inspection  || '—'} warn={isInspectionDue(sel) ? 'danger' : isInspectionSoon(sel) ? 'warn' : null}/>

            <div className={styles.separator}/>
            <p className={styles.featuresTitle}>Features</p>
            <div className={styles.detailFeatures}>
              {(sel.features || []).length === 0
                ? <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>None on file</span>
                : (sel.features || []).map((f, i) => <span key={i} className={styles.featureTag}>{f}</span>)
              }
            </div>

            <div className={styles.detailActions}>
              <button className={styles.btn} onClick={() => { setError(''); setModal(toFormData(sel)) }}>
                Edit Vehicle
              </button>
              {sel.status === 'maintenance'
                ? <button className={styles.btnSuccess} onClick={() => setStatus(sel, 'available')}>Mark Available</button>
                : <button className={styles.btnWarn}    onClick={() => setStatus(sel, 'maintenance')}>Send to Maintenance</button>
              }
              {sel.status === 'available' && (
                <button className={styles.btn} onClick={() => setStatus(sel, 'in-use')}>Mark In-Use</button>
              )}
              {sel.status === 'in-use' && (
                <button className={styles.btn} onClick={() => setStatus(sel, 'available')}>Mark Available</button>
              )}
              <button className={styles.btnDelete} onClick={() => deleteVehicle(sel)}>
                <Trash2 size={14}/> Remove Vehicle
              </button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <VehicleModal
          vehicle={modal === 'create' ? EMPTY : modal}
          isNew={modal === 'create'}
          drivers={drivers}
          saving={saving}
          error={error}
          onSave={saveVehicle}
          onClose={() => { setModal(null); setError('') }}
        />
      )}
    </div>
  )
}

function Row({ label, value, warn }) {
  const color = warn === 'danger' ? '#ef4444' : warn === 'warn' ? '#d97706' : '#334155'
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue} style={{ color }}>{value}</span>
    </div>
  )
}

function VehicleModal({ vehicle, isNew, drivers, saving, error, onSave, onClose }) {
  const [form, setForm] = useState({ ...vehicle })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <div style={mHead}>
          <h2 style={mTitle}>{isNew ? 'Add Vehicle' : 'Edit Vehicle'}</h2>
          <button style={mClose} onClick={onClose}><X size={18}/></button>
        </div>
        <form style={mBody} onSubmit={e => { e.preventDefault(); onSave(form) }}>
          <Row2>
            <F label={isNew ? 'Vehicle ID * (e.g. VAN-01)' : 'Vehicle ID'}>
              <input
                style={{ ...inp, background: isNew ? '#fff' : '#f8fafc' }}
                required={isNew}
                readOnly={!isNew}
                value={form.id}
                onChange={e => set('id', e.target.value)}
              />
            </F>
            <F label="Type">
              <select style={inp} value={form.type} onChange={e => set('type', e.target.value)}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </F>
          </Row2>

          <Row2>
            <F label="Make / Model *">
              <input style={inp} required value={form.make || ''} onChange={e => set('make', e.target.value)}/>
            </F>
            <F label="Year">
              <input style={inp} type="number" value={form.year || ''} onChange={e => set('year', e.target.value)}/>
            </F>
          </Row2>

          <Row2>
            <F label="License Plate">
              <input style={inp} value={form.plate || ''} onChange={e => set('plate', e.target.value)}/>
            </F>
            <F label="VIN">
              <input style={inp} value={form.vin || ''} onChange={e => set('vin', e.target.value)}/>
            </F>
          </Row2>

          <Row2>
            <F label="Capacity">
              <input style={inp} value={form.capacity || ''} onChange={e => set('capacity', e.target.value)} placeholder="2 WC + 3 ambulatory"/>
            </F>
            <F label="Mileage">
              <input style={inp} type="number" value={form.mileage || 0} onChange={e => set('mileage', e.target.value)}/>
            </F>
          </Row2>

          <Row2>
            <F label="Last Service">
              <input style={inp} type="date" value={form.last_service || ''} onChange={e => set('last_service', e.target.value)}/>
            </F>
            <F label="Next Service Due">
              <input style={inp} type="date" value={form.next_service || ''} onChange={e => set('next_service', e.target.value)}/>
            </F>
          </Row2>

          <Row2>
            <F label="Inspection Due">
              <input style={inp} type="date" value={form.inspection || ''} onChange={e => set('inspection', e.target.value)}/>
            </F>
            <F label="Status">
              <select style={inp} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="available">Available</option>
                <option value="in-use">In Use</option>
                <option value="maintenance">Maintenance</option>
                <option value="reserved">Reserved</option>
              </select>
            </F>
          </Row2>

          <F label="Assigned Driver">
            <select style={inp} value={form.driver || ''} onChange={e => set('driver', e.target.value)}>
              <option value="">— None —</option>
              {drivers.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </F>

          <F label="Features (comma-separated)">
            <input style={inp} value={form.features || ''} onChange={e => set('features', e.target.value)} placeholder="Hydraulic Lift, ADA, GPS…"/>
          </F>

          {error && <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>{error}</p>}

          <div style={mFoot}>
            <button type="button" style={btnSec} onClick={onClose}>Cancel</button>
            <button type="submit" style={btnPri} disabled={saving}>{saving ? 'Saving…' : 'Save Vehicle'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Shared modal styles ───────────────────────────────────────────────────────
const overlay = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }
const box     = { background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column' }
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
