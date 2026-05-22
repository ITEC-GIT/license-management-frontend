export const getLicensesList = (data) => {
  if (Array.isArray(data)) return data
  return data?.licenses || data?.items || []
}

export const parseLicenseKey = (licenseKey) => {
  if (!licenseKey) return null
  if (typeof licenseKey === 'object') return licenseKey

  try {
    return JSON.parse(licenseKey)
  } catch {
    return null
  }
}

export const getLicensePayload = (license) =>
  parseLicenseKey(license?.license_key)

export const getLicenseCustomerId = (license) => {
  const payload = getLicensePayload(license)
  const customerId = license?.customer_id ?? payload?.customer_id

  if (customerId === null || customerId === undefined || customerId === '') {
    return null
  }

  return String(customerId)
}

export const getLicenseCustomerName = (license) => {
  if (license?.customer_name) return license.customer_name
  return null
}

export const getLicenseCustomerLabel = (license) => {
  const name = getLicenseCustomerName(license)
  if (name) return name

  const customerId = getLicenseCustomerId(license)
  if (customerId) return customerId

  return 'Unassigned'
}

export const getLicenseSelectedTabs = (license) => {
  const payload = getLicensePayload(license)
  const tabs =
    license?.selected_tabs ??
    license?.visible_tabs ??
    license?.allowed_tabs ??
    payload?.selected_tabs ??
    payload?.visible_tabs ??
    payload?.allowed_tabs

  if (Array.isArray(tabs)) return tabs
  if (!tabs) return []

  return String(tabs)
    .split(',')
    .map(tab => tab.trim())
    .filter(Boolean)
}

export const getLicenseStatus = (license) => {
  const now = new Date()
  if (license?.revoked_at) return 'revoked'
  if (license?.expires_at && new Date(license.expires_at) <= now) return 'expired'
  if (license?.is_active) return 'active'
  return 'inactive'
}

/** Match a license to a customer map key (id or name). */
export const resolveLicenseCustomerKey = (license, customerMap = {}) => {
  const customerId = getLicenseCustomerId(license)
  const customerName = getLicenseCustomerName(license)

  if (customerId && customerMap[customerId]) {
    return customerId
  }

  if (customerName) {
    const matchedEntry = Object.entries(customerMap).find(([, customer]) => {
      const name = customer.name?.trim().toLowerCase()
      return name && name === customerName.trim().toLowerCase()
    })

    if (matchedEntry) return matchedEntry[0]
    return customerName
  }

  if (customerId) return customerId
  return 'Unknown'
}

export const formatHardwareId = (hardwareId) => {
  if (hardwareId === null || hardwareId === undefined || hardwareId === '') {
    return 'N/A'
  }

  const value = String(hardwareId)
  return value.length > 12 ? `${value.slice(0, 8)}...` : value
}
