import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, Send } from 'lucide-react';

export default function CreditApplications() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { loadApplications(); }, []);

  const loadApplications = async () => {
    try {
      const snap = await getDocs(collection(db, 'bank_applications'));
      setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch(e) {
      console.error('Error loading applications:', e);
    }
    setLoading(false);
  };

  const markSubmittedToBank = async (appId: string, bankName: string) => {
    await updateDoc(doc(db, 'bank_applications', appId), {
      status: 'submittedToBank',
      partnerBankName: bankName,
      submittedToBankAt: new Date(),
    });
    loadApplications();
  };

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    submittedToBank: 'bg-blue-100 text-blue-700',
    bankApproved: 'bg-green-100 text-green-700',
    bankRejected: 'bg-red-100 text-red-700',
  };

  const filtered = applications.filter(a =>
    !search || a.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    a.phone?.includes(search)
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0D1B40]">Credit Applications</h1>
        <p className="text-gray-500 text-sm mt-1">
          Customer gas credit requests — forwarded to bank for instant decision
          <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
            Pilot: manual forwarding → will be automated via bank API
          </span>
        </p>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
        />
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center p-8 text-gray-400">Loading...</div>
        ) : filtered.map(app => (
          <div key={app.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {(app.selfieUrl || app.customerSelfieUrl) && (
                  <img src={app.selfieUrl || app.customerSelfieUrl} alt="selfie"
                    className="w-12 h-12 rounded-xl object-cover border-2 border-orange-100" />
                )}
                <div>
                  <div className="font-bold text-[#0D1B40]">{app.customerName || app.name || 'Unknown'}</div>
                  <div className="text-sm text-gray-500">{app.phone || app.customerId}</div>
                </div>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColor[app.status] || 'bg-gray-100 text-gray-600'}`}>
                {app.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-400">National ID</div>
                <div className="font-medium text-sm font-mono">{app.nationalId || '—'}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-400">Guarantors</div>
                <div className="font-medium text-sm">{app.guarantors?.length || 0} added</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-400">Applied</div>
                <div className="font-medium text-sm">{app.createdAt?.toDate?.()?.toLocaleDateString() || app.submittedAt?.toDate?.()?.toLocaleDateString() || '—'}</div>
              </div>
            </div>

            {/* Guarantors */}
            {app.guarantors?.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-gray-400 mb-2">Guarantors</div>
                <div className="flex gap-2 flex-wrap">
                  {app.guarantors.map((g: any, i: number) => (
                    <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                      {g.name} · {g.phone}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {app.status === 'pending' && (
              <div className="flex gap-2">
                {['Equity Bank', 'KCB', 'Co-op Bank', 'Faulu', 'KWFT'].map(bank => (
                  <button
                    key={bank}
                    onClick={() => markSubmittedToBank(app.id, bank)}
                    className="flex items-center gap-1 text-xs bg-[#F97316] text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <Send size={12} /> Forward to {bank}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
