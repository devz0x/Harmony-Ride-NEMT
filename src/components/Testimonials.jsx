import { Star, Quote } from 'lucide-react'
import { useState } from 'react'
import styles from './Testimonials.module.css'

const testimonials = [
  {
    name: 'Margaret T.',
    role: 'Dialysis Patient · Orlando, FL',
    avatar: 'MT',
    color: '#1e6fa8',
    stars: 5,
    text: 'I go to dialysis three times a week. ClearPath has never once been late in eight months. My driver Marcus always helps me to the door and waits to make sure I get checked in. I genuinely don\'t know what I\'d do without this service.',
  },
  {
    name: 'James & Susan R.',
    role: 'Caregivers for elderly parent · Tampa, FL',
    avatar: 'JS',
    color: '#16a34a',
    stars: 5,
    text: 'Our mother uses a wheelchair and most NEMT companies made us feel like a burden. ClearPath was different — they were patient, professional, and even called us to confirm the pickup. The real-time text updates gave us so much peace of mind.',
  },
  {
    name: 'Dr. Kevin Olathe',
    role: 'Discharge Coordinator · Tampa General Hospital',
    avatar: 'KO',
    color: '#7c3aed',
    stars: 5,
    text: 'We partner with ClearPath for patient discharges and facility transfers. Their coordination with our case managers is seamless. They show up on time, the vehicles are clean, and their staff treats patients with real dignity. Highly recommend.',
  },
  {
    name: 'Linda P.',
    role: 'Chemotherapy Patient · St. Petersburg, FL',
    avatar: 'LP',
    color: '#d97706',
    stars: 5,
    text: 'Going through chemo is exhausting. The last thing I needed was transportation stress. ClearPath made every ride comfortable — they\'re quiet when I need quiet and kind when I need kindness. It\'s a small thing that meant everything.',
  },
  {
    name: 'Roberto M.',
    role: 'Post-surgery patient · Clearwater, FL',
    avatar: 'RM',
    color: '#db2777',
    stars: 5,
    text: 'After my knee surgery I couldn\'t drive for six weeks. ClearPath was there every appointment, on time, with a driver who knew exactly how to help me in and out without hurting me. Insurance covered everything too — no hassle.',
  },
  {
    name: 'Carolyn H.',
    role: 'Social Worker · Medicaid Coordinator',
    avatar: 'CH',
    color: '#0d9488',
    stars: 5,
    text: 'I refer clients to ClearPath regularly. Their Medicaid billing is handled correctly — I\'ve never had a denial due to their documentation. For a social worker, a reliable NEMT partner is invaluable. They\'ve never let my clients down.',
  },
]

export default function Testimonials() {
  const [active, setActive] = useState(0)

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <span className={styles.eyebrow}>Patient Stories</span>
          <h2 className={styles.title}>Trusted by Patients & Healthcare Professionals</h2>
          <div className={styles.rating}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={20} fill="#f59e0b" color="#f59e0b" />
            ))}
            <span className={styles.ratingText}>4.9 out of 5 · 2,400+ reviews</span>
          </div>
        </div>

        <div className={styles.grid}>
          {testimonials.map((t, i) => (
            <div key={i} className={styles.card}>
              <Quote size={24} className={styles.quoteIcon} />
              <p className={styles.text}>{t.text}</p>
              <div className={styles.stars}>
                {[...Array(t.stars)].map((_, j) => (
                  <Star key={j} size={14} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
              <div className={styles.author}>
                <div className={styles.avatar} style={{ background: t.color }}>
                  {t.avatar}
                </div>
                <div>
                  <p className={styles.name}>{t.name}</p>
                  <p className={styles.role}>{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
