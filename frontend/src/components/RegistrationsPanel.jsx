import { useState } from "react";
import EventInfoModal from "./EventInfoModal";
import RegisteredEventCard from "./RegisteredEventCard";

/*
    * Panel on the volunteer dashboard that displays the events a 
    * user is registered for
*/
export default function RegistrationsPanel() {
    // temp placeholder data
    const [events, setEvents] = useState([
        {
            "id": "06cd601a-bb40-4979-bbfa-684e141ab196",
            "org_id": "76d709c3-0502-4667-a6f4-3112d3b8e531",
            "title": "Central Park Cleanup",
            "summary": null,
            "description": "Come help clean up Central Park with us. Wake up bright and early and make a difference!",
            "location": null,
            "start_at": "2025-10-20T12:30:00+00:00",
            "end_at": "2025-10-20T16:30:00+00:00",
            "status": "published",
            "capacity": 30,
            "image_url": "/placeholder.svg",
            "created_at": "2025-10-19T05:31:38.753816+00:00",
            "updated_at": "2025-10-19T05:31:38.753816+00:00"
        },
    ]);

    // currently selected event that will be displayed on the event info modal
    const [selectedEvent, setSelectedEvent] = useState(undefined)

    return (
        <>
        <h2 className="mb-4 fw-bold">My Registrations</h2>
        {
        events.length > 0 ?
            <div className="d-flex flex-column gap-3 mt-4">
            {
            events.map(e =>
                <RegisteredEventCard 
                    event={e} 
                    onView={(e) => setSelectedEvent(e)}
                />
            )
            }
            </div>
        :
            <p>You have not registered for any events</p>
        }
        <EventInfoModal id="register-info-modal" event={selectedEvent}/>
        </>
        
    );
}
