import { useState } from 'react';
import { Bell, Mail, Send, X } from 'lucide-react';

interface Props {
  recipientName: string;
  recipientPhone?: string;
  recipientEmail?: string;
  fcmToken?: string;
  type: 'vendor' | 'customer';
  onClose: () => void;
  onSend: (message: { title: string; body: string; channel: 'push' | 'email' | 'both' }) => Promise<void>;
}

const vendorTemplates = [
  {
    label: 'Upload certificate',
    title: 'Action required: Upload your business certificate',
    body: 'Please upload your business registration certificate or National ID in the MobiGas Vendor app to complete verification and start receiving orders.'
  },
  {
    label: 'Account verified',
    title: '✅ Your account has been verified!',
    body: 'Congratulations! Your MobiGas vendor account is verified. You can now go online and start receiving orders.'
  },
  {
    label: 'Account rejected',
    title: 'Account verification update',
    body: 'We could not verify your business details. Please update your business certificate in the app and resubmit.'
  },
  {
    label: 'Complete setup',
    title: 'Complete your business setup',
    body: 'You have not completed your gas products and prices setup. Open the MobiGas Vendor app to add your products and go online.'
  },
];

const customerTemplates = [
  {
    label: 'Credit approved',
    title: '🎉 Your gas credit is ready!',
    body: 'Great news! Your credit limit has been approved. Open MobiGas to order gas now and pay within 30 days.'
  },
  {
    label: 'Credit rejected',
    title: 'Credit application update',
    body: 'Your credit application needs more information. Please update your details in the MobiGas app.'
  },
  {
    label: 'Repayment reminder',
    title: '💳 Repayment reminder',
    body: 'Your gas credit repayment is due soon. Pay via M-Pesa to maintain your credit limit.'
  },
];

export default function NotifyModal({ recipientName, fcmToken, type, onClose, onSend }: Props) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [channel, setChannel] = useState<'push' | 'email' | 'both'>('push');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const templates = type === 'vendor' ? vendorTemplates : customerTemplates;

  const handleSend = async () => {
    if (!title || !body) return;
    setSending(true);
    await onSend({ title, body, channel });
    setSent(true);
    setSending(false);
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-[#F97316]" />
            <h2 className="font-bold text-[#0D1B40]">Notify {recipientName}</h2>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        {sent ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-3">✅</div>
            <div className="font-semibold text-green-600">Notification sent!</div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Quick templates */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Quick templates</label>
              <div className="flex flex-wrap gap-2">
                {templates.map(t => (
                  <button
                    key={t.label}
                    onClick={() => { setTitle(t.title); setBody(t.body); }}
                    className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-full hover:bg-orange-100 transition-colors"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Channel */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Send via</label>
              <div className="flex gap-2">
                {[
                  { value: 'push', label: 'Push only', icon: Bell },
                  { value: 'email', label: 'Email only', icon: Mail },
                  { value: 'both', label: 'Push + Email', icon: Send },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setChannel(value as any)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      channel === value
                        ? 'bg-[#0D1B40] text-white border-[#0D1B40]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>
              {!fcmToken && channel !== 'email' && (
                <p className="text-xs text-yellow-600 mt-1">⚠️ No FCM token — push may not deliver. Use email.</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Title</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Notification title..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
              />
            </div>

            {/* Body */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Message</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Notification message..."
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316] resize-none"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={sending || !title || !body}
              className="w-full bg-[#F97316] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <Send size={16} />
                  Send notification
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
