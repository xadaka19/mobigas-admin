import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Send, ExternalLink } from 'lucide-react';

export default function StockLoans() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadLoans(); }, []);

  const loadLoans = async () => {
    const snap = await getDocs(query(collection(db, 'stock_loan_applications'), orderBy('appliedAt', 'desc')));
    setLoans(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  const forwardToBank = async (loanId: string, bankName: string) => {
    await updateDoc(doc(db, 'stock_loan_applications', loanId), {
      status: 'submittedToBank',
      partnerBankName: bankName,
      submittedToBankAt: new Date(),
    });
    loadLoans();
  };

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    submittedToBank: 'bg-blue-100 text-blue-700',
    bankApproved: 'bg-green-100 text-green-700',
    bankRejected: 'bg-red-100 text-red-700',
    disbursed: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0D1B40]">Stock Boost Loans</h1>
        <p className="text-gray-500 text-sm mt-1">
          Vendor stock loan applications — bank assesses delivery track record
        </p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center p-8 text-gray-400">Loading...</div>
        ) : loans.length === 0 ? (
          <div className="text-center p-16 text-gray-400 bg-white rounded-xl border border-gray-100">
            No stock loan applications yet
          </div>
        ) : loans.map(loan => (
          <div key={loan.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="font-bold text-[#0D1B40]">{loan.vendorName}</div>
                <div className="text-sm text-gray-500">{loan.ownerName} · {loan.phone}</div>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColor[loan.status] || 'bg-gray-100 text-gray-600'}`}>
                {loan.status}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-400">Requested</div>
                <div className="font-bold text-[#0D1B40]">KES {loan.requestedAmount?.toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-400">Months Active</div>
                <div className="font-bold text-[#0D1B40]">{loan.monthsOnPlatform}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-400">Total Deliveries</div>
                <div className="font-bold text-[#0D1B40]">{loan.totalDeliveries}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-400">Avg Monthly Rev</div>
                <div className="font-bold text-[#0D1B40]">KES {loan.averageMonthlyRevenue?.toLocaleString()}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-400">Purpose</div>
                <div className="text-sm font-medium">{loan.purpose}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-400">MobiGas Fee (0.5%)</div>
                <div className="text-sm font-medium text-green-600">
                  KES {loan.mobiGasOriginationFee?.toLocaleString()}
                </div>
              </div>
            </div>

            {loan.certificateUrl && (
              <a href={loan.certificateUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#F97316] text-xs mb-4">
                <ExternalLink size={12} /> View Business Certificate
              </a>
            )}

            {loan.status === 'pending' && (
              <div className="flex gap-2 flex-wrap">
                {['Equity Bank', 'KCB', 'Co-op Bank', 'Faulu', 'KWFT'].map(bank => (
                  <button
                    key={bank}
                    onClick={() => forwardToBank(loan.id, bank)}
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
