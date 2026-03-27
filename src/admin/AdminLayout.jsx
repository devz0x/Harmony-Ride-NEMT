import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Car, Users, UserCheck, Truck, CreditCard,
  Settings, Menu, X, Bell, Search, ChevronDown, LogOut,
  MapPin, Phone
} from 'lucide-react'
import { useTrips, useVehicles, useInvoices } from '../lib/useData'
import { supabase } from '../lib/supabase'
import styles from './AdminLayout.module.css'

const today = new Date().toISOString().slice(0, 10)

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authUser, setAuthUser]       = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthUser(data.user))
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/admin/login', { replace: true })
  }

  const { trips }    = useTrips()
  const { vehicles } = useVehicles()
  const { invoices } = useInvoices()

  // Live badge counts
  const unassignedTrips  = trips.filter(t => !t.driver && ['pending','confirmed'].includes(t.status) && t.date >= today).length
  const fleetAlerts      = vehicles.filter(v => v.nextService && v.nextService <= today).length
  const deniedInvoices   = invoices.filter(i => i.status === 'denied').length

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Trips',     icon: Car,             path: '/admin/trips',    badge: unassignedTrips || null },
    { label: 'Dispatch',  icon: MapPin,           path: '/admin/dispatch' },
    { label: 'Patients',  icon: Users,            path: '/admin/patients' },
    { label: 'Drivers',   icon: UserCheck,        path: '/admin/drivers' },
    { label: 'Fleet',     icon: Truck,            path: '/admin/fleet',   badge: fleetAlerts || null },
    { label: 'Billing',   icon: CreditCard,       path: '/admin/billing', badge: deniedInvoices || null },
    { label: 'Settings',  icon: Settings,         path: '/admin/settings' },
  ]

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="6" fill="rgba(255,255,255,0.15)"/>
                <ellipse cx="11" cy="14" rx="5" ry="3.5" stroke="white" strokeWidth="2" fill="none"/>
                <ellipse cx="18" cy="14" rx="5" ry="3.5" stroke="white" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            <div>
              <span className={styles.logoName}>Harmony Rides</span>
              <span className={styles.logoSub}>Admin Portal</span>
            </div>
          </div>
          <button className={styles.sidebarClose} onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.navSection}>
          <p className={styles.navLabel}>Management</p>
          <nav className={styles.nav}>
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={styles.badge}>{item.badge}</span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>
              {(authUser?.email?.[0] || 'A').toUpperCase()}
            </div>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{authUser?.email?.split('@')[0] || 'Admin'}</p>
              <p className={styles.userRole}>{authUser?.email || ''}</p>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className={styles.main}>
        {/* Top bar */}
        <header className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>

          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input type="text" placeholder="Search trips, patients, drivers..." className={styles.searchInput} />
          </div>

          <div className={styles.topRight}>
            <a href="tel:+19782250802" className={styles.dispatchBtn}>
              <Phone size={15} />
              <span>Dispatch</span>
            </a>
            <button className={styles.alertBtn}>
              <Bell size={18} />
              <span className={styles.alertDot} />
            </button>
            <div className={styles.topUser}>
              <div className={styles.topUserAvatar}>AD</div>
              <ChevronDown size={14} />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
