import { formatDateAtTime } from "../util/date";
import { useState } from 'react';

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
        * onView: (event) => void | undefined;
            * Called when more view button is pressed to display modal with 
            * this event    
*/
export default function RegisteredEventCard({
    event,
    onView,
    onUnregister,
}) {
    const [unregistering, setUnregistering] = useState(false);
    return (
        <div className="d-flex justify-content-between align-items-center px-3 py-2 bg-body-secondary shadow-sm rounded-3">
            <div>
                <h3 className="text-body-emphasis">{event.title}</h3>
                <p className="mb-0">{formatDateAtTime(new Date(event.start_at))}</p>
            </div>
            <div className="d-flex align-items-center gap-3">
                <a
                    role="button"
                    className="link-underline-opacity-75 link-offset-1"
                    onClick={() => onView?.(event)}
                    data-bs-toggle="modal"
                    data-bs-target="#register-info-modal"
                >
                    View
                </a>

                <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    disabled={unregistering}
                    onClick={async () => {
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
                    }}
                >
                    {unregistering ? 'Unregistering...' : 'Unregister'}
                </button>
            </div>
        </div>
    );
}
