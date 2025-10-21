import { useEffect, useMemo, useRef, useState } from 'react';
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
    const [statusFilter, setStatusFilter] = useState(''); // draft/published
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [openOnly, setOpenOnly] = useState(false);
    const [dateChip, setDateChip] = useState(''); // '', 'today', 'this_week', 'weekend', 'upcoming'
    const searchInputRef = useRef(null);

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

    // Keyboard shortcut to focus search with '/'
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

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
        if (openOnly) {
            list = list.filter(e => (e.capacity == null) || (e.registered_count < e.capacity));
        }
        // Soonest first
        list.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
        return list;
    }, [events, searchQuery, statusFilter, startDate, endDate, openOnly]);

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

    // Quick chip helpers
    const toDateStr = (d) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const setToday = () => {
        const now = new Date();
        const ds = toDateStr(now);
        setStartDate(ds);
        setEndDate(ds);
        setStatusFilter('published');
        setDateChip('today');
    };

    const setThisWeek = () => {
        const now = new Date();
        const day = now.getDay(); // 0 Sun .. 6 Sat
        const mondayOffset = (day === 0 ? -6 : 1 - day); // Monday start
        const monday = new Date(now);
        monday.setDate(now.getDate() + mondayOffset);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        setStartDate(toDateStr(monday));
        setEndDate(toDateStr(sunday));
        setStatusFilter('published');
        setDateChip('this_week');
    };

    const setWeekend = () => {
        const now = new Date();
        const day = now.getDay(); // 0 Sun .. 6 Sat
        const nextSatOffset = (6 - day + 7) % 7; // days until next Saturday (0 if Sat)
        const sat = new Date(now);
        sat.setDate(now.getDate() + nextSatOffset);
        const sun = new Date(sat);
        sun.setDate(sat.getDate() + 1);
        setStartDate(toDateStr(sat));
        setEndDate(toDateStr(sun));
        setStatusFilter('published');
        setDateChip('weekend');
    };

    const setUpcoming = () => {
        const now = new Date();
        const ds = toDateStr(now);
        setStartDate(ds);
        setEndDate('');
        setStatusFilter('published');
        setDateChip('upcoming');
    };

    const toggleStatusChip = (value) => {
        setStatusFilter(prev => prev === value ? '' : value);
    };

    const toggleOpenOnly = () => setOpenOnly(v => !v);

    const clearAllFilters = () => {
        setSearchValue('');
        setSearchQuery('');
        setStatusFilter('');
        setStartDate('');
        setEndDate('');
        setOpenOnly(false);
        setDateChip('');
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

            <div className={styles.quickChips}>
                <button type="button" className={`btn btn-sm ${dateChip === 'today' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={setToday}>
                    <i className="bi bi-calendar-day me-1"/> Today
                </button>
                <button type="button" className={`btn btn-sm ${dateChip === 'this_week' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={setThisWeek}>
                    <i className="bi bi-calendar-week me-1"/> This Week
                </button>
                <button type="button" className={`btn btn-sm ${dateChip === 'weekend' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={setWeekend}>
                    <i className="bi bi-calendar2-weekend me-1"/> Weekend
                </button>
                <button type="button" className={`btn btn-sm ${dateChip === 'upcoming' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={setUpcoming}>
                    <i className="bi bi-clock-history me-1"/> Upcoming
                </button>
                <div className="vr mx-1 d-none d-md-block" />
                <button type="button" className={`btn btn-sm ${statusFilter === 'published' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => toggleStatusChip('published')}>
                    <i className="bi bi-check2-circle me-1"/> Published
                </button>
                <button type="button" className={`btn btn-sm ${statusFilter === 'draft' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => toggleStatusChip('draft')}>
                    <i className="bi bi-pencil-square me-1"/> Drafts
                </button>
                <button type="button" className={`btn btn-sm ${openOnly ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={toggleOpenOnly}>
                    <i className="bi bi-person-plus me-1"/> Open Spots
                </button>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={clearAllFilters}>
                    <i className="bi bi-x-circle me-1"/> Reset
                </button>
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
                    ref={searchInputRef}
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
                </select>
                <input
                    type="date"
                    className="form-control"
                    aria-label="Start date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setDateChip(''); }}
                />
                <input
                    type="date"
                    className="form-control"
                    aria-label="End date"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setDateChip(''); }}
                />
                <div className="text-muted small ms-auto d-none d-md-block">{filteredSortedEvents.length} results</div>
                <button className="btn btn-outline-secondary" onClick={clearAllFilters}>Clear</button>
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
