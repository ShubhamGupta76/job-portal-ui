import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Banknote, CheckCircle2 } from 'lucide-react';
import Card from '../../../components/common/Card';
import Badge from '../../../components/common/Badge';
import Button from '../../../components/common/Button';
import { adminBillingService } from '../../../services';

const emptyPage = { content: [], totalElements: 0, totalPages: 0, number: 0 };

const STATUS_VARIANT = { PENDING: 'warning', SUCCEEDED: 'success', FAILED: 'danger', REFUNDED: 'default', CANCELED: 'default' };

const AdminBillingPage = () => {
  const [page, setPage] = useState(emptyPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmBusyId, setConfirmBusyId] = useState(null);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminBillingService.getTransactions(0, 50);
      setPage(response.data?.data || emptyPage);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load transactions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const handleConfirm = async (transactionId) => {
    const reason = window.prompt('Reason for manually confirming this payment (e.g. bank transfer reference):');
    if (!reason || !reason.trim()) return;
    setConfirmBusyId(transactionId);
    setError('');
    setNotice('');
    try {
      await adminBillingService.confirmPayment(transactionId, reason.trim());
      setNotice(`Transaction #${transactionId} confirmed.`);
      await loadTransactions();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to confirm this payment.');
    } finally {
      setConfirmBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] px-6 py-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6">
          <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800">
            <ArrowLeft size={16} /> Back to admin dashboard
          </Link>
          <h1 className="mt-3 flex items-center gap-2 text-3xl font-semibold text-slate-900"><Banknote size={26} /> Billing</h1>
          <p className="mt-1 text-sm text-slate-500">
            Platform-wide payment visibility. Confirming a pending payment is a manual reconciliation action —
            it is always recorded in the audit log with the reason given, and there is no real payment gateway
            configured in this environment, so this is the only way a subscription activates today.
          </p>
        </div>

        {error && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {notice && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 size={16} /> {notice}
          </div>
        )}

        <Card className="border-0 bg-white p-0 shadow-sm">
          {loading ? (
            <p className="p-6 text-sm text-slate-500">Loading transactions...</p>
          ) : page.content.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-6 py-3">Company</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {page.content.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-6 py-4 font-medium text-slate-800">{transaction.companyName}</td>
                      <td className="px-4 py-4 text-slate-600">{transaction.planCode || transaction.purpose}</td>
                      <td className="px-4 py-4 text-slate-900">
                        {transaction.currency} {(transaction.amountMinor / 100).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={STATUS_VARIANT[transaction.status] || 'default'}>{transaction.status}</Badge>
                      </td>
                      <td className="px-4 py-4 text-slate-500">{new Date(transaction.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-4">
                        {transaction.status === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="outline"
                            loading={confirmBusyId === transaction.id}
                            onClick={() => handleConfirm(transaction.id)}
                          >
                            Confirm payment
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminBillingPage;
