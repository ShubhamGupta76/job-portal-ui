import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, FileText, MessageSquareWarning, ShieldCheck, ShieldX } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import VerificationBadge from '../../../components/common/VerificationBadge';
import { adminService } from '../../../services/adminService';

const STATUS_TABS = ['ALL', 'PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED'];
const emptyPage = { content: [], totalElements: 0, totalPages: 0, number: 0 };

const AdminCompanyVerificationsPage = () => {
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [page, setPage] = useState(emptyPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [note, setNote] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [actionError, setActionError] = useState('');

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminService.getVerificationQueue(statusFilter, 0, 50);
      setPage(response.data?.data || emptyPage);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load verification queue.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const openDetail = async (id) => {
    setSelectedId(id);
    setDetail(null);
    setNote('');
    setActionError('');
    setDetailLoading(true);
    try {
      const response = await adminService.getVerificationDetail(id);
      setDetail(response.data?.data);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Unable to load verification detail.');
    } finally {
      setDetailLoading(false);
    }
  };

  const runAction = async (action) => {
    if (!selectedId) return;
    if ((action === 'reject' || action === 'requestVerificationInfo') && !note.trim()) {
      setActionError('Please add a note before continuing.');
      return;
    }
    setActionLoading(action);
    setActionError('');
    try {
      const call = {
        approve: () => adminService.approveVerification(selectedId, note.trim() || undefined),
        reject: () => adminService.rejectVerification(selectedId, note.trim()),
        requestInfo: () => adminService.requestVerificationInfo(selectedId, note.trim()),
      }[action];
      const response = await call();
      setDetail(response.data?.data);
      setNote('');
      await loadQueue();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] px-6 py-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800">
              <ArrowLeft size={16} /> Back to admin dashboard
            </Link>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">Company Verification Queue</h1>
            <p className="mt-1 text-sm text-slate-500">Review submissions, inspect documents, and approve or reject verification requests.</p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
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

        {error && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
          <Card className="border-0 bg-white p-0 shadow-sm">
            {loading ? (
              <p className="p-6 text-sm text-slate-500">Loading verification requests...</p>
            ) : page.content.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">No verification requests in this status.</p>
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
                        <p className="truncate font-semibold text-slate-900">{item.companyName}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Submitted by {item.submittedByName || 'Unknown'} - {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <VerificationBadge status={item.status} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="border-0 bg-white p-6 shadow-sm">
            {!selectedId ? (
              <p className="text-sm text-slate-500">Select a verification request to review its details.</p>
            ) : detailLoading ? (
              <p className="text-sm text-slate-500">Loading detail...</p>
            ) : detail ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900">{detail.companyName}</h2>
                  <VerificationBadge status={detail.status} />
                </div>

                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <Field label="Legal name" value={detail.legalName} />
                  <Field label="Registration #" value={detail.registrationNumber} />
                  <Field label="Company type" value={detail.companyType} />
                  <Field label="Official website" value={detail.officialWebsite} />
                  <Field label="Email domain" value={detail.officialEmailDomain} />
                  <Field label="Submitted by" value={detail.submittedByName} />
                </dl>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Documents</p>
                  {(!detail.documents || detail.documents.length === 0) ? (
                    <p className="mt-2 text-sm text-slate-500">No documents attached.</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {detail.documents.map((doc) => (
                        <li key={doc.id}>
                          <a
                            href={doc.downloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
                          >
                            <FileText size={14} /> {doc.filename || doc.label || `Document #${doc.id}`}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {actionError && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</div>}

                {(detail.status === 'PENDING' || detail.status === 'UNDER_REVIEW') && (
                  <div className="space-y-3 border-t border-slate-100 pt-4">
                    <label className="block text-sm font-semibold text-slate-700">
                      Reviewer note
                      <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        rows={3}
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                        placeholder="Required for reject or request-info; optional for approve"
                      />
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <Button onClick={() => runAction('approve')} loading={actionLoading === 'approve'}>
                        <ShieldCheck size={16} /> Approve
                      </Button>
                      <Button variant="outline" onClick={() => runAction('requestInfo')} loading={actionLoading === 'requestInfo'}>
                        <MessageSquareWarning size={16} /> Request info
                      </Button>
                      <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => runAction('reject')} loading={actionLoading === 'reject'}>
                        <ShieldX size={16} /> Reject
                      </Button>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">History</p>
                  <ol className="mt-2 space-y-3 border-l border-slate-200 pl-4">
                    {(detail.history || []).slice().reverse().map((event, index) => (
                      <li key={`${event.createdAt}-${index}`} className="relative">
                        <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
                        <p className="text-sm font-semibold text-slate-800">{event.status?.replace(/_/g, ' ')}</p>
                        {event.note && <p className="text-sm text-slate-600">{event.note}</p>}
                        <p className="text-xs text-slate-400">{event.actorName ? `${event.actorName} - ` : ''}{new Date(event.createdAt).toLocaleString()}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ) : null}
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

export default AdminCompanyVerificationsPage;
