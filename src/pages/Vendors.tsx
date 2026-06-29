import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Search, Eye, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import CertificateVerifier from '../components/CertificateVerifier';

export default function Vendors() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => { loadVendors(); }, []);

  const loadVendors = async () => {
    const snap = await getDocs(query(collection(db, 'vendors'), orderBy('createdAt', 'desc')));
    setVendors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  const toggleVerified = async (vendorId: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'vendors', vendorId), { 
        isVerified: !current,
        verifiedAt: !current ? new Date() : null,
        verifiedBy: 'admin'
      });
      await loadVendors();
      if (selected) setSelected({ ...selected, isVerified: !current });
    } catch(e) {
      console.error('Error updating vendor:', e);
      alert('Failed to update vendor status');
    }
  };

  const filtered = vendors.filter(v =>
    !search ||
    v.businessName?.toLowerCase().includes(search.toLowerCase()) ||
    v.phone?.includes(search) ||
    v.ownerName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0D1B40]">Vendors</h1>
        <p className="text-gray-500 text-sm mt-1">{vendors.length} registered vendors</p>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by business name, phone, owner..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left p-4 font-medium text-gray-600">Business</th>
              <th className="text-left p-4 font-medium text-gray-600">Owner</th>
              <th className="text-left p-4 font-medium text-gray-600">Phone</th>
              <th className="text-left p-4 font-medium text-gray-600">Location</th>
              <th className="text-left p-4 font-medium text-gray-600">Type</th>
              <th className="text-left p-4 font-medium text-gray-600">Status</th>
              <th className="text-left p-4 font-medium text-gray-600">Certificate</th>
              <th className="text-left p-4 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={8} className="p-8 text-center text-gray-400">Loading...</td></tr>
            ) : filtered.map(v => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="p-4">
                  <div className="font-medium text-[#0D1B40]">{v.businessName}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${v.isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    <span className="text-xs text-gray-400">{v.isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                </td>
                <td className="p-4 text-gray-700">{v.ownerName}</td>
                <td className="p-4 text-gray-700">{v.phone}</td>
                <td className="p-4 text-xs text-gray-500">{v.address || `${v.estate}, ${v.county}`}</td>
                <td className="p-4 text-xs text-gray-500 capitalize">{v.businessType}</td>
                <td className="p-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${v.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {v.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td className="p-4">
                  {v.certificateUrl ? (
                    <a href={v.certificateUrl} target="_blank" rel="noopener noreferrer"
                      className="text-[#F97316] flex items-center gap-1 text-xs">
                      View <ExternalLink size={12} />
                    </a>
                  ) : <span className="text-gray-300 text-xs">None</span>}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelected(v)} className="text-[#F97316] hover:text-orange-700">
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => toggleVerified(v.id, v.isVerified)}
                      className={v.isVerified ? 'text-red-400 hover:text-red-600' : 'text-green-500 hover:text-green-700'}
                      title={v.isVerified ? 'Unverify' : 'Verify'}
                    >
                      {v.isVerified ? <XCircle size={16} /> : <CheckCircle size={16} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <VendorModal vendor={selected} onClose={() => setSelected(null)}
          onVerify={() => { toggleVerified(selected.id, selected.isVerified); setSelected(null); }} />
      )}
    </div>
  );
}

function VendorModal({ vendor, onClose, onVerify }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0D1B40]">Vendor Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Business Name', vendor.businessName],
              ['Owner', vendor.ownerName],
              ['Phone', vendor.phone],
              ['Business Type', vendor.businessType],
              ['National ID / BRN', vendor.nationalId || vendor.businessRegNumber || '—'],
              ['Payment Method', vendor.paymentMethod],
              ['Location', vendor.address || `${vendor.estate}, ${vendor.county}`],
              ['Delivery Time', vendor.deliveryTime],
              ['Rating', `${vendor.rating} (${vendor.totalReviews} reviews)`],
              ['Joined', vendor.createdAt?.toDate?.()?.toLocaleDateString()],
            ].map(([label, value]) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-400">{label}</div>
                <div className="font-medium text-[#0D1B40] text-sm mt-0.5">{value}</div>
              </div>
            ))}
          </div>

          {/* Brands */}
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-2">Gas Brands</div>
            <div className="flex flex-wrap gap-2">
              {vendor.brands?.map((b: string) => (
                <span key={b} className="bg-orange-50 text-orange-700 text-xs px-2 py-1 rounded-full">{b}</span>
              ))}
            </div>
          </div>

          {/* Listings */}
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-2">Gas Products & Prices</div>
            <div className="space-y-2">
              {vendor.listings?.map((l: any, i: number) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <span className="text-sm font-medium">{l.size} — {l.productType}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#0D1B40]">KES {l.price?.toLocaleString()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${l.available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {l.available ? 'Available' : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Certificate */}
          <div className="space-y-3">
            {vendor.certificateUrl ? (
              <>
                <a href={vendor.certificateUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#F97316] text-sm font-medium">
                  <ExternalLink size={16} /> View Business Certificate
                </a>
                <CertificateVerifier
                  certificateUrl={vendor.certificateUrl}
                  expectedBusinessName={vendor.businessName}
                  expectedIdOrBrn={vendor.nationalId || vendor.businessRegNumber || ''}
                  onVerificationComplete={(result) => {
                    console.log('AI Verification:', result);
                  }}
                />
              </>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
                ⚠️ No certificate uploaded by vendor. Ask vendor to upload their business certificate or National ID via the app.
              </div>
            )}
          </div>

          <button
            onClick={onVerify}
            className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${
              vendor.isVerified
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {vendor.isVerified ? 'Remove Verification' : 'Verify Vendor'}
          </button>
        </div>
      </div>
    </div>
  );
}
