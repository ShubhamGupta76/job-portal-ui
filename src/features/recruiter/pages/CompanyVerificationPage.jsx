import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Send, ShieldCheck, Trash2, UploadCloud } from 'lucide-react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import VerificationBadge from '../../../components/common/VerificationBadge';
import RecruiterLayout from '../components/RecruiterLayout';
import { companyService, fileService, recruiterService } from '../../../services';

const RESUBMITTABLE = ['UNVERIFIED', 'REJECTED', 'UNDER_REVIEW', 'EXPIRED'];

const CompanyVerificationPage = () => {
  const [companyId, setCompanyId] = useState(null);
  const [verification, setVerification] = useState(null);
  const [form, setForm] = useState({
    legalName: '',
    registrationNumber: '',
    companyType: '',
    officialWebsite: '',
    officialEmailDomain: '',
  });
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [noCompany, setNoCompany] = useState(false);

  const loadVerification = async (id) => {
    try {
      const response = await companyService.getVerification(id);
      const data = response.data?.data;
      setVerification(data);
      setForm({
        legalName: data?.legalName || '',
        registrationNumber: data?.registrationNumber || '',
        companyType: data?.companyType || '',
        officialWebsite: data?.officialWebsite || '',
        officialEmailDomain: data?.officialEmailDomain || '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load verification status.');
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const companyRes = await recruiterService.getCompanyProfile();
        const company = companyRes.data?.data;
        if (!company?.id) {
          setNoCompany(true);
          return;
        }
        setCompanyId(company.id);
        await loadVerification(company.id);
      } catch (err) {
        if (err.response?.status === 404) {
          setNoCompany(true);
        } else {
          setError(err.response?.data?.message || 'Unable to load company profile.');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;
    setUploading(true);
    setError('');
    try {
      for (const file of files) {
        const response = await fileService.uploadFile(file, 'COMPANY_VERIFICATION', companyId, 'DOCUMENT');
        setDocuments((current) => [...current, { fileId: response.data?.id, filename: response.data?.originalFilename || file.name }]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to upload document. Check the file type and size.');
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = (fileId) => {
    setDocuments((current) => current.filter((doc) => doc.fileId !== fileId));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await companyService.submitVerification(companyId, {
        ...form,
        documentFileIds: documents.map((doc) => doc.fileId),
      });
      setSuccess('Verification request submitted. You will be notified once it is reviewed.');
      setDocuments([]);
      await loadVerification(companyId);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to submit verification request.');
    } finally {
      setSubmitting(false);
    }
  };

  const status = verification?.status || 'UNVERIFIED';
  const canSubmit = RESUBMITTABLE.includes(status);

  if (loading) {
    return (
      <RecruiterLayout title="Company Verification" subtitle="Build trust with candidates by verifying your company." navigationMode="top">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">Loading verification status...</div>
      </RecruiterLayout>
    );
  }

  if (noCompany) {
    return (
      <RecruiterLayout title="Company Verification" subtitle="Build trust with candidates by verifying your company." navigationMode="top">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 shadow-sm">
          Create your company profile before requesting verification.
          <Link to="/recruiter/company-profile" className="ml-2 font-semibold text-blue-600 hover:text-blue-700">
            Go to company profile
          </Link>
        </div>
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout
      title="Company Verification"
      subtitle="Submit legal details and documents so candidates can trust your company profile."
      navigationMode="top"
    >
      {error && <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-3xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{success}</div>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="overflow-hidden border-0 bg-white p-0 shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
          <div className="flex items-center justify-between bg-slate-950 px-6 py-6 text-white sm:px-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">Verification status</p>
              <div className="mt-3"><VerificationBadge status={status} /></div>
            </div>
            <ShieldCheck size={32} className="text-slate-400" aria-hidden="true" />
          </div>

          {verification?.latestNote && (status === 'REJECTED' || status === 'UNDER_REVIEW') && (
            <div className="mx-6 mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 sm:mx-8">
              <strong>Reviewer note:</strong> {verification.latestNote}
            </div>
          )}

          {!canSubmit ? (
            <div className="p-6 sm:p-8">
              <p className="text-sm text-slate-600">
                {status === 'VERIFIED'
                  ? 'Your company is verified. Candidates see a verified badge on your job listings and company profile.'
                  : 'Your verification request is awaiting review. You will be notified once a decision is made.'}
              </p>
            </div>
          ) : (
            <form className="grid gap-6 p-6 sm:p-8" onSubmit={handleSubmit}>
              <section className="grid gap-5 lg:grid-cols-2">
                <Input label="Legal Company Name" name="legalName" value={form.legalName} onChange={handleChange} required />
                <Input label="Registration Number" name="registrationNumber" value={form.registrationNumber} onChange={handleChange} placeholder="CIN / registration ID" />
                <Input label="Company Type" name="companyType" value={form.companyType} onChange={handleChange} placeholder="Private Limited, LLP, Agency..." />
                <Input label="Official Website" name="officialWebsite" value={form.officialWebsite} onChange={handleChange} placeholder="https://company.com" />
                <Input label="Official Email Domain" name="officialEmailDomain" value={form.officialEmailDomain} onChange={handleChange} placeholder="company.com" />
              </section>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Verification documents</label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 hover:border-blue-300 hover:bg-blue-50">
                  <UploadCloud size={18} />
                  {uploading ? 'Uploading...' : 'Upload registration certificate, ID proof, or other documents'}
                  <input type="file" className="hidden" multiple onChange={handleFileSelect} disabled={uploading} />
                </label>
                {documents.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {documents.map((doc) => (
                      <li key={doc.fileId} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
                        <span className="flex items-center gap-2 truncate"><FileText size={14} /> {doc.filename}</span>
                        <button type="button" onClick={() => removeDocument(doc.fileId)} aria-label={`Remove ${doc.filename}`} className="text-slate-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">An admin reviews every submission before a verified badge is shown.</p>
                <Button type="submit" loading={submitting} disabled={uploading}>
                  <Send size={16} />
                  Submit for verification
                </Button>
              </div>
            </form>
          )}
        </Card>

        <aside>
          <Card className="border-0 bg-white p-6 shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
            <h3 className="text-lg font-semibold text-slate-950">Submission history</h3>
            {(!verification?.history || verification.history.length === 0) ? (
              <p className="mt-3 text-sm text-slate-500">No submissions yet.</p>
            ) : (
              <ol className="mt-4 space-y-4 border-l border-slate-200 pl-4">
                {[...verification.history].reverse().map((event, index) => (
                  <li key={`${event.createdAt}-${index}`} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <p className="text-sm font-semibold text-slate-800">{formatStatusLabel(event.status)}</p>
                    {event.note && <p className="mt-1 text-sm text-slate-600">{event.note}</p>}
                    <p className="mt-1 text-xs text-slate-400">
                      {event.actorName ? `${event.actorName} - ` : ''}{new Date(event.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </aside>
      </div>
    </RecruiterLayout>
  );
};

const formatStatusLabel = (value) => {
  if (!value) return '';
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

export default CompanyVerificationPage;
