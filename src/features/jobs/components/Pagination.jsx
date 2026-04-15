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
    const delta = 2;
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
    <div className="mt-8 flex items-center justify-center gap-2">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Previous
      </button>

      {getVisiblePages().map((page, index) => (
        <button
          key={index}
          onClick={() => typeof page === 'number' && handlePageChange(page)}
          disabled={page === '...'}
          className={`rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            page === currentPage
              ? 'bg-blue-600 text-white'
              : page === '...'
              ? 'cursor-default text-gray-700'
              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;