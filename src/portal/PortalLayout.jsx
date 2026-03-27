import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import styles from './PortalLayout.module.css'

const NAV_LINKS = [
  { to: '/portal',          label: 'Dashboard',     end: true },
  { to: '/portal/trips',    label: 'My Trips',      end: false },
  { to: '/portal/request',  label: 'Request a Ride',end: false },
  { to: '/portal/billing',  label: 'Billing',       end: false },
]

export default function PortalLayout() {
  const navigate = useNavigate()
  const [user, setUser]         = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/portal/login', { replace: true })
  }

  const displayName = user?.user_metadata?.full_name || user?.email || 'Patient'

  return (
    <div className={styles.shell}>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          {/* Logo */}
          <NavLink to="/portal" className={styles.logo}>
            <div className={styles.logoIcon}>
              <svg width="30" height="30" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="6" fill="#0d9488"/>
                <ellipse cx="11" cy="14" rx="5.5" ry="3.8" stroke="white" strokeWidth="2" fill="none"/>
                <ellipse cx="18" cy="14" rx="5.5" ry="3.8" stroke="white" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            <div>
              <span className={styles.logoName}>Harmony Rides</span>
              <span className={styles.logoSub}>Patient Portal</span>
            </div>
          </NavLink>

          {/* Desktop nav links */}
          <ul className={styles.links}>
            {NAV_LINKS.map(link => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `${styles.link} ${isActive ? styles.linkActive : ''}`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Right side */}
          <div className={styles.actions}>
            <NavLink
              to="/portal/account"
              className={({ isActive }) =>
                `${styles.userChip} ${isActive ? styles.userChipActive : ''}`
              }
            >
              <User size={15} />
              <span className={styles.userName}>{displayName}</span>
            </NavLink>
            <button className={styles.logoutBtn} onClick={handleLogout} title="Sign out">
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
            <button
              className={styles.menuToggle}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className={styles.mobileMenu}>
            <ul className={styles.mobileLinks}>
              {NAV_LINKS.map(link => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      `${styles.mobileLink} ${isActive ? styles.mobileLinkActive : ''}`
                    }
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
              <li>
                <NavLink
                  to="/portal/account"
                  className={({ isActive }) =>
                    `${styles.mobileLink} ${isActive ? styles.mobileLinkActive : ''}`
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  My Account
                </NavLink>
              </li>
              <li>
                <button className={styles.mobileLogout} onClick={handleLogout}>
                  <LogOut size={16} /> Sign Out
                </button>
              </li>
            </ul>
          </div>
        )}
      </nav>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
