import { useState, useEffect } from 'react';
import styles from './OrgEventsPanel.module.css';
import OrgEventCard from './OrgEventCard';
import CreateEventModal from './CreateEventModal';
import { fetchOrganizationEvents } from '../util/api/organizations';

/*
    * Panel displaying organization's events with create button
    * props:
        * organization
            * Organization object with id and details
*/
export default function OrgEventsPanel({ organization }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    useEffect(() => {
        loadEvents();
    }, [organization]);

    async function loadEvents() {
        if (!organization?.id) return;

        setLoading(true);
        const result = await fetchOrganizationEvents(organization.id);
        
        if (result.success) {
            setEvents(result.data);
        } else {
            console.error("Failed to load events:", result.message);
        }
        setLoading(false);
    }

    const handleCreateClick = () => {
        setEditingEvent(null);
        setShowCreateModal(true);
    };

    const handleEditClick = (event) => {
        setEditingEvent(event);
        setShowCreateModal(true);
    };

    const handleModalClose = () => {
        setShowCreateModal(false);
        setEditingEvent(null);
    };

    const handleEventSaved = () => {
        loadEvents();
        handleModalClose();
    };

    const handleEventDeleted = () => {
        loadEvents();
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={styles.eventsHeader}>
                <h2 className={styles.title}>My Events</h2>
                <button 
                    className="btn btn-primary"
                    onClick={handleCreateClick}
                >
                    <i className="bi bi-plus-lg me-2"></i>
                    Create Event
                </button>
            </div>

            <div className={styles.eventsContainer}>
                {events.length === 0 ? (
                    <div className="text-center py-5">
                        <p className="text-muted">No events yet. Create your first event!</p>
                    </div>
                ) : (
                    events.map(event => (
                        <OrgEventCard 
                            key={event.id} 
                            event={event}
                            onEdit={handleEditClick}
                            onEventChanged={loadEvents}
                            onEventDeleted={handleEventDeleted}
                        />
                    ))
                )}
            </div>

            {showCreateModal && (
                <CreateEventModal
                    organization={organization}
                    event={editingEvent}
                    onClose={handleModalClose}
                    onSave={handleEventSaved}
                />
            )}
        </>
    );
}
