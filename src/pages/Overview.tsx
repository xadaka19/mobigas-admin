import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Store, ShoppingBag, DollarSign, Clock, AlertCircle } from 'lucide-react';

interface Stats {
  totalCustomers: number;
  totalVendors: number;
  activeVendors: number;
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;
  totalGMV: number;
  todayGMV: number;
  pendingApplications: number;
}

export default function Overview() {
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0, totalVendors: 0, activeVendors: 0,
    totalOrders: 0, todayOrders: 0, pendingOrders: 0,
    totalGMV: 0, todayGMV: 0, pendingApplications: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    // Real-time orders
    const unsub = onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(10)),
      snap => setRecentOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  const loadStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [customers, vendors, orders, applications] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'vendors')),
        getDocs(collection(db, 'orders')),
        getDocs(query(collection(db, 'bank_applications'), where('status', '==', 'pending'))),
      ]);

      const allOrders = orders.docs.map(d => d.data());
      const todayOrders = allOrders.filter(o => {
        const created = o.createdAt?.toDate?.();
        return created && created >= today;
      });

      setStats({
        totalCustomers: customers.size,
        totalVendors: vendors.size,
        activeVendors: vendors.docs.filter(d => d.data().isOnline).length,
        totalOrders: orders.size,
        todayOrders: todayOrders.length,
        pendingOrders: allOrders.filter(o => o.status === 'pending' || o.status === 'accepted').length,
        totalGMV: allOrders.reduce((sum, o) => sum + (o.bankDisbursementAmount || 0), 0),
        todayGMV: todayOrders.reduce((sum, o) => sum + (o.bankDisbursementAmount || 0), 0),
        pendingApplications: applications.size,
      });
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const statCards = [
    { label: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'bg-blue-500', sub: 'Registered' },
    { label: 'Total Vendors', value: stats.totalVendors, icon: Store, color: 'bg-purple-500', sub: `${stats.activeVendors} online now` },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'bg-[#F97316]', sub: `${stats.todayOrders} today` },
    { label: 'Total GMV', value: `KES ${stats.totalGMV.toLocaleString()}`, icon: DollarSign, color: 'bg-green-500', sub: `KES ${stats.todayGMV.toLocaleString()} today` },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'bg-yellow-500', sub: 'Awaiting delivery' },
    { label: 'Credit Applications', value: stats.pendingApplications, icon: AlertCircle, color: 'bg-red-500', sub: 'Awaiting bank' },
  ];

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-blue-100 text-blue-700',
    outForDelivery: 'bg-orange-100 text-orange-700',
    delivered: 'bg-green-100 text-green-700',
    defaulted: 'bg-red-100 text-red-700',
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0D1B40]">Platform Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Real-time MobiGas platform metrics</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F97316]"></div>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {statCards.map(({ label, value, icon: Icon, color, sub }) => (
              <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
                    <Icon size={20} className="text-white" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-[#0D1B40]">{value}</div>
                <div className="text-sm font-medium text-gray-700 mt-0.5">{label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>

          {/* Recent orders */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-[#0D1B40]">Live Orders</h2>
              <span className="flex items-center gap-1 text-xs text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Real-time
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {recentOrders.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No orders yet</div>
              ) : (
                recentOrders.map(order => (
                  <div key={order.id} className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-[#0D1B40] truncate">{order.orderId}</div>
                      <div className="text-xs text-gray-500">{order.customerName} → {order.vendorName}</div>
                    </div>
                    <div className="text-sm font-semibold text-[#0D1B40]">
                      KES {(order.bankDisbursementAmount || 0).toLocaleString()}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
