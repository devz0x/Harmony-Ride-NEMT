import { useState } from 'react'
import { MapPin, Calendar, Clock, ArrowRight, Shield, Star, CheckCircle, Phone } from 'lucide-react'
import styles from './Hero.module.css'

export default function Hero({ onBookNow }) {
  const [tripType, setTripType] = useState('roundtrip')

  return (
    <section className={styles.hero}>
      {/* Background */}
      <div className={styles.bg}>
        <div className={styles.bgGradient} />
        <div className={styles.bgPattern} />
        <div className={styles.bgOrbs}>
          <div className={styles.orb1} />
          <div className={styles.orb2} />
          <div className={styles.orb3} />
        </div>
      </div>

      <div className={`container ${styles.inner}`}>
        {/* Left: Content */}
        <div className={styles.content}>
          <div className={styles.badge}>
            <Shield size={14} />
            <span>Licensed & Insured in 12 States</span>
          </div>

          <h1 className={styles.headline}>
            Safe, Reliable Transport{' '}
            <span className={styles.highlight}>to Every Appointment</span>
          </h1>

          <p className={styles.sub}>
            Non-emergency medical transportation you can count on. Professional drivers,
            ADA-compliant vehicles, and real-time tracking for patients and caregivers.
          </p>

          <div className={styles.trust}>
            <div className={styles.trustItem}>
              <CheckCircle size={16} color="#22c55e" />
              <span>Insurance accepted</span>
            </div>
            <div className={styles.trustItem}>
              <CheckCircle size={16} color="#22c55e" />
              <span>24/7 scheduling</span>
            </div>
            <div className={styles.trustItem}>
              <CheckCircle size={16} color="#22c55e" />
              <span>Door-to-door service</span>
            </div>
          </div>

          {/* Reviews */}
          <div className={styles.reviews}>
            <div className={styles.avatars}>
              {[1,2,3,4].map(i => (
                <div key={i} className={styles.avatar} style={{
                  background: `hsl(${200 + i * 30}, 60%, 50%)`,
                  zIndex: 5 - i
                }}>
                  {['MR','JS','KL','AT'][i-1]}
                </div>
              ))}
            </div>
            <div>
              <div className={styles.stars}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
              <p className={styles.reviewText}><strong>4.9/5</strong> from 2,400+ rides</p>
            </div>
          </div>
        </div>

        {/* Right: Booking Card + live tracking preview */}
        <div className={styles.cardCol}>
          {/* Live tracking toast */}
          <div className={styles.liveToast}>
            <div className={styles.liveToastDot}/>
            <div className={styles.liveToastContent}>
              <p className={styles.liveToastTitle}>Driver on the way</p>
              <p className={styles.liveToastSub}>Marcus J. · VAN-04 · ETA <strong>8 min</strong></p>
            </div>
            <MapPin size={16} color="#1e6fa8" className={styles.liveToastIcon}/>
          </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Schedule a Ride</h2>
            <p className={styles.cardSub}>Free quote · No commitment</p>
          </div>

          <div className={styles.tripTabs}>
            {['oneway', 'roundtrip', 'recurring'].map(type => (
              <button
                key={type}
                className={`${styles.tab} ${tripType === type ? styles.tabActive : ''}`}
                onClick={() => setTripType(type)}
              >
                {type === 'oneway' ? 'One Way' : type === 'roundtrip' ? 'Round Trip' : 'Recurring'}
              </button>
            ))}
          </div>

          <form className={styles.form} onSubmit={e => { e.preventDefault(); onBookNow() }}>
            <div className={styles.field}>
              <label className={styles.label}>Pickup Location</label>
              <div className={styles.inputWrap}>
                <MapPin size={16} className={styles.inputIcon} color="#1e6fa8" />
                <input
                  type="text"
                  placeholder="Enter pickup address"
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Destination</label>
              <div className={styles.inputWrap}>
                <MapPin size={16} className={styles.inputIcon} color="#0d9488" />
                <input
                  type="text"
                  placeholder="Hospital, clinic, or facility"
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Date</label>
                <div className={styles.inputWrap}>
                  <Calendar size={16} className={styles.inputIcon} color="#1e6fa8" />
                  <input type="date" className={styles.input} />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Time</label>
                <div className={styles.inputWrap}>
                  <Clock size={16} className={styles.inputIcon} color="#1e6fa8" />
                  <input type="time" className={styles.input} />
                </div>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Transport Type</label>
              <select className={`${styles.input} ${styles.select}`}>
                <option value="">Select transport level...</option>
                <option value="ambulatory">Ambulatory (Walking)</option>
                <option value="wheelchair">Wheelchair Transport</option>
                <option value="stretcher">Stretcher Transport</option>
                <option value="bariatric">Bariatric Transport</option>
              </select>
            </div>

            <button type="submit" className={styles.submitBtn}>
              Get Free Quote
              <ArrowRight size={18} />
            </button>
          </form>

          <p className={styles.cardFooter}>
            Or call us directly: <a href="tel:+19782250802" className={styles.cardPhone}>+1 (978) 225-0802</a>
          </p>
        </div>

          {/* Insurance logos row */}
          <div className={styles.insuranceRow}>
            <span className={styles.insuranceLabel}>Accepted:</span>
            {['Medicaid', 'Medicare', 'BlueCross', 'Aetna', 'Humana'].map(ins => (
              <span key={ins} className={styles.insurancePill}>{ins}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className={styles.wave}>
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="white"/>
        </svg>
      </div>
    </section>
  )
}
