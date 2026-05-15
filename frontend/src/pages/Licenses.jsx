import { useState, useEffect } from 'react'
import { getLicenses, generateLicense, revokeLicense } from '../services/api'
import GenerateLicenseModal from '../components/GenerateLicenseModal'
import ViewLicenseModal from '../components/ViewLicenseModal'

export default function Licenses() {
  const [licenses, setLicenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [viewLicense, setViewLicense] = useState(null)
  const [filter, setFilter] = useState('all') // all, active, expired, revoked

  useEffect(() => {
    loadLicenses()
  }, [])

  const loadLicenses = async () => {
    try {
      const response = await getLicenses()
      setLicenses(response.data)
    } catch (error) {
      console.error('Failed to load licenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async (data) => {
    try {
      await generateLicense(data)
      await loadLicenses()
      setShowGenerateModal(false)
    } catch (error) {
      throw error
    }
  }

  const handleRevoke = async (id) => {
    if (!confirm('Are you sure you want to revoke this license?')) {
      return
    }

    try {
      await revokeLicense(id, 'Revoked by admin')
      await loadLicenses()
    } catch (error) {
      alert('Failed to revoke license')
    }
  }

  const handleDownload = (license) => {
    // Create a blob with the license JSON
    const blob = new Blob([license.license_key], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `license_${license.id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const filteredLicenses = licenses.filter(license => {
    if (filter === 'all') return true
    const now = new Date()
    if (filter === 'active') {
      return license.is_active && (!license.expires_at || new Date(license.expires_at) > now) && !license.revoked_at
    }
    if (filter === 'expired') {
      return license.expires_at && new Date(license.expires_at) <= now && !license.revoked_at
    }
    if (filter === 'revoked') {
      return license.revoked_at
    }
    return true
  })

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading licenses...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>Licenses</h2>
          <button 
            className="btn btn-primary"
            onClick={() => setShowGenerateModal(true)}
          >
            + Generate License
          </button>
        </div>

        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <button 
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({licenses.length})
          </button>
          <button 
            className={`btn btn-sm ${filter === 'active' ? 'btn-success' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button 
            className={`btn btn-sm ${filter === 'expired' ? 'btn-warning' : ''}`}
            onClick={() => setFilter('expired')}
          >
            Expired
          </button>
          <button 
            className={`btn btn-sm ${filter === 'revoked' ? 'btn-danger' : ''}`}
            onClick={() => setFilter('revoked')}
          >
            Revoked
          </button>
        </div>

        {filteredLicenses.length === 0 ? (
          <div className="empty-state">
            <p>No licenses found</p>
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
                  <th>Hardware ID</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLicenses.map((license) => (
                  <tr key={license.id}>
                    <td>#{license.id}</td>
                    <td>{license.customer_id || 'N/A'}</td>
                    <td>
                      <span className="badge badge-info">
                        {license.license_type}
                      </span>
                    </td>
                    <td>{new Date(license.issued_at).toLocaleDateString()}</td>
                    <td>
                      {license.expires_at 
                        ? new Date(license.expires_at).toLocaleDateString() 
                        : 'Never'}
                    </td>
                    <td>
                      {license.hardware_id 
                        ? <span title={license.hardware_id}>🔒 {license.hardware_id.slice(0, 8)}...</span>
                        : 'N/A'}
                    </td>
                    <td>
                      {license.revoked_at ? (
                        <span className="badge badge-danger">Revoked</span>
                      ) : license.expires_at && new Date(license.expires_at) <= new Date() ? (
                        <span className="badge badge-warning">Expired</span>
                      ) : (
                        <span className="badge badge-success">Active</span>
                      )}
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => setViewLicense(license)}
                        style={{ marginRight: '5px' }}
                      >
                        View
                      </button>
                      <button 
                        className="btn btn-sm btn-success"
                        onClick={() => handleDownload(license)}
                        style={{ marginRight: '5px' }}
                      >
                        Download
                      </button>
                      {!license.revoked_at && (
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRevoke(license.id)}
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showGenerateModal && (
        <GenerateLicenseModal
          onClose={() => setShowGenerateModal(false)}
          onGenerate={handleGenerate}
        />
      )}

      {viewLicense && (
        <ViewLicenseModal
          license={viewLicense}
          onClose={() => setViewLicense(null)}
        />
      )}
    </div>
  )
}
