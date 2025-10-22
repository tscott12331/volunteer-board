import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    fetchNotifications,
    markNotificationRead,
    markNotificationUnread,
    markAllNotificationsRead,
    subscribeToNotifications
} from '../util/api/notifications';
import styles from './NotificationsPage.module.css';

export default function NotificationsPage({ user }) {
    const [notifications, setNotifications] = useState([]);
    const [filteredNotifications, setFilteredNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [bulkAction, setBulkAction] = useState(false);
    const navigate = useNavigate();

    // Fetch initial notifications
    useEffect(() => {
        if (!user?.id) {
            navigate('/signin');
            return;
        }

        let mounted = true;
        setLoading(true);

        fetchNotifications(user.id, { limit: 100, offset: 0 })
            .then(data => {
                if (mounted) {
                    setNotifications(data);
                }
            })
            .catch(err => {
                console.error('Error fetching notifications:', err);
                setNotifications([]);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => { mounted = false; };
    }, [user?.id, navigate]);

    // Realtime subscription
    useEffect(() => {
        if (!user?.id) return;

        const unsub = subscribeToNotifications(user.id, {
            onInsert: (n) => {
                setNotifications(prev => [n, ...prev]);
            },
            onUpdate: (n) => {
                setNotifications(prev => prev.map(x => x.id === n.id ? n : x));
            },
            onDelete: (old) => {
                setNotifications(prev => prev.filter(x => x.id !== old.id));
                setSelectedIds(prev => {
                    const next = new Set(prev);
                    next.delete(old.id);
                    return next;
                });
            }
        });

        return () => { unsub?.(); };
    }, [user?.id]);

    // Apply filter
    useEffect(() => {
        if (filter === 'all') {
            setFilteredNotifications(notifications);
        } else if (filter === 'unread') {
            setFilteredNotifications(notifications.filter(n => !n.is_read));
        } else if (filter === 'read') {
            setFilteredNotifications(notifications.filter(n => n.is_read));
        }
    }, [notifications, filter]);

    // Navigate to event
    const handleNavigate = async (n) => {
        if (!n.is_read) {
            await markNotificationRead(n.id);
            setNotifications(prev => prev.map(x => 
                x.id === n.id ? { ...x, is_read: true, read_at: new Date().toISOString() } : x
            ));
        }
        navigate(`/event/${n.event_id}`);
    };

    // Toggle read/unread on a single notification
    const handleToggleRead = async (n) => {
        try {
            if (n.is_read) {
                await markNotificationUnread(n.id);
                setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: false, read_at: null } : x));
            } else {
                await markNotificationRead(n.id);
                setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true, read_at: new Date().toISOString() } : x));
            }
        } catch (err) {
            console.error('Toggle read error:', err);
        }
    };

    // Mark all as read
    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead(user.id);
            setNotifications(prev => prev.map(n => ({ 
                ...n, 
                is_read: true, 
                read_at: new Date().toISOString() 
            })));
        } catch (err) {
            console.error('Error marking all as read:', err);
            alert('Failed to mark all as read. Please try again.');
        }
    };

    // Toggle selection
    const handleToggleSelect = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Select all filtered
    const handleSelectAll = () => {
        if (selectedIds.size === filteredNotifications.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredNotifications.map(n => n.id)));
        }
    };

    // Bulk mark as read
    const handleBulkMarkRead = async () => {
        if (selectedIds.size === 0) return;
        
        try {
            setBulkAction(true);
            const promises = Array.from(selectedIds).map(id => markNotificationRead(id));
            await Promise.all(promises);
            
            setNotifications(prev => prev.map(n => 
                selectedIds.has(n.id) 
                    ? { ...n, is_read: true, read_at: new Date().toISOString() } 
                    : n
            ));
            setSelectedIds(new Set());
        } catch (err) {
            console.error('Error bulk marking as read:', err);
            alert('Failed to mark notifications as read. Please try again.');
        } finally {
            setBulkAction(false);
        }
    };

    // Bulk mark as unread
    const handleBulkMarkUnread = async () => {
        if (selectedIds.size === 0) return;
        try {
            setBulkAction(true);
            const promises = Array.from(selectedIds).map(id => markNotificationUnread(id));
            await Promise.all(promises);
            setNotifications(prev => prev.map(n => 
                selectedIds.has(n.id)
                    ? { ...n, is_read: false, read_at: null }
                    : n
            ));
            setSelectedIds(new Set());
        } catch (err) {
            console.error('Error bulk marking as unread:', err);
            alert('Failed to mark notifications as unread. Please try again.');
        } finally {
            setBulkAction(false);
        }
    };

    // Get icon by type
    const getIcon = (n) => {
        const type = n.payload?.type || n.type || '';
        if (type === 'opportunity') return { icon: 'bi-calendar2-event', color: '#667eea' };
        if (type === 'registration') return { icon: 'bi-person-plus', color: '#10b981' };
        if (type === 'reminder') return { icon: 'bi-bell', color: '#f59e0b' };
        return { icon: 'bi-info-circle', color: '#6c757d' };
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;
    const allSelected = filteredNotifications.length > 0 && selectedIds.size === filteredNotifications.length;

    if (!user) {
        return null;
    }

    return (
        <div className={styles.pageWrapper}>
            <div className="container py-4">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="mb-1 text-white">Notifications</h1>
                        {unreadCount > 0 && (
                            <p className="text-muted mb-0">
                                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                    <button 
                        className="btn btn-outline-light"
                        onClick={handleMarkAllRead}
                        disabled={unreadCount === 0}
                    >
                        <i className="bi bi-check-all me-2"></i>
                        Mark all as read
                    </button>
                </div>

                {/* Filter Tabs */}
                <ul className="nav nav-tabs" style={{ background: '#2c3034', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem 0', border: '1px solid #3a3f44', borderBottom: '2px solid #3a3f44', marginBottom: 0 }}>
                    <li className="nav-item">
                        <button 
                            className={`nav-link ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All ({notifications.length})
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link ${filter === 'unread' ? 'active' : ''}`}
                            onClick={() => setFilter('unread')}
                        >
                            Unread ({unreadCount})
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link ${filter === 'read' ? 'active' : ''}`}
                            onClick={() => setFilter('read')}
                        >
                            Read ({notifications.length - unreadCount})
                        </button>
                    </li>
                </ul>

                {/* Bulk Actions Bar */}
                {selectedIds.size > 0 && (
                    <div className={styles.selectionBar} role="region" aria-label="Selection actions">
                        <div className={styles.selectionText}>
                            <i className="bi bi-check2-square"></i>
                            <span>{selectedIds.size} notification{selectedIds.size !== 1 ? 's' : ''} selected</span>
                        </div>
                        <div className={styles.selectionActions}>
                            <button 
                                type="button"
                                className={`btn btn-sm btn-outline-light ${styles.primaryBtn}`}
                                onClick={handleBulkMarkRead}
                                disabled={bulkAction}
                                title="Mark selected as read"
                                aria-label="Mark selected as read"
                            >
                                {bulkAction ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                                        <span>Working...</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check2-all me-2" aria-hidden="true"></i>
                                        <span>Mark as read</span>
                                    </>
                                )}
                            </button>
                            <button 
                                type="button"
                                className={`btn btn-sm btn-outline-light ${styles.primaryBtn}`}
                                onClick={handleBulkMarkUnread}
                                disabled={bulkAction}
                                title="Mark selected as unread"
                                aria-label="Mark selected as unread"
                            >
                                <i className="bi bi-envelope me-2" aria-hidden="true"></i>
                                <span>Mark as unread</span>
                            </button>
                            <button 
                                type="button"
                                className={`btn btn-sm btn-outline-light ${styles.clearBtn}`}
                                onClick={() => setSelectedIds(new Set())}
                                title="Clear selection"
                                aria-label="Clear selection"
                            >
                                <i className="bi bi-x-circle me-2" aria-hidden="true"></i>
                                <span>Clear</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Notifications List */}
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-light" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="text-center py-5">
                        <i className="bi bi-inbox text-muted" style={{ fontSize: '3rem' }}></i>
                        <p className="text-muted mt-3">
                            {filter === 'unread' && 'No unread notifications'}
                            {filter === 'read' && 'No read notifications'}
                            {filter === 'all' && 'You\'re all caught up!'}
                        </p>
                        {filter === 'all' && (
                            <button 
                                className="btn btn-primary mt-2"
                                onClick={() => navigate('/')}
                            >
                                <i className="bi bi-compass me-2"></i>
                                Discover Events
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="card shadow-sm" style={{ background: '#2c3034', border: '1px solid #3a3f44', borderTop: 'none', borderRadius: '0 0 12px 12px', marginTop: 0 }}>
                        {/* Select all header */}
                        <div className="card-header border-bottom" style={{ background: '#252930', borderColor: '#3a3f44' }}>
                            <div className="form-check">
                                <input 
                                    className="form-check-input" 
                                    type="checkbox" 
                                    id="selectAll"
                                    checked={allSelected}
                                    onChange={handleSelectAll}
                                />
                                <label className="form-check-label text-muted small" htmlFor="selectAll">
                                    Select all
                                </label>
                            </div>
                        </div>

                        {/* Notification items */}
                        <ul className="list-group list-group-flush">
                            {filteredNotifications.map((n) => {
                                const iconData = getIcon(n);
                                const isSelected = selectedIds.has(n.id);
                                
                                return (
                                    <li 
                                        key={n.id} 
                                        className={`list-group-item ${styles.notificationItem} ${!n.is_read ? styles.unread : ''} ${isSelected ? styles.selected : ''}`}
                                    >
                                        <div className="d-flex align-items-start gap-3">
                                            {/* Checkbox */}
                                            <div className="form-check mt-1">
                                                <input 
                                                    className="form-check-input" 
                                                    type="checkbox" 
                                                    checked={isSelected}
                                                    onChange={() => handleToggleSelect(n.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>

                                            {/* Icon */}
                                            <div className="mt-1">
                                                <i className={`bi ${iconData.icon}`} style={{ fontSize: '1.5rem', color: iconData.color }}></i>
                                            </div>

                                            {/* Content */}
                                            <div 
                                                className="flex-grow-1" 
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => handleNavigate(n)}
                                            >
                                                <h6 className={`mb-1 text-white ${!n.is_read ? 'fw-bold' : ''}`}>
                                                    {n.title}
                                                    {!n.is_read && (
                                                        <span className="badge ms-2" style={{ background: '#667eea' }}>New</span>
                                                    )}
                                                </h6>
                                                <p className="mb-1 text-muted">{n.body}</p>
                                                <small className="text-muted">
                                                    <i className="bi bi-clock me-1"></i>
                                                    {new Date(n.created_at).toLocaleString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: 'numeric',
                                                        minute: '2-digit'
                                                    })}
                                                </small>
                                            </div>

                                            {/* Actions */}
                                            <div className="mt-1 d-flex align-items-center gap-2">
                                                <button 
                                                    className="btn btn-sm btn-link text-decoration-none text-muted"
                                                    title={n.is_read ? 'Mark as unread' : 'Mark as read'}
                                                    onClick={(e) => { e.stopPropagation(); handleToggleRead(n); }}
                                                    aria-label={n.is_read ? 'Mark as unread' : 'Mark as read'}
                                                >
                                                    {n.is_read ? <i className="bi bi-envelope"></i> : <i className="bi bi-envelope-open"></i>}
                                                </button>
                                                <i className="bi bi-chevron-right text-muted"></i>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
