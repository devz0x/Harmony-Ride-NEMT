import { useRef } from 'react'
import styles from './Services.module.css'

const services = [
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#dbeeff"/>
        <path d="M14 22c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#1e6fa8" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="20" cy="14" r="2.5" fill="#1e6fa8"/>
        <path d="M20 28v-6" stroke="#1e6fa8" strokeWidth="2" strokeLinecap="round"/>
        <path d="M17 28h6" stroke="#1e6fa8" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Ambulatory Transport',
    description: 'For patients who can walk with minimal assistance. Comfortable sedan or SUV transport to and from medical appointments.',
    features: ['Door-to-door escort', 'Certified drivers', 'Sedan & SUV fleet'],
    color: '#dbeeff',
    accent: '#1e6fa8',
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#d1fae5"/>
        <rect x="12" y="18" width="16" height="10" rx="2" stroke="#16a34a" strokeWidth="1.8" fill="none"/>
        <circle cx="15" cy="30" r="2" fill="#16a34a"/>
        <circle cx="25" cy="30" r="2" fill="#16a34a"/>
        <path d="M12 22h16" stroke="#16a34a" strokeWidth="1.5"/>
        <path d="M20 13v5" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"/>
        <path d="M17 16h6" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Wheelchair Transport',
    description: 'ADA-compliant vehicles with hydraulic lifts and proper securement systems for safe, dignified wheelchair transport.',
    features: ['Hydraulic ramp lifts', 'ADA-compliant vehicles', 'Proper chair securement'],
    color: '#d1fae5',
    accent: '#16a34a',
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#fde8d8"/>
        <rect x="8" y="17" width="24" height="8" rx="2" stroke="#ea580c" strokeWidth="1.8" fill="none"/>
        <path d="M8 21h24" stroke="#ea580c" strokeWidth="1.5"/>
        <circle cx="12" cy="27" r="2" fill="#ea580c"/>
        <circle cx="28" cy="27" r="2" fill="#ea580c"/>
        <path d="M16 17v-3" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M24 17v-3" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Stretcher Transport',
    description: 'For patients requiring a supine position during transport. Staffed by trained EMTs with full medical oversight.',
    features: ['EMT-staffed vehicles', 'Fully equipped units', 'Climate controlled'],
    color: '#fde8d8',
    accent: '#ea580c',
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#ede9fe"/>
        <path d="M12 28l4-12 4 8 3-5 5 9" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <circle cx="20" cy="12" r="3" fill="#7c3aed" fillOpacity="0.3" stroke="#7c3aed" strokeWidth="1.5"/>
      </svg>
    ),
    title: 'Bariatric Transport',
    description: 'Specialized vehicles and equipment for bariatric patients, with extra-wide doors, reinforced stretchers, and trained staff.',
    features: ['Reinforced equipment', 'Wide-access vehicles', 'Specialized crew'],
    color: '#ede9fe',
    accent: '#7c3aed',
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#fef3c7"/>
        <path d="M14 26V16l6-4 6 4v10" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M17 26v-5h6v5" stroke="#d97706" strokeWidth="1.5" fill="none"/>
        <path d="M10 26h20" stroke="#d97706" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Facility Transfers',
    description: 'Hospital-to-hospital, nursing home, rehab center, and dialysis center transfers with precise scheduling.',
    features: ['Scheduled recurring rides', 'Dialysis specialization', 'Discharge coordination'],
    color: '#fef3c7',
    accent: '#d97706',
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="20" fill="#fce7f3"/>
        <path d="M20 12v4M20 24v4M12 20h4M24 20h4" stroke="#db2777" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="20" cy="20" r="5" stroke="#db2777" strokeWidth="1.8" fill="none"/>
      </svg>
    ),
    title: 'After-Hours & Urgent',
    description: '24/7 availability for urgent (non-emergency) medical transport needs. Same-day booking available when capacity allows.',
    features: ['24/7 dispatch available', 'Same-day booking', 'On-call coordinators'],
    color: '#fce7f3',
    accent: '#db2777',
  },
]

export default function Services() {
  return (
    <section id="services" className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <span className={styles.eyebrow}>What We Offer</span>
          <h2 className={styles.title}>Transport Services for Every Need</h2>
          <p className={styles.desc}>
            From routine appointments to specialized medical facility transfers,
            our fleet and certified staff cover every level of care.
          </p>
        </div>

        <div className={styles.grid}>
          {services.map((service, i) => (
            <div key={i} className={styles.card} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={styles.iconWrap}>
                {service.icon}
              </div>
              <h3 className={styles.cardTitle}>{service.title}</h3>
              <p className={styles.cardDesc}>{service.description}</p>
              <ul className={styles.features}>
                {service.features.map((f, j) => (
                  <li key={j} className={styles.feature} style={{ color: service.accent }}>
                    <span className={styles.dot} style={{ background: service.accent }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
