import { formatDateAtTime } from "../util/date";
import { useState } from 'react';
import styles from './RegistrationsPanel.module.css';

/*
    * Card displaying basic information about an event
    * a user is registered for
    * props:
        * event: {
            * id: string
            * org_id: string
            * title: string
            * summary: string | null
            * description: string | null
            * location: {
                * lon: string
                * lat: string
            * } | null
            * start_at: string (timestamptz)
            * end_at: string (timestamptz)
            * status: "draft" | "published" | "cancelled" | "completed"
            * capacity: number
            * image_url: string | null
            * created_at: string (timestamptz)
            * updated_at: string (timestamptz)
        * } | null | undefined
        * organization: organization object or undefined
        * onView: (event) => void | undefined;
            * Called when more view button is pressed to display modal with 
            * this event
        * viewMode: 'grid' | 'list'
            * Display mode for the card
*/
export default function RegisteredEventCard({
    event,
    organization,
    onView,
    onUnregister,
    viewMode = 'list'
}) {
    const [unregistering, setUnregistering] = useState(false);
    
    const handleUnregister = async (e) => {
        e.stopPropagation();
        if (!onUnregister) return;
        setUnregistering(true);
        try {
            const res = onUnregister(event.id);
            if (res && typeof res.then === 'function') {
                await res;
            }
        } catch (err) {
            console.error('Failed to unregister', err);
        } finally {
            setUnregistering(false);
        }
    };

    if (viewMode === 'grid') {
        return (
            <div className={styles.eventCard} onClick={() => onView?.(event)}>
                {event.image_url && (
                    <div className={styles.eventCardImage}>
                        <img src={event.image_url} alt={event.title} />
                    </div>
                )}
                <div className={styles.eventCardBody}>
                    {organization && (
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem', 
                            marginBottom: '0.75rem',
                            paddingBottom: '0.75rem',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                        }}>
                            {organization.logo_url && (
                                <img 
                                    src={organization.logo_url} 
                                    alt={organization.name}
                                    style={{ 
                                        width: '24px', 
                                        height: '24px', 
                                        borderRadius: '50%',
                                        objectFit: 'cover'
                                    }}
                                />
                            )}
                            <span style={{ 
                                fontSize: '0.875rem', 
                                color: '#9ca3af',
                                fontWeight: 500
                            }}>
                                {organization.name}
                            </span>
                        </div>
                    )}
                    
                    <div className={styles.eventCardTitle}>{event.title}</div>
                    
                    {event.description && (
                        <div className={styles.eventCardDescription}>
                            {event.description.length > 120 
                                ? `${event.description.substring(0, 120)}...` 
                                : event.description
                            }
                        </div>
                    )}
                    
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '0.5rem',
                        marginTop: 'auto',
                        paddingTop: '1rem',
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9ca3af', fontSize: '0.875rem' }}>
                            <i className="bi bi-calendar-event"></i>
                            <span>{formatDateAtTime(new Date(event.start_at))}</span>
                        </div>
                        
                        {event.capacity && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9ca3af', fontSize: '0.875rem' }}>
                                <i className="bi bi-people"></i>
                                <span>Capacity: {event.capacity}</span>
                            </div>
                        )}

                        <button
                            onClick={handleUnregister}
                            disabled={unregistering}
                            style={{
                                marginTop: '0.5rem',
                                padding: '0.5rem 1rem',
                                background: 'transparent',
                                border: '1px solid rgba(220, 38, 38, 0.5)',
                                borderRadius: '8px',
                                color: '#f87171',
                                cursor: unregistering ? 'not-allowed' : 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                transition: 'all 0.2s ease',
                                opacity: unregistering ? 0.5 : 1
                            }}
                            onMouseEnter={(e) => {
                                if (!unregistering) {
                                    e.target.style.background = 'rgba(220, 38, 38, 0.1)';
                                    e.target.style.borderColor = 'rgba(220, 38, 38, 0.8)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!unregistering) {
                                    e.target.style.background = 'transparent';
                                    e.target.style.borderColor = 'rgba(220, 38, 38, 0.5)';
                                }
                            }}
                        >
                            {unregistering ? 'Unregistering...' : 'Unregister'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // List view
    return (
        <div className={styles.eventListItem}>
            <div className={styles.eventListContent}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    {organization && organization.logo_url && (
                        <img 
                            src={organization.logo_url} 
                            alt={organization.name}
                            style={{ 
                                width: '32px', 
                                height: '32px', 
                                borderRadius: '50%',
                                objectFit: 'cover'
                            }}
                        />
                    )}
                    <div style={{ flex: 1 }}>
                        <div className={styles.eventListTitle}>{event.title}</div>
                        {organization && (
                            <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                                {organization.name}
                            </div>
                        )}
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9ca3af', fontSize: '0.875rem' }}>
                        <i className="bi bi-calendar-event"></i>
                        <span>{formatDateAtTime(new Date(event.start_at))}</span>
                    </div>
                    {event.capacity && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9ca3af', fontSize: '0.875rem' }}>
                            <i className="bi bi-people"></i>
                            <span>Capacity: {event.capacity}</span>
                        </div>
                    )}
                </div>
            </div>
            
            <div className={styles.eventListActions}>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onView?.(event);
                    }}
                    data-bs-toggle="modal"
                    data-bs-target="#register-info-modal"
                    style={{
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                    }}
                >
                    View Details
                </button>
                <button
                    onClick={handleUnregister}
                    disabled={unregistering}
                    style={{
                        padding: '0.5rem 1rem',
                        background: 'transparent',
                        border: '1px solid rgba(220, 38, 38, 0.5)',
                        borderRadius: '8px',
                        color: '#f87171',
                        cursor: unregistering ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap',
                        opacity: unregistering ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                        if (!unregistering) {
                            e.target.style.background = 'rgba(220, 38, 38, 0.1)';
                            e.target.style.borderColor = 'rgba(220, 38, 38, 0.8)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!unregistering) {
                            e.target.style.background = 'transparent';
                            e.target.style.borderColor = 'rgba(220, 38, 38, 0.5)';
                        }
                    }}
                >
                    {unregistering ? 'Unregistering...' : 'Unregister'}
                </button>
            </div>
        </div>
    );
}
