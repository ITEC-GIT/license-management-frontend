import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function NavIconDashboard() {
  return (
    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 5.5A1.5 1.5 0 015.5 4h13A1.5 1.5 0 0120 5.5v13a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 18.5v-13Z"
      />
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 10h16M9 20V10"
      />
    </svg>
  )
}

function NavIconKey() {
  return (
    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 4.5h9l3 3v12H6v-15Z"
      />
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 4.5V8h3M9 9.5h4M9 12.5h3"
      />
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.5 17.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-1.3-.4-.5 2.4 1.8-1 1.8 1-.5-2.4"
      />
    </svg>
  )
}

function NavIconUsers() {
  return (
    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 7V5.8A1.8 1.8 0 0110.8 4h2.4A1.8 1.8 0 0115 5.8V7"
      />
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.5 7h13A1.5 1.5 0 0120 8.5v8A2.5 2.5 0 0117.5 19h-11A2.5 2.5 0 014 16.5v-8A1.5 1.5 0 015.5 7Z"
      />
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 12h16"
      />
    </svg>
  )
}

function NavIconLogout() {
  return (
    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4v8"
      />
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.1 7.6a7 7 0 1 0 9.8 0"
      />
    </svg>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

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
            </div>
          </div>
          <p className="sidebar-meta">
            <span className="sidebar-user-label">Signed in as</span>
            <span className="sidebar-user-name">{user?.full_name || user?.username}</span>
          </p>
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
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
