import { useState, useEffect, useRef } from 'react'
import { getLicenses, generateLicense, revokeLicense } from '../services/api'
import GenerateLicenseModal from '../components/GenerateLicenseModal'
import PaginationControls from '../components/PaginationControls'
import ViewLicenseModal from '../components/ViewLicenseModal'
import useAdaptivePageSize from '../hooks/useAdaptivePageSize'
import { formatHardwareId, getLicensesList, getLicenseStatus } from '../utils/licenses'

const LICENSES_MAX_PAGE_SIZE = 50

export default function Licenses() {
  const tableContainerRef = useRef(null)
  const [licenses, setLicenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [viewLicense, setViewLicense] = useState(null)
  const [filter, setFilter] = useState('all') // all, active, expired, revoked
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState('')

  useEffect(() => {
    loadLicenses()
  }, [])

  const loadLicenses = async () => {
    setError('')
    try {
      const response = await getLicenses()
      setLicenses(getLicensesList(response.data))
    } catch (error) {
      console.error('Failed to load licenses:', error)
      setError('Unable to load licenses. Please refresh or try again later.')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async (data) => {
    try {
      await generateLicense(data)
      await loadLicenses()
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
      setError('Failed to revoke license. Please try again.')
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

  const statusCounts = licenses.reduce(
    (acc, license) => {
      const status = getLicenseStatus(license)
      acc[status] = (acc[status] || 0) + 1
      return acc
    },
    { active: 0, expired: 0, revoked: 0, inactive: 0 }
  )

  const filteredLicenses = licenses.filter((license) => {
    if (filter === 'all') return true
    return getLicenseStatus(license) === filter
  })
  const pageSize = useAdaptivePageSize({
    containerRef: tableContainerRef,
    totalItems: filteredLicenses.length,
    maxRows: LICENSES_MAX_PAGE_SIZE,
    desktopFallbackRowHeight: 56,
    mobileFallbackRowHeight: 172,
    dependencies: [filter],
  })
  const totalPages = Math.max(1, Math.ceil(filteredLicenses.length / pageSize))
  const paginatedLicenses = filteredLicenses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [filter])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const getStatusBadge = (license) => {
    const status = getLicenseStatus(license)
    if (status === 'revoked') return <span className="badge badge-danger">Revoked</span>
    if (status === 'expired') return <span className="badge badge-warning">Expired</span>
    if (status === 'active') return <span className="badge badge-success">Active</span>
    return <span className="badge badge-info">Inactive</span>
  }

  const emptyMessage = () => {
    if (licenses.length === 0) {
      return 'No licenses exist yet. Generate the first license to begin tracking customer access.'
    }
    return `No ${filter} licenses match the current filter.`
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading licenses...</p>
      </div>
    )
  }

  return (
    <div className="licenses-page">

      {error && <div className="alert alert-danger">{error}</div>}

      <section className="license-ribbon" aria-label="License lifecycle overview">
        <div className="ribbon-copy">
          <h2>Every entitlement, from issue to enforcement</h2>
          <p>Track operational state, device binding, and customer ownership without leaving the registry.</p>
        </div>
        <div className="ribbon-track" aria-hidden="true">
          <span className="ribbon-node active-node">
            <strong>{statusCounts.active}</strong>
            Active
          </span>
          <span className="ribbon-line" />
          <span className="ribbon-node warning-node">
            <strong>{statusCounts.expired}</strong>
            Expired
          </span>
          <span className="ribbon-line" />
          <span className="ribbon-node danger-node">
            <strong>{statusCounts.revoked}</strong>
            Revoked
          </span>
        </div>
      </section>

      <div className="card registry-card">
        <div className="filter-toolbar">
          <button
            type="button"
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({licenses.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filter === 'active' ? 'btn-success' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({statusCounts.active})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filter === 'expired' ? 'btn-warning' : ''}`}
            onClick={() => setFilter('expired')}
          >
            Expired ({statusCounts.expired})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filter === 'revoked' ? 'btn-danger' : ''}`}
            onClick={() => setFilter('revoked')}
          >
            Revoked ({statusCounts.revoked})
          </button>

          <button
          type="button"
          className="btn btn-primary license-generate-action"
          onClick={() => setShowGenerateModal(true)}
        >
          Generate license
        </button>
        </div>

        {filteredLicenses.length === 0 ? (
          <div className="empty-state">
            <p>{emptyMessage()}</p>
          </div>
        ) : (
          <div className="table-container responsive-table" ref={tableContainerRef}>
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
                {paginatedLicenses.map((license) => (
                  <tr key={license.id} className={`registry-row row-${getLicenseStatus(license)}`}>
                    <td data-label="ID">
                      <span className="license-id-token">{license.id}</span>
                    </td>
                    <td data-label="Customer">
                      <div className="record-title">
                        <strong>{license.customer_name || 'Unassigned'}</strong>
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
                    <td className="cell-mono" data-label="Hardware ID">
                      {license.hardware_id ? (
                        <span title={String(license.hardware_id)}>
                          {formatHardwareId(license.hardware_id)}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td data-label="Status">{getStatusBadge(license)}</td>
                    <td className="td-actions" data-label="Actions">
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => setViewLicense(license)}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-success"
                        onClick={() => handleDownload(license)}
                      >
                        Download
                      </button>
                      {!license.revoked_at && (
                        <button
                          type="button"
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
            <PaginationControls
              currentPage={currentPage}
              totalItems={filteredLicenses.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              itemLabel="licenses"
            />
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
        <ViewLicenseModal license={viewLicense} onClose={() => setViewLicense(null)} />
      )}
    </div>
  )
}
