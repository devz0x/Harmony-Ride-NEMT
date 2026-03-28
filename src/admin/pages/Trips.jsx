import { useState } from 'react'
import { Search, Plus, Eye, Edit, Trash2, MapPin, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTrips, useDrivers, useVehicles, usePatients, db } from '../../lib/useData'
import Typeahead from '../../components/Typeahead'
import styles from './Trips.module.css'

const STATUS_OPTS    = ['all', 'pending', 'confirmed', 'in-transit', 'completed', 'no-show', 'cancelled']
const TRANSPORT_OPTS = ['all', 'ambulatory', 'wheelchair', 'stretcher', 'bariatric']
const INSURANCE_LIST = ['Medicaid', 'Medicare', 'BlueCross', 'Humana', 'Aetna', 'UnitedHealth', 'Cigna', 'Self-Pay']
const DATE_OPTS      = ['all', 'today', 'week']

const statusColor = { confirmed: '#1e6fa8', 'in-transit': '#d97706', pending: '#7c3aed', completed: '#16a34a', 'no-show': '#ef4444', cancelled: '#94a3b8' }
const statusBg    = { confirmed: '#dbeeff',  'in-transit': '#fef3c7', pending: '#ede9fe', completed: '#d1fae5', 'no-show': '#fee2e2', cancelled: '#f1f5f9' }
const transportIcon = { ambulatory: '🚶', wheelchair: '♿', stretcher: '🛏', bariatric: '⚕️' }

const today     = new Date().toISOString().slice(0, 10)
const weekStart = (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().slice(0, 10) })()

const EMPTY = {
  patient: '', dob: '', phone: '', pickup: '', destination: '',
  date: today, time: '', return_time: '', type: 'oneway',
  transport: 'ambulatory', driver: '', vehicle: '',
  insurance: 'Medicaid', status: 'pending', notes: '', mileage: '',
}

const PER_PAGE = 8

export default function Trips() {
  const { trips, loading, refresh }  = useTrips()
  const { drivers }                  = useDrivers()
  const { vehicles }                 = useVehicles()
  const { patients }                 = usePatients()

  const [search, setSearch]                 = useState('')
  const [statusFilter, setStatusFilter]     = useState('all')
  const [transportFilter, setTransportFilter] = useState('all')
  const [dateFilter, setDateFilter]         = useState('all')
  const [selected, setSelected]             = useState(null)
  const [page, setPage]                     = useState(1)
  const [modal, setModal]                   = useState(null)   // null | 'create' | trip obj
  const [assign, setAssign]                 = useState(null)   // trip to assign
  const [saving, setSaving]                 = useState(false)
  const [error, setError]                   = useState('')

  // ── Filtering ────────────────────────────────────────────────
  const filtered = trips.filter(t => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      t.patient?.toLowerCase().includes(q) ||
      t.id?.toLowerCase().includes(q)      ||
      t.pickup?.toLowerCase().includes(q)  ||
      t.destination?.toLowerCase().includes(q)
    const matchDate =
      dateFilter === 'all'   ? true :
      dateFilter === 'today' ? t.date === today :
      dateFilter === 'week'  ? t.date >= weekStart : true
    return matchSearch
      && (statusFilter    === 'all' || t.status    === statusFilter)
      && (transportFilter === 'all' || t.transport === transportFilter)
      && matchDate
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const selTrip    = trips.find(t => t.id === selected)

  function resetPage() { setPage(1) }

  // ── Save trip ────────────────────────────────────────────────
  async function saveTrip(form) {
    setSaving(true)
    setError('')
    const payload = {
      patient:     form.patient,
      dob:         form.dob         || null,
      phone:       form.phone        || null,
      pickup:      form.pickup,
      destination: form.destination,
      date:        form.date,
      time:        form.time         || null,
      return_time: form.return_time  || null,
      type:        form.type,
      transport:   form.transport,
      driver:      form.driver       || null,
      vehicle:     form.vehicle      || null,
      insurance:   form.insurance,
      status:      form.status,
      notes:       form.notes        || null,
      mileage:     form.mileage ? parseFloat(form.mileage) : null,
    }
    let result
    if (modal === 'create') {
      const nums = trips.map(t => parseInt(t.id.replace(/[^\d]/g, ''))).filter(n => !isNaN(n))
      payload.id = `T-${(nums.length ? Math.max(...nums) : 0) + 1}`
      result = await db.trips.create(payload)
    } else {
      result = await db.trips.update(modal.id, payload)
    }
    setSaving(false)
    if (result.error) { setError(result.error.message); return }
    // Sync stats when a trip is first saved as completed
    const wasAlreadyCompleted = modal !== 'create' && modal.status === 'completed'
    if (payload.status === 'completed' && !wasAlreadyCompleted) {
      await syncCompletedStats(payload)
    }
    setModal(null)
    refresh()
  }

  async function deleteTrip(id) {
    if (!window.confirm('Cancel this trip? This cannot be undone.')) return
    await db.trips.delete(id)
    setSelected(null)
    refresh()
  }

  async function saveAssign(tripId, driverName, vehicleId) {
    await db.trips.update(tripId, {
      driver: driverName || null,
      vehicle: vehicleId || null,
      status: driverName ? 'confirmed' : 'pending',
    })
    setAssign(null)
    refresh()
  }

  // When a trip reaches 'completed', increment patient + driver lifetime stats
  async function syncCompletedStats(trip) {
    const patient = patients.find(p => p.name === trip.patient)
    if (patient) {
      await db.patients.update(patient.id, {
        total_trips: (patient.totalTrips || 0) + 1,
        last_trip:   trip.date,
      })
    }
    const driver = drivers.find(d => d.name === trip.driver)
    if (driver) {
      await db.drivers.update(driver.id, { trips: (driver.trips || 0) + 1 })
    }
  }

  async function quickStatus(trip, status) {
    await db.trips.update(trip.id, { status })
    if (status === 'completed') await syncCompletedStats(trip)
    refresh()
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Trips</h1>
          <p className={styles.sub}>
            {filtered.length} trips · {trips.filter(t => t.status === 'pending' && !t.driver).length} unassigned
          </p>
        </div>
        <button className={styles.addBtn} onClick={() => { setError(''); setModal('create') }}>
          <Plus size={16}/> New Trip
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon}/>
          <input
            className={styles.searchInput}
            placeholder="Search by patient, trip ID, or address…"
            value={search}
            onChange={e => { setSearch(e.target.value); resetPage() }}
          />
        </div>
        <div className={styles.filterRow}>
          <select className={styles.select} value={dateFilter}      onChange={e => { setDateFilter(e.target.value); resetPage() }}>
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
          </select>
          <select className={styles.select} value={statusFilter}    onChange={e => { setStatusFilter(e.target.value); resetPage() }}>
            {STATUS_OPTS.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select className={styles.select} value={transportFilter} onChange={e => { setTransportFilter(e.target.value); resetPage() }}>
            {TRANSPORT_OPTS.map(t => <option key={t} value={t}>{t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {/* Status pills */}
      <div className={styles.statusPills}>
        {STATUS_OPTS.map(s => {
          const count = s === 'all' ? trips.length : trips.filter(t => t.status === s).length
          return (
            <button
              key={s}
              className={`${styles.pill} ${statusFilter === s ? styles.pillActive : ''}`}
              onClick={() => { setStatusFilter(s); resetPage() }}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              <span className={styles.pillCount}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Empty state */}
      {!loading && trips.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No trips yet</p>
          <p className={styles.emptySub}>Schedule your first trip to get started.</p>
          <button className={styles.addBtn} onClick={() => setModal('create')}>
            <Plus size={15}/> New Trip
          </button>
        </div>
      )}

      {/* Table */}
      {trips.length > 0 && (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Trip ID</th><th>Patient</th><th>Date & Time</th><th>Route</th>
                  <th>Type</th><th>Driver / Vehicle</th><th>Insurance</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>Loading…</td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '14px' }}>No trips match your filters.</td></tr>
                )}
                {paginated.map(trip => (
                  <tr
                    key={trip.id}
                    className={`${styles.row} ${selected === trip.id ? styles.rowSelected : ''}`}
                    onClick={() => setSelected(selected === trip.id ? null : trip.id)}
                  >
                    <td className={styles.tripId}>{trip.id}</td>
                    <td>
                      <p className={styles.patientName}>{trip.patient}</p>
                      <p className={styles.patientPhone}>{trip.phone}</p>
                    </td>
                    <td>
                      <p className={styles.date}>{trip.date}</p>
                      <p className={styles.time}>{trip.time}{trip.return_time ? ` → ${trip.return_time}` : ''}</p>
                    </td>
                    <td className={styles.route}>
                      <p className={styles.routeFrom}><MapPin size={11}/> {trip.pickup?.split(',')[0]}</p>
                      <p className={styles.routeTo}>→ {trip.destination?.split(',')[0]}</p>
                    </td>
                    <td>
                      <span className={styles.transportBadge}>{transportIcon[trip.transport]} {trip.transport}</span>
                    </td>
                    <td>
                      {trip.driver
                        ? <><p className={styles.driverName}>{trip.driver}</p><p className={styles.vehicleId}>{trip.vehicle}</p></>
                        : <span className={styles.unassigned}>⚠ Unassigned</span>
                      }
                    </td>
                    <td className={styles.insurance}>{trip.insurance}</td>
                    <td>
                      <span className={styles.status} style={{ color: statusColor[trip.status], background: statusBg[trip.status] }}>
                        {trip.status}
                      </span>
                    </td>
                    <td className={styles.actions} onClick={e => e.stopPropagation()}>
                      <button className={styles.actionBtn} title="View"   onClick={() => setSelected(selected === trip.id ? null : trip.id)}><Eye size={15}/></button>
                      <button className={styles.actionBtn} title="Edit"   onClick={() => { setError(''); setModal(trip) }}><Edit size={15}/></button>
                      <button className={`${styles.actionBtn} ${styles.actionDanger}`} title="Delete" onClick={() => deleteTrip(trip.id)}><Trash2 size={15}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button className={styles.pageBtn} disabled={page === 1}          onClick={() => setPage(p => p - 1)}><ChevronLeft size={15}/> Prev</button>
              <span className={styles.pageInfo}>Page {page} of {totalPages} · {filtered.length} trips</span>
              <button className={styles.pageBtn} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next <ChevronRight size={15}/></button>
            </div>
          )}
        </>
      )}

      {/* Detail panel */}
      {selTrip && (
        <div className={styles.detailPanel}>
          <div className={styles.detailHeader}>
            <h3>{selTrip.id} — {selTrip.patient}</h3>
            <button className={styles.detailClose} onClick={() => setSelected(null)}>✕</button>
          </div>
          <div className={styles.detailGrid}>
            <Detail label="Pickup"      value={selTrip.pickup}/>
            <Detail label="Destination" value={selTrip.destination}/>
            <Detail label="Date"        value={selTrip.date}/>
            <Detail label="Pickup Time" value={selTrip.time || '—'}/>
            <Detail label="Return Time" value={selTrip.return_time || 'One-way'}/>
            <Detail label="Trip Type"   value={selTrip.type}/>
            <Detail label="Transport"   value={selTrip.transport}/>
            <Detail label="Driver"      value={selTrip.driver || 'Unassigned'}/>
            <Detail label="Vehicle"     value={selTrip.vehicle || '—'}/>
            <Detail label="Insurance"   value={selTrip.insurance}/>
            <Detail label="DOB"         value={selTrip.dob || '—'}/>
            <Detail label="Phone"       value={selTrip.phone || '—'}/>
          </div>
          {selTrip.notes && (
            <div className={styles.detailNotes}>
              <span className={styles.detailNotesLabel}>Notes: </span>{selTrip.notes}
            </div>
          )}

          {/* Quick status change */}
          <div className={styles.quickStatus}>
            <span className={styles.quickStatusLabel}>Quick status:</span>
            {['pending', 'confirmed', 'in-transit', 'completed', 'no-show', 'cancelled'].map(s => (
              <button
                key={s}
                className={`${styles.quickBtn} ${selTrip.status === s ? styles.quickBtnActive : ''}`}
                style={selTrip.status === s ? { color: statusColor[s], background: statusBg[s], borderColor: statusColor[s] } : {}}
                onClick={() => quickStatus(selTrip, s)}
              >
                {s}
              </button>
            ))}
          </div>

          <div className={styles.detailActions}>
            <button className={styles.detailBtn}        onClick={() => setAssign(selTrip)}>Assign Driver</button>
            <button className={styles.detailBtn}        onClick={() => { setError(''); setModal(selTrip) }}>Edit Trip</button>
            <button className={styles.detailBtnDanger}  onClick={() => deleteTrip(selTrip.id)}>Cancel Trip</button>
          </div>
        </div>
      )}

      {/* Create/Edit modal */}
      {modal && (
        <TripModal
          trip={modal === 'create' ? EMPTY : modal}
          isNew={modal === 'create'}
          drivers={drivers}
          vehicles={vehicles}
          patients={patients}
          allTrips={trips}
          saving={saving}
          error={error}
          onSave={saveTrip}
          onClose={() => { setModal(null); setError('') }}
        />
      )}

      {/* Assign modal */}
      {assign && (
        <AssignModal
          trip={assign}
          drivers={drivers.filter(d => d.status === 'on-duty')}
          vehicles={vehicles.filter(v => v.status === 'available' || v.id === assign.vehicle)}
          onSave={saveAssign}
          onClose={() => setAssign(null)}
        />
      )}
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div className={styles.detailItem}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
    </div>
  )
}

// ── Trip Modal ────────────────────────────────────────────────────────────────
function TripModal({ trip, isNew, drivers, vehicles, patients, allTrips, saving, error, onSave, onClose }) {
  const [form, setForm] = useState({ ...trip })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const patientNames   = patients.map(p => p.name)
  const uniquePickups  = [...new Set(allTrips.map(t => t.pickup).filter(Boolean))]
  const uniqueDests    = [...new Set(allTrips.map(t => t.destination).filter(Boolean))]

  // When a patient is selected from the dropdown, auto-fill their info
  function selectPatient(patientId) {
    if (!patientId) { set('patient', ''); return }
    const p = patients.find(p => p.id === patientId)
    if (!p) return
    setForm(f => ({
      ...f,
      patient:   p.name,
      dob:       p.dob       || f.dob,
      phone:     p.phone     || f.phone,
      insurance: p.insurance || f.insurance,
      transport: p.transport || f.transport,
    }))
  }

  // Find the currently matching patient for the pre-selected indicator
  const matchedPatient = patients.find(p => p.name === form.patient)

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <div style={mHead}>
          <h2 style={mTitle}>{isNew ? 'New Trip' : 'Edit Trip'}</h2>
          <button style={mClose} onClick={onClose}><X size={18}/></button>
        </div>
        <form style={mBody} onSubmit={e => { e.preventDefault(); onSave(form) }}>

          {/* Patient selection */}
          {patients.length > 0 && (
            <F label="Select Existing Patient">
              <select
                style={inp}
                value={matchedPatient?.id || ''}
                onChange={e => selectPatient(e.target.value)}
              >
                <option value="">— New / manual entry —</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} · {p.insurance} · {p.transport}</option>
                ))}
              </select>
            </F>
          )}

          <Row2>
            <F label="Patient Name *">
              <Typeahead style={inp} required value={form.patient} onChange={v => set('patient', v)} suggestions={patientNames} placeholder="Patient full name"/>
            </F>
            <F label="Phone">
              <input style={inp} value={form.phone || ''} onChange={e => set('phone', e.target.value)}/>
            </F>
          </Row2>

          <Row2>
            <F label="Date of Birth">
              <input style={inp} type="date" value={form.dob || ''} onChange={e => set('dob', e.target.value)}/>
            </F>
            <F label="Insurance">
              <select style={inp} value={form.insurance} onChange={e => set('insurance', e.target.value)}>
                {INSURANCE_LIST.map(i => <option key={i}>{i}</option>)}
              </select>
            </F>
          </Row2>

          <F label="Pickup Address *">
            <Typeahead style={inp} required value={form.pickup} onChange={v => set('pickup', v)} suggestions={uniquePickups} placeholder="123 Main St, Tampa, FL"/>
          </F>
          <F label="Destination *">
            <Typeahead style={inp} required value={form.destination} onChange={v => set('destination', v)} suggestions={uniqueDests} placeholder="Tampa General Hospital, 1 Tampa General Cir"/>
          </F>

          <Row2>
            <F label="Date *">
              <input style={inp} type="date" required value={form.date} onChange={e => set('date', e.target.value)}/>
            </F>
            <F label="Pickup Time">
              <input style={inp} type="time" value={form.time || ''} onChange={e => set('time', e.target.value)}/>
            </F>
          </Row2>

          <Row2>
            <F label="Trip Type">
              <select style={inp} value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="oneway">One Way</option>
                <option value="roundtrip">Round Trip</option>
                <option value="recurring">Recurring</option>
              </select>
            </F>
            {form.type !== 'oneway' && (
              <F label="Return Time">
                <input style={inp} type="time" value={form.return_time || ''} onChange={e => set('return_time', e.target.value)}/>
              </F>
            )}
          </Row2>

          <Row2>
            <F label="Transport">
              <select style={inp} value={form.transport} onChange={e => set('transport', e.target.value)}>
                {['ambulatory', 'wheelchair', 'stretcher', 'bariatric'].map(t => <option key={t}>{t}</option>)}
              </select>
            </F>
            <F label="Status">
              <select style={inp} value={form.status} onChange={e => set('status', e.target.value)}>
                {['pending', 'confirmed', 'in-transit', 'completed', 'no-show', 'cancelled'].map(s => <option key={s}>{s}</option>)}
              </select>
            </F>
          </Row2>

          <Row2>
            <F label="Driver">
              <select style={inp} value={form.driver || ''} onChange={e => set('driver', e.target.value)}>
                <option value="">— Unassigned —</option>
                {drivers.map(d => <option key={d.id} value={d.name}>{d.name} ({d.status})</option>)}
              </select>
            </F>
            <F label="Vehicle">
              <select style={inp} value={form.vehicle || ''} onChange={e => set('vehicle', e.target.value)}>
                <option value="">— None —</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.id} — {v.make} ({v.type})</option>)}
              </select>
            </F>
          </Row2>

          <Row2>
            <F label="Mileage">
              <input style={inp} type="number" min="0" step="0.1" placeholder="0.0" value={form.mileage || ''} onChange={e => set('mileage', e.target.value)}/>
            </F>
            <F label="Notes">
              <textarea style={{ ...inp, height: '72px', resize: 'vertical' }} value={form.notes || ''} onChange={e => set('notes', e.target.value)}/>
            </F>
          </Row2>

          {error && <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>{error}</p>}

          <div style={mFoot}>
            <button type="button" style={btnSec} onClick={onClose}>Cancel</button>
            <button type="submit" style={btnPri} disabled={saving}>{saving ? 'Saving…' : 'Save Trip'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Assign Modal ──────────────────────────────────────────────────────────────
function AssignModal({ trip, drivers, vehicles, onSave, onClose }) {
  const [driver, setDriver]   = useState(trip.driver  || '')
  const [vehicle, setVehicle] = useState(trip.vehicle || '')
  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...box, maxWidth: '420px' }}>
        <div style={mHead}>
          <h2 style={mTitle}>Assign Driver & Vehicle</h2>
          <button style={mClose} onClick={onClose}><X size={18}/></button>
        </div>
        <div style={mBody}>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
            {trip.id} — {trip.patient} · {trip.date} {trip.time}
          </p>
          <F label="Driver">
            <select style={inp} value={driver} onChange={e => setDriver(e.target.value)}>
              <option value="">— Unassigned —</option>
              {drivers.map(d => <option key={d.id} value={d.name}>{d.name} · {d.vehicle || 'no vehicle'}</option>)}
            </select>
          </F>
          <F label="Vehicle">
            <select style={inp} value={vehicle} onChange={e => setVehicle(e.target.value)}>
              <option value="">— None —</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.id} — {v.make} ({v.type})</option>)}
            </select>
          </F>
          {drivers.length === 0 && (
            <p style={{ fontSize: '12px', color: '#d97706', background: '#fef3c7', padding: '8px 10px', borderRadius: '6px' }}>
              No drivers are currently on duty.
            </p>
          )}
          <div style={mFoot}>
            <button style={btnSec} onClick={onClose}>Cancel</button>
            <button style={btnPri} onClick={() => onSave(trip.id, driver, vehicle)}>Assign</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Shared modal styles ───────────────────────────────────────────────────────
const overlay = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }
const box     = { background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column' }
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
