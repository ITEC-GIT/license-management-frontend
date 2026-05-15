import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function NavIconDashboard() {
  return (
    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    </svg>
  )
}

function NavIconKey() {
  return (
    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H3v-3.657l.857-.857m14.857-14.857L18.75 9.75l-4.5 4.5m0 0-4.5 4.5"
      />
    </svg>
  )
}

function NavIconUsers() {
  return (
    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.295-2.16-.81-3.095M15 19.128v.106A12.318 12.318 0 016.5 21c-1.98 0-3.812-.4-5.483-1.126M18 9.5a3 3 0 100-6 3 3 0 000 6zm0 0a9.38 9.38 0 019.375 9.375c0 .063-.004.126-.011.188M6 9.5a3 3 0 106 0 3 3 0 00-6 0zm9 9.375v-.011"
      />
    </svg>
  )
}

function NavIconLogout() {
  return (
    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m-3-6 3 3m0 0 3-3m-3 3h12.75"
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
        <div className="main-content-inner fade-in-up">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
