import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BriefcaseBusiness, ClipboardCheck, Layers3, UsersRound } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { dashboardService, jobService } from '../services';

const HomePage = () => {
  const [metrics, setMetrics] = useState(null);
  const [featuredJobs, setFeaturedJobs] = useState([]);

  useEffect(() => {
    const loadHome = async () => {
      try {
        const [metricsResponse, jobsResponse] = await Promise.all([
          dashboardService.getPublicMetrics(),
          jobService.getJobs({ size: 3, sortBy: 'createdAt', sortDir: 'desc' }),
        ]);

        setMetrics(metricsResponse.data?.data || null);
        const payload = jobsResponse.data?.data;
        setFeaturedJobs(Array.isArray(payload?.content) ? payload.content : []);
      } catch (error) {
        console.error('Home page load error:', error);
      }
    };

    loadHome();
  }, []);

  const highlights = [
    { label: 'Verified companies', value: metrics?.totalCompanies ?? 0, icon: BriefcaseBusiness, tone: 'bg-emerald-400/16 text-emerald-100' },
    { label: 'Live opportunities', value: metrics?.totalJobs ?? 0, icon: Layers3, tone: 'bg-sky-400/16 text-sky-100' },
    { label: 'Applications managed', value: metrics?.totalApplications ?? 0, icon: ClipboardCheck, tone: 'bg-amber-300/18 text-amber-100' },
    { label: 'Active talent pool', value: metrics?.totalUsers ?? 0, icon: UsersRound, tone: 'bg-rose-300/16 text-rose-100' },
  ];

  return (
    <div className="overflow-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#ecfdf5_42%,#fff7ed_100%)]">
      <section className="px-4 pb-10 pt-8 sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-[1500px] gap-6 xl:grid-cols-[minmax(0,1.28fr)_430px]">
          <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#0f172a_0%,#0f766e_55%,#f97316_140%)] px-6 py-8 text-white shadow-[0_34px_80px_rgba(15,23,42,0.24)] sm:px-10 sm:py-12 lg:px-12 lg:py-14">
            <Badge variant="primary" className="border border-white/15 bg-white/14 text-emerald-50">Hiring marketplace</Badge>
            <h1 className="mt-6 max-w-4xl text-3xl font-semibold tracking-normal text-white sm:text-5xl lg:text-6xl">
              A modern job portal for faster hiring, sharper applications, and cleaner recruiter workflows.
            </h1>
            <p className="mt-6 max-w-2xl text-base text-emerald-50/88 sm:text-lg">
              Discover roles, apply with confidence, manage assessments, and keep every hiring touchpoint in one polished workspace.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/jobs"
                className="group relative inline-flex min-h-14 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#f97316_0%,#facc15_55%,#22c55e_130%)] px-7 py-3.5 text-base font-bold text-slate-950 shadow-[0_18px_38px_rgba(249,115,22,0.34)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_52px_rgba(34,197,94,0.30)] focus:outline-none focus:ring-4 focus:ring-amber-200"
              >
                <span className="absolute inset-y-0 -left-10 w-8 rotate-12 bg-white/45 transition-all duration-700 group-hover:left-[115%]" />
                <span className="relative">Explore Jobs</span>
                <ArrowRight className="relative transition-transform duration-300 group-hover:translate-x-1" size={18} aria-hidden="true" />
              </Link>
              <Link
                to="/signup"
                className="group inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/30 bg-white/14 px-7 py-3.5 text-base font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_16px_34px_rgba(15,23,42,0.18)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:bg-white hover:text-teal-900 hover:shadow-[0_22px_48px_rgba(20,184,166,0.26)] focus:outline-none focus:ring-4 focus:ring-emerald-200"
              >
                <span>Create Account</span>
                <ArrowRight className="ml-2 transition-transform duration-300 group-hover:translate-x-1" size={18} aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {highlights.map((item) => (
                <div key={item.label} className="rounded-[18px] border border-white/14 bg-white/10 p-4 backdrop-blur">
                  <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl ${item.tone}`}>
                    <item.icon size={19} aria-hidden="true" />
                  </div>
                  <p className="text-3xl font-semibold text-white">{item.value}</p>
                  <p className="mt-1 text-sm text-white/75">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
            <Card className="overflow-hidden rounded-[28px] border-0 bg-white p-0 shadow-[0_26px_70px_rgba(15,23,42,0.12)]">
              <div className="bg-[linear-gradient(135deg,#fff7ed_0%,#fed7aa_46%,#14b8a6_140%)] px-6 py-7 text-slate-950 sm:px-7 sm:py-8">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-700">Candidate experience</p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-950 sm:text-3xl">Track roles, resumes, and assessments from one view.</h2>
              </div>
              <div className="grid gap-4 p-5 sm:p-7">
                <div className="rounded-[18px] border border-orange-100 bg-orange-50/70 p-4">
                  <p className="text-sm font-medium text-orange-700">Resume-ready profile</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">Keep recruiter-facing details updated and easy to review.</p>
                </div>
                <div className="rounded-[18px] border border-teal-100 bg-teal-50/80 p-4">
                  <p className="text-sm font-medium text-teal-700">Assessment support</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">Move from application to coding test without leaving the platform.</p>
                </div>
              </div>
            </Card>

            <Card className="rounded-[28px] border border-teal-100 bg-white p-5 text-slate-950 shadow-[0_26px_70px_rgba(15,23,42,0.12)] sm:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Recruiter snapshot</p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="group rounded-[18px] border border-teal-100 bg-teal-50 p-4 shadow-[0_12px_28px_rgba(13,148,136,0.10)] transition duration-300 hover:-translate-y-1 hover:border-teal-300 hover:bg-teal-600 hover:shadow-[0_20px_44px_rgba(13,148,136,0.22)]">
                  <p className="text-sm font-medium text-teal-700 transition group-hover:text-teal-50">Hiring pipelines</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950 transition group-hover:text-white">Structured</p>
                </div>
                <div className="group rounded-[18px] border border-amber-100 bg-amber-50 p-4 shadow-[0_12px_28px_rgba(245,158,11,0.10)] transition duration-300 hover:-translate-y-1 hover:border-amber-300 hover:bg-amber-500 hover:shadow-[0_20px_44px_rgba(245,158,11,0.24)]">
                  <p className="text-sm font-medium text-amber-700 transition group-hover:text-amber-50">Assessments</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950 transition group-hover:text-white">Built in</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-700">Fresh opportunities</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">Latest roles from your current backend data</h2>
              <p className="mt-2 text-slate-500">The cards below are still powered by the existing job API. Only the UI treatment changed.</p>
            </div>
            <Link to="/jobs">
              <Button variant="outline">See All Jobs</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {featuredJobs.length === 0 ? (
              <Card className="col-span-full p-8">
                <p className="text-sm text-slate-500">No jobs are available yet. Recruiters can publish roles after creating a company profile.</p>
              </Card>
            ) : (
              featuredJobs.map((job) => (
                <Card key={job.id} hoverable className="rounded-[22px] border-0 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-teal-700">{job.companyName}</p>
                      <h3 className="mt-2 text-2xl font-semibold text-slate-950">{job.title}</h3>
                    </div>
                    <Badge variant="primary" className="bg-orange-100 text-orange-700">{job.jobType || 'Role'}</Badge>
                  </div>
                  <p className="mt-4 line-clamp-2 text-sm leading-7 text-slate-600">{job.description}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <Badge>{job.location || 'Remote'}</Badge>
                    <Badge variant="success">{job.experienceLevel || 'Open level'}</Badge>
                  </div>
                  <div className="mt-8 flex items-center justify-between">
                    <p className="text-sm text-slate-500">Live application flow</p>
                    <Link to={`/jobs/${job.id}`}>
                      <Button>View Role</Button>
                    </Link>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
