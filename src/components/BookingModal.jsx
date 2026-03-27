import { useState } from 'react'
import { X, CheckCircle, ArrowRight, ArrowLeft, User, MapPin, Calendar, Phone, FileText } from 'lucide-react'
import styles from './BookingModal.module.css'

const STEPS = ['Patient Info', 'Trip Details', 'Medical Needs', 'Confirm']

export default function BookingModal({ onClose }) {
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    firstName: '', lastName: '', dob: '', phone: '', email: '',
    pickupAddress: '', destination: '', date: '', time: '', returnTime: '',
    tripType: 'oneway', transportType: 'ambulatory',
    insurance: '', memberId: '', notes: '', specialNeeds: [],
  })

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }))
  const toggleNeed = (need) => {
    setForm(f => ({
      ...f,
      specialNeeds: f.specialNeeds.includes(need)
        ? f.specialNeeds.filter(n => n !== need)
        : [...f.specialNeeds, need]
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (step < 3) { setStep(s => s + 1); return }
    setSubmitted(true)
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Schedule a Ride</h2>
            <p className={styles.subtitle}>Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
          </div>
          <button className={styles.close} onClick={onClose}><X size={20} /></button>
        </div>

        {/* Progress */}
        <div className={styles.progress}>
          {STEPS.map((s, i) => (
            <div key={i} className={styles.progressItem}>
              <div className={`${styles.progressDot} ${i <= step ? styles.progressDotActive : ''} ${i < step ? styles.progressDotDone : ''}`}>
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className={`${styles.progressLabel} ${i <= step ? styles.progressLabelActive : ''}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`${styles.progressLine} ${i < step ? styles.progressLineDone : ''}`} />}
            </div>
          ))}
        </div>

        {submitted ? (
          <div className={styles.success}>
            <div className={styles.successIcon}>
              <CheckCircle size={48} color="#16a34a" />
            </div>
            <h3 className={styles.successTitle}>Booking Request Submitted!</h3>
            <p className={styles.successText}>
              Our dispatch team will call you at <strong>{form.phone}</strong> within 15 minutes to confirm your ride.
              You'll also receive a confirmation SMS with driver details.
            </p>
            <div className={styles.successDetails}>
              <div className={styles.successDetail}>
                <span className={styles.successLabel}>Pickup</span>
                <span>{form.pickupAddress || '—'}</span>
              </div>
              <div className={styles.successDetail}>
                <span className={styles.successLabel}>Date & Time</span>
                <span>{form.date} at {form.time}</span>
              </div>
              <div className={styles.successDetail}>
                <span className={styles.successLabel}>Transport Type</span>
                <span className={styles.capitalize}>{form.transportType}</span>
              </div>
            </div>
            <div className={styles.successActions}>
              <a href="tel:+19782250802" className={styles.successPhone}>
                <Phone size={16} />
                Need immediate help? Call +1 (978) 225-0802
              </a>
              <button className={styles.successClose} onClick={onClose}>Close</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Step 0: Patient Info */}
            {step === 0 && (
              <div className={styles.stepContent}>
                <div className={styles.sectionLabel}>
                  <User size={16} />
                  Patient Information
                </div>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>First Name *</label>
                    <input className={styles.input} required value={form.firstName} onChange={e => update('firstName', e.target.value)} placeholder="John" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Last Name *</label>
                    <input className={styles.input} required value={form.lastName} onChange={e => update('lastName', e.target.value)} placeholder="Smith" />
                  </div>
                </div>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Date of Birth *</label>
                    <input className={styles.input} type="date" required value={form.dob} onChange={e => update('dob', e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Phone Number *</label>
                    <input className={styles.input} type="tel" required value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="(555) 000-0000" />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Email Address</label>
                  <input className={styles.input} type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="john@example.com" />
                </div>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Insurance Provider</label>
                    <select className={styles.input} value={form.insurance} onChange={e => update('insurance', e.target.value)}>
                      <option value="">Select insurance...</option>
                      <option>Medicaid</option>
                      <option>Medicare</option>
                      <option>BlueCross BlueShield</option>
                      <option>UnitedHealth</option>
                      <option>Aetna</option>
                      <option>Humana</option>
                      <option>Cigna</option>
                      <option>Self-Pay</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Member ID</label>
                    <input className={styles.input} value={form.memberId} onChange={e => update('memberId', e.target.value)} placeholder="Insurance member ID" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Trip Details */}
            {step === 1 && (
              <div className={styles.stepContent}>
                <div className={styles.sectionLabel}>
                  <MapPin size={16} />
                  Trip Details
                </div>
                <div className={styles.tripTypeBtns}>
                  {['oneway', 'roundtrip', 'recurring'].map(t => (
                    <button key={t} type="button"
                      className={`${styles.tripBtn} ${form.tripType === t ? styles.tripBtnActive : ''}`}
                      onClick={() => update('tripType', t)}>
                      {t === 'oneway' ? 'One Way' : t === 'roundtrip' ? 'Round Trip' : 'Recurring'}
                    </button>
                  ))}
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Pickup Address *</label>
                  <input className={styles.input} required value={form.pickupAddress} onChange={e => update('pickupAddress', e.target.value)} placeholder="123 Main St, Tampa, FL 33602" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Destination *</label>
                  <input className={styles.input} required value={form.destination} onChange={e => update('destination', e.target.value)} placeholder="Tampa General Hospital, 1 Tampa General Cir" />
                </div>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Appointment Date *</label>
                    <input className={styles.input} type="date" required value={form.date} onChange={e => update('date', e.target.value)} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Pickup Time *</label>
                    <input className={styles.input} type="time" required value={form.time} onChange={e => update('time', e.target.value)} />
                  </div>
                </div>
                {form.tripType === 'roundtrip' && (
                  <div className={styles.field}>
                    <label className={styles.label}>Estimated Return Time</label>
                    <input className={styles.input} type="time" value={form.returnTime} onChange={e => update('returnTime', e.target.value)} />
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Medical Needs */}
            {step === 2 && (
              <div className={styles.stepContent}>
                <div className={styles.sectionLabel}>
                  <FileText size={16} />
                  Medical & Transport Needs
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Transport Level *</label>
                  <div className={styles.transportOptions}>
                    {[
                      { value: 'ambulatory', label: 'Ambulatory', desc: 'Patient can walk with minimal assistance' },
                      { value: 'wheelchair', label: 'Wheelchair', desc: 'Patient uses a wheelchair' },
                      { value: 'stretcher', label: 'Stretcher', desc: 'Patient must remain lying down' },
                      { value: 'bariatric', label: 'Bariatric', desc: 'Patient requires specialized equipment' },
                    ].map(opt => (
                      <button key={opt.value} type="button"
                        className={`${styles.transportOpt} ${form.transportType === opt.value ? styles.transportOptActive : ''}`}
                        onClick={() => update('transportType', opt.value)}>
                        <span className={styles.transportOptLabel}>{opt.label}</span>
                        <span className={styles.transportOptDesc}>{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Special Requirements (select all that apply)</label>
                  <div className={styles.checkboxes}>
                    {['Oxygen required', 'IV access', 'Bariatric equipment', 'Service animal', 'Child car seat', 'Escort/companion', 'Spanish-speaking driver', 'Interpreter needed'].map(need => (
                      <button key={need} type="button"
                        className={`${styles.checkbox} ${form.specialNeeds.includes(need) ? styles.checkboxActive : ''}`}
                        onClick={() => toggleNeed(need)}>
                        {form.specialNeeds.includes(need) && <CheckCircle size={14} />}
                        {need}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Additional Notes</label>
                  <textarea className={`${styles.input} ${styles.textarea}`} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Any additional information about the patient's needs, facility requirements, or special instructions..." rows={3} />
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <div className={styles.stepContent}>
                <div className={styles.sectionLabel}>
                  <CheckCircle size={16} />
                  Review Your Booking
                </div>
                <div className={styles.summary}>
                  <div className={styles.summaryGroup}>
                    <h4 className={styles.summaryTitle}>Patient</h4>
                    <p>{form.firstName} {form.lastName}</p>
                    <p>{form.phone}</p>
                    <p>{form.insurance || 'No insurance listed'}</p>
                  </div>
                  <div className={styles.summaryGroup}>
                    <h4 className={styles.summaryTitle}>Trip</h4>
                    <p>{form.pickupAddress || '—'}</p>
                    <p>→ {form.destination || '—'}</p>
                    <p>{form.date} at {form.time}</p>
                    <p className={styles.capitalize}>Trip type: {form.tripType}</p>
                  </div>
                  <div className={styles.summaryGroup}>
                    <h4 className={styles.summaryTitle}>Transport</h4>
                    <p className={styles.capitalize}>{form.transportType} transport</p>
                    {form.specialNeeds.length > 0 && (
                      <p>Special needs: {form.specialNeeds.join(', ')}</p>
                    )}
                    {form.notes && <p>Notes: {form.notes}</p>}
                  </div>
                </div>
                <div className={styles.confirmNote}>
                  <CheckCircle size={16} color="#16a34a" />
                  <p>By submitting, our team will call to confirm and verify insurance coverage. There is no charge until your ride is confirmed.</p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className={styles.nav}>
              {step > 0 ? (
                <button type="button" className={styles.backBtn} onClick={() => setStep(s => s - 1)}>
                  <ArrowLeft size={18} /> Back
                </button>
              ) : <div />}
              <button type="submit" className={styles.nextBtn}>
                {step === 3 ? 'Submit Booking' : 'Continue'}
                {step < 3 && <ArrowRight size={18} />}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
