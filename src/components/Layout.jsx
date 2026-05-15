import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="sidebar-logo" aria-hidden="true">
              LM
            </span>
            <div>
              <h1>License Manager</h1>
            </div>
          </div>
          <p className="sidebar-meta">{user?.full_name || user?.username}</p>
        </div>

        <nav>
          <ul className="sidebar-nav">
            <li>
              <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/licenses"
                className={location.pathname === '/licenses' ? 'active' : ''}
              >
                Licenses
              </Link>
            </li>
            <li>
              <Link
                to="/customers"
                className={location.pathname === '/customers' ? 'active' : ''}
              >
                Customers
              </Link>
            </li>
            <li>
              <a href="#" className="nav-logout" onClick={handleLogout}>
                Logout
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
