import { Phone, ClipboardCheck, Car, Home } from 'lucide-react'
import styles from './HowItWorks.module.css'

const steps = [
  {
    number: '01',
    icon: <Phone size={28} />,
    title: 'Call or Book Online',
    description: 'Contact us by phone, app, or our online form. Tell us your pickup location, destination, date, and transport needs. We handle Medicaid, Medicare, and private insurance verification instantly.',
    color: '#1e6fa8',
    bg: '#dbeeff',
  },
  {
    number: '02',
    icon: <ClipboardCheck size={28} />,
    title: 'We Confirm & Assign',
    description: 'Receive a confirmation with your driver\'s name, vehicle info, and ETA via SMS. We match you with the right vehicle type — wheelchair van, stretcher unit, or standard sedan.',
    color: '#16a34a',
    bg: '#d1fae5',
  },
  {
    number: '03',
    icon: <Car size={28} />,
    title: 'Driver Arrives On Time',
    description: 'Your certified, background-checked driver arrives at your door. Track your ride in real time via SMS updates. We provide door-to-door assistance — never just curbside.',
    color: '#d97706',
    bg: '#fef3c7',
  },
  {
    number: '04',
    icon: <Home size={28} />,
    title: 'Safe Return Home',
    description: 'After your appointment, your driver brings you safely home. For round-trip bookings, we coordinate wait times with your facility. No need to call again — it\'s already scheduled.',
    color: '#7c3aed',
    bg: '#ede9fe',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <span className={styles.eyebrow}>Simple Process</span>
          <h2 className={styles.title}>How It Works</h2>
          <p className={styles.desc}>
            Getting a ride is easy. We handle the logistics so patients and families can focus on what matters most.
          </p>
        </div>

        <div className={styles.steps}>
          {steps.map((step, i) => (
            <div key={i} className={styles.step}>
              {i < steps.length - 1 && <div className={styles.connector} />}
              <div className={styles.iconCircle} style={{ background: step.bg, color: step.color }}>
                {step.icon}
              </div>
              <div className={styles.number} style={{ color: step.color }}>{step.number}</div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.description}</p>
            </div>
          ))}
        </div>

        <div className={styles.cta}>
          <div className={styles.ctaInner}>
            <div>
              <h3 className={styles.ctaTitle}>Ready to schedule your first ride?</h3>
              <p className={styles.ctaText}>Most bookings are confirmed within minutes.</p>
            </div>
            <div className={styles.ctaBtns}>
              <a href="tel:+19782250802" className={styles.ctaPhone}>
                <Phone size={18} />
                +1 (978) 225-0802
              </a>
              <button className={styles.ctaBook}>
                Book Online Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
