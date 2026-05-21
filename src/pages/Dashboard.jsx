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

  const healthScore = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0
  const attentionCount = stats.expired + stats.revoked
  const healthTone = healthScore >= 75 ? 'Strong' : healthScore >= 45 ? 'Watch' : 'Critical'

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

      {error && <div className="alert alert-danger">{error}</div>}
      
      <header className="page-header dashboard-hero">
        <div className="hero-copy">
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

      <div className="command-grid">
        <section className="license-orb-card">
          <div className="license-orb-copy">
            <span className="section-kicker">Fleet health</span>
            <h2>{healthTone} license posture</h2>
            <p>
              {attentionCount > 0
                ? `${attentionCount} records need review across expiration or revocation events.`
                : 'All tracked licenses are currently in a healthy operational state.'}
            </p>
          </div>
          <div
            className="license-orb"
            style={{ '--health-score': `${healthScore * 3.6}deg` }}
            aria-label={`License health score ${healthScore} percent`}
          >
            <span>{healthScore}%</span>
            <small>healthy</small>
          </div>
        </section>

        <section className="signal-board" aria-label="License signal summary">
          <div className="signal-card signal-total">
            <div>
              <span className="metric-label">Total keys</span>
              <strong>{stats.total}</strong>
            </div>
          </div>
          <div className="signal-card signal-active">
            <div>
              <span className="metric-label">Active</span>
              <strong>{stats.active}</strong>
            </div>
          </div>
          <div className="signal-card signal-warning">
            <div>
              <span className="metric-label">Expired</span>
              <strong>{stats.expired}</strong>
            </div>
          </div>
          <div className="signal-card signal-danger">
            <div>
              <span className="metric-label">Revoked</span>
              <strong>{stats.revoked}</strong>
            </div>
          </div>
        </section>
      </div>

      <div className="card activity-card">
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
                {recentLicenses.map((license, index) => (
                  <tr key={license.id}>
                    <td data-label="ID">
                      <span className="activity-index">{String(index + 1).padStart(2, '0')}</span>
                      #{license.id}
                    </td>
                    <td data-label="Customer">
                      <div className="record-title">
                        <strong>{license.customer_id || 'Unassigned'}</strong>
                        <span>Entitlement record</span>
                      </div>
                    </td>
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
