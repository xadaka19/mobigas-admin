import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from './firebase';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Customers from './pages/Customers';
import Vendors from './pages/Vendors';
import Orders from './pages/Orders';
import CreditApplications from './pages/CreditApplications';
import StockLoans from './pages/StockLoans';
import BankPartners from './pages/BankPartners';
import Finance from './pages/Finance';
import Login from './pages/Login';
import SupportTickets from './pages/SupportTickets';
import InAppChats from './pages/InAppChats';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  if (user === undefined) return (
    <div className="min-h-screen bg-[#0D1B40] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F97316]"></div>
    </div>
  );

  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="customers" element={<Customers />} />
          <Route path="vendors" element={<Vendors />} />
          <Route path="orders" element={<Orders />} />
          <Route path="credit-applications" element={<CreditApplications />} />
          <Route path="stock-loans" element={<StockLoans />} />
          <Route path="bank-partners" element={<BankPartners />} />
          <Route path="finance" element={<Finance />} />
          <Route path="support-tickets" element={<SupportTickets />} />
          <Route path="in-app-chats" element={<InAppChats />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
