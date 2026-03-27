import { useState } from 'react'
import { Phone, MapPin, Clock, AlertTriangle, User, Car, Navigation, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTrips, useDrivers, useVehicles, usePatients, db } from '../../lib/useData'
import styles from './Dispatch.module.css'

const statusColor = { confirmed: '#1e6fa8', 'in-transit': '#d97706', pending: '#7c3aed', completed: '#16a34a', 'no-show': '#ef4444', cancelled: '#94a3b8' }
const statusBg    = { confirmed: '#dbeeff',  'in-transit': '#fef3c7', pending: '#ede9fe', completed: '#d1fae5', 'no-show': '#fee2e2', cancelled: '#f1f5f9' }

function fmtDate(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function addDays(iso, n) {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export default function Dispatch() {
  const { trips, refresh } = useTrips()
  const { drivers }        = useDrivers()
  const { vehicles }       = useVehicles()
  const { patients }       = usePatients()
  const [assign, setAssign]   = useState(null)
  const [viewDate, setViewDate] = useState(new Date().toISOString().slice(0, 10))

  const today          = new Date().toISOString().slice(0, 10)
  const isToday        = viewDate === today

  // ── Derived data ─────────────────────────────────────────────
  const dayTrips        = trips.filter(t => t.date === viewDate)
  const inTransit       = trips.filter(t => t.status === 'in-transit')
  const onDutyDrivers   = drivers.filter(d => d.status === 'on-duty')
  const availableVehicles = vehicles.filter(v => v.status === 'available')

  // Only show upcoming unassigned trips (pending or confirmed, no driver)
  const needsAssignment = trips.filter(t =>
    !t.driver && ['pending', 'confirmed'].includes(t.status) && t.date >= today
  )

  async function handleAssign(tripId, driverName, vehicleId) {
    await db.trips.update(tripId, {
      driver:  driverName || null,
      vehicle: vehicleId  || null,
      status:  driverName ? 'confirmed' : 'pending',
    })
    setAssign(null)
    refresh()
  }

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
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Live Dispatch Board</h1>
          <p className={styles.sub}>{fmtDate(viewDate)} · Real-time overview</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.liveIndicator}><span className={styles.liveDot}/> Live</span>
          <a href="tel:+19782250802" className={styles.callBtn}><Phone size={15}/> Call Dispatch</a>
        </div>
      </div>

      {/* Date navigation */}
      <div className={styles.dateNav}>
        <button className={styles.dateNavBtn} onClick={() => setViewDate(d => addDays(d, -1))}>
          <ChevronLeft size={16}/>
        </button>
        <div className={styles.dateNavCenter}>
          <span className={styles.dateNavLabel}>{fmtDate(viewDate)}</span>
          {!isToday && (
            <button className={styles.todayBtn} onClick={() => setViewDate(today)}>Back to Today</button>
          )}
        </div>
        <button className={styles.dateNavBtn} onClick={() => setViewDate(d => addDays(d, 1))}>
          <ChevronRight size={16}/>
        </button>
      </div>

      {/* Live summary */}
      <div className={styles.liveSummary}>
        {[
          { label: "Day's Trips",       value: dayTrips.length,           color: '#1e6fa8', bg: '#dbeeff' },
          { label: 'In Transit Now',    value: inTransit.length,          color: '#d97706', bg: '#fef3c7' },
          { label: 'Need Assignment',   value: needsAssignment.length,    color: '#ef4444', bg: '#fee2e2' },
          { label: 'Drivers On Duty',   value: onDutyDrivers.length,      color: '#16a34a', bg: '#d1fae5' },
          { label: 'Available Vehicles',value: availableVehicles.length,  color: '#7c3aed', bg: '#ede9fe' },
        ].map((s, i) => (
          <div key={i} className={styles.liveStat}>
            <div className={styles.liveStatVal} style={{ color: s.color }}>{s.value}</div>
            <div className={styles.liveStatLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Live Map Panel */}
      <div className={styles.mapPanel}>
        <div className={styles.mapHeader}>
          <div className={styles.mapTitle}>
            <Navigation size={15} color="#1e6fa8"/>
            <span>Live Fleet Map</span>
            <span className={styles.liveIndicator}><span className={styles.liveDot}/>Live</span>
          </div>
          <span className={styles.mapboxNote}>
            <span className={styles.mapboxBadge}>Mapbox GL JS · Ready to integrate</span>
          </span>
        </div>
        <div className={styles.mapPlaceholder}>
          <svg viewBox="0 0 900 280" className={styles.mapSvg} aria-hidden="true">
            <defs>
              <radialGradient id="dMapGrad" cx="50%" cy="50%" r="70%">
                <stop offset="0%"   stopColor="#e8f4fd"/>
                <stop offset="100%" stopColor="#c8dff0"/>
              </radialGradient>
              <filter id="dGlow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <rect width="900" height="280" fill="url(#dMapGrad)"/>
            {[40,80,120,160,200,240].map(y => <line key={`h${y}`} x1="0" y1={y} x2="900" y2={y} stroke="#b8d4e8" strokeWidth="0.5" strokeDasharray="4,8"/>)}
            {[60,140,220,300,380,460,540,620,700,780,860].map(x => <line key={`v${x}`} x1={x} y1="0" x2={x} y2="280" stroke="#b8d4e8" strokeWidth="0.5" strokeDasharray="4,8"/>)}
            <path d="M0 140 Q450 120 900 140"   stroke="#a0c4e0" strokeWidth="6"   fill="none" strokeLinecap="round"/>
            <path d="M200 0 L200 280"            stroke="#a0c4e0" strokeWidth="4"   fill="none"/>
            <path d="M600 0 L600 280"            stroke="#a0c4e0" strokeWidth="4"   fill="none"/>
            <path d="M0 60 L900 60"              stroke="#bcd5e8" strokeWidth="2.5" fill="none"/>
            <path d="M0 210 L900 210"            stroke="#bcd5e8" strokeWidth="2.5" fill="none"/>
            <path d="M150 180 Q300 100 420 90"  stroke="#1e6fa8" strokeWidth="2.5" fill="none" strokeDasharray="6,4" opacity="0.7"/>
            <path d="M500 220 Q600 160 700 110" stroke="#d97706" strokeWidth="2.5" fill="none" strokeDasharray="6,4" opacity="0.7"/>
            <path d="M50 100 Q200 130 320 175"  stroke="#16a34a" strokeWidth="2.5" fill="none" strokeDasharray="6,4" opacity="0.7"/>
            {onDutyDrivers.slice(0, 4).map((d, i) => {
              const positions = [{ x: 280, y: 130 }, { x: 580, y: 175 }, { x: 170, y: 145 }, { x: 720, y: 90 }]
              const p = positions[i] || { x: 400, y: 140 }
              const active = trips.find(t => t.driver === d.name && t.status === 'in-transit')
              return (
                <g key={d.id} filter="url(#dGlow)">
                  <circle cx={p.x} cy={p.y} r="20" fill="#1e6fa8" fillOpacity="0.12">
                    <animate attributeName="r"       values="16;24;16" dur={`${2.5 + i * 0.4}s`} repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.3;0;0.3" dur={`${2.5 + i * 0.4}s`} repeatCount="indefinite"/>
                  </circle>
                  <circle cx={p.x} cy={p.y} r="11" fill="#1e6fa8"/>
                  <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="8" fill="white" fontWeight="800" fontFamily="system-ui">▲</text>
                  <rect x={p.x - 36} y={p.y + 13} width="72" height="22" rx="5" fill="white" opacity="0.95"/>
                  <text x={p.x} y={p.y + 22} textAnchor="middle" fontSize="7.5" fill="#0f172a" fontWeight="700" fontFamily="system-ui">{d.photo} · {d.vehicle || '—'}</text>
                  <text x={p.x} y={p.y + 32} textAnchor="middle" fontSize="7"   fill="#1e6fa8" fontWeight="600" fontFamily="system-ui">{active ? 'In Transit' : 'Available'}</text>
                </g>
              )
            })}
            {[{ x: 150, y: 180 }, { x: 500, y: 220 }, { x: 50, y: 100 }].map((p, i) => (
              <g key={i}><circle cx={p.x} cy={p.y} r="7" fill="#22c55e" stroke="white" strokeWidth="2"/><text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="8" fill="white" fontWeight="800">P</text></g>
            ))}
            {[{ x: 420, y: 90 }, { x: 700, y: 110 }].map((d, i) => (
              <g key={i}><circle cx={d.x} cy={d.y} r="7" fill="#ef4444" stroke="white" strokeWidth="2"/><text x={d.x} y={d.y + 4} textAnchor="middle" fontSize="8" fill="white" fontWeight="800">D</text></g>
            ))}
            <rect x="748" y="258" width="148" height="18" rx="3" fill="white" fillOpacity="0.85"/>
            <text x="754" y="270" fontSize="8.5" fill="#64748b" fontFamily="system-ui" fontWeight="600">© Mapbox · To be integrated</text>
          </svg>
          <div className={styles.mapKey}>
            <span className={styles.keyItem}><span className={styles.keyDot} style={{ background: '#1e6fa8' }}/> Driver</span>
            <span className={styles.keyItem}><span className={styles.keyDot} style={{ background: '#22c55e' }}/> Pickup</span>
            <span className={styles.keyItem}><span className={styles.keyDot} style={{ background: '#ef4444' }}/> Destination</span>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className={styles.layout}>
        {/* Left: Trip queue */}
        <div className={styles.tripQueue}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Trip Queue</h2>
            <span className={styles.sectionCount}>{dayTrips.length} trips</span>
          </div>

          {dayTrips.length === 0 && (
            <p style={{ color: '#94a3b8', padding: '24px', textAlign: 'center', fontSize: '14px' }}>
              No trips scheduled for {isToday ? 'today' : fmtDate(viewDate)}.
            </p>
          )}

          <div className={styles.queue}>
            {dayTrips
              .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
              .map(trip => (
                <div key={trip.id} className={`${styles.tripCard} ${!trip.driver ? styles.tripCardAlert : ''}`}>
                  <div className={styles.tripCardTop}>
                    <div className={styles.tripTime}><Clock size={12}/>{trip.time || '—'}</div>
                    <span className={styles.tripStatus} style={{ color: statusColor[trip.status], background: statusBg[trip.status] }}>
                      {trip.status}
                    </span>
                  </div>

                  <p className={styles.tripPatient}>{trip.patient}</p>

                  <div className={styles.tripRoute}>
                    <div className={styles.tripFrom}><MapPin size={11} color="#94a3b8"/> {trip.pickup?.split(',')[0]}</div>
                    <div className={styles.tripArrow}>→</div>
                    <div className={styles.tripTo}>{trip.destination?.split(',')[0]}</div>
                  </div>

                  <div className={styles.tripBottom}>
                    <span className={styles.tripTransport}>
                      {trip.transport === 'wheelchair' ? '♿' : trip.transport === 'stretcher' ? '🛏' : trip.transport === 'bariatric' ? '⚕️' : '🚶'} {trip.transport}
                    </span>
                    {trip.driver
                      ? <span className={styles.tripDriver}><User size={11}/> {trip.driver}</span>
                      : <span className={styles.tripUnassigned}><AlertTriangle size={11}/> Needs driver</span>
                    }
                  </div>

                  {/* Quick status actions */}
                  {['confirmed', 'pending'].includes(trip.status) && trip.driver && (
                    <div className={styles.quickActions}>
                      <button className={styles.quickBtn} style={{ background: '#fef3c7', color: '#d97706' }}
                        onClick={() => quickStatus(trip, 'in-transit')}>▶ In Transit</button>
                      <button className={styles.quickBtn} style={{ background: '#fee2e2', color: '#ef4444' }}
                        onClick={() => quickStatus(trip, 'no-show')}>✕ No Show</button>
                    </div>
                  )}
                  {trip.status === 'in-transit' && (
                    <div className={styles.quickActions}>
                      <button className={styles.quickBtn} style={{ background: '#d1fae5', color: '#16a34a' }}
                        onClick={() => quickStatus(trip, 'completed')}>✓ Complete</button>
                      <button className={styles.quickBtn} style={{ background: '#fee2e2', color: '#ef4444' }}
                        onClick={() => quickStatus(trip, 'no-show')}>✕ No Show</button>
                    </div>
                  )}

                  {!trip.driver && (
                    <button className={styles.assignBtn} onClick={() => setAssign(trip)}>
                      + Assign Driver & Vehicle
                    </button>
                  )}

                  {trip.notes && <p className={styles.tripNotes}>📋 {trip.notes}</p>}
                </div>
              ))}
          </div>
        </div>

        {/* Right: Driver status, vehicles, action required */}
        <div className={styles.rightCol}>
          {/* On-duty drivers */}
          <div className={styles.panel}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Drivers On Duty</h2>
              <span className={styles.sectionCount}>{onDutyDrivers.length}</span>
            </div>
            {onDutyDrivers.length === 0 && (
              <p style={{ fontSize: '13px', color: '#94a3b8', padding: '12px 16px' }}>No drivers on duty.</p>
            )}
            {onDutyDrivers.map(d => {
              const active = trips.find(t => t.driver === d.name && t.status === 'in-transit')
              return (
                <div key={d.id} className={styles.driverCard}>
                  <div className={styles.driverAv} style={{ background: '#1e6fa8' }}>
                    {d.photo || d.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className={styles.driverInfo}>
                    <p className={styles.driverName}>{d.name}</p>
                    <p className={styles.driverVehicle}>{d.vehicle || 'No vehicle'} · {active ? 'On a trip' : 'Available'}</p>
                  </div>
                  <div className={styles.driverBadge} style={{ color: active ? '#d97706' : '#16a34a', background: active ? '#fef3c7' : '#d1fae5' }}>
                    {active ? 'In Transit' : 'Available'}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Available vehicles */}
          <div className={styles.panel}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Available Vehicles</h2>
              <span className={styles.sectionCount}>{availableVehicles.length}</span>
            </div>
            {availableVehicles.length === 0 && (
              <p style={{ fontSize: '13px', color: '#94a3b8', padding: '12px 16px' }}>No vehicles available.</p>
            )}
            {availableVehicles.map(v => (
              <div key={v.id} className={styles.vehicleCard}>
                <div className={styles.vehicleIcon}><Car size={16} color="#1e6fa8"/></div>
                <div className={styles.vehicleInfo}>
                  <p className={styles.vehicleName}>{v.id} — {v.make}</p>
                  <p className={styles.vehicleType}>{v.type} · {v.capacity}</p>
                </div>
                <span className={styles.vehicleStatus}>Ready</span>
              </div>
            ))}
          </div>

          {/* Action required */}
          <div className={styles.alertPanel}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}><AlertTriangle size={14} color="#d97706"/> Action Required</h2>
              <span className={styles.sectionCount}>{needsAssignment.length}</span>
            </div>
            {needsAssignment.length === 0 && (
              <p style={{ color: '#94a3b8', fontSize: '13px', padding: '12px 16px' }}>All upcoming trips are assigned.</p>
            )}
            {needsAssignment.map(t => (
              <div key={t.id} className={styles.alertItem}>
                <div>
                  <p className={styles.alertTrip}>{t.id} — {t.patient}</p>
                  <p className={styles.alertTime}>{t.date} at {t.time || '—'} · {t.transport}</p>
                </div>
                <button className={styles.alertAssignBtn} onClick={() => setAssign(t)}>Assign</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {assign && (
        <AssignModal
          trip={assign}
          drivers={onDutyDrivers}
          vehicles={availableVehicles}
          onSave={handleAssign}
          onClose={() => setAssign(null)}
        />
      )}
    </div>
  )
}

function AssignModal({ trip, drivers, vehicles, onSave, onClose }) {
  const [driver, setDriver]   = useState(trip.driver  || '')
  const [vehicle, setVehicle] = useState(trip.vehicle || '')
  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '420px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Assign Driver & Vehicle</h2>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }} onClick={onClose}><X size={18}/></button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            {trip.id} — {trip.patient} · {trip.date} {trip.time}
          </p>
          <div>
            <label style={lbl}>Driver</label>
            <select style={inp} value={driver} onChange={e => setDriver(e.target.value)}>
              <option value="">— Unassigned —</option>
              {drivers.map(d => <option key={d.id} value={d.name}>{d.name} · {d.vehicle || 'no vehicle'}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Vehicle</label>
            <select style={inp} value={vehicle} onChange={e => setVehicle(e.target.value)}>
              <option value="">— None —</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.id} — {v.make} ({v.type})</option>)}
            </select>
          </div>
          {drivers.length === 0 && (
            <p style={{ fontSize: '12px', color: '#d97706', background: '#fef3c7', padding: '8px 10px', borderRadius: '6px', margin: 0 }}>
              No drivers are currently on duty. Update driver status first.
            </p>
          )}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button style={btnSec} onClick={onClose}>Cancel</button>
            <button style={btnPri} onClick={() => onSave(trip.id, driver, vehicle)}>Assign</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const overlay = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }
const inp = { width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', color: '#0f172a', background: '#fff', boxSizing: 'border-box' }
const lbl = { display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }
const btnPri = { padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#1e6fa8', color: 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', fontWeight: 500 }
const btnSec = { padding: '9px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontFamily: 'inherit', fontSize: '14px', color: '#334155' }
