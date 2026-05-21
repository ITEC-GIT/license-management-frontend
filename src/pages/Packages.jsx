import { useEffect, useMemo, useState } from 'react'
import { getPackages, getVisibleTabs, updatePackageTabs } from '../services/api'

const formatTabLabel = (value) =>
  String(value)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase())

const getPackagesList = (data) => {
  if (Array.isArray(data)) return data
  return data?.packages || data?.items || []
}

const getVisibleTabsList = (data) => {
  if (Array.isArray(data)) return data
  return data?.visible_tabs || data?.visibleTabs || data?.tabs || data?.items || []
}

const normalizeVisibleTab = (tab) => {
  if (typeof tab === 'string' || typeof tab === 'number') {
    return {
      id: String(tab),
      label: formatTabLabel(tab),
    }
  }

  const id = String(tab.id ?? tab.tab_id ?? tab.value ?? tab.key ?? tab.name ?? tab.label ?? '')
  const value = tab.tab_name ?? tab.value ?? tab.key ?? tab.name ?? tab.label ?? id

  return {
    id,
    label: tab.display_tab_name || tab.display_name || tab.label || tab.name || tab.title || formatTabLabel(value),
  }
}

const normalizePackage = (item) => ({
  id: item.id,
  name: item.name || `Package ${item.id}`,
  tabIds: Array.isArray(item.tab_ids) ? item.tab_ids : [],
})

const formatPackageName = (name) =>
  String(name)
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase())

const serializeTabId = (value) => {
  const numericValue = Number(value)
  return Number.isNaN(numericValue) ? value : numericValue
}

const sortTabIds = (tabIds) =>
  [...tabIds].sort((a, b) => {
    const numericA = Number(a)
    const numericB = Number(b)

    if (!Number.isNaN(numericA) && !Number.isNaN(numericB)) {
      return numericA - numericB
    }

    return String(a).localeCompare(String(b))
  })

export default function Packages() {
  const [packages, setPackages] = useState([])
  const [tabOptions, setTabOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPackageId, setSelectedPackageId] = useState(null)
  const [draftTabIds, setDraftTabIds] = useState([])
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    loadPackages()
  }, [])

  const loadPackages = async () => {
    setError('')
    setLoading(true)

    try {
      const [packagesResponse, visibleTabsResponse] = await Promise.allSettled([
        getPackages(),
        getVisibleTabs(),
      ])

      if (packagesResponse.status === 'rejected') {
        throw packagesResponse.reason
      }

      const packageList = getPackagesList(packagesResponse.value.data)
        .map(normalizePackage)
        .sort((a, b) => a.id - b.id)

      const visibleTabs = visibleTabsResponse.status === 'fulfilled'
        ? getVisibleTabsList(visibleTabsResponse.value.data).map(normalizeVisibleTab).filter(tab => tab.id)
        : []

      setPackages(packageList)
      setTabOptions(visibleTabs)
      setSelectedPackageId(packageList[0]?.id ?? null)
    } catch (error) {
      console.error('Failed to load packages:', error)
      setError('Unable to load packages. Please refresh or try again later.')
    } finally {
      setLoading(false)
    }
  }

  const tabLookup = useMemo(() => {
    return tabOptions.reduce((lookup, tab) => {
      lookup[String(tab.id)] = tab
      return lookup
    }, {})
  }, [tabOptions])

  const selectedPackage = packages.find(packageItem => packageItem.id === selectedPackageId) || packages[0]
  const selectedPackageTabKey = selectedPackage?.tabIds.map(String).join(',') || ''

  useEffect(() => {
    setDraftTabIds(selectedPackage?.tabIds.map(String) || [])
    setSaveMessage('')
  }, [selectedPackage?.id, selectedPackageTabKey])

  const largestPackage = packages.reduce(
    (largest, packageItem) => packageItem.tabIds.length > largest.tabIds.length ? packageItem : largest,
    { tabIds: [] }
  )
  const uniqueTabCount = new Set(packages.flatMap(packageItem => packageItem.tabIds.map(String))).size
  const availableTabs = useMemo(() => {
    const optionsById = {}

    tabOptions.forEach((tab) => {
      optionsById[String(tab.id)] = tab
    })

    packages.forEach((packageItem) => {
      packageItem.tabIds.forEach((tabId) => {
        const id = String(tabId)
        if (!optionsById[id]) {
          optionsById[id] = {
            id,
            label: `Feature ${id}`,
          }
        }
      })
    })

    return sortTabIds(Object.values(optionsById).map(tab => tab.id)).map(id => optionsById[String(id)])
  }, [packages, tabOptions])
  const selectedDraftTabIds = new Set(draftTabIds)
  const originalTabKey = sortTabIds(selectedPackage?.tabIds.map(String) || []).join(',')
  const draftTabKey = sortTabIds(draftTabIds).join(',')
  const hasPackageChanges = Boolean(selectedPackage) && originalTabKey !== draftTabKey

  const toggleDraftTab = (tabId) => {
    const id = String(tabId)
    setSaveMessage('')
    setDraftTabIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(value => value !== id)
      }

      return sortTabIds([...prev, id]).map(String)
    })
  }

  const resetDraftTabs = () => {
    setDraftTabIds(selectedPackage?.tabIds.map(String) || [])
    setSaveMessage('')
  }

  const savePackageTabs = async () => {
    if (!selectedPackage || !hasPackageChanges) return

    setSaving(true)
    setError('')
    setSaveMessage('')

    try {
      const nextTabIds = sortTabIds(draftTabIds).map(serializeTabId)
      const response = await updatePackageTabs(selectedPackage.id, nextTabIds)
      const responsePackage = response.data?.package || response.data
      const updatedPackage = responsePackage?.tab_ids
        ? normalizePackage(responsePackage)
        : {
            ...selectedPackage,
            tabIds: nextTabIds,
          }

      setPackages(prev => prev.map(packageItem =>
        packageItem.id === selectedPackage.id
          ? { ...packageItem, ...updatedPackage, id: packageItem.id }
          : packageItem
      ))
      setDraftTabIds(updatedPackage.tabIds.map(String))
      setSaveMessage('Package features updated successfully.')
    } catch (error) {
      console.error('Failed to update package features:', error)
      setError(error.response?.data?.detail || 'Unable to update package features. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading packages...</p>
      </div>
    )
  }

  return (
    <div className="packages-page">

      {error && <div className="alert alert-danger">{error}</div>}

      <header className="page-header packages-hero">
        <div className="packages-hero-copy">
          <h1 className="page-title">Access plans built around features</h1>
          <p className="page-subtitle">
            Review Standard, Pro, and Super package coverage with a fast breakdown of entitlement scope.
          </p>
        </div>

        <div className="packages-hero-panel" aria-hidden="true">
          {packages.slice(0, 3).map((packageItem, index) => (
            <span
              key={packageItem.id}
              className={`package-orbit-chip package-orbit-chip-${index + 1}`}
            >
              <strong>#{packageItem.id}</strong>
              {formatPackageName(packageItem.name)}
            </span>
          ))}
          <div className="package-orbit-core">
            <span>{packages.length}</span>
            <small>packages</small>
          </div>
        </div>
      </header>

      {packages.length === 0 ? (
        <div className="empty-state">
          <p>No packages found.</p>
        </div>
      ) : (
        <>
          <section className="package-summary-grid" aria-label="Package summary">
            <div className="stat-card primary">
              <h3>Total Packages</h3>
              <div className="stat-value">{packages.length}</div>
            </div>
            <div className="stat-card success">
              <h3>Features</h3>
              <div className="stat-value">{uniqueTabCount}</div>
            </div>
            <div className="stat-card warning">
              <h3>Largest Plan</h3>
              <div className="stat-value">{largestPackage.tabIds.length}</div>
              {largestPackage.name && <span className="form-hint">{formatPackageName(largestPackage.name)}</span>}
            </div>
          </section>

          <section className="package-plans-grid" aria-label="Available packages">
            {packages.map((packageItem) => {
              const isSelected = selectedPackage?.id === packageItem.id

              return (
                <button
                  type="button"
                  key={packageItem.id}
                  className={`package-plan-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedPackageId(packageItem.id)}
                  aria-pressed={isSelected}
                >
                  <span className="package-plan-index">#{packageItem.id}</span>
                  <strong>{formatPackageName(packageItem.name)}</strong>
                  <small>{packageItem.tabIds.length} features</small>
                  <span className="package-plan-meter">
                    <span
                      style={{
                        width: `${uniqueTabCount ? Math.round((packageItem.tabIds.length / uniqueTabCount) * 100) : 0}%`,
                      }}
                    />
                  </span>
                </button>
              )
            })}
          </section>

          <div className="card package-detail-card">
            <div className="card-header">
              <div>
                <span className="section-kicker">Selected plan</span>
                <h2>{formatPackageName(selectedPackage.name)} package</h2>
              </div>
              <div className="package-detail-actions">
                <span className="badge badge-info">{draftTabIds.length} features</span>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={resetDraftTabs}
                  disabled={!hasPackageChanges || saving}
                >
                  Reset
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={savePackageTabs}
                  disabled={!hasPackageChanges || saving}
                >
                  {saving ? 'Saving...' : 'Save features'}
                </button>
              </div>
            </div>

            {saveMessage && <div className="alert alert-success package-save-alert">{saveMessage}</div>}

            <div className="package-tab-cloud package-tab-editor" aria-label={`${selectedPackage.name} feature IDs`}>
              {availableTabs.map((tab) => {
                const isSelected = selectedDraftTabIds.has(String(tab.id))

                return (
                  <button
                    type="button"
                    className={`package-tab-pill package-tab-toggle ${isSelected ? 'selected' : ''}`}
                    key={tab.id}
                    onClick={() => toggleDraftTab(tab.id)}
                    disabled={saving}
                    aria-pressed={isSelected}
                  >
                    <strong>{tab.id}</strong>
                    <small>{tabLookup[String(tab.id)]?.label || tab.label || `Feature ${tab.id}`}</small>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="card package-table-card">
            <div className="card-header">
              <div>
                <span className="section-kicker">Catalog matrix</span>
                <h2>Package coverage</h2>
              </div>
            </div>

            <div className="table-container responsive-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Package</th>
                    <th>Feature Count</th>
                    <th>Coverage</th>
                    <th>First Features</th>
                  </tr>
                </thead>
                <tbody>
                  {packages.map((packageItem) => {
                    const coverage = uniqueTabCount
                      ? Math.round((packageItem.tabIds.length / uniqueTabCount) * 100)
                      : 0

                    return (
                      <tr key={packageItem.id}>
                        <td data-label="ID">
                          <span className="license-id-token">#{packageItem.id}</span>
                        </td>
                        <td data-label="Package">
                          <div className="record-title">
                            <strong>{formatPackageName(packageItem.name)}</strong>
                            <span>Package entitlement profile</span>
                          </div>
                        </td>
                        <td data-label="Feature Count">{packageItem.tabIds.length}</td>
                        <td data-label="Coverage">
                          <span className="badge badge-success">{coverage}% coverage</span>
                        </td>
                        <td data-label="First Features" className="cell-mono">
                          {packageItem.tabIds.slice(0, 8).join(', ')}
                          {packageItem.tabIds.length > 8 ? '...' : ''}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
