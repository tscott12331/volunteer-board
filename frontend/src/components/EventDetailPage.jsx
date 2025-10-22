import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../util/api/supabaseClient';
import { registerForEvent, unregisterFromEvent, fetchOrganization } from '../util/api/events';
import { formatDateAtTime } from '../util/date';
import styles from './EventDetailPage.module.css';

export default function EventDetailPage({ user }) {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [org, setOrg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!eventId) return;
        
        const fetchEvent = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch event with registration status
                const { data, error: eventError } = await supabase
                    .from('events')
                    .select('*')
                    .eq('id', eventId)
                    .single();

                if (eventError) throw eventError;

                // Check if user is registered
                if (user) {
                    const { data: regData } = await supabase
                        .from('event_registrations')
                        .select('id')
                        .eq('event_id', eventId)
                        .eq('user_id', user.id)
                        .maybeSingle();
                    
                    data.is_registered = !!regData;
                }

                setEvent(data);

                // Fetch organization details
                if (data.org_id) {
                    const orgRes = await fetchOrganization(data.org_id);
                    if (orgRes.success) {
                        setOrg(orgRes.data);
                    }
                }
            } catch (err) {
                console.error('Error fetching event:', err);
                setError('Failed to load event details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [eventId, user]);

    const handleRegister = async () => {
        if (!user) {
            navigate('/signin');
            return;
        }

        try {
            setRegistering(true);
            setError(null);
            
            const res = await registerForEvent(event.id);
            
            if (res.success) {
                setEvent(prev => ({ ...prev, is_registered: true, capacity: prev.capacity - 1 }));
                setShowConfirmation(true);
                // Hide confirmation after 5 seconds
                setTimeout(() => setShowConfirmation(false), 5000);
            } else {
                setError(res.error || 'Failed to register for event');
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setRegistering(false);
        }
    };

    const handleUnregister = async () => {
        if (!user) return;

        if (!confirm('Are you sure you want to unregister from this event?')) {
            return;
        }

        try {
            setRegistering(true);
            setError(null);
            
            const res = await unregisterFromEvent(event.id, user.id);
            
            if (res.success) {
                setEvent(prev => ({ ...prev, is_registered: false, capacity: prev.capacity + 1 }));
            } else {
                setError(res.error || 'Failed to unregister from event');
            }
        } catch (err) {
            console.error('Unregister error:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setRegistering(false);
        }
    };

    if (loading) {
        return (
            <div className="container mt-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error && !event) {
        return (
            <div className="container mt-5">
                <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                </div>
                <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
                    <i className="bi bi-arrow-left me-2"></i>
                    Go Back
                </button>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="container mt-5">
                <div className="alert alert-warning" role="alert">
                    Event not found
                </div>
                <button className="btn btn-outline-secondary" onClick={() => navigate('/')}>
                    <i className="bi bi-house me-2"></i>
                    Go to Home
                </button>
            </div>
        );
    }

    const safeFormatDate = (value) => {
        if (!value) return 'TBD';
        const d = new Date(value);
        if (isNaN(d.getTime())) return 'TBD';
        try {
            return formatDateAtTime(d);
        } catch {
            // Fallback formatting if locale API throws
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const yy = String(d.getFullYear()).slice(-2);
            const h = d.getHours();
            const m = String(d.getMinutes()).padStart(2, '0');
            return `${mm}/${dd}/${yy} at ${((h % 12) || 12)}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
        }
    };

    const isRegistered = !!event.is_registered;
    const hasCapacity = Number(event.capacity ?? 0) > 0;

    return (
        <div className={styles.pageWrapper}>
            <div className="container py-4">
                {/* Back button */}
                <button className="btn btn-link text-decoration-none mb-3 ps-0" onClick={() => navigate(-1)}>
                    <i className="bi bi-arrow-left me-2"></i>
                    Back
                </button>

                {/* Hero banner */}
                {event && (
                    <div 
                        className={styles.hero}
                        style={{ backgroundImage: event.image_url ? `url(${event.image_url})` : 'none' }}
                        aria-label="Event banner"
                    >
                        <div className={styles.heroOverlay} />
                        <div className={styles.heroContent}>
                            <h1 className={styles.heroTitle}>{event.title}</h1>
                            <div className={styles.heroFooter}>
                                <div className={styles.chips}>
                                    <span className={styles.chip}>
                                        <i className="bi bi-calendar-event me-1" />
                                        {safeFormatDate(event.start_at)}
                                    </span>
                                    {event.location && (
                                        <span className={styles.chip}>
                                            <i className="bi bi-geo-alt me-1" />
                                            {typeof event.location === 'string' ? event.location : (event.location?.city || event.location?.name || `${event.location?.lat ?? ''}${event.location?.lon ? ", " + event.location.lon : ''}`)}
                                        </span>
                                    )}
                                    {org && (
                                        <span className={`${styles.chip} ${styles.hostChip}`}>
                                            {org.logo_url ? (
                                                <img src={org.logo_url} alt={`${org.name} logo`} className={styles.hostAvatar} />
                                            ) : (
                                                <i className="bi bi-building me-1" />
                                            )}
                                            <span className={styles.hostLabel}>{org.name}</span>
                                        </span>
                                    )}
                                </div>

                                {/* Hero CTA */}
                                {user && (
                                    <div className={styles.heroButtons}>
                                        {isRegistered ? (
                                            <button 
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={handleUnregister}
                                                disabled={registering}
                                            >
                                                {registering ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                        Canceling...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bi bi-x-circle me-2"></i>
                                                        Cancel Registration
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <button 
                                                className="btn btn-primary btn-sm"
                                                onClick={handleRegister}
                                                disabled={registering || !hasCapacity}
                                            >
                                                {registering ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                        Registering...
                                                    </>
                                                ) : !hasCapacity ? (
                                                    <>
                                                        <i className="bi bi-x-circle me-2"></i>
                                                        Event Full
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bi bi-calendar-plus me-2"></i>
                                                        Register for Event
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="row">
                    {/* Main Content */}
                    <div className="col-lg-8">
                        <div className="card shadow-sm">
                            <div className="card-body">
                                {/* Title moved to hero */}
                                
                                {/* Registration confirmation */}
                                {showConfirmation && (
                                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                                        <i className="bi bi-check-circle me-2"></i>
                                        You're registered for this event!
                                        <button 
                                            type="button" 
                                            className="btn-close" 
                                            onClick={() => setShowConfirmation(false)}
                                            aria-label="Close"
                                        ></button>
                                    </div>
                                )}

                                {/* Error message */}
                                {error && (
                                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                        <i className="bi bi-exclamation-triangle me-2"></i>
                                        {error}
                                        <button 
                                            type="button" 
                                            className="btn-close" 
                                            onClick={() => setError(null)}
                                            aria-label="Close"
                                        ></button>
                                    </div>
                                )}

                                {/* Event Details */}
                                <div className="mb-4">
                                    <h5 className="mb-3">About this event</h5>
                                    {event.description ? (
                                        <p className="text-muted">{event.description}</p>
                                    ) : (
                                        <p className="text-muted fst-italic">No description provided</p>
                                    )}
                                </div>

                                {/* Event Info */}
                                <div className="mb-4">
                                    <h5 className="mb-3">Event Details</h5>
                                    <ul className={`list-unstyled ${styles.detailsList}`}>
                                        <li className="mb-2">
                                            <i className="bi bi-calendar-event text-primary me-2"></i>
                                            <strong>Starts:</strong> {safeFormatDate(event.start_at)}
                                        </li>
                                        <li className="mb-2">
                                            <i className="bi bi-calendar-check text-primary me-2"></i>
                                            <strong>Ends:</strong> {safeFormatDate(event.end_at)}
                                        </li>
                                        <li className="mb-2">
                                            <i className="bi bi-people text-primary me-2"></i>
                                            <strong>Spots remaining:</strong> {event.capacity}
                                        </li>
                                        {event.location && (
                                            <li className="mb-2">
                                                <i className="bi bi-geo-alt text-primary me-2"></i>
                                                <strong>Location:</strong> {typeof event.location === 'string' ? event.location : (event.location?.city || event.location?.name || `${event.location?.lat ?? ''}${event.location?.lon ? ", " + event.location.lon : ''}`)}
                                            </li>
                                        )}
                                    </ul>
                                </div>

                                {/* Registration Button */}
                                {user && (
                                    <div className="d-grid gap-2">
                                        {isRegistered ? (
                                            <>
                                                <div className="alert alert-info mb-3">
                                                    <i className="bi bi-check-circle me-2"></i>
                                                    You are registered for this event
                                                </div>
                                                <button 
                                                    className="btn btn-outline-danger" 
                                                    onClick={handleUnregister}
                                                    disabled={registering}
                                                >
                                                    {registering ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                            Canceling...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="bi bi-x-circle me-2"></i>
                                                            Cancel Registration
                                                        </>
                                                    )}
                                                </button>
                                            </>
                                        ) : (
                                            <button 
                                                className="btn btn-primary btn-lg" 
                                                onClick={handleRegister}
                                                disabled={registering || !hasCapacity}
                                            >
                                                {registering ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                        Registering...
                                                    </>
                                                ) : !hasCapacity ? (
                                                    <>
                                                        <i className="bi bi-x-circle me-2"></i>
                                                        Event Full
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bi bi-calendar-plus me-2"></i>
                                                        Register for Event
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {!user && (
                                    <div className="alert alert-warning mt-3">
                                        <i className="bi bi-info-circle me-2"></i>
                                        Please <a href="/signin" className="alert-link">sign in</a> to register for this event
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Organization Info */}
                    <div className="col-lg-4">
                        {org && (
                            <div className={`card shadow-sm mb-3 ${styles.sidebarSticky}`}>
                                <div className="card-body">
                                    <h5 className="card-title mb-3">
                                        <i className="bi bi-building me-2"></i>
                                        Hosted by
                                    </h5>
                                    {org.logo_url && (
                                        <img 
                                            src={org.logo_url} 
                                            alt={org.name}
                                            className="img-fluid rounded mb-3"
                                            style={{ maxHeight: '120px', objectFit: 'contain' }}
                                        />
                                    )}
                                    <h6 className="mb-2">{org.name}</h6>
                                    {org.description && (
                                        <p className="text-muted small mb-3">{org.description}</p>
                                    )}
                                    {org.slug && (
                                        <a 
                                            href={`/org/${org.slug}`} 
                                            className="btn btn-primary btn-sm w-100"
                                        >
                                            <i className="bi bi-arrow-right-circle me-2"></i>
                                            View Organization
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Share Card */}
                        <div className="card shadow-sm">
                            <div className="card-body">
                                <h5 className="card-title mb-3">
                                    <i className="bi bi-share me-2"></i>
                                    Share this event
                                </h5>
                                <div className="d-grid gap-2">
                                    <button 
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={() => {
                                            navigator.clipboard.writeText(window.location.href)
                                                .then(() => setCopied(true))
                                                .catch(() => setCopied(true));
                                            setTimeout(() => setCopied(false), 2000);
                                        }}
                                    >
                                        <i className="bi bi-link-45deg me-2"></i>
                                        Copy Link
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {copied && (
                    <div className={styles.toast} role="status" aria-live="polite">
                        <i className="bi bi-check2-circle me-2"></i>
                        Link copied to clipboard
                    </div>
                )}
            </div>
        </div>
    );
}
