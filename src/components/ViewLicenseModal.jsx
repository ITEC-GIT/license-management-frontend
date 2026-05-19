import { useState } from 'react'

const visibleTabLabels = {
  dashboard: 'Dashboard',
  licenses: 'Licenses',
  customers: 'Customers',
}

const normalizeTabs = (tabs) => {
  if (Array.isArray(tabs)) return tabs
  if (!tabs) return []

  return String(tabs)
    .split(',')
    .map(tab => tab.trim())
    .filter(Boolean)
}

export default function ViewLicenseModal({ license, onClose }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  let licenseData = null
  try {
    licenseData = JSON.parse(license.license_key)
  } catch (error) {
    licenseData = null
  }

  const selectedTabs = normalizeTabs(
    license.selected_tabs ??
    license.visible_tabs ??
    license.allowed_tabs ??
    licenseData?.selected_tabs ??
    licenseData?.visible_tabs ??
    licenseData?.allowed_tabs
  )
  const selectedTabsLabel = selectedTabs.length > 0
    ? selectedTabs.map(tab => visibleTabLabels[tab] || tab).join(', ')
    : license.license_type === 'full'
      ? 'All tabs'
      : 'No tabs selected'

  return (
    <div className="modal-overlay view-license-overlay" onClick={onClose}>
      <div className="modal view-license-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>License details · #{license.id}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="license-seal-card">
            <div className="license-seal" aria-hidden="true">
              <span>{license.license_type?.slice(0, 1)?.toUpperCase() || 'L'}</span>
            </div>
            <div>
              <h3>{license.customer_id || 'Unassigned license'}</h3>
              <p>
                {license.hardware_id
                  ? 'This entitlement is bound to a hardware fingerprint.'
                  : 'This entitlement is currently floating and not hardware-bound.'}
              </p>
            </div>
          </div>

          <div className="modal-detail-block">
            <table className="kv-table">
              <tbody>
                <tr>
                  <td>Type</td>
                  <td>
                    <span className="badge badge-info">{license.license_type}</span>
                  </td>
                </tr>
                <tr>
                  <td>Customer ID</td>
                  <td>{license.customer_id || 'N/A'}</td>
                </tr>
                <tr>
                  <td>Issued</td>
                  <td>{new Date(license.issued_at).toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Expires</td>
                  <td>
                    {license.expires_at
                      ? new Date(license.expires_at).toLocaleString()
                      : 'Never'}
                  </td>
                </tr>
                <tr>
                  <td>Max admins</td>
                  <td>{license.max_admins || 'Unlimited'}</td>
                </tr>
                <tr>
                  <td>Max computers</td>
                  <td>{license.max_computers || 'Unlimited'}</td>
                </tr>
                {license.hardware_id && (
                  <tr>
                    <td>Hardware ID</td>
                    <td className="cell-mono">{license.hardware_id}</td>
                  </tr>
                )}
                <tr>
                  <td>Tabs</td>
                  <td>{selectedTabsLabel}</td>
                </tr>
                <tr>
                  <td>Status</td>
                  <td>
                    {license.revoked_at ? (
                      <span className="badge badge-danger">
                        Revoked on {new Date(license.revoked_at).toLocaleDateString()}
                      </span>
                    ) : license.expires_at && new Date(license.expires_at) <= new Date() ? (
                      <span className="badge badge-warning">Expired</span>
                    ) : (
                      <span className="badge badge-success">Active</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="modal-detail-block modal-detail-block--spaced">
            <h3 className="modal-section-title">License JSON</h3>
            <div className="license-json-block">
              <button
                type="button"
                className="btn-copy-json"
                onClick={() => copyToClipboard(license.license_key)}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
              <pre>
                {licenseData
                  ? JSON.stringify(licenseData, null, 2)
                  : license.license_key}
              </pre>
            </div>
            {copied && <p className="copy-feedback">License payload copied.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
