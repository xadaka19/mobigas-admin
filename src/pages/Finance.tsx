import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { DollarSign, TrendingUp, Building2 } from 'lucide-react';

export default function Finance() {
  const [orders, setOrders] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [ordersSnap, banksSnap] = await Promise.all([
      getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'))),
      getDocs(collection(db, 'bank_partners')),
    ]);
    setOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setBanks(banksSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const totalGMV = deliveredOrders.reduce((sum, o) => sum + (o.bankDisbursementAmount || 0), 0);
  const totalCommission = deliveredOrders.reduce((sum, o) => sum + (o.originationFeeToMobigas || 0), 0);

  // Group by bank
  const byBank = banks.map(bank => {
    const bankOrders = deliveredOrders.filter(o => o.partnerBankName === bank.name);
    const gmv = bankOrders.reduce((sum, o) => sum + (o.bankDisbursementAmount || 0), 0);
    const commission = bankOrders.reduce((sum, o) => sum + (o.originationFeeToMobigas || 0), 0);
    return { ...bank, bankOrders: bankOrders.length, gmv, commission };
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0D1B40]">Finance</h1>
        <p className="text-gray-500 text-sm mt-1">MobiGas commission tracking per bank partner</p>
      </div>

      {loading ? (
        <div className="text-center p-8 text-gray-400">Loading...</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mb-3">
                <DollarSign size={20} className="text-white" />
              </div>
              <div className="text-2xl font-bold text-[#0D1B40]">KES {totalGMV.toLocaleString()}</div>
              <div className="text-sm text-gray-500 mt-0.5">Total GMV (delivered orders)</div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="w-10 h-10 bg-[#F97316] rounded-lg flex items-center justify-center mb-3">
                <TrendingUp size={20} className="text-white" />
              </div>
              <div className="text-2xl font-bold text-[#0D1B40]">KES {totalCommission.toLocaleString()}</div>
              <div className="text-sm text-gray-500 mt-0.5">Total MobiGas Commission</div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mb-3">
                <Building2 size={20} className="text-white" />
              </div>
              <div className="text-2xl font-bold text-[#0D1B40]">{deliveredOrders.length}</div>
              <div className="text-sm text-gray-500 mt-0.5">Completed Deliveries</div>
            </div>
          </div>

          {/* By bank */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-[#0D1B40]">Commission by Bank Partner</h2>
              <p className="text-xs text-gray-400 mt-0.5">Rate set per commercial agreement with each bank</p>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-600">Bank</th>
                  <th className="text-left p-4 font-medium text-gray-600">Commission Rate</th>
                  <th className="text-left p-4 font-medium text-gray-600">Orders</th>
                  <th className="text-left p-4 font-medium text-gray-600">GMV</th>
                  <th className="text-left p-4 font-medium text-gray-600">MobiGas Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {byBank.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-400">No bank partners yet</td></tr>
                ) : byBank.map(bank => (
                  <tr key={bank.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-[#0D1B40]">{bank.name}</td>
                    <td className="p-4 text-gray-500">{(bank.commissionRate * 100).toFixed(2)}%</td>
                    <td className="p-4 text-gray-700">{bank.bankOrders}</td>
                    <td className="p-4 font-semibold">KES {bank.gmv.toLocaleString()}</td>
                    <td className="p-4 font-bold text-green-600">KES {bank.commission.toLocaleString()}</td>
                  </tr>
                ))}
                {/* Unattributed orders */}
                {(() => {
                  const unattributed = deliveredOrders.filter(o => !banks.find(b => b.name === o.partnerBankName));
                  if (unattributed.length === 0) return null;
                  const gmv = unattributed.reduce((sum, o) => sum + (o.bankDisbursementAmount || 0), 0);
                  const commission = unattributed.reduce((sum, o) => sum + (o.originationFeeToMobigas || 0), 0);
                  return (
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 text-gray-400 italic">Other / Unassigned</td>
                      <td className="p-4 text-gray-400">—</td>
                      <td className="p-4 text-gray-400">{unattributed.length}</td>
                      <td className="p-4 text-gray-400">KES {gmv.toLocaleString()}</td>
                      <td className="p-4 text-gray-400">KES {commission.toLocaleString()}</td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
