import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, Bell, Bookmark, FileCheck2, MessageCircle, Send, Sparkles,
} from 'lucide-react';
import { candidateInsightsService } from '../../../services';

const TYPE_FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'APPLICATION_SUBMITTED', label: 'Applications' },
  { key: 'APPLICATION_STATUS_CHANGED', label: 'Status changes' },
  { key: 'JOB_SAVED', label: 'Saved jobs' },
  { key: 'JOB_ALERT_MATCHED', label: 'Job alerts' },
  { key: 'MESSAGE_RECEIVED', label: 'Messages' },
];

const ICONS = {
  APPLICATION_SUBMITTED: Send,
  APPLICATION_STATUS_CHANGED: FileCheck2,
  JOB_SAVED: Bookmark,
  JOB_ALERT_MATCHED: Bell,
  MESSAGE_RECEIVED: MessageCircle,
};

const LINKS = {
  APPLICATION: '/applications',
  JOB: (id) => `/jobs/${id}`,
  CONVERSATION: '/messages',
};

const PAGE_SIZE = 15;

const CandidateActivityPage = () => {
  const [events, setEvents] = useState([]);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (targetPage, filter, append) => {
    if (append) setLoadingMore(true); else setLoading(true);
    setError('');
    try {
      const response = await candidateInsightsService.getActivity({
        type: filter === 'ALL' ? undefined : filter,
        page: targetPage,
        size: PAGE_SIZE,
      });
      const items = response.data?.data || [];
      setEvents((current) => (append ? [...current, ...items] : items));
      setHasMore(items.length === PAGE_SIZE);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load your activity feed.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setPage(0);
    load(0, typeFilter, false);
  }, [typeFilter, load]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    load(nextPage, typeFilter, true);
  };

  const groupedByDate = useMemo(() => {
    const groups = new Map();
    events.forEach((event) => {
      const key = new Date(event.timestamp).toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(event);
    });
    return Array.from(groups.entries());
  }, [events]);

  return (
    <div className="min-h-screen bg-[#f6f8fc] py-8 text-slate-950">
      <div className="mx-auto max-w-[900px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Activity size={20} />
          </div>
          <div>
            <h1 className="text-3xl font-semibold">Activity</h1>
            <p className="mt-1 text-sm text-slate-500">A unified timeline of everything happening on your applications, jobs, and messages.</p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setTypeFilter(filter.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${typeFilter === filter.key ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {error && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : groupedByDate.length === 0 ? (
            <div className="py-16 text-center">
              <Sparkles className="mx-auto text-slate-300" size={32} />
              <p className="mt-4 font-semibold text-slate-700">No activity yet</p>
              <p className="mt-1 text-sm text-slate-500">
                Apply to jobs, save searches, or start a conversation to see your activity here.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedByDate.map(([date, items]) => (
                <div key={date}>
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{date}</p>
                  <ol className="space-y-4 border-l border-slate-200 pl-5">
                    {items.map((event, index) => {
                      const Icon = ICONS[event.type] || Activity;
                      const link = typeof LINKS[event.entityType] === 'function'
                        ? LINKS[event.entityType](event.entityId)
                        : LINKS[event.entityType];
                      const content = (
                        <>
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                              <Icon size={15} />
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800">{event.title}</p>
                              {event.description && <p className="mt-1 text-sm text-slate-500">{event.description}</p>}
                              <p className="mt-1 text-xs text-slate-400">
                                {new Date(event.timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </>
                      );
                      return (
                        <li key={`${event.type}-${event.entityId}-${event.timestamp}-${index}`} className="relative">
                          <span className="absolute -left-[25px] top-2 h-2.5 w-2.5 rounded-full bg-blue-500" />
                          {link ? (
                            <Link to={link} className="block rounded-2xl p-2 -m-2 transition hover:bg-slate-50">{content}</Link>
                          ) : content}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>
          )}

          {!loading && hasMore && events.length > 0 && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateActivityPage;
