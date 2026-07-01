import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Search, CheckCircle, Clock, Send, UserCheck } from 'lucide-react';

const TEAM_MEMBERS = [
  { name: 'Patrick', email: 'admin@mobigas.co.ke' },
  { name: 'Support Team', email: 'hello@mobigas.co.ke' },
];

export default function SupportTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'replied' | 'resolved'>('all');
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignTo, setAssignTo] = useState('');

  useEffect(() => { loadTickets(); }, []);

  const loadTickets = async () => {
    const snap = await getDocs(query(collection(db, 'support_tickets'), orderBy('createdAt', 'desc')));
    setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  const resolveTicket = async (ticketId: string) => {
    await updateDoc(doc(db, 'support_tickets', ticketId), {
      status: 'resolved',
      resolvedAt: new Date(),
    });
    loadTickets();
    setSelected(null);
  };

  const sendReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('https://api.mobigas.co.ke/api/admin/support-tickets/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ticketId: selected.id,
          to: selected.email,
          recipientName: selected.name,
          message: reply,
          adminName: auth.currentUser?.email || 'MobiGas Support',
        }),
      });
      if (res.ok) {
        setReply('');
        loadTickets();
        setSelected((prev: any) => ({ ...prev, status: 'replied', lastReply: reply }));
      }
    } catch (e) {
      console.error('Reply failed', e);
    }
    setSending(false);
  };

  const assignTicket = async () => {
    if (!assignTo || !selected) return;
    setAssigning(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const member = TEAM_MEMBERS.find(m => m.email === assignTo);
      await fetch('https://api.mobigas.co.ke/api/admin/support-tickets/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ticketId: selected.id,
          assignedTo: member?.name || assignTo,
          assignedToEmail: assignTo,
        }),
      });
      loadTickets();
      setSelected((prev: any) => ({ ...prev, assignedTo: member?.name, status: 'assigned' }));
    } catch (e) {
      console.error('Assign failed', e);
    }
    setAssigning(false);
  };

  const openCount = tickets.filter(t => t.status === 'open').length;

  const filtered = tickets.filter(t => {
    const matchSearch = !search ||
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.email?.toLowerCase().includes(search.toLowerCase()) ||
      t.message?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusColor: Record<string, string> = {
    open: 'bg-orange-50 text-[#F97316]',
    replied: 'bg-blue-50 text-blue-600',
    assigned: 'bg-purple-50 text-purple-600',
    resolved: 'bg-green-50 text-green-600',
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0D1B40]">Support Tickets</h1>
          <p className="text-gray-500 text-sm mt-1">{tickets.length} total · {openCount} open</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'open', 'replied', 'assigned', 'resolved'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s as any)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === s ? 'bg-[#F97316] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, or message..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-400 py-12">No tickets found</div>
        ) : filtered.map(ticket => (
          <div
            key={ticket.id}
            onClick={() => { setSelected(ticket); setReply(''); setAssignTo(''); }}
            className={`bg-white rounded-xl border p-4 cursor-pointer hover:shadow-sm transition-all ${
              ticket.status === 'open' ? 'border-orange-200' : 'border-gray-100'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  ticket.status === 'open' ? 'bg-orange-50' : 'bg-green-50'
                }`}>
                  {ticket.status === 'resolved'
                    ? <CheckCircle size={16} className="text-green-500" />
                    : <Clock size={16} className="text-[#F97316]" />
                  }
                </div>
                <div>
                  <div className="font-medium text-[#0D1B40] text-sm">{ticket.name}</div>
                  <div className="text-xs text-gray-400">{ticket.email}</div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ticket.message}</p>
                  {ticket.assignedTo && (
                    <div className="text-xs text-purple-500 mt-1">Assigned to: {ticket.assignedTo}</div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[ticket.status] || statusColor.open}`}>
                  {ticket.status}
                </span>
                <span className="text-xs text-gray-400">
                  {ticket.createdAt?.toDate?.()?.toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0D1B40]">Support Ticket</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">

              {/* Details */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Name', selected.name],
                  ['Status', selected.status],
                  ['Email', selected.email],
                  ['Phone', selected.phone || 'Not provided'],
                  ['Source', selected.source || 'website_chat'],
                  ['Date', selected.createdAt?.toDate?.()?.toLocaleString()],
                  ['Assigned to', selected.assignedTo || 'Unassigned'],
                  ['Last reply', selected.lastReplyAt?.toDate?.()?.toLocaleDateString() || 'None'],
                ].map(([label, value]) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-400">{label}</div>
                    <div className="font-medium text-[#0D1B40] text-sm mt-0.5">{value}</div>
                  </div>
                ))}
              </div>

              {/* Message */}
              <div className="bg-orange-50 rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1">Customer message</div>
                <p className="text-sm text-gray-700 leading-relaxed">{selected.message}</p>
              </div>

              {/* Last reply */}
              {selected.lastReply && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-1">Last reply sent by {selected.lastReplyBy}</div>
                  <p className="text-sm text-gray-700 leading-relaxed">{selected.lastReply}</p>
                </div>
              )}

              {/* Reply composer */}
              <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="text-sm font-semibold text-[#0D1B40]">Reply from hello@mobigas.co.ke</div>
                <textarea
                  rows={4}
                  placeholder="Type your reply to the customer..."
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] resize-none"
                />
                <button
                  onClick={sendReply}
                  disabled={sending || !reply.trim()}
                  className="flex items-center gap-2 bg-[#F97316] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  <Send size={14} />
                  {sending ? 'Sending...' : 'Send reply'}
                </button>
              </div>

              {/* Assign ticket */}
              <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="text-sm font-semibold text-[#0D1B40]">Assign ticket</div>
                <div className="flex gap-2">
                  <select
                    value={assignTo}
                    onChange={e => setAssignTo(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                  >
                    <option value="">Select team member...</option>
                    {TEAM_MEMBERS.map(m => (
                      <option key={m.email} value={m.email}>{m.name} ({m.email})</option>
                    ))}
                  </select>
                  <button
                    onClick={assignTicket}
                    disabled={assigning || !assignTo}
                    className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-600 disabled:opacity-50 transition-colors"
                  >
                    <UserCheck size={14} />
                    {assigning ? 'Assigning...' : 'Assign'}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {selected.status !== 'resolved' && (
                  <button
                    onClick={() => resolveTicket(selected.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors"
                  >
                    <CheckCircle size={14} />
                    Mark resolved
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
