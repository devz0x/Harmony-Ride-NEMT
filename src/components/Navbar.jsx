import { useState, useEffect } from 'react'
import { Phone, Menu, X, Cross } from 'lucide-react'
import styles from './Navbar.module.css'

export default function Navbar({ onBookNow }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { label: 'Services', href: '#services' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Coverage', href: '#coverage' },
    { label: 'About', href: '#why-us' },
  ]

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.inner}`}>
        <a href="#" className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="6" fill="white" fillOpacity="0.15"/>
              <ellipse cx="11" cy="14" rx="5.5" ry="3.8" stroke="white" strokeWidth="2" fill="none"/>
              <ellipse cx="18" cy="14" rx="5.5" ry="3.8" stroke="white" strokeWidth="2" fill="none"/>
            </svg>
          </div>
          <div>
            <span className={styles.logoName}>Harmony Rides</span>
            <span className={styles.logoSub}>Transportation LLC</span>
          </div>
        </a>

        <ul className={`${styles.links} ${menuOpen ? styles.linksOpen : ''}`}>
          {navLinks.map(link => (
            <li key={link.label}>
              <a href={link.href} className={styles.link} onClick={() => setMenuOpen(false)}>
                {link.label}
              </a>
            </li>
          ))}
          <li className={styles.mobilePhone}>
            <a href="tel:+19782250802" className={styles.phoneLink}>
              <Phone size={16} />
              (978) 225-0802
            </a>
          </li>
        </ul>

        <div className={styles.actions}>
          <a href="tel:+19782250802" className={styles.phoneDesktop}>
            <Phone size={15} />
            (978) 225-0802
          </a>
          <button className={styles.bookBtn} onClick={onBookNow}>
            Book a Ride
          </button>
          <button className={styles.menuToggle} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </nav>
  )
}
