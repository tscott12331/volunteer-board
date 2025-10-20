import { useState } from 'react';
import styles from './OrgEventCard.module.css';
import { formatEventDateTime } from '../util/date';
import { updateEventStatus, deleteEvent } from '../util/api/organizations';
import CheckInModal from './CheckInModal';

/*
    * Card displaying an organization's event with action buttons
    * props:
        * event - Event object with details
        * onEdit - Callback when edit is clicked
        * onEventChanged - Callback when event is updated
        * onEventDeleted - Callback when event is deleted
*/
export default function OrgEventCard({ event, onEdit, onEventChanged, onEventDeleted }) {
    const [showCheckIn, setShowCheckIn] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

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

    const handlePublishToggle = async () => {
        setIsUpdating(true);
        const newStatus = event.status === 'published' ? 'draft' : 'published';
        const result = await updateEventStatus(event.id, newStatus);
        
        if (result.success) {
            onEventChanged();
        } else {
            alert('Failed to update event status: ' + result.message);
        }
        setIsUpdating(false);
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this event? This cannot be undone.')) {
            return;
        }

        setIsUpdating(true);
        const result = await deleteEvent(event.id);
        
        if (result.success) {
            onEventDeleted();
        } else {
            alert('Failed to delete event: ' + result.message);
        }
        setIsUpdating(false);
    };

    const handleDownloadCSV = async () => {
        // Export registrations as CSV
        const headers = ['Name', 'Email', 'Status', 'Registered At'];
        const csvContent = [
            headers.join(','),
            // For now, just add a placeholder - you can enhance this with actual data
            'Coming soon...'
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}_registrations.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    return (
        <>
            <div className={styles.eventCard}>
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
                    <button
                        className={styles.actionButton + ' ' + styles.editButton}
                        onClick={() => onEdit(event)}
                        disabled={isUpdating}
                        title="Edit"
                    >
                        <i className="bi bi-pencil"></i>
                    </button>
                    
                    <button
                        className={styles.actionButton + ' ' + (event.status === 'published' ? styles.unpublishButton : styles.publishButton)}
                        onClick={handlePublishToggle}
                        disabled={isUpdating}
                    >
                        {event.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>

                    <button
                        className={styles.actionButton + ' ' + styles.checkInButton}
                        onClick={() => setShowCheckIn(true)}
                        disabled={isUpdating}
                    >
                        Check-In
                    </button>

                    <button
                        className={styles.actionButton + ' ' + styles.downloadButton}
                        onClick={handleDownloadCSV}
                        disabled={isUpdating}
                        title="Download CSV"
                    >
                        <i className="bi bi-download"></i>
                    </button>

                    <button
                        className={styles.actionButton + ' ' + styles.deleteButton}
                        onClick={handleDelete}
                        disabled={isUpdating}
                        title="Delete"
                    >
                        <i className="bi bi-trash"></i>
                    </button>
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
