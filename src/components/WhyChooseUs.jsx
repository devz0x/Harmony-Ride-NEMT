import { Shield, Clock, Users, HeartHandshake, MapPin, Award } from 'lucide-react'
import styles from './WhyChooseUs.module.css'

const reasons = [
  {
    icon: <Shield size={24} />,
    title: 'Fully Licensed & Insured',
    description: 'State-certified NEMT provider with $2M+ liability coverage and DOT compliance in every operating state.',
    color: '#1e6fa8',
  },
  {
    icon: <Clock size={24} />,
    title: '98% On-Time Record',
    description: 'We track every vehicle in real time. If a delay is detected, we notify patients and facilities proactively.',
    color: '#16a34a',
  },
  {
    icon: <Users size={24} />,
    title: 'Background-Checked Drivers',
    description: 'All drivers pass 7-year criminal background checks, drug screening, and complete NEMT-specific training.',
    color: '#7c3aed',
  },
  {
    icon: <HeartHandshake size={24} />,
    title: 'Medicaid & Insurance Accepted',
    description: 'We are credentialed with Medicaid, Medicare, and most major insurance plans. We handle all the paperwork.',
    color: '#d97706',
  },
  {
    icon: <MapPin size={24} />,
    title: 'Real-Time GPS Tracking',
    description: 'Patients and family members receive live SMS updates with driver location. No more waiting and wondering.',
    color: '#db2777',
  },
  {
    icon: <Award size={24} />,
    title: 'HIPAA Compliant',
    description: 'We follow strict HIPAA guidelines for patient privacy. Your health information is always protected.',
    color: '#0d9488',
  },
]

export default function WhyChooseUs() {
  return (
    <section id="why-us" className={styles.section}>
      <div className="container">
        <div className={styles.layout}>
          {/* Left visual */}
          <div className={styles.visual}>
            <div className={styles.visualCard}>
              <div className={styles.vehicleIllustration}>
                <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.van}>
                  <rect x="20" y="80" width="240" height="80" rx="12" fill="#1a5296"/>
                  <rect x="20" y="80" width="240" height="80" rx="12" fill="url(#vanGrad)"/>
                  <rect x="40" y="55" width="160" height="60" rx="8" fill="#1e6fa8"/>
                  <rect x="50" y="62" width="60" height="40" rx="4" fill="#a8d4f5" fillOpacity="0.7"/>
                  <rect x="120" y="62" width="60" height="40" rx="4" fill="#a8d4f5" fillOpacity="0.7"/>
                  <circle cx="70" cy="168" r="22" fill="#1a1a2e"/>
                  <circle cx="70" cy="168" r="14" fill="#374151"/>
                  <circle cx="70" cy="168" r="6" fill="#9ca3af"/>
                  <circle cx="210" cy="168" r="22" fill="#1a1a2e"/>
                  <circle cx="210" cy="168" r="14" fill="#374151"/>
                  <circle cx="210" cy="168" r="6" fill="#9ca3af"/>
                  <rect x="22" y="100" width="8" height="20" rx="2" fill="#f59e0b"/>
                  <rect x="250" y="100" width="8" height="20" rx="2" fill="#ef4444"/>
                  <path d="M160 65h80l15 55h-95V65z" fill="#2484c8" fillOpacity="0.5"/>
                  <text x="120" y="125" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="Arial">CLEARPATH MEDICAL</text>
                  <path d="M30 115h8M252 115h8" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="vanGrad" x1="20" y1="80" x2="260" y2="160" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#1e6fa8"/>
                      <stop offset="1" stopColor="#0c2d5a"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <div className={styles.badges}>
                <div className={styles.badgeItem}>
                  <div className={styles.badgeIcon} style={{background:'#d1fae5', color:'#16a34a'}}>
                    <Shield size={18}/>
                  </div>
                  <div>
                    <p className={styles.badgeTitle}>DOT Certified</p>
                    <p className={styles.badgeSub}>All vehicles inspected</p>
                  </div>
                </div>
                <div className={styles.badgeItem}>
                  <div className={styles.badgeIcon} style={{background:'#dbeeff', color:'#1e6fa8'}}>
                    <Award size={18}/>
                  </div>
                  <div>
                    <p className={styles.badgeTitle}>HIPAA Compliant</p>
                    <p className={styles.badgeSub}>Patient data protected</p>
                  </div>
                </div>
                <div className={styles.badgeItem}>
                  <div className={styles.badgeIcon} style={{background:'#fef3c7', color:'#d97706'}}>
                    <Clock size={18}/>
                  </div>
                  <div>
                    <p className={styles.badgeTitle}>24/7 Dispatch</p>
                    <p className={styles.badgeSub}>Always available</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: reasons */}
          <div className={styles.reasons}>
            <span className={styles.eyebrow}>Why ClearPath</span>
            <h2 className={styles.title}>The Standard of Care in Medical Transport</h2>
            <p className={styles.desc}>
              We are not just a ride service. We are a certified NEMT provider with clinical protocols,
              compliance standards, and a mission to treat every patient with dignity.
            </p>

            <div className={styles.grid}>
              {reasons.map((r, i) => (
                <div key={i} className={styles.item}>
                  <div className={styles.itemIcon} style={{ color: r.color, background: `${r.color}15` }}>
                    {r.icon}
                  </div>
                  <div>
                    <h3 className={styles.itemTitle}>{r.title}</h3>
                    <p className={styles.itemDesc}>{r.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
