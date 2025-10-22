import { useState, useEffect } from 'react';
import styles from './CheckInModal.module.css';
import { fetchEventRegistrations, updateRegistrationStatus } from '../util/api/organizations';

/*
    * Modal for checking in volunteers to an event
    * props:
        * event - Event object
        * onClose - Callback when modal is closed
        * onCheckInComplete - Callback when check-ins are updated
*/
export default function CheckInModal({ event, onClose, onCheckInComplete }) {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [updating, setUpdating] = useState(false);
    const [toast, setToast] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(0);
    const [limit] = useState(25); // page size
    const [changed, setChanged] = useState(false); // track if any check-in toggles occurred

    useEffect(() => {
        loadRegistrations();
    }, [event, statusFilter, page]);

    // Debug output for troubleshooting
    useEffect(() => {
        if (!loading) {
            console.log('CheckInModal event.id:', event?.id);
            console.log('Registrations:', registrations);
        }
    }, [loading, registrations, event]);

    async function loadRegistrations() {
        setLoading(true);
        const params = {
            status: statusFilter || null,
            limit,
            offset: page * limit
        };
        console.log('Calling fetchEventRegistrations with:', event.id, params);
        console.log('Timestamp:', new Date().toISOString()); // Cache buster log
        const result = await fetchEventRegistrations(event.id, params);
        console.log('fetchEventRegistrations result:', result);
        console.log('fetchEventRegistrations result.data:', result.data);
        console.log('fetchEventRegistrations result.success:', result.success);
        
        // Accept both shapes: { rows: [...] } or [...]
        let rows = (result?.success)
            ? (Array.isArray(result.data?.rows) ? result.data.rows : (Array.isArray(result.data) ? result.data : []))
            : [];
        
        console.log('Extracted rows:', rows);
        console.log('Rows length:', rows.length);
        console.log('First row if exists:', rows[0]); // Log the actual first row object

        setRegistrations(rows);
        setLoading(false);
    }

    const handleCheckIn = async (registrationId, currentStatus) => {
        setUpdating(true);
        const newStatus = currentStatus === 'checked_in' ? 'registered' : 'checked_in';
        const result = await updateRegistrationStatus(registrationId, newStatus);
        if (result.success) {
            setToast(newStatus === 'checked_in' ? 'Checked in!' : 'Unchecked!');
            setTimeout(() => setToast(null), 2000);
            await loadRegistrations();
            setChanged(true);
        } else {
            alert('Failed to update check-in status: ' + (result.error || 'Unknown error'));
        }
        setUpdating(false);
    };

    const handleClose = () => {
        if (changed && onCheckInComplete) {
            onCheckInComplete(); // refresh parent counts once when closing
        }
        onClose && onClose();
    };


    // Normalize name fields from various possible shapes returned by RPC
    const getNameParts = (r) => {
        const full = (
            r.full_name ||
            r.user_full_name ||
            r.legal_name ||
            [r.first_name, r.last_name].filter(Boolean).join(' ').trim() ||
            r.profile_full_name ||
            ''
        ).trim();
        const alias = (
            r.display_name ||
            r.user_display_name ||
            r.profile_display_name ||
            ''
        ).trim();
        return { full, alias };
    };

    const filteredRegistrations = Array.isArray(registrations)
        ? registrations.filter(reg => {
            const { full, alias } = getNameParts(reg);
            const combined = `${full} ${alias}`.trim();
            return combined.toLowerCase().includes(searchQuery.toLowerCase());
        })
        : [];

    return (
        <div className={styles.modalOverlay} onClick={handleClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Check-In: {event.title}</h2>
                    <button
                        className={styles.closeButton}
                        onClick={handleClose}
                        type="button"
                    >
                        ×
                    </button>
                </div>
                {/* Status filter UI */}
                <div className="mb-2 px-3">
                    <label htmlFor="statusFilter" className="form-label mb-1">Status Filter:</label>
                    <select
                        id="statusFilter"
                        className="form-select form-select-sm"
                        value={statusFilter}
                        onChange={e => { setPage(0); setStatusFilter(e.target.value); }}
                        style={{ maxWidth: 180 }}
                    >
                        <option value="">All</option>
                        <option value="registered">Registered</option>
                        <option value="checked_in">Checked In</option>
                    </select>
                </div>

                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>


                <div className={styles.registrationsList}>
                    {loading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : filteredRegistrations.length === 0 ? (
                        <div className="text-center py-4 text-muted">
                            {searchQuery ? 'No volunteers found' : 'No registrations yet'}
                        </div>
                    ) : (
                        filteredRegistrations.map((registration, idx) => {
                            const { full, alias } = getNameParts(registration);
                            const email = (registration.user_email || registration.email || '').trim();
                            const nameText = (full && alias && alias !== full)
                                ? `${full} (${alias})`
                                : (full || alias || email || 'Unknown');
                            const isCheckedIn = registration.status === 'checked_in';
                            const regTime = registration.registered_at ? new Date(registration.registered_at).toLocaleString() : null;
                            return (
                                <div key={registration.registration_id || registration.id || `reg-${idx}`} className={styles.registrationItem}>
                                    <div className={styles.volunteerInfo}>
                                        {(registration.logo_url || registration.avatar_url) ? (
                                            <img
                                                src={registration.logo_url || registration.avatar_url}
                                                alt={nameText}
                                                className={styles.avatar}
                                            />
                                        ) : (
                                            <div className={styles.avatarPlaceholder}>
                                                {nameText.charAt(0).toUpperCase()}
                                            </div>
                                        )}

                                        <div className={styles.volunteerDetails}>
                                            <div className="fw-bold">{nameText}</div>
                                            {regTime && <div className="text-muted small">{regTime}</div>}
                                        </div>

                                        <div className={styles.actionArea}>
                                            {isCheckedIn ? (
                                                <>
                                                    <span className="text-success fw-bold me-2">
                                                        <i className="bi bi-check-circle-fill me-1"></i>Checked In
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className={`btn btn-outline-secondary btn-sm`}
                                                        onClick={() => handleCheckIn(registration.registration_id || registration.id, registration.status)}
                                                        disabled={updating}
                                                    >
                                                        Uncheck
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className={`btn btn-outline-primary btn-sm`}
                                                    onClick={() => handleCheckIn(registration.registration_id || registration.id, registration.status)}
                                                    disabled={updating}
                                                >
                                                    Check In
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                {/* Pagination controls */}
                <div className="d-flex justify-content-between align-items-center px-3 py-2">
                    <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0 || loading}
                    >
                        Previous
                    </button>
                    <span>Page {page + 1}</span>
                    <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => setPage(p => p + 1)}
                        disabled={registrations.length < limit || loading}
                    >
                        Next
                    </button>
                </div>
                {toast && (
                    <div className="toast align-items-center text-bg-success border-0 show position-fixed bottom-0 end-0 m-4" role="alert">
                        <div className="d-flex">
                            <div className="toast-body">
                                {toast}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
