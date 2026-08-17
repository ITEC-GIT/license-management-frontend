import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function NavIcon({ children }) {
  return (
    <svg
      className="nav-icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

function NavIconDashboard() {
  return (
    <NavIcon>
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </NavIcon>
  )
}

function NavIconKey() {
  return (
    <NavIcon>
      <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
      <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
    </NavIcon>
  )
}

function NavIconUsers() {
  return (
    <NavIcon>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </NavIcon>
  )
}

function NavIconLogout() {
  return (
    <NavIcon>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </NavIcon>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const displayName = user?.full_name || user?.username || 'Administrator'

  const handleLogout = (e) => {
    e.preventDefault()
    logout()
    navigate('/login')
  }

  const navLinkClass = ({ isActive }) => (isActive ? 'active' : undefined)

  return (
    <div className="app">
      <div className="app-orb app-orb-one" aria-hidden="true" />
      <div className="app-orb app-orb-two" aria-hidden="true" />
      <aside className="sidebar" aria-label="Main navigation">
        <div className="sidebar-glow" aria-hidden="true" />
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="sidebar-logo" aria-hidden="true">
              <span className="sidebar-logo-inner">LM</span>
            </span>
            <div>
              <h1>License Manager</h1>
              <span className="sidebar-product-tag">Enterprise Console</span>
            </div>
          </div>
        </div>

        <nav>
          <ul className="sidebar-nav">
            <li>
              <NavLink to="/" end className={navLinkClass}>
                <NavIconDashboard />
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/licenses" className={navLinkClass}>
                <NavIconKey />
                <span>Licenses</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/customers" className={navLinkClass}>
                <NavIconUsers />
                <span>Customers</span>
              </NavLink>
            </li>
            <li>
              <a href="#" className="nav-logout" onClick={handleLogout}>
                <NavIconLogout />
                <span>Logout</span>
              </a>
            </li>
          </ul>
        </nav>

        <p className="sidebar-meta sidebar-meta-bottom">
          <span className="sidebar-user-label">Signed in as</span>
          <span className="sidebar-user-name">{displayName}</span>
        </p>
      </aside>

      <main className="main-content">
        <div className="main-content-inner fade-in-up">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
