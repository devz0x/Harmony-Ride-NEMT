import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, User, X } from 'lucide-react'
import { useMyPatient, useMyTrips, db } from '../../lib/useData'
import styles from './MyTrips.module.css'

const TRANSPORT_ICONS = {
  ambulatory: '🚶',
  wheelchair: '♿',
  stretcher:  '🛏',
  bariatric:  '🚐',
}

const STATUS_MAP = {
  pending:     { label: 'Pending',    cls: 'statusPending' },
  confirmed:   { label: 'Confirmed',  cls: 'statusConfirmed' },
  'in-transit':{ label: 'In Transit', cls: 'statusTransit' },
  completed:   { label: 'Completed',  cls: 'statusCompleted' },
  cancelled:   { label: 'Cancelled',  cls: 'statusCancelled' },
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
}

function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12  = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

function isCancellable(trip) {
  const today = new Date().toISOString().slice(0, 10)
  return (trip.status === 'pending' || trip.status === 'confirmed') && trip.date >= today
}

function TripCard({ trip, onCancel }) {
  const today     = new Date().toISOString().slice(0, 10)
  const isPast    = trip.date < today || trip.status === 'completed' || trip.status === 'cancelled'
  const statusInfo = STATUS_MAP[trip.status] || { label: trip.status, cls: 'statusPending' }
  const canCancel  = isCancellable(trip)

  return (
    <div className={`${styles.card} ${isPast ? styles.cardPast : ''}`}>
      <div className={styles.cardHeader}>
        <div className={styles.dateTime}>
          <span className={styles.date}>{formatDate(trip.date)}</span>
          <span className={styles.time}>{formatTime(trip.time)}</span>
        </div>
        <span className={`${styles.badge} ${styles[statusInfo.cls]}`}>
          {statusInfo.label}
        </span>
      </div>

      <div className={styles.route}>
        <div className={styles.routePoint}>
          <MapPin size={14} className={styles.iconPickup} />
          <span>{trip.pickup}</span>
        </div>
        <div className={styles.routeLine} />
        <div className={styles.routePoint}>
          <MapPin size={14} className={styles.iconDest} />
          <span>{trip.destination}</span>
        </div>
      </div>

      <div className={styles.cardMeta}>
        <span className={`${styles.transportBadge} ${styles['t_' + trip.transport]}`}>
          {TRANSPORT_ICONS[trip.transport]} {trip.transport}
        </span>
        <span className={styles.driver}>
          <User size={13} />
          {trip.driver || 'TBD'}
        </span>
        {canCancel && (
          <button
            className={styles.cancelBtn}
            onClick={() => onCancel(trip)}
          >
            <X size={13} /> Cancel
          </button>
        )}
      </div>
    </div>
  )
}

export default function MyTrips() {
  const { patient, loading: patientLoading } = useMyPatient()
  const { trips,   loading: tripsLoading, refresh } = useMyTrips(patient?.name)
  const [filter, setFilter]   = useState('upcoming')
  const [cancelling, setCancelling] = useState(null)

  const today = new Date().toISOString().slice(0, 10)

  const upcomingTrips = trips.filter(t =>
    t.date >= today && t.status !== 'cancelled' && t.status !== 'completed'
  )
  const pastTrips = trips.filter(t =>
    t.date < today || t.status === 'completed' || t.status === 'cancelled'
  )

  let displayTrips = []
  if (filter === 'upcoming') displayTrips = upcomingTrips.slice().sort((a,b) => a.date.localeCompare(b.date))
  else if (filter === 'past') displayTrips = pastTrips
  else displayTrips = trips

  async function handleCancel(trip) {
    if (!window.confirm(`Cancel your trip on ${formatDate(trip.date)}?`)) return
    setCancelling(trip.id)
    await db.trips.update(trip.id, { status: 'cancelled' })
    setCancelling(null)
    refresh()
  }

  if (patientLoading || tripsLoading) {
    return <div className={styles.loading}>Loading your trips…</div>
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>My Trips</h1>
          <p className={styles.sub}>Your complete trip history with Harmony Rides</p>
        </div>
        <Link to="/portal/request" className={styles.requestBtn}>+ Request a Ride</Link>
      </div>

      <div className={styles.filterTabs}>
        {[
          { id: 'upcoming', label: `Upcoming (${upcomingTrips.length})` },
          { id: 'past',     label: `Past (${pastTrips.length})` },
          { id: 'all',      label: `All (${trips.length})` },
        ].map(f => (
          <button
            key={f.id}
            className={`${styles.filterTab} ${filter === f.id ? styles.filterTabActive : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {displayTrips.length === 0 ? (
        <div className={styles.empty}>
          <p>No trips found.</p>
          <Link to="/portal/request" className={styles.emptyLink}>Request your first ride →</Link>
        </div>
      ) : (
        <div className={styles.list}>
          {displayTrips.map(trip => (
            <TripCard
              key={trip.id}
              trip={trip}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}
    </div>
  )
}
