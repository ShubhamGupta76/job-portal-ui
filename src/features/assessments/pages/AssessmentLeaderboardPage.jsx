import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowUpRight,
  Award,
  CheckCircle2,
  Eye,
  Filter,
  Medal,
  Search,
  ShieldAlert,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import RecruiterLayout from '../../recruiter/components/RecruiterLayout';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import apiClient from '../../../services/apiClient';

const STATUS_FILTERS = ['all', 'passed', 'review', 'failed'];

const AssessmentLeaderboardPage = () => {
  const { assessmentId } = useParams();
  const [leaderboard, setLeaderboard] = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedResult, setSelectedResult] = useState(null);
  const [showProctoringReport, setShowProctoringReport] = useState(false);
  const [proctoringData, setProctoringData] = useState(null);
  const [proctoringLoading, setProctoringLoading] = useState(false);
  const [proctoringError, setProctoringError] = useState('');

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const [leaderboardRes, assessmentRes] = await Promise.all([
          apiClient.get(`/results/assessment/${assessmentId}/leaderboard`),
          apiClient.get(`/assessments/${assessmentId}`),
        ]);

        if (ignore) return;

        setLeaderboard(Array.isArray(leaderboardRes.data) ? leaderboardRes.data : []);
        setAssessment(assessmentRes.data?.data || assessmentRes.data || null);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
        if (!ignore) {
          setError(err.response?.data?.message || 'Unable to load this leaderboard right now.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      ignore = true;
    };
  }, [assessmentId]);

  const passingScore = useMemo(() => {
    const value = Number.parseFloat(String(assessment?.passingMarksPercentage || '').replace('%', ''));
    return Number.isFinite(value) ? value : 60;
  }, [assessment]);

  const maxMarks = useMemo(() => {
    const assessmentMarks = Number(assessment?.totalMarks);
    if (Number.isFinite(assessmentMarks) && assessmentMarks > 0) {
      return assessmentMarks;
    }

    const resultMax = Math.max(...leaderboard.map((item) => Number(item.maxScore || item.maxMarks || item.score || 0)));
    return Number.isFinite(resultMax) && resultMax > 0 ? resultMax : 100;
  }, [assessment, leaderboard]);

  const rows = useMemo(() => {
    return leaderboard
      .map((item, index) => {
        const percentage = clamp(Number(item.percentageScore ?? item.percentage ?? 0), 0, 100);
        const score = Number(item.score ?? item.totalScore ?? item.totalMarksObtained ?? 0);
        const passed = Boolean(item.passed) || percentage >= passingScore;
        const status = passed ? 'passed' : percentage >= Math.max(0, passingScore - 10) ? 'review' : 'failed';

        return {
          ...item,
          id: item.sessionId || item.resultId || `${item.candidateName || 'candidate'}-${index}`,
          rank: item.rank || index + 1,
          candidateName: item.candidateName || item.userName || `Candidate ${index + 1}`,
          score,
          percentage,
          passed,
          status,
          completedAt: item.completedAt || item.updatedAt || item.createdAt || '',
          sessionId: item.sessionId,
        };
      })
      .sort((a, b) => a.rank - b.rank);
  }, [leaderboard, passingScore]);

  const stats = useMemo(() => {
    const total = rows.length;
    const passed = rows.filter((item) => item.passed).length;
    const average = total ? rows.reduce((sum, item) => sum + item.percentage, 0) / total : 0;
    const highest = total ? Math.max(...rows.map((item) => item.percentage)) : 0;
    const review = rows.filter((item) => item.status === 'review').length;

    return {
      total,
      passed,
      average,
      highest,
      review,
      passRate: total ? (passed / total) * 100 : 0,
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();

    return rows.filter((item) => {
      const matchesSearch = !term || [item.candidateName, item.status, item.completedAt]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [query, rows, statusFilter]);

  const podium = rows.slice(0, 3);

  const fetchProctoringReport = async (sessionId) => {
    if (!sessionId) {
      setProctoringError('This result does not include a session id for proctoring.');
      setShowProctoringReport(true);
      setProctoringData(null);
      return;
    }

    setProctoringLoading(true);
    setProctoringError('');
    setShowProctoringReport(true);

    try {
      const response = await apiClient.get(`/proctoring/${sessionId}/summary`);
      setProctoringData(response.data?.data || response.data || null);
    } catch (err) {
      console.error('Failed to fetch proctoring report:', err);
      setProctoringData(null);
      setProctoringError(err.response?.data?.message || 'Unable to load proctoring report.');
    } finally {
      setProctoringLoading(false);
    }
  };

  const closeProctoringReport = () => {
    setShowProctoringReport(false);
    setProctoringData(null);
    setProctoringError('');
  };

  return (
    <RecruiterLayout
      title="Assessment Leaderboard"
      subtitle={assessment?.title || 'Live performance board for this assessment'}
      action={(
        <Link to="/recruiter/assessments">
          <Button variant="outline" size="sm">Back to Assessments</Button>
        </Link>
      )}
    >
      {loading ? (
        <LeaderboardSkeleton />
      ) : error ? (
        <div className="rounded-[28px] border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-[#f8fbff] shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
            <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="p-5 sm:p-7 lg:p-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <Badge variant={assessment?.status === 'PUBLISHED' ? 'success' : 'primary'}>
                      {assessment?.status ? formatLabel(assessment.status) : 'Results'}
                    </Badge>
                    <h2 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
                      {assessment?.title || 'Assessment Results'}
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                      Compare candidate outcomes, spot high performers, and review proctoring risk from one responsive workspace.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
                    <MiniMetric label="Pass Rate" value={`${stats.passRate.toFixed(0)}%`} tone="emerald" />
                    <MiniMetric label="Cut Score" value={`${passingScore.toFixed(0)}%`} tone="slate" />
                  </div>
                </div>

                <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard icon={Users} label="Attempts" value={stats.total} caption={`${filteredRows.length} in current view`} tone="blue" />
                  <StatCard icon={CheckCircle2} label="Passed" value={stats.passed} caption={`${stats.review} near threshold`} tone="emerald" />
                  <StatCard icon={Award} label="Average" value={`${stats.average.toFixed(1)}%`} caption="Across all attempts" tone="violet" />
                  <StatCard icon={Trophy} label="Best Score" value={`${stats.highest.toFixed(1)}%`} caption={`Out of ${maxMarks} marks`} tone="amber" />
                </div>
              </div>

              <div className="border-t border-slate-200 bg-white p-5 sm:p-7 xl:border-l xl:border-t-0">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Top Candidates</p>
                    <p className="mt-2 text-sm text-slate-500">Ranked by final percentage score.</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                    <Medal size={20} />
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {podium.length > 0 ? podium.map((item) => (
                    <PodiumRow key={item.id} result={item} />
                  )) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                      No attempts have been submitted yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search candidate, status, date..."
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <Filter size={17} className="shrink-0 text-slate-400" />
                {STATUS_FILTERS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
                      statusFilter === status
                        ? 'bg-slate-950 text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)]'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-950'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {filteredRows.length === 0 ? (
              <EmptyState query={query} />
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                        <th className="px-5 py-4">Rank</th>
                        <th className="px-5 py-4">Candidate</th>
                        <th className="px-5 py-4">Score</th>
                        <th className="px-5 py-4">Progress</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Completed</th>
                        <th className="px-5 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRows.map((result) => (
                        <LeaderboardTableRow
                          key={result.id}
                          result={result}
                          maxMarks={maxMarks}
                          onView={setSelectedResult}
                          onProctoring={fetchProctoringReport}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-4 p-4 lg:hidden">
                  {filteredRows.map((result) => (
                    <LeaderboardMobileCard
                      key={result.id}
                      result={result}
                      maxMarks={maxMarks}
                      onView={setSelectedResult}
                      onProctoring={fetchProctoringReport}
                    />
                  ))}
                </div>
              </>
            )}
          </section>

          {selectedResult && (
            <ResultDrawer
              result={selectedResult}
              assessment={assessment}
              maxMarks={maxMarks}
              onClose={() => setSelectedResult(null)}
              onProctoring={fetchProctoringReport}
            />
          )}

          {showProctoringReport && (
            <ProctoringModal
              data={proctoringData}
              loading={proctoringLoading}
              error={proctoringError}
              onClose={closeProctoringReport}
            />
          )}
        </div>
      )}
    </RecruiterLayout>
  );
};

const StatCard = ({ icon: Icon, label, value, caption, tone }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    violet: 'bg-violet-50 text-violet-700 ring-violet-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  };

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ${tones[tone]}`}>
          <Icon size={19} />
        </div>
      </div>
      <p className="mt-4 text-xs font-medium text-slate-400">{caption}</p>
    </div>
  );
};

const MiniMetric = ({ label, value, tone }) => {
  const color = tone === 'emerald' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-700 bg-slate-100';
  return (
    <div className={`rounded-2xl px-4 py-3 ${color}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
};

const PodiumRow = ({ result }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
    <RankBadge rank={result.rank} />
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-slate-950">{result.candidateName}</p>
      <p className="text-xs text-slate-500">{result.percentage.toFixed(1)}% final score</p>
    </div>
    <StatusPill status={result.status} />
  </div>
);

const LeaderboardTableRow = ({ result, maxMarks, onView, onProctoring }) => (
  <tr className="transition hover:bg-slate-50">
    <td className="px-5 py-4"><RankBadge rank={result.rank} /></td>
    <td className="px-5 py-4">
      <CandidateIdentity name={result.candidateName} subtitle={`Session ${result.sessionId || 'not linked'}`} />
    </td>
    <td className="px-5 py-4">
      <p className="font-semibold text-slate-950">{formatNumber(result.score)} / {formatNumber(maxMarks)}</p>
      <p className="text-xs text-slate-500">{result.percentage.toFixed(1)}%</p>
    </td>
    <td className="px-5 py-4">
      <ScoreBar value={result.percentage} status={result.status} />
    </td>
    <td className="px-5 py-4"><StatusPill status={result.status} /></td>
    <td className="px-5 py-4 text-sm text-slate-500">{formatDate(result.completedAt)}</td>
    <td className="px-5 py-4">
      <div className="flex justify-end gap-2">
        <IconButton label="View result" onClick={() => onView(result)} icon={Eye} />
        <IconButton label="Proctoring report" onClick={() => onProctoring(result.sessionId)} icon={ShieldAlert} accent />
      </div>
    </td>
  </tr>
);

const LeaderboardMobileCard = ({ result, maxMarks, onView, onProctoring }) => (
  <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <CandidateIdentity name={result.candidateName} subtitle={formatDate(result.completedAt)} />
      <RankBadge rank={result.rank} />
    </div>
    <div className="mt-4 grid grid-cols-2 gap-3">
      <MiniMetric label="Score" value={`${formatNumber(result.score)}/${formatNumber(maxMarks)}`} tone="slate" />
      <MiniMetric label="Result" value={`${result.percentage.toFixed(1)}%`} tone={result.passed ? 'emerald' : 'slate'} />
    </div>
    <div className="mt-4">
      <ScoreBar value={result.percentage} status={result.status} />
    </div>
    <div className="mt-4 flex items-center justify-between gap-3">
      <StatusPill status={result.status} />
      <div className="flex gap-2">
        <IconButton label="View result" onClick={() => onView(result)} icon={Eye} />
        <IconButton label="Proctoring report" onClick={() => onProctoring(result.sessionId)} icon={ShieldAlert} accent />
      </div>
    </div>
  </article>
);

const CandidateIdentity = ({ name, subtitle }) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'C';

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
        {initials}
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-950">{name}</p>
        <p className="truncate text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
};

const RankBadge = ({ rank }) => {
  const special = rank === 1 ? 'bg-amber-100 text-amber-700' : rank === 2 ? 'bg-slate-200 text-slate-700' : rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-700';

  return (
    <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${special}`}>
      {rank}
    </span>
  );
};

const ScoreBar = ({ value, status }) => {
  const color = status === 'passed' ? 'bg-emerald-500' : status === 'review' ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className="min-w-[190px]">
      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
        <span>Progress</span>
        <span>{value.toFixed(1)}%</span>
      </div>
      <div className="mt-2 h-2.5 rounded-full bg-slate-100">
        <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${clamp(value, 0, 100)}%` }} />
      </div>
    </div>
  );
};

const StatusPill = ({ status }) => {
  const config = {
    passed: { label: 'Passed', variant: 'success' },
    review: { label: 'Review', variant: 'warning' },
    failed: { label: 'Failed', variant: 'danger' },
  }[status] || { label: 'Pending', variant: 'default' };

  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const IconButton = ({ label, onClick, icon: Icon, accent = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border text-sm transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
      accent
        ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
        : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
    }`}
    aria-label={label}
    title={label}
  >
    <Icon size={18} />
  </button>
);

const ResultDrawer = ({ result, assessment, maxMarks, onClose, onProctoring }) => (
  <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 p-3 backdrop-blur-sm sm:p-5">
    <aside className="flex h-full w-full max-w-xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Candidate Result</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-950">{result.candidateName}</h3>
          <p className="mt-1 text-sm text-slate-500">{assessment?.title || 'Assessment'} results and completion summary</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-2xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close details">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <div className="grid grid-cols-2 gap-3">
          <MiniMetric label="Rank" value={`#${result.rank}`} tone="slate" />
          <MiniMetric label="Score" value={`${formatNumber(result.score)}/${formatNumber(maxMarks)}`} tone={result.passed ? 'emerald' : 'slate'} />
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <ScoreBar value={result.percentage} status={result.status} />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <StatusPill status={result.status} />
            <span className="text-sm font-medium text-slate-500">Completed {formatDate(result.completedAt)}</span>
          </div>
        </div>
        <div className="rounded-[24px] border border-slate-200 p-5">
          <p className="text-sm font-semibold text-slate-950">Session Metadata</p>
          <dl className="mt-4 space-y-3 text-sm">
            <InfoRow label="Session ID" value={result.sessionId || 'Not provided'} />
            <InfoRow label="Passing Mark" value={assessment?.passingMarksPercentage || 'Not configured'} />
            <InfoRow label="Assessment Status" value={assessment?.status ? formatLabel(assessment.status) : 'Unknown'} />
          </dl>
        </div>
      </div>

      <div className="border-t border-slate-200 p-5">
        <Button className="w-full" onClick={() => onProctoring(result.sessionId)}>
          <ShieldAlert size={18} />
          Open Proctoring Review
        </Button>
      </div>
    </aside>
  </div>
);

const ProctoringModal = ({ data, loading, error, onClose }) => {
  const riskScore = Number(data?.riskScore || 0);
  const shouldReview = Boolean(data?.shouldReviewByRecruiter || data?.shouldFlag || riskScore >= 70);
  const activities = data?.activities || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Integrity Review</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">Proctoring Report</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close report">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          {loading ? (
            <div className="py-10 text-center text-sm font-medium text-slate-500">Loading proctoring report...</div>
          ) : error ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              {error}
            </div>
          ) : (
            <div className="space-y-5">
              <div className={`rounded-[24px] border p-5 ${shouldReview ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Risk Score</p>
                    <p className="mt-1 text-sm text-slate-500">{shouldReview ? 'Recruiter review recommended' : 'No major concerns detected'}</p>
                  </div>
                  <p className={`text-4xl font-semibold ${shouldReview ? 'text-rose-700' : 'text-emerald-700'}`}>{riskScore}/100</p>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 p-5">
                <p className="text-sm font-semibold text-slate-950">Activity Signals</p>
                <div className="mt-4 divide-y divide-slate-100">
                  {Object.keys(activities).length > 0 ? Object.entries(activities).map(([activity, count]) => (
                    <div key={activity} className="flex items-center justify-between py-3 text-sm">
                      <span className="text-slate-600">{formatLabel(activity)}</span>
                      <span className="font-semibold text-slate-950">{count}x</span>
                    </div>
                  )) : (
                    <p className="py-4 text-sm text-slate-500">No activity signals were reported for this session.</p>
                  )}
                </div>
              </div>

              {data?.report && (
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-950">Report Notes</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{data.report}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4">
    <dt className="text-slate-500">{label}</dt>
    <dd className="text-right font-semibold text-slate-950">{value}</dd>
  </div>
);

const EmptyState = ({ query }) => (
  <div className="px-5 py-14 text-center">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
      <ArrowUpRight size={22} />
    </div>
    <h3 className="mt-5 text-xl font-semibold text-slate-950">No leaderboard rows found</h3>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
      {query ? 'Try a different search or status filter to broaden the result set.' : 'Candidate attempts will appear here as soon as submissions are evaluated.'}
    </p>
  </div>
);

const LeaderboardSkeleton = () => (
  <div className="space-y-6">
    <div className="h-72 animate-pulse rounded-[32px] bg-slate-100" />
    <div className="h-96 animate-pulse rounded-[28px] bg-slate-100" />
  </div>
);

const clamp = (value, min, max) => Math.min(Math.max(Number.isFinite(value) ? value : 0, min), max);

const formatNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(number % 1 === 0 ? 0 : 1) : '0';
};

const formatDate = (value) => {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).split('T')[0];
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatLabel = (value = '') => String(value)
  .replace(/_/g, ' ')
  .toLowerCase()
  .replace(/\b\w/g, (char) => char.toUpperCase());

export default AssessmentLeaderboardPage;
