import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { useMyPatient, db } from '../../lib/useData'
import { supabase } from '../../lib/supabase'
import styles from './RequestTrip.module.css'

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

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function RequestTrip() {
  const { patient, loading, refresh: refreshPatient } = useMyPatient()

  // Ride Details
  const [date,       setDate]       = useState('')
  const [time,       setTime]       = useState('')
  const [tripType,   setTripType]   = useState('one-way')
  const [returnTime, setReturnTime] = useState('')

  // Locations
  const [pickup,      setPickup]      = useState('')
  const [destination, setDestination] = useState('')

  // Patient Info (pre-filled)
  const [name,      setName]      = useState('')
  const [phone,     setPhone]     = useState('')

  // Transport & Insurance
  const [transport,  setTransport]  = useState('ambulatory')
  const [insurance,  setInsurance]  = useState('Medicaid')

  // Notes
  const [notes, setNotes] = useState('')

  // UI state
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState(false)

  // Pre-fill from patient record
  useEffect(() => {
    if (patient) {
      setName(patient.name || '')
      setPhone(patient.phone || '')
      setTransport(patient.transport || 'ambulatory')
      setInsurance(patient.insurance || 'Medicaid')
    }
  }, [patient])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const id = 'T' + Date.now().toString(36).toUpperCase().slice(-5)

      const { error: insertError } = await db.trips.create({
        id,
        patient:     name,
        dob:         patient?.dob || null,
        phone,
        pickup,
        destination,
        date,
        time,
        return_time: tripType === 'round-trip' ? returnTime || null : null,
        type:        tripType,
        transport,
        insurance,
        status:      'pending',
        driver:      null,
        vehicle:     null,
        notes:       notes || null,
      })

      if (insertError) { setError(insertError.message); setSubmitting(false); return }

      // Increment total_trips on the patient record
      if (patient?.id) {
        await db.patients.update(patient.id, {
          total_trips: (patient.totalTrips || 0) + 1,
        })
        refreshPatient()
      }

      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Failed to submit trip request.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className={styles.loading}>Loading…</div>
  }

  if (success) {
    return (
      <div className={styles.successPage}>
        <div className={styles.successCard}>
          <CheckCircle size={56} className={styles.successIcon} />
          <h2 className={styles.successTitle}>Ride Request Submitted!</h2>
          <p className={styles.successMsg}>
            Your ride request has been submitted! We'll confirm it shortly.
            You'll receive a call or notification when your driver is assigned.
          </p>
          <Link to="/portal/trips" className={styles.viewTripsBtn}>View My Trips</Link>
          <button
            className={styles.anotherBtn}
            onClick={() => {
              setSuccess(false)
              setDate(''); setTime(''); setPickup(''); setDestination('')
              setTripType('one-way'); setReturnTime(''); setNotes('')
            }}
          >
            Request Another Ride
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Request a Ride</h1>
        <p className={styles.sub}>Fill out the form below and we'll confirm your trip shortly.</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>

        {/* ── Ride Details ─────────────────────────────────────────────────── */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Ride Details</h2>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label}>Trip Date <span className={styles.req}>*</span></label>
              <input
                className={styles.input}
                type="date"
                required
                min={today()}
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Pickup Time <span className={styles.req}>*</span></label>
              <input
                className={styles.input}
                type="time"
                required
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Trip Type <span className={styles.req}>*</span></label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="tripType"
                  value="one-way"
                  checked={tripType === 'one-way'}
                  onChange={() => setTripType('one-way')}
                />
                One-Way
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="tripType"
                  value="round-trip"
                  checked={tripType === 'round-trip'}
                  onChange={() => setTripType('round-trip')}
                />
                Round Trip
              </label>
            </div>
          </div>
          {tripType === 'round-trip' && (
            <div className={styles.field}>
              <label className={styles.label}>Return Time <span className={styles.req}>*</span></label>
              <input
                className={styles.input}
                type="time"
                required
                value={returnTime}
                onChange={e => setReturnTime(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* ── Locations ────────────────────────────────────────────────────── */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Locations</h2>
          <div className={styles.field}>
            <label className={styles.label}>Pickup Address <span className={styles.req}>*</span></label>
            <input
              className={styles.input}
              type="text"
              required
              placeholder="123 Main St, Haverhill, MA"
              value={pickup}
              onChange={e => setPickup(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Destination <span className={styles.req}>*</span></label>
            <input
              className={styles.input}
              type="text"
              required
              placeholder="Mass General Hospital, Boston, MA"
              value={destination}
              onChange={e => setDestination(e.target.value)}
            />
          </div>
        </div>

        {/* ── Patient Info ─────────────────────────────────────────────────── */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Patient Information</h2>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label}>Full Name <span className={styles.req}>*</span></label>
              <input
                className={styles.input}
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Phone Number <span className={styles.req}>*</span></label>
              <input
                className={styles.input}
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Transport & Insurance ─────────────────────────────────────────── */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Transport &amp; Insurance</h2>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label className={styles.label}>Transport Needs <span className={styles.req}>*</span></label>
              <select
                className={styles.input}
                value={transport}
                onChange={e => setTransport(e.target.value)}
                required
              >
                {TRANSPORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Insurance <span className={styles.req}>*</span></label>
              <select
                className={styles.input}
                value={insurance}
                onChange={e => setInsurance(e.target.value)}
                required
              >
                {INSURANCE_OPTIONS.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Additional Notes ──────────────────────────────────────────────── */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Additional Notes</h2>
          <div className={styles.field}>
            <label className={styles.label}>Special Instructions <span className={styles.optional}>(optional)</span></label>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              rows={3}
              placeholder="Wheelchair accessible entrance needed, oxygen required, etc."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.submitRow}>
          <button className={styles.submitBtn} type="submit" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Ride Request'}
          </button>
        </div>
      </form>
    </div>
  )
}
