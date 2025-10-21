import { useEffect, useState } from "react";
import RegisteredEventCard from "./RegisteredEventCard";
import { fetchRegisteredEvents, fetchOrganization } from "../util/api/events";
import EventInfoModal from "./EventInfoModal";
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

    // currently selected event that will be displayed on the event info modal
    const [selectedEvent, setSelectedEvent] = useState(undefined)
    
    useEffect(() => {
        // fetch events that a user is registered to
        if (!user?.id) {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        fetchRegisteredEvents(user.id).then(async (res) => {
            if(res.success) {
                // set events on fetch success
                setEvents(res.data);
                
                // Fetch organization data for all events
                const orgIds = [...new Set(res.data.map(event => event.organization_id).filter(Boolean))];
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
    }, [user]);

    useEffect(() => {
        const handler = (e) => {
            // when registration changes elsewhere, refetch
            if (!user?.id) return;
            fetchRegisteredEvents(user.id).then(async (res) => {
                if(res.success) {
                    setEvents(res.data);
                    
                    // Re-fetch org data
                    const orgIds = [...new Set(res.data.map(event => event.organization_id).filter(Boolean))];
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
            });
        };
        window.addEventListener('registration:changed', handler);
        return () => window.removeEventListener('registration:changed', handler);
    }, [user]);

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
        <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0,
                fontSize: '1.75rem',
                fontWeight: 700
            }}>
                My Registrations
            </h2>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                    onClick={() => setViewMode('list')}
                    style={{
                        padding: '0.5rem 1rem',
                        background: viewMode === 'list' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255, 255, 255, 0.05)',
                        border: viewMode === 'list' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => {
                        if (viewMode !== 'list') {
                            e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (viewMode !== 'list') {
                            e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                        }
                    }}
                >
                    <i className="bi bi-list-ul"></i>
                    List
                </button>
                <button
                    onClick={() => setViewMode('grid')}
                    style={{
                        padding: '0.5rem 1rem',
                        background: viewMode === 'grid' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255, 255, 255, 0.05)',
                        border: viewMode === 'grid' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                    onMouseEnter={(e) => {
                        if (viewMode !== 'grid') {
                            e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (viewMode !== 'grid') {
                            e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                        }
                    }}
                >
                    <i className="bi bi-grid-3x3-gap"></i>
                    Grid
                </button>
            </div>
        </div>

        {
        events.length > 0 ?
            viewMode === 'grid' ? (
                <div className="row g-4">
                {
                events.map(e =>
                    <div key={e.event_id} className="col-12 col-md-6 col-lg-4">
                        <RegisteredEventCard 
                            event={e}
                            organization={orgDataMap[e.organization_id]}
                            onView={(e) => setSelectedEvent(e)}
                            viewMode="grid"
                        />
                    </div>
                )
                }
                </div>
            ) : (
                <div className={styles.eventList}>
                {
                events.map(e =>
                    <RegisteredEventCard 
                        key={e.event_id}
                        event={e}
                        organization={orgDataMap[e.organization_id]}
                        onView={(e) => setSelectedEvent(e)}
                        viewMode="list"
                    />
                )
                }
                </div>
            )
        :
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
        }
        <EventInfoModal id="register-info-modal" event={selectedEvent} isRegistered={true} />
        </>
        
    );
}
