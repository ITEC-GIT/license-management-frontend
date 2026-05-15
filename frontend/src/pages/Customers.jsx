import { useState, useEffect } from 'react'
import { getLicenses } from '../services/api'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      const response = await getLicenses()
      const licenses = response.data

      // Group by customer_id
      const customerMap = {}
      licenses.forEach(license => {
        const customerId = license.customer_id || 'Unknown'
        if (!customerMap[customerId]) {
          customerMap[customerId] = {
            id: customerId,
            licenses: [],
            activeLicenses: 0,
            expiredLicenses: 0,
          }
        }
        customerMap[customerId].licenses.push(license)
        
        const now = new Date()
        if (license.is_active && (!license.expires_at || new Date(license.expires_at) > now)) {
          customerMap[customerId].activeLicenses++
        } else if (license.expires_at && new Date(license.expires_at) <= now) {
          customerMap[customerId].expiredLicenses++
        }
      })

      setCustomers(Object.values(customerMap))
    } catch (error) {
      console.error('Failed to load customers:', error)
    } finally {
      setLoading(false)
    }
  }

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
      <div className="card">
        <div className="card-header">
          <h2>Customers</h2>
        </div>

        {customers.length === 0 ? (
          <div className="empty-state">
            <p>No customers found</p>
          </div>
        ) : (
          <div className="table-container">
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
                    <td><strong>{customer.id}</strong></td>
                    <td>{customer.licenses.length}</td>
                    <td>
                      <span className="badge badge-success">
                        {customer.activeLicenses}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-warning">
                        {customer.expiredLicenses}
                      </span>
                    </td>
                    <td>
                      {new Date(
                        Math.max(...customer.licenses.map(l => new Date(l.issued_at)))
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <h2>Customer Insights</h2>
        </div>
        <div style={{ padding: '20px' }}>
          <div className="stats-grid">
            <div className="stat-card primary">
              <h3>Total Customers</h3>
              <div className="stat-value">{customers.length}</div>
            </div>
            <div className="stat-card success">
              <h3>Avg Licenses/Customer</h3>
              <div className="stat-value">
                {customers.length > 0 
                  ? (customers.reduce((acc, c) => acc + c.licenses.length, 0) / customers.length).toFixed(1)
                  : '0'}
              </div>
            </div>
            <div className="stat-card warning">
              <h3>Most Licenses</h3>
              <div className="stat-value">
                {customers.length > 0 
                  ? Math.max(...customers.map(c => c.licenses.length))
                  : '0'}
              </div>
            </div>
            <div className="stat-card danger">
              <h3>Need Attention</h3>
              <div className="stat-value">
                {customers.filter(c => c.expiredLicenses > 0).length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
