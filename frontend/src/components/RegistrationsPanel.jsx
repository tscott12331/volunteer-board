import { useEffect, useState } from "react";
import EventInfoModal from "./EventInfoModal";
import RegisteredEventCard from "./RegisteredEventCard";
import { fetchRegisteredEvents } from "../util/api/events";

/*
    * Panel on the volunteer dashboard that displays the events a 
    * user is registered for
    * props:
        * user?
            * Supabase Auth user object
            * Currently logged in user
*/
export default function RegistrationsPanel({
    user,
}) {
    // events the user is registered to
    const [events, setEvents] = useState([]);

    // currently selected event that will be displayed on the event info modal
    const [selectedEvent, setSelectedEvent] = useState(undefined)
    
    useEffect(() => {
        // fetch a events that a user is registered to
        fetchRegisteredEvents(user.id).then(res => {
            if(res.success) {
                // set events on fetch success
                setEvents(res.data);
            }
        })
    }, []);

    return (
        <>
        <h2 className="mb-4 fw-bold">My Registrations</h2>
        {
        events.length > 0 ?
            <div className="d-flex flex-column gap-3 mt-4">
            {
            events.map(e =>
                <RegisteredEventCard 
                    key={e.id}
                    event={e} 
                    onView={(e) => setSelectedEvent(e)}
                />
            )
            }
            </div>
        :
            <p className="mt-4">You have not registered for any events</p>
        }
        <EventInfoModal id="register-info-modal" event={selectedEvent} isRegistered={true} />
        </>
        
    );
}
