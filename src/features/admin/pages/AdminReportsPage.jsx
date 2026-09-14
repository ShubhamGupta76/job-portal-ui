import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Ban, CheckCircle, ShieldAlert, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import Badge from '../../../components/common/Badge';
import { adminReportService } from '../../../services';

const STATUS_TABS = ['ALL', 'OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'];
const TARGET_TYPES = ['ALL', 'JOB', 'COMPANY', 'RECRUITER', 'CANDIDATE', 'MESSAGE'];
const emptyPage = { content: [], totalElements: 0, totalPages: 0, number: 0 };

const STATUS_VARIANT = { OPEN: 'warning', UNDER_REVIEW: 'primary', RESOLVED: 'success', REJECTED: 'danger' };

const AdminReportsPage = () => {
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [targetTypeFilter, setTargetTypeFilter] = useState('ALL');
  const [page, setPage] = useState(emptyPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [note, setNote] = useState('');
  const [suspendTarget, setSuspendTarget] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [actionError, setActionError] = useState('');

  const loadList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminReportService.list(statusFilter, targetTypeFilter, 0, 50);
      setPage(response.data?.data || emptyPage);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load reports.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, targetTypeFilter]);

  useEffect(() => { loadList(); }, [loadList]);

  const openDetail = async (id) => {
    setSelectedId(id);
    setDetail(null);
    setNote('');
    setSuspendTarget(false);
    setActionError('');
    try {
      const response = await adminReportService.get(id);
      setDetail(response.data?.data);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Unable to load report detail.');
    }
  };

  const runAction = async (action) => {
    if (!selectedId) return;
    setActionLoading(action);
    setActionError('');
    try {
      const response = await {
        review: () => adminReportService.markUnderReview(selectedId),
        resolve: () => adminReportService.resolve(selectedId, note.trim() || undefined, suspendTarget),
        reject: () => adminReportService.reject(selectedId, note.trim() || undefined),
      }[action]();
      setDetail(response.data?.data);
      await loadList();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] px-6 py-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6">
          <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800">
            <ArrowLeft size={16} /> Back to admin dashboard
          </Link>
          <h1 className="mt-3 flex items-center gap-2 text-3xl font-semibold text-slate-900"><ShieldAlert size={26} /> Reports</h1>
          <p className="mt-1 text-sm text-slate-500">Investigate and resolve reports filed by candidates and recruiters.</p>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${statusFilter === tab ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="mb-6 flex flex-wrap gap-2">
          {TARGET_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTargetTypeFilter(type)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${targetTypeFilter === type ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
            >
              {type}
            </button>
          ))}
        </div>

        {error && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
          <Card className="border-0 bg-white p-0 shadow-sm">
            {loading ? (
              <p className="p-6 text-sm text-slate-500">Loading reports...</p>
            ) : page.content.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">No reports in this view.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {page.content.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => openDetail(item.id)}
                      className={`flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition hover:bg-slate-50 ${selectedId === item.id ? 'bg-blue-50/60' : ''}`}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{item.targetSummary}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.reportType.replace(/_/g, ' ')} - reported by {item.reporterName} - {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={STATUS_VARIANT[item.status] || 'default'}>{item.status.replace('_', ' ')}</Badge>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="border-0 bg-white p-6 shadow-sm">
            {!selectedId ? (
              <p className="text-sm text-slate-500">Select a report to review its details.</p>
            ) : !detail ? (
              <p className="text-sm text-slate-500">Loading detail...</p>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">{detail.targetSummary}</h2>
                  <Badge variant={STATUS_VARIANT[detail.status] || 'default'}>{detail.status.replace('_', ' ')}</Badge>
                </div>

                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <Field label="Type" value={detail.reportType.replace(/_/g, ' ')} />
                  <Field label="Target type" value={detail.targetType} />
                  <Field label="Reported by" value={`${detail.reporterName} (${detail.reporterEmail})`} />
                  <Field label="Filed" value={new Date(detail.createdAt).toLocaleString()} />
                </dl>

                {detail.description && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Reporter's details</p>
                    <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{detail.description}</p>
                  </div>
                )}

                {detail.resolutionNote && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Resolution note</p>
                    <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                      {detail.resolutionNote} <span className="text-slate-400">- {detail.resolvedByName}</span>
                    </p>
                  </div>
                )}

                {actionError && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</div>}

                {(detail.status === 'OPEN' || detail.status === 'UNDER_REVIEW') && (
                  <div className="space-y-3 border-t border-slate-100 pt-4">
                    <label className="block text-sm font-semibold text-slate-700">
                      Internal note
                      <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        rows={3}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                        placeholder="Add context for the resolution (optional)"
                      />
                    </label>
                    {(detail.targetType === 'RECRUITER' || detail.targetType === 'CANDIDATE') && (
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="checkbox" checked={suspendTarget} onChange={(event) => setSuspendTarget(event.target.checked)} className="h-4 w-4 accent-red-600" />
                        Suspend this account
                      </label>
                    )}
                    <div className="flex flex-wrap gap-3">
                      {detail.status === 'OPEN' && (
                        <Button variant="outline" onClick={() => runAction('review')} loading={actionLoading === 'review'}>
                          Mark under review
                        </Button>
                      )}
                      <Button onClick={() => runAction('resolve')} loading={actionLoading === 'resolve'}>
                        <CheckCircle size={16} /> Resolve
                      </Button>
                      <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => runAction('reject')} loading={actionLoading === 'reject'}>
                        <XCircle size={16} /> Reject
                      </Button>
                    </div>
                    {suspendTarget && (
                      <p className="flex items-center gap-1.5 text-xs text-red-600"><Ban size={12} /> This will block the reported account when resolved.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value }) => (
  <div>
    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</dt>
    <dd className="mt-1 text-slate-800">{value || 'Not provided'}</dd>
  </div>
);

export default AdminReportsPage;
