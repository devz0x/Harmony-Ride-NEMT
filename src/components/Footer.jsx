import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react'
import styles from './Footer.module.css'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.main}>
          <div className={styles.brand}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect width="28" height="28" rx="6" fill="rgba(255,255,255,0.1)"/>
                  <ellipse cx="11" cy="14" rx="5.5" ry="3.8" stroke="white" strokeWidth="2" fill="none"/>
                  <ellipse cx="18" cy="14" rx="5.5" ry="3.8" stroke="white" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <div>
                <span className={styles.logoName}>Harmony Rides</span>
                <span className={styles.logoSub}>Transportation LLC</span>
              </div>
            </div>
            <p className={styles.brandDesc}>
              Licensed, insured, and trusted by thousands of patients and healthcare facilities
              across the Southeast United States.
            </p>
            <div className={styles.contact}>
              <a href="tel:+19782250802" className={styles.contactItem}>
                <Phone size={16} />
                (978) 225-0802
              </a>
              <a href="mailto:infoharmonyrides@gmail.com" className={styles.contactItem}>
                <Mail size={16} />
                infoharmonyrides@gmail.com
              </a>
              <div className={styles.contactItem}>
                <MapPin size={16} />
                Haverhill, MA · Serving New England
              </div>
            </div>
            <div className={styles.social}>
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className={styles.socialLink}>
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div className={styles.links}>
            <div className={styles.col}>
              <h4 className={styles.colTitle}>Services</h4>
              <ul className={styles.colList}>
                <li><a href="#services">Ambulatory Transport</a></li>
                <li><a href="#services">Wheelchair Transport</a></li>
                <li><a href="#services">Stretcher Transport</a></li>
                <li><a href="#services">Bariatric Transport</a></li>
                <li><a href="#services">Facility Transfers</a></li>
                <li><a href="#services">After-Hours Transport</a></li>
              </ul>
            </div>
            <div className={styles.col}>
              <h4 className={styles.colTitle}>Company</h4>
              <ul className={styles.colList}>
                <li><a href="#why-us">About Us</a></li>
                <li><a href="#coverage">Coverage Area</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Driver Partners</a></li>
                <li><a href="#">Provider Portal</a></li>
                <li><a href="#">Press</a></li>
              </ul>
            </div>
            <div className={styles.col}>
              <h4 className={styles.colTitle}>Insurance</h4>
              <ul className={styles.colList}>
                <li><a href="#">Medicaid Transport</a></li>
                <li><a href="#">Medicare Rides</a></li>
                <li><a href="#">Private Insurance</a></li>
                <li><a href="#">Self-Pay Options</a></li>
                <li><a href="#">Prior Authorization</a></li>
              </ul>
            </div>
            <div className={styles.col}>
              <h4 className={styles.colTitle}>Support</h4>
              <ul className={styles.colList}>
                <li><a href="#">Book a Ride</a></li>
                <li><a href="#">Cancel/Modify</a></li>
                <li><a href="#">Track Your Ride</a></li>
                <li><a href="#">Patient Portal</a></li>
                <li><a href="#">Contact Us</a></li>
                <li><a href="#">FAQ</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <div className={styles.bottomLeft}>
            <p>© {year} Harmony Rides Transportation LLC. All rights reserved.</p>
            <p className={styles.compliance}>
              Licensed NEMT Provider · HIPAA Compliant · DOT Certified · ADA Accessible Fleet
            </p>
          </div>
          <div className={styles.legal}>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">HIPAA Notice</a>
            <a href="#">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
