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

    const startDate = new Date(event.start_at);
    const endDate = new Date(event.end_at);
    const isRegistered = event.is_registered;
    const hasCapacity = event.capacity > 0;

    return (
        <div className={styles.pageWrapper}>
            <div className="container py-4">
                {/* Back button */}
                <button className="btn btn-link text-decoration-none mb-3 ps-0" onClick={() => navigate(-1)}>
                    <i className="bi bi-arrow-left me-2"></i>
                    Back
                </button>

                <div className="row">
                    {/* Main Content */}
                    <div className="col-lg-8">
                        <div className="card shadow-sm">
                            {event.image_url && (
                                <img 
                                    src={event.image_url} 
                                    className="card-img-top" 
                                    alt={event.title}
                                    style={{ maxHeight: '400px', objectFit: 'cover' }}
                                />
                            )}
                            <div className="card-body">
                                <h1 className="card-title mb-3">{event.title}</h1>
                                
                                {/* Registration confirmation */}
                                {showConfirmation && (
                                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                                        <i className="bi bi-check-circle me-2"></i>
                                        You're registered! Check your email for confirmation.
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
                                    <ul className="list-unstyled">
                                        <li className="mb-2">
                                            <i className="bi bi-calendar-event text-primary me-2"></i>
                                            <strong>Starts:</strong> {formatDateAtTime(startDate)}
                                        </li>
                                        <li className="mb-2">
                                            <i className="bi bi-calendar-check text-primary me-2"></i>
                                            <strong>Ends:</strong> {formatDateAtTime(endDate)}
                                        </li>
                                        <li className="mb-2">
                                            <i className="bi bi-people text-primary me-2"></i>
                                            <strong>Spots remaining:</strong> {event.capacity}
                                        </li>
                                        {event.location && (
                                            <li className="mb-2">
                                                <i className="bi bi-geo-alt text-primary me-2"></i>
                                                <strong>Location:</strong> {event.location}
                                            </li>
                                        )}
                                    </ul>
                                </div>

                                {/* Registration Button */}
                                {user && (
                                    <div className="d-grid gap-2">
                                        {isRegistered ? (
                                            <>
                                                <div className="alert alert-info mb-2">
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
                            <div className="card shadow-sm mb-3">
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
                                            className="btn btn-outline-primary btn-sm w-100"
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
                                            navigator.clipboard.writeText(window.location.href);
                                            alert('Link copied to clipboard!');
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
            </div>
        </div>
    );
}
