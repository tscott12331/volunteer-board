import styles from './DiscoverPanel.module.css';

import { useEffect, useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import { fetchEvents, registerForEvent, fetchOrganization } from "../util/api/events";
import { DEFAULT_EVENT_IMAGE, SMALL_DEFAULT_EVENT_IMAGE, DEFAULT_EVENT_LOGO } from '../util/defaults';
import { formatDateAtTime } from '../util/date';

/*
    * Panel in the volunteer dashboard to view and register for available events
    * Users can filter by search, start date, and end date
    * props:
        * user?
            * Supabase Auth user object
            * Currently logged in user
*/
export default function DiscoverPanel({ user }) {
    // available events based on search and date filters
    const [events, setEvents] = useState([]);

    // filter states
    const [startDate, setStartDate] = useState(undefined);
    const [endDate, setEndDate] = useState(undefined);
    const [searchQuery, setSearchQuery] = useState(undefined);

    // search input state
    const  [searchValue, setSearchValue] = useState("");

    // view mode: 'list' or 'grid'
    const [viewMode, setViewMode] = useState('list');
    
    // pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5; // 5 events per page

    // the selected event will be displayed in the detail panel on the right
    const [selectedEvent, setSelectedEvent] = useState(undefined);
    const [selectedOrg, setSelectedOrg] = useState(undefined);
    // hash containing the ids of registered events
    const [registeredEvents, setRegisteredEvents] = useState({});
    const navigate = useNavigate();
    
    // Store organization data for grid view
    const [orgDataMap, setOrgDataMap] = useState({});

    // set date filter to proper date object when input is changed
    const onDateFilterChange = (e, setFilter) => {
        if(e.target.value.length > 0) {
            const split = e.target.value.split('-');
            const d = new Date(split[0], split[1] - 1, split[2]);
            setFilter(d);
        } else {
            setFilter(undefined);
        }
    }

    // update search input state value
    const onSearchInputChange = (e) => {
        setSearchValue(e.target.value);
    }

    // udpate search filter when user presses enter in the input
    const onSearchInputKeyDown = (e) => {
        if(e.key === "Enter") {
            search();
        }
    }

    // update search filter
    const search = () => {
        setSearchQuery(searchValue.length > 0 ? searchValue : undefined);
    }
    
    // Debounce search as you type (300ms)
    useEffect(() => {
        const t = setTimeout(() => {
            setSearchQuery(searchValue.length > 0 ? searchValue : undefined);
        }, 300);
        return () => clearTimeout(t);
    }, [searchValue]);

    const filterEventBySearch = (e, query) => {
        if(!query) return true;
        return e.title.toLowerCase().includes(query.toLowerCase());
    }
    

    const handleRegistration = async (id) => {
        const res = await registerForEvent(id);
        if(res.success) {
            setRegisteredEvents((re) => ({...re, [id]: true}));
            // notify other parts of the app (e.g., RegistrationsPanel) to refresh
            try {
                window.dispatchEvent(new CustomEvent('registration:changed', { detail: { eventId: id, action: 'registered' } }));
            } catch (e) {
                // ignore if window not available
            }
        }
        return res;
    }

    useEffect(() => {
        // fetch events based on a search query, start date, and end date
        fetchEvents(startDate, endDate, user?.id).then(res => {
            if(res.success) {
                // debug: log raw events to confirm `location` is returned
                console.log('DiscoverPanel fetched events:', res.data);
                // Filter out cancelled registrations and set events
                const filteredEvents = (res.data || []).map(event => {
                    // If registration is cancelled, treat as not registered
                    if (event.registration_status === 'cancelled') {
                        return { ...event, is_registered: false };
                    }
                    return event;
                });
                setEvents(filteredEvents);
                
                // Fetch organization data for all events
                filteredEvents.forEach(event => {
                    if (event.org_id && !orgDataMap[event.org_id]) {
                        fetchOrganization(event.org_id).then(orgRes => {
                            if (orgRes.success) {
                                setOrgDataMap(prev => ({
                                    ...prev,
                                    [event.org_id]: orgRes.data
                                }));
                            }
                        });
                    }
                });
            }
        })
    }, [user, startDate, endDate]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, startDate, endDate]);

    // Calculate filtered and paginated events
    const filteredEvents = events.filter(e => filterEventBySearch(e, searchQuery));
    const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

    // auto-select the first visible event when events or the search filter change
    useEffect(() => {
        if (paginatedEvents.length === 0) {
            setSelectedEvent(undefined);
            return;
        }
        // keep existing selection if it's still visible on current page, otherwise select the first one
        setSelectedEvent(prev => {
            if (prev && paginatedEvents.some(v => v.id === prev.id)) return prev;
            return paginatedEvents[0];
        });
    }, [events, searchQuery, currentPage]);

    useEffect(() => {
        if (!selectedEvent?.org_id) {
            setSelectedOrg(undefined);
            return;
        }
        fetchOrganization(selectedEvent.org_id).then(res => {
            if (res.success) setSelectedOrg(res.data);
            else setSelectedOrg(undefined);
        }).catch(() => setSelectedOrg(undefined));
    }, [selectedEvent?.org_id]);

    const hoursBetween = (startAt, endAt) => {
        try {
            const s = new Date(startAt);
            const e = new Date(endAt);
            const ms = Math.max(0, e - s);
            const hours = ms / (1000 * 60 * 60);
            return Math.round(hours * 100) / 100;
        } catch {
            return 0;
        }
    }

    return (
            <div className='DiscoverPanel-component'>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0 fw-bold text-white">Discover</h2>
                <div className={styles.splitPill}>
                    <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className={`${styles.pillBtn} ${viewMode === 'list' ? styles.pillBtnActive : ''}`}
                        title="List view"
                    >
                        <i className={`bi bi-list-ul ${styles.pillIcon}`} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('grid')}
                        className={`${styles.pillBtn} ${viewMode === 'grid' ? styles.pillBtnActive : ''}`}
                        title="Grid view"
                    >
                        <i className={`bi bi-grid-3x3-gap ${styles.pillIcon}`} />
                    </button>
                </div>
            </div>
            <div className="input-group mb-4" style={{ maxWidth: '800px' }}>
                <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Search for events"
                    aria-label="Text input with segmented dropdown filter button"
                    value={searchValue}
                    onChange={onSearchInputChange}
                    onKeyDown={onSearchInputKeyDown}
                />
                <button className="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <i className="bi bi-funnel me-2"></i>
                    Filter
                </button>
                <ul className="dropdown-menu">
                    <li>
                        <div className="dropdown-item d-flex gap-2 justify-content-between">
                            <label className="lh-lg text-body-emphasis" htmlFor="start-date">Start: </label>
                            <input 
                                id="start-date"
                                type="date" 
                                className="btn btn-outline-secondary" 
                                onChange={(e) => onDateFilterChange(e, setStartDate)}
                            />
                        </div>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                        <div className="dropdown-item d-flex gap-2 justify-content-between">
                            <label className="lh-lg text-body-emphasis" htmlFor="end-date">End: </label>
                            <input 
                                id="end-date"
                                type="date" 
                                className="btn btn-outline-secondary" 
                                onChange={(e) => onDateFilterChange(e, setEndDate)}
                            />
                        </div>
                    </li>
                </ul>
                <button type="button" className="btn btn-primary" onClick={search}>
                    <i className="bi bi-search me-2"></i>
                    Search
                </button>
            </div>
            {
            events.length > 0 ?
            viewMode === 'list' ? (
            <div className={"row mt-4 " + styles.eventsWrappers}>
                <div className="col-md-4">
                    <div className={styles.eventList}>
                        {paginatedEvents.map(e => {
                            const isRegistered = e.is_registered || registeredEvents[e.id];
                            return (
                            <button
                                key={e.id}
                                type="button"
                                className={`${styles.eventListItem} ${selectedEvent?.id === e.id ? styles.active : ''} ${isRegistered ? styles.registered : ''}`}
                                onClick={() => setSelectedEvent(e)}
                            >
                                <div className="d-flex w-100 justify-content-between align-items-start mb-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <h6 className="mb-0 fw-semibold">{e.title}</h6>
                                        {isRegistered && (
                                            <span className={styles.listRegisteredBadge}>
                                                <i className="bi bi-check-circle-fill"></i>
                                            </span>
                                        )}
                                    </div>
                                    <small className={styles.dateText}>{new Date(e.start_at).toLocaleDateString()}</small>
                                </div>
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <i className="bi bi-clock text-muted" style={{ fontSize: '0.875rem' }}></i>
                                    <small className="text-muted">{hoursBetween(e.start_at, e.end_at)} hrs</small>
                                </div>
                                {e.location && (
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="bi bi-geo-alt text-muted" style={{ fontSize: '0.875rem' }}></i>
                                        <small className="text-muted">{typeof e.location === 'string' ? e.location : e.location?.city}</small>
                                    </div>
                                )}
                            </button>
                        );
                        })}
                    </div>
                </div>
                <div className="col-md-8">
                    {selectedEvent ? (
                        <div className={"card p-3 shadow-sm " + styles.detailCard}>
                            <div className="d-flex gap-3 align-items-center mb-2">
                                {selectedOrg ? (
                                    <img src={selectedOrg.logo_url || selectedOrg.image_url || DEFAULT_EVENT_LOGO} alt={selectedOrg?.name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} />
                                ) : null}
                                <div className="flex-grow-1">
                                    <Link 
                                        className={"text-body-emphasis text-decoration-none link-offset-1 " + styles.orgName}
                                        to={`/org/${selectedOrg?.slug}`}
                                    >
                                    {selectedOrg?.name}
                                    </Link>
                                    <div className="d-flex align-items-center gap-2">
                                        <h4 className="mb-0">{selectedEvent.title}</h4>
                                        {(selectedEvent.is_registered || registeredEvents[selectedEvent.id]) && (
                                            <span className={styles.detailRegisteredBadge}>
                                                <i className="bi bi-check-circle-fill me-1"></i>
                                                Registered
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <p>{selectedEvent.description}</p>
                            <p className="mb-1"><strong>Location:</strong> {typeof selectedEvent.location === 'string' ? selectedEvent.location : (selectedEvent.location?.city || selectedEvent.location?.name || `${selectedEvent.location?.lat}, ${selectedEvent.location?.lon}`)}</p>
                            <p className="mb-1"><strong>Date & time:</strong> {new Date(selectedEvent.start_at).toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                            <p className="mb-1"><strong>Capacity:</strong> {selectedEvent.capacity}</p>
                            <div className="d-flex gap-2 mt-3">
                                {(selectedEvent.is_registered || registeredEvents[selectedEvent.id]) ? (
                                    <button className="btn btn-success" disabled>
                                        <i className="bi bi-check-circle me-2"></i>
                                        Registered
                                    </button>
                                ) : (
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={async () => {
                                            if (!user) {
                                                navigate('/signin');
                                                return;
                                            }
                                            await handleRegistration(selectedEvent.id);
                                        }}
                                    >
                                        Register
                                    </button>
                                )}
                                {selectedOrg?.slug && (
                                    <Link
                                        to={`/org/${selectedOrg.slug}`}
                                        className="btn btn-outline-secondary"
                                    >
                                        <i className="bi bi-building me-2"></i>
                                        View Organization
                                    </Link>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-muted">Select an event to see details</p>
                    )}
                </div>
            </div>
            ) : (
            // Grid View
            <div className="row g-3">
                {paginatedEvents.map(e => {
                    const orgData = orgDataMap[e.org_id];
                    const isRegistered = e.is_registered || registeredEvents[e.id];

                    return (
                        <div key={e.id} className="col-md-6 col-lg-4">
                            <div 
                                className={`${styles.eventCard} ${isRegistered ? styles.eventCardRegistered : ''}`}
                                onClick={() => setSelectedEvent(e)}
                            >
                                {/* Registered Badge Overlay */}
                                {isRegistered && (
                                    <div className={styles.registeredBadge}>
                                        <i className="bi bi-check-circle-fill me-1"></i>
                                        Registered
                                    </div>
                                )}
                                
                                <div className={styles.eventCardImage}>
                                    <img src={e.image_url || SMALL_DEFAULT_EVENT_IMAGE} alt={e.title} />
                                </div>
                                <div className={styles.eventCardBody}>
                                    {/* Organization */}
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        {orgData?.logo_url || orgData?.image_url ? (
                                            <img 
                                                src={orgData.logo_url || orgData.image_url} 
                                                alt={orgData?.name} 
                                                style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: '50%' }} 
                                            />
                                        ) : (
                                            <div style={{ 
                                                width: 32, 
                                                height: 32, 
                                                borderRadius: '50%', 
                                                background: 'rgba(102, 126, 234, 0.2)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                color: '#667eea'
                                            }}>
                                                {orgData?.name?.[0] || '?'}
                                            </div>
                                        )}
                                        <Link 
                                            to={`/org/${orgData?.slug}`}
                                            className={"text-muted text-decoration-none " + styles.eventCardOrgName}
                                        >
                                            <small>{orgData?.name || 'Loading...'}</small>
                                        </Link>
                                    </div>
                                    
                                    {/* Title */}
                                    <h5 className={styles.eventCardTitle}>{e.title}</h5>
                                    
                                    {/* Description */}
                                    <p className={styles.eventCardDescription}>
                                        {e.description?.substring(0, 100)}{e.description?.length > 100 ? '...' : ''}
                                    </p>
                                    
                                    {/* Location */}
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <i className="bi bi-geo-alt" style={{ fontSize: '0.875rem', color: '#667eea' }}></i>
                                        <small>{typeof e.location === 'string' ? e.location : (e.location?.city || 'Location TBD')}</small>
                                    </div>
                                    
                                    {/* Date & Time */}
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <i className="bi bi-calendar-event" style={{ fontSize: '0.875rem', color: '#667eea' }}></i>
                                        <small>{new Date(e.start_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</small>
                                    </div>
                                    
                                    {/* Capacity */}
                                    <div className="d-flex align-items-center gap-2 mb-3">
                                        <i className="bi bi-people" style={{ fontSize: '0.875rem', color: '#667eea' }}></i>
                                        <small>{e.capacity} spots</small>
                                    </div>
                                    
                                    {/* Register Button */}
                                    <button
                                        className={`${styles.registerButton} ${isRegistered ? styles.registered : ''}`}
                                        onClick={async (ev) => {
                                            ev.stopPropagation();
                                            if (isRegistered) return;
                                            
                                            const btn = ev.currentTarget;
                                            const originalHTML = btn.innerHTML;
                                            btn.disabled = true;
                                            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Registering...';
                                            
                                            try {
                                                if (!user) {
                                                    navigate('/signin');
                                                    btn.disabled = false;
                                                    btn.innerHTML = originalHTML;
                                                    return;
                                                }
                                                await handleRegistration(e.id);
                                            } catch (err) {
                                                console.error('Registration failed:', err);
                                                btn.disabled = false;
                                                btn.innerHTML = originalHTML;
                                            }
                                        }}
                                        disabled={isRegistered}
                                    >
                                        {isRegistered ? (
                                            <>
                                                <i className="bi bi-check-circle me-2"></i>
                                                Registered
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-calendar-plus me-2"></i>
                                                Register
                                            </>
                                        )}
                                    </button>
                                    {/* View Org CTA */}
                                    {orgData?.slug && (
                                        <Link
                                            to={`/org/${orgData.slug}`}
                                            className="btn btn-outline-secondary btn-sm mt-2"
                                            onClick={(ev) => ev.stopPropagation()}
                                            aria-label={`View organization ${orgData?.name ?? ''}`}
                                        >
                                            <i className="bi bi-building me-2"></i>
                                            View Organization
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            )
            :
            <p className="text-center mt-4 text-muted">No events available</p>
            }
            
            {/* Pagination Controls */}
            {filteredEvents.length > itemsPerPage && (
                <nav aria-label="Event pagination" className="mt-4">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="text-muted small">
                            Showing {startIndex + 1}-{Math.min(endIndex, filteredEvents.length)} of {filteredEvents.length} events
                        </div>
                        <ul className="pagination mb-0">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button 
                                    className="page-link" 
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    aria-label="Previous page"
                                >
                                    <i className="bi bi-chevron-left"></i>
                                </button>
                            </li>
                            
                            {/* Page numbers */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                                // Show first, last, current, and adjacent pages
                                if (
                                    pageNum === 1 ||
                                    pageNum === totalPages ||
                                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                ) {
                                    return (
                                        <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                            <button 
                                                className="page-link" 
                                                onClick={() => setCurrentPage(pageNum)}
                                            >
                                                {pageNum}
                                            </button>
                                        </li>
                                    );
                                } else if (
                                    pageNum === currentPage - 2 ||
                                    pageNum === currentPage + 2
                                ) {
                                    return <li key={pageNum} className="page-item disabled"><span className="page-link">...</span></li>;
                                }
                                return null;
                            })}
                            
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                <button 
                                    className="page-link" 
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    aria-label="Next page"
                                >
                                    <i className="bi bi-chevron-right"></i>
                                </button>
                            </li>
                        </ul>
                    </div>
                </nav>
            )}
        {/* <EventInfoModal 
            id="info-modal" 
            event={selectedEvent} 
            isNewlyRegistered={registeredEvents[selectedEvent?.id] ?? false}
            onRegister={handleRegistration}
        /> */}
        </div>
    );
}
