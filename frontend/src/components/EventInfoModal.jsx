import { useEffect, useState } from "react";
import { fetchOrganization } from "../util/api/events";
import { DEFAULT_EVENT_IMAGE } from '../util/defaults';
import { formatDateAtTime } from "../util/date";

// Modal popup displaying more detailed information about an event
// Props:
// - id: string (modal DOM id)
// - event: event object
// - isNewlyRegistered: boolean
// - isRegistered: boolean
// - onRegister: function
export default function EventInfoModal({ id, event, isNewlyRegistered, isRegistered, onRegister }) {
    const start_at = event?.start_at ?? new Date();
    const startDate = new Date(start_at);
    const end_at = event?.end_at ?? new Date();
    const endDate = new Date(end_at);

    const [org, setOrg] = useState(undefined);

    useEffect(() => {
        if (!event?.org_id) return;
        fetchOrganization(event.org_id).then((res) => {
            if (res.success) setOrg(res.data);
        }).catch(() => {});
    }, [event?.org_id]);

    const registered = Boolean(event?.is_registered || isNewlyRegistered || isRegistered);

    return (
        <div className="modal fade" id={id} data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                {event ? (
                    <div className="modal-content">
                        <div className="modal-header">
                            <h1 className="modal-title fs-5" id="staticBackdropLabel">{event.title}</h1>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <img className="img-thumbnail mb-3" src={event.image_url || DEFAULT_EVENT_IMAGE} />
                            {event.description ? <p>{event.description}</p> : <p>This event has no description</p>}
                            {org && (
                                <p className="mb-1">
                                    <span className="text-body-emphasis">Posted by:</span>{' '}
                                    <a className="link-info" href={`/org/${org.slug}`}>{org.name}</a>
                                </p>
                            )}
                            <p className="mb-1"><span className="text-body-emphasis">Starts:</span> {formatDateAtTime(startDate)}</p>
                            <p className="mb-1"><span className="text-body-emphasis">Ends:</span> {formatDateAtTime(endDate)}</p>
                            <p className="mb-1"><span className="text-body-emphasis">Spots remaining:</span> {event.capacity}</p>
                        </div>
                        <div className="modal-footer d-flex flex-row-reverse justify-content-between gap-1">
                            <div>
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                {!registered && (
                                    <button type="button" className="btn btn-primary ms-2" onClick={() => onRegister?.(event.id)}>
                                        Register
                                    </button>
                                )}
                            </div>
                            {registered && <p className="m-0 d-inline-block text-secondary-emphasis">You are registered for this event</p>}
                        </div>
                    </div>
                ) : (
                    <p>Loading</p>
                )}
            </div>
        </div>
    );
}
