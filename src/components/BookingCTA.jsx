import { ArrowRight, Phone } from 'lucide-react'
import styles from './BookingCTA.module.css'

export default function BookingCTA({ onBookNow }) {
  return (
    <section className={styles.section}>
      <div className={styles.bg}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
      </div>
      <div className={`container ${styles.inner}`}>
        <div className={styles.content}>
          <h2 className={styles.title}>
            Ready for Reliable Medical Transport?
          </h2>
          <p className={styles.desc}>
            Book online in under 2 minutes or call our 24/7 dispatch team.
            Same-day rides available when capacity allows.
          </p>
          <div className={styles.actions}>
            <button className={styles.bookBtn} onClick={onBookNow}>
              Schedule a Ride
              <ArrowRight size={20} />
            </button>
            <a href="tel:+19782250802" className={styles.phoneBtn}>
              <Phone size={18} />
              +1 (978) 225-0802
            </a>
          </div>
          <p className={styles.note}>No setup fees · Insurance handled · Cancel anytime</p>
        </div>
      </div>
    </section>
  )
}
