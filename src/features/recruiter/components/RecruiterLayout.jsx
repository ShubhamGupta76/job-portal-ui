import React from 'react';
import Sidebar from './Sidebar';
import RecruiterNavbar from './RecruiterNavbar';

const RecruiterLayout = ({ title, subtitle, children, action }) => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="order-2 xl:order-1 xl:sticky xl:top-8">
            <Sidebar />
          </aside>

          <main className="order-1 xl:order-2">
            <RecruiterNavbar title={title} subtitle={subtitle} action={action} />
            <div className="mt-6 space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default RecruiterLayout;
