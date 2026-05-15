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
          <h2>License Details #{license.id}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '10px' }}>Basic Information</h3>
            <table style={{ width: '100%' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: '500' }}>License ID:</td>
                  <td style={{ padding: '8px 0' }}>#{license.id}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: '500' }}>Type:</td>
                  <td style={{ padding: '8px 0' }}>
                    <span className="badge badge-info">{license.license_type}</span>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: '500' }}>Customer ID:</td>
                  <td style={{ padding: '8px 0' }}>{license.customer_id || 'N/A'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: '500' }}>Issued:</td>
                  <td style={{ padding: '8px 0' }}>{new Date(license.issued_at).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: '500' }}>Expires:</td>
                  <td style={{ padding: '8px 0' }}>
                    {license.expires_at 
                      ? new Date(license.expires_at).toLocaleString() 
                      : 'Never'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: '500' }}>Max Admins:</td>
                  <td style={{ padding: '8px 0' }}>{license.max_admins || 'Unlimited'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: '500' }}>Max Computers:</td>
                  <td style={{ padding: '8px 0' }}>{license.max_computers || 'Unlimited'}</td>
                </tr>
                {license.hardware_id && (
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: '500' }}>Hardware ID:</td>
                    <td style={{ padding: '8px 0', fontFamily: 'monospace', fontSize: '12px' }}>
                      {license.hardware_id}
                    </td>
                  </tr>
                )}
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: '500' }}>Status:</td>
                  <td style={{ padding: '8px 0' }}>
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

          <div style={{ marginTop: '20px' }}>
            <h3 style={{ marginBottom: '10px' }}>License JSON</h3>
            <div style={{ 
              background: '#f5f5f5', 
              padding: '15px', 
              borderRadius: '4px',
              position: 'relative',
              maxHeight: '300px',
              overflow: 'auto'
            }}>
              <button 
                onClick={() => copyToClipboard(license.license_key)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  padding: '5px 10px',
                  fontSize: '12px',
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                📋 Copy
              </button>
              <pre style={{ 
                margin: 0, 
                fontSize: '12px',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {JSON.stringify(licenseData, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
