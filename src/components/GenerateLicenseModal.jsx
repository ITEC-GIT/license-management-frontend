import { useState } from 'react'

const steps = [
  {
    title: 'License',
    description: 'Choose the license edition and attach an optional customer reference.',
  },
  {
    title: 'Limits',
    description: 'Set expiration and usage limits, or leave fields blank for unrestricted values.',
  },
  {
    title: 'Review',
    description: 'Confirm the license payload before generating it.',
  },
]

const licenseTypes = [
  {
    value: 'demo',
    label: 'Demo',
    description: 'Short-lived access for product walkthroughs.',
    glyph: 'D',
  },
  {
    value: 'full',
    label: 'Full',
    description: 'Standard production license for a single customer.',
    glyph: 'F',
  },
  {
    value: 'enterprise',
    label: 'Enterprise',
    description: 'Expanded deployment with higher capacity needs.',
    glyph: 'E',
  },
  {
    value: 'trial',
    label: 'Trial',
    description: 'Time-boxed evaluation before purchase.',
    glyph: 'T',
  },
]

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
  const [currentStep, setCurrentStep] = useState(0)

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1
  const isDirty =
    formData.license_type !== 'full' ||
    ['customer_id', 'expires_days', 'max_admins', 'max_computers', 'hardware_id'].some(
      field => Boolean(formData[field])
    )

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const goToStep = (stepIndex) => {
    setError('')
    setCurrentStep(stepIndex)
  }

  const handleNext = () => {
    setError('')
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
  }

  const handlePrevious = () => {
    setError('')
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const requestClose = () => {
    if (loading) return
    if (isDirty && !confirm('Discard this license draft?')) return
    onClose()
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

  const reviewItems = [
    ['License type', licenseTypes.find(type => type.value === formData.license_type)?.label || formData.license_type],
    ['Customer ID', formData.customer_id || 'Unassigned'],
    ['Expiration', formData.expires_days ? `${formData.expires_days} days` : 'No expiration'],
    ['Max admins', formData.max_admins || 'Unlimited'],
    ['Max computers', formData.max_computers || 'Unlimited'],
    ['Hardware binding', formData.hardware_id || 'No hardware binding'],
  ]

  return (
    <div className="modal-overlay" onClick={requestClose}>
      <div className="modal wizard-modal generate-license-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Generate New License</h2>
            <p className="modal-header-copy">{steps[currentStep].description}</p>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={requestClose}
            aria-label="Close generate license dialog"
          >
            &times;
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger">
                {error}
              </div>
            )}

            <div className="wizard-steps" aria-label="Generate license steps">
              {steps.map((step, index) => (
                <button
                  key={step.title}
                  type="button"
                  className={`wizard-step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'complete' : ''}`}
                  onClick={() => goToStep(index)}
                  disabled={loading}
                  aria-current={index === currentStep ? 'step' : undefined}
                >
                  <span className="wizard-step-index">{index + 1}</span>
                  <span>{step.title}</span>
                </button>
              ))}
            </div>

            <div className="wizard-panel">
              {currentStep === 0 && (
                <>
                  <div className="wizard-section-heading">
                    <span>Step 1 of {steps.length}</span>
                    <h3>Pick the license profile</h3>
                  </div>

                  <div className="license-type-grid">
                    {licenseTypes.map(type => (
                      <label
                        key={type.value}
                        className={`license-type-card ${formData.license_type === type.value ? 'selected' : ''}`}
                      >
                        <input
                          className="visually-hidden"
                          type="radio"
                          name="license_type"
                          value={type.value}
                          checked={formData.license_type === type.value}
                          onChange={handleChange}
                          required
                        />
                        <span className="license-type-glyph" aria-hidden="true">{type.glyph}</span>
                        <span className="license-type-card-title">{type.label}</span>
                        <span className="license-type-card-copy">{type.description}</span>
                      </label>
                    ))}
                  </div>

                  <div className="form-group wizard-field">
                    <label>Customer ID</label>
                    <input
                      type="text"
                      name="customer_id"
                      value={formData.customer_id}
                      onChange={handleChange}
                      placeholder="e.g., ACME-Corp-2024"
                    />
                    <small className="form-hint">Use a stable customer reference so the generated license is easy to trace later.</small>
                  </div>
                </>
              )}

              {currentStep === 1 && (
                <>
                  <div className="wizard-section-heading">
                    <span>Step 2 of {steps.length}</span>
                    <h3>Define access boundaries</h3>
                  </div>

                  <div className="wizard-form-grid">
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
                      <label>Hardware ID</label>
                      <input
                        type="text"
                        name="hardware_id"
                        value={formData.hardware_id}
                        onChange={handleChange}
                        placeholder="Leave empty for no hardware binding"
                      />
                      <small className="form-hint">Binds this license to a specific device fingerprint.</small>
                    </div>
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <div className="wizard-section-heading">
                    <span>Step 3 of {steps.length}</span>
                    <h3>Review license details</h3>
                  </div>

                  <div className="wizard-review-card">
                    <div className="wizard-review-header">
                      <span className="wizard-review-badge">{reviewItems[0][1]}</span>
                      <strong>{formData.customer_id || 'New customer license'}</strong>
                    </div>

                    <dl className="wizard-review-list">
                      {reviewItems.map(([label, value]) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={isFirstStep ? requestClose : handlePrevious}
              disabled={loading}
            >
              {isFirstStep ? 'Cancel' : 'Back'}
            </button>
            {!isLastStep ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNext}
                disabled={loading}
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate License'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
