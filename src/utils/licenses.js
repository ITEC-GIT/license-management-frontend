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

export const getLicenseStatus = (license) => {
  const now = new Date()
  if (license?.revoked_at) return 'revoked'
  if (license?.expires_at && new Date(license.expires_at) <= now) return 'expired'
  if (license?.is_active) return 'active'
  return 'inactive'
}

export const formatHardwareId = (hardwareId) => {
  if (hardwareId === null || hardwareId === undefined || hardwareId === '') {
    return 'N/A'
  }

  const value = String(hardwareId)
  return value.length > 12 ? `${value.slice(0, 8)}...` : value
}
