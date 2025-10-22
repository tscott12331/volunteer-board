import { useEffect, useMemo, useState } from "react";
import { fetchRegisteredEvents, fetchOrganization, unregisterFromEvent } from "../util/api/events";
import { formatDateAtTime } from '../util/date';
import styles from './RegistrationsPanel.module.css';

/*
    * Panel on the volunteer dashboard that displays the events a 
    * user is registered for
    * props:
        * user?
            * Supabase Auth user object
            * Currently logged in user
*/
export default function RegistrationsPanel({
    user,
}) {
    // events the user is registered to
    const [events, setEvents] = useState([]);
    const [orgDataMap, setOrgDataMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
    const [searchValue, setSearchValue] = useState("");
    const [searchQuery, setSearchQuery] = useState(undefined);
    // simplified view filter: 'upcoming' | 'all' | 'finished'
    const [viewFilter, setViewFilter] = useState('upcoming');

    // currently selected event that will be displayed in detail panel
    const [selectedEvent, setSelectedEvent] = useState(undefined);
    const [selectedOrg, setSelectedOrg] = useState(undefined)
    
    const loadRegistrations = async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        fetchRegisteredEvents(user.id).then(async (res) => {
            if(res.success) {
                // Filter out cancelled registrations
                const activeRegistrations = (res.data || []).filter(event => 
                    event.registration_status !== 'cancelled'
                );
                // set events on fetch success
                setEvents(activeRegistrations);
                
                // Fetch organization data for all events
                const orgIds = [...new Set(activeRegistrations.map(event => event.organization_id).filter(Boolean))];
                const orgMap = {};
                
                await Promise.all(
                    orgIds.map(async (orgId) => {
                        try {
                            const orgData = await fetchOrganization(orgId);
                            orgMap[orgId] = orgData;
                        } catch (error) {
                            console.error(`Error fetching organization ${orgId}:`, error);
                        }
                    })
                );
                
                setOrgDataMap(orgMap);
            }
            setLoading(false);
        })
    };

    useEffect(() => {
        loadRegistrations();
    }, [user]);

    useEffect(() => {
        const handler = () => {
            // when registration changes elsewhere, refetch
            loadRegistrations();
        };
        window.addEventListener('registration:changed', handler);
        return () => window.removeEventListener('registration:changed', handler);
    }, [user]);

    // Update selectedOrg when selectedEvent changes
    useEffect(() => {
        if (selectedEvent && selectedEvent.organization_id) {
            const org = orgDataMap[selectedEvent.organization_id];
            setSelectedOrg(org || null);
        } else {
            setSelectedOrg(null);
        }
    }, [selectedEvent, orgDataMap]);

    const handleUnregister = async (eventId) => {
        if (!user?.id) return;
        
        if (!confirm('Are you sure you want to unregister from this event?')) {
            return;
        }
        
        try {
            const res = await unregisterFromEvent(eventId, user.id);
            
            if (res.success) {
                await loadRegistrations();
                if (selectedEvent?.id === eventId) {
                    setSelectedEvent(undefined);
                }
                // Notify other components
                window.dispatchEvent(new CustomEvent('registration:changed', { detail: { eventId, action: 'unregistered' } }));
            } else {
                alert(res.error || 'Failed to unregister from event');
            }
        } catch (error) {
            console.error('Error unregistering:', error);
            alert('Failed to unregister from event');
        }
    };

    const filterEventBySearch = (e, query) => {
        if(!query) return true;
        return e.title.toLowerCase().includes(query.toLowerCase());
    };

    const search = () => {
        setSearchQuery(searchValue.length > 0 ? searchValue : undefined);
    };

    const onSearchInputChange = (e) => {
        setSearchValue(e.target.value);
    };

    const onSearchInputKeyDown = (e) => {
        if(e.key === "Enter") {
            search();
        }
    };

    // Debounce search as you type (300ms)
    useEffect(() => {
        const t = setTimeout(() => {
            setSearchQuery(searchValue.length > 0 ? searchValue : undefined);
        }, 300);
        return () => clearTimeout(t);
    }, [searchValue]);

    // Derived: filtered and sorted events (soonest first)
    const displayedEvents = useMemo(() => {
        const now = new Date();
        const arr = (events || []).filter(e => {
            if (searchQuery && !e.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            const d = new Date(e.start_at);
            if (viewFilter === 'upcoming' && d < now) return false;
            if (viewFilter === 'finished' && d >= now) return false;
            return true;
        });
        return arr.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
    }, [events, searchQuery, viewFilter]);

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
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                <div className="spinner-border" role="status" style={{ color: '#667eea' }}>
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p style={{ marginTop: '1rem' }}>Loading your registrations...</p>
            </div>
        );
    }

    return (
        <div className="RegistrationsPanel-component">
            <h2 className="mb-4 d-flex justify-content-between align-items-center" style={{ 
                color: '#fff',
                fontSize: '1.75rem',
                fontWeight: 700
            }}>
                My Registrations
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
            </h2>

            {/* Search Bar (combined input + icon button) */}
            <div className="mb-3" style={{ maxWidth: '720px' }}>
                <div className="input-group">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search for events"
                        value={searchValue}
                        onChange={onSearchInputChange}
                        onKeyDown={onSearchInputKeyDown}
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#fff',
                            // make the input flush with the appended button
                            borderRadius: '8px 0 0 8px'
                        }}
                    />
                    <button
                        className="btn btn-primary"
                        type="button"
                        onClick={search}
                        title="Search"
                        style={{ borderRadius: '0 8px 8px 0', padding: '0.45rem 0.7rem' }}
                    >
                        <i className="bi bi-search" />
                    </button>
                </div>
            </div>

            {/* Quick view filter: Upcoming / All / Finished */}
            <div className="d-flex gap-2 mb-3">
                <button
                    className={`btn ${viewFilter === 'upcoming' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setViewFilter('upcoming')}
                    style={{ padding: '0.4rem 0.8rem' }}
                >
                    Upcoming
                </button>
                <button
                    className={`btn ${viewFilter === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setViewFilter('all')}
                    style={{ padding: '0.4rem 0.8rem' }}
                >
                    All
                </button>
                <button
                    className={`btn ${viewFilter === 'finished' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setViewFilter('finished')}
                    style={{ padding: '0.4rem 0.8rem' }}
                >
                    Finished
                </button>
                <div className="ms-auto">
                    <small className="text-secondary">Sorted: Soonest first</small>
                </div>
            </div>

            {events.length > 0 ? (
                viewMode === 'list' ? (
                    // Two-column layout matching Discover
                    <div className={"row mt-4 " + styles.eventsWrappers}>
                        <div className="col-md-4">
                            <div className={styles.eventList}>
                                {events.filter(e => filterEventBySearch(e, searchQuery)).map(e => {
                                    const org = orgDataMap[e.organization_id];
                                    return (
                                    <button
                                        key={e.id}
                                        type="button"
                                        className={`${styles.eventListItem} ${selectedEvent?.id === e.id ? styles.active : ''}`}
                                        onClick={() => setSelectedEvent(e)}
                                    >
                                        <div className="d-flex w-100 gap-3 align-items-start">
                                            {/* Thumbnail */}
                                            <div style={{ width: 72, height: 72, flex: '0 0 72px', borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>
                                                {e.image_url ? (
                                                    <img src={e.image_url} alt={e.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : org?.logo_url || org?.image_url ? (
                                                    <img src={org.logo_url || org.image_url} alt={org?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(102,126,234,0.08)', color: '#667eea', fontWeight: 700 }}>
                                                        {org?.name?.[0] || e.title?.[0] || '?'}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-grow-1 text-start">
                                                <div className="d-flex w-100 justify-content-between align-items-start mb-1">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <h6 className="mb-0 fw-semibold">{e.title}</h6>
                                                    </div>
                                                </div>

                                                <div className="d-flex align-items-center gap-3" style={{ fontSize: '0.9rem' }}>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <i className="bi bi-clock text-muted" style={{ fontSize: '0.95rem' }}></i>
                                                        <small className="text-muted">{hoursBetween(e.start_at, e.end_at)} hrs</small>
                                                    </div>
                                                    <div className="ms-auto">
                                                        <small className={styles.dateText}>{new Date(e.start_at).toLocaleDateString()}</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                                })}
                            </div>
                        </div>
                        <div className="EventInfo-container col-md-8">
                            {selectedEvent ? (
                                <div className={"EventInfo-card card p-3 shadow-sm " + styles.detailCard + ' ' + styles.stickyDetail}>
                                    <div className="d-flex gap-3 align-items-center mb-2">
                                        {selectedOrg?.logo_url || selectedOrg?.image_url ? (
                                            <img src={selectedOrg.logo_url || selectedOrg.image_url} alt={selectedOrg?.name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} />
                                        ) : null}
                                        <div className="flex-grow-1">
                                            <div className="text-body-emphasis">{selectedOrg?.name}</div>
                                            <h4 className="mb-0">{selectedEvent.title}</h4>
                                        </div>
                                    </div>
                                    {selectedEvent.image_url && (
                                        <img src={selectedEvent.image_url} alt={selectedEvent.title} className="img-fluid mb-3" style={{ borderRadius: '8px' }} />
                                    )}
                                    <p>{selectedEvent.description}</p>
                                    <p className="mb-1"><strong>Location:</strong> {typeof selectedEvent.location === 'string' ? selectedEvent.location : (selectedEvent.location?.city || selectedEvent.location?.name || `${selectedEvent.location?.lat}, ${selectedEvent.location?.lon}`)}</p>
                                    <p className="mb-1"><strong>Date & time:</strong> {formatDateAtTime(new Date(selectedEvent.start_at))}</p>
                                    <p className="mb-1"><strong>Capacity:</strong> {selectedEvent.capacity}</p>
                                    <div className="d-flex gap-2 mt-3">
                                        <button 
                                            className="btn btn-danger" 
                                            onClick={() => handleUnregister(selectedEvent.id)}
                                        >
                                            Unregister
                                        </button>
                                        {selectedOrg?.slug && (
                                            <a
                                                href={`/org/${selectedOrg.slug}`}
                                                className="btn btn-outline-secondary"
                                            >
                                                <i className="bi bi-building me-2"></i>
                                                View Organization
                                            </a>
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
                        {events.filter(e => filterEventBySearch(e, searchQuery)).map(e => {
                            const orgData = orgDataMap[e.organization_id];
                            return (
                                <div key={e.id} className="col-md-6 col-lg-4">
                                    <div 
                                        className={styles.eventCard}
                                        onClick={() => setSelectedEvent(e)}
                                    >
                                        {e.image_url && (
                                            <div className={styles.eventCardImage}>
                                                <img src={e.image_url} alt={e.title} />
                                            </div>
                                        )}
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
                                                <small className="text-muted">{orgData?.name || 'Loading...'}</small>
                                            </div>
                                            
                                            <h5 className={styles.eventCardTitle}>{e.title}</h5>
                                            
                                            <p className={styles.eventCardDescription}>
                                                {e.description?.substring(0, 100)}{e.description?.length > 100 ? '...' : ''}
                                            </p>
                                            
                                            <div style={{ 
                                                display: 'flex', 
                                                flexDirection: 'column', 
                                                gap: '0.5rem',
                                                marginTop: 'auto',
                                                paddingTop: '1rem',
                                                borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                                            }}>
                                                <div className="d-flex align-items-center gap-2">
                                                    <i className="bi bi-calendar-event" style={{ fontSize: '0.875rem', color: '#667eea' }}></i>
                                                    <small>{new Date(e.start_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</small>
                                                </div>
                                                
                                                <div className="d-flex align-items-center gap-2">
                                                    <i className="bi bi-people" style={{ fontSize: '0.875rem', color: '#667eea' }}></i>
                                                    <small>{e.capacity} spots</small>
                                                </div>
                                                
                                                {/* Buttons */}
                                                <div className="d-flex gap-2 mt-2">
                                                    <button
                                                        className="btn btn-primary btn-sm flex-fill"
                                                        onClick={(ev) => {
                                                            ev.stopPropagation();
                                                            setSelectedEvent(e);
                                                        }}
                                                        style={{
                                                            background: '#007bff',
                                                            border: 'none'
                                                        }}
                                                    >
                                                        View Details
                                                    </button>
                                                    <button
                                                        className="btn btn-danger btn-sm flex-fill"
                                                        onClick={(ev) => {
                                                            ev.stopPropagation();
                                                            handleUnregister(e.id);
                                                        }}
                                                    >
                                                        Unregister
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            ) : (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '3rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px'
                }}>
                    <i className="bi bi-calendar-x" style={{ fontSize: '3rem', color: '#667eea', marginBottom: '1rem' }}></i>
                    <p style={{ color: '#9ca3af', fontSize: '1.125rem', marginBottom: '0.5rem' }}>You haven't registered for any events yet.</p>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>Discover events and start making a difference!</p>
                </div>
            )}
        </div>
    );
}
