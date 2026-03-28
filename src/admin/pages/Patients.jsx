import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Plus, Phone, Mail, AlertTriangle, Flag, X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { usePatients, db } from '../../lib/useData'
import Typeahead from '../../components/Typeahead'
import styles from './Patients.module.css'

const COMMON_CONDITIONS = [
  'Diabetes', 'Type 2 Diabetes', 'Hypertension', 'COPD', 'Heart Disease',
  'Congestive Heart Failure', 'Chronic Kidney Disease', 'End-Stage Renal Disease',
  'Dialysis', 'Cancer', 'Stroke', 'Dementia', 'Alzheimer\'s Disease',
  'Parkinson\'s Disease', 'Multiple Sclerosis', 'Obesity', 'Asthma',
  'Arthritis', 'Osteoporosis', 'Peripheral Neuropathy', 'Depression', 'Anxiety',
  'Schizophrenia', 'Epilepsy', 'HIV/AIDS', 'Sickle Cell Disease',
  'Spinal Cord Injury', 'Traumatic Brain Injury', 'Hip Replacement', 'Amputation',
]

const STATUS_OPTS   = ['all', 'active', 'inactive', 'flagged']
const TRANSPORT_OPTS = ['all', 'ambulatory', 'wheelchair', 'stretcher', 'bariatric']
const INSURANCE_LIST = ['Medicaid', 'Medicare', 'BlueCross', 'Humana', 'Aetna', 'UnitedHealth', 'Cigna', 'Self-Pay']
const transportIcon  = { ambulatory: '🚶', wheelchair: '♿', stretcher: '🛏', bariatric: '⚕️' }

const PER_PAGE = 10

const EMPTY = {
  name: '', dob: '', phone: '', email: '', address: '',
  insurance: 'Medicaid', member_id: '', transport: 'wheelchair',
  conditions: '', notes: '', status: 'active',
}

export default function Patients() {
  const { patients, loading, refresh } = usePatients()
  const location  = useLocation()
  const navigate  = useNavigate()
  const consumed  = useRef(false)

  const [search, setSearch]         = useState('')
  const [statusFilter, setStatusFilter]     = useState('all')
  const [transportFilter, setTransportFilter] = useState('all')
  const [selected, setSelected]     = useState(null)
  const [modal, setModal]           = useState(null)   // null | 'create' | patient obj
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')
  const [page, setPage]             = useState(1)

  const filtered = patients.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !search ||
      p.name.toLowerCase().includes(q) ||
      p.id?.toLowerCase().includes(q) ||
      p.insurance?.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      p.memberId?.toLowerCase().includes(q)
    return matchSearch
      && (statusFilter    === 'all' || p.status    === statusFilter)
      && (transportFilter === 'all' || p.transport === transportFilter)
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const sel        = patients.find(p => p.id === selected)

  // Auto-select record when navigated here from universal search
  useEffect(() => {
    if (loading || consumed.current) return
    const { selectId } = location.state || {}
    if (!selectId) return
    setSelected(selectId)
    consumed.current = true
    navigate(location.pathname, { replace: true, state: null })
  }, [loading]) // eslint-disable-line react-hooks/exhaustive-deps

  function resetPage() { setPage(1) }

  async function savePatient(form) {
    setSaving(true)
    setError('')
    const payload = {
      name:       form.name,
      dob:        form.dob        || null,
      phone:      form.phone      || null,
      email:      form.email      || null,
      address:    form.address    || null,
      insurance:  form.insurance,
      member_id:  form.member_id  || null,
      transport:  form.transport,
      conditions: form.conditions
        ? form.conditions.split(',').map(s => s.trim()).filter(Boolean)
        : [],
      notes:  form.notes  || null,
      status: form.status,
    }
    let result
    if (modal === 'create') {
      const nums = patients.map(p => parseInt(p.id.replace(/[^\d]/g, ''))).filter(n => !isNaN(n) && n > 0)
      payload.id          = `P-${(nums.length ? Math.max(...nums) : 100) + 1}`
      payload.total_trips = 0
      result = await db.patients.create(payload)
    } else {
      result = await db.patients.update(modal.id, payload)
    }
    setSaving(false)
    if (result.error) { setError(result.error.message); return }
    setModal(null)
    refresh()
  }

  async function toggleFlag(patient) {
    const next = patient.status === 'flagged' ? 'active' : 'flagged'
    await db.patients.update(patient.id, { status: next })
    refresh()
  }

  async function setInactive(patient) {
    const next = patient.status === 'inactive' ? 'active' : 'inactive'
    await db.patients.update(patient.id, { status: next })
    refresh()
  }

  async function deletePatient(patient) {
    if (!window.confirm(`Remove ${patient.name} from the system? This cannot be undone.`)) return
    await db.patients.delete(patient.id)
    setSelected(null)
    refresh()
  }

  function toFormData(p) {
    return {
      ...p,
      member_id:  p.memberId  || p.member_id  || '',
      conditions: (p.conditions || []).join(', '),
    }
  }

  function statusClass(status) {
    if (status === 'flagged')  return styles.statusFlagged
    if (status === 'inactive') return styles.statusInactive
    return styles.statusActive
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Patients</h1>
          <p className={styles.sub}>
            {patients.length} total ·{' '}
            {patients.filter(p => p.status === 'active').length} active ·{' '}
            {patients.filter(p => p.status === 'flagged').length} flagged
          </p>
        </div>
        <button className={styles.addBtn} onClick={() => { setError(''); setModal('create') }}>
          <Plus size={16}/> Add Patient
        </button>
      </div>

      {/* Search + filters */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon}/>
          <input
            className={styles.searchInput}
            placeholder="Search by name, ID, phone, or insurance…"
            value={search}
            onChange={e => { setSearch(e.target.value); resetPage() }}
          />
        </div>
        <div className={styles.filterRow}>
          <select
            className={styles.select}
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); resetPage() }}
          >
            {STATUS_OPTS.map(s => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <select
            className={styles.select}
            value={transportFilter}
            onChange={e => { setTransportFilter(e.target.value); resetPage() }}
          >
            {TRANSPORT_OPTS.map(t => (
              <option key={t} value={t}>
                {t === 'all' ? 'All Transport' : t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty state */}
      {!loading && patients.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No patients yet</p>
          <p className={styles.emptySub}>Add your first patient to get started.</p>
          <button className={styles.addBtn} onClick={() => setModal('create')}>
            <Plus size={15}/> Add Patient
          </button>
        </div>
      )}

      {!loading && patients.length > 0 && (
        <div className={styles.layout}>
          <div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Patient</th><th>DOB</th><th>Transport</th>
                    <th>Insurance</th><th>Conditions</th>
                    <th>Trips</th><th>Last Trip</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>Loading…</td></tr>
                  )}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '14px' }}>No patients match your search or filter.</td></tr>
                  )}
                  {paginated.map(p => (
                    <tr
                      key={p.id}
                      className={`${styles.row} ${selected === p.id ? styles.rowSelected : ''}`}
                      onClick={() => setSelected(selected === p.id ? null : p.id)}
                    >
                      <td>
                        <p className={styles.patientName}>{p.name}</p>
                        <p className={styles.patientId}>{p.id}</p>
                      </td>
                      <td className={styles.cell}>{p.dob || '—'}</td>
                      <td>
                        <span className={styles.transportBadge}>
                          {transportIcon[p.transport]} {p.transport}
                        </span>
                      </td>
                      <td>
                        <p className={styles.cell}>{p.insurance}</p>
                        <p className={styles.memberId}>{p.memberId}</p>
                      </td>
                      <td>
                        <div className={styles.conditions}>
                          {(p.conditions || []).map((c, i) => (
                            <span key={i} className={styles.condition}>{c}</span>
                          ))}
                        </div>
                      </td>
                      <td className={styles.cell}>{p.totalTrips ?? 0}</td>
                      <td className={styles.cell}>{p.lastTrip || '—'}</td>
                      <td>
                        <span className={`${styles.status} ${statusClass(p.status)}`}>
                          {p.status === 'flagged' && <Flag size={10}/>} {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft size={15}/> Prev
                </button>
                <span className={styles.pageInfo}>{page} / {totalPages} · {filtered.length} patients</span>
                <button
                  className={styles.pageBtn}
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next <ChevronRight size={15}/>
                </button>
              </div>
            )}
          </div>

          {/* Detail panel */}
          {sel && (
            <div className={styles.detail}>
              <div className={styles.detailHeader}>
                <div>
                  <h2 className={styles.detailName}>{sel.name}</h2>
                  <p className={styles.detailId}>{sel.id}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {sel.status === 'flagged' && (
                    <span className={styles.flagBadge}><AlertTriangle size={13}/> Flagged</span>
                  )}
                  <button className={styles.closeBtn} onClick={() => setSelected(null)}><X size={16}/></button>
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3 className={styles.sectionTitle}>Contact</h3>
                {sel.phone && <a href={`tel:${sel.phone}`} className={styles.contactRow}><Phone size={13}/>{sel.phone}</a>}
                {sel.email && <a href={`mailto:${sel.email}`} className={styles.contactRow}><Mail size={13}/>{sel.email}</a>}
                {sel.address && <p className={styles.address}>{sel.address}</p>}
                {!sel.phone && !sel.email && !sel.address && (
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>No contact info on file.</p>
                )}
              </div>

              <div className={styles.detailSection}>
                <h3 className={styles.sectionTitle}>Insurance</h3>
                <DRow label="Provider"  value={sel.insurance}/>
                <DRow label="Member ID" value={sel.memberId || '—'}/>
              </div>

              <div className={styles.detailSection}>
                <h3 className={styles.sectionTitle}>Medical</h3>
                <DRow label="DOB"             value={sel.dob || '—'}/>
                <DRow label="Transport Level" value={`${transportIcon[sel.transport]} ${sel.transport}`}/>
                <div className={styles.conditionsWrap}>
                  {(sel.conditions || []).length === 0
                    ? <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>No conditions on file</span>
                    : (sel.conditions || []).map((c, i) => <span key={i} className={styles.condition}>{c}</span>)
                  }
                </div>
              </div>

              {sel.notes && (
                <div className={styles.notes}><span className={styles.notesLabel}>Notes: </span>{sel.notes}</div>
              )}

              <div className={styles.detailSection}>
                <h3 className={styles.sectionTitle}>History</h3>
                <DRow label="Total Trips" value={sel.totalTrips ?? 0}/>
                <DRow label="Last Trip"   value={sel.lastTrip || '—'}/>
                <DRow label="Status"      value={sel.status}/>
              </div>

              <div className={styles.detailActions}>
                <button className={styles.btn} onClick={() => { setError(''); setModal(toFormData(sel)) }}>
                  Edit Patient
                </button>
                {sel.status === 'flagged'
                  ? <button className={styles.btnSuccess} onClick={() => toggleFlag(sel)}>Clear Flag</button>
                  : <button className={styles.btnWarn}    onClick={() => toggleFlag(sel)}>Flag Patient</button>
                }
                {sel.status === 'inactive'
                  ? <button className={styles.btn} onClick={() => setInactive(sel)}>Reactivate</button>
                  : <button className={styles.btn} onClick={() => setInactive(sel)}>Mark Inactive</button>
                }
                <button className={styles.btnDelete} onClick={() => deletePatient(sel)}>
                  <Trash2 size={14}/> Remove Patient
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {modal && (
        <PatientModal
          patient={modal === 'create' ? EMPTY : modal}
          isNew={modal === 'create'}
          patients={patients}
          saving={saving}
          error={error}
          onSave={savePatient}
          onClose={() => { setModal(null); setError('') }}
        />
      )}
    </div>
  )
}

function DRow({ label, value }) {
  return (
    <div className={styles.row2}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{value}</span>
    </div>
  )
}

function PatientModal({ patient, isNew, patients, saving, error, onSave, onClose }) {
  const [form, setForm] = useState({ ...patient })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const conditionSuggestions = [
    ...new Set([
      ...COMMON_CONDITIONS,
      ...patients.flatMap(p => p.conditions || []),
    ])
  ]

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        <div style={mHead}>
          <h2 style={mTitle}>{isNew ? 'Add Patient' : 'Edit Patient'}</h2>
          <button style={mClose} onClick={onClose}><X size={18}/></button>
        </div>
        <form style={mBody} onSubmit={e => { e.preventDefault(); onSave(form) }}>
          <Row2>
            <F label="Full Name *">
              <input style={inp} required value={form.name} onChange={e => set('name', e.target.value)}/>
            </F>
            <F label="Date of Birth">
              <input style={inp} type="date" value={form.dob || ''} onChange={e => set('dob', e.target.value)}/>
            </F>
          </Row2>

          <Row2>
            <F label="Phone">
              <input style={inp} value={form.phone || ''} onChange={e => set('phone', e.target.value)}/>
            </F>
            <F label="Email">
              <input style={inp} type="email" value={form.email || ''} onChange={e => set('email', e.target.value)}/>
            </F>
          </Row2>

          <F label="Address">
            <input style={inp} value={form.address || ''} onChange={e => set('address', e.target.value)}/>
          </F>

          <Row2>
            <F label="Insurance">
              <select style={inp} value={form.insurance} onChange={e => set('insurance', e.target.value)}>
                {INSURANCE_LIST.map(i => <option key={i}>{i}</option>)}
              </select>
            </F>
            <F label="Member ID">
              <input style={inp} value={form.member_id || ''} onChange={e => set('member_id', e.target.value)}/>
            </F>
          </Row2>

          <Row2>
            <F label="Transport Level">
              <select style={inp} value={form.transport} onChange={e => set('transport', e.target.value)}>
                {['ambulatory', 'wheelchair', 'stretcher', 'bariatric'].map(t => <option key={t}>{t}</option>)}
              </select>
            </F>
            <F label="Status">
              <select style={inp} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="flagged">Flagged</option>
              </select>
            </F>
          </Row2>

          <F label="Conditions (comma-separated)">
            <Typeahead style={inp} tokenize value={form.conditions || ''} onChange={v => set('conditions', v)} suggestions={conditionSuggestions} placeholder="Diabetes, Hypertension…"/>
          </F>

          <F label="Notes">
            <textarea style={{ ...inp, height: '72px', resize: 'vertical' }} value={form.notes || ''} onChange={e => set('notes', e.target.value)}/>
          </F>

          {error && <p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>{error}</p>}

          <div style={mFoot}>
            <button type="button" style={btnSec} onClick={onClose}>Cancel</button>
            <button type="submit" style={btnPri} disabled={saving}>{saving ? 'Saving…' : 'Save Patient'}</button>
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
