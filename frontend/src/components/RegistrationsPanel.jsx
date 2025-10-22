import { useEffect, useMemo, useState } from "react";
import { fetchRegisteredEvents, fetchOrganization, unregisterFromEvent, fetchEventById } from "../util/api/events";
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
                // Normalize events: ensure each event has an `id` property (fallbacks: event_id, eventId)
                const normalizedEvents = (res.data || []).map((ev) => ({
                    ...ev,
                    id: ev.id || ev.event_id || ev.eventId || null,
                }));

                // set events on fetch success (use normalized)
                setEvents(normalizedEvents);

                // Debug: log fetched registrations (normalized + per-event)
                console.log('[RegistrationsPanel] fetched registrations (normalized):', normalizedEvents);
                console.log('[RegistrationsPanel] registrations count:', normalizedEvents.length);
                normalizedEvents.forEach((ev, i) => {
                    console.log(`[RegistrationsPanel] normalized event[${i}] id=${ev.id}`, ev);
                    if (!ev?.id) {
                        console.warn(`[RegistrationsPanel] normalized event[${i}] is still missing id field`, ev);
                    }
                });

                // For registrations that don't contain organization/location info, fetch the full event record
                const mergedEvents = await Promise.all(normalizedEvents.map(async (reg) => {
                    // If registration already includes useful event info like location or organization, keep it
                    const hasLocation = !!(reg.location || reg.location_address || reg.venue || reg.address);
                    const hasOrg = !!(reg.organization || reg.organization_id || reg.org_id || reg.organization_name || reg.organization_logo);
                    if (hasLocation && hasOrg) return reg;

                    // otherwise try to fetch the event by id (use event_id or id)
                    const eventId = reg.id || reg.event_id || reg.eventId;
                    if (!eventId) return reg;

                    try {
                        const evRes = await fetchEventById(eventId);
                        if (evRes.success && evRes.data) {
                            // merge event record into registration object (prefer registration fields when present)
                            return { ...evRes.data, ...reg, id: evRes.data.id || reg.id };
                        }
                    } catch (err) {
                        console.error('Error fetching event details for', eventId, err);
                    }
                    return reg;
                }));

                // Use merged events going forward
                setEvents(mergedEvents);

                console.log('[RegistrationsPanel] mergedEvents:', mergedEvents);

                // Helper to normalize org id fields from event objects
                const getOrgIdFromEvent = (event) => {
                    return event.organization_id || event.org_id || event.organization?.id || event.orgId || null;
                };

                // Fetch organization data for all events (normalize ids)
                const orgIds = [...new Set(res.data.map(event => getOrgIdFromEvent(event)).filter(Boolean))];
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

                console.log('[RegistrationsPanel] orgMap:', orgMap);
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

    // Update selectedOrg when selectedEvent changes (support org_id or organization_id)
    useEffect(() => {
        if (selectedEvent) {
            const orgId = selectedEvent.organization_id || selectedEvent.org_id || selectedEvent.orgId;
            if (orgId) {
                const org = orgDataMap[orgId];
                setSelectedOrg(org || null);
                return;
            }
        }
        setSelectedOrg(null);
    }, [selectedEvent, orgDataMap]);

    const handleUnregister = async (eventId) => {
        if (!user?.id) return;
        
        try {
            await unregisterFromEvent(eventId, user.id);
            await loadRegistrations();
            if (selectedEvent?.id === eventId) {
                setSelectedEvent(undefined);
            }
            // Notify other components
            window.dispatchEvent(new CustomEvent('registration:changed', { detail: { eventId, action: 'unregistered' } }));
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

    // Helper to normalize org id fields from event objects (exposed to render)
    const getOrgIdFromEvent = (event) => {
        return event.organization_id || event.org_id || event.organization?.id || event.orgId || null;
    };

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
            </div>

            {events.length > 0 ? (
                viewMode === 'list' ? (
                    // Two-column layout matching Discover
                    <div className={"row mt-4 " + styles.eventsWrappers}>
                        <div className="col-md-4">
                            <div className={styles.eventList}>
                                {displayedEvents.map((e, idx) => {
                                    const org = orgDataMap[getOrgIdFromEvent(e)];
                                    const fallbackKey = `evt-${getOrgIdFromEvent(e) || 'noorg'}-${new Date(e.start_at).getTime()}-${idx}`;
                                    return (    
                                    <button
                                        key={e.id ?? fallbackKey}
                                        type="button"
                                        className={`${styles.eventListItem} ${selectedEvent === e ? styles.active : ''}`}
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
                                (() => {
                                    const start = new Date(selectedEvent.start_at);
                                    const end = selectedEvent.end_at ? new Date(selectedEvent.end_at) : null;
                                    const now = new Date();
                                    let status = 'Upcoming';
                                    if (end && now > end) status = 'Finished';
                                    else if (now >= start && (!end || now <= end)) status = 'Ongoing';

                                    return (
                                    <div className={`${styles.eventInfoCard} card p-3 shadow-sm EventInfo-container ${styles.detailCard} ${styles.stickyDetail}`}>
                                        {/* Event image (reserve space even if none) */}
                                        <div style={{ width: '100%', maxHeight: 320, height: 200, overflow: 'hidden', borderRadius: 8, background: selectedEvent.image_url ? 'transparent' : 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="mb-3">
                                            {selectedEvent.image_url ? (
                                                <img src={selectedEvent.image_url} alt={selectedEvent.title} className="img-fluid" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ color: '#9ca3af', fontWeight: 700 }}>{(selectedEvent.title || '?')[0]}</div>
                                            )}
                                        </div>

                                        {/* Title */}
                                        <h3 className="mb-1">{selectedEvent.title}</h3>

                                        {/* Org image + name with fallbacks */}
                                        {(() => {
                                            const orgName = selectedOrg?.name || selectedEvent.organization_name || selectedEvent.organization?.name || selectedEvent.org_name || 'Organization';
                                            const orgImage = selectedOrg?.logo_url || selectedOrg?.image_url || selectedEvent.organization_logo || selectedEvent.org_logo || selectedEvent.organization?.logo_url || null;
                                            return (
                                                <div className="d-flex align-items-center gap-2 mb-2">
                                                    {orgImage ? (
                                                        <img src={orgImage} alt={orgName} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} />
                                                    ) : (
                                                        <div style={{ width: 48, height: 48, borderRadius: 8, background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontWeight: 700 }}>
                                                            {orgName?.[0] || '?'}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="text-body-emphasis">{orgName}</div>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Description */}
                                        <p className="mb-2">{selectedEvent.description}</p>

                                        {/* Location */}
                                        <p className="mb-1"><strong>Location:</strong> {selectedEvent.location_address || (typeof selectedEvent.location === 'string' ? selectedEvent.location : (selectedEvent.location?.city || selectedEvent.location?.name || (selectedEvent.location?.lat ? `${selectedEvent.location?.lat}, ${selectedEvent.location?.lon}` : 'TBD')))}</p>

                                        {/* Date & time */}
                                        <p className="mb-1"><strong>Start:</strong> {formatDateAtTime(start)}</p>

                                        {/* Status & registration */}
                                        <p className="mb-1"><strong>Event status:</strong> {selectedEvent.status || status}</p>
                                        <p className="mb-1"><strong>Your registration:</strong> {selectedEvent.registration_status || (selectedEvent.is_registered ? 'registered' : 'not registered')}</p>

                                        {/* Capacity */}
                                        <p className="mb-1"><strong>Capacity:</strong> {selectedEvent.capacity}</p>

                                        <div className="d-flex gap-2 mt-3">
                                            <button 
                                                className="btn btn-danger" 
                                                onClick={() => handleUnregister(selectedEvent.id)}
                                            >
                                                Unregister
                                            </button>
                                        </div>
                                    </div>
                                    );
                                })()
                            ) : (
                                <p className="text-center text-muted">Select an event to see details</p>
                            )}
                        </div>
                    </div>
                ) : (
                    // Grid View
                    <div className="row g-3">
                        {displayedEvents.map((e, idx) => {
                            const orgData = orgDataMap[getOrgIdFromEvent(e)];
                            const fallbackKey = `evt-${getOrgIdFromEvent(e) || 'noorg'}-${new Date(e.start_at).getTime()}-${idx}`;
                            return (
                                <div key={e.id ?? fallbackKey} className="col-md-6 col-lg-4">
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
