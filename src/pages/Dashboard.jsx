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
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    setError('')
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

      const recent = [...licenses]
        .sort((a, b) => new Date(b.issued_at) - new Date(a.issued_at))
        .slice(0, 5)
      setRecentLicenses(recent)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
      setError('Unable to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (license) => {
    if (license.revoked_at) return <span className="badge badge-danger">Revoked</span>
    if (license.expires_at && new Date(license.expires_at) <= new Date()) {
      return <span className="badge badge-warning">Expired</span>
    }
    return <span className="badge badge-success">Active</span>
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
          <span className="eyebrow">Command overview</span>
          <h1 className="page-title">License Operations Dashboard</h1>
          <p className="page-subtitle">
            Monitor license health, lifecycle movement, and customer entitlement activity from one secure workspace.
          </p>
          <div className="hero-actions" aria-label="Dashboard highlights">
            <span>{stats.active} active</span>
            <span>{stats.expired} expired</span>
            <span>{stats.revoked} revoked</span>
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

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card primary">
          <span className="stat-icon">TTL</span>
          <h3>Total Licenses</h3>
          <div className="stat-value">{stats.total}</div>
        </div>

        <div className="stat-card success">
          <span className="stat-icon">ACT</span>
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
          <div>
            <span className="section-kicker">Latest activity</span>
            <h2>Recent licenses</h2>
          </div>
        </div>

        {recentLicenses.length === 0 ? (
          <div className="empty-state">
            <p>No licenses found yet. Generate the first license to start tracking activity.</p>
          </div>
        ) : (
          <div className="table-container responsive-table">
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
                    <td data-label="ID">#{license.id}</td>
                    <td data-label="Customer">{license.customer_id || 'N/A'}</td>
                    <td data-label="Type">
                      <span className="badge badge-info">{license.license_type}</span>
                    </td>
                    <td data-label="Issued">{new Date(license.issued_at).toLocaleDateString()}</td>
                    <td data-label="Expires">
                      {license.expires_at
                        ? new Date(license.expires_at).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td data-label="Status">{getStatusBadge(license)}</td>
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
