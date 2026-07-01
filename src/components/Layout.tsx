import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Store, ShoppingBag,
  CreditCard, TrendingUp, Building2, DollarSign, MessageSquare, MessageCircle,
  LogOut, Flame, Menu, X
} from 'lucide-react';
import { useState } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const navItems = [
  { path: '/overview', label: 'Overview', icon: LayoutDashboard },
  { path: '/orders', label: 'Orders', icon: ShoppingBag },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/vendors', label: 'Vendors', icon: Store },
  { path: '/credit-applications', label: 'Credit Applications', icon: CreditCard },
  { path: '/stock-loans', label: 'Stock Loans', icon: TrendingUp },
  { path: '/bank-partners', label: 'Bank Partners', icon: Building2 },
  { path: '/finance', label: 'Finance', icon: DollarSign },
  { path: '/support-tickets', label: 'Support Tickets', icon: MessageSquare },
  { path: '/in-app-chats', label: 'In-App Chats', icon: MessageCircle },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-[#0D1B40] text-white flex flex-col transition-all duration-300`}>
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10">
          <div className="w-8 h-8 bg-[#F97316] rounded-lg flex items-center justify-center flex-shrink-0">
            <Flame size={18} className="text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <div className="font-bold text-sm">MobiGas</div>
              <div className="text-xs text-gray-400">Admin Dashboard</div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto text-gray-400 hover:text-white"
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                  isActive
                    ? 'bg-[#F97316] text-white'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white w-full text-sm transition-colors"
          >
            <LogOut size={18} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
