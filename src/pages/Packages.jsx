import { useEffect, useMemo, useState } from 'react'
import { createPackage, getPackages, getVisibleTabs, updatePackageTabs } from '../services/api'

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
      parentId: null,
      label: formatTabLabel(tab),
    }
  }

  const id = String(tab.id ?? tab.tab_id ?? tab.value ?? tab.key ?? tab.name ?? tab.label ?? '')
  const value = tab.tab_name ?? tab.value ?? tab.key ?? tab.name ?? tab.label ?? id
  const parentId = tab.parent_tab_id === null || tab.parent_tab_id === undefined
    ? null
    : String(tab.parent_tab_id)

  return {
    id,
    parentId,
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
  const [featureSearch, setFeatureSearch] = useState('')
  const [featureFilter, setFeatureFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

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
            parentId: null,
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

  const getTabLabel = (tab) => {
    const id = String(tab.id)
    return tabLookup[id]?.label || tab.label || `Tab ${id}`
  }

  const visibleTabGroups = useMemo(() => {
    const parentIds = new Set(availableTabs.map(tab => String(tab.id)))

    return availableTabs
      .filter(tab => !tab.parentId || !parentIds.has(String(tab.parentId)))
      .map(parent => ({
        parent,
        children: availableTabs.filter(tab => String(tab.parentId) === String(parent.id)),
      }))
  }, [availableTabs])

  const filteredVisibleTabGroups = useMemo(() => {
    const query = featureSearch.trim().toLowerCase()

    const matchesStatus = (tab) => {
      const id = String(tab.id)
      const isSelected = selectedDraftTabIds.has(id)
      if (featureFilter === 'enabled' && !isSelected) return false
      if (featureFilter === 'disabled' && isSelected) return false
      return true
    }

    const matchesSearch = (tab) => {
      if (!query) return true
      const id = String(tab.id)
      return `${id} ${getTabLabel(tab)}`.toLowerCase().includes(query)
    }

    const matches = (tab) => matchesStatus(tab) && matchesSearch(tab)

    return visibleTabGroups
      .map(({ parent, children }) => {
        const parentMatches = matches(parent)
        const visibleChildren = children.filter(matches)

        if (!parentMatches && visibleChildren.length === 0) return null

        return {
          parent,
          children: query || featureFilter !== 'all'
            ? visibleChildren
            : children.filter(matchesStatus),
        }
      })
      .filter(Boolean)
  }, [availableTabs, featureFilter, featureSearch, selectedDraftTabIds, tabLookup, visibleTabGroups])

  const handleTabToggle = (event) => {
    const id = String(event.target.value)
    const checked = event.target.checked
    const changedTab = availableTabs.find(tab => String(tab.id) === id)
    const childIds = changedTab
      ? availableTabs
          .filter(tab => String(tab.parentId) === String(changedTab.id))
          .map(tab => String(tab.id))
      : []
    const parentId = changedTab?.parentId ? String(changedTab.parentId) : null

    setSaveMessage('')
    setDraftTabIds(prev => {
      if (checked) {
        const next = [...prev, id]
        if (parentId) next.push(parentId)
        return sortTabIds([...new Set(next.map(String))])
      }

      let next = prev.filter(tabId => tabId !== id)
      if (childIds.length > 0) {
        next = next.filter(tabId => !childIds.includes(tabId))
      }
      return next
    })
  }

  const resetDraftTabs = () => {
    setDraftTabIds(selectedPackage?.tabIds.map(String) || [])
    setSaveMessage('')
  }

  const handleCreatePackage = async (data) => {
    const response = await createPackage(data)
    const created = response.data?.package || response.data
    const normalized = normalizePackage(created)

    setPackages(prev => {
      const next = [...prev, normalized].sort((a, b) => a.id - b.id)
      return next
    })
    setSelectedPackageId(normalized.id)
    setShowCreateModal(false)
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
          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              New package
            </button>
          </div>
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
          <p>No packages found. Create your first package to configure feature access.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            New package
          </button>
        </div>
      ) : (
        <>
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

            <div className="package-feature-editor">
              <div className="package-feature-toolbar">
                <div>
                  <span className="section-kicker">Visible tabs</span>
                  <p>
                    {draftTabIds.length} of {availableTabs.length} selected
                  </p>
                </div>
                <div className="package-feature-controls">
                  <input
                    type="search"
                    value={featureSearch}
                    onChange={(event) => setFeatureSearch(event.target.value)}
                    placeholder="Search tabs..."
                    aria-label="Search visible tabs"
                  />
                  <div className="package-feature-filters" aria-label="Tab filters">
                    <button
                      type="button"
                      className={featureFilter === 'all' ? 'active' : ''}
                      onClick={() => setFeatureFilter('all')}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      className={featureFilter === 'enabled' ? 'active' : ''}
                      onClick={() => setFeatureFilter('enabled')}
                    >
                      Selected
                    </button>
                    <button
                      type="button"
                      className={featureFilter === 'disabled' ? 'active' : ''}
                      onClick={() => setFeatureFilter('disabled')}
                    >
                      Unselected
                    </button>
                  </div>
                </div>
              </div>

              {availableTabs.length === 0 ? (
                <div className="empty-state package-feature-empty">
                  <p>No visible tabs are available.</p>
                </div>
              ) : filteredVisibleTabGroups.length === 0 ? (
                <div className="empty-state package-feature-empty">
                  <p>No tabs match the current search or filter.</p>
                </div>
              ) : (
                <div className="visible-tabs-panel package-visible-tabs-panel">
                  <div className="visible-tabs-grid" aria-label={`${selectedPackage.name} visible tabs`}>
                    {filteredVisibleTabGroups.map(({ parent, children }) => {
                      const parentId = String(parent.id)
                      const parentSelected = selectedDraftTabIds.has(parentId)

                      return (
                        <div className="visible-tab-group" key={parentId}>
                          <label
                            className={`visible-tab-card visible-tab-card-parent ${parentSelected ? 'selected' : ''}`}
                          >
                            <input
                              type="checkbox"
                              value={parentId}
                              checked={parentSelected}
                              onChange={handleTabToggle}
                              disabled={saving}
                            />
                            <span>
                              <strong>{getTabLabel(parent)}</strong>
                              <small>Tab {parentId}</small>
                            </span>
                          </label>

                          {children.length > 0 && (
                            <div className="visible-tab-children">
                              {children.map((tab) => {
                                const tabId = String(tab.id)
                                const tabSelected = selectedDraftTabIds.has(tabId)

                                return (
                                  <label
                                    key={tabId}
                                    className={`visible-tab-card visible-tab-card-child ${tabSelected ? 'selected' : ''}`}
                                  >
                                    <input
                                      type="checkbox"
                                      value={tabId}
                                      checked={tabSelected}
                                      onChange={handleTabToggle}
                                      disabled={saving}
                                    />
                                    <span>
                                      <strong>{getTabLabel(tab)}</strong>
                                      <small>Tab {tabId}</small>
                                    </span>
                                  </label>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
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

      {showCreateModal && (
        <CreatePackageModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreatePackage}
        />
      )}
    </div>
  )
}

function CreatePackageModal({ onClose, onCreate }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Package name is required')
      return
    }

    setLoading(true)

    try {
      await onCreate({ name: trimmedName })
    } catch (createError) {
      setError(createError.response?.data?.detail || 'Failed to create package')
      setLoading(false)
    }
  }

  const requestClose = () => {
    if (loading) return
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={requestClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>New Package</h2>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={requestClose}
            aria-label="Close new package dialog"
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
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Package name"
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
              {loading ? 'Creating...' : 'Create package'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
