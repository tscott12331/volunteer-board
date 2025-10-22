import { useEffect, useState } from 'react';
import styles from './OrgPage.module.css';
import { fetchOrganizationBySlug, fetchOrganizationEventsBySlug, followOrganization, unfollowOrganization } from '../util/api/organizations';

import { registerForEvent, unregisterFromEvent } from '../util/api/events';
import { useParams } from 'react-router';
import { supabase } from '../util/api/supabaseClient';

export default function OrgPage() {
    const { slug } = useParams();

    const [newlyFollowed, setNewlyFollowed] = useState(false);
    const [newlyUnfollowed, setNewlyUnfollowed] = useState(false);

    const [sessionUserId, setSessionUserId] = useState(undefined);

    const [org, setOrg] = useState({});
    const [orgEvents, setOrgEvents] = useState([]);
    const [registeringId, setRegisteringId] = useState(null);

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

    const handleFollow = async (id) => {
        // not implemented
        const res = await followOrganization(id);
        if(res.success) {
            setNewlyFollowed(!org.is_following);
        }
        setNewlyUnfollowed(false);
    }

    const handleUnfollow = async (id) => {
        // not implemented
        const res = await unfollowOrganization(id);
        if(res.success) {
            if(org.is_following) {
                setNewlyUnfollowed(true);
            }

            setNewlyFollowed(false);
        }
    }

    const handleRegister = async (eventId) => {
        if (!sessionUserId) {
            window.location.href = '/signin';
            return;
        }
        try {
            setRegisteringId(eventId);
            const res = await registerForEvent(eventId);
            if (res.success) {
                setOrgEvents(prev => prev.map(e => e.id === eventId ? { ...e, is_registered: true, capacity: (e.capacity ?? 0) - 1 } : e));
                try { window.dispatchEvent(new CustomEvent('registration:changed', { detail: { eventId, action: 'registered' } })); } catch {}
            } else {
                alert(res.error || 'Failed to register');
            }
        } finally {
            setRegisteringId(null);
        }
    };

    const handleUnregisterEvent = async (eventId) => {
        if (!sessionUserId) return;
        if (!confirm('Unregister from this event?')) return;
        try {
            setRegisteringId(eventId);
            const res = await unregisterFromEvent(eventId, sessionUserId);
            if (res.success) {
                setOrgEvents(prev => prev.map(e => e.id === eventId ? { ...e, is_registered: false, capacity: (e.capacity ?? 0) + 1 } : e));
                try { window.dispatchEvent(new CustomEvent('registration:changed', { detail: { eventId, action: 'unregistered' } })); } catch {}
            } else {
                alert(res.error || 'Failed to unregister');
            }
        } finally {
            setRegisteringId(null);
        }
    };


    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            const userId = session?.user?.id ?? null;
            setSessionUserId(userId);

            fetchOrganizationBySlug(slug, userId).then(res => {
                if(res.success) {
                    setOrg(res.data);
                }
            })
        });

        fetchOrganizationEventsBySlug(slug).then(res => {
            if(res.success) {
                // Filter out cancelled registrations when displaying events
                const filteredEvents = (res.data || []).map(event => {
                    // If registration is cancelled, treat as not registered
                    if (event.registration_status === 'cancelled') {
                        return { ...event, is_registered: false, registration_status: null };
                    }
                    return event;
                });
                setOrgEvents(filteredEvents);
            }
        })
    }, []);

    // TABLE(id uuid, org_id uuid, title text, description text, start_at timestamp with time zone, end_at timestamp with time zone, status event_status, capacity integer, image_url text, created_at timestamp with time zone, updated_at timestamp with time zone, location jsonb, location_street text, location_city text, location_state text, location_zip text, location_address text, is_registered boolean, registration_id uuid, registered_at timestamp with time zone, registration_status text)

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className="d-flex flex-column align-items-center text-center">
                        <div className={styles.logoWrapper}>
                            <img src={org.logo_url || '/placeholder.svg'} alt={`${org.name || 'Org'} logo`} className={styles.pfp} />
                        </div>
                        <h2 className={styles.orgName}>{org.name}</h2>
                        <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
                            <span className="badge rounded-pill text-bg-secondary">
                                <i className="bi bi-people me-1"></i>
                                {org.follower_count + (newlyFollowed ? 1 : newlyUnfollowed ? -1 : 0)} followers
                            </span>
                            {org.website_url && (
                                <a href={org.website_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline-light btn-sm">
                                    <i className="bi bi-globe me-2"></i>
                                    Website
                                </a>
                            )}
                            {sessionUserId && (
                                (org.is_following || newlyFollowed) && !newlyUnfollowed ? (
                                    <button className="btn btn-danger btn-sm" onClick={() => handleUnfollow(org.id)}>
                                        Unfollow
                                    </button>
                                ) : (
                                    <button className="btn btn-primary btn-sm" onClick={() => handleFollow(org.id)}>
                                        Follow
                                    </button>
                                )
                            )}
                        </div>
                        {org.description ? (
                            <p className="text-muted mt-2" style={{ maxWidth: 680 }}>{org.description}</p>
                        ) : (
                            <p className="text-muted fst-italic mt-2">No bio provided yet.</p>
                        )}
                    </div>
                </div>
                <div className={styles.body}>
                    <div className={styles.viewSection}>
                        <h3 className={styles.viewSectionTitle}>Events</h3>
                        {orgEvents.length === 0 ? (
                            <div className={"text-center " + styles.emptyState}>
                                <i className="bi bi-calendar-x" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
                                <p className={styles.notSet}>No events yet.</p>
                            </div>
                        ) : (
                            <div className="row g-3">
                                {orgEvents.map(e => {
                                    const isRegistered = !!e.is_registered;
                                    const isOpen = e.status === 'published' && (e.capacity ?? 0) > 0;
                                    return (
                                        <div className="col-md-6 col-lg-4" key={e.id}>
                                            <div className="card h-100 bg-transparent border-light-subtle">
                                                {e.image_url && (
                                                    <img src={e.image_url} className="card-img-top" alt={e.title} style={{ height: 160, objectFit: 'cover' }} />
                                                )}
                                                <div className="card-body d-flex flex-column">
                                                    <div className="d-flex align-items-start justify-content-between mb-2">
                                                        <h5 className="card-title mb-0">{e.title}</h5>
                                                        <span className={`badge text-bg-${e.status === 'published' ? 'success' : e.status === 'cancelled' ? 'danger' : 'secondary'}`}>{e.status}</span>
                                                    </div>
                                                    <p className="card-text text-muted" style={{ minHeight: '3rem' }}>{e.description?.slice(0, 100)}{e.description?.length > 100 ? '…' : ''}</p>
                                                    <div className="d-flex align-items-center gap-2 mb-2">
                                                        <i className="bi bi-calendar-event" style={{ color: '#667eea' }}></i>
                                                        <small>{new Date(e.start_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</small>
                                                    </div>
                                                    <div className="d-flex align-items-center gap-2 mb-3">
                                                        <i className="bi bi-people" style={{ color: '#667eea' }}></i>
                                                        <small>{e.capacity} spots</small>
                                                    </div>
                                                    <div className="mt-auto d-flex gap-2">
                                                        <a href={`/event/${e.id}`} className="btn btn-outline-secondary btn-sm flex-fill">Details</a>
                                                        {isRegistered ? (
                                                            <button
                                                                className="btn btn-outline-danger btn-sm flex-fill"
                                                                disabled={registeringId === e.id}
                                                                onClick={() => handleUnregisterEvent(e.id)}
                                                            >
                                                                {registeringId === e.id ? 'Unregistering…' : 'Unregister'}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="btn btn-primary btn-sm flex-fill"
                                                                disabled={!isOpen || registeringId === e.id}
                                                                onClick={() => handleRegister(e.id)}
                                                            >
                                                                {registeringId === e.id ? 'Registering…' : isOpen ? 'Register' : 'Full'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
