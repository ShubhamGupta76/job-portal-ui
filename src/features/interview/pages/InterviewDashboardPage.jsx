import React, { useEffect, useState } from 'react';
import { CalendarPlus, Copy, ExternalLink, Video } from 'lucide-react';
import { useAuthContext } from '../../../context/useAuthContext';
import interviewService from '../services/interviewService';

const emptyForm = {
  jobId: '',
  candidateId: '',
  title: '',
  scheduledStartAt: '',
  durationMinutes: 60,
  roundType: 'TECHNICAL',
  candidateCanJoinOnce: true,
  recordingEnabled: false,
  identityVerificationRequired: true,
};

const InterviewDashboardPage = () => {
  const { userRole } = useAuthContext();
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const canCreate = userRole === 'recruiter';

  const loadSessions = async () => {
    setLoading(true);
    try {
      const response = await interviewService.getMySessions();
      setSessions(response.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const createSession = async (event) => {
    event.preventDefault();
    setCreating(true);
    try {
      await interviewService.createSession({
        ...form,
        jobId: Number(form.jobId),
        candidateId: Number(form.candidateId),
        durationMinutes: Number(form.durationMinutes),
      });
      setForm(emptyForm);
      await loadSessions();
    } finally {
      setCreating(false);
    }
  };

  const startSession = async (roomToken) => {
    await interviewService.startSession(roomToken);
    window.location.href = `/interview/room/${roomToken}`;
  };

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">Live Interview Workspace</p>
            <h1 className="mt-2 text-4xl font-black">Interview Sessions</h1>
            <p className="mt-2 max-w-2xl text-slate-300">
              Create secure rooms, share invite links, and run live technical interviews with video, chat, and code.
            </p>
          </div>
          <a href="/dashboard" className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10">
            Back to workspace
          </a>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          {canCreate && (
            <form onSubmit={createSession} className="rounded-lg border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-400 text-slate-950">
                  <CalendarPlus size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Create Interview Room</h2>
                  <p className="text-sm text-slate-400">Use candidate and job IDs from your applicant list.</p>
                </div>
              </div>
              <Field label="Job ID" value={form.jobId} onChange={(value) => setForm({ ...form, jobId: value })} />
              <Field label="Candidate ID" value={form.candidateId} onChange={(value) => setForm({ ...form, candidateId: value })} />
              <Field label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
              <Field label="Start date/time" type="datetime-local" value={form.scheduledStartAt} onChange={(value) => setForm({ ...form, scheduledStartAt: value })} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Duration" type="number" value={form.durationMinutes} onChange={(value) => setForm({ ...form, durationMinutes: value })} />
                <label className="mb-4 block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Round</span>
                  <select
                    value={form.roundType}
                    onChange={(event) => setForm({ ...form, roundType: event.target.value })}
                    className="h-11 w-full rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none"
                  >
                    {['SCREENING', 'TECHNICAL', 'CODING', 'SYSTEM_DESIGN', 'HR', 'FINAL'].map((round) => (
                      <option key={round} value={round}>{round}</option>
                    ))}
                  </select>
                </label>
              </div>
              <Toggle label="Candidate can join once" checked={form.candidateCanJoinOnce} onChange={(value) => setForm({ ...form, candidateCanJoinOnce: value })} />
              <Toggle label="Identity verification required" checked={form.identityVerificationRequired} onChange={(value) => setForm({ ...form, identityVerificationRequired: value })} />
              <Toggle label="Recording support enabled" checked={form.recordingEnabled} onChange={(value) => setForm({ ...form, recordingEnabled: value })} />
              <button disabled={creating} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-cyan-400 font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-60">
                <Video size={18} />
                {creating ? 'Creating...' : 'Create Room'}
              </button>
            </form>
          )}

          <section className="rounded-lg border border-white/10 bg-white/[0.06] p-5">
            <h2 className="text-xl font-black">Your Sessions</h2>
            <div className="mt-5 grid gap-4">
              {loading && <p className="text-slate-400">Loading sessions...</p>}
              {!loading && sessions.length === 0 && <p className="text-slate-400">No interview sessions yet.</p>}
              {sessions.map((session) => (
                <article key={session.id} className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">{session.roundType} • {session.status}</p>
                      <h3 className="mt-2 text-lg font-bold">{session.title}</h3>
                      <p className="mt-1 text-sm text-slate-400">{session.jobTitle} • {new Date(session.scheduledStartAt).toLocaleString()}</p>
                      <p className="mt-1 text-sm text-slate-400">Candidate: {session.candidateName}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {userRole === 'recruiter' ? (
                        <button
                          type="button"
                          onClick={() => startSession(session.roomToken)}
                          className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300"
                        >
                          Start Interview
                        </button>
                      ) : (
                        <a
                          href={session.status === 'LIVE' ? `/interview/room/${session.roomToken}` : `/interview/join/${session.inviteToken}`}
                          className={`rounded-md px-4 py-2 text-sm font-bold ${
                            session.status === 'LIVE'
                              ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
                              : 'border border-white/10 text-slate-100 hover:bg-white/10'
                          }`}
                        >
                          {session.status === 'LIVE' ? 'Join Now' : 'Waiting Room'}
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}${session.inviteUrl}`)}
                        className="flex items-center gap-2 rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10"
                      >
                        <Copy size={15} />
                        Copy Invite
                      </button>
                      <a href={session.inviteUrl} className="flex items-center gap-2 rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10">
                        <ExternalLink size={15} />
                        Invite
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, type = 'text' }) => (
  <label className="mb-4 block">
    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required
      className="h-11 w-full rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
    />
  </label>
);

const Toggle = ({ label, checked, onChange }) => (
  <label className="mb-3 flex items-center justify-between rounded-md border border-white/10 bg-slate-950/70 px-3 py-3 text-sm text-slate-200">
    {label}
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-cyan-400" />
  </label>
);

export default InterviewDashboardPage;
