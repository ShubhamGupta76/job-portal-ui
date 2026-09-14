import React, { useState } from 'react';
import { Flag, X } from 'lucide-react';
import Button from './Button';
import { reportService } from '../../services';

const REPORT_TYPES = [
  { key: 'SPAM', label: 'Spam' },
  { key: 'FRAUD', label: 'Fraud' },
  { key: 'SCAM', label: 'Scam' },
  { key: 'HARASSMENT', label: 'Harassment' },
  { key: 'MISLEADING_JOB', label: 'Misleading job' },
  { key: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate content' },
  { key: 'OTHER', label: 'Other' },
];

const ReportModal = ({ targetType, targetId, targetLabel, onClose }) => {
  const [reportType, setReportType] = useState('SPAM');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await reportService.create({ targetType, targetId, reportType, description: description.trim() || undefined });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to submit this report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-md overflow-hidden rounded-[24px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
            <Flag size={18} className="text-red-500" /> Report {targetLabel || 'content'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="p-6 text-center">
            <p className="text-sm font-semibold text-slate-800">Thank you for the report.</p>
            <p className="mt-2 text-sm text-slate-500">Our team will review it shortly.</p>
            <Button className="mt-5 w-full justify-center" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <label className="block text-sm font-semibold text-slate-700">
              Reason
              <select
                value={reportType}
                onChange={(event) => setReportType(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700"
              >
                {REPORT_TYPES.map((type) => (
                  <option key={type.key} value={type.key}>{type.label}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Additional details (optional)
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                placeholder="Tell us more about what happened"
              />
            </label>
            <Button type="submit" loading={submitting} className="w-full justify-center">
              Submit report
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
