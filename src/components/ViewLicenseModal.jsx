import { useState } from 'react'
import { getLicensePayload, getLicenseStatus } from '../utils/licenses'

const visibleTabLabels = {
  dashboard: 'Dashboard',
  licenses: 'Licenses',
  customers: 'Customers',
}

const formatDate = (value) => {
  if (!value) return 'Never'
  return new Date(value).toLocaleString()
}

const StatusBadge = ({ status, revokedAt }) => {
  if (status === 'revoked') {
    return (
      <span className="badge badge-danger">
        Revoked{revokedAt ? ` · ${new Date(revokedAt).toLocaleDateString()}` : ''}
      </span>
    )
  }
  if (status === 'expired') return <span className="badge badge-warning">Expired</span>
  if (status === 'active') return <span className="badge badge-success">Active</span>
  return <span className="badge badge-info">Inactive</span>
}

export default function ViewLicenseModal({ license, onClose }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const licenseData = getLicensePayload(license)
  const selectedTabs = Array.isArray(license.selected_tabs) ? license.selected_tabs : []
  const status = getLicenseStatus(license)
  const selectedTabsLabel = selectedTabs.length > 0
    ? selectedTabs.map(tab => visibleTabLabels[tab] || tab).join(', ')
    : license.license_type === 'full'
      ? 'All tabs'
      : 'None'
  const payloadText = licenseData
    ? JSON.stringify(licenseData, null, 2)
    : license.license_key

  const fields = [
    { label: 'Type', value: <span className="badge badge-info">{license.license_type}</span> },
    { label: 'Status', value: <StatusBadge status={status} revokedAt={license.revoked_at} /> },
    { label: 'Issued', value: formatDate(license.issued_at) },
    { label: 'Expires', value: formatDate(license.expires_at) },
    { label: 'Max admins', value: license.max_admins || 'Unlimited' },
    { label: 'Max computers', value: license.max_computers || 'Unlimited' },
    { label: 'Hardware ID', value: license.hardware_id || 'Not bound', wide: true, mono: Boolean(license.hardware_id) },
    { label: 'Tabs', value: selectedTabsLabel, wide: true },
  ]

  return (
    <div className="modal-overlay view-license-overlay" onClick={onClose}>
      <div className="modal view-license-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="modal-eyebrow">License #{license.id}</span>
            <h2>{license.customer_name || 'Unassigned'}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body view-license-body">
          <dl className="view-license-fields">
            {fields.map((field) => (
              <div
                key={field.label}
                className={`view-license-field${field.wide ? ' view-license-field-wide' : ''}`}
              >
                <dt>{field.label}</dt>
                <dd className={field.mono ? 'cell-mono' : undefined}>{field.value}</dd>
              </div>
            ))}
          </dl>

          <section className="view-license-payload" aria-label="License payload">
            <div className="view-license-payload-bar">
              <h3>Payload</h3>
              <button
                type="button"
                className="btn-copy-json"
                onClick={() => copyToClipboard(license.license_key)}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre>{payloadText}</pre>
          </section>
        </div>
      </div>
    </div>
  )
}
