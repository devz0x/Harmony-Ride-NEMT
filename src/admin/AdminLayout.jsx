import { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, Car, Users, UserCheck, Truck, CreditCard,
  Settings, Menu, X, Bell, Search, ChevronDown, LogOut,
  MapPin, Phone, AlertTriangle, Calendar, FileX, User,
} from 'lucide-react'
import { useTrips, useVehicles, useInvoices, usePatients, useDrivers } from '../lib/useData'
import { supabase } from '../lib/supabase'
import styles from './AdminLayout.module.css'

const today = new Date().toISOString().slice(0, 10)

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const [authUser, setAuthUser]         = useState(null)
  const [searchQ, setSearchQ]           = useState('')
  const [searchOpen, setSearchOpen]     = useState(false)
  const [searchCursor, setSearchCursor] = useState(-1)
  const [notifOpen, setNotifOpen]       = useState(false)
  const [userOpen, setUserOpen]         = useState(false)
  const searchRef = useRef(null)
  const notifRef  = useRef(null)
  const userRef   = useRef(null)
  const navigate  = useNavigate()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthUser(data.user))
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false)
      if (notifRef.current  && !notifRef.current.contains(e.target))  setNotifOpen(false)
      if (userRef.current   && !userRef.current.contains(e.target))   setUserOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/admin/login', { replace: true })
  }

  const { trips }    = useTrips()
  const { vehicles } = useVehicles()
  const { invoices } = useInvoices()
  const { patients } = usePatients()
  const { drivers }  = useDrivers()

  // ── Badge counts ────────────────────────────────────────────────────────────
  const unassignedTrips = trips.filter(t =>
    !t.driver && ['pending','confirmed'].includes(t.status) && t.date >= today
  ).length
  const fleetAlerts    = vehicles.filter(v => v.nextService && v.nextService <= today).length
  const deniedInvoices = invoices.filter(i => i.status === 'denied').length
  const totalAlerts    = unassignedTrips + fleetAlerts + deniedInvoices

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

  // ── Universal Search ─────────────────────────────────────────────────────────
  const todayStr = new Date().toISOString().slice(0, 10)
  const q = searchQ.trim().toLowerCase()

  function close() { setSearchQ(''); setSearchOpen(false); setSearchCursor(-1) }

  const searchResults = q.length < 2 ? [] : [
    // Trips
    ...trips.filter(t =>
      t.id?.toLowerCase().includes(q)        ||
      t.patient?.toLowerCase().includes(q)   ||
      t.pickup?.toLowerCase().includes(q)    ||
      t.destination?.toLowerCase().includes(q)
    ).slice(0, 3).map(t => ({
      type: 'Trip', icon: <Car size={14}/>, iconBg: '#dbeeff', iconColor: '#1e6fa8',
      label: `${t.id} — ${t.patient}`,
      sub: `${t.date} · ${t.pickup?.split(',')[0]} → ${t.destination?.split(',')[0]}`,
      action: () => { navigate('/admin/trips', { state: { selectId: t.id } }); close() },
    })),
    // Dispatch — today's pending / confirmed / in-transit trips
    ...trips.filter(t =>
      t.date >= todayStr &&
      ['pending', 'confirmed', 'in-transit'].includes(t.status) &&
      (t.patient?.toLowerCase().includes(q) || t.id?.toLowerCase().includes(q) || t.driver?.toLowerCase().includes(q))
    ).slice(0, 2).map(t => ({
      type: 'Dispatch', icon: <MapPin size={14}/>, iconBg: '#ede9fe', iconColor: '#7c3aed',
      label: `${t.patient} · ${t.status}`,
      sub: `${t.date} ${t.time || ''} · ${t.driver || '⚠ Unassigned'}`,
      action: () => { navigate('/admin/dispatch', { state: { selectDate: t.date } }); close() },
    })),
    // Patients
    ...patients.filter(p =>
      p.id?.toLowerCase().includes(q)        ||
      p.name?.toLowerCase().includes(q)      ||
      p.phone?.includes(q)                   ||
      p.insurance?.toLowerCase().includes(q)
    ).slice(0, 3).map(p => ({
      type: 'Patient', icon: <Users size={14}/>, iconBg: '#d1fae5', iconColor: '#16a34a',
      label: p.name,
      sub: `${p.id} · ${p.insurance} · ${p.phone || 'No phone'}`,
      action: () => { navigate('/admin/patients', { state: { selectId: p.id } }); close() },
    })),
    // Drivers
    ...drivers.filter(d =>
      d.id?.toLowerCase().includes(q)      ||
      d.name?.toLowerCase().includes(q)    ||
      d.phone?.includes(q)                 ||
      d.vehicle?.toLowerCase().includes(q)
    ).slice(0, 2).map(d => ({
      type: 'Driver', icon: <UserCheck size={14}/>, iconBg: '#fef3c7', iconColor: '#d97706',
      label: d.name,
      sub: `${d.id} · ${d.status} · ${d.vehicle || 'No vehicle'}`,
      action: () => { navigate('/admin/drivers', { state: { selectId: d.id } }); close() },
    })),
    // Fleet
    ...vehicles.filter(v =>
      v.id?.toLowerCase().includes(q)    ||
      v.make?.toLowerCase().includes(q)  ||
      v.plate?.toLowerCase().includes(q) ||
      v.driver?.toLowerCase().includes(q)||
      v.type?.toLowerCase().includes(q)
    ).slice(0, 2).map(v => ({
      type: 'Fleet', icon: <Truck size={14}/>, iconBg: '#fee2e2', iconColor: '#ef4444',
      label: `${v.id} — ${v.make}`,
      sub: `${v.type} · ${v.status} · Plate: ${v.plate || '—'}`,
      action: () => { navigate('/admin/fleet', { state: { selectId: v.id } }); close() },
    })),
    // Billing / Invoices
    ...invoices.filter(i =>
      i.id?.toLowerCase().includes(q)     ||
      i.billTo?.toLowerCase().includes(q) ||
      i.status?.toLowerCase().includes(q)
    ).slice(0, 2).map(i => {
      const total = (i.lineItems || []).reduce((s, l) => s + l.amount, 0)
      return {
        type: 'Billing', icon: <CreditCard size={14}/>, iconBg: '#dbeeff', iconColor: '#1e6fa8',
        label: `${i.id} · ${i.billTo}`,
        sub: `${i.status} · $${total.toFixed(2)} · ${i.invoiceDate || ''}`,
        action: () => { navigate('/admin/billing', { state: { selectId: i.id } }); close() },
      }
    }),
  ]

  function handleSearchKey(e) {
    if (!searchOpen || searchResults.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setSearchCursor(c => Math.min(c + 1, searchResults.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSearchCursor(c => Math.max(c - 1, -1)) }
    if (e.key === 'Enter' && searchCursor >= 0) { e.preventDefault(); searchResults[searchCursor].action() }
    if (e.key === 'Escape') { setSearchOpen(false); setSearchCursor(-1) }
  }

  // ── Notifications ───────────────────────────────────────────────────────────
  const notifications = [
    unassignedTrips > 0 && {
      icon: <Calendar size={16} color="#d97706"/>,
      title: `${unassignedTrips} unassigned trip${unassignedTrips > 1 ? 's' : ''}`,
      sub: 'Upcoming trips with no driver assigned',
      path: '/admin/trips',
      color: '#fef3c7',
    },
    fleetAlerts > 0 && {
      icon: <AlertTriangle size={16} color="#ef4444"/>,
      title: `${fleetAlerts} vehicle${fleetAlerts > 1 ? 's' : ''} due for service`,
      sub: 'Service date reached or overdue',
      path: '/admin/fleet',
      color: '#fee2e2',
    },
    deniedInvoices > 0 && {
      icon: <FileX size={16} color="#8b5cf6"/>,
      title: `${deniedInvoices} denied invoice${deniedInvoices > 1 ? 's' : ''}`,
      sub: 'Require resubmission',
      path: '/admin/billing',
      color: '#ede9fe',
    },
  ].filter(Boolean)

  const initials = authUser?.email
    ? authUser.email.slice(0, 2).toUpperCase()
    : 'AD'
  const displayName = authUser?.email?.split('@')[0] || 'Admin'

  return (
    <div className={styles.layout}>
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`} aria-label="Admin navigation">
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
          <button className={styles.sidebarClose} onClick={() => setSidebarOpen(false)} aria-label="Close navigation">
            <X size={18} aria-hidden="true" />
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
            <div className={styles.userAvatar}>{initials}</div>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{displayName}</p>
              <p className={styles.userRole}>{authUser?.email || ''}</p>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} aria-label="Sign out">
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)} aria-label="Open navigation" aria-expanded={sidebarOpen}>
            <Menu size={20} aria-hidden="true" />
          </button>

          {/* ── Search ── */}
          <div className={styles.searchWrap} ref={searchRef} role="search">
            <Search size={16} className={styles.searchIcon} aria-hidden="true" />
            <input
              id="admin-search"
              type="search"
              aria-label="Universal search — trips, dispatch, patients, drivers, fleet, billing"
              placeholder="Search anything — trips, patients, drivers, invoices…"
              className={styles.searchInput}
              value={searchQ}
              aria-expanded={searchOpen && searchQ.length >= 2}
              aria-autocomplete="list"
              aria-controls="search-results"
              onChange={e => { setSearchQ(e.target.value); setSearchOpen(true); setSearchCursor(-1) }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={handleSearchKey}
            />
            <div
              id="search-results"
              role="listbox"
              aria-label="Search results"
              aria-live="polite"
              aria-atomic="true"
            >
              {searchOpen && searchQ.length >= 2 && (
                <div className={styles.searchDropdown}>
                  {searchResults.length === 0 ? (
                    <div className={styles.searchEmpty}>No results for "{searchQ}"</div>
                  ) : (
                    searchResults.map((r, i) => {
                      const isFirstOfType = i === 0 || searchResults[i - 1].type !== r.type
                      return (
                        <div key={i}>
                          {isFirstOfType && (
                            <div className={styles.searchGroupHeader}>{r.type}</div>
                          )}
                          <button
                            className={`${styles.searchResult} ${i === searchCursor ? styles.searchResultActive : ''}`}
                            onClick={r.action}
                            role="option"
                            aria-selected={i === searchCursor}
                          >
                            <span
                              className={styles.searchResultIcon}
                              aria-hidden="true"
                              style={{ background: r.iconBg, color: r.iconColor }}
                            >
                              {r.icon}
                            </span>
                            <span className={styles.searchResultBody}>
                              <span className={styles.searchResultLabel}>{r.label}</span>
                              <span className={styles.searchResultSub}>{r.sub}</span>
                            </span>
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          <div className={styles.topRight}>
            {/* ── Dispatch button → /admin/dispatch ── */}
            <Link to="/admin/dispatch" className={styles.dispatchBtn}>
              <Phone size={15} />
              <span>Dispatch</span>
            </Link>

            {/* ── Notifications ── */}
            <div className={styles.notifWrap} ref={notifRef}>
              <button
                className={styles.alertBtn}
                onClick={() => { setNotifOpen(o => !o); setUserOpen(false) }}
                aria-label={`Notifications${totalAlerts > 0 ? `, ${totalAlerts} alert${totalAlerts > 1 ? 's' : ''}` : ''}`}
                aria-expanded={notifOpen}
                aria-haspopup="true"
              >
                <Bell size={18} aria-hidden="true" />
                {totalAlerts > 0 && <span className={styles.alertDot} aria-hidden="true" />}
              </button>

              {notifOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownHeader}>
                    <span className={styles.dropdownTitle}>Notifications</span>
                    {totalAlerts > 0 && (
                      <span className={styles.dropdownBadge}>{totalAlerts}</span>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className={styles.dropdownEmpty}>
                      <Bell size={20} style={{opacity:0.3}}/>
                      <span>All clear — no alerts</span>
                    </div>
                  ) : (
                    notifications.map((n, i) => (
                      <Link
                        key={i}
                        to={n.path}
                        className={styles.notifItem}
                        style={{ background: n.color }}
                        onClick={() => setNotifOpen(false)}
                      >
                        <span className={styles.notifItemIcon}>{n.icon}</span>
                        <span className={styles.notifItemBody}>
                          <span className={styles.notifItemTitle}>{n.title}</span>
                          <span className={styles.notifItemSub}>{n.sub}</span>
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* ── User menu ── */}
            <div className={styles.userMenuWrap} ref={userRef}>
              <button
                className={styles.topUser}
                onClick={() => { setUserOpen(o => !o); setNotifOpen(false) }}
                aria-label={`User menu for ${displayName}`}
                aria-expanded={userOpen}
                aria-haspopup="true"
              >
                <div className={styles.topUserAvatar} aria-hidden="true">{initials}</div>
                <ChevronDown size={14} className={userOpen ? styles.chevronUp : ''} aria-hidden="true" />
              </button>

              {userOpen && (
                <div className={styles.dropdown} style={{right:0,minWidth:'220px'}}>
                  <div className={styles.dropdownHeader}>
                    <div className={styles.userMenuInfo}>
                      <div className={styles.userMenuAvatar}>{initials}</div>
                      <div>
                        <p className={styles.userMenuName}>{displayName}</p>
                        <p className={styles.userMenuEmail}>{authUser?.email}</p>
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/admin/settings"
                    className={styles.dropdownItem}
                    onClick={() => setUserOpen(false)}
                  >
                    <Settings size={15}/> Settings
                  </Link>
                  <Link
                    to="/admin/settings"
                    className={styles.dropdownItem}
                    onClick={() => setUserOpen(false)}
                  >
                    <User size={15}/> Profile
                  </Link>
                  <div className={styles.dropdownDivider} />
                  <button className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`} onClick={handleLogout}>
                    <LogOut size={15}/> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main id="main-content" className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
