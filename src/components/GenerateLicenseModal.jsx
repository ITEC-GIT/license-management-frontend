import { useEffect, useRef, useState } from 'react'
import { getCustomers, getVisibleTabs } from '../services/api'

const steps = [
  {
    title: 'Access',
  },
  {
    title: 'Customer',
  },
  {
    title: 'Limits',
  },
  {
    title: 'Review',
  },
]

const formatTabLabel = (value) =>
  String(value)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase())

const getVisibleTabsList = (data) => {
  if (Array.isArray(data)) return data
  return data?.visible_tabs || data?.visibleTabs || data?.tabs || data?.items || []
}

const normalizeVisibleTab = (tab) => {
  if (typeof tab === 'string') {
    return {
      id: tab,
      parentId: null,
      value: tab,
      label: formatTabLabel(tab),
      description: '',
    }
  }

  const value = String(tab.tab_name ?? tab.value ?? tab.key ?? tab.name ?? tab.label ?? tab.id ?? '')
  const id = String(tab.id ?? value)
  const parentId = tab.parent_tab_id === null || tab.parent_tab_id === undefined
    ? null
    : String(tab.parent_tab_id)

  return {
    id,
    parentId,
    value,
    label: tab.display_tab_name || tab.label || tab.name || tab.title || tab.display_name || formatTabLabel(value),
    description: tab.description || tab.summary || '',
  }
}

const parsePayloadNumber = (value) => {
  const parsedValue = Number(value)
  return Number.isNaN(parsedValue) ? value : parsedValue
}

export default function GenerateLicenseModal({ onClose, onGenerate }) {
  const backdropPointerDownRef = useRef(false)
  const [formData, setFormData] = useState({
    customer_id: '',
    expires_days: '',
    max_admins: '',
    max_computers: '',
    hardware_id: '',
    visible_tabs: [],
  })
  const [loading, setLoading] = useState(false)
  const [generationComplete, setGenerationComplete] = useState(false)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState(0)
  const [customers, setCustomers] = useState([])
  const [customersLoading, setCustomersLoading] = useState(true)
  const [customersError, setCustomersError] = useState('')
  const [visibleTabOptions, setVisibleTabOptions] = useState([])
  const [visibleTabsLoading, setVisibleTabsLoading] = useState(true)
  const [visibleTabsError, setVisibleTabsError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadCustomers = async () => {
      setCustomersError('')

      try {
        const response = await getCustomers()
        const customerList = Array.isArray(response.data)
          ? response.data
          : response.data?.customers || response.data?.items || []

        if (isMounted) {
          setCustomers(customerList)
        }
      } catch (error) {
        console.error('Failed to load customers:', error)
        if (isMounted) {
          setCustomersError('Unable to load customers. Please try again later.')
        }
      } finally {
        if (isMounted) {
          setCustomersLoading(false)
        }
      }
    }

    loadCustomers()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadVisibleTabs = async () => {
      setVisibleTabsError('')

      try {
        const response = await getVisibleTabs()
        const tabOptions = getVisibleTabsList(response.data)
          .map(normalizeVisibleTab)
          .filter(tab => tab.value)

        if (isMounted) {
          setVisibleTabOptions(tabOptions)
          setFormData(prev => {
            if (prev.visible_tabs.length > 0) {
              return prev
            }

            return {
              ...prev,
              visible_tabs: tabOptions.map(tab => tab.value),
            }
          })
        }
      } catch (error) {
        console.error('Failed to load visible tabs:', error)
        if (isMounted) {
          setVisibleTabsError('Unable to load visible tabs. Please try again later.')
        }
      } finally {
        if (isMounted) {
          setVisibleTabsLoading(false)
        }
      }
    }

    loadVisibleTabs()

    return () => {
      isMounted = false
    }
  }, [])

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1
  const defaultVisibleTabs = visibleTabOptions.map(tab => tab.value)
  const hasDefaultVisibleTabs =
    formData.visible_tabs.length === defaultVisibleTabs.length &&
    defaultVisibleTabs.every(tab => formData.visible_tabs.includes(tab))
  const isDirty =
    ['customer_id', 'expires_days', 'max_admins', 'max_computers', 'hardware_id'].some(
      field => Boolean(formData[field])
    ) ||
    (formData.visible_tabs.length > 0 && !hasDefaultVisibleTabs)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleVisibleTabChange = (e) => {
    const { value, checked } = e.target
    const changedTab = visibleTabOptions.find(tab => tab.value === value)
    const childValues = changedTab
      ? visibleTabOptions
          .filter(tab => tab.parentId === changedTab.id)
          .map(tab => tab.value)
      : []
    const parentValue = changedTab?.parentId
      ? visibleTabOptions.find(tab => tab.id === changedTab.parentId)?.value
      : null

    setFormData(prev => {
      let visibleTabs = prev.visible_tabs.filter(tab => tab !== value)

      if (checked) {
        visibleTabs = [...visibleTabs, value]

        if (parentValue) {
          visibleTabs = [...visibleTabs, parentValue]
        }
      } else if (childValues.length > 0) {
        visibleTabs = visibleTabs.filter(tab => !childValues.includes(tab))
      }

      return {
        ...prev,
        visible_tabs: [...new Set(visibleTabs)],
      }
    })
  }

  const validateVisibleTabs = () => {
    if (!visibleTabsLoading && formData.visible_tabs.length === 0) {
      setError('Select at least one visible tab.')
      setCurrentStep(0)
      return false
    }

    return true
  }

  const validateCustomerSelection = () => {
    if (!formData.customer_id) {
      setError('Select a customer before generating a license.')
      setCurrentStep(1)
      return false
    }

    return true
  }

  const validateLimits = () => {
    if (!formData.expires_days || !formData.max_admins || !formData.max_computers) {
      setError('Expiration days, max admins, and max computers are required.')
      setCurrentStep(2)
      return false
    }

    return true
  }

  const goToStep = (stepIndex) => {
    if (generationComplete) return
    setError('')
    if (stepIndex > 0 && !validateVisibleTabs()) return
    if (stepIndex > 1 && !validateCustomerSelection()) return
    if (stepIndex > 2 && !validateLimits()) return
    setCurrentStep(stepIndex)
  }

  const handleNext = () => {
    if (generationComplete) return
    setError('')

    if (currentStep === 0 && !validateVisibleTabs()) {
      return
    }

    if (currentStep === 1 && !validateCustomerSelection()) {
      return
    }

    if (currentStep === 2 && !validateLimits()) {
      return
    }

    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
  }

  const handlePrevious = () => {
    if (generationComplete) return
    setError('')
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const requestClose = () => {
    if (loading) return
    if (!generationComplete && isDirty && !confirm('Discard this license draft?')) return
    onClose()
  }

  const handleBackdropPointerDown = (e) => {
    backdropPointerDownRef.current = e.target === e.currentTarget
  }

  const handleBackdropClick = (e) => {
    if (!backdropPointerDownRef.current || e.target !== e.currentTarget) return
    requestClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!validateVisibleTabs() || !validateCustomerSelection() || !validateLimits()) {
        setLoading(false)
        return
      }

      const data = {
        license_type: 'full',
        customer_id: parsePayloadNumber(formData.customer_id),
        expires_days: parseInt(formData.expires_days, 10),
        max_admins: parseInt(formData.max_admins, 10),
        max_computers: parseInt(formData.max_computers, 10),
        hardware_id: formData.hardware_id || undefined,
        selected_tabs: formData.visible_tabs,
      }

      await onGenerate(data)
      setGenerationComplete(true)
      setLoading(false)
      setCurrentStep(steps.length - 1)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate license')
      setLoading(false)
    }
  }

  const getCustomerValue = (customer) => {
    if (typeof customer === 'string') return customer
    return String(customer.customer_id ?? customer.id ?? customer.name ?? '')
  }

  const getCustomerLabel = (customer) => {
    if (typeof customer === 'string') return customer

    const name = customer.name || customer.company_name || customer.full_name
    const identifier = customer.customer_id || customer.id

    if (name && identifier) return `${name} (${identifier})`
    return name || identifier || 'Unnamed customer'
  }

  const selectedCustomer = customers.find(
    customer => getCustomerValue(customer) === formData.customer_id
  )
  const selectedCustomerLabel = selectedCustomer
    ? getCustomerLabel(selectedCustomer)
    : formData.customer_id || 'Required'
  const selectedVisibleTabs = formData.visible_tabs
    .map(tab => visibleTabOptions.find(option => option.value === tab)?.label || tab)
    .join(', ')
  const visibleTabParentIds = new Set(visibleTabOptions.map(tab => tab.id))
  const visibleTabGroups = visibleTabOptions
    .filter(tab => !tab.parentId || !visibleTabParentIds.has(tab.parentId))
    .map(parent => ({
      parent,
      children: visibleTabOptions.filter(tab => tab.parentId === parent.id),
    }))

  const renderVisibleTabCard = (tab, modifier = '') => (
    <label
      key={tab.id}
      className={`visible-tab-card ${modifier} ${formData.visible_tabs.includes(tab.value) ? 'selected' : ''}`}
    >
      <input
        type="checkbox"
        value={tab.value}
        checked={formData.visible_tabs.includes(tab.value)}
        onChange={handleVisibleTabChange}
      />
      <span>
        <strong>{tab.label}</strong>
        {tab.description && <small>{tab.description}</small>}
      </span>
    </label>
  )

  const reviewItems = [
    ['Visible tabs', selectedVisibleTabs || 'None selected'],
    ['Customer', selectedCustomerLabel],
    ['Expiration', formData.expires_days ? `${formData.expires_days} days` : 'Required'],
    ['Max admins', formData.max_admins || 'Required'],
    ['Max computers', formData.max_computers || 'Required'],
    ['Hardware binding', formData.hardware_id || 'No hardware binding'],
  ]

  return (
    <div
      className="modal-overlay"
      onPointerDown={handleBackdropPointerDown}
      onClick={handleBackdropClick}
    >
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
          
            {generationComplete && (
              <div className="alert alert-success">
                License generated successfully.
              </div>
            )}

            <div className="wizard-steps" aria-label="Generate license steps">
              {steps.map((step, index) => (
                <button
                  key={step.title}
                  type="button"
                  className={`wizard-step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'complete' : ''}`}
                  onClick={() => goToStep(index)}
                  disabled={generationComplete || loading || visibleTabsLoading}
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
                    <h3>Choose visible tabs</h3>
                  </div>

                  <div className="visible-tabs-panel">
                    <div className="visible-tabs-grid">
                      {visibleTabsLoading && (
                        <p className="form-hint visible-tabs-message">Loading visible tabs...</p>
                      )}
                      {visibleTabsError && (
                        <p className="form-hint visible-tabs-message">{visibleTabsError}</p>
                      )}
                      {!visibleTabsLoading && !visibleTabsError && visibleTabOptions.length === 0 && (
                        <p className="form-hint visible-tabs-message">No visible tabs are available.</p>
                      )}
                      {!visibleTabsLoading && !visibleTabsError && visibleTabGroups.map(({ parent, children }) => (
                        <div className="visible-tab-group" key={parent.id}>
                          {renderVisibleTabCard(parent, 'visible-tab-card-parent')}
                          {children.length > 0 && (
                            <div className="visible-tab-children">
                              {children.map(child => renderVisibleTabCard(child, 'visible-tab-card-child'))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {currentStep === 1 && (
                <>
                  <div className="wizard-section-heading">
                    <span>Step 2 of {steps.length}</span>
                    <h3>Select the customer</h3>
                  </div>

                  <div className="form-group wizard-field">
                    <label>Customer</label>
                    
                    {error && (
                      <div className="alert alert-danger">
                        {error}
                      </div>
                    )}

                    <select
                      name="customer_id"
                      value={formData.customer_id}
                      onChange={handleChange}
                      disabled={customersLoading || customers.length === 0}
                      required
                    >
                      <option value="">
                        {customersLoading ? 'Loading customers...' : 'Select a customer'}
                      </option>

                      {customers.map((customer, index) => {
                        const value = getCustomerValue(customer)

                        return (
                          <option key={`${value}-${index}`} value={value}>
                            {getCustomerLabel(customer)}
                          </option>
                        )
                      })}
                    </select>
                    {customersError && <small className="form-hint">{customersError}</small>}
                    {!customersLoading && !customersError && customers.length === 0 && (
                      <small className="form-hint">No customers are available yet.</small>
                    )}

                  </div>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <div className="wizard-section-heading">
                    <span>Step 3 of {steps.length}</span>
                    <h3>Define access boundaries</h3>
                  </div>

                  {error && (
                    <div className="alert alert-danger">
                      {error}
                    </div>
                  )}

                  <div className="wizard-form-grid">
                    <div className="form-group">
                      <label>Expires In (Days)</label>
                      <input
                        type="number"
                        name="expires_days"
                        value={formData.expires_days}
                        onChange={handleChange}
                        placeholder="Required"
                        min="1"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Max Admins</label>
                      <input
                        type="number"
                        name="max_admins"
                        value={formData.max_admins}
                        onChange={handleChange}
                        placeholder="Required"
                        min="1"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Max Computers</label>
                      <input
                        type="number"
                        name="max_computers"
                        value={formData.max_computers}
                        onChange={handleChange}
                        placeholder="Required"
                        min="1"
                        required
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
                    </div>
                  </div>
                </>
              )}

              {currentStep === 3 && (
                <>
                  <div className="wizard-section-heading">
                    <span>Step 4 of {steps.length}</span>
                    <h3>Review license details</h3>
                  </div>

                  <div className="wizard-review-card">
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
            {generationComplete ? (
              <></>
            ) : (
              <>
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
                    disabled={loading || visibleTabsLoading}
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || visibleTabsLoading}
                  >
                    {loading ? 'Generating...' : 'Generate License'}
                  </button>
                )}
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
