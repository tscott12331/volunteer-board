// notification popup component
// need to fetch notifications from supabase and display events    

import { useEffect, useState, useRef, useCallback } from 'react';
import styles from './Notifications.module.css';
import { useNavigate } from 'react-router-dom';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  subscribeToNotifications
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

  // Initial load - unread only
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchNotifications(user.id, { limit: PAGE_SIZE, offset: 0, is_read: false })
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

  // Realtime subscription: keep list of UNREAD items live-updated while open
  useEffect(() => {
    if (!user?.id) return;
    const unsub = subscribeToNotifications(user.id, {
      onInsert: (n) => {
        // Only show unread in the menu overlay
        if (!n.is_read) {
          setNotifications(prev => [n, ...prev]);
        }
      },
      onUpdate: (n) => {
        setNotifications(prev => {
          // If it became read, remove from list
          if (n.is_read) return prev.filter(x => x.id !== n.id);
          // If still unread, update in place or prepend if not present
          const exists = prev.some(x => x.id === n.id);
          return exists ? prev.map(x => (x.id === n.id ? n : x)) : [n, ...prev];
        });
      },
      onDelete: (old) => {
        setNotifications(prev => prev.filter(x => x.id !== old.id));
      }
    });
    return () => { unsub?.(); };
  }, [user?.id]);

  // Infinite scroll
  const handleScroll = useCallback(e => {
    const el = e.target;
    if (!hasMore || loadingMore || loading) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 64) {
      setLoadingMore(true);
      fetchNotifications(user.id, { limit: PAGE_SIZE, offset: notifications.length, is_read: false })
        .then(data => {
          setNotifications(prev => [...prev, ...data]);
          setHasMore(data.length === PAGE_SIZE);
        })
        .finally(() => setLoadingMore(false));
    }
  }, [user.id, notifications.length, hasMore, loadingMore, loading]);

  // Mark as read (no toggle - just mark read)
  const handleMarkRead = async (n) => {
    if (n.is_read) return;
    await markNotificationRead(n.id);
    // Since this overlay shows only unread, remove the item locally
    setNotifications(prev => prev.filter(x => x.id !== n.id));
  };

  // Mark all as read
  const handleMarkAll = async () => {
    setMarkingAll(true);
    await markAllNotificationsRead(user.id);
    // Clear the unread list since all are now read
    setNotifications([]);
    setHasMore(false);
    setMarkingAll(false);
  };

  // Navigate to event
  const handleNavigate = async (n) => {
    onClose(); // Close overlay immediately for smooth transition
    if (!n.is_read) {
      await markNotificationRead(n.id);
      // Do not update local state; overlay is closing and item is removed by realtime/badge
    }
    navigate(`/event/${n.event_id}`);
  };

  // Keyboard: ESC to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    if (type === 'opportunity') return { icon: 'bi-calendar2-event', color: '#667eea', bg: 'rgba(102, 126, 234, 0.15)' };
    if (type === 'registration') return { icon: 'bi-person-plus', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
    if (type === 'reminder') return { icon: 'bi-bell', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
    return { icon: 'bi-info-circle', color: '#6c757d', bg: 'rgba(108, 117, 125, 0.15)' };
  };

  // Format relative time
  const getRelativeTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div ref={overlayRef} className={styles.overlay} role="dialog" aria-label="Notifications" tabIndex={-1}>
        <div className={styles.header}>
          <div>
            <h5 className="m-0 fw-bold">Notifications</h5>
            <small className="text-muted">Stay updated with new opportunities</small>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <button 
              className="btn btn-sm btn-link text-decoration-none p-1" 
              onClick={() => { navigate('/notifications'); onClose(); }}
              title="View all notifications"
            >
              View All
            </button>
            <button 
              className="btn btn-sm btn-link text-decoration-none p-1" 
              onClick={handleMarkAll} 
              disabled={markingAll}
              title="Mark all as read"
            >
              {markingAll ? 'Marking...' : 'Mark all read'}
            </button>
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

        <div className={styles.notificationsList}>
          {notifications.map(n => {
            const iconData = getIcon(n);
            return (
              <div 
                className={`${styles.item} ${!n.is_read ? styles.unread : ''}`} 
                key={n.id}
                onClick={() => handleNavigate(n)}
                onMouseEnter={() => !n.is_read && handleMarkRead(n)}
              >
                <div className={styles.iconWrapper} style={{ backgroundColor: iconData.bg }}>
                  <i className={`bi ${iconData.icon}`} style={{ color: iconData.color }}></i>
                </div>
                <div className={styles.content}>
                  <div className={styles.titleRow}>
                    <span className={`${styles.title} ${!n.is_read ? styles.titleUnread : ''}`}>
                      {n.title}
                    </span>
                    <span className={styles.time}>{getRelativeTime(n.created_at)}</span>
                  </div>
                  <p className={styles.body}>{n.body}</p>
                  {!n.is_read && <div className={styles.unreadDot}></div>}
                </div>
              </div>
            );
          })}
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
