import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Crown, Mail, Trash2, UserPlus, XCircle } from 'lucide-react';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import Input from '../../../components/common/Input';
import RecruiterLayout from '../components/RecruiterLayout';
import { companyTeamService, recruiterService } from '../../../services';

const ASSIGNABLE_ROLES = ['ADMIN', 'RECRUITER', 'HIRING_MANAGER', 'VIEWER'];
const MANAGE_ROLES = ['OWNER', 'ADMIN'];

const TeamManagementPage = () => {
  const [companyId, setCompanyId] = useState(null);
  const [noCompany, setNoCompany] = useState(false);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('RECRUITER');
  const [inviting, setInviting] = useState(false);
  const [busyKey, setBusyKey] = useState('');

  const loadTeam = async (id) => {
    try {
      const response = await companyTeamService.getTeam(id);
      setTeam(response.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load your company team.');
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
        await loadTeam(company.id);
      } catch (err) {
        if (err.response?.status === 404) setNoCompany(true);
        else setError(err.response?.data?.message || 'Unable to load company profile.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const canManage = MANAGE_ROLES.includes(team?.viewerRole);
  const isOwner = team?.viewerRole === 'OWNER';

  const handleInvite = async (event) => {
    event.preventDefault();
    setInviting(true);
    setError('');
    setSuccess('');
    try {
      await companyTeamService.invite(companyId, { email: inviteEmail.trim(), role: inviteRole });
      setInviteEmail('');
      setSuccess('Invitation created. Share the invite link below with your teammate.');
      await loadTeam(companyId);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to send this invitation.');
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvite = async (invitationId) => {
    setBusyKey(`invite-${invitationId}`);
    setError('');
    try {
      await companyTeamService.cancelInvitation(companyId, invitationId);
      await loadTeam(companyId);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to cancel this invitation.');
    } finally {
      setBusyKey('');
    }
  };

  const handleRemove = async (userId, name) => {
    if (!window.confirm(`Remove ${name} from the team?`)) return;
    setBusyKey(`member-${userId}`);
    setError('');
    try {
      await companyTeamService.removeMember(companyId, userId);
      await loadTeam(companyId);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to remove this team member.');
    } finally {
      setBusyKey('');
    }
  };

  const handleRoleChange = async (userId, role) => {
    setBusyKey(`role-${userId}`);
    setError('');
    try {
      await companyTeamService.changeRole(companyId, userId, role);
      await loadTeam(companyId);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to change this member\'s role.');
    } finally {
      setBusyKey('');
    }
  };

  const copyInviteLink = async (token) => {
    await navigator.clipboard.writeText(`${window.location.origin}/team/invite/${token}`);
    setSuccess('Invite link copied to clipboard.');
  };

  if (loading) {
    return (
      <RecruiterLayout title="Team" subtitle="Manage who can access your company workspace." navigationMode="top">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">Loading team...</div>
      </RecruiterLayout>
    );
  }

  if (noCompany) {
    return (
      <RecruiterLayout title="Team" subtitle="Manage who can access your company workspace." navigationMode="top">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 shadow-sm">
          Create your company profile before managing a team.
          <Link to="/recruiter/company-profile" className="ml-2 font-semibold text-blue-600 hover:text-blue-700">
            Go to company profile
          </Link>
        </div>
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout title="Team" subtitle="Invite recruiters and manage workspace access." navigationMode="top">
      {error && <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-3xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{success}</div>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="border-0 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
          <h2 className="text-lg font-semibold text-slate-950">Team members</h2>
          <ul className="mt-4 space-y-3">
            {(team?.members || []).map((member) => (
              <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{member.name}</p>
                    {member.role === 'OWNER' && <Crown size={14} className="text-amber-500" aria-label="Owner" />}
                  </div>
                  <p className="text-sm text-slate-500">{member.email}</p>
                  <p className="mt-1 text-xs text-slate-400">Joined {new Date(member.joinedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isOwner && member.role !== 'OWNER' ? (
                    <select
                      value={member.role}
                      disabled={busyKey === `role-${member.userId}`}
                      onChange={(event) => handleRoleChange(member.userId, event.target.value)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
                    >
                      {ASSIGNABLE_ROLES.map((role) => (
                        <option key={role} value={role}>{formatLabel(role)}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                      {formatLabel(member.role)}
                    </span>
                  )}
                  {canManage && member.role !== 'OWNER' && (
                    <button
                      type="button"
                      onClick={() => handleRemove(member.userId, member.name)}
                      disabled={busyKey === `member-${member.userId}`}
                      aria-label={`Remove ${member.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {(team?.pendingInvitations || []).length > 0 && (
            <>
              <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">Pending invitations</h3>
              <ul className="mt-4 space-y-3">
                {team.pendingInvitations.map((invitation) => (
                  <li key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-200 p-4">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-medium text-slate-800"><Mail size={14} /> {invitation.email}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatLabel(invitation.role)} - invited by {invitation.invitedByName} - expires {new Date(invitation.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyInviteLink(invitation.token)}
                        className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        <Copy size={13} /> Copy link
                      </button>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleCancelInvite(invitation.id)}
                          disabled={busyKey === `invite-${invitation.id}`}
                          aria-label={`Cancel invitation to ${invitation.email}`}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                        >
                          <XCircle size={15} />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <aside>
          {canManage ? (
            <Card className="border-0 bg-white p-6 shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-950"><UserPlus size={18} /> Invite teammate</h3>
              <form onSubmit={handleInvite} className="mt-4 space-y-4">
                <Input
                  label="Email"
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="teammate@company.com"
                />
                <label className="block text-sm font-semibold text-slate-700">
                  Role
                  <select
                    value={inviteRole}
                    onChange={(event) => setInviteRole(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-700"
                  >
                    {ASSIGNABLE_ROLES.map((role) => (
                      <option key={role} value={role}>{formatLabel(role)}</option>
                    ))}
                  </select>
                </label>
                <Button type="submit" loading={inviting} className="w-full justify-center">
                  Send invitation
                </Button>
              </form>
            </Card>
          ) : (
            <Card className="border-0 bg-white p-6 text-sm text-slate-500 shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
              Only owners and admins can invite or manage team members.
            </Card>
          )}
        </aside>
      </div>
    </RecruiterLayout>
  );
};

const formatLabel = (value) => {
  if (!value) return '';
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

export default TeamManagementPage;
