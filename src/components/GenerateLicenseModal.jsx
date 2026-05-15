import { useState } from 'react'

export default function GenerateLicenseModal({ onClose, onGenerate }) {
  const [formData, setFormData] = useState({
    license_type: 'full',
    customer_id: '',
    expires_days: '',
    max_admins: '',
    max_computers: '',
    hardware_id: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = {
        license_type: formData.license_type,
        customer_id: formData.customer_id || undefined,
        expires_days: formData.expires_days ? parseInt(formData.expires_days) : undefined,
        max_admins: formData.max_admins ? parseInt(formData.max_admins) : undefined,
        max_computers: formData.max_computers ? parseInt(formData.max_computers) : undefined,
        hardware_id: formData.hardware_id || undefined,
      }

      await onGenerate(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate license')
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Generate New License</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger">
                {error}
              </div>
            )}

            <div className="form-group">
              <label>License Type *</label>
              <select 
                name="license_type"
                value={formData.license_type}
                onChange={handleChange}
                required
              >
                <option value="demo">Demo</option>
                <option value="full">Full</option>
                <option value="enterprise">Enterprise</option>
                <option value="trial">Trial</option>
              </select>
            </div>

            <div className="form-group">
              <label>Customer ID</label>
              <input
                type="text"
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                placeholder="e.g., ACME-Corp-2024"
              />
            </div>

            <div className="form-group">
              <label>Expires In (Days)</label>
              <input
                type="number"
                name="expires_days"
                value={formData.expires_days}
                onChange={handleChange}
                placeholder="Leave empty for no expiration"
                min="1"
              />
            </div>

            <div className="form-group">
              <label>Max Admins</label>
              <input
                type="number"
                name="max_admins"
                value={formData.max_admins}
                onChange={handleChange}
                placeholder="Leave empty for unlimited"
                min="1"
              />
            </div>

            <div className="form-group">
              <label>Max Computers</label>
              <input
                type="number"
                name="max_computers"
                value={formData.max_computers}
                onChange={handleChange}
                placeholder="Leave empty for unlimited"
                min="1"
              />
            </div>

            <div className="form-group">
              <label>Hardware ID (Hardware Binding)</label>
              <input
                type="text"
                name="hardware_id"
                value={formData.hardware_id}
                onChange={handleChange}
                placeholder="Leave empty for no hardware binding"
              />
              <small className="form-hint">Binds license to specific hardware</small>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate License'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
