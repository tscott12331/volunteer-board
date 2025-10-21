import { useState } from 'react';
import styles from './OrgEventCard.module.css';
import { formatEventDateTime } from '../util/date';
import CheckInModal from './CheckInModal';

/*
    * Card displaying an organization's event with action buttons
    * props:
        * event - Event object with details
        * onEdit - Callback when edit is clicked
        * onEventChanged - Callback when event is updated
        * onEventDeleted - Callback when event is deleted
        * onSelect - Callback when the card is selected (click)
*/
export default function OrgEventCard({ event, onEventChanged, onEventDeleted, onSelect }) {
    const [showCheckIn, setShowCheckIn] = useState(false);

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'published':
                return 'bg-success';
            case 'completed':
                return 'bg-primary';
            case 'draft':
                return 'bg-secondary';
            case 'cancelled':
                return 'bg-danger';
            default:
                return 'bg-secondary';
        }
    };

    return (
        <>
            <div
                className={styles.eventCard}
                role="button"
                tabIndex={0}
                onClick={() => onSelect && onSelect(event)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect && onSelect(event); } }}
                aria-label={`Open details for ${event.title}`}
            >
                <div className={styles.eventHeader}>
                    <div>
                        <div className={styles.titleRow}>
                            <h3 className={styles.eventTitle}>{event.title}</h3>
                            <span className={`badge ${getStatusBadgeClass(event.status)} ms-2`}>
                                {event.status}
                            </span>
                        </div>
                        <div className={styles.eventDate}>
                            {formatEventDateTime(event.start_at)}
                        </div>
                        <div className={styles.eventStats}>
                            {event.registered_count}/{event.capacity} registered • {event.checked_in_count} checked in
                        </div>
                    </div>
                </div>

                <div className={styles.eventActions}>
                    {/* Actions removed - card is now just clickable */}
                </div>
            </div>

            {showCheckIn && (
                <CheckInModal
                    event={event}
                    onClose={() => setShowCheckIn(false)}
                />
            )}
        </>
    );
}
