import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, Eye, Bell, ExternalLink, AlertTriangle, ShieldCheck } from 'lucide-react';
import NotifyModal from '../components/NotifyModal';
import { sendNotification, sendEmailNotification } from '../services/notifications';

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [notifying, setNotifying] = useState<any>(null);
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  useEffect(() => { loadCustomers(); }, []);

  const loadCustomers = async () => {
    const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
    setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  const updateCreditLimit = async (customerId: string, limit: number, bankName: string) => {
    await updateDoc(doc(db, 'users', customerId), {
      bankApprovalStatus: 'bankApproved',
      bankApprovedLimit: limit,
      partnerBankName: bankName,
    });
    loadCustomers();
    setSelected(null);
  };

  const clearFlag = async (customerId: string) => {
    await updateDoc(doc(db, 'users', customerId), {
      deviceFlagged: false,
      flagReviewedAt: new Date(),
    });
    loadCustomers();
    setSelected(null);
  };

  const flaggedCount = customers.filter(c => c.deviceFlagged).length;

  const filtered = customers.filter(c => {
    const matchSearch = !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.nationalId?.includes(search);
    const matchFlag = !flaggedOnly || c.deviceFlagged;
    return matchSearch && matchFlag;
  });

  const statusColor: Record<string, string> = {
    none: 'bg-gray-100 text-gray-600',
    pending: 'bg-yellow-100 text-yellow-700',
    submittedToBank: 'bg-blue-100 text-blue-700',
    bankApproved: 'bg-green-100 text-green-700',
    bankRejected: 'bg-red-100 text-red-700',
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1B40]">Customers</h1>
          <p className="text-gray-500 text-sm mt-1">{customers.length} registered customers</p>
        </div>
        {flaggedCount > 0 && (
          <button
            onClick={() => setFlaggedOnly(!flaggedOnly)}
            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
              flaggedOnly
                ? 'bg-red-500 text-white'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
          >
            <AlertTriangle size={16} />
            {flaggedCount} flagged account{flaggedCount !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, phone, ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left p-4 font-medium text-gray-600">Customer</th>
              <th className="text-left p-4 font-medium text-gray-600">Phone</th>
              <th className="text-left p-4 font-medium text-gray-600">National ID</th>
              <th className="text-left p-4 font-medium text-gray-600">Location</th>
              <th className="text-left p-4 font-medium text-gray-600">Credit Status</th>
              <th className="text-left p-4 font-medium text-gray-600">Credit Limit</th>
              <th className="text-left p-4 font-medium text-gray-600">Selfie</th>
              <th className="text-left p-4 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={8} className="p-8 text-center text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-gray-400">No customers found</td></tr>
            ) : filtered.map(c => (
              <tr key={c.id} className={`hover:bg-gray-50 ${c.deviceFlagged ? 'bg-red-50/50' : ''}`}>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-[#0D1B40]">{c.name}</div>
                    {c.deviceFlagged && (
                      <span title="Shared device detected — possible duplicate account">
                        <AlertTriangle size={14} className="text-red-500" />
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">{c.email}</div>
                </td>
                <td className="p-4 text-gray-700">{c.phone}</td>
                <td className="p-4 font-mono text-xs">{c.nationalId}</td>
                <td className="p-4 text-xs text-gray-500">{c.estate}, {c.county}</td>
                <td className="p-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[c.bankApprovalStatus || c.bankStatus] || statusColor.none}`}>
                    {c.bankApprovalStatus || c.bankStatus || 'none'}
                  </span>
                </td>
                <td className="p-4 font-semibold text-[#0D1B40]">
                  {c.bankApprovedLimit ? `KES ${Number(c.bankApprovedLimit).toLocaleString()}` : '—'}
                </td>
                <td className="p-4">
                  {c.selfieUrl ? (
                    <a href={c.selfieUrl} target="_blank" rel="noopener noreferrer">
                      <img src={c.selfieUrl} alt="selfie" className="w-8 h-8 rounded-full object-cover border-2 border-orange-200" />
                    </a>
                  ) : <span className="text-gray-300 text-xs">None</span>}
                </td>
                <td className="p-4">
                  <button
                    onClick={() => setSelected(c)}
                    className="text-[#F97316] hover:text-orange-700 transition-colors"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => setNotifying(c)}
                    className="text-blue-400 hover:text-blue-600 transition-colors ml-2"
                    title="Send notification"
                  >
                    <Bell size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {notifying && (
        <NotifyModal
          recipientName={notifying.name || notifying.customerName}
          fcmToken={notifying.fcmToken}
          type="customer"
          onClose={() => setNotifying(null)}
          onSend={async ({ title, body, channel }) => {
            if (channel === 'push' || channel === 'both') {
              await sendNotification({
                fcmToken: notifying.fcmToken,
                title,
                body,
                recipientId: notifying.id,
                recipientType: 'customer',
              });
            }
            if (channel === 'email' || channel === 'both') {
              if (notifying.email) {
                await sendEmailNotification({
                  to: notifying.email,
                  subject: title,
                  body,
                  recipientName: notifying.name || notifying.customerName,
                });
              }
            }
          }}
        />
      )}
      {selected && (
        <CustomerModal
          customer={selected}
          onClose={() => setSelected(null)}
          onUpdateCredit={updateCreditLimit}
          onClearFlag={clearFlag}
        />
      )}
    </div>
  );
}

function CustomerModal({ customer, onClose, onUpdateCredit, onClearFlag }: any) {
  const [limit, setLimit] = useState(customer.bankApprovedLimit || '');
  const [bankName, setBankName] = useState(customer.partnerBankName || '');
  const [saving, setSaving] = useState(false);
  const [clearingFlag, setClearingFlag] = useState(false);
  const [relatedAccounts, setRelatedAccounts] = useState<any[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  useEffect(() => {
    if (customer.deviceFlagged && customer.deviceFingerprint) {
      loadRelatedAccounts();
    }
  }, [customer.id]);

  const loadRelatedAccounts = async () => {
    setLoadingRelated(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'users'), where('deviceFingerprint', '==', customer.deviceFingerprint))
      );
      setRelatedAccounts(snap.docs.filter(d => d.id !== customer.id).map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error('Failed to load related accounts', e);
    }
    setLoadingRelated(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await onUpdateCredit(customer.id, Number(limit), bankName);
    setSaving(false);
  };

  const handleClearFlag = async () => {
    setClearingFlag(true);
    await onClearFlag(customer.id);
    setClearingFlag(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0D1B40]">Customer Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-6 space-y-6">
          {/* Fraud flag warning */}
          {customer.deviceFlagged && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={18} className="text-red-600" />
                <span className="font-semibold text-red-700 text-sm">Shared device detected</span>
              </div>
              <p className="text-xs text-red-600 mb-3">
                This account was registered on a device that has also been used to register {relatedAccounts.length > 0 ? `${relatedAccounts.length} other account(s)` : 'at least one other account'}.
                This could be a legitimate shared household device, or an attempt to abuse credit limits using multiple identities. Review before approving credit.
              </p>

              {loadingRelated ? (
                <div className="text-xs text-red-400">Loading related accounts...</div>
              ) : relatedAccounts.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {relatedAccounts.map(acc => (
                    <div key={acc.id} className="bg-white rounded-lg p-2 border border-red-100 text-xs">
                      <div className="font-medium text-[#0D1B40]">{acc.name}</div>
                      <div className="text-gray-500">{acc.phone} · ID: {acc.nationalId}</div>
                    </div>
                  ))}
                </div>
              ) : null}

              <button
                onClick={handleClearFlag}
                disabled={clearingFlag}
                className="flex items-center gap-2 text-xs bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                <ShieldCheck size={14} />
                {clearingFlag ? 'Clearing...' : 'Mark as reviewed — clear flag'}
              </button>
            </div>
          )}

          {/* Selfie */}
          {customer.selfieUrl && (
            <div className="flex items-center gap-4">
              <img src={customer.selfieUrl} alt="selfie"
                className="w-20 h-20 rounded-xl object-cover border-2 border-orange-200" />
              <div>
                <div className="font-bold text-lg text-[#0D1B40]">{customer.name}</div>
                <div className="text-gray-500 text-sm">{customer.email}</div>
                <a href={customer.selfieUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-[#F97316] flex items-center gap-1 mt-1">
                  View full selfie <ExternalLink size={12} />
                </a>
              </div>
            </div>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Phone', customer.phone],
              ['National ID', customer.nationalId],
              ['Location', `${customer.estate}, ${customer.county}`],
              ['Joined', customer.createdAt?.toDate?.()?.toLocaleDateString()],
            ].map(([label, value]) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-400">{label}</div>
                <div className="font-medium text-[#0D1B40] text-sm mt-0.5">{value || '—'}</div>
              </div>
            ))}
          </div>

          {/* Guarantors */}
          {customer.guarantors?.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">Guarantors</div>
              <div className="space-y-2">
                {customer.guarantors.map((g: any, i: number) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                    <span className="font-medium text-sm">{g.name}</span>
                    <span className="text-gray-500 text-sm">{g.phone}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Set credit limit (manual for pilot — will be bank API in production) */}
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
            <div className="text-sm font-semibold text-[#0D1B40] mb-3">
              Set Credit Limit
              <span className="text-xs font-normal text-gray-400 ml-2">(Pilot: manual — will be automated via bank API)</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Partner Bank</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  placeholder="e.g. Equity Bank"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Credit Limit (KES)</label>
                <input
                  type="number"
                  value={limit}
                  onChange={e => setLimit(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                />
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !limit || !bankName}
              className="mt-3 w-full bg-[#F97316] text-white py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Set credit limit & notify customer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
