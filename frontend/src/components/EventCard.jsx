import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerForEvent, fetchOrganization } from '../util/api/events';
import { supabase } from '../util/api/supabaseClient';
import styles from './EventCard.module.css';

// Card displaying basic info for an event in Discover Panel
/*
    * Card displaying basic info for an event
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
            * is_registered
        * } | null | undefined
            * Information about the event
        * isNewlyRegistered: boolean
            * Whether the user has just registered for the event or not
        * onMoreInfo: (event) => any | undefined;
            * Called when more info button is pressed
        * onRegister: (id) => any | undefined;
            * Called when register button is clicked
            * Handles registration logic
*/
export default function EventCard({
    event,
    isNewlyRegistered,
    onMoreInfo,
    onRegister,
}) {
    const { title, description, image_url, start_at } = event
    const startDate = new Date(start_at);
    const [showRegister, setShowRegister] = useState(true);
    const navigate = useNavigate();
    const [orgName, setOrgName] = useState('');

    const handleRegister = async () => {
        // check user session, if not signed in, navigate to sign in page
        let session = null;
        try {
            const result = await supabase.auth.getSession();
            // handle different shapes
            session = result?.data?.session ?? result?.session ?? null;
        } catch (err) {
            session = null;
        }
        if (!session?.user) {
            // try react-router navigation first, fallback to window.location
            try {
                navigate('/signin');
                return;
            } catch (e) {
                window.location.href = '/signin';
                return;
            }
        }

        // optimistic hide
        setShowRegister(false);
        try {
            // prefer parent handler if provided
            const result = onRegister?.(event.id) ?? registerForEvent(event.id);
            if (result && typeof result.then === 'function') {
                await result;
            }
        } catch (err) {
            // restore button on failure
            setShowRegister(true);
            console.error('Registration failed', err);
        }
    };

    const formatTime = (time) => {
        const [value, md] = time.split(' ');
        const newValue = value.slice(0, -3);
        return `${newValue} ${md}`;
    }

    useEffect(() => {
        // fetch organization name for display
        if (!event?.org_id) return;
        fetchOrganization(event.org_id).then(res => {
            if (res.success && res.data) setOrgName(res.data.name || '');
        }).catch(() => {});
    }, [event?.org_id]);
    
    // debug log
    useEffect(() => {
        console.log('EventCard received event:', event);
    }, [event]);

    const hoursBetween = (startAt, endAt) => {
        try {
            const s = new Date(startAt);
            const e = new Date(endAt);
            const ms = Math.max(0, e - s);
            const hours = ms / (1000 * 60 * 60);
            return Math.round(hours * 100) / 100; // 2 decimals
        } catch {
            return 0;
        }
    }

    return (
        <div className='EventCard-component'>
            <div className={"card " + styles.openingCard}>
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0">{title}</h5>
                    <div>
                        {showRegister && !(event.is_registered || isNewlyRegistered) ? (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleRegister}
                            >
                                Register
                            </button>
                        ) : (
                            <p className="m-0 d-inline-block text-secondary-emphasis">You are registered for this event</p>
                        )}
                    </div>
                </div>
                {image_url &&
                <img src={image_url} className={"text-center card-img-top " + styles.cardImg} alt="Project photos" />
                }
                <div className="card-body">
                    <p className="mb-1"><span className="text-body-emphasis">Organization:</span> {orgName}</p>
                    <p className="card-text">{description}</p>
                    {/* event location not yet implemented in DB */}
                    {event.location && (
                        <p className="mb-1"><span className="text-body-emphasis"><i className="fa-solid fa-location-dot"></i></span> {typeof event.location === 'string' ? event.location : (event.location?.name || `${event.location?.lat}, ${event.location?.lon}`)}</p>
                    )}
                    <p className="mb-1"><span className="text-body-emphasis"><i className="fa-solid fa-clock"></i></span> {hoursBetween(event.start_at, event.end_at)} Hours</p>
                    
                </div>
                <div className="card-footer d-flex justify-content-between">
                    <span><i className="fa-solid fa-calendar-days"></i> {startDate.toLocaleDateString()}</span>
                    <span>{formatTime(startDate.toLocaleTimeString())}</span>
                </div>
            </div>
        </div>
    )
}
