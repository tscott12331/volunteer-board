import { useEffect, useState } from "react";
import { fetchOrganization } from "../util/api/events";

export default function EventInfoModal({
    event,
}) {
    const start_at = event?.start_at ?? new Date();
    const startDate = new Date(start_at);
    const end_at = event?.end_at ?? new Date();
    const endDate = new Date(end_at);

    const [org, setOrg] = useState(undefined);

    const formatDate = (date) => {
        return `${date.toLocaleString(undefined, {
                    dateStyle: 'short'
                })} at ${date.getHours() % 12}:${date.getMinutes()} ${date.getHours() > 11 ? 'PM' : 'AM'}`
    }

    useEffect(() => {
        fetchOrganization(event?.org_id).then(res => {
            if(res.success) {
                setOrg(res.data);
            }
        });
    }, [event]);


    return (
        <div className="modal fade" id="info-modal" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
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
                <p className="mb-1"><span className="text-body-emphasis">Starts:</span> {formatDate(startDate)}</p>
                <p className="mb-1"><span className="text-body-emphasis">Ends:</span> {formatDate(endDate)}</p>
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
