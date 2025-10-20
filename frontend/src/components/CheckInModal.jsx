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

    useEffect(() => {
        loadRegistrations();
    }, [event]);

    async function loadRegistrations() {
        setLoading(true);
        const result = await fetchEventRegistrations(event.id);
        
        if (result.success) {
            setRegistrations(result.data);
        } else {
            console.error("Failed to load registrations:", result.message);
        }
        setLoading(false);
    }

    const handleCheckIn = async (registrationId, currentStatus) => {
        setUpdating(true);
        const newStatus = currentStatus === 'checked_in' ? 'registered' : 'checked_in';
        
        const result = await updateRegistrationStatus(registrationId, newStatus);
        
        if (result.success) {
            // Update local state
            setRegistrations(prev =>
                prev.map(reg =>
                    reg.id === registrationId
                        ? { ...reg, status: newStatus }
                        : reg
                )
            );
            onCheckInComplete();
        } else {
            alert('Failed to update check-in status: ' + result.message);
        }
        setUpdating(false);
    };

    const filteredRegistrations = registrations.filter(reg => {
        const name = reg.profiles?.display_name || reg.profiles?.full_name || '';
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Check-In: {event.title}</h2>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        type="button"
                    >
                        ×
                    </button>
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
                        filteredRegistrations.map(registration => {
                            const name = registration.profiles?.display_name || 
                                       registration.profiles?.full_name || 
                                       'Unknown';
                            const isCheckedIn = registration.status === 'checked_in';

                            return (
                                <div key={registration.id} className={styles.registrationItem}>
                                    <div className={styles.volunteerInfo}>
                                        {registration.profiles?.avatar_url ? (
                                            <img 
                                                src={registration.profiles.avatar_url} 
                                                alt={name}
                                                className={styles.avatar}
                                            />
                                        ) : (
                                            <div className={styles.avatarPlaceholder}>
                                                {name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <span className={styles.volunteerName}>{name}</span>
                                    </div>
                                    <button
                                        className={`btn ${isCheckedIn ? 'btn-outline-secondary' : 'btn-outline-primary'}`}
                                        onClick={() => handleCheckIn(registration.id, registration.status)}
                                        disabled={updating}
                                    >
                                        {isCheckedIn ? 'Checked In' : 'Check In'}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
