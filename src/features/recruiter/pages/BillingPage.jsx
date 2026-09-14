import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Receipt, Wallet, CheckCircle2, AlertTriangle, Clock3 } from 'lucide-react';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import Badge from '../../../components/common/Badge';
import RecruiterLayout from '../components/RecruiterLayout';
import { billingService, recruiterService } from '../../../services';

const MANAGE_ROLES = ['OWNER'];

const BillingPage = () => {
  const [companyId, setCompanyId] = useState(null);
  const [noCompany, setNoCompany] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [plans, setPlans] = useState([]);
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [creditActivity, setCreditActivity] = useState([]);

  const [checkoutBusyPlan, setCheckoutBusyPlan] = useState('');
  const [cancelBusy, setCancelBusy] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(null);

  const loadBillingData = useCallback(async (id) => {
    const [summaryRes, transactionsRes, invoicesRes, creditsRes] = await Promise.all([
      billingService.getSummary(id),
      billingService.getTransactions(id),
      billingService.getInvoices(id),
      billingService.getCreditActivity(id),
    ]);
    setSummary(summaryRes.data?.data || null);
    setTransactions(transactionsRes.data?.data?.content || []);
    setInvoices(invoicesRes.data?.data?.content || []);
    setCreditActivity(creditsRes.data?.data?.content || []);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const plansRes = await billingService.getPlans();
        setPlans(plansRes.data?.data || []);

        const companyRes = await recruiterService.getCompanyProfile();
        const company = companyRes.data?.data;
        if (!company?.id) {
          setNoCompany(true);
          return;
        }
        setCompanyId(company.id);
        await loadBillingData(company.id);
      } catch (err) {
        if (err.response?.status === 404) setNoCompany(true);
        else setError(err.response?.data?.message || 'Unable to load billing information.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [loadBillingData]);

  const canManage = MANAGE_ROLES.includes(summary?.viewerRole);

  const handleCheckout = async (planCode) => {
    setCheckoutBusyPlan(planCode);
    setError('');
    setNotice('');
    setPendingCheckout(null);
    try {
      const response = await billingService.checkout(companyId, planCode, 'MONTHLY');
      const data = response.data?.data;
      // The transaction is PENDING until an admin confirms payment (or a real gateway webhook
      // fires) — never shown as successful here, since the backend is the only source of truth.
      setPendingCheckout(data);
      setNotice(data?.message || 'Payment processing. Your subscription will activate once payment is confirmed.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to start checkout for this plan.');
    } finally {
      setCheckoutBusyPlan('');
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel your subscription at the end of the current billing period?')) return;
    setCancelBusy(true);
    setError('');
    setNotice('');
    try {
      await billingService.cancelSubscription(companyId);
      setNotice('Your subscription will remain active until the end of the current period and will not renew.');
      await loadBillingData(companyId);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to cancel your subscription.');
    } finally {
      setCancelBusy(false);
    }
  };

  const handleResume = async () => {
    setCancelBusy(true);
    setError('');
    setNotice('');
    try {
      await billingService.resumeSubscription(companyId);
      setNotice('Cancellation reversed — your subscription will continue to renew.');
      await loadBillingData(companyId);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to resume your subscription.');
    } finally {
      setCancelBusy(false);
    }
  };

  if (loading) {
    return (
      <RecruiterLayout title="Billing" subtitle="Manage your subscription, credits, and invoices." navigationMode="top">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">Loading billing...</div>
      </RecruiterLayout>
    );
  }

  if (noCompany) {
    return (
      <RecruiterLayout title="Billing" subtitle="Manage your subscription, credits, and invoices." navigationMode="top">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 shadow-sm">
          Create your company profile before managing billing.
          <Link to="/recruiter/company-profile" className="ml-2 font-semibold text-blue-600 hover:text-blue-700">
            Go to company profile
          </Link>
        </div>
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout title="Billing" subtitle="Manage your subscription, credits, and invoices." navigationMode="top">
      {error && <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {notice && (
        <div className="flex items-center gap-2 rounded-3xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <Clock3 size={16} />
          <span>
            {notice}
            {pendingCheckout?.transactionId && ` (reference #${pendingCheckout.transactionId})`}
          </span>
        </div>
      )}
      {!canManage && (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          You have read-only access to billing. Only the company owner can change plans or payment settings.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-950">Current plan</h2>
          </div>
          {summary?.subscription && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-2xl font-semibold text-slate-950">{summary.subscription.planDisplayName}</p>
                <Badge variant={summary.subscription.status === 'ACTIVE' ? 'success' : 'default'}>
                  {summary.subscription.status}
                </Badge>
              </div>
              {summary.subscription.currentPeriodEnd && (
                <p className="text-sm text-slate-500">
                  {summary.subscription.cancelAtPeriodEnd
                    ? `Active until ${new Date(summary.subscription.currentPeriodEnd).toLocaleDateString()} (will not renew)`
                    : `Renews ${new Date(summary.subscription.currentPeriodEnd).toLocaleDateString()}`}
                </p>
              )}
              <p className="text-sm text-slate-500">
                Active jobs: {summary.activeJobCount}{summary.maxActiveJobs != null ? ` / ${summary.maxActiveJobs}` : ' (unlimited)'}
              </p>
              {canManage && summary.subscription.status !== 'NONE' && (
                <div className="pt-2">
                  {summary.subscription.cancelAtPeriodEnd ? (
                    <Button variant="outline" loading={cancelBusy} onClick={handleResume}>Resume subscription</Button>
                  ) : (
                    <Button variant="outline" loading={cancelBusy} onClick={handleCancel}>Cancel at period end</Button>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>

        <Card className="border-0 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-950">Credits</h2>
          </div>
          <p className="mt-4 text-3xl font-semibold text-slate-950">{summary?.creditBalance ?? 0}</p>
          {summary && summary.creditBalance <= summary.lowCreditThreshold && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-amber-700">
              <AlertTriangle size={14} /> Running low on credits.
            </p>
          )}
          <div className="mt-4 space-y-2">
            {creditActivity.length === 0 ? (
              <p className="text-sm text-slate-400">No credit activity yet.</p>
            ) : (
              creditActivity.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{entry.description || entry.type}</span>
                  <span className={entry.amount >= 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-slate-700'}>
                    {entry.amount >= 0 ? '+' : ''}{entry.amount}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="border-0 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
        <h2 className="text-lg font-semibold text-slate-950">Plans</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = summary?.subscription?.planCode === plan.code;
            return (
              <div key={plan.code} className={`rounded-2xl border p-5 ${isCurrent ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200'}`}>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{plan.displayName}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {plan.monthlyPriceMinor === 0 ? 'Free' : `${plan.currency} ${(plan.monthlyPriceMinor / 100).toLocaleString()}`}
                  {plan.monthlyPriceMinor > 0 && <span className="text-sm font-normal text-slate-500">/mo</span>}
                </p>
                <ul className="mt-3 space-y-1 text-sm text-slate-500">
                  <li>{plan.maxActiveJobs != null ? `${plan.maxActiveJobs} active jobs` : 'Unlimited active jobs'}</li>
                  <li>{plan.includedCredits} credits / cycle</li>
                </ul>
                {isCurrent ? (
                  <Badge variant="primary" className="mt-4">Current plan</Badge>
                ) : (
                  canManage && (
                    <Button
                      className="mt-4 w-full"
                      variant="outline"
                      loading={checkoutBusyPlan === plan.code}
                      onClick={() => handleCheckout(plan.code)}
                    >
                      Choose plan
                    </Button>
                  )
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
          <div className="flex items-center gap-2">
            <Receipt size={18} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-950">Recent payments</h2>
          </div>
          <div className="mt-4 space-y-3">
            {transactions.length === 0 ? (
              <p className="text-sm text-slate-400">No payments yet.</p>
            ) : (
              transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{transaction.planCode || transaction.purpose}</p>
                    <p className="text-xs text-slate-400">{new Date(transaction.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {transaction.currency} {(transaction.amountMinor / 100).toLocaleString()}
                    </p>
                    <StatusBadge status={transaction.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="border-0 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
          <h2 className="text-lg font-semibold text-slate-950">Invoices</h2>
          <div className="mt-4 space-y-3">
            {invoices.length === 0 ? (
              <p className="text-sm text-slate-400">No invoices yet.</p>
            ) : (
              invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{invoice.invoiceNumber}</p>
                    <p className="text-xs text-slate-400">{new Date(invoice.issueDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {invoice.currency} {(invoice.amountMinor / 100).toLocaleString()}
                    </p>
                    <StatusBadge status={invoice.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </RecruiterLayout>
  );
};

const StatusBadge = ({ status }) => {
  const variant = status === 'SUCCEEDED' || status === 'PAID' ? 'success'
    : status === 'FAILED' ? 'danger'
    : status === 'PENDING' || status === 'ISSUED' ? 'default'
    : 'default';
  return <Badge variant={variant}>{status}</Badge>;
};

export default BillingPage;
