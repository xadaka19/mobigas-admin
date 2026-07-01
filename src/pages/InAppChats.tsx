import { useEffect, useState, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Search, Send, MessageCircle, User, Store } from 'lucide-react';

export default function InAppChats() {
  const [chats, setChats] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'support_chats'), orderBy('lastMessageAt', 'desc')),
      snap => setChats(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selected) return;
    const unsub = onSnapshot(
      query(collection(db, 'support_chats', selected.id, 'messages'), orderBy('createdAt', 'asc')),
      snap => {
        setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    );
    // Mark as read by admin
    updateDoc(doc(db, 'support_chats', selected.id), { unreadByAdmin: 0 });
    return () => unsub();
  }, [selected?.id]);

  const sendReply = async () => {
    if (!reply.trim() || !selected || sending) return;
    setSending(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('https://api.mobigas.co.ke/api/admin/support-chats/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          userId: selected.id,
          message: reply,
          adminName: 'MobiGas Support',
        }),
      });
      if (res.ok) setReply('');
    } catch (e) {
      console.error('Reply failed', e);
    }
    setSending(false);
  };

  const filtered = chats.filter(c =>
    !search ||
    c.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMessage?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor: Record<string, string> = {
    open: 'bg-orange-50 text-[#F97316]',
    replied: 'bg-blue-50 text-blue-600',
    resolved: 'bg-green-50 text-green-600',
  };

  const formatTime = (ts: any) => {
    if (!ts?.toDate) return '';
    const d = ts.toDate();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Chat list */}
      <div className="w-80 border-r border-gray-100 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-[#0D1B40] mb-3">In-App Support</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search chats..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-12">No chats yet</div>
          ) : filtered.map(chat => (
            <div
              key={chat.id}
              onClick={() => setSelected(chat)}
              className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                selected?.id === chat.id ? 'bg-orange-50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  chat.userType === 'vendor' ? 'bg-blue-100' : 'bg-orange-100'
                }`}>
                  {chat.userType === 'vendor'
                    ? <Store size={14} className="text-blue-600" />
                    : <User size={14} className="text-[#F97316]" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-medium text-[#0D1B40] truncate">{chat.userEmail}</span>
                    {chat.unreadByAdmin > 0 && (
                      <span className="w-5 h-5 bg-[#F97316] text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                        {chat.unreadByAdmin}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 capitalize mb-1">{chat.userType}</div>
                  <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat window */}
      {selected ? (
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                selected.userType === 'vendor' ? 'bg-blue-100' : 'bg-orange-100'
              }`}>
                {selected.userType === 'vendor'
                  ? <Store size={16} className="text-blue-600" />
                  : <User size={16} className="text-[#F97316]" />
                }
              </div>
              <div>
                <div className="font-semibold text-[#0D1B40] text-sm">{selected.userEmail}</div>
                <div className="text-xs text-gray-400 capitalize">{selected.userType} · {selected.id}</div>
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[selected.status] || statusColor.open}`}>
              {selected.status}
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-12">No messages yet</div>
            ) : messages.map(msg => {
              const isAdmin = msg.sender === 'admin';
              return (
                <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm ${
                    isAdmin
                      ? 'bg-[#0D1B40] text-white rounded-br-sm'
                      : 'bg-white text-gray-700 border border-gray-100 rounded-bl-sm'
                  }`}>
                    <p>{msg.text}</p>
                    <div className={`text-xs mt-1 ${isAdmin ? 'text-white/50' : 'text-gray-400'}`}>
                      {isAdmin ? (msg.adminName || 'Support') : 'User'} · {formatTime(msg.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          {/* Reply input */}
          <div className="bg-white border-t border-gray-100 p-4 flex gap-3">
            <textarea
              rows={2}
              placeholder="Type your reply..."
              value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); }}}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] resize-none"
            />
            <button
              onClick={sendReply}
              disabled={sending || !reply.trim()}
              className="flex items-center gap-2 bg-[#F97316] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors self-end"
            >
              <Send size={14} />
              {sending ? '...' : 'Send'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-400">
            <MessageCircle size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select a chat to start replying</p>
          </div>
        </div>
      )}
    </div>
  );
}
