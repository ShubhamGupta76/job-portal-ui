import React from 'react';
import { useJobContext } from '../../../context/useJobContext';

const Pagination = () => {
  const { totalJobs, pagination, updatePagination } = useJobContext();

  const totalPages = Math.ceil(totalJobs / pagination.size);
  const currentPage = pagination.page;

  if (totalPages <= 1) return null;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      updatePagination({ page });
    }
  };

  const getVisiblePages = () => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className="mt-10 flex flex-col items-center gap-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 disabled:opacity-40"
        >
          ‹
        </button>

        {getVisiblePages().map((page, index) => (
          <button
            key={`${page}-${index}`}
            onClick={() => typeof page === 'number' && handlePageChange(page)}
            disabled={page === '...'}
            className={`flex h-11 min-w-11 items-center justify-center rounded-xl px-4 text-sm font-semibold ${
              page === currentPage
                ? 'bg-blue-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.22)]'
                : page === '...'
                ? 'cursor-default text-slate-500'
                : 'border border-slate-200 bg-white text-slate-700'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 disabled:opacity-40"
        >
          ›
        </button>
      </div>
    </div>
  );
};

export default Pagination;
