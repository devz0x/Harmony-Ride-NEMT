import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Car, CheckCircle, Clock, Phone, Calendar, ArrowRight } from 'lucide-react'
import { useMyPatient, useMyTrips } from '../../lib/useData'
import styles from './Dashboard.module.css'

const TRANSPORT_ICONS = {
  ambulatory: '🚶',
  wheelchair: '♿',
  stretcher:  '🛏',
  bariatric:  '🚐',
}

const STATUS_CLASS = {
  pending:    'statusPending',
  confirmed:  'statusConfirmed',
  'in-transit': 'statusTransit',
  completed:  'statusCompleted',
  cancelled:  'statusCancelled',
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatTripDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12  = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

function isUpcoming(trip) {
  const today = new Date().toISOString().slice(0, 10)
  return trip.date >= today && trip.status !== 'cancelled' && trip.status !== 'completed'
}

export default function Dashboard() {
  const { patient, loading: patientLoading } = useMyPatient()
  const { trips,   loading: tripsLoading   } = useMyTrips(patient?.name)
  const navigate = useNavigate()

  if (patientLoading) {
    return <div className={styles.loading}>Loading your dashboard…</div>
  }

  if (!patient) {
    return (
      <div className={styles.noPatient}>
        <p>We couldn't find your patient profile. Please contact us at <a href="tel:+19782250802">(978) 225-0802</a>.</p>
      </div>
    )
  }

  const today = new Date().toISOString().slice(0, 10)

  const upcomingTrips  = trips.filter(t => t.date >= today && t.status !== 'cancelled' && t.status !== 'completed')
  const completedTrips = trips.filter(t => t.status === 'completed')

  // Sort upcoming ascending to find the next trip
  const nextTrip = [...upcomingTrips].sort((a, b) => a.date.localeCompare(b.date))[0] || null

  return (
    <div className={styles.page}>
      {/* Welcome Banner */}
      <div className={styles.welcome}>
        <div>
          <h1 className={styles.welcomeTitle}>{getGreeting()}, {patient.name.split(' ')[0]}!</h1>
          <p className={styles.welcomeSub}>Here's an overview of your transportation with Harmony Rides.</p>
        </div>
      </div>

      {/* Next Trip Card */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Next Upcoming Trip</h2>
        {nextTrip ? (
          <div className={styles.nextTripCard}>
            <div className={styles.nextTripHeader}>
              <div className={styles.nextTripDate}>
                <Calendar size={16} />
                {formatTripDate(nextTrip.date)} &nbsp;·&nbsp; {formatTime(nextTrip.time)}
              </div>
              <span className={`${styles.badge} ${styles[STATUS_CLASS[nextTrip.status] || 'statusPending']}`}>
                {nextTrip.status}
              </span>
            </div>
            <div className={styles.nextTripRoute}>
              <div className={styles.routePoint}>
                <MapPin size={16} className={styles.routeIconStart} />
                <span>{nextTrip.pickup}</span>
              </div>
              <ArrowRight size={18} className={styles.routeArrow} />
              <div className={styles.routePoint}>
                <MapPin size={16} className={styles.routeIconEnd} />
                <span>{nextTrip.destination}</span>
              </div>
            </div>
            <div className={styles.nextTripMeta}>
              <span className={styles.metaItem}>
                <span className={styles.transportIcon}>{TRANSPORT_ICONS[nextTrip.transport] || '🚐'}</span>
                {nextTrip.transport}
              </span>
              <span className={styles.metaItem}>
                <Car size={15} />
                {nextTrip.driver || 'Driver will be assigned soon'}
              </span>
            </div>
          </div>
        ) : (
          <div className={styles.noTrip}>
            <p>No upcoming trips — schedule one now!</p>
            <Link to="/portal/request" className={styles.requestBtn}>Request a Ride</Link>
          </div>
        )}
      </section>

      {/* Stats Row */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Your Stats</h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{patient.totalTrips ?? 0}</span>
            <span className={styles.statLabel}>Total Trips</span>
          </div>
          <div className={styles.statCard}>
            <span className={`${styles.statValue} ${styles.statUpcoming}`}>{upcomingTrips.length}</span>
            <span className={styles.statLabel}>Upcoming</span>
          </div>
          <div className={styles.statCard}>
            <span className={`${styles.statValue} ${styles.statCompleted}`}>{completedTrips.length}</span>
            <span className={styles.statLabel}>Completed</span>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionsRow}>
          <Link to="/portal/request" className={`${styles.actionBtn} ${styles.actionGreen}`}>
            <Car size={20} />
            Request a Ride
          </Link>
          <Link to="/portal/trips" className={`${styles.actionBtn} ${styles.actionBlue}`}>
            <CheckCircle size={20} />
            View All Trips
          </Link>
          <a href="tel:+19782250802" className={`${styles.actionBtn} ${styles.actionGray}`}>
            <Phone size={20} />
            Call Dispatch
          </a>
        </div>
      </section>
    </div>
  )
}
