import { useState, useEffect } from 'react'
import { getLicenses } from '../services/api'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    setError('')
    try {
      const response = await getLicenses()
      const licenses = response.data

      // Group by customer_id
      const customerMap = {}
      licenses.forEach((license) => {
        const customerId = license.customer_id || 'Unknown'
        if (!customerMap[customerId]) {
          customerMap[customerId] = {
            id: customerId,
            licenses: [],
            activeLicenses: 0,
            expiredLicenses: 0
          }
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

  const totalLicenses = customers.reduce((acc, customer) => acc + customer.licenses.length, 0)
  const mostLicensedCustomer = customers.length
    ? customers.reduce((top, customer) =>
        customer.licenses.length > top.licenses.length ? customer : top
      )
    : null
  const attentionCustomers = customers.filter((customer) => customer.expiredLicenses > 0).length
  const topCustomers = customers.slice(0, 3)

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
      <header className="page-header">
        <span className="eyebrow">Customer intelligence</span>
        <h1 className="page-title">Customers</h1>
        <p className="page-subtitle">Understand customer entitlement coverage, license concentration, and accounts that need attention.</p>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}

      <section className="customer-atlas">
        <div className="card-header">
          <div>
            <span className="section-kicker">Portfolio</span>
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
                {customers.filter((c) => c.expiredLicenses > 0).length}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="card customer-card">
        <div className="card-header">
          <div>
            <span className="section-kicker">Accounts</span>
            <h2>Customer list</h2>
          </div>
        </div>

        {customers.length === 0 ? (
          <div className="empty-state">
            <p>No customers found. Customer records are derived from generated licenses.</p>
          </div>
        ) : (
          <div className="table-container responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Total Licenses</th>
                  <th>Active</th>
                  <th>Expired</th>
                  <th>Latest License</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td data-label="Customer ID">
                      <div className="record-title">
                        <strong>{customer.id}</strong>
                        <span>{customer.expiredLicenses > 0 ? 'Needs review' : 'Healthy account'}</span>
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
                      {new Date(
                        Math.max(...customer.licenses.map((l) => new Date(l.issued_at)))
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

     
    </div>
  )
}
