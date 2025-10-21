import styles from './DiscoverPanel.module.css';

import { useEffect, useState } from "react";
import { fetchEvents, registerForEvent, fetchOrganization } from "../util/api/events";
import { formatDateAtTime } from '../util/date';

/*
    * Panel in the volunteer dashboard to view and register for available events
    * Users can filter by search, start date, and end date
    * props:
        * user?
            * Supabase Auth user object
            * Currently logged in user
*/
export default function DiscoverPanel({ user }) {
    // available events based on search and date filters
    const [events, setEvents] = useState([]);

    // filter states
    const [startDate, setStartDate] = useState(undefined);
    const [endDate, setEndDate] = useState(undefined);
    const [searchQuery, setSearchQuery] = useState(undefined);

    // search input state
    const  [searchValue, setSearchValue] = useState("");

    // the selected event will be displayed in the detail panel on the right
    const [selectedEvent, setSelectedEvent] = useState(undefined);
    const [selectedOrg, setSelectedOrg] = useState(undefined);
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

    const filterEventBySearch = (e, query) => {
        if(!query) return true;
        return e.title.toLowerCase().includes(query.toLowerCase());
    }
    

    const handleRegistration = async (id) => {
        const res = await registerForEvent(id);
        if(res.success) {
            setRegisteredEvents((re) => ({...re, [id]: true}));
            // notify other parts of the app (e.g., RegistrationsPanel) to refresh
            try {
                window.dispatchEvent(new CustomEvent('registration:changed', { detail: { eventId: id, action: 'registered' } }));
            } catch (e) {
                // ignore if window not available
            }
        }
        return res;
    }

    useEffect(() => {
        // fetch events based on a search query, start date, and end date
        fetchEvents(startDate, endDate, user?.id).then(res => {
            if(res.success) {
                // debug: log raw events to confirm `location` is returned
                console.log('DiscoverPanel fetched events:', res.data);
                // set events on successful fetch
                setEvents(res.data);
            }
        })
    }, [user, startDate, endDate]);

    // auto-select the first visible event when events or the search filter change
    useEffect(() => {
        const visible = events.filter(e => filterEventBySearch(e, searchQuery));
        if (visible.length === 0) {
            setSelectedEvent(undefined);
            return;
        }
        // keep existing selection if it's still visible, otherwise select the first one
        setSelectedEvent(prev => {
            if (prev && visible.some(v => v.id === prev.id)) return prev;
            return visible[0];
        });
    }, [events, searchQuery]);

    useEffect(() => {
        if (!selectedEvent?.org_id) {
            setSelectedOrg(undefined);
            return;
        }
        fetchOrganization(selectedEvent.org_id).then(res => {
            if (res.success) setSelectedOrg(res.data);
            else setSelectedOrg(undefined);
        }).catch(() => setSelectedOrg(undefined));
    }, [selectedEvent?.org_id]);

    const hoursBetween = (startAt, endAt) => {
        try {
            const s = new Date(startAt);
            const e = new Date(endAt);
            const ms = Math.max(0, e - s);
            const hours = ms / (1000 * 60 * 60);
            return Math.round(hours * 100) / 100;
        } catch {
            return 0;
        }
    }

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
            <div className={"row mt-4 " + styles.eventsWrappers}>
                <div className="col-md-4">
                    <div className="list-group">
                        {events.filter(e => filterEventBySearch(e, searchQuery)).map(e => (
                            <button
                                key={e.id}
                                type="button"
                                className={"list-group-item list-group-item-action " + (selectedEvent?.id === e.id ? 'active' : '')}
                                onClick={() => setSelectedEvent(e)}
                            >
                                <div className="d-flex w-100 justify-content-between">
                                    <h6 className="mb-1">{e.title}</h6>
                                    <small>{new Date(e.start_at).toLocaleDateString()}</small>
                                </div>
                                <small className="text-muted">{hoursBetween(e.start_at, e.end_at)} hrs</small>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="col-md-8">
                    {selectedEvent ? (
                        <div className={"card p-3 shadow-sm " + styles.detailCard}>
                            <div className="d-flex gap-3 align-items-center mb-2">
                                {selectedOrg?.logo_url || selectedOrg?.image_url ? (
                                    <img src={selectedOrg.logo_url || selectedOrg.image_url} alt={selectedOrg?.name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} />
                                ) : null}
                                <div>
                                    <div className="text-body-emphasis">{selectedOrg?.name}</div>
                                    <h4 className="mb-0">{selectedEvent.title}</h4>
                                </div>
                            </div>
                            {selectedEvent.image_url && (
                                <img src={selectedEvent.image_url} alt={selectedEvent.title} className="img-fluid mb-3" />
                            )}
                            <p>{selectedEvent.description}</p>
                            <p className="mb-1"><strong>Location:</strong> {typeof selectedEvent.location === 'string' ? selectedEvent.location : (selectedEvent.location?.city || selectedEvent.location?.name || `${selectedEvent.location?.lat}, ${selectedEvent.location?.lon}`)}</p>
                            <p className="mb-1"><strong>Date & time:</strong> {new Date(selectedEvent.start_at).toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                            <p className="mb-1"><strong>Capacity:</strong> {selectedEvent.capacity}</p>
                            <div className="d-flex gap-2 mt-3">
                                <button className="btn btn-primary" onClick={() => handleRegistration(selectedEvent.id)}>Register</button>
                                <button className="btn btn-outline-secondary" onClick={() => setSelectedEvent(undefined)}>Clear</button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-muted">Select an event to see details</p>
                    )}
                </div>
            </div>
            :
            <p className="text-center mt-4">No events available</p>
            }
        {/* <EventInfoModal 
            id="info-modal" 
            event={selectedEvent} 
            isNewlyRegistered={registeredEvents[selectedEvent?.id] ?? false}
            onRegister={handleRegistration}
        /> */}
        </>
    );
}
