import styles from './InsurancePartners.module.css'

const insurers = [
  { name: 'Medicaid', color: '#1e6fa8' },
  { name: 'Medicare', color: '#d97706' },
  { name: 'BlueCross BlueShield', color: '#0047AB' },
  { name: 'UnitedHealth', color: '#E11D48' },
  { name: 'Aetna', color: '#7c3aed' },
  { name: 'Humana', color: '#16a34a' },
  { name: 'Cigna', color: '#0891b2' },
  { name: 'Molina Healthcare', color: '#059669' },
]

export default function InsurancePartners() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <span className={styles.eyebrow}>Insurance & Coverage</span>
          <h2 className={styles.title}>We Accept Most Insurance Plans</h2>
          <p className={styles.desc}>
            We work directly with Medicaid, Medicare, and private insurance carriers.
            Our team handles prior authorizations and billing — you just focus on your health.
          </p>
        </div>

        <div className={styles.logos}>
          {insurers.map((ins, i) => (
            <div key={i} className={styles.logo}>
              <div className={styles.logoInner}>
                <div className={styles.logoIcon} style={{ background: `${ins.color}15`, borderColor: `${ins.color}30` }}>
                  <span className={styles.logoInitial} style={{ color: ins.color }}>
                    {ins.name.charAt(0)}
                  </span>
                </div>
                <span className={styles.logoName}>{ins.name}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.note}>
          <div className={styles.noteInner}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" stroke="#1e6fa8" strokeWidth="1.5"/>
              <path d="M10 6v5M10 13v1" stroke="#1e6fa8" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p>Don't see your insurance listed? <strong>Call us at (800) 555-1234</strong> — we accept many additional plans and can verify coverage at no cost.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
