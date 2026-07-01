import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function sendNotification({
  fcmToken,
  title,
  body,
  recipientId,
  recipientType,
}: {
  fcmToken?: string;
  title: string;
  body: string;
  recipientId: string;
  recipientType: 'vendor' | 'customer';
}) {
  await addDoc(collection(db, 'notifications_queue'), {
    fcmToken: fcmToken || '',
    title,
    body,
    recipientId,
    recipientType,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

export async function sendEmailNotification({
  to,
  subject,
  body,
  recipientName,
}: {
  to: string;
  subject: string;
  body: string;
  recipientName: string;
}) {
  await addDoc(collection(db, 'email_queue'), {
    to,
    subject,
    body,
    recipientName,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}
