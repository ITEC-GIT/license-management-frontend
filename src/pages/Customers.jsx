import { useState, useEffect, useRef } from 'react'
import PaginationControls from '../components/PaginationControls'
import { createCustomer, getCustomers, getLicenses } from '../services/api'
import useAdaptivePageSize from '../hooks/useAdaptivePageSize'
import { getLicensesList, resolveLicenseCustomerKey } from '../utils/licenses'

const CUSTOMERS_MAX_PAGE_SIZE = 50

export default function Customers() {
  const tableContainerRef = useRef(null)
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    setError('')
    try {
      const [customersResponse, licensesResponse] = await Promise.all([
        getCustomers(),
        getLicenses(),
      ])
      const customerList = Array.isArray(customersResponse.data)
        ? customersResponse.data
        : customersResponse.data?.customers || customersResponse.data?.items || []
      const licenses = getLicensesList(licensesResponse.data)

      const customerMap = {}
      customerList.forEach((customer) => {
        const customerId = getCustomerId(customer)
        if (!customerId) return

        customerMap[customerId] = {
          id: customerId,
          name: getCustomerName(customer),
          licenses: [],
          activeLicenses: 0,
          expiredLicenses: 0
        }
      })

      licenses.forEach((license) => {
        const customerId = resolveLicenseCustomerKey(license, customerMap)
        if (!customerMap[customerId]) {
          customerMap[customerId] = {
            id: customerId,
            name: license.customer_name || '',
            licenses: [],
            activeLicenses: 0,
            expiredLicenses: 0
          }
        } else if (!customerMap[customerId].name && license.customer_name) {
          customerMap[customerId].name = license.customer_name
        }
        customerMap[customerId].licenses.push(license)

        const now = new Date()
        if (
          license.is_active &&
          (!license.expires_at || new Date(license.expires_at) > now)
        ) {
          customerMap[customerId].activeLicenses++
        } else if (license.expires_at && new Date(license.expires_at) <= now) {
          customerMap[customerId].expiredLicenses++
        }
      })

      const sortedCustomers = Object.values(customerMap).sort((a, b) => {
        const riskDelta = b.expiredLicenses - a.expiredLicenses
        if (riskDelta !== 0) return riskDelta
        return b.licenses.length - a.licenses.length
      })

      setCustomers(sortedCustomers)
    } catch (error) {
      console.error('Failed to load customers:', error)
      setError('Unable to load customer insights. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCustomer = async (data) => {
    try {
      await createCustomer(data)
      await loadCustomers()
      setShowCreateModal(false)
    } catch (error) {
      throw error
    }
  }

  const totalLicenses = customers.reduce((acc, customer) => acc + customer.licenses.length, 0)
  const mostLicensedCustomer = customers.length
    ? customers.reduce((top, customer) =>
        customer.licenses.length > top.licenses.length ? customer : top
      )
    : null
  const attentionCustomers = customers.filter((customer) => customer.expiredLicenses > 0).length
  const pageSize = useAdaptivePageSize({
    containerRef: tableContainerRef,
    totalItems: customers.length,
    maxRows: CUSTOMERS_MAX_PAGE_SIZE,
    desktopFallbackRowHeight: 56,
    mobileFallbackRowHeight: 132,
  })
  const totalPages = Math.max(1, Math.ceil(customers.length / pageSize))
  const paginatedCustomers = customers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading customers...</p>
      </div>
    )
  }

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}

      <section className="customer-atlas">
        <div className="card-header">
          <div>
            <h2>Customer insights</h2>
          </div>
        </div>
        <div className="card-section-body">
          <div className="stats-grid">
            <div className="stat-card primary">
              <h3>Total Customers</h3>
              <div className="stat-value">{customers.length}</div>
            </div>
            <div className="stat-card success">
              <h3>Avg Licenses/Customer</h3>
              <div className="stat-value">
                {customers.length > 0
                  ? (totalLicenses / customers.length).toFixed(1)
                  : '0'}
              </div>
            </div>
            <div className="stat-card warning">
              <h3>Most Licenses</h3>
              <div className="stat-value">
                {mostLicensedCustomer ? mostLicensedCustomer.licenses.length : '0'}
              </div>
              {mostLicensedCustomer && <span className="form-hint">{mostLicensedCustomer.id}</span>}
            </div>
            <div className="stat-card danger">
              <h3>Need Attention</h3>
              <div className="stat-value">
                {attentionCustomers}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="card customer-card">
        <div className="card-header customer-card-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            New customer
          </button>
        </div>

        {customers.length === 0 ? (
          <div className="empty-state">
            <p>No customers found. Create your first customer to begin tracking accounts.</p>
          </div>
        ) : (
          <div className="table-container responsive-table" ref={tableContainerRef}>
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Total Licenses</th>
                  <th>Active</th>
                  <th>Expired</th>
                  <th>Latest License</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td data-label="Customer">
                      <div className="record-title">
                        <strong>{customer.id}</strong>
                        <span>
                          {customer.name
                            ? customer.name
                            : customer.expiredLicenses > 0
                              ? 'Needs review'
                              : 'Healthy account'}
                        </span>
                      </div>
                    </td>
                    <td data-label="Total Licenses">{customer.licenses.length}</td>
                    <td data-label="Active">
                      <span className="badge badge-success">{customer.activeLicenses}</span>
                    </td>
                    <td data-label="Expired">
                      <span className="badge badge-warning">{customer.expiredLicenses}</span>
                    </td>
                    <td data-label="Latest License">
                      {customer.licenses.length > 0
                        ? getLatestLicenseDate(customer.licenses)
                        : 'No licenses yet'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <PaginationControls
              currentPage={currentPage}
              totalItems={customers.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              itemLabel="customers"
            />
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateCustomerModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateCustomer}
        />
      )}
    </div>
  )
}

function CreateCustomerModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    name: '',
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

    if (!formData.name.trim()) {
      setError('Customer name is required')
      return
    }

    setLoading(true)

    try {
      await onCreate({
        name: formData.name.trim(),
      })
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to create customer')
      setLoading(false)
    }
  }

  const requestClose = () => {
    if (loading) return
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={requestClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>New Customer</h2>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={requestClose}
            aria-label="Close new customer dialog"
          >
            &times;
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="form-group">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Customer name"
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={requestClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function getCustomerId(customer) {
  if (typeof customer === 'string') return customer
  return String(customer.customer_id ?? customer.id ?? customer.name ?? '')
}

function getCustomerName(customer) {
  if (typeof customer === 'string') return ''
  return customer.name || customer.company_name || customer.full_name || ''
}

function getLatestLicenseDate(licenses) {
  return new Date(
    Math.max(...licenses.map((license) => new Date(license.issued_at)))
  ).toLocaleDateString()
}
