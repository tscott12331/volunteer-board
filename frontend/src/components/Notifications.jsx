// notification popup component
// need to fetch notifications from supabase and display events    

import { useEffect, useState } from 'react';
import styles from './Notifications.module.css';
import { supabase } from '../util/api/supabaseClient';

// Lightweight Notifications overlay component
export default function Notifications({ user, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel;

    async function loadInitial() {
      // Attempt to fetch notifications for the user from a `notifications` table
      try {
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (data) setNotifications(data);
      } catch (err) {
        // no notifications table or permission; fall back to mock
        console.warn('Could not load notifications, using fallback', err);
        setNotifications([
          { id: 'mock-1', title: 'New volunteer opportunity', body: 'A new beach cleanup near you.', created_at: new Date().toISOString(), type: 'opportunity' },
          { id: 'mock-2', title: 'New volunteer registered', body: 'Someone signed up for your event.', created_at: new Date().toISOString(), type: 'volunteer' },
        ]);
      } finally {
        setLoading(false);
      }
    }

    loadInitial();

    // Subscribe to realtime notifications if the table exists
    try {
      channel = supabase.channel('public:notifications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, payload => {
          // Only push notifications that target this user
          const newRecord = payload.new;
          if (!newRecord) return;
          if (newRecord.user_id === user?.id) {
            setNotifications(prev => [newRecord, ...prev]);
          }
        })
        .subscribe();
    } catch (err) {
      // ignore if realtime isn't set up
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.overlay} role="dialog" aria-label="Notifications">
        <div className={styles.header}>
          <h5 className="m-0">Notifications</h5>
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Close</button>
        </div>

        {loading && <p className="muted">Loading...</p>}

        {!loading && notifications.length === 0 && (
          <p className="muted">No notifications</p>
        )}

        {notifications.map(n => (
          <div className={`${styles.item}`} key={n.id}>
            <div className={n.read ? '' : styles.unread}>{n.title}</div>
            <div className={styles.muted} style={{ fontSize: '0.875rem' }}>{n.body}</div>
            <div className={styles.muted} style={{ fontSize: '0.75rem' }}>{new Date(n.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </>
  );
}
