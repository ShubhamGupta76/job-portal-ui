import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jobService } from '../services/jobService';
import { useAuthContext } from './useAuthContext';

const JobContext = createContext();

export { JobContext };

export const JobProvider = ({ children }) => {
  const [jobs, setJobs] = useState([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    jobType: '',
    experience: '',
    salaryMin: '',
    salaryMax: '',
    sort: 'latest',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    size: 10,
  });

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        size: pagination.size,
        search: filters.search || undefined,
        location: filters.location || undefined,
        jobType: filters.jobType || undefined,
        experience: filters.experience || undefined,
        salaryMin: filters.salaryMin || undefined,
        salaryMax: filters.salaryMax || undefined,
        sort: filters.sort,
      };
      const response = await jobService.getJobs(params);
      const payload = response.data?.data;
      const jobsData = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.content)
          ? payload.content
          : [];
      setJobs(jobsData);
      setTotalJobs(payload?.totalElements || jobsData.length);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      const status = err.response?.status;
      if (status === 403) {
        setError('Please sign in to view jobs. <Link to="/login">Go to Login</Link>');
      } else {
        setError('Failed to load jobs. Please try again later.');
      }
      setJobs([]);
      setTotalJobs(0);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.size]);

  const { isLoggedIn } = useAuthContext();
  
  useEffect(() => {
    if (isLoggedIn) {
      fetchJobs();
    }
  }, [isLoggedIn, fetchJobs]);

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1 on filter change
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      location: '',
      jobType: '',
      experience: '',
      salaryMin: '',
      salaryMax: '',
      sort: 'latest',
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const updatePagination = (newPagination) => {
    setPagination((prev) => ({ ...prev, ...newPagination }));
  };

  const value = {
    jobs,
    totalJobs,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    clearFilters,
    updatePagination,
    fetchJobs,
  };

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
};