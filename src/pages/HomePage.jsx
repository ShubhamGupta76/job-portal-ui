import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
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

  return (
    <div className="bg-white">
      <section className="border-b border-gray-100 bg-gradient-to-br from-gray-50 via-white to-purple-50 py-20">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_420px] lg:px-10">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-purple-600">SaaS Hiring Platform</p>
            <h1 className="mt-6 max-w-4xl text-5xl font-bold tracking-tight text-gray-900 md:text-6xl">
              Build career momentum with a fully connected hiring marketplace.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-gray-600">
              Search relevant opportunities, manage applications, and operate recruiter workflows from a single product built for scale.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/jobs">
                <Button size="lg">Explore Jobs</Button>
              </Link>
              <Link to="/signup">
                <Button size="lg" variant="outline">Create Account</Button>
              </Link>
            </div>
          </div>

          <Card className="grid gap-4 p-6">
            <div>
              <p className="text-sm text-gray-500">Open jobs</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{metrics?.totalJobs ?? 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Applications</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{metrics?.totalApplications ?? 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Companies</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{metrics?.totalCompanies ?? 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Users</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{metrics?.totalUsers ?? 0}</p>
            </div>
          </Card>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
          <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Fresh opportunities</h2>
              <p className="mt-2 text-gray-600">Live data from the backend, sorted by the latest published roles.</p>
            </div>
            <Link to="/jobs">
              <Button variant="outline">See All Jobs</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {featuredJobs.length === 0 ? (
              <Card className="col-span-full p-6">
                <p className="text-sm text-gray-500">No jobs are available yet. Recruiters can publish roles after creating a company profile.</p>
              </Card>
            ) : (
              featuredJobs.map((job) => (
                <Card key={job.id} className="p-6">
                  <p className="text-sm text-gray-500">{job.companyName}</p>
                  <h3 className="mt-2 text-xl font-semibold text-gray-900">{job.title}</h3>
                  <p className="mt-3 text-sm text-gray-600">{job.description}</p>
                  <div className="mt-5 space-y-1 text-sm text-gray-500">
                    <p>{job.location || 'Remote'}</p>
                    <p>{job.jobType}</p>
                    <p>{job.experienceLevel}</p>
                  </div>
                  <div className="mt-6">
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
