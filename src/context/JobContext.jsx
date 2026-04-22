import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jobService } from '../services/jobService';

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

  const extractJobsPayload = (responseData) => {
    const rawData = responseData?.data;

    if (Array.isArray(rawData)) {
      return {
        jobs: rawData,
        totalJobs: rawData.length,
      };
    }

    if (Array.isArray(rawData?.content)) {
      return {
        jobs: rawData.content,
        totalJobs: rawData.totalElements ?? rawData.content.length,
      };
    }

    if (Array.isArray(responseData?.content)) {
      return {
        jobs: responseData.content,
        totalJobs: responseData.totalElements ?? responseData.content.length,
      };
    }

    return {
      jobs: [],
      totalJobs: 0,
    };
  };

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await jobService.getJobs({
        page: Math.max(0, pagination.page - 1),
        size: pagination.size,
      });
      console.log('RAW API:', response);

      const jobsArray =
        response?.data?.data ??
        response?.data?.content ??
        response?.data ??
        [];

      console.log('PARSED JOBS:', jobsArray);

      const { jobs: jobsData, totalJobs: resolvedTotalJobs } = extractJobsPayload({
        data: jobsArray,
      });

      setJobs(jobsData);
      setTotalJobs(resolvedTotalJobs);
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
  
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    console.log('Jobs state:', jobs);
  }, [jobs]);

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
