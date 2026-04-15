import React from 'react';

const RecruiterNavbar = ({ title, subtitle, action }) => {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
};

export default RecruiterNavbar;
