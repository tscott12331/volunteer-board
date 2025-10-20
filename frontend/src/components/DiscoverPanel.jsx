import styles from './DiscoverPanel.module.css';

import { useEffect, useState } from "react";
import { fetchEvents, registerForEvent } from "../util/api/events";
import EventCard from "./EventCard";
import EventInfoModal from "./EventInfoModal";

/*
    * Panel in the volunteer dashboard to view and register for available events
    * Users can filter by search, start date, and end date
    * props:
        * user?
            * Supabase Auth user object
            * Currently logged in user
*/
export default function DiscoverPanel({
    user
}) {
    // available events based on search and date filters
    const [events, setEvents] = useState([]);

    // filter states
    const [startDate, setStartDate] = useState(undefined);
    const [endDate, setEndDate] = useState(undefined);
    const [searchQuery, setSearchQuery] = useState(undefined);

    // search input state
    const  [searchValue, setSearchValue] = useState("");

    // the selected event will be displayed on the modal popup when
    // the more info button is selected
    const [selectedEvent, setSelectedEvent] = useState(undefined);
    // hash containing the ids of registered events
    const [registeredEvents, setRegisteredEvents] = useState({});

    // set date filter to proper date object when input is changed
    const onDateFilterChange = (e, setFilter) => {
        if(e.target.value.length > 0) {
            const split = e.target.value.split('-');
            const d = new Date(split[0], split[1] - 1, split[2]);
            setFilter(d);
        } else {
            setFilter(undefined);
        }
    }

    // update search input state value
    const onSearchInputChange = (e) => {
        setSearchValue(e.target.value);
    }

    // udpate search filter when user presses enter in the input
    const onSearchInputKeyDown = (e) => {
        if(e.key === "Enter") {
            search();
        }
    }

    // update search filter
    const search = () => {
        setSearchQuery(searchValue.length > 0 ? searchValue : undefined);
    }
    

    const handleRegistration = async (id) => {
        const res = await registerForEvent(id);
        if(res.success) {
            setRegisteredEvents((re) => ({...re, [id]: true}));
        }
    }

    useEffect(() => {
        // fetch events based on a search query, start date, and end date
        fetchEvents(startDate, endDate, user?.id).then(res => {
            if(res.success) {
                // set events on successful fetch
                setEvents(res.data);
            }
        })
    }, [user, startDate, endDate]);

    return (
            <>
            <h2 className="mb-4 fw-bold">Discover</h2>
            <div className="input-group">
                <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Search for events"
                    aria-label="Text input with segmented dropdown filter button"
                    value={searchValue}
                    onChange={onSearchInputChange}
                    onKeyDown={onSearchInputKeyDown}
                />
                <button className="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">Filter</button>
                <ul className="dropdown-menu">
                    <li>
                        <div className="dropdown-item d-flex gap-2 justify-content-between">
                            <label className="lh-lg text-body-emphasis" htmlFor="start-date">Start: </label>
                            <input 
                                id="start-date"
                                type="date" 
                                className="btn btn-outline-secondary" 
                                onChange={(e) => onDateFilterChange(e, setStartDate)}
                            />
                        </div>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                        <div className="dropdown-item d-flex gap-2 justify-content-between">
                            <label className="lh-lg text-body-emphasis" htmlFor="end-date">End: </label>
                            <input 
                                id="end-date"
                                type="date" 
                                className="btn btn-outline-secondary" 
                                onChange={(e) => onDateFilterChange(e, setEndDate)}
                            />
                        </div>
                    </li>
                </ul>
                <button type="button" className="btn btn-primary" onClick={search}>Search</button>
            </div>
            {
            events.length > 0 ?
            <div className={"d-grid gap-3 mt-4 " + styles.eventsWrappers}>
            {
                events.map(e =>
                <EventCard 
                event={e}
                onMoreInfo={(event) => setSelectedEvent(event)}
                onRegister={handleRegistration}
                isNewlyRegistered={registeredEvents[e.id] ?? false}
                key={e.id}
                />
                )
            }
            </div>
            :
            <p className="text-center mt-4">No events available</p>
            }
        <EventInfoModal 
            id="info-modal" 
            event={selectedEvent} 
            isNewlyRegistered={registeredEvents[selectedEvent?.id] ?? false}
            onRegister={handleRegistration}
        />
        </>
    );
}
