import { useEffect, useMemo, useState } from 'react'
import { getPackages, getVisibleTabs } from '../services/api'

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

export default function Packages() {
  const [packages, setPackages] = useState([])
  const [tabOptions, setTabOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPackageId, setSelectedPackageId] = useState(null)

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
  const totalTabs = packages.reduce((acc, packageItem) => acc + packageItem.tabIds.length, 0)
  const largestPackage = packages.reduce(
    (largest, packageItem) => packageItem.tabIds.length > largest.tabIds.length ? packageItem : largest,
    { tabIds: [] }
  )
  const uniqueTabCount = new Set(packages.flatMap(packageItem => packageItem.tabIds.map(String))).size

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
      <header className="page-header packages-hero">
        <div className="packages-hero-copy">
          <span className="eyebrow">Package catalog</span>
          <h1 className="page-title">Access plans built around visible tabs</h1>
          <p className="page-subtitle">
            Review Standard, Pro, and Super package coverage with a fast breakdown of entitlement scope.
          </p>
          <div className="hero-actions" aria-label="Package catalog summary">
            <span>{packages.length} packages</span>
            <span>{uniqueTabCount} unique tabs</span>
            <span>{totalTabs} assignments</span>
          </div>
        </div>

        <div className="packages-hero-panel" aria-hidden="true">
          {packages.slice(0, 3).map((packageItem, index) => (
            <span
              key={packageItem.id}
              className={`package-orbit-chip package-orbit-chip-${index + 1}`}
            >
              <strong>{packageItem.tabIds.length}</strong>
              {formatPackageName(packageItem.name)}
            </span>
          ))}
          <div className="package-orbit-core">
            <span>{uniqueTabCount}</span>
            <small>tabs</small>
          </div>
        </div>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}

      {packages.length === 0 ? (
        <div className="empty-state">
          <p>No packages found. Packages returned by the API will appear here.</p>
        </div>
      ) : (
        <>
          <section className="package-summary-grid" aria-label="Package summary">
            <div className="stat-card primary">
              <h3>Total Packages</h3>
              <div className="stat-value">{packages.length}</div>
            </div>
            <div className="stat-card success">
              <h3>Unique Tabs</h3>
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
                  <small>{packageItem.tabIds.length} visible tabs</small>
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
              <span className="badge badge-info">{selectedPackage.tabIds.length} tabs</span>
            </div>

            <div className="package-tab-cloud" aria-label={`${selectedPackage.name} visible tab IDs`}>
              {selectedPackage.tabIds.map((tabId) => {
                const tab = tabLookup[String(tabId)]

                return (
                  <span className="package-tab-pill" key={tabId}>
                    <strong>{tabId}</strong>
                    <small>{tab?.label || `Tab ${tabId}`}</small>
                  </span>
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
                    <th>Tab Count</th>
                    <th>Coverage</th>
                    <th>First Tabs</th>
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
                        <td data-label="Tab Count">{packageItem.tabIds.length}</td>
                        <td data-label="Coverage">
                          <span className="badge badge-success">{coverage}% coverage</span>
                        </td>
                        <td data-label="First Tabs" className="cell-mono">
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
