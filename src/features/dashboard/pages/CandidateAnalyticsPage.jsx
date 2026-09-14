import React, { useEffect, useState } from 'react';
import { BarChart3, Eye, Sparkles, Target, TrendingUp, Users } from 'lucide-react';
import { candidateInsightsService } from '../../../services';

const CandidateAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await candidateInsightsService.getProfileAnalytics();
        setData(response.data?.data || null);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load your profile analytics.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] py-8">
        <div className="mx-auto max-w-[1100px] px-4 text-sm text-slate-500 sm:px-6 lg:px-8">Loading profile analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f6f8fc] py-8">
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const monthEntries = Object.entries(data.applicationsByMonth || {});
  const maxMonthCount = Math.max(1, ...monthEntries.map(([, count]) => count));
  const distributionEntries = Object.entries(data.matchScoreDistribution || {});
  const maxDistribution = Math.max(1, ...distributionEntries.map(([, count]) => count));

  return (
    <div className="min-h-screen bg-[#f6f8fc] py-8 text-slate-950">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <BarChart3 size={20} />
          </div>
          <div>
            <h1 className="text-3xl font-semibold">Profile analytics</h1>
            <p className="mt-1 text-sm text-slate-500">See how recruiters engage with your profile and how well you match the market.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Sparkles} label="Profile strength" value={`${data.profileCompleteness}%`} sub={data.profileCompletenessLevel} />
          <StatCard icon={Eye} label="Profile views (30d)" value={data.profileViewsLast30Days} sub={`${data.profileViewsTotal} all time`} />
          <StatCard icon={Users} label="Recruiters viewing (30d)" value={data.recruiterViewersLast30Days} sub="Distinct recruiters" />
          <StatCard icon={TrendingUp} label="Response rate" value={`${data.responseRatePercentage}%`} sub={`${data.applicationsRespondedTotal}/${data.applicationsTotal} applications`} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card title="Applications over time">
            <div className="flex h-40 items-end gap-3">
              {monthEntries.map(([month, count]) => (
                <div key={month} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-32 w-full items-end">
                    <div
                      className="w-full rounded-t-lg bg-blue-500"
                      style={{ height: `${Math.max(4, (count / maxMonthCount) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">{month.slice(5)}</span>
                  <span className="text-xs font-semibold text-slate-600">{count}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Job match distribution">
            <div className="space-y-3">
              {distributionEntries.map(([bucket, count]) => (
                <div key={bucket}>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                    <span>{bucket}% match</span>
                    <span>{count} job{count === 1 ? '' : 's'}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${(count / maxDistribution) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card title="Most common skills in your matched jobs">
            {(!data.topSkillsInMatchedJobs || data.topSkillsInMatchedJobs.length === 0) ? (
              <p className="text-sm text-slate-500">Apply your skills to more jobs to see this breakdown.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.topSkillsInMatchedJobs.map((item) => (
                  <span key={item.skill} className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
                    {item.skill} <span className="text-blue-400">&times;{item.matchedJobCount}</span>
                  </span>
                ))}
              </div>
            )}
          </Card>

          <Card title="Profile improvement suggestions" icon={Target}>
            <ul className="space-y-3">
              {(data.improvementSuggestions || []).map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                  {suggestion}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="mt-6">
          <Card title="Hiring funnel from your applications">
            <div className="grid grid-cols-3 gap-4 text-center">
              <FunnelStat label="Applications" value={data.applicationsTotal} />
              <FunnelStat label="Responded to" value={data.applicationsRespondedTotal} />
              <FunnelStat label="Interviews or beyond" value={data.interviewsTotal} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, sub }) => (
  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        {React.createElement(icon, { size: 18 })}
      </span>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
    </div>
    <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
    {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
  </div>
);

const Card = ({ title, icon, children }) => (
  <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
      {icon && React.createElement(icon, { size: 18, className: 'text-blue-600' })}
      {title}
    </h2>
    {children}
  </div>
);

const FunnelStat = ({ label, value }) => (
  <div className="rounded-2xl bg-slate-50 p-4">
    <p className="text-2xl font-semibold text-slate-900">{value}</p>
    <p className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-slate-500">{label}</p>
  </div>
);

export default CandidateAnalyticsPage;
