import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark, MapPin, Send, ShieldCheck, Sparkles, TrendingUp, Undo2, X,
} from 'lucide-react';
import Button from '../../../components/common/Button';
import { bookmarkService, recommendationService } from '../../../services';

const REASON_LABELS = {
  MATCH_SKILLS: 'Strong skill match',
  MATCH_EXPERIENCE: 'Experience level matches',
  MATCH_LOCATION: 'Matches your preferred location',
  MATCH_EMPLOYMENT_TYPE: 'Matches your work preferences',
  SIMILAR_TO_SAVED_JOB: 'Similar to jobs you saved',
  VERIFIED_COMPANY: 'Verified company',
  RECENTLY_POSTED: 'Recently posted',
};

const PAGE_SIZE = 10;

const CandidateRecommendationsPage = () => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [busyJobId, setBusyJobId] = useState(null);
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [dismissedJustNow, setDismissedJustNow] = useState({});

  const load = useCallback(async (targetPage, append) => {
    if (append) setLoadingMore(true); else setLoading(true);
    setError('');
    try {
      const response = await recommendationService.getRecommendations({ page: targetPage, size: PAGE_SIZE });
      const data = response.data?.data;
      const content = data?.content || [];
      setItems((current) => (append ? [...current, ...content] : content));
      setHasMore(data ? !data.last : false);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load your recommendations.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { load(0, false); }, [load]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    load(nextPage, true);
  };

  const handleSave = async (jobId) => {
    setBusyJobId(jobId);
    try {
      await bookmarkService.toggleBookmark(jobId);
      setSavedJobIds((current) => new Set(current).add(jobId));
    } catch {
      setError('Unable to save this job.');
    } finally {
      setBusyJobId(null);
    }
  };

  const handleDismiss = async (jobId) => {
    setBusyJobId(jobId);
    try {
      await recommendationService.dismiss(jobId);
      setItems((current) => current.filter((item) => item.job.id !== jobId));
      setDismissedJustNow((current) => ({ ...current, [jobId]: true }));
    } catch {
      setError('Unable to dismiss this job.');
    } finally {
      setBusyJobId(null);
    }
  };

  const handleUndoDismiss = async (jobId) => {
    setBusyJobId(jobId);
    try {
      await recommendationService.undoDismiss(jobId);
      setDismissedJustNow((current) => {
        const next = { ...current };
        delete next[jobId];
        return next;
      });
      await load(0, false);
      setPage(0);
    } catch {
      setError('Unable to undo dismissal.');
    } finally {
      setBusyJobId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] py-8 text-slate-950">
      <div className="mx-auto max-w-[900px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-3xl font-semibold">Recommended for you</h1>
            <p className="mt-1 text-sm text-slate-500">Ranked using your profile, skills, and saved jobs. Backend-computed, always explainable.</p>
          </div>
        </div>

        {error && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {Object.keys(dismissedJustNow).length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {Object.keys(dismissedJustNow).map((jobId) => (
              <button
                key={jobId}
                type="button"
                onClick={() => handleUndoDismiss(Number(jobId))}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
              >
                <Undo2 size={13} /> Undo dismiss
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-40 animate-pulse rounded-[28px] bg-white shadow-sm" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <Sparkles className="mx-auto text-slate-300" size={32} />
            <p className="mt-4 font-semibold text-slate-700">No recommendations yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Complete your profile and skills, or browse jobs, to get personalized matches here.
            </p>
            <Link to="/jobs" className="mt-5 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700">
              Browse all jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(({ job, finalScore, reasonCodes }) => (
              <div key={job.id} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link to={`/jobs/${job.id}`} className="text-xl font-semibold text-slate-900 hover:text-blue-700">
                      {job.title}
                    </Link>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                      {job.companyName}
                      {job.companyVerificationStatus === 'VERIFIED' && <ShieldCheck size={14} className="text-emerald-500" aria-label="Verified company" />}
                      <span className="inline-flex items-center gap-1"><MapPin size={12} /> {job.location || 'Remote'}</span>
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1.5 rounded-2xl bg-emerald-50 px-3 py-2 text-emerald-700">
                    <TrendingUp size={16} />
                    <span className="text-lg font-bold">{finalScore}%</span>
                    <span className="text-xs font-medium">match</span>
                  </div>
                </div>

                {reasonCodes?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {reasonCodes.map((code) => (
                      <span key={code} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                        &#10003; {REASON_LABELS[code] || code}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
                  <Link to={`/jobs/${job.id}`}>
                    <Button variant="outline" className="bg-white">View job</Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="bg-white"
                    onClick={() => handleSave(job.id)}
                    loading={busyJobId === job.id}
                    disabled={savedJobIds.has(job.id)}
                  >
                    <Bookmark size={15} className={savedJobIds.has(job.id) ? 'fill-blue-600 text-blue-600' : ''} />
                    {savedJobIds.has(job.id) ? 'Saved' : 'Save'}
                  </Button>
                  <Link to={`/jobs/${job.id}`}>
                    <Button><Send size={15} /> Apply</Button>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDismiss(job.id)}
                    disabled={busyJobId === job.id}
                    aria-label={`Dismiss ${job.title}`}
                    className="ml-auto flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-red-500 disabled:opacity-50"
                  >
                    <X size={15} /> Not interested
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && hasMore && items.length > 0 && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            >
              {loadingMore ? 'Loading...' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateRecommendationsPage;
