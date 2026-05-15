export default function ViewLicenseModal({ license, onClose }) {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const licenseData = JSON.parse(license.license_key)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>License details · #{license.id}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-detail-block">
            <h3 className="modal-section-title">Basic information</h3>
            <table className="kv-table">
              <tbody>
                <tr>
                  <td>License ID</td>
                  <td>#{license.id}</td>
                </tr>
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
                Copy
              </button>
              <pre>{JSON.stringify(licenseData, null, 2)}</pre>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
