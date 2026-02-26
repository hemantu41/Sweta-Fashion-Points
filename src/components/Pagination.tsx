/**
 * Pagination Component
 * Reusable pagination controls for paginated lists
 */

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNext: boolean;
  hasPrev: boolean;
  total?: number;
  showTotal?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  hasNext,
  hasPrev,
  total,
  showTotal = false,
}: PaginationProps) {
  // Generate page numbers to show (max 7 pages)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col items-center gap-4 mt-6">
      {/* Page numbers */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrev}
          className="px-4 py-2 border border-[#E8E2D9] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F0EDE8] transition-colors text-[#2D2D2D] font-medium"
          aria-label="Previous page"
        >
          Previous
        </button>

        {/* Page number buttons */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-[#6B6B6B]"
                >
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  isActive
                    ? 'bg-[#722F37] text-white'
                    : 'text-[#2D2D2D] hover:bg-[#F0EDE8] border border-[#E8E2D9]'
                }`}
                aria-label={`Page ${pageNum}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNext}
          className="px-4 py-2 border border-[#E8E2D9] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F0EDE8] transition-colors text-[#2D2D2D] font-medium"
          aria-label="Next page"
        >
          Next
        </button>
      </div>

      {/* Page info */}
      <div className="text-sm text-[#6B6B6B]">
        {showTotal && total !== undefined ? (
          <span>
            Showing page {currentPage} of {totalPages} ({total.toLocaleString()} total items)
          </span>
        ) : (
          <span>
            Page {currentPage} of {totalPages}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Simple Pagination (Previous/Next only)
 * Lightweight version for simple use cases
 */
interface SimplePaginationProps {
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  currentPage?: number;
  loading?: boolean;
}

export function SimplePagination({
  onNext,
  onPrevious,
  hasNext,
  hasPrev,
  currentPage,
  loading = false,
}: SimplePaginationProps) {
  return (
    <div className="flex items-center justify-center gap-4 mt-6">
      <button
        onClick={onPrevious}
        disabled={!hasPrev || loading}
        className="px-6 py-2 border border-[#E8E2D9] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F0EDE8] transition-colors text-[#2D2D2D] font-medium"
      >
        Previous
      </button>

      {currentPage !== undefined && (
        <span className="px-4 py-2 text-[#2D2D2D] font-medium">
          Page {currentPage}
        </span>
      )}

      <button
        onClick={onNext}
        disabled={!hasNext || loading}
        className="px-6 py-2 border border-[#E8E2D9] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F0EDE8] transition-colors text-[#2D2D2D] font-medium"
      >
        Next
      </button>
    </div>
  );
}
