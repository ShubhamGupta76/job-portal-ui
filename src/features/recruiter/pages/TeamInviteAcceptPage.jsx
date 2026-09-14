import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import Button from '../../../components/common/Button';
import { companyTeamService } from '../../../services';

const TeamInviteAcceptPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    setError('');
    try {
      await companyTeamService.acceptInvitation(token);
      setAccepted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to accept this invitation.');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f8fc] px-4 py-12">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
          <ShieldCheck size={26} />
        </div>
        {accepted ? (
          <>
            <CheckCircle2 className="mx-auto mt-6 text-emerald-500" size={36} />
            <h1 className="mt-4 text-2xl font-semibold text-slate-950">You're on the team</h1>
            <p className="mt-2 text-sm text-slate-500">You now have access to this company's recruiter workspace.</p>
            <Button className="mt-6 w-full justify-center" onClick={() => navigate('/recruiter/dashboard')}>
              Go to dashboard
            </Button>
          </>
        ) : (
          <>
            <h1 className="mt-6 text-2xl font-semibold text-slate-950">Team invitation</h1>
            <p className="mt-2 text-sm text-slate-500">
              Accept this invitation to join the company's hiring workspace. You must be signed in with the email address the invitation was sent to.
            </p>
            {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <Button className="mt-6 w-full justify-center" onClick={handleAccept} loading={accepting}>
              Accept invitation
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default TeamInviteAcceptPage;
