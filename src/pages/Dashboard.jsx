import { useState, useEffect } from 'react'
import { getLicenses } from '../services/api'

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    revoked: 0
  })
  const [recentLicenses, setRecentLicenses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const response = await getLicenses()
      const licenses = response.data

      // Calculate stats
      const now = new Date()
      const active = licenses.filter(l =>
        l.is_active && (!l.expires_at || new Date(l.expires_at) > now)
      ).length
      const expired = licenses.filter(l =>
        l.expires_at && new Date(l.expires_at) <= now && !l.revoked_at
      ).length
      const revoked = licenses.filter(l => l.revoked_at).length

      setStats({
        total: licenses.length,
        active,
        expired,
        revoked
      })

      // Get recent licenses
      setRecentLicenses(licenses.slice(0, 5))
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div>
      <header className="page-header dashboard-hero">
        <div className="hero-copy">
          <span className="eyebrow">License intelligence</span>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Monitor license health, lifecycle movement, and recent activation activity from one refined workspace.
          </p>
          <div className="hero-actions" aria-label="Dashboard highlights">
            <span>Secure keys</span>
            <span>Lifecycle tracking</span>
            <span>Customer insights</span>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-ring" />
          <div className="hero-card hero-card-main">
            <span>Active</span>
            <strong>{stats.active}</strong>
          </div>
          <div className="hero-card hero-card-mini">
            <span>Total</span>
            <strong>{stats.total}</strong>
          </div>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card primary">
          <span className="stat-icon">#</span>
          <h3>Total Licenses</h3>
          <div className="stat-value">{stats.total}</div>
        </div>

        <div className="stat-card success">
          <span className="stat-icon">OK</span>
          <h3>Active Licenses</h3>
          <div className="stat-value">{stats.active}</div>
        </div>

        <div className="stat-card warning">
          <span className="stat-icon">!</span>
          <h3>Expired Licenses</h3>
          <div className="stat-value">{stats.expired}</div>
        </div>

        <div className="stat-card danger">
          <span className="stat-icon">X</span>
          <h3>Revoked Licenses</h3>
          <div className="stat-value">{stats.revoked}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Recent Licenses</h2>
        </div>

        {recentLicenses.length === 0 ? (
          <div className="empty-state">
            <p>No licenses found. Create your first license!</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Issued</th>
                  <th>Expires</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentLicenses.map((license) => (
                  <tr key={license.id}>
                    <td>#{license.id}</td>
                    <td>{license.customer_id || 'N/A'}</td>
                    <td>
                      <span className="badge badge-info">{license.license_type}</span>
                    </td>
                    <td>{new Date(license.issued_at).toLocaleDateString()}</td>
                    <td>
                      {license.expires_at
                        ? new Date(license.expires_at).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td>
                      {license.revoked_at ? (
                        <span className="badge badge-danger">Revoked</span>
                      ) : license.expires_at &&
                        new Date(license.expires_at) <= new Date() ? (
                        <span className="badge badge-warning">Expired</span>
                      ) : (
                        <span className="badge badge-success">Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
