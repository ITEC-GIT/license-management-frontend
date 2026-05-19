const getVisiblePages = (currentPage, totalPages) => {
  const maxVisiblePages = 5
  const halfWindow = Math.floor(maxVisiblePages / 2)
  const startPage = Math.max(1, Math.min(currentPage - halfWindow, totalPages - maxVisiblePages + 1))
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

  return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index)
}

export default function PaginationControls({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = 'items',
}) {
  const totalPages = Math.ceil(totalItems / pageSize)

  if (totalPages <= 1) return null

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(totalItems, currentPage * pageSize)
  const visiblePages = getVisiblePages(currentPage, totalPages)

  return (
    <div className="pagination-controls" aria-label={`${itemLabel} pagination`}>
      <p className="pagination-summary">
        Showing {startItem}-{endItem} of {totalItems} {itemLabel}
      </p>

      <div className="pagination-actions">
        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>

        {visiblePages.map(page => (
          <button
            key={page}
            type="button"
            className={`btn btn-sm ${page === currentPage ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  )
}
