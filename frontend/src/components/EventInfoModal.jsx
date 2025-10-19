import { useEffect, useState } from "react";
import { fetchOrganization } from "../util/api/events";
import { formatDateAtTime } from "../util/date";

/*
    * Modal popup displaying more detailed information about an event
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
            * Information about the event
*/
export default function EventInfoModal({
    id,
    event,
}) {
    // convert date strings into date objects
    const start_at = event?.start_at ?? new Date();
    const startDate = new Date(start_at);
    const end_at = event?.end_at ?? new Date();
    const endDate = new Date(end_at);

    // holds organization data after it is fetched
    const [org, setOrg] = useState(undefined);

    useEffect(() => {
        // fetch organization on event change
        fetchOrganization(event?.org_id).then(res => {
            if(res.success) {
                // set organization on successful fetch
                setOrg(res.data);
            }
        });
    }, [event]);


    return (
        <div className="modal fade" id={id} data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
          <div 
              className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
          >
            {event ?
            <div className="modal-content">
              <div className="modal-header">
                <h1 className="modal-title fs-5" id="staticBackdropLabel">{event.title}</h1>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                {event.image_url &&
                <img className="img-thumbnail mb-3" src={event.image_url} />
                }
                {event.description ?
                <p>{event.description}</p>
                :
                <p>This event has no description</p>
                }
                {org &&
                    <p className="mb-1"><span className="text-body-emphasis">Posted by:</span> <a className="link-info" href={`/org/${org.slug}`}>{org.name}</a></p>
                }
                <p className="mb-1"><span className="text-body-emphasis">Starts:</span> {formatDateAtTime(startDate)}</p>
                <p className="mb-1"><span className="text-body-emphasis">Ends:</span> {formatDateAtTime(endDate)}</p>
                <p className="mb-1"><span className="text-body-emphasis">Volunteer capacity:</span> {event.capacity}</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" className="btn btn-primary">Register</button>
              </div>
            </div>
            :
            <p>Loading</p>
            }
          </div>
        </div>
    )
}
