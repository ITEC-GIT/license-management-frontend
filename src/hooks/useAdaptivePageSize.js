import { useLayoutEffect, useState } from 'react'

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const getRowHeight = (container, fallbackHeight) => {
  const rows = Array.from(container.querySelectorAll('tbody tr')).slice(0, 5)
  if (rows.length === 0) return fallbackHeight

  const measuredHeight = Math.max(
    ...rows.map((row) => {
      const styles = window.getComputedStyle(row)
      const marginBottom = parseFloat(styles.marginBottom) || 0
      return row.getBoundingClientRect().height + marginBottom
    })
  )

  return measuredHeight || fallbackHeight
}

export default function useAdaptivePageSize({
  containerRef,
  totalItems,
  minRows = 1,
  maxRows = 50,
  desktopFallbackRowHeight = 54,
  mobileFallbackRowHeight = 150,
  paginationFallbackHeight = 66,
  bottomGutter = 20,
  dependencies = [],
}) {
  const [pageSize, setPageSize] = useState(minRows)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container || totalItems <= 0) {
      setPageSize(minRows)
      return undefined
    }

    let frameId = null

    const calculatePageSize = () => {
      if (frameId) cancelAnimationFrame(frameId)

      frameId = requestAnimationFrame(() => {
        const isMobileTable = window.matchMedia('(max-width: 760px)').matches
        const fallbackRowHeight = isMobileTable ? mobileFallbackRowHeight : desktopFallbackRowHeight
        const rowHeight = getRowHeight(container, fallbackRowHeight)
        const tableTop = container.getBoundingClientRect().top
        const tableHeaderHeight = container.querySelector('thead')?.getBoundingClientRect().height || 0
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight
        const availableWithoutPagination = viewportHeight - tableTop - tableHeaderHeight - bottomGutter
        const rowsWithoutPagination = Math.floor(availableWithoutPagination / rowHeight)
        const needsPagination = totalItems > rowsWithoutPagination
        const measuredPaginationHeight =
          container.querySelector('.pagination-controls')?.getBoundingClientRect().height || paginationFallbackHeight
        const availableHeight =
          availableWithoutPagination - (needsPagination ? measuredPaginationHeight : 0)
        const calculatedRows = Math.floor(availableHeight / rowHeight)
        const nextPageSize = clamp(calculatedRows, minRows, Math.min(maxRows, totalItems))

        setPageSize(prevPageSize => (prevPageSize === nextPageSize ? prevPageSize : nextPageSize))
      })
    }

    calculatePageSize()
    window.addEventListener('resize', calculatePageSize)

    const resizeObserver = new ResizeObserver(calculatePageSize)
    resizeObserver.observe(container)

    return () => {
      if (frameId) cancelAnimationFrame(frameId)
      window.removeEventListener('resize', calculatePageSize)
      resizeObserver.disconnect()
    }
  }, [
    bottomGutter,
    containerRef,
    desktopFallbackRowHeight,
    maxRows,
    minRows,
    mobileFallbackRowHeight,
    pageSize,
    paginationFallbackHeight,
    totalItems,
    ...dependencies,
  ])

  return pageSize
}
