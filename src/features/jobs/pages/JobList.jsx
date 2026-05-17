import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SquareMenu } from 'lucide-react';
import { JobProvider } from '../../../context/JobContext';
import { useJobContext } from '../../../context/useJobContext';
import { useAuthContext } from '../../../context/useAuthContext';
import FilterPanel from '../components/FilterPanel';
import JobListHeader from '../components/JobListHeader';
import JobCard from '../components/JobCard';
import Pagination from '../components/Pagination';
import NotificationIcon from '../../../components/common/NotificationIcon';
import { authService, profileService } from '../../../services';

const workspaceLinks = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Find Jobs', path: '/jobs', active: true },
  { label: 'Applications', path: '/dashboard' },
  { label: 'Assessments', path: '/candidate/assessments' },
  { label: 'Profile', path: '/profile' },
];

const JobList = () => {
  const navigate = useNavigate();
  const { isLoggedIn, userRole, logout } = useAuthContext();
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let ignore = false;

    const loadViewerData = async () => {
      if (!isLoggedIn) {
        setCurrentUser(null);
        setProfile(null);
        return;
      }

      try {
        const [userResponse, profileResponse] = await Promise.allSettled([
          authService.getCurrentUser(),
          profileService.getProfile(),
        ]);

        if (!ignore) {
          setCurrentUser(userResponse.status === 'fulfilled' ? userResponse.value.data?.data || null : null);
          setProfile(profileResponse.status === 'fulfilled' ? profileResponse.value.data?.data || null : null);
        }
      } catch (error) {
        if (!ignore) {
          setCurrentUser(null);
          setProfile(null);
        }
      }
    };

    loadViewerData();

    return () => {
      ignore = true;
    };
  }, [isLoggedIn]);

  const displayName = useMemo(() => {
    const firstName = currentUser?.firstName || profile?.firstName || '';
    const lastName = currentUser?.lastName || profile?.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || currentUser?.email || 'Guest User';
  }, [currentUser, profile]);

  const displayRole = useMemo(() => {
    return (currentUser?.role || userRole || 'guest').toLowerCase();
  }, [currentUser, userRole]);

  const initials = useMemo(() => {
    const source = displayName === 'Guest User' ? 'GU' : displayName;
    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }, [displayName]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <JobProvider>
      <div className="min-h-screen bg-[#f7f8fb] text-slate-900">
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-6 px-6 py-5">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Search jobs, companies...
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden items-center gap-3 md:flex">
                {isLoggedIn && <NotificationIcon />}
                <Link
                  to={userRole === 'recruiter' ? '/recruiter/dashboard' : '/dashboard'}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                  aria-label="Dashboard menu"
                >
                  <SquareMenu size={18} />
                </Link>
              </div>
              <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                  <p className="text-xs capitalize text-slate-500">{displayRole}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                  {initials || 'GU'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto grid min-h-[calc(100vh-81px)] max-w-[1500px] grid-cols-1 xl:grid-cols-[255px_305px_minmax(0,1fr)]">
          <aside className="border-r border-slate-200 bg-white">
            <div className="px-6 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">◇</div>
                <div>
                  <p className="text-3xl font-semibold leading-none text-blue-600">TalentHub</p>
                </div>
              </div>
            </div>

            <nav className="space-y-1 px-4">
              {workspaceLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-lg transition ${
                    item.active
                      ? 'bg-blue-600 font-semibold text-white shadow-[0_12px_26px_rgba(37,99,235,0.24)]'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="mt-auto px-6 pb-8 pt-16 text-sm text-slate-500">
              <div className="space-y-4 border-t border-slate-200 pt-6">
                <p>Settings</p>
                {isLoggedIn ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-rose-500 transition hover:text-rose-600"
                  >
                    Logout
                  </button>
                ) : (
                  <Link to="/login" className="text-blue-600 transition hover:text-blue-700">
                    Login
                  </Link>
                )}
              </div>
            </div>
          </aside>

          <aside className="border-r border-slate-200 bg-white">
            <FilterPanel />
          </aside>

          <section className="bg-[#fbfbfd] px-6 py-8">
            <JobListHeader />
            <JobListings />
            <Pagination />
            <ProfilePrompt profile={profile} isLoggedIn={isLoggedIn} />
          </section>
        </div>
      </div>
    </JobProvider>
  );
};

const JobListings = () => {
  const { jobs, loading, error, totalJobs } = useJobContext();
  const jobItems = Array.isArray(jobs) ? jobs : [];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-[420px] animate-pulse rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-center text-red-700">
        {error}
      </div>
    );
  }

  if (!(jobItems && jobItems.length > 0)) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white px-8 py-16 text-center shadow-sm">
        <h3 className="text-2xl font-semibold text-slate-900">No jobs found</h3>
        <p className="mt-3 text-slate-500">
          Try adjusting your filters or search terms.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {jobItems.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-slate-500">
        Showing {jobItems.length} of {totalJobs} results
      </p>
    </>
  );
};

const ProfilePrompt = ({ profile, isLoggedIn }) => {
  const profileChecks = [
    Boolean(profile?.firstName),
    Boolean(profile?.headline),
    Boolean(profile?.location),
    Boolean(profile?.resumePath),
  ];
  const completedCount = profileChecks.filter(Boolean).length;
  const isComplete = completedCount === profileChecks.length;

  const title = !isLoggedIn
    ? 'Sign in to personalize your job search'
    : isComplete
      ? 'Your profile is ready for recruiters'
      : 'Complete your profile to improve job discovery';

  const description = !isLoggedIn
    ? 'Login to unlock saved jobs, personalized applications, and your full candidate workspace.'
    : isComplete
      ? 'Your current profile data is available and ready to support applications from this job board.'
      : `You have completed ${completedCount} of ${profileChecks.length} key profile sections. Add the remaining details to strengthen applications.`;

  return (
    <div className="mt-14 rounded-[28px] border border-slate-200 bg-white px-8 py-8 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl text-blue-600">
            ☆
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 max-w-2xl text-slate-500">
              {description}
            </p>
          </div>
        </div>
        <Link
          to={isLoggedIn ? '/profile' : '/login'}
          className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)] hover:bg-blue-700"
        >
          {isLoggedIn ? 'Go to Profile' : 'Login'}
        </Link>
      </div>
    </div>
  );
};

export default JobList;
