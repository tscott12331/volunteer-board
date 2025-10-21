// notification popup component
// need to fetch notifications from supabase and display events    

import { useEffect, useState, useRef, useCallback } from 'react';
import styles from './Notifications.module.css';
import { useNavigate } from 'react-router-dom';
import {
  fetchNotifications,
  markNotificationRead,
  markNotificationUnread,
  deleteNotification,
  markAllNotificationsRead
} from '../util/api/notifications';

// Lightweight Notifications overlay component
export default function Notifications({ user, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const navigate = useNavigate();
  const overlayRef = useRef();
  const PAGE_SIZE = 20;

  // Initial load
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchNotifications(user.id, { limit: PAGE_SIZE, offset: 0 })
      .then(data => {
        if (mounted) {
          setNotifications(data);
          setHasMore(data.length === PAGE_SIZE);
        }
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
    return () => { mounted = false; };
  }, [user.id]);

  // Infinite scroll
  const handleScroll = useCallback(e => {
    const el = e.target;
    if (!hasMore || loadingMore || loading) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 64) {
      setLoadingMore(true);
      fetchNotifications(user.id, { limit: PAGE_SIZE, offset: notifications.length })
        .then(data => {
          setNotifications(prev => [...prev, ...data]);
          setHasMore(data.length === PAGE_SIZE);
        })
        .finally(() => setLoadingMore(false));
    }
  }, [user.id, notifications.length, hasMore, loadingMore, loading]);

  // Mark as read/unread
  const handleToggleRead = async (n) => {
    if (n.is_read) {
      await markNotificationUnread(n.id);
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: false, read_at: null } : x));
    } else {
      await markNotificationRead(n.id);
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true, read_at: new Date().toISOString() } : x));
    }
  };

  // Delete
  const handleDelete = async (id) => {
    await deleteNotification(id);
    setNotifications(prev => prev.filter(x => x.id !== id));
  };

  // Mark all as read
  const handleMarkAll = async () => {
    setMarkingAll(true);
    await markAllNotificationsRead(user.id);
    setNotifications(prev => prev.map(x => ({ ...x, is_read: true, read_at: new Date().toISOString() })));
    setMarkingAll(false);
  };

  // Navigate to event
  const handleNavigate = async (n) => {
    if (!n.is_read) await markNotificationRead(n.id);
    navigate(`/event/${n.event_id}`);
    onClose();
  };

  // Keyboard: ESC to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Scroll handler
  useEffect(() => {
    const el = overlayRef.current;
    if (el) el.addEventListener('scroll', handleScroll);
    return () => { if (el) el.removeEventListener('scroll', handleScroll); };
  }, [handleScroll]);

  // Icon by type
  const getIcon = (n) => {
    const type = n.payload?.type || n.type || '';
    if (type === 'opportunity') return <i className="bi bi-calendar2-event text-primary me-2" />;
    if (type === 'registration') return <i className="bi bi-person-plus text-success me-2" />;
    if (type === 'reminder') return <i className="bi bi-bell text-warning me-2" />;
    return <i className="bi bi-info-circle text-secondary me-2" />;
  };

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div ref={overlayRef} className={styles.overlay} role="dialog" aria-label="Notifications" tabIndex={-1}>
        <div className={styles.header}>
          <h5 className="m-0">Notifications</h5>
          <div className="d-flex gap-2 align-items-center">
            <button className="btn btn-sm btn-outline-secondary" onClick={handleMarkAll} disabled={markingAll}>Mark all as read</button>
            <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Close</button>
          </div>
        </div>

        {loading && <p className="muted">Loading...</p>}

        {!loading && notifications.length === 0 && (
          <div className="text-center py-5">
            <i className="bi bi-inbox text-secondary" style={{ fontSize: '2.5rem' }} />
            <div className="mt-2 text-muted">You're all caught up!</div>
            <button className="btn btn-link mt-2" onClick={() => { navigate('/'); onClose(); }}>Browse events</button>
          </div>
        )}

        <div>
          {notifications.map(n => (
            <div className={`${styles.item} d-flex align-items-start justify-content-between ${!n.is_read ? styles.unread : ''}`} key={n.id}>
              <div className="flex-grow-1" style={{ cursor: 'pointer' }} onClick={() => handleNavigate(n)}>
                <div className="d-flex align-items-center">
                  {getIcon(n)}
                  <span className={n.is_read ? '' : 'fw-bold'}>{n.title}</span>
                </div>
                <div className={styles.muted} style={{ fontSize: '0.875rem' }}>{n.body}</div>
                <div className={styles.muted} style={{ fontSize: '0.75rem' }}>{new Date(n.created_at).toLocaleString()}</div>
              </div>
              <div className="d-flex flex-column align-items-end ms-2 gap-1">
                <button className="btn btn-sm btn-link px-1" title={n.is_read ? 'Mark as unread' : 'Mark as read'} onClick={e => { e.stopPropagation(); handleToggleRead(n); }}>
                  {n.is_read ? <i className="bi bi-envelope-open" /> : <i className="bi bi-envelope-fill text-primary" />}
                </button>
                <button className="btn btn-sm btn-link px-1 text-danger" title="Delete" onClick={e => { e.stopPropagation(); handleDelete(n.id); }}>
                  <i className="bi bi-x-circle" />
                </button>
              </div>
            </div>
          ))}
        </div>
        {hasMore && !loading && (
          <div className="text-center py-2">
            <div className="spinner-border spinner-border-sm text-secondary" />
          </div>
        )}
      </div>
    </>
  );
}
