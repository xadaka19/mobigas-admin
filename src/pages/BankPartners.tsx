import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, Building2 } from 'lucide-react';

export default function BankPartners() {
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', commissionRate: '', apiEndpoint: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadBanks(); }, []);

  const loadBanks = async () => {
    const snap = await getDocs(collection(db, 'bank_partners'));
    setBanks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  const addBank = async () => {
    if (!form.name || !form.commissionRate) return;
    setSaving(true);
    await addDoc(collection(db, 'bank_partners'), {
      name: form.name,
      commissionRate: parseFloat(form.commissionRate),
      apiEndpoint: form.apiEndpoint,
      isActive: true,
      totalDisbursed: 0,
      createdAt: serverTimestamp(),
    });
    setForm({ name: '', commissionRate: '', apiEndpoint: '' });
    setShowAdd(false);
    loadBanks();
    setSaving(false);
  };

  const toggleActive = async (bankId: string, current: boolean) => {
    await updateDoc(doc(db, 'bank_partners', bankId), { isActive: !current });
    loadBanks();
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1B40]">Bank Partners</h1>
          <p className="text-gray-500 text-sm mt-1">Manage partner banks and commission rates per agreement</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[#F97316] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors"
        >
          <Plus size={16} /> Add Bank Partner
        </button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center p-8 text-gray-400">Loading...</div>
        ) : banks.length === 0 ? (
          <div className="text-center p-16 text-gray-400 bg-white rounded-xl border border-gray-100">
            No bank partners yet. Add your first partner bank.
          </div>
        ) : banks.map(bank => (
          <div key={bank.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0D1B40] rounded-lg flex items-center justify-center">
                  <Building2 size={20} className="text-white" />
                </div>
                <div>
                  <div className="font-bold text-[#0D1B40]">{bank.name}</div>
                  <div className="text-xs text-gray-400">
                    Commission: {(bank.commissionRate * 100).toFixed(2)}% per disbursement
                    (as agreed with {bank.name})
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  Total disbursed: KES {(bank.totalDisbursed || 0).toLocaleString()}
                </span>
                <button
                  onClick={() => toggleActive(bank.id, bank.isActive)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    bank.isActive
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {bank.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
            {bank.apiEndpoint && (
              <div className="mt-3 text-xs text-gray-400 font-mono bg-gray-50 px-3 py-2 rounded-lg">
                API: {bank.apiEndpoint}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add bank modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#0D1B40]">Add Bank Partner</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Bank Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Equity Bank"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Commission Rate (as agreed with bank)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.001"
                    value={form.commissionRate}
                    onChange={e => setForm({ ...form, commissionRate: e.target.value })}
                    placeholder="e.g. 0.005 for 0.5%"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                  />
                  <span className="text-gray-500 text-sm">
                    = {form.commissionRate ? (parseFloat(form.commissionRate) * 100).toFixed(2) : '0'}%
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Set per your commercial agreement with the bank</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  API Endpoint (optional — for future automation)
                </label>
                <input
                  type="text"
                  value={form.apiEndpoint}
                  onChange={e => setForm({ ...form, apiEndpoint: e.target.value })}
                  placeholder="https://api.bank.co.ke/v1"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                />
              </div>
              <button
                onClick={addBank}
                disabled={saving || !form.name || !form.commissionRate}
                className="w-full bg-[#F97316] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Adding...' : 'Add Bank Partner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
