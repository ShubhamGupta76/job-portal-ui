import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
    { label: 'Verified companies', value: metrics?.totalCompanies ?? 0 },
    { label: 'Live opportunities', value: metrics?.totalJobs ?? 0 },
    { label: 'Applications managed', value: metrics?.totalApplications ?? 0 },
    { label: 'Active talent pool', value: metrics?.totalUsers ?? 0 },
  ];

  return (
    <div className="overflow-hidden">
      <section className="px-4 pb-10 pt-8 sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-[1500px] gap-8 lg:grid-cols-[minmax(0,1.25fr)_430px]">
          <div className="rounded-[36px] bg-slate-950 px-8 py-10 text-white shadow-[0_40px_90px_rgba(15,23,42,0.22)] sm:px-12 sm:py-14">
            <Badge variant="primary" className="bg-white/12 text-blue-100">Hiring marketplace</Badge>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              A modern job portal for faster hiring, sharper applications, and cleaner recruiter workflows.
            </h1>
            <p className="mt-6 max-w-2xl text-base text-slate-300 sm:text-lg">
              Discover roles, apply with confidence, manage assessments, and keep every hiring touchpoint in one polished workspace.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/jobs">
                <Button size="lg">Explore Jobs</Button>
              </Link>
              <Link to="/signup">
                <Button size="lg" variant="outline" className="border-white/20 bg-white/8 text-white hover:bg-white/14 hover:text-white">
                  Create Account
                </Button>
              </Link>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-4">
              {highlights.map((item) => (
                <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/6 p-4 backdrop-blur">
                  <p className="text-3xl font-semibold text-white">{item.value}</p>
                  <p className="mt-2 text-sm text-slate-300">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5">
            <Card className="overflow-hidden p-0">
              <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 px-7 py-8 text-white">
                <p className="text-sm uppercase tracking-[0.22em] text-blue-100">Candidate experience</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">Track roles, resumes, and assessments from one view.</h2>
              </div>
              <div className="grid gap-4 p-7">
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Resume-ready profile</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">Keep recruiter-facing details updated and easy to review.</p>
                </div>
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Assessment support</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">Move from application to coding test without leaving the platform.</p>
                </div>
              </div>
            </Card>

            <Card className="p-7">
              <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Recruiter snapshot</p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-[22px] bg-blue-50 p-4">
                  <p className="text-sm text-slate-500">Hiring pipelines</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">Structured</p>
                </div>
                <div className="rounded-[22px] bg-cyan-50 p-4">
                  <p className="text-sm text-slate-500">Assessments</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">Built in</p>
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
              <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Fresh opportunities</p>
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
                <Card key={job.id} hoverable className="p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-500">{job.companyName}</p>
                      <h3 className="mt-2 text-2xl font-semibold text-slate-950">{job.title}</h3>
                    </div>
                    <Badge variant="primary">{job.jobType || 'Role'}</Badge>
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
