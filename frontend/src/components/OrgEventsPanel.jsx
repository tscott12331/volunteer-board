import { useEffect, useMemo, useState } from 'react';
import styles from './OrgEventsPanel.module.css';
import OrgEventCard from './OrgEventCard';
import OrgEventDetailPanel from './OrgEventDetailPanel';
import { fetchOrganizationEvents } from '../util/api/organizations';

/*
    * Panel displaying organization's events with two-column layout, filters, and detail panel
    * props:
        * organization
            * Organization object with id and details
*/
export default function OrgEventsPanel({ organization }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Selection / editor
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [mode, setMode] = useState('view'); // 'view' | 'edit' | 'create'

    // Filters/Search/Sort
    const [searchValue, setSearchValue] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState(''); // draft/published/completed/cancelled
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        loadEvents();
    }, [organization]);

    async function loadEvents() {
        if (!organization?.id) return;
        setLoading(true);
        const result = await fetchOrganizationEvents(organization.id);
        let list = [];
        if (result.success) {
            list = Array.isArray(result.data) ? result.data : [];
            setEvents(list);
        } else {
            console.error('Failed to load events:', result.message);
        }
        setLoading(false);
        return list;
    }

    // Debounce search input
    useEffect(() => {
        const t = setTimeout(() => setSearchQuery(searchValue.trim().toLowerCase()), 300);
        return () => clearTimeout(t);
    }, [searchValue]);

    const filteredSortedEvents = useMemo(() => {
        let list = Array.isArray(events) ? [...events] : [];
        if (searchQuery) {
            list = list.filter(e =>
                (e.title || '').toLowerCase().includes(searchQuery) ||
                (e.summary || '').toLowerCase().includes(searchQuery) ||
                (e.description || '').toLowerCase().includes(searchQuery)
            );
        }
        if (statusFilter) {
            list = list.filter(e => e.status === statusFilter);
        }
        if (startDate) {
            const sd = new Date(startDate);
            list = list.filter(e => new Date(e.start_at) >= sd);
        }
        if (endDate) {
            const ed = new Date(endDate);
            list = list.filter(e => new Date(e.start_at) <= ed);
        }
        // Soonest first
        list.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
        return list;
    }, [events, searchQuery, statusFilter, startDate, endDate]);

    const handleCreateClick = () => {
        setSelectedEvent(null);
        setMode('create');
    };

    const handleEditClick = (event) => {
        setSelectedEvent(event);
        setMode('edit');
    };

    const handleCardSelect = (event) => {
        // Only select if in view mode or if different event
        if (selectedEvent?.id !== event.id) {
            setSelectedEvent(event);
            setMode('view');
        }
    };

    const handleClearSelection = () => {
        setSelectedEvent(null);
        setMode('view');
    };

    const handleSaved = async (savedEventId) => {
        const fresh = await loadEvents();
        // After save, stay in view mode and try to select the saved event from freshly loaded list
        setMode('view');
        if (savedEventId) {
            const saved = fresh.find(e => e.id === savedEventId);
            if (saved) setSelectedEvent(saved);
        }
    };

    const handleDeleted = async () => {
        await loadEvents();
        handleClearSelection();
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
                <div className={styles.controlsRow}>
                    <button className="btn btn-primary" onClick={handleCreateClick} aria-label="Create new event">
                        <i className="bi bi-plus-lg me-2"></i>
                        Create Event
                    </button>
                </div>
            </div>

            <div className={styles.filtersRow}>
                <input
                    type="text"
                    className="form-control"
                    style={{ maxWidth: 260 }}
                    placeholder="Search events..."
                    aria-label="Search events"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                />
                <select
                    className="form-select"
                    style={{ maxWidth: 180 }}
                    aria-label="Filter by status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="completed">Completed</option>
                </select>
                <input
                    type="date"
                    className="form-control"
                    aria-label="Start date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
                <input
                    type="date"
                    className="form-control"
                    aria-label="End date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
                <button className="btn btn-outline-secondary" onClick={() => { setSearchValue(''); setSearchQuery(''); setStatusFilter(''); setStartDate(''); setEndDate(''); }}>Clear</button>
            </div>

            <div className={styles.eventsContainer}>
                <div className={styles.listCol} role="list" aria-label="Events list">
                    {filteredSortedEvents.length === 0 ? (
                        <div className="text-muted py-4">No events found. Adjust filters or create a new one.</div>
                    ) : (
                        filteredSortedEvents.map(event => (
                            <div key={event.id} role="listitem">
                                <OrgEventCard
                                    event={event}
                                    onEventChanged={loadEvents}
                                    onEventDeleted={handleDeleted}
                                    onSelect={() => handleCardSelect(event)}
                                />
                            </div>
                        ))
                    )}
                </div>
                <div className={styles.detailCol}>
                    <OrgEventDetailPanel
                        organization={organization}
                        event={selectedEvent}
                        mode={mode}
                        onClose={handleClearSelection}
                        onSaved={handleSaved}
                        onDeleted={handleDeleted}
                        onEdit={() => selectedEvent && handleEditClick(selectedEvent)}
                    />
                </div>
            </div>
        </>
    );
}
