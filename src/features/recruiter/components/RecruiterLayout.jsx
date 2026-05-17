import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import RecruiterNavbar from './RecruiterNavbar';
import { recruiterMenuItems } from './Sidebar';

const RecruiterLayout = ({ title, subtitle, children, action, navigationMode = 'side' }) => {
  const location = useLocation();
  const useTopNav = navigationMode === 'top';

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        {useTopNav ? (
          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white px-5 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <div className="flex flex-wrap items-center gap-3">
                {recruiterMenuItems.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        active
                          ? 'bg-blue-600 text-white shadow-[0_10px_25px_rgba(37,99,235,0.22)]'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <main>
              <RecruiterNavbar title={title} subtitle={subtitle} action={action} />
              <div className="mt-6 space-y-6">{children}</div>
            </main>
          </div>
        ) : (
          <div className="grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="order-2 xl:order-1 xl:sticky xl:top-8">
              <Sidebar />
            </aside>

            <main className="order-1 xl:order-2">
              <RecruiterNavbar title={title} subtitle={subtitle} action={action} />
              <div className="mt-6 space-y-6">{children}</div>
            </main>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterLayout;
